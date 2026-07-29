import { useRef, useMemo, Component, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MODEL_REGISTRY, getModelConfig } from './ModelRegistry'
import { MATERIAL_CONFIG, PALETTE } from '../colors'
import { resolveAssetUrl } from './resolveAssetUrl'

const MODEL_TEXTURE_CACHE = new Map<string, Promise<any>>();

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
 * 纹理错误三重防御：
 *  GLTFLoader 在解析内部纹理引用（Textures/colormap.png 等）时，会走 ImageLoader
 *  发起请求，失败后 onError 里 console.error 打出
 *  "THREE.GLTFLoader: Couldn't load texture XXXX"。大量并发的错误日志 + 失败请求
 *  会让浏览器判定 WebGL 上下文风险，触发 Context Lost info。
 *
 *  三层防御协同：
 *   ① parse 期间临时 patch console.error，吞掉 GLTFLoader 纹理相关的
 *     error 日志（其它 error 正常输出，不影响排查真实 bug）。
 *   ② LoadingManager.setURLModifier 拦截所有相对纹理 URL → 1x1 base64，
 *     对于走 LoadingManager 的 loader 路径直接返回像素。
 *   ③ parse 回调里立刻对 scene 调用 stripAllTextures，把所有材质上的
 *     texture map 置 null 并 dispose，保证视觉上不依赖任何外部纹理。
 */
function loadGLTF(path: string): Promise<any> {
  if (MODEL_TEXTURE_CACHE.has(path)) return MODEL_TEXTURE_CACHE.get(path)!
  const PIXEL_1x1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsBacYAAAAASUVORK5CYII='

  const manager = new THREE.LoadingManager()
  manager.setURLModifier((url) => {
    const u = String(url || '')
    if (shouldStubTextureUrl(u)) return PIXEL_1x1
    return url
  })
  const loader = new GLTFLoader(manager)

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
      MODEL_TEXTURE_CACHE.delete(path)
      throw e
    }
    return new Promise<any>((resolve, reject) => {
      try {
        loader.parse(buffer as any, '', (gltf: any) => {
          // 立刻剥离材质纹理引用，确保渲染不依赖外部纹理
          try { if (gltf && gltf.scene) stripAllTextures(gltf.scene) } catch { /* ignore */ }
          resolve(gltf)
        }, reject)
      } catch (e) {
        reject(e)
      }
    })
  })
  MODEL_TEXTURE_CACHE.set(path, promise)
  promise.catch(() => { MODEL_TEXTURE_CACHE.delete(path) })
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
    let needsColorize = false

    try {
      groupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const isStandard = child.material instanceof THREE.MeshStandardMaterial

          if (!isStandard || !(child.material as any)._fallbackColored) {
            needsColorize = true
          }
          meshIndex++
        }
      })
    } catch {
      needsColorize = false
    }

    if (needsColorize) {
      meshIndex = 0
      try {
        groupRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = config?.castShadow ?? true
            child.receiveShadow = config?.receiveShadow ?? false

            let meshColor: string
            if (color) {
              meshColor = color
            } else {
              const colorOptions = [colors.primary, colors.secondary, colors.accent]
              meshColor = colorOptions[meshIndex % colorOptions.length]
            }

            if (child.material instanceof THREE.MeshStandardMaterial) {
              child.material.color.set(meshColor)
              child.material.roughness = matConfig.roughness
              child.material.metalness = matConfig.metalness
              if (matConfig.emissive) {
                try { child.material.emissive.set(matConfig.emissive) } catch { /* ignore */ }
                child.material.emissiveIntensity = matConfig.emissiveIntensity || 0
              }
              ;(child.material as any)._fallbackColored = true
            } else {
              const newMat = new THREE.MeshStandardMaterial({
                color: meshColor,
                roughness: matConfig.roughness,
                metalness: matConfig.metalness,
              })
              if (matConfig.emissive) {
                try { newMat.emissive.set(matConfig.emissive) } catch { /* ignore */ }
                newMat.emissiveIntensity = matConfig.emissiveIntensity || 0
              }
              ;(newMat as any)._fallbackColored = true
              child.material = newMat
            }

            meshIndex++
          }
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
    setGltf(null)
    // 失败时不 setLoadError，避免成百上千个 state 变更引发 WebGL 雪崩式 Context Lost；
    // 只要 gltf === null，!clonedScene 就会自动 fallback 到程序化模型。
    // 无可用资源时直接跳过，避免发起无意义 HTTP 请求。
    if (!assetAvailable) {
      return () => { cancelled = true }
    }

    loadGLTF(modelPath)
      .then((g) => {
        if (!cancelled) setGltf(g)
      })
      .catch(() => {
        if (cancelled) return
        // 不 setLoadError，也不 console.error / warn：
        // 在 vite preview / electron 浏览器沙箱中大量并发 fetch 可能被 ABORT，
        // 这是预期行为，静默 fallback 即可。
      })
    return () => { cancelled = true }
  }, [modelPath, assetAvailable])

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
