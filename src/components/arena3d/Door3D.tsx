import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from '../../store/useGameStore'
import { sharedRooms } from '../../data/rooms'

const DOOR_OPEN_DISTANCE = 2.5
const DOOR_OPEN_ANGLE = Math.PI * 0.47
const DOOR_OPEN_SPEED = 4.0
const DOOR_CLOSE_SPEED = 2.5
const DOOR_CLOSE_DELAY = 1.5

interface Door3DProps {
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
  const emissiveIntensityRef = useRef(0.3)

  const { position, rotation, hingeSide, doorWidth, doorHeight } = useMemo(() => {
    const dx = door.offset.x
    const dz = door.offset.z
    const ww = door.width
    const hh = door.height

    const isOnXWall = Math.abs(dx) > Math.abs(dz)
    const isPositiveSide = isOnXWall ? dx > 0 : dz > 0
    const wallThickness = 0.1

    let posX: number, posZ: number, rotY: number
    if (isOnXWall) {
      posX = roomCenter.x + (isPositiveSide ? roomSize.x / 2 + wallThickness * 0.2 : -roomSize.x / 2 - wallThickness * 0.2)
      posZ = roomCenter.z + dz
      rotY = 0
    } else {
      posX = roomCenter.x + dx
      posZ = roomCenter.z + (isPositiveSide ? roomSize.z / 2 + wallThickness * 0.2 : -roomSize.z / 2 - wallThickness * 0.2)
      rotY = Math.PI / 2
    }

    const dw = ww - 0.06
    const dh = hh - 0.04

    return {
      position: { x: posX, y: dh / 2, z: posZ },
      rotation: rotY,
      hingeSide: isOnXWall ? (isPositiveSide ? -1 : 1) : (isPositiveSide ? 1 : -1),
      doorWidth: dw,
      doorHeight: dh,
    }
  }, [roomCenter, roomSize, door])

  const targetRoomName = sharedRooms[door.connectsTo as keyof typeof sharedRooms]?.name || door.connectsTo
  const doorFrameColor = '#10b981'

  useFrame((_, delta) => {
    if (!doorGroupRef.current) return

    const playerPos = new THREE.Vector3(
      useGameStore.getState().robotPosition.x,
      0,
      useGameStore.getState().robotPosition.z
    )
    const doorPos = new THREE.Vector3(position.x, 0, position.z)
    const distance = playerPos.distanceTo(doorPos)

    const shouldOpen = distance < DOOR_OPEN_DISTANCE

    if (shouldOpen) {
      targetAngleRef.current = DOOR_OPEN_ANGLE * hingeSide
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
      const step = Math.sign(diff) * Math.min(Math.abs(diff), speed * delta)
      currentAngleRef.current += step
    }

    doorGroupRef.current.rotation.y = currentAngleRef.current

    const glowTarget = shouldOpen ? 0.8 : 0.3
    emissiveIntensityRef.current += (glowTarget - emissiveIntensityRef.current) * Math.min(1, delta * 5)
  })

  const frameThickness = 0.08
  const doorThickness = 0.06
  const halfW = doorWidth / 2

  return (
    <group position={[position.x, position.y, position.z]} rotation={[0, rotation, 0]}>
      <group
        ref={doorGroupRef}
        position={[halfW * hingeSide * -1, 0, 0]}
      >
        <mesh
          position={[halfW * hingeSide, 0, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[doorWidth, doorHeight, doorThickness]} />
          <meshStandardMaterial color="#8b5a2b" roughness={0.6} metalness={0.1} />
        </mesh>

        <mesh
          position={[halfW * hingeSide + hingeSide * 0.15, doorHeight * 0.45, doorThickness / 2 + 0.01]}
        >
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#d4a574" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>

      <mesh position={[-halfW - frameThickness / 2, 0, 0]}>
        <boxGeometry args={[frameThickness, doorHeight + frameThickness, frameThickness]} />
        <meshStandardMaterial
          color={doorFrameColor}
          emissive={doorFrameColor}
          emissiveIntensity={emissiveIntensityRef.current}
        />
      </mesh>
      <mesh position={[halfW + frameThickness / 2, 0, 0]}>
        <boxGeometry args={[frameThickness, doorHeight + frameThickness, frameThickness]} />
        <meshStandardMaterial
          color={doorFrameColor}
          emissive={doorFrameColor}
          emissiveIntensity={emissiveIntensityRef.current}
        />
      </mesh>
      <mesh position={[0, doorHeight / 2 + frameThickness / 2, 0]}>
        <boxGeometry args={[doorWidth + frameThickness * 2, frameThickness, frameThickness]} />
        <meshStandardMaterial
          color={doorFrameColor}
          emissive={doorFrameColor}
          emissiveIntensity={emissiveIntensityRef.current}
        />
      </mesh>

      <mesh
        position={[0, -doorHeight / 2 + 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <coneGeometry args={[0.2, 0.4, 4]} />
        <meshStandardMaterial
          color={doorFrameColor}
          emissive={doorFrameColor}
          emissiveIntensity={emissiveIntensityRef.current * 0.6}
        />
      </mesh>

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
