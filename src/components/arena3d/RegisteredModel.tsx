/**
 * src/components/arena3d/RegisteredModel.tsx
 *
 * §八 · 最小组件：使用 data/assets/modelRegistry.ts（独立数据层）
 * 渲染 Living 5 核心家具。
 *
 * 结构：
 * <group position={position} rotation={[0, rotationY, 0]}>  (outer #1 · world)
 *   <group scale=[uniformScale,uniformScale,uniformScale]>      (outer #2 · uniform scale §六)
 *     <group position=[pivotOffset.x, pivotOffset.y, pivotOffset.z]>  (inner · bottom-center)
 *       <primitive object={scene.clone(true)} />
 *     </group>
 *   </group>
 * </group>
 *
 * - clone scene(true)：避免与 useGLTF / loadGLTF 缓存共享 scene（§八 禁止修改 cache 共享 scene）；
 * - fallback：加载失败（或 assetAvailable=false）时渲染 children（= RoomDecorPiece 原来的程序化 fallback）。
 * - 不引入任何新 3D 依赖；不每帧重算 Box3；不在 render 中修改 material。
 */
import { useMemo, useRef, useState, useEffect, type ReactNode } from 'react'
import * as THREE from 'three'
import type { ModelAssetId } from '../../data/assets/modelRegistry'
import { getModelAsset } from '../../data/assets/modelRegistry'
import { resolveAssetUrl } from './models/resolveAssetUrl'
import { loadGLTF } from './models/ModelAsset'
// ↑ 注意：ModelAsset.tsx 内部的 loadGLTF 为非导出；我们通过 fallback 机制复用现有错误缓存/加载统计。
// 为避免改 ModelAsset.tsx 的 exports（避免修改现有 loader 契约），RegisteredModel 自行使用
// 一个极简 mini-loader（同 fetch→GLTFLoader.parse 原理）。
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { subscribeModelLoad, statsIncLoadStart, statsIncLoadDone } from './models/ModelAsset'

export interface RegisteredModelProps {
  assetId: ModelAssetId
  position?: [number, number, number]
  rotationY?: number
  /** 场景级可读性缩放；以模型底部中心为原点，不改变落地/落台锚点。 */
  scaleMultiplier?: number
  visible?: boolean
  castShadow?: boolean
  receiveShadow?: boolean
  /** GLB 加载失败（或超时）时渲染 fallback；未传则静默不渲染 */
  fallback?: ReactNode
}

const WARN_COOLDOWN = 30_000
const lastWarnAt = new Map<string, number>()

/**
 * 模块级 GLB 加载缓存：
 * - 同 fullUrl 的并发/重复请求共享同一个 Promise（避免 StrictMode 双渲染、effect 依赖变更导致重复 fetch）
 * - 只缓存成功结果；失败时从缓存中移除，下次可重试
 */
const GLB_LOAD_CACHE = new Map<string, Promise<any>>()

function rateLimitedWarn(assetId: string, reason: string) {
  try {
    const env = (import.meta as any).env
    if (!env?.DEV) return
    const k = `${assetId}|${reason}`
    const now = Date.now()
    if (now - (lastWarnAt.get(k) || 0) < WARN_COOLDOWN) return
    lastWarnAt.set(k, now)
    console.warn(`[RegisteredModel] ${reason} (assetId=${assetId})`)
  } catch {
    /* 开发期自检异常不影响渲染 */
  }
}

function minimalLoadGLTF(fullUrl: string): Promise<any> {
  const cached = GLB_LOAD_CACHE.get(fullUrl)
  if (cached) return cached

  const promise = fetch(fullUrl, { credentials: 'same-origin' })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const ct = res.headers.get('content-type') || ''
      if (/html/i.test(ct)) throw new Error('SPA fallback (content-type=text/html)')
      return res.arrayBuffer()
    })
    .then((buffer) => {
      return new Promise<any>((resolve, reject) => {
        const loader = new GLTFLoader()
        loader.parse(buffer, '', resolve, reject)
      })
    })
    .catch((err) => {
      GLB_LOAD_CACHE.delete(fullUrl)
      throw err
    })
  GLB_LOAD_CACHE.set(fullUrl, promise)
  return promise
}

export function RegisteredModel({
  assetId,
  position = [0, 0, 0],
  rotationY = 0,
  scaleMultiplier = 1,
  visible = true,
  castShadow = true,
  receiveShadow = true,
  fallback,
}: RegisteredModelProps) {
  const def = getModelAsset(assetId)
  const outerRef = useRef<THREE.Group>(null)
  const [scene, setScene] = useState<THREE.Object3D | null>(null)
  const [failed, setFailed] = useState<boolean>(false)

  const fullUrl = useMemo(() => resolveAssetUrl(def.url), [def.url])
  const accountedTicketRef = useRef(0)
  const ticketSeedRef = useRef(0)

  useEffect(() => {
    let cancelled = false
    ticketSeedRef.current += 1
    const myTicket = ticketSeedRef.current
    let settled = false
    setScene(null)
    setFailed(false)

    statsIncLoadStart('RegisteredModel', assetId, myTicket)
    const markDone = (ok: boolean) => {
      if (accountedTicketRef.current === myTicket) return
      accountedTicketRef.current = myTicket
      try { statsIncLoadDone(ok, assetId, 'RegisteredModel', assetId, myTicket) } catch { /* */ }
    }

    minimalLoadGLTF(fullUrl)
      .then((gltf) => {
        settled = true
        if (cancelled) {
          markDone(false)
          return
        }
        try {
          if (gltf?.scene) {
            const clone = (gltf.scene as THREE.Object3D).clone(true)
            clone.traverse((c) => {
              if (c instanceof THREE.Mesh) {
                c.castShadow = castShadow
                c.receiveShadow = receiveShadow
              }
            })
            setScene(clone)
            markDone(true)
          } else {
            setFailed(true)
            markDone(false)
            rateLimitedWarn(assetId, 'GLB parse succeeded but scene is missing')
          }
        } catch (err: any) {
          setFailed(true)
          markDone(false)
          rateLimitedWarn(assetId, `clone/setState failed: ${String(err?.message || err)}`)
        }
      })
      .catch((err) => {
        settled = true
        markDone(false)
        if (cancelled) return
        setFailed(true)
        rateLimitedWarn(assetId, `load failed: ${String(err?.message || err)}`)
      })

    // 12s 超时 → fallback
    const to = setTimeout(() => {
      if (settled) return
      setFailed(true)
      markDone(false)
      rateLimitedWarn(assetId, 'timeout(>12s)')
    }, 12_000)

    return () => {
      cancelled = true
      clearTimeout(to)
      if (!settled) markDone(false)
    }
  }, [fullUrl, assetId, castShadow, receiveShadow])

  if (!visible) return null

  // Fallback 条件：加载失败 或 scene 尚未 ready 且提供 fallback
  const showFallback = failed || (!scene && !!fallback)
  if (showFallback && fallback) {
    return (
      <group position={position} rotation={[0, rotationY, 0]}>
        <group scale={[scaleMultiplier, scaleMultiplier, scaleMultiplier]}>
          {fallback}
        </group>
      </group>
    )
  }

  if (!scene) {
    // 正在加载：静默占位（不显示几何，避免 WebGL 透明闪烁）
    // 可选：提供 fallback 时 fallback 已在上方返回；此处加载中不渲染。
    return null
  }

  const s = def.uniformScale * scaleMultiplier
  const p = def.pivotOffset

  return (
    <group ref={outerRef} position={position} rotation={[0, rotationY, 0]}>
      <group scale={[s, s, s]}>
        <group position={[p.x, p.y, p.z]}>
          <primitive object={scene} />
        </group>
      </group>
    </group>
  )
}

// 防 tree-shaking 把订阅函数警告成 unused（loadGLTF from ModelAsset 未用到是预期的）
void subscribeModelLoad
void loadGLTF
