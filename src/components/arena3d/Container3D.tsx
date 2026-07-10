import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { Text, Billboard } from '@react-three/drei'
import type { ContainerSpec } from '../../types/object'
import type { RoomId } from '../../types/room'
import type { EntityState } from '../../types/object'
import { sharedRooms } from '../../data/rooms'
import { CATEGORY_TO_MODEL_ID } from './modelIds'
import { PALETTE } from './colors'
import { FurnitureModel } from './models/FurnitureModel'
import { PropModel } from './models/PropModel'
import { useGameStore } from '../../store/useGameStore'
import { getContainerSurfaceY, getEntityHalfHeight } from '../../game/placement'

interface Container3DProps {
  spec: ContainerSpec
  room: RoomId
  isOpen: boolean
  onClick?: (spec: ContainerSpec) => void
  containedObjects?: EntityState[]
}

const CONTAINER_TO_MODEL_ID: Record<string, string> = {
  fridge: 'fridge',
  cabinet: 'cabinet',
  'upper-cabinet': 'cabinet',
  'lower-cabinet': 'cabinet',
  'cabinet-upper': 'cabinet',
  'cabinet-lower': 'cabinet',
  sink: 'sink',
  dishwasher: 'dishwasher',
  'trash-bin': 'laundry_basket',
  'trash_bin': 'laundry_basket',
  sofa: 'sofa',
  'coffee-table': 'coffee_table',
  'coffee_table': 'coffee_table',
  bed: 'bed',
  desk: 'desk',
  'laundry-basket': 'laundry_basket',
  'laundry_basket': 'laundry_basket',
  basket: 'laundry_basket',
  'entrance-tray': 'entrance_tray',
  'entrance_tray': 'entrance_tray',
  tray: 'entrance_tray',
  'shoe-cabinet': 'cabinet',
  wardrobe: 'cabinet',
  nightstand: 'cabinet',
  'bedside-drawer': 'cabinet',
  'bedside_drawer': 'cabinet',
  drawer: 'cabinet',
  'tv-stand': 'cabinet',
  'tv_stand': 'cabinet',
  shelf: 'cabinet',
  counter: 'cabinet',
  'kitchen-counter': 'cabinet',
  'kitchen_counter': 'cabinet',
  table: 'coffee_table',
  'dining-table': 'coffee_table',
  'dining_table': 'coffee_table',
  stand: 'cabinet',
  'umbrella-stand': 'cabinet',
  'umbrella_stand': 'cabinet',
}

function getModelIdFromContainerId(containerId: string): string {
  for (const [key, modelId] of Object.entries(CONTAINER_TO_MODEL_ID)) {
    if (containerId.includes(key)) {
      return modelId
    }
  }
  return 'cabinet'
}

export function Container3D({
  spec,
  room,
  isOpen,
  onClick,
  containedObjects = [],
}: Container3DProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const [pulseTime, setPulseTime] = useState(0)
  const [openProgress, setOpenProgress] = useState(isOpen ? 1 : 0)

  const { robotPosition, heldEntityId } = useGameStore()

  useFrame((_, delta) => {
    setPulseTime((prev) => prev + delta)
    setOpenProgress((prev) => {
      const target = isOpen ? 1 : 0
      const speed = 6
      if (prev < target) return Math.min(1, prev + delta * speed)
      if (prev > target) return Math.max(0, prev - delta * speed)
      return prev
    })
  })

  const roomSpec = sharedRooms[room]
  // furniture bottom is spec.position.y; FurnitureModel offsets geometry down by size.y/2
  const worldPos = useMemo<[number, number, number]>(() => [
    roomSpec.center.x + spec.position.x,
    spec.position.y,
    roomSpec.center.z + spec.position.z,
  ], [roomSpec.center.x, roomSpec.center.z, spec.position.x, spec.position.y, spec.position.z])
  const distance = useMemo(() => {
    const dx = worldPos[0] - robotPosition.x
    const dz = worldPos[2] - robotPosition.z
    return Math.sqrt(dx * dx + dz * dz)
  }, [worldPos, robotPosition])

  const inRange = distance < 2.5

  const proximityGlow = useMemo(() => {
    if (distance >= 4.0) return 0
    if (distance <= 1.0) return 1
    return (4.0 - distance) / 3.0
  }, [distance])

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    onClick?.(spec)
  }

  const modelId = getModelIdFromContainerId(spec.id)
  const surfaceY = getContainerSurfaceY(spec)
  const surfaceLocalY = surfaceY - spec.position.y

  return (
    <group ref={groupRef} position={worldPos}>
      {proximityGlow > 0.01 && !spec.isTargetZone && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[spec.size.x * 0.55, spec.size.x * 0.7, 32]} />
          <meshBasicMaterial color={PALETTE.status.info} transparent opacity={0.1 + proximityGlow * 0.15} />
        </mesh>
      )}
      <group
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'auto'
        }}
        scale={[1 + openProgress * 0.03, 1 + openProgress * 0.02, 1 + openProgress * 0.03]}
        position={[0, openProgress * 0.02, 0]}
      >
        <FurnitureModel
          modelId={modelId}
          color={spec.color}
          hovered={hovered}
          isOpen={isOpen}
          isTarget={spec.isTargetZone || false}
          size={spec.size}
        />
      </group>

      {spec.isTargetZone && (
        <>
          <mesh
            position={[0, surfaceLocalY + 0.1, 0]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.4, 0.5, 24]} />
            <meshBasicMaterial
              color={PALETTE.target.primary}
              transparent
              opacity={0.5}
            />
          </mesh>
          <mesh
            position={[0, surfaceLocalY + 0.1, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[
              1 + Math.sin(pulseTime * 4) * 0.1,
              1 + Math.sin(pulseTime * 4) * 0.1,
              1,
            ]}
          >
            <ringGeometry args={[0.35, 0.55, 24]} />
            <meshBasicMaterial
              color={PALETTE.target.highlight}
              transparent
              opacity={0.4 + Math.sin(pulseTime * 4) * 0.2}
            />
          </mesh>
          <pointLight
            position={[0, surfaceLocalY + 0.15, 0]}
            color={PALETTE.target.primary}
            intensity={0.6 + Math.sin(pulseTime * 3) * 0.2}
            distance={2}
          />
        </>
      )}

      {(hovered || spec.isTargetZone) && (
        <Billboard position={[0, surfaceLocalY + 0.25, 0]}>
          <mesh>
            <boxGeometry args={[0.65, 0.22, 0.01]} />
            <meshBasicMaterial color="#1f2937" transparent opacity={0.9} />
          </mesh>
          <Text
            position={[0, 0.06, 0.005]}
            fontSize={0.09}
            color={spec.isTargetZone ? '#f59e0b' : '#ffffff'}
            anchorX="center"
            anchorY="middle"
          >
            {spec.targetLabel ?? spec.name}
          </Text>
          <Text
            position={[0, -0.01, 0.005]}
            fontSize={0.05}
            color="#9ca3af"
            anchorX="center"
            anchorY="middle"
          >
            {distance.toFixed(1)}m
          </Text>
          {inRange && (
            <Text
              position={[0, -0.06, 0.005]}
              fontSize={0.05}
              color={heldEntityId ? '#f59e0b' : '#10b981'}
              anchorX="center"
              anchorY="middle"
            >
              [F] {heldEntityId ? '放置' : (isOpen ? '关闭' : '打开')}
            </Text>
          )}
        </Billboard>
      )}

      {isOpen && containedObjects.length > 0 && (
        <group
          position={[0, surfaceLocalY + 0.02 + (1 - openProgress) * 0.2, spec.size.z / 2 + 0.1]}
        >
          {containedObjects.map((obj, index) => {
            const offsetX = (index % 3 - 1) * 0.2
            const modelId = CATEGORY_TO_MODEL_ID[String(obj.category)] || 'cup'
            const objHalfHeight = getEntityHalfHeight(obj)
            return (
              <group key={obj.id} position={[offsetX, objHalfHeight + 0.01, 0]}>
                <PropModel
                  modelId={modelId}
                  color={obj.color}
                  size={obj.size}
                />
              </group>
            )
          })}
        </group>
      )}
    </group>
  )
}
