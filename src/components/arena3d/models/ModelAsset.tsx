import { useRef, useMemo, Component, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MODEL_REGISTRY, getModelConfig } from './ModelRegistry'
import { MATERIAL_CONFIG, PALETTE } from '../colors'
import { resolveAssetUrl } from './resolveAssetUrl'

// === 缓存（B2：缓存治理，key 包含 BASE_URL，避免 basename 污染；FIFO 限制 <=50 条目） ===
const CACHE_KEY_PREFIX: string = (() => {
  try {
    const base = String((import.meta as any).env?.BASE_URL || '/')
    return `cache::${base}::`
  } catch {
    return 'cache::/::'
  }
})()

const MODEL_TEXTURE_CACHE = new Map<string, Promise<any>>()
const MODEL_CACHE_FIFO_KEYS: string[] = []
const MODEL_CACHE_MAX_ENTRIES = 50
const MODEL_CACHE_PRUNE_COUNT = 20

function evictCacheIfNeeded() {
  if (MODEL_TEXTURE_CACHE.size <= MODEL_CACHE_MAX_ENTRIES) return
  let pruned = 0
  while (MODEL_CACHE_FIFO_KEYS.length > 0 && pruned < MODEL_CACHE_PRUNE_COUNT) {
    const oldestKey = MODEL_CACHE_FIFO_KEYS.shift()
    if (!oldestKey) break
    if (MODEL_TEXTURE_CACHE.has(oldestKey)) {
      MODEL_TEXTURE_CACHE.delete(oldestKey)
      pruned++
    }
  }
}

// === 失败可观测（A1：防抖 30s，只在 DEV 打 warn；PROD 不污染用户控制台） ===
const WARN_COOLDOWN_MS = 30_000
const lastWarnAtByPath = new Map<string, number>()
const IS_DEV = !!(import.meta as any).env?.DEV

function _rateLimitedWarn(modelId: string, path: string, message: string, err?: unknown) {
  const now = Date.now()
  const last = lastWarnAtByPath.get(path) || 0
  if (now - last < WARN_COOLDOWN_MS) return
  lastWarnAtByPath.set(path, now)
  if (!IS_DEV) return // PROD 静默 fallback，不在控制台打 warn
  const msg = err instanceof Error ? err.message : String(err || '')
  console.warn(
    `[ModelAsset] loadGLTF failed → falling back to procedural geometry`,
    `modelId=${modelId}`,
    `path=${path}`,
    `reason=${message}`,
    msg ? `detail=${msg}` : '',
  )
}

// === 加载进度计数器（B1：全局单例 + 简易发布订阅；Scene3D 可订阅显示 N/M） ===
export interface ModelLoadStats {
  total: number
  loaded: number
  failed: number
  inflight: number
  /** 失败的 modelId 列表（仅开发期辅助，PROD 可能为空） */
  failedIds: string[]
}
type ModelLoadSubscriber = (s: Readonly<ModelLoadStats>) => void
const loadSubscribers = new Set<ModelLoadSubscriber>()
let loadStats: ModelLoadStats = { total: 0, loaded: 0, failed: 0, inflight: 0, failedIds: [] }

function cloneStats(): Readonly<ModelLoadStats> {
  return { ...loadStats, failedIds: loadStats.failedIds.slice() }
}
function publishStats() {
  const snap = cloneStats()
  loadSubscribers.forEach((fn) => {
    try { fn(snap) } catch { /* ignore subscriber errors */ }
  })
}
export function getModelLoadStats(): Readonly<ModelLoadStats> { return cloneStats() }
export function subscribeModelLoad(fn: ModelLoadSubscriber): () => void {
  loadSubscribers.add(fn)
  try { fn(cloneStats()) } catch { /* ignore */ }
  return () => { loadSubscribers.delete(fn) }
}
function statsIncLoadStart() {
  loadStats.total++
  loadStats.inflight++
  publishStats()
}
function statsIncLoadDone(ok: boolean, modelId: string) {
  if (ok) loadStats.loaded++
  else { loadStats.failed++; loadStats.failedIds.push(modelId) }
  loadStats.inflight = Math.max(0, loadStats.inflight - 1)
  publishStats()
}
export function resetModelLoadStats() {
  loadStats = { total: 0, loaded: 0, failed: 0, inflight: 0, failedIds: [] }
  publishStats()
}

/**
 * 全局静默 GLTFLoader 纹理加载错误。
 * 本项目下载的第三方 GLB 内部引用了 Textures/colormap.png 等外部纹理，但我们
 * 从未附带这些纹理资源。GLTFLoader 的 ImageLoader 失败后会通过 console.error
 * 打出 "THREE.GLTFLoader: Couldn't load texture XXXX"，大量并发错误 + 失败请求
 * 会让浏览器误判 WebGL 上下文有风险从而打 Context Lost info。
 *
 * 这里在模块加载时就对 console.error 加一层轻量过滤：只吞掉 GLTFLoader 纹理
 * 相关的 error，其它任何错误正常输出不影响真实 bug 排查。
 */
(() => {
  const orig = console.error.bind(console)
  const GLTF_TEX_ERR = /GLTFLoader.*Couldn't load texture/i
  // 只 patch 一次（热更新时这个模块会被重复执行），避免套娃。
  if ((console.error as any)._gltfTextureSilenced) return
  const next = function gltfSilentError(...args: any[]) {
    const first = String(args?.[0] ?? '')
    if (GLTF_TEX_ERR.test(first)) return
    orig(...args)
  } as any
  next._gltfTextureSilenced = true
  console.error = next
})()

/**
 * 遍历 GLTF scene，剥离所有材质的纹理引用并 dispose。
 * 原因：本项目未附带任何 GLB 外部纹理（Textures/*.png 等），
 * GLTFLoader 会在 parse 后异步调用 TextureLoader 拉取这些纹理并打印
 * console.error，进而可能触发 WebGL context 的警告/丢失。
 * 直接在 parse 完成后立即把所有 texture map 置 null 并 dispose，
 * 可以从根源避免网络请求 + 控制台报错。
 */
function stripAllTextures(scene: THREE.Object3D) {
  try {
    scene.traverse((child) => {
      try {
        if (!(child instanceof THREE.Mesh)) return
        const mats = Array.isArray(child.material) ? child.material : [child.material]
        mats.forEach((mat) => {
          try {
            if (!mat) return
            const matAny = mat as any
            const textureKeys = [
              'map', 'emissiveMap', 'normalMap', 'roughnessMap', 'metalnessMap',
              'aoMap', 'bumpMap', 'displacementMap', 'envMap', 'lightMap',
              'alphaMap', 'specularMap', 'clearcoatMap', 'clearcoatNormalMap',
              'clearcoatRoughnessMap', 'transmissionMap', 'thicknessMap',
              'sheenColorMap', 'sheenRoughnessMap', 'iridescenceMap',
              'iridescenceThicknessMap', 'specularIntensityMap', 'specularColorMap',
            ]
            textureKeys.forEach((k) => {
              const tex = matAny[k]
              if (tex && typeof tex.dispose === 'function') {
                try { tex.dispose() } catch { /* ignore */ }
              }
              matAny[k] = null
            })
            if (typeof (mat as any).needsUpdate === 'boolean') {
              (mat as any).needsUpdate = true
            }
          } catch { /* ignore per-material */ }
        })
      } catch { /* ignore per-child */ }
    })
  } catch { /* ignore traverse */ }
}

/**
 * 判断 URL 是否是「本项目不存在的纹理请求」。
 * - 绝对/内联 URL（data/blob/http/file）放过；
 * - GLB/GLTF/BIN 二进制放过；
 * - 其余（特别是 GLB 内部引用的 Textures/colormap.png）一律拦截。
 */
function shouldStubTextureUrl(url: string) {
  if (!url) return true
  if (/^(data:|blob:|https?:|file:)/i.test(url)) return false
  if (/\.(glb|gltf|bin)$/i.test(url)) return false
  return true
}

/**
 * 加载 GLTF / GLB：先用 fetch 拿到 ArrayBuffer，再交给 GLTFLoader.parse。
 *
 * 缓存策略（B2）：
 *  - key = CACHE_KEY_PREFIX + path（按 BASE_URL 隔离）
 *  - FIFO，>50 条清理最旧 20 条
 *  - set/delete 收敛在一处 finally，不会分散 3 处
 *  - 失败自动清理缓存，成功不删（热更新后若 GLB 替换，请刷新浏览器）
 */
function loadGLTF(path: string): Promise<any> {
  const cacheKey = CACHE_KEY_PREFIX + path
  if (MODEL_TEXTURE_CACHE.has(cacheKey)) return MODEL_TEXTURE_CACHE.get(cacheKey)!
  const PIXEL_1x1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsBacYAAAAASUVORK5CYII='

  const manager = new THREE.LoadingManager()
  manager.setURLModifier((url) => {
    const u = String(url || '')
    if (shouldStubTextureUrl(u)) return PIXEL_1x1
    return url
  })
  const loader = new GLTFLoader(manager)

  let settled = false
  const promise = Promise.resolve().then(async () => {
    let buffer: ArrayBuffer
    try {
      const res = await fetch(path, {
        method: 'GET',
        credentials: 'same-origin',
      } as any)
      if (!res || !res.ok) {
        throw new Error(`HTTP ${res?.status ?? 'unknown'}`)
      }
      const ct = res.headers?.get?.('content-type') || ''
      if (/html/i.test(ct)) {
        throw new Error('asset served as HTML (probably SPA fallback)')
      }
      buffer = await res.arrayBuffer()
    } catch (e) {
      throw e
    }
    return new Promise<any>((resolve, reject) => {
      try {
        loader.parse(buffer as any, '', (gltf: any) => {
          try { if (gltf && gltf.scene) stripAllTextures(gltf.scene) } catch { /* ignore */ }
          resolve(gltf)
        }, reject)
      } catch (e) {
        reject(e)
      }
    })
  }).finally(() => {
    settled = true
  })

  // 收敛 set/delete：失败才删，成功保留；避免 3 处重复逻辑
  promise.then(
    () => { /* success: 保留缓存 */ },
    () => { MODEL_TEXTURE_CACHE.delete(cacheKey); const idx = MODEL_CACHE_FIFO_KEYS.indexOf(cacheKey); if (idx >= 0) MODEL_CACHE_FIFO_KEYS.splice(idx, 1) },
  )

  MODEL_TEXTURE_CACHE.set(cacheKey, promise)
  MODEL_CACHE_FIFO_KEYS.push(cacheKey)
  evictCacheIfNeeded()

  // 防悬挂：极端情况下（fetch 被中止且 promise 永不 settle），5 分钟后重试
  setTimeout(() => {
    if (!settled && MODEL_TEXTURE_CACHE.get(cacheKey) === promise) {
      MODEL_TEXTURE_CACHE.delete(cacheKey)
      const idx = MODEL_CACHE_FIFO_KEYS.indexOf(cacheKey)
      if (idx >= 0) MODEL_CACHE_FIFO_KEYS.splice(idx, 1)
    }
  }, 5 * 60_000).unref?.()

  return promise
}

interface ModelAssetProps {
  modelId: string
  color?: string
  hovered?: boolean
  selected?: boolean
  interactable?: boolean
  target?: boolean
  children?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

class ModelErrorBoundary extends Component<
  { fallback: React.ComponentType<any>; modelId: string; color?: string; hovered?: boolean; selected?: boolean; children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { fallback: React.ComponentType<any>; modelId: string; color?: string; hovered?: boolean; selected?: boolean; children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.warn(`ModelAsset load error for ${this.props.modelId}:`, error)
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback
      return (
        <FallbackColorizer
          modelId={this.props.modelId}
          color={this.props.color}
          hovered={this.props.hovered}
          selected={this.props.selected}
        >
          <FallbackComponent />
        </FallbackColorizer>
      )
    }
    return this.props.children
  }
}

const FALLBACK_COLORS: Record<string, { primary: string; secondary: string; accent: string }> = {
  key: { primary: '#f59e0b', secondary: '#d97706', accent: '#fbbf24' },
  phone: { primary: '#374151', secondary: '#1f2937', accent: '#10b981' },
  umbrella: { primary: '#ef4444', secondary: '#dc2626', accent: '#fca5a5' },
  milk_carton: { primary: '#fef9c3', secondary: '#fef08a', accent: '#4f46e5' },
  cereal_box: { primary: '#fbbf24', secondary: '#f59e0b', accent: '#fef3c7' },
  cup: { primary: '#f87171', secondary: '#ef4444', accent: '#fecaca' },
  bowl: { primary: '#9ca3af', secondary: '#6b7280', accent: '#d1d5db' },
  plate: { primary: '#fef3c7', secondary: '#fde68a', accent: '#fffbeb' },
  remote: { primary: '#6b7280', secondary: '#4b5563', accent: '#9ca3af' },
  cloth_white: { primary: '#fef3c7', secondary: '#fde68a', accent: '#fffbeb' },
  cloth_dark: { primary: '#6b21a8', secondary: '#581c87', accent: '#9333ea' },
  towel: { primary: '#3b82f6', secondary: '#2563eb', accent: '#93c5fd' },
  trash: { primary: '#78350f', secondary: '#451a03', accent: '#92400e' },
  fridge: { primary: '#e5e7eb', secondary: '#d1d5db', accent: '#f3f4f6' },
  cabinet: { primary: '#8b7355', secondary: '#6b5a47', accent: '#a89070' },
  sink: { primary: '#d1d5db', secondary: '#9ca3af', accent: '#e5e7eb' },
  dishwasher: { primary: '#9ca3af', secondary: '#6b7280', accent: '#d1d5db' },
  sofa: { primary: '#a8a29e', secondary: '#78716c', accent: '#d6d3d1' },
  coffee_table: { primary: '#8b7355', secondary: '#6b5a47', accent: '#a89070' },
  bed: { primary: '#fef3c7', secondary: '#fde68a', accent: '#fffbeb' },
  desk: { primary: '#8b7355', secondary: '#6b5a47', accent: '#a89070' },
  laundry_basket: { primary: '#a89070', secondary: '#8b7355', accent: '#c4b89a' },
  entrance_tray: { primary: '#8b7355', secondary: '#6b5a47', accent: '#d4a574' },
  lamp: { primary: '#654321', secondary: '#4a3015', accent: '#fef3c7' },
  plant: { primary: '#6b8e23', secondary: '#556b2f', accent: '#9acd32' },
  rug: { primary: '#b8860b', secondary: '#8b6914', accent: '#daa520' },
  pillow: { primary: '#fbcfe8', secondary: '#f9a8d4', accent: '#fce7f3' },
  shoes: { primary: '#654321', secondary: '#4a3015', accent: '#8b5a2b' },
  hook: { primary: '#9ca3af', secondary: '#6b7280', accent: '#d1d5db' },
}

function getFallbackColors(modelId: string) {
  return FALLBACK_COLORS[modelId] || { primary: '#a8a29e', secondary: '#78716c', accent: '#d6d3d1' }
}

export function FallbackColorizer({ modelId, color, hovered, selected, children }: {
  modelId: string
  color?: string
  hovered?: boolean
  selected?: boolean
  children: ReactNode
}) {
  const groupRef = useRef<THREE.Group>(null)
  const timeRef = useRef(0)
  const config = getModelConfig(modelId)
  const colors = getFallbackColors(modelId)

  useFrame((_, delta) => {
    timeRef.current += delta

    if (!groupRef.current) return

    const highlightColor = config?.highlightColor ?? PALETTE.target.primary
    const materialType = config?.materialType ?? 'plastic'
    const matConfig = MATERIAL_CONFIG[materialType] ?? MATERIAL_CONFIG.plastic

    let meshIndex = 0
    // 默认开启着色兜底：只要有任何一个 mesh 没被标记为已着色，就强制过一遍着色流程。
    // 即便下面遍历因 material 异常抛错，外层 catch 也会保留 needsColorize=true，
    // 避免因个别 fallback 漏写 material 导致整组 mesh 永久全透明。
    let needsColorize = true

    try {
      groupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const hasMaterial = !!child.material && (
            child.material instanceof THREE.MeshStandardMaterial ||
            Array.isArray(child.material)
          )
          const isStandard = hasMaterial && child.material instanceof THREE.MeshStandardMaterial
          const alreadyColored = isStandard && !!(child.material as any)._fallbackColored

          // 只要有一个 mesh 缺材质或尚未上色，就标记为需要着色。
          if (!hasMaterial || !isStandard || !alreadyColored) {
            needsColorize = true
          }
          meshIndex++
        }
      })
    } catch {
      // 遍历时的任何异常都保留 needsColorize=true，走下段兜底着色。
      needsColorize = true
    }

    if (needsColorize) {
      meshIndex = 0
      try {
        groupRef.current.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return

          child.castShadow = config?.castShadow ?? true
          child.receiveShadow = config?.receiveShadow ?? false

          let meshColor: string
          if (color) {
            meshColor = color
          } else {
            const colorOptions = [colors.primary, colors.secondary, colors.accent]
            meshColor = colorOptions[meshIndex % colorOptions.length]
          }

          const hasStandard = child.material instanceof THREE.MeshStandardMaterial

          if (hasStandard) {
            const mat = child.material as THREE.MeshStandardMaterial
            try { mat.color.set(meshColor) } catch { /* ignore */ }
            mat.roughness = matConfig.roughness
            mat.metalness = matConfig.metalness
            if (matConfig.emissive) {
              try { mat.emissive.set(matConfig.emissive) } catch { /* ignore */ }
              mat.emissiveIntensity = matConfig.emissiveIntensity || 0
            }
            ;(mat as any)._fallbackColored = true
          } else {
            // 不管 child.material 是 null、其它材质类型、还是数组，
            // 一律创建一个标准的 MeshStandardMaterial 赋值上去，保证可见。
            const newMat = new THREE.MeshStandardMaterial({
              color: meshColor,
              roughness: matConfig.roughness,
              metalness: matConfig.metalness,
              flatShading: true,
            })
            if (matConfig.emissive) {
              try { newMat.emissive.set(matConfig.emissive) } catch { /* ignore */ }
              newMat.emissiveIntensity = matConfig.emissiveIntensity || 0
            }
            ;(newMat as any)._fallbackColored = true
            // 丢弃旧材质（若有）避免显存泄漏
            try {
              const old = child.material as any
              if (Array.isArray(old)) old.forEach((m: any) => m?.dispose?.())
              else old?.dispose?.()
            } catch { /* ignore */ }
            child.material = newMat
          }

          meshIndex++
        })
      } catch {
        /* ignore traverse / material errors to avoid WebGL crash */
      }
    }

    try {
      groupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          if (selected) {
            try { child.material.emissive.set(highlightColor) } catch { /* ignore */ }
            child.material.emissiveIntensity = 0.6
          } else if (hovered) {
            try { child.material.emissive.set(highlightColor) } catch { /* ignore */ }
            child.material.emissiveIntensity = 0.3
          } else {
            try { child.material.emissive.set(matConfig.emissive || '#000000') } catch { /* ignore */ }
            child.material.emissiveIntensity = matConfig.emissiveIntensity || 0
          }
        }
      })
    } catch {
      /* ignore traverse errors to protect WebGL context */
    }
  })

  return <group ref={groupRef}>{children}</group>
}

function ModelContent({
  modelId,
  color,
  hovered,
  selected,
  interactable,
  target,
  children,
}: ModelAssetProps) {
  const config = getModelConfig(modelId)
  const groupRef = useRef<THREE.Group>(null)
  const timeRef = useRef(0)

  const fallbackComponent = config?.fallback || MODEL_REGISTRY.key.fallback
  const rawModelPath = config?.path || MODEL_REGISTRY.key.path
  const modelPath = resolveAssetUrl(rawModelPath)

  const assetAvailable = config?.assetAvailable !== false && !!rawModelPath && !!modelPath

  const [gltf, setGltf] = useState<any>(null)

  useEffect(() => {
    let cancelled = false
    let statsCounted = false
    let accountedDone = false
    setGltf(null)
    if (!assetAvailable) {
      return () => { cancelled = true }
    }

    statsIncLoadStart()
    statsCounted = true

    let settled = false
    const markDone = (ok: boolean) => {
      if (accountedDone) return
      accountedDone = true
      statsIncLoadDone(ok, modelId)
    }

    loadGLTF(modelPath)
      .then((g) => {
        if (cancelled) return
        setGltf(g)
        settled = true
        markDone(true)
      })
      .catch((err) => {
        if (cancelled) return
        settled = true
        markDone(false)
        const msg =
          err instanceof Error ? err.message :
          typeof err === 'string' ? err :
          'unknown'
        _rateLimitedWarn(modelId, modelPath, msg, err)
      })

    // 保险：30s 未 settle 按超时计入失败（不中止 fetch，避免 double-count）
    const to = setTimeout(() => {
      if (cancelled || settled || !statsCounted) return
      markDone(false)
      _rateLimitedWarn(modelId, modelPath, 'timeout(>30s)', new Error('ModelAsset loading timeout'))
    }, 30_000)

    return () => {
      cancelled = true
      clearTimeout(to)
    }
  }, [modelPath, assetAvailable, modelId])

  const scene = gltf?.scene

  const clonedScene = useMemo(() => {
    if (!scene) return null
    try {
      const clone = scene.clone(true)
      clone.traverse((child: THREE.Object3D) => {
        try {
          if (child instanceof THREE.Mesh) {
            child.castShadow = config?.castShadow ?? true
            child.receiveShadow = config?.receiveShadow ?? false
            try {
              child.geometry.computeVertexNormals()
              child.geometry.normalizeNormals()
            } catch { /* ignore geom errors */ }

            const materialType = config?.materialType || 'plastic'
            const matConfig = MATERIAL_CONFIG[materialType] || MATERIAL_CONFIG.plastic

            const applyPixelStyle = (mat: THREE.Material) => {
              try {
                if (mat instanceof THREE.MeshStandardMaterial ||
                    mat instanceof THREE.MeshPhysicalMaterial ||
                    mat instanceof THREE.MeshPhongMaterial ||
                    mat instanceof THREE.MeshLambertMaterial) {
                  mat.flatShading = true
                  if (mat instanceof THREE.MeshStandardMaterial ||
                      mat instanceof THREE.MeshPhysicalMaterial) {
                    mat.roughness = 0.8
                    mat.metalness = 0.1
                  }
                  if (mat.map) {
                    const mapUrl = String(
                      (mat.map as any)?.source?.data?.src ||
                      (mat.map as any)?.image?.src ||
                      (mat.map as any)?.url ||
                      ''
                    )
                    const needsInvalidMap = /Textures[\\/]/i.test(mapUrl) ||
                      /\.(png|jpg|jpeg|webp|tga|bmp|hdr)$/i.test(mapUrl) ||
                      ((mat.map as any)?.isTexture && !(mat.map.image || (mat.map as any).source?.data))
                    if (needsInvalidMap) {
                      try { mat.map.dispose?.() } catch { /* ignore */ }
                      mat.map = null
                    }
                  }
                  if (mat.map) {
                    mat.map.minFilter = THREE.NearestFilter
                    mat.map.magFilter = THREE.NearestFilter
                    mat.map.generateMipmaps = false
                  }
                  if (mat.emissiveMap) {
                    mat.emissiveMap.minFilter = THREE.NearestFilter
                    mat.emissiveMap.magFilter = THREE.NearestFilter
                    mat.emissiveMap.generateMipmaps = false
                  }
                  if (mat.aoMap) {
                    mat.aoMap.minFilter = THREE.NearestFilter
                    mat.aoMap.magFilter = THREE.NearestFilter
                  }
                }
              } catch { /* ignore per-material errors */ }
            }

            if (child.material instanceof THREE.MeshStandardMaterial ||
                child.material instanceof THREE.MeshPhysicalMaterial) {
              child.material.roughness = matConfig.roughness
              child.material.metalness = matConfig.metalness
              if (matConfig.emissive) {
                try { child.material.emissive.set(matConfig.emissive) } catch { /* ignore */ }
                child.material.emissiveIntensity = matConfig.emissiveIntensity || 0
              }
              if (color) {
                try { child.material.color.set(color) } catch { /* ignore */ }
              }
              applyPixelStyle(child.material)
            } else if (child.material instanceof THREE.MeshPhongMaterial) {
              child.material.shininess = 10
              if (color) { try { child.material.color.set(color) } catch { /* ignore */ } }
              applyPixelStyle(child.material)
            } else if (child.material instanceof THREE.MeshLambertMaterial) {
              if (color) { try { child.material.color.set(color) } catch { /* ignore */ } }
              applyPixelStyle(child.material)
            } else if (child.material instanceof THREE.MeshBasicMaterial) {
              if (color) { try { child.material.color.set(color) } catch { /* ignore */ } }
              applyPixelStyle(child.material)
            } else {
              try {
                const newMat = new THREE.MeshStandardMaterial({
                  color: color || '#a8a29e',
                  roughness: 0.8,
                  metalness: 0.1,
                  flatShading: true,
                })
                if (matConfig.emissive) {
                  try { newMat.emissive.set(matConfig.emissive) } catch { /* ignore */ }
                  newMat.emissiveIntensity = matConfig.emissiveIntensity || 0
                }
                child.material = newMat
              } catch { /* ignore mat create */ }
            }
          }
        } catch { /* ignore per-child errors */ }
      })
      return clone
    } catch {
      return null
    }
  }, [scene, config, color])

  useFrame((_, delta) => {
    timeRef.current += delta

    if (groupRef.current) {
      if (interactable) {
        const breathe = 1 + Math.sin(timeRef.current * 2) * 0.02
        groupRef.current.scale.setScalar(breathe * (config?.scale || 1))
      } else {
        groupRef.current.scale.setScalar(selected ? 1.05 * (config?.scale || 1) : (config?.scale || 1))
      }
    }

    if (clonedScene) {
      try {
        clonedScene.traverse((child: THREE.Object3D) => {
          try {
            if (child instanceof THREE.Mesh) {
              const highlightColor = config?.highlightColor || PALETTE.target.primary

              if (child.material instanceof THREE.MeshStandardMaterial ||
                  child.material instanceof THREE.MeshPhysicalMaterial) {
                if (selected) {
                  try { child.material.emissive.set(highlightColor) } catch { /* ignore */ }
                  child.material.emissiveIntensity = 0.6
                } else if (hovered) {
                  try { child.material.emissive.set(highlightColor) } catch { /* ignore */ }
                  child.material.emissiveIntensity = 0.3
                } else {
                  const materialType = config?.materialType || 'plastic'
                  const matConfig = MATERIAL_CONFIG[materialType] || MATERIAL_CONFIG.plastic
                  try { child.material.emissive.set(matConfig.emissive || '#000000') } catch { /* ignore */ }
                  child.material.emissiveIntensity = matConfig.emissiveIntensity || 0
                }
              } else if (child.material instanceof THREE.MeshPhongMaterial ||
                         child.material instanceof THREE.MeshLambertMaterial) {
                if (selected) {
                  try { child.material.emissive?.set(highlightColor) } catch { /* ignore */ }
                  child.material.emissiveIntensity = 0.6
                } else if (hovered) {
                  try { child.material.emissive?.set(highlightColor) } catch { /* ignore */ }
                  child.material.emissiveIntensity = 0.3
                } else {
                  try { child.material.emissive?.set('#000000') } catch { /* ignore */ }
                  child.material.emissiveIntensity = 0
                }
              }
            }
          } catch { /* ignore per-child frame errors */ }
        })
      } catch { /* ignore traverse errors (protect WebGL context) */ }
    }
  })

  const FallbackComp = fallbackComponent

  if (!clonedScene || !config) {
    return (
      <FallbackColorizer modelId={modelId} color={color} hovered={hovered} selected={selected}>
        <FallbackComp />
      </FallbackColorizer>
    )
  }

  const heightOffset = config.heightOffset || 0
  const rotation = config.rotation || [0, 0, 0]

  return (
    <group ref={groupRef} position={[0, heightOffset, 0]} rotation={rotation as any}>
      <primitive object={clonedScene} />
      {children}

      {target && (
        <mesh position={[0, -heightOffset + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3, 0.4, 32]} />
          <meshBasicMaterial
            color={PALETTE.target.primary}
            transparent
            opacity={0.6 + Math.sin(timeRef.current * 3) * 0.2}
          />
        </mesh>
      )}

      {target && (
        <pointLight
          position={[0, 0.5, 0]}
          color={PALETTE.target.primary}
          intensity={0.5 + Math.sin(timeRef.current * 2) * 0.2}
          distance={2}
        />
      )}
    </group>
  )
}

export function ModelAsset(props: ModelAssetProps) {
  const config = getModelConfig(props.modelId)
  const FallbackComponent = config?.fallback || MODEL_REGISTRY.key.fallback

  if (config?.assetAvailable === false) {
    return (
      <FallbackColorizer
        modelId={props.modelId}
        color={props.color}
        hovered={props.hovered}
        selected={props.selected}
      >
        <FallbackComponent />
      </FallbackColorizer>
    )
  }

  return (
    <ModelErrorBoundary
      fallback={FallbackComponent}
      modelId={props.modelId}
      color={props.color}
      hovered={props.hovered}
      selected={props.selected}
    >
      <ModelContent {...props} />
    </ModelErrorBoundary>
  )
}

/**
 * C1：房间装饰用「GLB 优先 + 自定义 children fallback」容器。
 *
 * 语义：
 *  - 若 modelId 有可加载 GLB（assetAvailable !== false 且 path 非空）：
 *    先尝试 ModelAsset → GLB 渲染；
 *    GLB 成功时：渲染 GLB，children 隐藏（仅用于 hook 稳定 / 可选 keepChildrenAlways 叠加）；
 *    GLB 失败时（或加载超时触发 fallback）：自动走 children fallback，视觉与未改造前保持一致。
 *  - 若 modelId 本身被标 assetAvailable=false 或未注册：直接走 children fallback，不发起网络请求。
 *
 * 风险控制：GLB 加载失败不会抛到父级（ModelErrorBoundary + loadGLTF fallback 都兜住），
 * 最差情况是"视觉退回改造前"，不会白屏或丢 WebGL 上下文。
 */
interface RoomDecorPieceProps {
  modelId: string
  color?: string
  /** GLB 不可用/加载失败时展示的 children；传空数组也行（= 完全依赖 ModelAsset 的 registry fallback） */
  children?: ReactNode
  /** true = GLB 成功加载时也继续渲染 children（默认 false） */
  keepChildrenAlways?: boolean
}

export function RoomDecorPiece({
  modelId,
  color,
  children,
  keepChildrenAlways = false,
}: RoomDecorPieceProps) {
  const config = getModelConfig(modelId)
  const RegistryFallback = (config?.fallback || MODEL_REGISTRY.key.fallback) as React.ComponentType<any>

  // 1) 明确没 GLB → 直接 fallback children
  if (!config || config.assetAvailable === false || !config.path) {
    if (children) {
      return <FallbackColorizer modelId={modelId} color={color}>{children}</FallbackColorizer>
    }
    return (
      <FallbackColorizer modelId={modelId} color={color}>
        <RegistryFallback />
      </FallbackColorizer>
    )
  }

  // 2) 有 GLB → 渲染 ModelAsset + 隐藏 children；ModelAsset 内的 catch + ErrorBoundary
  //    会在失败时退回到 registryFallback（兜底），这里我们通过额外嵌套一层
  //    DecorErrorBoundary 把 registryFallback 再替换成自定义 children fallback。
  return (
    <DecorErrorBoundary
      modelId={modelId}
      color={color}
      customFallbackChildren={children}
    >
      <ModelAsset modelId={modelId} color={color}>
        {!keepChildrenAlways && children ? <group visible={false}>{children}</group> : null}
        {keepChildrenAlways ? children : null}
      </ModelAsset>
    </DecorErrorBoundary>
  )
}

class DecorErrorBoundary extends Component<
  {
    modelId: string
    color?: string
    customFallbackChildren?: ReactNode
    children: ReactNode
  },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true }
  }
  componentDidCatch(_error: Error) { /* A1 里已打 warn，这里不重复 */ }
  render() {
    if (this.state.hasError) {
      const { modelId, color, customFallbackChildren } = this.props
      if (customFallbackChildren) {
        return (
          <FallbackColorizer modelId={modelId} color={color}>
            {customFallbackChildren}
          </FallbackColorizer>
        )
      }
      return this.props.children
    }
    return this.props.children
  }
}
