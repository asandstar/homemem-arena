import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ModelAsset, FallbackColorizer } from './ModelAsset'
import { PALETTE } from '../colors'
import { getModelConfig } from './ModelRegistry'
import {
  FridgeFallback,
  CabinetFallback,
  DishwasherFallback,
} from './FallbackModels'

interface FurnitureModelProps {
  modelId: string
  color?: string
  hovered?: boolean
  isOpen?: boolean
  isTarget?: boolean
  size?: { x: number; y: number; z: number }
}

const OPENABLE_MODELS: Record<string, React.ComponentType<any>> = {
  fridge: FridgeFallback,
  cabinet: CabinetFallback,
  dishwasher: DishwasherFallback,
}

export function FurnitureModel({
  modelId,
  color,
  hovered = false,
  isOpen = false,
  isTarget = false,
  size,
}: FurnitureModelProps) {
  const groupRef = useRef<THREE.Group>(null)
  const pulseRef = useRef(0)
  const config = getModelConfig(modelId)

  const highlightColor = config?.highlightColor || PALETTE.status.info
  const targetColor = PALETTE.target.primary
  const targetHighlight = PALETTE.target.highlight

  const isOpenable = !!OPENABLE_MODELS[modelId]

  useFrame((_, delta) => {
    if (!groupRef.current) return

    pulseRef.current += delta
  })

  const visualHeight = size ? size.y : 1.0

  return (
    <group ref={groupRef} position={[0, -visualHeight / 2, 0]}>
      {isOpenable ? (
        <OpenableFurniture
          modelId={modelId}
          color={color}
          hovered={hovered}
          isOpen={isOpen}
          isTarget={isTarget}
        />
      ) : (
        <ModelAsset
          modelId={modelId}
          color={color}
          hovered={hovered}
          target={isTarget}
        />
      )}

      {isTarget && (
        <>
          <mesh
            position={[0, visualHeight + 0.1, 0]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.4, 0.5, 24]} />
            <meshBasicMaterial
              color={targetColor}
              transparent
              opacity={0.5}
            />
          </mesh>
          <mesh
            position={[0, visualHeight + 0.1, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[
              1 + Math.sin(pulseRef.current * 4) * 0.1,
              1 + Math.sin(pulseRef.current * 4) * 0.1,
              1,
            ]}
          >
            <ringGeometry args={[0.35, 0.55, 24]} />
            <meshBasicMaterial
              color={targetHighlight}
              transparent
              opacity={0.4 + Math.sin(pulseRef.current * 4) * 0.2}
            />
          </mesh>
          <pointLight
            position={[0, visualHeight + 0.15, 0]}
            color={targetColor}
            intensity={0.6 + Math.sin(pulseRef.current * 3) * 0.2}
            distance={2}
          />
        </>
      )}

      {hovered && !isTarget && (
        <pointLight
          position={[0, visualHeight / 2, 0]}
          color={highlightColor}
          intensity={0.4}
          distance={1.5}
        />
      )}
    </group>
  )
}

function OpenableFurniture({
  modelId,
  color,
  hovered,
  isOpen,
}: {
  modelId: string
  color?: string
  hovered?: boolean
  isOpen?: boolean
  isTarget?: boolean
}) {
  const FallbackComp = OPENABLE_MODELS[modelId]

  return (
    <FallbackColorizer modelId={modelId} color={color} hovered={hovered}>
      <FallbackComp isOpen={isOpen} color={color} />
    </FallbackColorizer>
  )
}
