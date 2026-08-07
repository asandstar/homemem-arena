import { useRef, useMemo, Component, useState, useEffect, cloneElement, isValidElement } from 'react'
import type { ReactNode, ReactElement } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MODEL_REGISTRY, getModelConfig } from './ModelRegistry'
import { MATERIAL_CONFIG, PALETTE } from '../colors'
import { resolveAssetUrl } from './resolveAssetUrl'
import { IS_DEV, BASE_URL } from '../../../utils/env'
import { defineModelStatsGetter, setModelStatsSnap } from '../../../utils/renderDebug'
import { resolveFallbackSize } from '../../../utils/resolveFallbackSize'

// === 缓存（B2：缓存治理，key 包含 BASE_URL，避免 basename 污染；FIFO 限制 <=50 条目） ===
const CACHE_KEY_PREFIX: string = `cache::${BASE_URL}::`

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
/**
 * 全局原子化守卫：防止 StrictMode 双渲染 / cleanup 再调用导致 markDone 被调用多次。
 * key = `${callSiteTag}::${stableId}::${ticket}`。
 * 严格要求：同一个 key 最多只允许一次 statsIncLoadStart / 一次 statsIncLoadDone。
 */
const STARTED_KEYS = new Set<string>()
const DONE_KEYS = new Set<string>()
let _guardSeq = 0
// reset epoch：每次 resetModelLoadStats 递增，STARTED/DONE key 中包含 epoch，
// 这样 reset 之前遗留的 markDone 不会与 reset 之后的 start 互相干扰，
// 也不会因为 STARTED_KEYS.clear() 导致老的 markDone 全部变成 orphan。
let _statsEpoch = 0

function statsIncLoadStart(tag: string = 'unknown', stableId: string = '', ticket: number | string = 0) {
  const key = `E${_statsEpoch}::${tag}::${stableId}::${ticket}`
  if (STARTED_KEYS.has(key)) {
    if (IS_DEV) console.debug('[statsGuard] duplicate statsIncLoadStart ignored:', key)
    return
  }
  STARTED_KEYS.add(key)
  loadStats.total++
  loadStats.inflight++
  publishStats()
}
function statsIncLoadDone(ok: boolean, modelId: string, tag: string = 'unknown', stableId: string = '', ticket: number | string = 0) {
  const key = `E${_statsEpoch}::${tag}::${stableId}::${ticket}`
  if (DONE_KEYS.has(key)) {
    if (IS_DEV) console.debug('[statsGuard] duplicate statsIncLoadDone ignored:', key, 'ok=', ok)
    return
  }
  const hasMatchingStart = STARTED_KEYS.has(key)
  if (!hasMatchingStart) {
    // 尝试在过去最多 1 个 epoch 内匹配（reset 触发后旧 key 的 start 不在当前 epoch，但可能在前一 epoch）
    const prevKey = `E${Math.max(0, _statsEpoch - 1)}::${tag}::${stableId}::${ticket}`
    if (!STARTED_KEYS.has(prevKey)) {
      if (IS_DEV) console.debug('[statsGuard] orphan statsIncLoadDone skipped (no matching start in curr/prev epoch):', key, 'ok=', ok)
      return
    }
  }
  DONE_KEYS.add(key)
  if (ok) loadStats.loaded++
  else { loadStats.failed++; loadStats.failedIds.push(modelId) }
  loadStats.inflight = Math.max(0, loadStats.inflight - 1)
  publishStats()
}
function nextGuardTicket() { _guardSeq += 1; return _guardSeq }

export { statsIncLoadStart, statsIncLoadDone, nextGuardTicket }
export function resetModelLoadStats() {
  // 递增 epoch（不清除 STARTED/DONE key，这样旧 epoch 的 markDone 仍能通过 prevKey 找到）
  _statsEpoch += 1
  // 为防止 _statsEpoch 运行超长时间后溢出（理论上极难触发，简单保护），每 >10000 清理
  if (_statsEpoch > 10_000) {
    STARTED_KEYS.clear()
    DONE_KEYS.clear()
    _statsEpoch = 0
  }
  _guardSeq = 0
  loadStats = { total: 0, loaded: 0, failed: 0, inflight: 0, failedIds: [] }
  publishStats()
}

// === 暴露到 window（DEV-only，供就绪信号/浏览器调试读取） ===
;(function EXPOSE_MODEL_STATS_TO_WINDOW() {
  if (!IS_DEV || typeof window === 'undefined') return
  try {
    const snap = () => cloneStats()
    defineModelStatsGetter(snap)
    // 同时订阅变化时更新一个简单副本（便于直接 JSON.stringify）
    setModelStatsSnap({ ...snap(), failedIds: snap().failedIds.slice() })
    subscribeModelLoad((s) => {
      setModelStatsSnap({ ...s, failedIds: s.failedIds.slice() })
    })
  } catch { /* ignore */ }
})();

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
;(() => {
  const orig = console.error.bind(console)
  const GLTF_TEX_ERR = /GLTFLoader.*Couldn't load texture/i
  // 只 patch 一次（热更新时这个模块会被重复执行），避免套娃。
  if ((console.error as any)._gltfTextureSilenced) return
  let _reentrantGuard = false
  const next = function gltfSilentError(...args: any[]) {
    // 重入防护：如果 orig(...) 内部又触发 console.error，不做二次过滤，直接透传，
    // 避免：React ErrorBoundary → setState → console.error → React → console.error 无限循环。
    if (_reentrantGuard) {
      orig(...args)
      return
    }
    const first = String(args?.[0] ?? '')
    if (GLTF_TEX_ERR.test(first)) return
    _reentrantGuard = true
    try {
      orig(...args)
    } finally {
      _reentrantGuard = false
    }
  } as any
  next._gltfTextureSilenced = true
  console.error = next
})()

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
          // 不再调用 stripAllTextures：LoadingManager.setURLModifier 已拦截外部纹理请求
          // （返回 1x1 像素），console.error patch 已过滤 GLTFLoader 纹理错误。
          // 移除 stripAllTextures 可保留 GLB 内嵌纹理，让模型显示真实材质而非纯色。
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
  // 关键修复：对于 "exited the lock"（Pointer Lock 退出时浏览器中断了 GLB 加载）
  // 这类 SecurityError，用一个空 GLTF 占位而不是让 Promise 走到 unhandledrejection
  promise.then(
    () => { /* success: 保留缓存 */ },
    (e: any) => {
      MODEL_TEXTURE_CACHE.delete(cacheKey)
      const idx = MODEL_CACHE_FIFO_KEYS.indexOf(cacheKey)
      if (idx >= 0) MODEL_CACHE_FIFO_KEYS.splice(idx, 1)
      const msg = String(e?.message ?? e ?? '')
      if (msg.includes('exited the lock')) {
        // 指针锁退出导致的加载中断：不抛给全局，避免控制台噪音
        console.warn('[ModelAsset] GLB加载因指针锁退出被取消，已静默忽略:', path.slice(0, 80))
      }
    },
  )

  MODEL_TEXTURE_CACHE.set(cacheKey, promise)
  MODEL_CACHE_FIFO_KEYS.push(cacheKey)
  evictCacheIfNeeded()

  // 防悬挂：极端情况下（fetch 被中止且 promise 永不 settle），15 秒后重试
  setTimeout(() => {
    if (!settled && MODEL_TEXTURE_CACHE.get(cacheKey) === promise) {
      MODEL_TEXTURE_CACHE.delete(cacheKey)
      const idx = MODEL_CACHE_FIFO_KEYS.indexOf(cacheKey)
      if (idx >= 0) MODEL_CACHE_FIFO_KEYS.splice(idx, 1)
    }
  }, 15_000).unref?.()

  return promise
}

export { loadGLTF }

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

/**
 * F1 · GLB fallback AABB 对齐：把「Registry 已有的 effectiveAabb / furniture 声明的 size」
 * 作为 size prop 注入给 FallbackComp，让 fallback 视觉几何体 = GLB 真实尺寸 = 碰撞 AABB
 * 三者统一，避免「视觉 1.6m 但碰撞 1.96m → 穿墙/卡空气墙」。
 *
 * 优先级：
 *  1) 若传入 explicitSize（调用点已知，如 Container3D 从 decorFurniture 读）→ 直接用
 *  2) 若 modelId (MODEL_REGISTRY) 能通过 mapping 映射到 MODEL_ASSET_REGISTRY → 取 effectiveAabb
 *  3) 否则保持 FallbackModels defaultSize(0.5, 0.5, 0.5) 不改（小道具保持原有，尺寸影响小）
 *
 * 注意：resolveFallbackSize 与 MODEL_ID_TO_ASSET_ID 已抽离到 src/utils/resolveFallbackSize.ts
 * （纯函数，零 React/Three 依赖），便于 vitest 做回归断言。此文件只负责渲染侧消费。
 */

export function FallbackColorizer({ modelId, color, hovered, selected, children, explicitSize }: {
  modelId: string
  color?: string
  hovered?: boolean
  selected?: boolean
  children: ReactNode
  /** 调用点已知 size（例如从 decorFurniture 读），优先级最高 */
  explicitSize?: { x: number; y: number; z: number }
}) {
  const groupRef = useRef<THREE.Group>(null)
  const timeRef = useRef(0)
  const config = getModelConfig(modelId)
  const colors = getFallbackColors(modelId)
  const fallbackSize = resolveFallbackSize(modelId, explicitSize)

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

  return (
    <group ref={groupRef}>
      {fallbackSize && isValidElement(children)
        ? cloneElement(children as ReactElement<any>, { size: fallbackSize })
        : children}
    </group>
  )
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
  const accountedTicketRef = useRef(0)
  const ticketSeedRef = useRef(0)

  useEffect(() => {
    let cancelled = false
    ticketSeedRef.current += 1
    const myTicket = ticketSeedRef.current
    let settled = false
    setGltf(null)
    if (!assetAvailable) {
      return () => { cancelled = true }
    }

    statsIncLoadStart('ModelAsset', modelId, myTicket)

    // markDone：双重守卫（局部 accountedTicketRef + 全局 STARTED/DONE_KEYS），确保每个 ticket 恰好一次
    const markDone = (ok: boolean) => {
      if (accountedTicketRef.current === myTicket) return
      accountedTicketRef.current = myTicket
      try { statsIncLoadDone(ok, modelId, 'ModelAsset', modelId, myTicket) } catch { /* protect */ }
    }

    loadGLTF(modelPath)
      .then((g) => {
        settled = true
        if (cancelled) {
          markDone(false)
          return
        }
        try {
          setGltf(g)
          markDone(true)
        } catch (err) {
          markDone(false)
          const msg = err instanceof Error ? err.message : typeof err === 'string' ? err : 'setState failed'
          _rateLimitedWarn(modelId, modelPath, msg, err)
        }
      })
      .catch((err) => {
        settled = true
        markDone(false)
        if (cancelled) return
        const msg =
          err instanceof Error ? err.message :
          typeof err === 'string' ? err :
          'unknown'
        _rateLimitedWarn(modelId, modelPath, msg, err)
      })

    // 保险：12s 未 settle 按超时计入失败（DEV 更快 fallback）
    const to = setTimeout(() => {
      if (settled) return
      markDone(false)
      _rateLimitedWarn(modelId, modelPath, 'timeout(>12s)', new Error('ModelAsset loading timeout'))
    }, 12_000)

    return () => {
      cancelled = true
      clearTimeout(to)
      // 仅当 Promise 尚未 settle 时闭合（then/catch 会自行闭合），避免与真实完成重复计数
      if (!settled) markDone(false)
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
