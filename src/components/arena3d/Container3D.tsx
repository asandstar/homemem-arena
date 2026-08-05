import { useRef, useState, useMemo, useEffect } from 'react'
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
  refrigerator: 'fridge',
  cabinet: 'cabinet',
  'upper-cabinet': 'cabinet',
  'lower-cabinet': 'cabinet',
  'cabinet-upper': 'cabinet',
  'cabinet-lower': 'cabinet',
  sink: 'sink',
  dishwasher: 'dishwasher',
  'trash-bin': 'laundry_basket',
  'trash_bin': 'laundry_basket',
  trashcan: 'laundry_basket',
  trash_can: 'laundry_basket',
  sofa: 'sofa',
  couch: 'sofa',
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
  entray: 'entrance_tray',
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
  // ⚠️ A2：dining_table.glb 不存在（MODEL_REGISTRY 未注册），
  // 映射到已有的 coffee_table，避免渲染出钥匙大小的方块。
  table: 'coffee_table',
  'dining-table': 'coffee_table',
  'dining_table': 'coffee_table',
  diningtable: 'coffee_table',
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
  const pulseRingRef = useRef<THREE.Mesh>(null)
  const pulseRing2Ref = useRef<THREE.Mesh>(null)
  const pulseLightRef = useRef<THREE.PointLight>(null)
  const [hovered, setHovered] = useState(false)
  // ⚠️ pulseTime / openProgress 改 ref，之前每帧 setState 触发每个 Container3D 实例每帧 re-render（~60fps）
  // 容器多时是性能瓶颈，间接增加 WebGL Context Lost 风险。
  const pulseTimeRef = useRef(0)
  const openProgressRef = useRef(isOpen ? 1 : 0)
  // ⚠️ 仅当开/关动画进度真的变化时，才 setState 触发一次重渲染，
  // 让 <group> 的 scale/position / 内部物品位置 在下一帧能读到最新值。
  // 收敛后（next === prev）停止更新，不再有多余 re-render。
  const [, setOpenTick] = useState(0)

  // ⚠️ 用单字段 selector 避免 getSnapshot 引用变化 → 无限循环
  const robotPosition = useGameStore((s) => s.robotPosition)
  const heldEntityId = useGameStore((s) => s.heldEntityId)

  // isOpen 变化时同步目标值（ref + 强制下次 useFrame 插值进入新值）
  useEffect(() => {
    openProgressRef.current = isOpen ? 1 : 0
  }, [isOpen])

  useFrame((_, delta) => {
    pulseTimeRef.current += delta
    const prev = openProgressRef.current
    const target = isOpen ? 1 : 0
    const speed = 6
    let next = prev
    if (prev < target) next = Math.min(1, prev + delta * speed)
    else if (prev > target) next = Math.max(0, prev - delta * speed)
    openProgressRef.current = next
    if (Math.abs(next - prev) > 0.001) setOpenTick((t) => (t + 1) & 0xffff)

    // 脉动光环：直接更新 three 对象的 scale / material，不走 React re-render
    const pt = pulseTimeRef.current
    const sin4 = Math.sin(pt * 4)
    const sin3 = Math.sin(pt * 3)
    if (pulseRing2Ref.current) {
      pulseRing2Ref.current.scale.setScalar(1 + sin4 * 0.1)
      const mat2 = pulseRing2Ref.current.material as THREE.MeshBasicMaterial
      if (mat2 && !Array.isArray(mat2)) {
        mat2.opacity = 0.4 + sin4 * 0.2
      }
    }
    if (pulseLightRef.current) {
      pulseLightRef.current.intensity = 0.6 + sin3 * 0.2
    }
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
    if (!inRange) return 0
    if (distance <= 1.5) return 1
    return (2.5 - distance) / 1.0
  }, [distance, inRange])

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    onClick?.(spec)
  }

  const modelId = getModelIdFromContainerId(spec.id)
  const surfaceY = getContainerSurfaceY(spec)
  const surfaceLocalY = surfaceY - spec.position.y

  return (
    <group ref={groupRef} position={worldPos}>
      {inRange && !spec.isTargetZone && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[spec.size.x * 0.55, spec.size.x * 0.7, 32]} />
          <meshBasicMaterial color={PALETTE.target.primary} transparent opacity={0.2 + proximityGlow * 0.2} />
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
        scale={[1 + openProgressRef.current * 0.03, 1 + openProgressRef.current * 0.02, 1 + openProgressRef.current * 0.03]}
        position={[0, openProgressRef.current * 0.02, 0]}
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
            ref={pulseRingRef as any}
            position={[0, surfaceLocalY + 0.1, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.4, 0.5, 24]} />
            <meshBasicMaterial
              color={PALETTE.target.primary}
              transparent
              opacity={0.5}
            />
          </mesh>
          <mesh
            ref={pulseRing2Ref as any}
            position={[0, surfaceLocalY + 0.1, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.35, 0.55, 24]} />
            <meshBasicMaterial
              color={PALETTE.target.highlight}
              transparent
              opacity={0.5}
            />
          </mesh>
          <pointLight
            ref={pulseLightRef as any}
            position={[0, surfaceLocalY + 0.15, 0]}
            color={PALETTE.target.primary}
            intensity={0.8}
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
          position={[0, surfaceLocalY + 0.02 + (1 - openProgressRef.current) * 0.2, spec.size.z / 2 + 0.1]}
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
