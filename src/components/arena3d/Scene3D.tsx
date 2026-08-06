import { useMemo, useRef, useEffect, useState, useLayoutEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGameStore } from '../../store/useGameStore'
import { useSessionStore } from '../../store/useSessionStore'
import { sharedRooms } from '../../data/rooms'
import type { RoomId } from '../../types/room'
import { Room3D } from './Room3D'
import { Object3D } from './Object3D'
import { Container3D } from './Container3D'
import { FirstPersonControls } from './FirstPersonControls'
import { ChaosEffect } from './ChaosEffect'
import { isInFieldOfView } from '../../utils/format'
import { IS_DEV, IS_E2E } from '../../utils/env'
import { PALETTE, ROOM_AMBIENT_COLORS } from './colors'
import { CatPrintsEffect } from './feedback/CatPrintsEffect'
import { CatShadowEffect } from './feedback/CatShadowEffect'
import { PhoneRingEffect } from './feedback/PhoneRingEffect'
import { ParticleRenderer } from './effects/ParticleRenderer'
import { PropModel } from './models/PropModel'
import { RegisteredModel } from './RegisteredModel'
import { CATEGORY_TO_MODEL_ID } from './modelIds'
import { getModelAsset } from '../../data/assets/modelRegistry'
import { PixelationPass } from './effects/PixelationPass'
import { MemoryModulationPass } from './effects/MemoryModulationPass'
import { subscribeModelLoad, type ModelLoadStats, resetModelLoadStats } from './models/ModelAsset'
import * as THREE from 'three'
import { AssetCalibrationView, shouldShowAssetCalibration } from '../dev/AssetCalibrationView'
import {
  getRenderReady,
  setRenderReady,
  patchRenderReady,
  getModelStatsSnap,
  type HommemRenderReady,
} from '../../utils/renderDebug'

// === DEV-only 就绪信号 + WebGL context 监控 ===
function initRenderReadySignal() {
  if (!IS_DEV || typeof window === 'undefined') return
  try {
    const initial: HommemRenderReady = {
      sceneMounted: false,
      firstFrameRendered: false,
      modelTotal: 0,
      modelPending: 0,
      modelLoaded: 0,
      modelFailed: 0,
      fallbackCount: 0,
      webglContextLost: false,
    }
    // HMR 友好：如果已经存在则仅补全缺失字段，保留已经在状态中的模型统计
    const existing = getRenderReady()
    if (existing && typeof existing === 'object') {
      const merged: HommemRenderReady = { ...initial }
      const keys = Object.keys(initial) as (keyof HommemRenderReady)[]
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i]
        if (typeof existing[k] === typeof initial[k]) {
          ;(merged as any)[k] = existing[k]
        }
      }
      setRenderReady(merged)
    } else {
      setRenderReady({ ...initial })
    }
  } catch { /* ignore */ }
}
initRenderReadySignal()
function setReadyPartial(patch: Partial<HommemRenderReady>) {
  if (!IS_DEV || typeof window === 'undefined') return
  try {
    patchRenderReady(patch)
  } catch { /* ignore */ }
}

interface Scene3DProps {
  onEntityClick: (entityId: string) => void
  onContainerClick: (containerId: string) => void
}

function RoomLights({ rooms, currentRoom }: { rooms: typeof sharedRooms; currentRoom: RoomId }) {
  const roomLightConfig: Record<RoomId, { color: string; intensity: number; positionOffset: [number, number, number]; distance: number }> = {
    living: { color: ROOM_AMBIENT_COLORS.living, intensity: 0.5, positionOffset: [0, 2.8, 0], distance: 12 },
    bedroom: { color: ROOM_AMBIENT_COLORS.bedroom, intensity: 0.4, positionOffset: [0, 2.8, 0], distance: 10 },
    // §A1.5: kitchen merged into dining — light config removed
    entrance: { color: ROOM_AMBIENT_COLORS.entrance, intensity: 0.35, positionOffset: [0, 2.5, 0], distance: 8 },
    laundry: { color: ROOM_AMBIENT_COLORS.laundry, intensity: 0.45, positionOffset: [0, 2.8, 0], distance: 15 },
    dining: { color: ROOM_AMBIENT_COLORS.dining, intensity: 0.8, positionOffset: [0, 2.8, 0], distance: 12 },
  }

  return (
    <group>
      {Object.entries(rooms).map(([id, room]) => {
        const config = roomLightConfig[id as RoomId]
        const isCurrentRoom = id === currentRoom
        const intensity = isCurrentRoom ? config.intensity : config.intensity * 0.3
        
        return (
          <pointLight
            key={`room-light-${id}`}
            position={[room.center.x + config.positionOffset[0], config.positionOffset[1], room.center.z + config.positionOffset[2]]}
            color={config.color}
            intensity={intensity}
            decay={2}
            distance={config.distance}
            castShadow={isCurrentRoom}
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.0005}
          />
        )
      })}
    </group>
  )
}

function HeldItem() {
  // ⚠️ 用单字段 selector 避免 getSnapshot 引用变化 → 无限循环
  const heldEntityId = useGameStore((s) => s.heldEntityId)
  const entities = useGameStore((s) => s.entities)
  const viewMode = useGameStore((s) => s.viewMode)
  const { camera } = useThree()
  const groupRef = useRef<THREE.Group>(null)
  const bobTime = useRef(0)

  const heldEntity = useMemo(() => {
    if (!heldEntityId) return null
    return entities.find((e) => e.id === heldEntityId) || null
  }, [heldEntityId, entities])

  useFrame((_, delta) => {
    if (!groupRef.current || !heldEntity || viewMode !== 'first-person') return

    bobTime.current += delta
    const bob = Math.sin(bobTime.current * 3) * 0.02
    const sway = Math.sin(bobTime.current * 2) * 0.03

    // R2A.2: 调整偏移使物体更靠右下方，避免遮挡视线
    const offset = new THREE.Vector3(0.4, -0.35, -0.4)
    offset.y += bob
    offset.x += sway

    const targetPos = new THREE.Vector3()
    targetPos.copy(camera.position)
    targetPos.add(offset.applyEuler(camera.rotation))

    groupRef.current.position.lerp(targetPos, 0.2)
    groupRef.current.rotation.y = camera.rotation.y + Math.PI / 6
    groupRef.current.rotation.x = camera.rotation.x * 0.3
    groupRef.current.rotation.z = Math.sin(bobTime.current * 1.5) * 0.05
  })

  if (!heldEntity || viewMode !== 'first-person') return null

  const modelId = CATEGORY_TO_MODEL_ID[String(heldEntity.category)] || 'cup'
  const displayColor = heldEntity.properties['cleanliness'] === 'dirty' ? '#9ca3af' : (heldEntity['color'] || '#f87171')

  // R2A.1 锚点契约：HELD 状态使用专门的 heldOffset，不复用 floor placement。
  // PropModel (CENTER_ORIGIN): center 在 group origin (y=0)。
  // RegisteredModel (BOTTOM_CENTER_ORIGIN): GLB bottom 在 position.y，center 在 position.y + glbHalfHeight。
  // 要使 GLB center 对齐 group origin: position.y = -glbHalfHeight。
  // fallback PropModel 需额外 +glbHalfHeight 偏移使 center 回到 group origin。
  const heldGlbHalfHeight = heldEntity.modelAssetId
    ? getModelAsset(heldEntity.modelAssetId).effectiveAabb.y / 2
    : 0

  // R2A.2: held 状态缩放因子，避免大模型遮挡视线
  const heldScale = 0.6

  return (
    <group ref={groupRef} scale={heldScale}>
      {heldEntity.modelAssetId ? (
        <RegisteredModel
          assetId={heldEntity.modelAssetId}
          position={[0, -heldGlbHalfHeight, 0]}
          fallback={
            <group position={[0, heldGlbHalfHeight, 0]}>
              <PropModel
                modelId={modelId}
                color={displayColor}
                hovered={false}
                selected={false}
                interactable={false}
                isHeld={true}
                size={heldEntity.size}
              />
            </group>
          }
        />
      ) : (
        <PropModel
          modelId={modelId}
          color={displayColor}
          hovered={false}
          selected={false}
          interactable={false}
          isHeld={true}
          size={heldEntity.size}
        />
      )}
    </group>
  )
}

/**
 * BriefingScene - briefing 阶段（或 task 未就绪时）的最小化 3D 场景
 *
 * 设计原则：这个组件里 **绝对不能** 订阅任何每帧/频繁变化的 Zustand 字段，
 * 也 **绝对不能** 挂载 FirstPersonControls / HeldItem / ParticleRenderer 等
 * 带 useFrame 且会回写 Zustand 的组件。否则会在 briefing 阶段
 * 触发"组件订阅 → store 更新 → 组件重渲染 → getSnapshot 变化"的
 * Maximum update depth exceeded 死循环，甚至 WebGL Context Lost。
 */
function BriefingScene() {
  const currentRoom = useGameStore((s) => s.currentRoom) || 'living'

  const roomsToRender = useMemo(() => {
    return [sharedRooms.living].filter(Boolean)
  }, [])

  return (
    <>
      <color attach="background" args={[0.059, 0.082, 0.165]} />
      <ambientLight intensity={0.35} color={PALETTE.ambient.neutral} />
      <directionalLight
        position={[8, 15, 8]}
        intensity={0.4}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
      <hemisphereLight
        color={PALETTE.ambient.warm}
        groundColor={PALETTE.background.floor}
        intensity={0.2}
      />
      <RoomLights rooms={sharedRooms} currentRoom={currentRoom} />
      {roomsToRender.map((room) => (
        <Room3D key={room.id} spec={room} />
      ))}
      <FirstFrameTracker />
    </>
  )
}

/**
 * PlayingSceneContents - 进入 playing 阶段后的完整游戏场景
 *
 * 所有带 useFrame 的组件（FirstPersonControls / HeldItem / ParticleRenderer
 * / ChaosEffect / observation useFrame 等）只放在这里，只有 phase === 'playing'
 * 且 task ready 时才挂载，彻底消除 briefing 阶段的无限循环源。
 */
function PlayingSceneContents({ onEntityClick, onContainerClick }: Scene3DProps) {
  const task = useGameStore((s) => s.task)
  const entities = useGameStore((s) => s.entities)
  const containerStates = useGameStore((s) => s.containerStates)
  const currentRoom = useGameStore((s) => s.currentRoom)
  const robotPosition = useGameStore((s) => s.robotPosition)
  const robotRotation = useGameStore((s) => s.robotRotation)
  const heldEntityId = useGameStore((s) => s.heldEntityId)
  const chaosEffectActive = useGameStore((s) => s.chaosEffectActive)
  const activeEventEffects = useGameStore((s) => s.activeEventEffects)
  const tickElapsed = useGameStore((s) => s.tickElapsed)
  const sweepExpiredDemoHighlights = useGameStore((s) => s.sweepExpiredDemoHighlights)
  const lastMoveAnimation = useGameStore((s) => s.lastMoveAnimation)
  const chaosValue = useGameStore((s) => s.chaosValue)
  const addEvent = useSessionStore((s) => s.addEvent)
  // PixelationPass → MemoryModulationPass 共享 RT
  const postFxTextureRef = useRef<THREE.Texture | null>(null)

  const observationTimer = useRef(0)
  const sweepTimer = useRef(0)
  const lastObservedIds = useRef<Set<string>>(new Set())

  useFrame((_, delta) => {
    tickElapsed(delta * 1000)
    observationTimer.current += delta
    sweepTimer.current += delta
    // ~每 150ms 扫一次过期的示范高亮（1.5~2s 寿命，精度要求不高，扫太多浪费）
    if (sweepTimer.current >= 0.15) {
      sweepTimer.current = 0
      sweepExpiredDemoHighlights()
    }
    if (observationTimer.current >= 2.0 && task) {
      observationTimer.current = 0

      const visibleIds: string[] = []
      for (const e of entities) {
        if (e.currentRoom !== currentRoom) continue
        if (e.status === 'hidden') continue
        if (e.status === 'held' && heldEntityId === e.id) continue

        if (isInFieldOfView(robotPosition, robotRotation, e.position, 90, 8)) {
          visibleIds.push(e.id)
        }
      }

      const newSet = new Set(visibleIds)
      const lastSet = lastObservedIds.current
      const changed = newSet.size !== lastSet.size ||
        [...newSet].some((id) => !lastSet.has(id))

      if (changed) {
        const rememberedIds = entities
          .filter((e) => e.status !== 'free' || e.currentRoom !== currentRoom)
          .map((e) => e.id)
        addEvent({
          type: 'observation',
          roomId: currentRoom,
          visibleEntityIds: visibleIds,
          rememberedEntityIds: rememberedIds,
          robotPosition,
          robotRotation,
        } as any, useGameStore.getState().stepCount)
        lastObservedIds.current = newSet
      }
    }
  })

  const roomsToRender = useMemo(() => {
    if (!task) return [sharedRooms.living].filter(Boolean)
    return task.rooms.map((id) => sharedRooms[id]).filter(Boolean)
  }, [task])

  return (
    <>
      <color attach="background" args={[0.059, 0.082, 0.165]} />
      <ambientLight intensity={0.35} color={PALETTE.ambient.neutral} />
      <directionalLight
        position={[8, 15, 8]}
        intensity={0.4}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
      <hemisphereLight
        color={PALETTE.ambient.warm}
        groundColor={PALETTE.background.floor}
        intensity={0.2}
      />
      <RoomLights rooms={sharedRooms} currentRoom={currentRoom} />
      {roomsToRender.map((room) => (
        <Room3D key={room.id} spec={room} />
      ))}

      {task && entities
        .filter((e) => e.status !== 'held' || e.id !== heldEntityId)
        .filter((e) => e.currentRoom === currentRoom || e.status === 'placed' || e.status === 'target-met')
        .filter((e) => e.status === 'free' || e.status === 'placed' || e.status === 'target-met')
        .map((entity) => (
          <Object3D
            key={entity.id}
            entity={entity}
            onClick={(e) => onEntityClick(e.id)}
          />
        ))}

      {task && task.containers
        .map((spec) => {
          const state = containerStates[spec.id]
          return (
            <Container3D
              key={spec.id}
              spec={spec}
              room={spec.room}
              isOpen={state?.open ?? spec.initialOpen}
              onClick={(s) => onContainerClick(s.id)}
            />
          )
        })}

      {activeEventEffects.includes('cat-prints') && lastMoveAnimation && (
        <>
          <CatPrintsEffect
            startPosition={[
              lastMoveAnimation.fromPosition.x,
              0,
              lastMoveAnimation.fromPosition.z,
            ]}
            endPosition={[
              lastMoveAnimation.toPosition.x,
              0,
              lastMoveAnimation.toPosition.z,
            ]}
          />
          <CatShadowEffect
            startPosition={[
              lastMoveAnimation.fromPosition.x,
              0.02,
              lastMoveAnimation.fromPosition.z,
            ]}
            endPosition={[
              lastMoveAnimation.toPosition.x,
              0.02,
              lastMoveAnimation.toPosition.z,
            ]}
          />
        </>
      )}

      {activeEventEffects.includes('cat-prints') && !lastMoveAnimation && (
        <CatPrintsEffect
          startPosition={[
            sharedRooms.living.center.x - 1.2,
            0,
            sharedRooms.living.center.z - 1.0,
          ]}
          endPosition={[
            sharedRooms.living.center.x + 0.5,
            0,
            sharedRooms.living.center.z - 1.5,
          ]}
        />
      )}

      {activeEventEffects.includes('phone-ring') && (
        <PhoneRingEffect
          position={[
            sharedRooms.bedroom.center.x - 7.2,
            0.5,
            sharedRooms.bedroom.center.z - 0.8,
          ]}
        />
      )}

      <HeldItem />
      <FirstPersonControls />
      <ChaosEffect active={chaosEffectActive} chaosValue={chaosValue} />
      <ParticleRenderer />
      {/*
        后处理管线：PixelationPass 先把 scene → RT（不画最后一棒到屏幕，因为 MemoryModulationPass 要再叠一层调制）；
        MemoryModulationPass 直接采样 PixelationPass 的 outputTexture，叠加 Memory-as-Modulator 后再画到屏幕。
        IS_E2E：两者都走 PixelationPass，MemoryModulationPass 禁用，避免影响截图对比。
      */}
      {!IS_E2E && (
        <PixelationPass
          pixelSize={4}
          outputTextureRef={postFxTextureRef}
          drawToScreen={false}
        />
      )}
      {IS_E2E && <PixelationPass pixelSize={4} />}
      {!IS_E2E && (
        <MemoryModulationPass
          enabled
          sourceTextureRef={postFxTextureRef}
        />
      )}
      <FirstFrameTracker />
    </>
  )
}

/**
 * FirstFrameTracker - 在 R3F 场景挂载后监控首帧渲染、WebGL context、模型加载状态，并写入 DEV 就绪信号。
 * 只挂载在 SceneContents 内部，保证只在实际 Canvas 渲染时启动。
 */
function FirstFrameTracker() {
  const { gl } = useThree()
  const frameCountRef = useRef(0)
  const sceneMountedFiredRef = useRef(false)
  const firstFrameFiredRef = useRef(false)
  const statsRef = useRef<ModelLoadStats>({ total: 0, loaded: 0, failed: 0, inflight: 0, failedIds: [] })
  const lostDebounceRef = useRef<number | null>(null)
  // StrictMode 第 1 次挂载→卸载触发的 context lost：用 mountedRef 标记，cleanup 后取消所有待判断的 lost
  const mountedRef = useRef(false)
  // 每个 mount 分配一个单调递增的 epoch：cleanup 后旧 epoch 的 setTimeout 不会污染新 mount
  const epochRef = useRef(0)
  // 每次 mount 的唯一 id：重置首帧计数（useLayoutEffect 同步运行，保证在 useFrame 之前执行）
  const mountSeqRef = useRef(0)

  // 0. SYNC reset（useLayoutEffect 早于任何 useFrame / useEffect）：
  //    StrictMode 下顺序是：mount1 → layoutEffect1 → useFrame1+ useEffect1 setup → cleanup1 → layoutEffect2 → useFrame2+useEffect2 setup。
  //    把重置放在 layoutEffect 能保证"每次挂载开始时，计数先清零 → 然后 useFrame 从 0 计数"。
  useLayoutEffect(() => {
    mountSeqRef.current += 1
    epochRef.current += 1
    const mySeq = mountSeqRef.current
    const myEpoch = epochRef.current
    mountedRef.current = true
    sceneMountedFiredRef.current = false
    firstFrameFiredRef.current = false
    frameCountRef.current = 0
    if (lostDebounceRef.current !== null) {
      clearTimeout(lostDebounceRef.current)
      lostDebounceRef.current = null
    }
    try {
      if (IS_DEV) {
        // mount 时仅重置 webglContextLost，不重置 sceneMounted/firstFrameRendered
        // 因为 BriefingScene → PlayingSceneContents 切换（同 Canvas 内 FirstFrameTracker 实例替换）
        // 时，如果在 BriefingScene cleanup 里先写 false，再由新 useFrame 设为 true 过程中存在窗口；
        // 这里直接假设新实例挂载后，useFrame 会很快（1-3帧内）重设为 true。
        setReadyPartial({ webglContextLost: false })
      }
    } catch { /* ignore */ }
    return () => {
      // unmount（含 StrictMode 第一次假卸载）：仅清理定时器、关闭 mounted 标记
      // —— 不再写回 sceneMounted=false / firstFrameRendered=false，
      // 防止同 Canvas 内的另一个 FirstFrameTracker 正在活跃时被旧 cleanup 覆盖为 false。
      // 新 tracker 的 useFrame 会在 1-3 帧内重设为 true，仅在全局场景真的卸载时（整个 Scene3D unmount），
      // 外部上层 effect 会负责清理（否则即使 sceneMounted=true，上层也没意义）。
      mountedRef.current = false
      if (lostDebounceRef.current !== null) {
        clearTimeout(lostDebounceRef.current)
        lostDebounceRef.current = null
      }
      void mySeq; void myEpoch
    }
  }, [gl])

  // 1. WebGL context 事件监控（挂在 canvas 元素上，useEffect 异步，不阻塞首帧）
  useEffect(() => {
    if (!IS_DEV) return
    const canvas = gl.domElement as HTMLCanvasElement
    if (!canvas) return

    const myEpoch = epochRef.current

    const onLost = (e: Event) => {
      try { console.warn('[RenderReady] WebGL context lost (debounced 120ms, epoch=' + myEpoch + ')', e) } catch {}
      if (!mountedRef.current) return
      if (lostDebounceRef.current !== null) clearTimeout(lostDebounceRef.current)
      // 缩短防抖到 120ms，避免瞬时丢失/恢复之间误判为真丢失
      lostDebounceRef.current = window.setTimeout(() => {
        lostDebounceRef.current = null
        if (!mountedRef.current || epochRef.current !== myEpoch) return // 已 unmount 或 remount，忽略旧回调
        try {
          const ctx = (gl as any)?.ctx || (gl as any)?.context
          const reallyLost = ctx?.isContextLost ? ctx.isContextLost() : true
          if (reallyLost) setReadyPartial({ webglContextLost: true })
        } catch {
          setReadyPartial({ webglContextLost: true })
        }
      }, 120)
    }
    const onRestored = () => {
      try { console.info('[RenderReady] WebGL context restored (epoch=' + myEpoch + ')') } catch {}
      if (lostDebounceRef.current !== null) {
        clearTimeout(lostDebounceRef.current)
        lostDebounceRef.current = null
      }
      if (!mountedRef.current || epochRef.current !== myEpoch) return
      // context restored 时重置 useFrame 计数守卫，保证 useFrame 重新触发 sceneMounted/firstFrame 信号
      // （避免 StrictMode 双挂载/瞬时 context 丢失后 useFrame 已进入稳定阶段不再触发条件分支）
      frameCountRef.current = 0
      sceneMountedFiredRef.current = false
      firstFrameFiredRef.current = false
      try {
        if (IS_DEV) {
          // 乐观标记 sceneMounted=true，避免 useFrame 下一次触发前有 1-2 帧窗口错过就绪检查
          setReadyPartial({ webglContextLost: false, sceneMounted: true })
        }
      } catch {
        setReadyPartial({ webglContextLost: false })
      }
    }
    canvas.addEventListener('webglcontextlost', onLost as EventListener)
    canvas.addEventListener('webglcontextrestored', onRestored as EventListener)
    try {
      const ctx = (gl as any)?.ctx || (gl as any)?.context
      const lost = ctx?.isContextLost ? ctx.isContextLost() : false
      if (lost) {
        setTimeout(() => {
          if (!mountedRef.current || epochRef.current !== myEpoch) return
          try {
            const ctx2 = (gl as any)?.ctx || (gl as any)?.context
            const stillLost = ctx2?.isContextLost ? ctx2.isContextLost() : true
            if (stillLost) setReadyPartial({ webglContextLost: true })
          } catch { setReadyPartial({ webglContextLost: true }) }
        }, 150)
      } else {
        setReadyPartial({ webglContextLost: false })
      }
    } catch { /* ignore */ }
    return () => {
      if (lostDebounceRef.current !== null) {
        clearTimeout(lostDebounceRef.current)
        lostDebounceRef.current = null
      }
      canvas.removeEventListener('webglcontextlost', onLost as EventListener)
      canvas.removeEventListener('webglcontextrestored', onRestored as EventListener)
    }
  }, [gl])

  // 2. 模型加载统计订阅 → 写入 ready signal
  useEffect(() => {
    if (!IS_DEV) return
    const unsub = subscribeModelLoad((s) => {
      statsRef.current = s
      setReadyPartial({
        modelTotal: s.total,
        modelPending: s.inflight,
        modelLoaded: s.loaded,
        modelFailed: s.failed,
      })
    })
    try {
      const init = getModelStatsSnap()
      if (init) {
        setReadyPartial({
          modelTotal: init.total || 0,
          modelPending: init.inflight || 0,
          modelLoaded: init.loaded || 0,
          modelFailed: init.failed || 0,
        })
      }
    } catch { /* ignore */ }
    return unsub
  }, [])

  // 3. 首帧标记 + sceneMounted（使用 >=N + 单独 ref 守卫保证只触发一次 setReadyPartial，
  //    避免 StrictMode 假 unmount 后 frameCount 再次从 0 开始时遇到 count===1 丢失）
  useFrame(() => {
    frameCountRef.current += 1
    // 注：setReadyPartial 内部已经做了 env?.DEV + window 守卫，这里无需额外判断，避免双守卫嵌套导致
    //     useFrame 内的就绪信号写入失效。
    if (!sceneMountedFiredRef.current && frameCountRef.current >= 1) {
      sceneMountedFiredRef.current = true
      setReadyPartial({ sceneMounted: true })
    }
    if (!firstFrameFiredRef.current && frameCountRef.current >= 3) {
      firstFrameFiredRef.current = true
      setReadyPartial({ firstFrameRendered: true })
    }
    // 兜底：每 6 帧（约 100ms@60fps）强制同步一次 sceneMounted + firstFrame + WebGL 状态
    // 之前 60 帧间隔过长，context lost 事件丢失后最长 1 秒才会被检测到，
    // 导致白屏检测窗口里仍报告 webglContextLost=false。
    if (frameCountRef.current % 6 === 0) {
      setReadyPartial({
        sceneMounted: frameCountRef.current >= 1,
        firstFrameRendered: frameCountRef.current >= 3,
      })
      // 周期性查询真实 context 状态，避免 context lost/restored 事件丢失后误报
      try {
        const ctx = (gl as any)?.ctx || (gl as any)?.context
        const reallyLost = ctx?.isContextLost ? Boolean(ctx.isContextLost()) : false
        setReadyPartial({ webglContextLost: reallyLost })
      } catch {
        // ignore
      }
    }
  })

  return null
}

function SceneContents({ onEntityClick, onContainerClick }: Scene3DProps) {
  // ⚠️ 顶层只订阅 phase / task 两个字段，用于阶段路由。
  // 其他字段（entities/robotPosition/...）只在 PlayingSceneContents 内部订阅。
  // 顶层组件里不渲染任何 useFrame 组件，保证 briefing 阶段干净。
  const phase = useGameStore((s) => s.phase)
  const task = useGameStore((s) => s.task)

  const isBriefingMode = phase === 'idle' || phase === 'briefing' || !task

  if (isBriefingMode) {
    return <BriefingScene />
  }

  return <PlayingSceneContents onEntityClick={onEntityClick} onContainerClick={onContainerClick} />
}

export function Scene3D(props: Scene3DProps) {
  // 每次进入场景重置模型加载统计，避免跨路由重入时累加失真（必须放在任何 early return 之前，保证 hooks 调用顺序一致）
  useEffect(() => { resetModelLoadStats() }, [])
  // §十：?assetCalibration=1 仅 DEV 显示完整校准页；生产路径永远不进入。
  if (shouldShowAssetCalibration()) {
    return <AssetCalibrationView />
  }
  return (
    <div
      style={{
        width: '100%', height: '100%', minHeight: '100%', position: 'relative',
        // 外层 div 也设背景，三重保险：
        // 1) Canvas <color attach=background> 2) Canvas style background 3) 外层 div background
        // 任何 WebGL context lost / Suspense fallback 期间都不会露出浏览器默认白底
        backgroundColor: '#0f152a',
      }}
      data-testid="scene3d-root"
    >
      <Canvas
        id="arena-canvas"
        shadows={{ type: THREE.PCFShadowMap }}
        // preserveDrawingBuffer=true：允许 DEV 下 gl.readPixels 检查像素实际内容；
        // 性能略有影响，但保证白屏检测脚本总能读到真实 pixel RGBA，避免读到透明。
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        camera={{ position: [0, 1.7, 3], rotation: [0, Math.PI, 0], fov: 75, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        style={{
          background: '#0f152a',
          display: 'block',
          width: '100%',
          height: '100%',
          // 任何情况下 canvas 可见性 / 不透明度 不能为 0
          visibility: 'visible',
          opacity: 1,
        }}
      >
        <SceneContents {...props} />
      </Canvas>
      <ModelLoadProgressHud />
    </div>
  )
}

/**
 * B1：模型加载进度 HUD（DOM 叠加，不进入 R3F 场景树）。
 * - 显示 N / total + 进度条；
 * - 失败 >0 时转橙红色并显示失败数；DEV 下显示失败 ids；
 * - 全部完成（loaded+failed>=total && inflight===0 && total>0）后 2s 自动隐藏，之后按 L 键可再次切换；
 * - PROD：仅在有 inflight / failed 时显示；DEV：只要 total>0 或按 L 切换。
 */
function ModelLoadProgressHud() {
  const [stats, setStats] = useState<ModelLoadStats>(() => ({
    total: 0, loaded: 0, failed: 0, inflight: 0, failedIds: [],
  }))
  const [forceShown, setForceShown] = useState(false)
  const [autoHidden, setAutoHidden] = useState(false)
  const phase = useGameStore((s) => s.phase)

  // 每次场景挂载/卸载时重置计数器（防止跨路由重入时累加）。
  // 注意：phase 从 idle/briefing 进入 playing 时 Scene3D 不会 unmount（SceneContents 只切换子组件），
  // 所以这里只在真正挂载时 reset 一次；PlayingSceneContents 内的模型加载使用相同 epoch，
  // BriefingScene 的模型加载 cleanup 仍可通过 prevKey epoch 匹配 inflight 闭合。
  useEffect(() => { resetModelLoadStats() }, [])

  // HUD 重置逻辑：仅当从 idle/briefing *首次进入任务流程* 时，不 reset（避免 BriefingScene 的
  // 模型 start/done epoch 被断开导致 inflight 悬挂）。改为每次 HUD 组件挂载时 reset。
  // 这里把 reset 移到下面独立的 HUD 挂载 effect。
  useEffect(() => {
    if (phase === 'idle') {
      setAutoHidden(false)
    }
  }, [phase])

  useEffect(() => {
    return subscribeModelLoad(setStats)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e) return
      // L 键切换显示；Cmd/Ctrl/Alt/Meta + L 放过（浏览器地址栏等）
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const key = String(e.key || '').toLowerCase()
      if (key === 'l') {
        setForceShown((v) => !v)
        setAutoHidden(false)
      }
      // Shift+R 重置统计（方便手动复位）
      if (key === 'r' && e.shiftKey) {
        resetModelLoadStats()
        setAutoHidden(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // 全部 settle 后 2s 自动隐藏
  const settled = stats.total > 0 && stats.inflight === 0 && stats.loaded + stats.failed >= stats.total
  useEffect(() => {
    if (!settled) return
    const t = setTimeout(() => setAutoHidden(true), 2000)
    return () => clearTimeout(t)
  }, [settled])

  const hasProgress = stats.total > 0
  const stillLoading = stats.inflight > 0 || stats.failed > 0
  const shouldShow = forceShown || (hasProgress && (stillLoading || IS_DEV))
  if (!shouldShow || autoHidden) return null

  const pct = stats.total > 0 ? Math.min(100, Math.round((stats.loaded + stats.failed) * 100 / stats.total)) : 0
  const barColor = stats.failed > 0 ? '#f59e0b' : '#10b981'
  const barBg = stats.failed > 0 ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)'
  const borderColor = stats.failed > 0 ? 'rgba(245,158,11,0.35)' : 'rgba(16,185,129,0.25)'

  const failuresUnique = Array.from(new Set(stats.failedIds)).slice(0, 8)

  return (
    <div
      style={{
        position: 'absolute',
        left: 12,
        bottom: 12,
        zIndex: 10,
        pointerEvents: 'none',
        width: 280,
        padding: '8px 10px',
        borderRadius: 8,
        background: 'rgba(15,21,42,0.72)',
        border: `1px solid ${borderColor}`,
        backdropFilter: 'blur(4px)',
        color: '#e5e7eb',
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        fontSize: 12,
        lineHeight: 1.35,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontWeight: 600, letterSpacing: 0.2 }}>Models</span>
        <span style={{ opacity: 0.7 }}>
          {stats.loaded}/{stats.total}
          {stats.failed > 0 && <span style={{ color: '#fbbf24', marginLeft: 6 }}>fail {stats.failed}</span>}
          {stats.inflight > 0 && <span style={{ opacity: 0.7, marginLeft: 6 }}>…{stats.inflight}</span>}
        </span>
      </div>
      <div
        style={{
          width: '100%',
          height: 6,
          background: barBg,
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: barColor,
            transition: 'width 200ms linear',
          }}
        />
      </div>
      {IS_DEV && failuresUnique.length > 0 && (
        <div
          style={{
            marginTop: 6,
            fontSize: 10.5,
            color: '#fcd34d',
            opacity: 0.9,
            wordBreak: 'break-all',
          }}
          title={failuresUnique.join(', ')}
        >
          fallback ids: {failuresUnique.join(', ')}
          {stats.failedIds.length > failuresUnique.length ? ` +${stats.failedIds.length - failuresUnique.length}` : ''}
        </div>
      )}
      <div
        style={{
          marginTop: 4,
          fontSize: 10,
          opacity: 0.5,
        }}
      >
        [L] show/hide · [Shift+R] reset
      </div>
    </div>
  )
}
