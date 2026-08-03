import { useMemo, useRef, useEffect, useState } from 'react'
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
import { PALETTE, ROOM_AMBIENT_COLORS } from './colors'
import { CatPrintsEffect } from './feedback/CatPrintsEffect'
import { CatShadowEffect } from './feedback/CatShadowEffect'
import { PhoneRingEffect } from './feedback/PhoneRingEffect'
import { ParticleRenderer } from './effects/ParticleRenderer'
import { PropModel } from './models/PropModel'
import { CATEGORY_TO_MODEL_ID } from './modelIds'
import { PixelationPass } from './effects/PixelationPass'
import { subscribeModelLoad, type ModelLoadStats, resetModelLoadStats } from './models/ModelAsset'
import * as THREE from 'three'

interface Scene3DProps {
  onEntityClick: (entityId: string) => void
  onContainerClick: (containerId: string) => void
}

function RoomLights({ rooms, currentRoom }: { rooms: typeof sharedRooms; currentRoom: RoomId }) {
  const roomLightConfig: Record<RoomId, { color: string; intensity: number; positionOffset: [number, number, number]; distance: number }> = {
    living: { color: ROOM_AMBIENT_COLORS.living, intensity: 0.5, positionOffset: [0, 2.8, 0], distance: 12 },
    bedroom: { color: ROOM_AMBIENT_COLORS.bedroom, intensity: 0.4, positionOffset: [0, 2.8, 0], distance: 10 },
    kitchen: { color: ROOM_AMBIENT_COLORS.kitchen, intensity: 0.45, positionOffset: [0, 2.8, 0], distance: 12 },
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

    const offset = new THREE.Vector3(0.3, -0.25, -0.5)
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

  return (
    <group ref={groupRef}>
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
  const lastMoveAnimation = useGameStore((s) => s.lastMoveAnimation)
  const chaosValue = useGameStore((s) => s.chaosValue)
  const addEvent = useSessionStore((s) => s.addEvent)

  const observationTimer = useRef(0)
  const lastObservedIds = useRef<Set<string>>(new Set())

  useFrame((_, delta) => {
    tickElapsed(delta * 1000)
    observationTimer.current += delta
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
      {!(import.meta.env.MODE === 'e2e' || import.meta.env.VITE_E2E === 'true') && <PixelationPass pixelSize={4} />}
    </>
  )
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
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 0, position: 'relative' }}>
      <Canvas
        id="arena-canvas"
        shadows={{ type: THREE.PCFShadowMap }}
        gl={{ preserveDrawingBuffer: false, antialias: true }}
        camera={{ position: [0, 1.7, 3], rotation: [0, Math.PI, 0], fov: 75, near: 0.1, far: 100 }}
        // Canvas CSS 背景与内部 <color attach="background"> 保持一致（0.059,0.082,0.165 ≈ #0f152a），
        // 双重保险避免 R3F Suspense/Error 期间露出父级白色
        dpr={[1, 2]}
        style={{ background: '#0f152a' }}
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

  // 每次场景从 idle/briefing 进入 playing 时重置计数器（防止跨任务累计）
  useEffect(() => {
    if (phase === 'idle' || phase === 'briefing') {
      resetModelLoadStats()
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

  const IS_DEV = !!(import.meta as any).env?.DEV
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
