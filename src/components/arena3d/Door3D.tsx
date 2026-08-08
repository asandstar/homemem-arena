import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from '../../store/useGameStore'
import { sharedRooms } from '../../data/rooms'
import type { RoomId } from '../../types/room'
import { doorKey } from '../../store/slices/playerSlice'

const DOOR_INTERACT_DISTANCE = 2.5
const DOOR_SLIDE_DISTANCE_RATIO = 0.94

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

export function Door3D({ roomId, roomCenter, roomSize, door }: Door3DProps) {
  const emissiveRef = useRef(0.3)
  const [showHint, setShowHint] = useState(false)
  const viewMode = useGameStore((state) => state.viewMode)

  // 复用 Vector3 避免每帧 GC
  const tmpPlayerPos = useRef(new THREE.Vector3())
  const tmpDoorPos = useRef(new THREE.Vector3())

  const key = useMemo(() => doorKey(roomId, door.connectsTo as RoomId), [roomId, door.connectsTo])
  const isOpen = useGameStore((state) => !!state.doorOpenStates?.[key])

  const { position, rotation, hingeX, doorWidth, doorHeight, slideSign } = useMemo(() => {
    const dx = door.offset.x
    const dz = door.offset.z
    const ww = door.width
    const hh = door.height
    const isOnXWall = Math.abs(dx) > Math.abs(dz)
    const isPositiveSide = isOnXWall ? dx > 0 : dz > 0

    const dw = ww - 0.06
    const dh = hh - 0.04
    const halfD = dw / 2

    let posX: number, posZ: number, rotY: number, hingeLocalX: number, slide: number

    if (isOnXWall) {
      posX = roomCenter.x + (isPositiveSide ? roomSize.x / 2 : -roomSize.x / 2)
      posZ = roomCenter.z + dz
      rotY = Math.PI / 2
      hingeLocalX = halfD
      slide = isPositiveSide ? -1 : 1
    } else {
      posX = roomCenter.x + dx
      posZ = roomCenter.z + (isPositiveSide ? roomSize.z / 2 : -roomSize.z / 2)
      rotY = 0
      hingeLocalX = halfD
      slide = isPositiveSide ? -1 : 1
    }

    return {
      position: { x: posX, y: dh / 2, z: posZ },
      rotation: rotY,
      hingeX: hingeLocalX,
      doorWidth: dw,
      doorHeight: dh,
      slideSign: slide,
    }
  }, [roomCenter, roomSize, door])

  const targetRoomName = sharedRooms[door.connectsTo as keyof typeof sharedRooms]?.name || door.connectsTo
  const doorFrameColor = '#38bdf8'

  useFrame((_, delta) => {
    const state = useGameStore.getState()
    tmpPlayerPos.current.set(state.robotPosition.x, 0, state.robotPosition.z)
    tmpDoorPos.current.set(position.x, 0, position.z)
    const distance = tmpPlayerPos.current.distanceTo(tmpDoorPos.current)

    // 门开关状态由 store 管理（玩家按 F 切换），非任务房间的门不可交互
    const taskRooms = state.task?.rooms
    const isTaskRelevant = !taskRooms || taskRooms.includes(door.connectsTo as RoomId)
    const isOpenForTask = isTaskRelevant && isOpen
    const isNearby = isTaskRelevant && distance < DOOR_INTERACT_DISTANCE

    // 发光：开门中或可交互（附近）时高亮
    const glowTarget = isOpenForTask ? 0.8 : isNearby ? 0.6 : 0.3
    emissiveRef.current += (glowTarget - emissiveRef.current) * Math.min(1, delta * 5)

    // 显示"按 F 开门"提示：附近 + 门关着 + 任务相关
    const shouldShowHint = isNearby && !isOpenForTask
    if (shouldShowHint !== showHint) {
      setShowHint(shouldShowHint)
    }
  })

  const frameThickness = 0.08
  const frameDepth = 0.22
  const doorThickness = 0.06
  const halfW = doorWidth / 2

  return (
    <group position={[position.x, position.y, position.z]} rotation={[0, rotation, 0]}>
      {/* 门板组：打开时沿墙滑开，不再向玩家视野内旋转。 */}
      <group
        position={[
          hingeX + (isOpen ? doorWidth * DOOR_SLIDE_DISTANCE_RATIO * slideSign : 0),
          0,
          0,
        ]}
      >
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
        <boxGeometry args={[frameThickness, doorHeight + frameThickness, frameDepth]} />
        <meshStandardMaterial
          color={doorFrameColor}
          emissive={doorFrameColor}
          emissiveIntensity={emissiveRef.current}
        />
      </mesh>
      {/* 门框 - 右 */}
      <mesh position={[halfW + frameThickness / 2, 0, 0]}>
        <boxGeometry args={[frameThickness, doorHeight + frameThickness, frameDepth]} />
        <meshStandardMaterial
          color={doorFrameColor}
          emissive={doorFrameColor}
          emissiveIntensity={emissiveRef.current}
        />
      </mesh>
      {/* 门框 - 上 */}
      <mesh position={[0, doorHeight / 2 + frameThickness / 2, 0]}>
        <boxGeometry args={[doorWidth + frameThickness * 2, frameThickness, frameDepth]} />
        <meshStandardMaterial
          color={doorFrameColor}
          emissive={doorFrameColor}
          emissiveIntensity={emissiveRef.current}
        />
      </mesh>

      {/* 门槛补足洞口厚度，让开门状态读作门洞而不是墙面被挖空。 */}
      <mesh position={[0, -doorHeight / 2 + 0.025, 0]} receiveShadow>
        <boxGeometry args={[doorWidth + frameThickness * 2, 0.05, frameDepth]} />
        <meshStandardMaterial color="#c6a978" roughness={0.8} />
      </mesh>

      {/* 地面箭头（门关着时显示，提示此处有门） */}
      {/* 房间名标签 */}
      {viewMode === 'first-person' && (
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
      )}

      {/* "按 F 开门"提示（靠近且门关着时显示） */}
      {showHint && viewMode === 'first-person' && (
        <Billboard position={[0, doorHeight / 2 + 0.65, 0]}>
          <Text
            fontSize={0.1}
            color="#fbbf24"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#1f2937"
          >
            按 F 开门
          </Text>
        </Billboard>
      )}
    </group>
  )
}
