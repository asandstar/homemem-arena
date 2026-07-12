import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from '../../store/useGameStore'
import { sharedRooms } from '../../data/rooms'
import type { RoomId } from '../../types/room'

const DOOR_OPEN_DISTANCE = 2.5
const DOOR_OPEN_ANGLE = Math.PI * 0.48
const DOOR_OPEN_SPEED = 4.0
const DOOR_CLOSE_SPEED = 2.5
const DOOR_CLOSE_DELAY = 1.5

interface Door3DProps {
  roomId: RoomId
  roomCenter: { x: number; z: number }
  roomSize: { x: number; z: number }
  door: {
    offset: { x: number; y: number; z: number }
    width: number
    height: number
    connectsTo: string
  }
}

export function Door3D({ roomCenter, roomSize, door }: Door3DProps) {
  const doorGroupRef = useRef<THREE.Group>(null)
  const currentAngleRef = useRef(0)
  const targetAngleRef = useRef(0)
  const closeTimerRef = useRef(0)
  const emissiveRef = useRef(0.3)

  // 复用 Vector3 避免每帧 GC
  const tmpPlayerPos = useRef(new THREE.Vector3())
  const tmpDoorPos = useRef(new THREE.Vector3())

  const { position, rotation, hingeX, doorWidth, doorHeight, swingSign } = useMemo(() => {
    const dx = door.offset.x
    const dz = door.offset.z
    const ww = door.width
    const hh = door.height
    const isOnXWall = Math.abs(dx) > Math.abs(dz)
    const isPositiveSide = isOnXWall ? dx > 0 : dz > 0

    const dw = ww - 0.06
    const dh = hh - 0.04
    const halfD = dw / 2

    let posX: number, posZ: number, rotY: number, hingeLocalX: number, swing: number

    if (isOnXWall) {
      // X 墙的门：墙面平行于 Z 轴，门板宽沿 Z，厚沿 X
      posX = roomCenter.x + (isPositiveSide ? roomSize.x / 2 : -roomSize.x / 2)
      posZ = roomCenter.z + dz
      // rotY=π/2 使门板宽度从 local X 转到 local Z（世界 Z）
      rotY = Math.PI / 2
      // 铰链在门洞一侧（local X 方向 = 世界 Z 方向）
      hingeLocalX = halfD
      // 向 connectsTo 方向打开：isPositiveSide=true 时 connectsTo 在 +X 方向，门应向 +X 摆
      swing = isPositiveSide ? 1 : -1
    } else {
      // Z 墙的门：墙面平行于 X 轴，门板宽沿 X，厚沿 Z
      posX = roomCenter.x + dx
      posZ = roomCenter.z + (isPositiveSide ? roomSize.z / 2 : -roomSize.z / 2)
      // rotY=0 保持门板宽度沿 local X（世界 X）
      rotY = 0
      hingeLocalX = halfD
      // 向 connectsTo 方向打开：isPositiveSide=true 时 connectsTo 在 +Z 方向
      swing = isPositiveSide ? 1 : -1
    }

    return {
      position: { x: posX, y: dh / 2, z: posZ },
      rotation: rotY,
      hingeX: hingeLocalX,
      doorWidth: dw,
      doorHeight: dh,
      swingSign: swing,
    }
  }, [roomCenter, roomSize, door])

  const targetRoomName = sharedRooms[door.connectsTo as keyof typeof sharedRooms]?.name || door.connectsTo
  const doorFrameColor = '#10b981'

  useFrame((_, delta) => {
    if (!doorGroupRef.current) return

    const state = useGameStore.getState()
    tmpPlayerPos.current.set(state.robotPosition.x, 0, state.robotPosition.z)
    tmpDoorPos.current.set(position.x, 0, position.z)
    const distance = tmpPlayerPos.current.distanceTo(tmpDoorPos.current)

    const shouldOpen = distance < DOOR_OPEN_DISTANCE

    if (shouldOpen) {
      targetAngleRef.current = DOOR_OPEN_ANGLE * swingSign
      closeTimerRef.current = DOOR_CLOSE_DELAY
    } else {
      closeTimerRef.current -= delta
      if (closeTimerRef.current <= 0) {
        targetAngleRef.current = 0
      }
    }

    const speed = targetAngleRef.current !== 0 ? DOOR_OPEN_SPEED : DOOR_CLOSE_SPEED
    const diff = targetAngleRef.current - currentAngleRef.current
    if (Math.abs(diff) > 0.001) {
      currentAngleRef.current += Math.sign(diff) * Math.min(Math.abs(diff), speed * delta)
    }

    doorGroupRef.current.rotation.y = currentAngleRef.current

    const glowTarget = shouldOpen ? 0.8 : 0.3
    emissiveRef.current += (glowTarget - emissiveRef.current) * Math.min(1, delta * 5)
  })

  const frameThickness = 0.08
  const doorThickness = 0.06
  const halfW = doorWidth / 2

  return (
    <group position={[position.x, position.y, position.z]} rotation={[0, rotation, 0]}>
      {/* 门板组 - 铰链在 hingeX 位置 */}
      <group ref={doorGroupRef} position={[hingeX, 0, 0]}>
        <mesh position={[-halfW, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[doorWidth, doorHeight, doorThickness]} />
          <meshStandardMaterial color="#8b5a2b" roughness={0.6} metalness={0.1} />
        </mesh>
        {/* 门把手 - 位于门板远离铰链的一端 */}
        <mesh position={[-doorWidth + 0.15, 0, doorThickness / 2 + 0.01]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#d4a574" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>

      {/* 门框 - 左 */}
      <mesh position={[-halfW - frameThickness / 2, 0, 0]}>
        <boxGeometry args={[frameThickness, doorHeight + frameThickness, frameThickness]} />
        <meshStandardMaterial
          color={doorFrameColor}
          emissive={doorFrameColor}
          emissiveIntensity={emissiveRef.current}
        />
      </mesh>
      {/* 门框 - 右 */}
      <mesh position={[halfW + frameThickness / 2, 0, 0]}>
        <boxGeometry args={[frameThickness, doorHeight + frameThickness, frameThickness]} />
        <meshStandardMaterial
          color={doorFrameColor}
          emissive={doorFrameColor}
          emissiveIntensity={emissiveRef.current}
        />
      </mesh>
      {/* 门框 - 上 */}
      <mesh position={[0, doorHeight / 2 + frameThickness / 2, 0]}>
        <boxGeometry args={[doorWidth + frameThickness * 2, frameThickness, frameThickness]} />
        <meshStandardMaterial
          color={doorFrameColor}
          emissive={doorFrameColor}
          emissiveIntensity={emissiveRef.current}
        />
      </mesh>

      {/* 地面箭头 */}
      <mesh position={[0, -doorHeight / 2 + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.2, 0.4, 4]} />
        <meshStandardMaterial
          color={doorFrameColor}
          emissive={doorFrameColor}
          emissiveIntensity={emissiveRef.current * 0.6}
        />
      </mesh>

      {/* 房间名标签 */}
      <Billboard position={[0, doorHeight / 2 + 0.35, 0]}>
        <Text
          fontSize={0.12}
          color={doorFrameColor}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#1f2937"
        >
          → {targetRoomName}
        </Text>
      </Billboard>
    </group>
  )
}
