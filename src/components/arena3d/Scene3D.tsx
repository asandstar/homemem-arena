import { useMemo, useRef } from 'react'
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
    dining: { color: ROOM_AMBIENT_COLORS.dining, intensity: 0.55, positionOffset: [0, 2.8, 0], distance: 12 },
  }

  return (
    <group>
      {Object.entries(rooms).map(([id, room]) => {
        const config = roomLightConfig[id as RoomId]
        const isCurrentRoom = id === currentRoom
        const intensity = isCurrentRoom ? config.intensity : config.intensity * 0.15
        
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
  const { heldEntityId, entities, viewMode } = useGameStore()
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

function SceneContents({ onEntityClick, onContainerClick }: Scene3DProps) {
  const { phase, task, entities, containerStates, currentRoom, robotPosition, robotRotation, heldEntityId, chaosEffectActive, activeEventEffects, tickElapsed, lastMoveAnimation, chaosValue } = useGameStore()
  const { addEvent } = useSessionStore()

  const observationTimer = useRef(0)
  const lastObservedIds = useRef<Set<string>>(new Set())

  useFrame((_, delta) => {
    if (phase !== 'playing') return
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
    if (!task) return []
    return task.rooms.map((id) => sharedRooms[id]).filter(Boolean)
  }, [task])

  if (!task) return null

  return (
    <>
      <ambientLight intensity={0.15} color={PALETTE.ambient.neutral} />
      
      <directionalLight
        position={[8, 15, 8]}
        intensity={0.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
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

      {entities
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

      {task.containers
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
    </>
  )
}

export function Scene3D(props: Scene3DProps) {
  return (
    <Canvas
      id="arena-canvas"
      shadows={{ type: THREE.PCFShadowMap }}
      camera={{ position: [0, 1.6, 0], fov: 75, near: 0.1, far: 100 }}
      style={{ background: '#1f2937' }}
    >
      <SceneContents {...props} />
    </Canvas>
  )
}
