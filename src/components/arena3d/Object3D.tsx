import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { Text, Billboard } from '@react-three/drei'
import type { EntityState } from '../../types/object'
import { PALETTE } from './colors'
import { useGameStore } from '../../store/useGameStore'
import { PropModel } from './models/PropModel'
import { snapEntityToWorld, getModelApproxHeight } from '../../game/placement'
import { CATEGORY_TO_MODEL_ID } from './modelIds'

interface Object3DProps {
  entity: EntityState
  onClick?: (entity: EntityState) => void
  isHeld?: boolean
}

const CATEGORY_LABELS: Record<string, string> = {
  milk: '牛奶',
  cereal: '麦片',
  cup: '杯子',
  bowl: '碗',
  spoon: '勺子',
  plate: '盘子',
  umbrella: '雨伞',
  jacket: '外套',
  keys: '钥匙',
  key: '钥匙',
  phone: '手机',
  wallet: '钱包',
  clothes: '衣物',
  pillow: '枕头',
  tableware: '餐具',
  remote: '遥控器',
  remote_control: '遥控器',
  towel: '毛巾',
  trash: '垃圾',
  'white-clothes': '浅色衣物',
  'dark-clothes': '深色衣物',
  tissue: '纸巾',
  'power-bank': '充电宝',
  power_bank: '充电宝',
  book: '书',
  snack: '零食',
  box: '盒子',
  cloth: '衣物',
}

export function Object3D({ entity, onClick, isHeld }: Object3DProps) {
  const groupRef = useRef<THREE.Group>(null)
  const idleTime = useRef(Math.random() * Math.PI * 2)
  const [hovered, setHovered] = useState(false)
  const [shakeTime, setShakeTime] = useState(0)
  const [successPulse, setSuccessPulse] = useState(false)
  const [pulseTime, setPulseTime] = useState(0)

  const { shakingEntityId, robotPosition, heldEntityId, task, achievedGoalIds } = useGameStore()
  const isShaking = shakingEntityId === entity.id

  const isTaskTarget = useMemo(() => {
    if (!task || entity.status === 'held' || entity.status === 'placed') return false
    return task.goals.some((goal) => {
      if (achievedGoalIds.has(goal.id)) return false
      try {
        return goal.predicate([{
          configId: entity.configId,
          status: 'placed',
          currentRoom: entity.currentRoom,
          placedIn: '___check___',
          category: entity.category,
          properties: entity.properties,
        }])
      } catch {
        return false
      }
    })
  }, [task, entity, achievedGoalIds])

  const cat = String(entity.category)

  const isDirty = entity.properties['cleanliness'] === 'dirty'
  const baseColor = (entity as any).color || (entity.properties as any)?.color || '#f87171'

  const modelId = CATEGORY_TO_MODEL_ID[cat] || 'cup'
  const categoryLabel = CATEGORY_LABELS[cat] || cat
  const modelHeight = getModelApproxHeight(modelId)
  const halfHeight = modelHeight / 2

  const glowColor = PALETTE.status.info

  const visualPosition = useMemo(() => {
    if (isHeld) return entity.position
    if (entity.status === 'hidden') return entity.position
    return snapEntityToWorld(entity, task)
  }, [entity, isHeld, task])

  const distance = useMemo(() => {
    const dx = visualPosition.x - robotPosition.x
    const dz = visualPosition.z - robotPosition.z
    return Math.sqrt(dx * dx + dz * dz)
  }, [visualPosition, robotPosition])

  const isMoving = entity.properties?._moving === true
  const inRange = distance < 2.0 && !isMoving
  const proximityGlow = useMemo(() => {
    if (isMoving || isHeld) return 0
    if (distance >= 3.0) return 0
    if (distance <= 0.8) return 1
    return (3.0 - distance) / 2.2
  }, [distance, isMoving, isHeld])

  useFrame((_, delta) => {
    if (isShaking) {
      setShakeTime((prev) => prev + delta)
    } else if (shakeTime > 0) {
      setShakeTime(0)
    }

    if (successPulse) {
      setPulseTime((prev) => {
        const newTime = prev + delta
        if (newTime >= 1.0) {
          setSuccessPulse(false)
          return 0
        }
        return newTime
      })
    }

    idleTime.current += delta
  })

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (isMoving) return
    onClick?.(entity)
  }

  const shakeOffset = isShaking
    ? [
        Math.sin(shakeTime * 30) * 0.03,
        Math.sin(shakeTime * 25) * 0.02,
        Math.sin(shakeTime * 28) * 0.03,
      ]
    : [0, 0, 0]

  const pulseScale = successPulse ? 1 + Math.sin(pulseTime * 6) * 0.15 : 1

  const displayColor = isDirty ? '#9ca3af' : baseColor

  const idleFloat = Math.sin(idleTime.current * 1.5) * 0.03
  const idleRotate = Math.sin(idleTime.current * 0.8) * 0.05

  return (
    <group
      ref={groupRef}
      position={[
        visualPosition.x + shakeOffset[0],
        visualPosition.y + shakeOffset[1] + (inRange && !isShaking ? idleFloat : 0),
        visualPosition.z + shakeOffset[2],
      ]}
    >
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
        scale={pulseScale}
        rotation={[0, idleRotate, 0]}
      >
        <PropModel
          modelId={modelId}
          color={displayColor}
          hovered={hovered}
          selected={false}
          interactable={!isHeld}
          isHeld={isHeld}
          size={entity.size}
        />
      </group>

      {proximityGlow > 0.01 && (
        <mesh position={[0, -halfHeight - 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.18, 0.28, 24]} />
          <meshBasicMaterial color={glowColor} transparent opacity={0.15 + proximityGlow * 0.2} />
        </mesh>
      )}

      {hovered && (
        <>
          <mesh position={[0, -halfHeight - 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.2, 0.28, 24]} />
            <meshBasicMaterial color={glowColor} transparent opacity={0.4} />
          </mesh>
          <pointLight
            position={[0, 0, 0]}
            color={glowColor}
            intensity={0.5}
            distance={1}
          />
        </>
      )}

      {isShaking && (
        <>
          <mesh position={[0, -halfHeight - 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.25, 0.35, 16]} />
            <meshBasicMaterial
              color={PALETTE.status.error}
              transparent
              opacity={0.7}
            />
          </mesh>
          <pointLight
            position={[0, 0, 0]}
            color={PALETTE.status.error}
            intensity={0.8}
            distance={1.5}
          />
        </>
      )}

      {successPulse && (
        <>
          <mesh position={[0, -halfHeight - 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.3, 0.45, 24]} />
            <meshBasicMaterial
              color={PALETTE.status.success}
              transparent
              opacity={0.6}
            />
          </mesh>
          <pointLight
            position={[0, 0, 0]}
            color={PALETTE.status.success}
            intensity={1}
            distance={2}
          />
        </>
      )}

      {hovered && (
        <Billboard position={[0, halfHeight + 0.2, 0]}>
          <mesh>
            <boxGeometry args={[0.55, 0.22, 0.02]} />
            <meshBasicMaterial color="#1f2937" transparent opacity={0.9} />
          </mesh>
          <Text
            position={[0, 0.05, 0.01]}
            fontSize={0.08}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            {entity.name}
          </Text>
          <Text
            position={[0, -0.02, 0.01]}
            fontSize={0.05}
            color="#9ca3af"
            anchorX="center"
            anchorY="middle"
          >
            {categoryLabel} · {distance.toFixed(1)}m
          </Text>
          {!heldEntityId && inRange && (
            <Text
              position={[0, -0.07, 0.01]}
              fontSize={0.05}
              color="#10b981"
              anchorX="center"
              anchorY="middle"
            >
              [F] 拾取
            </Text>
          )}
        </Billboard>
      )}

      {isTaskTarget && !isHeld && (
        <TaskTargetGlow halfHeight={halfHeight} entityName={entity.name} />
      )}

      {isHeld && (
        <>
          <mesh position={[0, -halfHeight, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.3, 0.4, 16]} />
            <meshBasicMaterial
              color={PALETTE.status.warning}
              transparent
              opacity={0.6}
            />
          </mesh>
          <Text
            position={[0, halfHeight + 0.3, 0]}
            fontSize={0.1}
            color={PALETTE.status.warning}
            anchorX="center"
            anchorY="middle"
          >
            已持有
          </Text>
        </>
      )}
    </group>
  )
}

function TaskTargetGlow({ halfHeight, entityName }: { halfHeight: number; entityName: string }) {
  const glowRef = useRef(0)
  const meshRef = useRef<THREE.Mesh>(null)
  const lightRef = useRef<THREE.PointLight>(null)

  useFrame((_, delta) => {
    glowRef.current += delta
    const pulse = 0.5 + Math.sin(glowRef.current * 3) * 0.5
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.3 + pulse * 0.4
    }
    if (lightRef.current) {
      lightRef.current.intensity = 0.4 + pulse * 0.4
    }
  })

  return (
    <>
      <mesh ref={meshRef} position={[0, -halfHeight - 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.22, 0.35, 24]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.5} />
      </mesh>
      <pointLight ref={lightRef} position={[0, 0.1, 0]} color="#fbbf24" intensity={0.5} distance={2} />
      <Billboard position={[0, halfHeight + 0.3, 0]}>
        <mesh>
          <boxGeometry args={[0.5, 0.16, 0.02]} />
          <meshBasicMaterial color="#92400e" transparent opacity={0.85} />
        </mesh>
        <Text
          position={[0, 0, 0.01]}
          fontSize={0.07}
          color="#fbbf24"
          anchorX="center"
          anchorY="middle"
        >
          ★ {entityName}
        </Text>
      </Billboard>
    </>
  )
}
