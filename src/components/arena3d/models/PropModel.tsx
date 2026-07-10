import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ModelAsset } from './ModelAsset'
import { PALETTE } from '../materials/palette'
import { getModelConfig } from './ModelRegistry'

interface PropModelProps {
  modelId: string
  color?: string
  hovered?: boolean
  selected?: boolean
  interactable?: boolean
  isHeld?: boolean
  size?: { x: number; y: number; z: number }
}

export function PropModel({
  modelId,
  color,
  hovered = false,
  selected = false,
  interactable = false,
  isHeld = false,
  size,
}: PropModelProps) {
  const groupRef = useRef<THREE.Group>(null)
  const floatRef = useRef(0)
  const breatheRef = useRef(0)
  const config = getModelConfig(modelId)

  const highlightColor = config?.highlightColor || PALETTE.status.info

  const visualHeight = useMemo(() => size ? size.y : 0.5, [size])

  const modelScale = useMemo(() => {
    if (!size) return 1
    const baseSize = 0.5
    const maxDim = Math.max(size.x, size.y, size.z)
    return maxDim / baseSize
  }, [size])

  useFrame((_, delta) => {
    if (!groupRef.current) return

    floatRef.current += delta

    if (isHeld) {
      groupRef.current.rotation.y += delta * 1.5
      const floatY = Math.sin(floatRef.current * 3) * 0.02
      groupRef.current.position.y = floatY
    } else if (interactable) {
      breatheRef.current += delta
      const breathe = 1 + Math.sin(breatheRef.current * 2) * 0.02
      groupRef.current.scale.setScalar(breathe * modelScale)
    } else if (selected) {
      groupRef.current.scale.setScalar(1.05 * modelScale)
    } else {
      groupRef.current.scale.setScalar(modelScale)
    }
  })

  return (
    <group ref={groupRef} position={[0, -visualHeight / 2, 0]}>
      <ModelAsset
        modelId={modelId}
        color={color}
        hovered={hovered}
        selected={selected}
        interactable={interactable}
      />

      {hovered && (
        <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 0.28, 24]} />
          <meshBasicMaterial color={highlightColor} transparent opacity={0.4} />
        </mesh>
      )}

      {hovered && (
        <pointLight position={[0, 0.25, 0]} color={highlightColor} intensity={0.5} distance={1} />
      )}

      {isHeld && (
        <>
          <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.3, 0.4, 16]} />
            <meshBasicMaterial color={PALETTE.status.warning} transparent opacity={0.6} />
          </mesh>
          <pointLight position={[0, 0.3, 0]} color={PALETTE.status.warning} intensity={0.6} distance={1.5} />
        </>
      )}
    </group>
  )
}
