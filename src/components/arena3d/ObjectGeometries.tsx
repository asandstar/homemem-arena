import * as THREE from 'three'
import { useMemo } from 'react'

interface GeometryProps {
  size: { x: number; y: number; z: number }
}

interface ContainerGeometryProps extends GeometryProps {
  isOpen?: boolean
}

function createDefaultMaterial(color: string): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.7,
    metalness: 0.1,
  })
}

export function KeyModel({ size }: GeometryProps) {
  const mat = useMemo(() => createDefaultMaterial('#f59e0b'), [])
  return (
    <group>
      <mesh position={[0, size.y * 0.3, 0]} rotation={[0, 0, Math.PI / 2]} material={mat}>
        <torusGeometry args={[size.x * 0.15, 0.02, 8, 16]} />
      </mesh>
      <mesh position={[0, size.y * 0.1, 0]} material={mat}>
        <boxGeometry args={[size.x * 0.6, size.y * 0.12, size.z * 0.1]} />
      </mesh>
      <group position={[-size.x * 0.3, size.y * 0.1, 0]}>
        <mesh position={[0, size.y * 0.08, 0]} material={mat}>
          <boxGeometry args={[size.x * 0.25, size.y * 0.06, size.z * 0.1]} />
        </mesh>
        <mesh position={[0, -size.y * 0.04, 0]} material={mat}>
          <boxGeometry args={[size.x * 0.2, size.y * 0.06, size.z * 0.1]} />
        </mesh>
        <mesh position={[size.x * 0.08, size.y * 0.02, 0]} material={mat}>
          <boxGeometry args={[size.x * 0.12, size.y * 0.08, size.z * 0.1]} />
        </mesh>
      </group>
    </group>
  )
}

export function PhoneModel({ size }: GeometryProps) {
  const mat = useMemo(() => createDefaultMaterial('#374151'), [])
  const screenMat = useMemo(() => createDefaultMaterial('#10b981'), [])
  return (
    <group>
      <mesh material={mat}>
        <boxGeometry args={[size.x, size.y, size.z * 0.08]} />
      </mesh>
      <mesh position={[0, 0, size.z * 0.05]} material={screenMat}>
        <boxGeometry args={[size.x * 0.9, size.y * 0.85, 0.005]} />
      </mesh>
      <mesh position={[size.x * 0.35, size.y * 0.38, size.z * 0.06]} material={mat}>
        <sphereGeometry args={[0.015, 8, 8]} />
      </mesh>
      <mesh position={[size.x * 0.4, size.y * 0.38, size.z * 0.06]} material={mat}>
        <sphereGeometry args={[0.01, 8, 8]} />
      </mesh>
    </group>
  )
}

export function UmbrellaModel({ size }: GeometryProps) {
  const mat = useMemo(() => createDefaultMaterial('#ef4444'), [])
  return (
    <group>
      <mesh position={[0, size.y * 0.35, 0]} rotation={[Math.PI / 2, 0, 0]} material={mat}>
        <cylinderGeometry args={[0.015, 0.015, size.y * 0.6, 8]} />
      </mesh>
      <mesh position={[0, size.y * 0.65, size.x * 0.15]} rotation={[0, 0, Math.PI / 2]} material={mat}>
        <torusGeometry args={[size.x * 0.1, 0.015, 8, 12]} />
      </mesh>
      <mesh position={[0, size.y * 0.8, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mat}>
        <coneGeometry args={[size.x * 0.4, size.y * 0.3, 8]} />
      </mesh>
      <mesh position={[0, size.y * 0.95, 0]} material={mat}>
        <coneGeometry args={[0.02, 0.05, 6]} />
      </mesh>
    </group>
  )
}

export function MilkCartonModel({ size }: GeometryProps) {
  const mat = useMemo(() => createDefaultMaterial('#fef9c3'), [])
  const lidMat = useMemo(() => createDefaultMaterial('#4f46e5'), [])
  return (
    <group>
      <mesh material={mat}>
        <boxGeometry args={[size.x, size.y * 0.7, size.z]} />
      </mesh>
      <mesh position={[0, size.y * 0.5, 0]} rotation={[Math.PI / 6, 0, 0]} material={mat}>
        <boxGeometry args={[size.x, size.y * 0.35, 0.02]} />
      </mesh>
      <mesh position={[0, size.y * 0.5, 0]} rotation={[-Math.PI / 6, 0, 0]} material={mat}>
        <boxGeometry args={[size.x, size.y * 0.35, 0.02]} />
      </mesh>
      <mesh position={[0, size.y * 0.35, size.z / 2 + 0.005]} material={mat}>
        <boxGeometry args={[size.x * 0.7, size.y * 0.35, 0.01]} />
      </mesh>
      <mesh position={[0, size.y * 0.78, 0]} material={lidMat}>
        <boxGeometry args={[size.x * 0.2, size.y * 0.08, size.z * 0.2]} />
      </mesh>
    </group>
  )
}

export function CerealBoxModel({ size }: GeometryProps) {
  const mat = useMemo(() => createDefaultMaterial('#fbbf24'), [])
  return (
    <group>
      <mesh material={mat}>
        <boxGeometry args={[size.x, size.y, size.z]} />
      </mesh>
      <mesh position={[0, 0, size.z / 2 + 0.005]} material={mat}>
        <boxGeometry args={[size.x * 0.85, size.y * 0.7, 0.01]} />
      </mesh>
      <mesh position={[0, size.y / 2 + 0.01, 0]} material={mat}>
        <boxGeometry args={[size.x, 0.02, size.z]} />
      </mesh>
      <mesh position={[0, size.y / 2 + 0.02, 0]} rotation={[0, 0, Math.PI / 12]} material={mat}>
        <boxGeometry args={[size.x * 0.1, 0.015, size.z]} />
      </mesh>
      <mesh position={[0, size.y / 2 + 0.02, 0]} rotation={[0, 0, -Math.PI / 12]} material={mat}>
        <boxGeometry args={[size.x * 0.1, 0.015, size.z]} />
      </mesh>
    </group>
  )
}

export function CupModel({ size }: GeometryProps) {
  const mat = useMemo(() => createDefaultMaterial('#f87171'), [])
  return (
    <group>
      <mesh position={[0, size.y * 0.4, 0]} material={mat}>
        <cylinderGeometry args={[size.x / 2, size.x / 2 * 0.85, size.y * 0.8, 16]} />
      </mesh>
      <mesh position={[0, size.y * 0.85, 0]} material={mat}>
        <cylinderGeometry args={[size.x / 2 + 0.02, size.x / 2 + 0.02, 0.03, 16]} />
      </mesh>
      <mesh position={[0, size.y * 0.86, 0]} material={mat}>
        <cylinderGeometry args={[size.x / 2 - 0.03, size.x / 2 - 0.03, 0.01, 16]} />
      </mesh>
      <mesh position={[size.x / 2 + 0.08, size.y * 0.45, 0]} rotation={[0, 0, Math.PI / 2]} material={mat}>
        <torusGeometry args={[size.x * 0.2, 0.025, 8, 12]} />
      </mesh>
    </group>
  )
}

export function BowlModel({ size }: GeometryProps) {
  const mat = useMemo(() => createDefaultMaterial('#9ca3af'), [])
  return (
    <group>
      <mesh position={[0, size.y * 0.3, 0]} material={mat}>
        <cylinderGeometry args={[size.x / 2, size.x / 2 * 0.7, size.y * 0.6, 16]} />
      </mesh>
      <mesh position={[0, size.y * 0.6, 0]} material={mat}>
        <cylinderGeometry args={[size.x / 2 + 0.02, size.x / 2 + 0.02, 0.03, 16]} />
      </mesh>
      <mesh position={[0, size.y * 0.61, 0]} material={mat}>
        <cylinderGeometry args={[size.x / 2 - 0.03, size.x / 2 - 0.03, 0.015, 16]} />
      </mesh>
    </group>
  )
}

export function PlateModel({ size }: GeometryProps) {
  const mat = useMemo(() => createDefaultMaterial('#f3f4f6'), [])
  return (
    <group>
      <mesh position={[0, size.y * 0.3, 0]} material={mat}>
        <cylinderGeometry args={[size.x / 2, size.x / 2, size.y * 0.6, 16]} />
      </mesh>
      <mesh position={[0, size.y * 0.6, 0]} material={mat}>
        <cylinderGeometry args={[size.x / 2, size.x / 2 * 0.92, 0.02, 16]} />
      </mesh>
      <mesh position={[0, size.y * 0.62, 0]} material={mat}>
        <cylinderGeometry args={[size.x / 2 + 0.03, size.x / 2 + 0.03, 0.02, 16]} />
      </mesh>
    </group>
  )
}

export function RemoteModel({ size }: GeometryProps) {
  const buttonRows = 5
  const buttonCols = 3
  const mat = useMemo(() => createDefaultMaterial('#374151'), [])
  const buttonMat = useMemo(() => createDefaultMaterial('#6b7280'), [])
  return (
    <group>
      <mesh material={mat}>
        <boxGeometry args={[size.x, size.y, size.z]} />
      </mesh>
      <mesh position={[0, 0, size.z / 2 + 0.005]} material={buttonMat}>
        <boxGeometry args={[size.x * 0.25, size.y * 0.15, 0.01]} />
      </mesh>
      {Array.from({ length: buttonRows }).map((_, row) =>
        Array.from({ length: buttonCols }).map((_, col) => (
          <mesh
            key={`${row}-${col}`}
            position={[
              size.x * 0.2 + (col - 1) * size.x * 0.15,
              -size.y * 0.15 + row * size.y * 0.14,
              size.z / 2 + 0.005,
            ]}
            material={buttonMat}
          >
            <sphereGeometry args={[0.02, 8, 8]} />
          </mesh>
        ))
      )}
    </group>
  )
}

export function ClothModel({ size }: GeometryProps) {
  const mat = useMemo(() => createDefaultMaterial('#f9fafb'), [])
  return (
    <group>
      <mesh position={[0, size.y * 0.6, 0]} rotation={[0, 0, Math.PI / 24]} material={mat}>
        <boxGeometry args={[size.x, size.y * 0.15, size.z]} />
      </mesh>
      <mesh position={[0, size.y * 0.4, 0]} rotation={[0, 0, -Math.PI / 20]} material={mat}>
        <boxGeometry args={[size.x * 0.9, size.y * 0.12, size.z * 0.9]} />
      </mesh>
      <mesh position={[0, size.y * 0.22, 0]} rotation={[0, 0, Math.PI / 18]} material={mat}>
        <boxGeometry args={[size.x * 0.8, size.y * 0.1, size.z * 0.8]} />
      </mesh>
      <mesh position={[0, size.y * 0.06, 0]} rotation={[0, 0, -Math.PI / 22]} material={mat}>
        <boxGeometry args={[size.x * 0.7, size.y * 0.08, size.z * 0.7]} />
      </mesh>
    </group>
  )
}

export function TowelModel({ size }: GeometryProps) {
  const mat = useMemo(() => createDefaultMaterial('#fcd34d'), [])
  return (
    <group>
      <mesh material={mat}>
        <boxGeometry args={[size.x, size.y, size.z]} />
      </mesh>
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh
          key={i}
          position={[0, size.y * (0.2 + i * 0.15), 0]}
          material={mat}
        >
          <boxGeometry args={[size.x * 0.9, 0.005, size.z * 0.9]} />
        </mesh>
      ))}
      <mesh position={[0, 0, size.z / 2 + 0.005]} material={mat}>
        <boxGeometry args={[size.x * 0.95, size.y * 0.9, 0.005]} />
      </mesh>
    </group>
  )
}

export function TrashModel({ size }: GeometryProps) {
  const mat = useMemo(() => createDefaultMaterial('#4b5563'), [])
  return (
    <group>
      <mesh position={[0, size.y * 0.3, 0]} rotation={[Math.PI / 12, Math.PI / 8, 0]} material={mat}>
        <boxGeometry args={[size.x, size.y * 0.4, size.z]} />
      </mesh>
      <mesh position={[size.x * 0.15, size.y * 0.5, size.z * 0.1]} rotation={[-Math.PI / 8, Math.PI / 6, Math.PI / 4]} material={mat}>
        <boxGeometry args={[size.x * 0.7, size.y * 0.3, size.z * 0.7]} />
      </mesh>
      <mesh position={[-size.x * 0.1, size.y * 0.55, -size.z * 0.1]} rotation={[Math.PI / 6, -Math.PI / 8, -Math.PI / 6]} material={mat}>
        <boxGeometry args={[size.x * 0.6, size.y * 0.25, size.z * 0.6]} />
      </mesh>
      <mesh position={[0, size.y * 0.7, 0]} rotation={[Math.PI / 4, 0, Math.PI / 3]} material={mat}>
        <sphereGeometry args={[size.x * 0.12, 8, 8]} />
      </mesh>
    </group>
  )
}

export function SpoonGeometry({ size }: GeometryProps) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape()
    const handleLength = size.x * 0.6
    const handleWidth = size.y * 2
    shape.moveTo(0, 0)
    shape.lineTo(handleLength, 0)
    shape.lineTo(handleLength, handleWidth)
    shape.lineTo(0, handleWidth)
    const bowlWidth = size.x * 0.4
    const bowlDepth = size.y * 3
    shape.moveTo(handleLength, handleWidth * 0.5)
    shape.bezierCurveTo(
      handleLength + bowlWidth * 0.3, handleWidth * 0.5 - bowlDepth * 0.3,
      handleLength + bowlWidth, handleWidth * 0.5 - bowlDepth,
      handleLength + bowlWidth, handleWidth * 0.5
    )
    shape.bezierCurveTo(
      handleLength + bowlWidth, handleWidth * 0.5 + bowlDepth,
      handleLength + bowlWidth * 0.3, handleWidth * 0.5 + bowlDepth * 0.3,
      handleLength, handleWidth * 0.5
    )
    const extrudeSettings = {
      depth: size.z,
      bevelEnabled: false,
    }
    return new THREE.ExtrudeGeometry(shape, extrudeSettings)
  }, [size])
  return <primitive object={geometry} attach="geometry" />
}

export function FridgeGeometry({ size }: GeometryProps) {
  const mat = useMemo(() => createDefaultMaterial('#ffffff'), [])
  const handleMat = useMemo(() => createDefaultMaterial('#1f2937'), [])
  const panelMat = useMemo(() => createDefaultMaterial('#e5e7eb'), [])
  return (
    <group>
      <mesh material={mat}>
        <boxGeometry args={[size.x, size.y, size.z]} />
      </mesh>
      <mesh position={[0, size.y * 0.5, 0]} material={panelMat}>
        <boxGeometry args={[size.x, 0.02, size.z]} />
      </mesh>
      <mesh position={[size.x / 2 - 0.05, size.y * 0.25, 0]} material={handleMat}>
        <cylinderGeometry args={[0.02, 0.02, size.y * 0.4, 8]} />
      </mesh>
      <mesh position={[size.x / 2 - 0.05, size.y * 0.75, 0]} material={handleMat}>
        <cylinderGeometry args={[0.02, 0.02, size.y * 0.3, 8]} />
      </mesh>
      <mesh position={[size.x / 2 - 0.03, size.y * 0.7, 0]} material={mat}>
        <boxGeometry args={[0.01, 0.15, 0.08]} />
      </mesh>
      <mesh position={[size.x / 2 - 0.03, size.y * 0.75, 0]} material={handleMat}>
        <sphereGeometry args={[0.015, 8, 8]} />
      </mesh>
    </group>
  )
}

export function CabinetGeometry({ size }: GeometryProps) {
  const drawerCount = Math.floor(size.y / 0.5)
  const mat = useMemo(() => createDefaultMaterial('#8b5cf6'), [])
  const handleMat = useMemo(() => createDefaultMaterial('#fbbf24'), [])
  return (
    <group>
      <mesh material={mat}>
        <boxGeometry args={[size.x, size.y, size.z]} />
      </mesh>
      {Array.from({ length: Math.max(2, drawerCount) }).map((_, i) => (
        <mesh key={i} position={[0, size.y * 0.1 + i * (size.y * 0.8) / Math.max(2, drawerCount), size.z / 2 + 0.01]} material={mat}>
          <boxGeometry args={[size.x * 0.8, 0.02, size.z * 0.9]} />
        </mesh>
      ))}
      <mesh position={[size.x / 2 - 0.1, size.y * 0.5, size.z / 2 + 0.01]} material={handleMat}>
        <boxGeometry args={[0.03, 0.15, 0.06]} />
      </mesh>
    </group>
  )
}

export function DishwasherGeometry({ size }: GeometryProps) {
  const mat = useMemo(() => createDefaultMaterial('#4b5563'), [])
  const controlMat = useMemo(() => createDefaultMaterial('#9ca3af'), [])
  return (
    <group>
      <mesh material={mat}>
        <boxGeometry args={[size.x, size.y, size.z]} />
      </mesh>
      <mesh position={[0, size.y * 0.3, size.z / 2 + 0.04]} material={controlMat}>
        <boxGeometry args={[size.x * 0.6, 0.05, 0.08]} />
      </mesh>
      <mesh position={[0, size.y * 0.1, size.z / 2 + 0.02]} material={controlMat}>
        <boxGeometry args={[size.x * 0.3, 0.02, 0.04]} />
      </mesh>
      <mesh position={[-size.x * 0.15, size.y * 0.15, size.z / 2 + 0.03]} material={controlMat}>
        <sphereGeometry args={[0.02, 8, 8]} />
      </mesh>
      <mesh position={[size.x * 0.15, size.y * 0.15, size.z / 2 + 0.03]} material={controlMat}>
        <sphereGeometry args={[0.02, 8, 8]} />
      </mesh>
    </group>
  )
}

export function SinkGeometry({ size }: GeometryProps) {
  const mat = useMemo(() => createDefaultMaterial('#e5e7eb'), [])
  const basinMat = useMemo(() => createDefaultMaterial('#6b7280'), [])
  const faucetMat = useMemo(() => createDefaultMaterial('#9ca3af'), [])
  return (
    <group>
      <mesh position={[0, size.y * 0.9, 0]} material={mat}>
        <boxGeometry args={[size.x, size.y * 0.2, size.z]} />
      </mesh>
      <mesh position={[0, size.y * 0.5, 0]} material={basinMat}>
        <boxGeometry args={[size.x * 0.8, size.y * 0.6, size.z * 0.8]} />
      </mesh>
      <mesh position={[size.x * 0.3, size.y * 0.95, 0]} material={faucetMat}>
        <boxGeometry args={[0.04, 0.2, 0.04]} />
      </mesh>
      <mesh position={[size.x * 0.3, size.y * 1.05, size.z * 0.2]} material={faucetMat}>
        <boxGeometry args={[0.15, 0.03, 0.03]} />
      </mesh>
      <mesh position={[size.x * 0.3, size.y * 1.05, -size.z * 0.2]} material={faucetMat}>
        <boxGeometry args={[0.1, 0.03, 0.03]} />
      </mesh>
    </group>
  )
}

export function TrashBinGeometry({ size }: GeometryProps) {
  const mat = useMemo(() => createDefaultMaterial('#374151'), [])
  const lidMat = useMemo(() => createDefaultMaterial('#1f2937'), [])
  return (
    <group>
      <mesh material={mat}>
        <cylinderGeometry args={[size.x / 2, size.x / 2, size.y, 16]} />
      </mesh>
      <mesh position={[0, size.y - 0.02, 0]} material={lidMat}>
        <cylinderGeometry args={[size.x / 2 + 0.02, size.x / 2 + 0.02, 0.04, 16]} />
      </mesh>
      <mesh position={[0, size.y + 0.05, 0]} rotation={[0, Math.PI / 4, 0]} material={lidMat}>
        <boxGeometry args={[size.x * 0.6, 0.03, size.x * 0.6]} />
      </mesh>
    </group>
  )
}

export function TableGeometry({ size }: GeometryProps) {
  const topMat = useMemo(() => createDefaultMaterial('#d97706'), [])
  const legMat = useMemo(() => createDefaultMaterial('#78350f'), [])
  return (
    <group>
      <mesh position={[0, size.y * 0.9, 0]} material={topMat}>
        <boxGeometry args={[size.x, size.y * 0.1, size.z]} />
      </mesh>
      <mesh position={[-size.x / 2 + 0.1, size.y * 0.4, -size.z / 2 + 0.1]} material={legMat}>
        <boxGeometry args={[0.08, size.y * 0.8, 0.08]} />
      </mesh>
      <mesh position={[size.x / 2 - 0.1, size.y * 0.4, -size.z / 2 + 0.1]} material={legMat}>
        <boxGeometry args={[0.08, size.y * 0.8, 0.08]} />
      </mesh>
      <mesh position={[-size.x / 2 + 0.1, size.y * 0.4, size.z / 2 - 0.1]} material={legMat}>
        <boxGeometry args={[0.08, size.y * 0.8, 0.08]} />
      </mesh>
      <mesh position={[size.x / 2 - 0.1, size.y * 0.4, size.z / 2 - 0.1]} material={legMat}>
        <boxGeometry args={[0.08, size.y * 0.8, 0.08]} />
      </mesh>
    </group>
  )
}

export function ChairGeometry({ size }: GeometryProps) {
  const seatMat = useMemo(() => createDefaultMaterial('#6b7280'), [])
  const legMat = useMemo(() => createDefaultMaterial('#4b5563'), [])
  return (
    <group>
      <mesh position={[0, size.y * 0.7, 0]} material={seatMat}>
        <boxGeometry args={[size.x, size.y * 0.15, size.z]} />
      </mesh>
      <mesh position={[-size.x / 2 + 0.05, size.y * 0.35, -size.z / 2 + 0.05]} material={legMat}>
        <boxGeometry args={[0.05, size.y * 0.7, 0.05]} />
      </mesh>
      <mesh position={[size.x / 2 - 0.05, size.y * 0.35, -size.z / 2 + 0.05]} material={legMat}>
        <boxGeometry args={[0.05, size.y * 0.7, 0.05]} />
      </mesh>
      <mesh position={[-size.x / 2 + 0.05, size.y * 0.35, size.z / 2 - 0.05]} material={legMat}>
        <boxGeometry args={[0.05, size.y * 0.7, 0.05]} />
      </mesh>
      <mesh position={[size.x / 2 - 0.05, size.y * 0.35, size.z / 2 - 0.05]} material={legMat}>
        <boxGeometry args={[0.05, size.y * 0.7, 0.05]} />
      </mesh>
      <mesh position={[0, size.y * 0.95, 0]} rotation={[0, Math.PI, 0]} material={seatMat}>
        <boxGeometry args={[size.x * 0.8, size.y * 0.1, size.z * 0.6]} />
      </mesh>
    </group>
  )
}

export function BedGeometry({ size }: GeometryProps) {
  const frameMat = useMemo(() => createDefaultMaterial('#78350f'), [])
  const mattressMat = useMemo(() => createDefaultMaterial('#f3f4f6'), [])
  const pillowMat = useMemo(() => createDefaultMaterial('#ffffff'), [])
  return (
    <group>
      <mesh position={[0, size.y * 0.3, 0]} material={frameMat}>
        <boxGeometry args={[size.x, size.y * 0.6, size.z]} />
      </mesh>
      <mesh position={[0, size.y * 0.65, 0]} material={mattressMat}>
        <boxGeometry args={[size.x * 1.05, size.y * 0.1, size.z * 1.05]} />
      </mesh>
      <mesh position={[0, size.y * 0.75, -size.z / 2 + 0.1]} material={pillowMat}>
        <boxGeometry args={[size.x, size.y * 0.3, 0.15]} />
      </mesh>
    </group>
  )
}

export function SofaGeometry({ size }: GeometryProps) {
  const seatMat = useMemo(() => createDefaultMaterial('#9ca3af'), [])
  const armMat = useMemo(() => createDefaultMaterial('#6b7280'), [])
  return (
    <group>
      <mesh position={[0, size.y * 0.3, 0]} material={seatMat}>
        <boxGeometry args={[size.x, size.y * 0.6, size.z]} />
      </mesh>
      <mesh position={[0, size.y * 0.65, -size.z / 2 + 0.05]} material={seatMat}>
        <boxGeometry args={[size.x, size.y * 0.2, 0.1]} />
      </mesh>
      <mesh position={[-size.x / 2 + 0.05, size.y * 0.5, 0]} material={armMat}>
        <boxGeometry args={[0.1, size.y * 0.4, size.z]} />
      </mesh>
      <mesh position={[size.x / 2 - 0.05, size.y * 0.5, 0]} material={armMat}>
        <boxGeometry args={[0.1, size.y * 0.4, size.z]} />
      </mesh>
    </group>
  )
}

export function WashingMachineGeometry({ size }: GeometryProps) {
  const mat = useMemo(() => createDefaultMaterial('#6b7280'), [])
  const doorMat = useMemo(() => createDefaultMaterial('#9ca3af'), [])
  const controlMat = useMemo(() => createDefaultMaterial('#d1d5db'), [])
  return (
    <group>
      <mesh material={mat}>
        <boxGeometry args={[size.x, size.y, size.z]} />
      </mesh>
      <mesh position={[0, size.y * 0.5, size.z / 2 + 0.02]} material={doorMat}>
        <cylinderGeometry args={[size.x * 0.35, size.x * 0.35, 0.04, 16]} />
      </mesh>
      <mesh position={[0, size.y * 0.5, size.z / 2 + 0.04]} material={mat}>
        <cylinderGeometry args={[size.x * 0.25, size.x * 0.25, 0.02, 16]} />
      </mesh>
      <mesh position={[size.x * 0.2, size.y * 0.2, size.z / 2 + 0.03]} material={controlMat}>
        <boxGeometry args={[0.15, 0.08, 0.02]} />
      </mesh>
    </group>
  )
}

export function ShelfGeometry({ size }: GeometryProps) {
  const shelfCount = Math.min(4, Math.floor(size.y / 0.4))
  const mat = useMemo(() => createDefaultMaterial('#d97706'), [])
  return (
    <group>
      <mesh position={[-size.x / 2, size.y / 2, 0]} material={mat}>
        <boxGeometry args={[0.05, size.y, size.z]} />
      </mesh>
      <mesh position={[size.x / 2, size.y / 2, 0]} material={mat}>
        <boxGeometry args={[0.05, size.y, size.z]} />
      </mesh>
      {Array.from({ length: shelfCount }).map((_, i) => (
        <mesh key={i} position={[0, size.y * 0.1 + i * (size.y * 0.8) / shelfCount, 0]} material={mat}>
          <boxGeometry args={[size.x, 0.03, size.z]} />
        </mesh>
      ))}
    </group>
  )
}

export function FridgeModel({ size, isOpen = false }: ContainerGeometryProps) {
  const mat = useMemo(() => createDefaultMaterial('#ffffff'), [])
  const panelMat = useMemo(() => createDefaultMaterial('#e5e7eb'), [])
  const handleMat = useMemo(() => createDefaultMaterial('#1f2937'), [])
  const shelfMat = useMemo(() => createDefaultMaterial('#d1d5db'), [])
  return (
    <group>
      <mesh position={[0, size.y / 2, 0]} material={mat}>
        <boxGeometry args={[size.x, size.y, size.z]} />
      </mesh>
      <mesh position={[0, size.y / 2, size.z / 2 + 0.01]} material={panelMat}>
        <boxGeometry args={[0.01, size.y, size.z]} />
      </mesh>
      {!isOpen && (
        <mesh position={[0, size.y / 2, size.z / 2 + 0.01]} material={mat}>
          <boxGeometry args={[size.x, size.y, 0.02]} />
        </mesh>
      )}
      <mesh
        position={isOpen ? [-size.x * 0.35, size.y * 0.6, size.z / 2 + 0.02] : [size.x * 0.35, size.y * 0.6, size.z / 2 + 0.02]}
        rotation={isOpen ? [-Math.PI / 3, 0, 0] : [0, 0, 0]}
        material={mat}
      >
        <boxGeometry args={[size.x * 0.45, size.y * 0.5, 0.03]} />
      </mesh>
      <mesh
        position={isOpen ? [size.x * 0.35, size.y * 0.6, size.z / 2 + 0.02] : [-size.x * 0.35, size.y * 0.6, size.z / 2 + 0.02]}
        rotation={isOpen ? [Math.PI / 3, 0, 0] : [0, 0, 0]}
        material={mat}
      >
        <boxGeometry args={[size.x * 0.45, size.y * 0.5, 0.03]} />
      </mesh>
      <mesh position={[-size.x * 0.38, size.y * 0.5, size.z / 2 + 0.04]} rotation={[Math.PI / 2, 0, 0]} material={handleMat}>
        <cylinderGeometry args={[0.015, 0.015, size.y * 0.4, 8]} />
      </mesh>
      <mesh position={[size.x * 0.38, size.y * 0.5, size.z / 2 + 0.04]} rotation={[Math.PI / 2, 0, 0]} material={handleMat}>
        <cylinderGeometry args={[0.015, 0.015, size.y * 0.4, 8]} />
      </mesh>
      {Array.from({ length: 3 }).map((_, i) => (
        <mesh key={i} position={[0, size.y * 0.2 + i * (size.y * 0.6) / 3, size.z / 2 - 0.01]} material={shelfMat}>
          <boxGeometry args={[size.x * 0.9, 0.02, size.z * 0.9]} />
        </mesh>
      ))}
      <mesh position={[0, size.y * 0.15, size.z / 2 - 0.02]} material={shelfMat}>
        <boxGeometry args={[size.x * 0.85, 0.05, size.z * 0.85]} />
      </mesh>
      <mesh position={[0, size.y * 0.5, size.z / 2 - 0.02]} material={shelfMat}>
        <boxGeometry args={[size.x * 0.85, 0.05, size.z * 0.85]} />
      </mesh>
      <mesh position={[0, size.y * 0.85, size.z / 2 - 0.02]} material={shelfMat}>
        <boxGeometry args={[size.x * 0.85, 0.05, size.z * 0.85]} />
      </mesh>
    </group>
  )
}

export function CabinetModel({ size, isOpen = false }: ContainerGeometryProps) {
  const isUpper = size.y < size.x
  const mat = useMemo(() => createDefaultMaterial('#8b5cf6'), [])
  const handleMat = useMemo(() => createDefaultMaterial('#fbbf24'), [])
  return (
    <group>
      <mesh position={[0, size.y / 2, 0]} material={mat}>
        <boxGeometry args={[size.x, size.y, size.z]} />
      </mesh>
      <mesh position={[0, size.y / 2, size.z / 2 + 0.01]} material={mat}>
        <boxGeometry args={[size.x * 0.9, size.y * 0.9, 0.02]} />
      </mesh>
      <mesh position={[0, size.y * 0.3, size.z / 2 + 0.02]} material={mat}>
        <boxGeometry args={[size.x * 0.8, 0.015, size.z * 0.8]} />
      </mesh>
      <mesh position={[0, size.y * 0.5, size.z / 2 + 0.02]} material={mat}>
        <boxGeometry args={[size.x * 0.8, 0.015, size.z * 0.8]} />
      </mesh>
      <mesh position={[0, size.y * 0.7, size.z / 2 + 0.02]} material={mat}>
        <boxGeometry args={[size.x * 0.8, 0.015, size.z * 0.8]} />
      </mesh>
      <mesh
        position={isOpen ? [0, size.y / 2, size.z / 2 + size.x * 0.3] : [0, size.y / 2, size.z / 2 + 0.03]}
        rotation={isOpen ? [0, -Math.PI / 3, 0] : [0, 0, 0]}
        material={mat}
      >
        <boxGeometry args={[size.x * 0.95, size.y * 0.95, 0.03]} />
      </mesh>
      <mesh position={[size.x * 0.35, size.y / 2, size.z / 2 + 0.05]} material={handleMat}>
        <boxGeometry args={[0.02, 0.12, 0.06]} />
      </mesh>
      {!isUpper && (
        <mesh position={[0, size.y * 0.1, 0]} material={mat}>
          <boxGeometry args={[size.x * 1.1, 0.05, size.z * 1.1]} />
        </mesh>
      )}
    </group>
  )
}

export function SinkModel({ size }: GeometryProps) {
  const mat = useMemo(() => createDefaultMaterial('#e5e7eb'), [])
  const basinMat = useMemo(() => createDefaultMaterial('#6b7280'), [])
  const faucetMat = useMemo(() => createDefaultMaterial('#9ca3af'), [])
  return (
    <group>
      <mesh position={[0, size.y * 0.9, 0]} material={mat}>
        <boxGeometry args={[size.x, size.y * 0.2, size.z]} />
      </mesh>
      <mesh position={[0, size.y * 0.55, 0]} material={basinMat}>
        <boxGeometry args={[size.x * 0.7, size.y * 0.5, size.z * 0.7]} />
      </mesh>
      <mesh position={[0, size.y * 0.55, 0]} material={basinMat}>
        <cylinderGeometry args={[size.x * 0.3, size.x * 0.25, size.y * 0.45, 16]} />
      </mesh>
      <mesh position={[size.x * 0.35, size.y * 0.95, 0]} material={faucetMat}>
        <cylinderGeometry args={[0.03, 0.03, size.y * 0.25, 8]} />
      </mesh>
      <mesh position={[size.x * 0.35, size.y * 1.05, size.z * 0.15]} material={faucetMat}>
        <boxGeometry args={[0.12, 0.025, 0.025]} />
      </mesh>
      <mesh position={[size.x * 0.35, size.y * 1.05, -size.z * 0.15]} material={faucetMat}>
        <boxGeometry args={[0.08, 0.025, 0.025]} />
      </mesh>
      <mesh position={[0, size.y * 0.35, 0]} material={basinMat}>
        <cylinderGeometry args={[size.x * 0.25, size.x * 0.25, size.y * 0.15, 16]} />
      </mesh>
      <mesh position={[0, size.y * 0.3, 0]} material={basinMat}>
        <cylinderGeometry args={[size.x * 0.32, size.x * 0.32, 0.02, 16]} />
      </mesh>
    </group>
  )
}

export function DishwasherModel({ size, isOpen = false }: ContainerGeometryProps) {
  const mat = useMemo(() => createDefaultMaterial('#4b5563'), [])
  const controlMat = useMemo(() => createDefaultMaterial('#9ca3af'), [])
  return (
    <group>
      <mesh position={[0, size.y / 2, 0]} material={mat}>
        <boxGeometry args={[size.x, size.y, size.z]} />
      </mesh>
      <mesh
        position={isOpen ? [0, -size.y * 0.3, size.z / 2 + 0.03] : [0, size.y / 2, size.z / 2 + 0.03]}
        rotation={isOpen ? [Math.PI / 6, 0, 0] : [0, 0, 0]}
        material={mat}
      >
        <boxGeometry args={[size.x * 0.95, size.y * 0.95, 0.04]} />
      </mesh>
      <mesh position={[0, size.y * 0.35, size.z / 2 + 0.05]} material={controlMat}>
        <boxGeometry args={[size.x * 0.7, 0.04, 0.06]} />
      </mesh>
      <mesh position={[-size.x * 0.15, size.y * 0.15, size.z / 2 + 0.04]} material={controlMat}>
        <sphereGeometry args={[0.02, 8, 8]} />
      </mesh>
      <mesh position={[0, size.y * 0.15, size.z / 2 + 0.04]} material={controlMat}>
        <sphereGeometry args={[0.018, 8, 8]} />
      </mesh>
      <mesh position={[size.x * 0.15, size.y * 0.15, size.z / 2 + 0.04]} material={controlMat}>
        <sphereGeometry args={[0.018, 8, 8]} />
      </mesh>
      <mesh position={[-size.x * 0.25, size.y * 0.1, size.z / 2 + 0.03]} material={controlMat}>
        <boxGeometry args={[0.08, 0.04, 0.02]} />
      </mesh>
      <mesh position={[size.x * 0.25, size.y * 0.1, size.z / 2 + 0.03]} material={controlMat}>
        <boxGeometry args={[0.08, 0.04, 0.02]} />
      </mesh>
      <mesh position={[-size.x * 0.35, size.y * 0.15, size.z / 2 + 0.04]} material={controlMat}>
        <sphereGeometry args={[0.012, 6, 6]} />
      </mesh>
    </group>
  )
}

export function SofaModel({ size }: GeometryProps) {
  const seatMat = useMemo(() => createDefaultMaterial('#9ca3af'), [])
  const armMat = useMemo(() => createDefaultMaterial('#6b7280'), [])
  const pillowMat = useMemo(() => createDefaultMaterial('#d1d5db'), [])
  return (
    <group>
      <mesh position={[0, size.y * 0.25, 0]} material={seatMat}>
        <boxGeometry args={[size.x, size.y * 0.5, size.z]} />
      </mesh>
      <mesh position={[0, size.y * 0.6, -size.z / 2 + 0.05]} rotation={[Math.PI / 12, 0, 0]} material={seatMat}>
        <boxGeometry args={[size.x, size.y * 0.4, 0.1]} />
      </mesh>
      <mesh position={[-size.x / 2 + 0.08, size.y * 0.5, 0]} material={armMat}>
        <boxGeometry args={[0.12, size.y * 0.35, size.z * 0.8]} />
      </mesh>
      <mesh position={[size.x / 2 - 0.08, size.y * 0.5, 0]} material={armMat}>
        <boxGeometry args={[0.12, size.y * 0.35, size.z * 0.8]} />
      </mesh>
      <mesh position={[-size.x * 0.25, size.y * 0.55, -size.z * 0.2]} rotation={[0, 0, -Math.PI / 24]} material={pillowMat}>
        <boxGeometry args={[size.x * 0.22, size.y * 0.18, size.z * 0.35]} />
      </mesh>
      <mesh position={[0, size.y * 0.55, -size.z * 0.2]} rotation={[0, 0, Math.PI / 30]} material={pillowMat}>
        <boxGeometry args={[size.x * 0.22, size.y * 0.18, size.z * 0.35]} />
      </mesh>
      <mesh position={[size.x * 0.25, size.y * 0.55, -size.z * 0.2]} rotation={[0, 0, -Math.PI / 30]} material={pillowMat}>
        <boxGeometry args={[size.x * 0.22, size.y * 0.18, size.z * 0.35]} />
      </mesh>
      <mesh position={[0, size.y * 0.3, size.z / 2 + 0.01]} material={seatMat}>
        <boxGeometry args={[size.x * 0.9, size.y * 0.03, size.z * 0.9]} />
      </mesh>
    </group>
  )
}

export function CoffeeTableModel({ size }: GeometryProps) {
  const topMat = useMemo(() => createDefaultMaterial('#d97706'), [])
  const legMat = useMemo(() => createDefaultMaterial('#78350f'), [])
  const decorMat = useMemo(() => createDefaultMaterial('#6b7280'), [])
  return (
    <group>
      <mesh position={[0, size.y * 0.85, 0]} material={topMat}>
        <boxGeometry args={[size.x, size.y * 0.15, size.z]} />
      </mesh>
      <mesh position={[-size.x / 2 + 0.1, size.y * 0.4, -size.z / 2 + 0.1]} rotation={[0, 0, Math.PI / 12]} material={legMat}>
        <cylinderGeometry args={[0.04, 0.04, size.y * 0.7, 8]} />
      </mesh>
      <mesh position={[size.x / 2 - 0.1, size.y * 0.4, -size.z / 2 + 0.1]} rotation={[0, 0, -Math.PI / 12]} material={legMat}>
        <cylinderGeometry args={[0.04, 0.04, size.y * 0.7, 8]} />
      </mesh>
      <mesh position={[-size.x / 2 + 0.1, size.y * 0.4, size.z / 2 - 0.1]} rotation={[0, 0, -Math.PI / 12]} material={legMat}>
        <cylinderGeometry args={[0.04, 0.04, size.y * 0.7, 8]} />
      </mesh>
      <mesh position={[size.x / 2 - 0.1, size.y * 0.4, size.z / 2 - 0.1]} rotation={[0, 0, Math.PI / 12]} material={legMat}>
        <cylinderGeometry args={[0.04, 0.04, size.y * 0.7, 8]} />
      </mesh>
      <mesh position={[0, size.y * 0.35, 0]} material={topMat}>
        <boxGeometry args={[size.x * 0.85, size.y * 0.05, size.z * 0.85]} />
      </mesh>
      <mesh position={[-size.x * 0.2, size.y * 0.88, -size.z * 0.15]} material={decorMat}>
        <boxGeometry args={[size.x * 0.15, size.y * 0.1, size.z * 0.1]} />
      </mesh>
      <mesh position={[size.x * 0.15, size.y * 0.88, size.z * 0.2]} material={decorMat}>
        <cylinderGeometry args={[0.03, 0.03, size.y * 0.08, 8]} />
      </mesh>
      <mesh position={[0, size.y * 0.88, 0]} material={decorMat}>
        <cylinderGeometry args={[0.05, 0.05, size.y * 0.06, 12]} />
      </mesh>
    </group>
  )
}

export function BedModel({ size }: GeometryProps) {
  const frameMat = useMemo(() => createDefaultMaterial('#78350f'), [])
  const mattressMat = useMemo(() => createDefaultMaterial('#f3f4f6'), [])
  const pillowMat = useMemo(() => createDefaultMaterial('#ffffff'), [])
  const blanketMat = useMemo(() => createDefaultMaterial('#f9fafb'), [])
  return (
    <group>
      <mesh position={[0, size.y * 0.25, 0]} material={frameMat}>
        <boxGeometry args={[size.x, size.y * 0.5, size.z]} />
      </mesh>
      <mesh position={[0, size.y * 0.5, 0]} material={mattressMat}>
        <boxGeometry args={[size.x * 1.02, size.y * 0.08, size.z * 1.02]} />
      </mesh>
      <mesh position={[0, size.y * 0.65, 0]} material={blanketMat}>
        <boxGeometry args={[size.x, size.y * 0.2, size.z]} />
      </mesh>
      <mesh position={[0, size.y * 0.72, 0]} material={blanketMat}>
        <boxGeometry args={[size.x * 0.95, size.y * 0.1, size.z * 0.95]} />
      </mesh>
      <mesh position={[0, size.y * 0.5, -size.z / 2 + 0.1]} material={frameMat}>
        <boxGeometry args={[size.x, size.y * 0.5, 0.12]} />
      </mesh>
      <mesh position={[-size.x * 0.15, size.y * 0.65, -size.z * 0.3]} rotation={[Math.PI / 12, 0, Math.PI / 24]} material={pillowMat}>
        <boxGeometry args={[size.x * 0.25, size.y * 0.15, size.z * 0.4]} />
      </mesh>
      <mesh position={[size.x * 0.15, size.y * 0.65, -size.z * 0.3]} rotation={[Math.PI / 12, 0, -Math.PI / 24]} material={pillowMat}>
        <boxGeometry args={[size.x * 0.25, size.y * 0.15, size.z * 0.4]} />
      </mesh>
      <mesh position={[0, size.y * 0.68, -size.z * 0.25]} rotation={[Math.PI / 10, 0, 0]} material={pillowMat}>
        <boxGeometry args={[size.x * 0.18, size.y * 0.12, size.z * 0.35]} />
      </mesh>
      <mesh position={[0, size.y * 0.35, 0]} material={frameMat}>
        <boxGeometry args={[size.x * 0.9, size.y * 0.03, size.z * 0.9]} />
      </mesh>
    </group>
  )
}

export function DeskModel({ size }: GeometryProps) {
  return (
    <group>
      <mesh position={[0, size.y * 0.85, 0]}>
        <boxGeometry args={[size.x, size.y * 0.15, size.z]} />
      </mesh>
      <mesh position={[-size.x / 2 + 0.08, size.y * 0.35, -size.z / 2 + 0.08]}>
        <boxGeometry args={[0.06, size.y * 0.75, 0.06]} />
      </mesh>
      <mesh position={[size.x / 2 - 0.08, size.y * 0.35, -size.z / 2 + 0.08]}>
        <boxGeometry args={[0.06, size.y * 0.75, 0.06]} />
      </mesh>
      <mesh position={[size.x / 2 - 0.08, size.y * 0.35, size.z / 2 - 0.08]}>
        <boxGeometry args={[0.06, size.y * 0.75, 0.06]} />
      </mesh>
      <mesh position={[0, size.y * 0.5, -size.z / 2 + 0.05]}>
        <boxGeometry args={[size.x * 0.9, size.y * 0.5, 0.08]} />
      </mesh>
      <mesh position={[0, size.y * 0.35, -size.z / 2 + 0.09]}>
        <boxGeometry args={[size.x * 0.85, 0.02, size.z * 0.04]} />
      </mesh>
      <mesh position={[0, size.y * 0.55, -size.z / 2 + 0.09]}>
        <boxGeometry args={[size.x * 0.85, 0.02, size.z * 0.04]} />
      </mesh>
      <mesh position={[0, size.y * 0.75, -size.z / 2 + 0.09]}>
        <boxGeometry args={[size.x * 0.85, 0.02, size.z * 0.04]} />
      </mesh>
      <mesh position={[-size.x * 0.2, size.y * 0.45, -size.z / 2 + 0.11]}>
        <boxGeometry args={[0.02, 0.06, 0.03]} />
      </mesh>
      <mesh position={[size.x * 0.2, size.y * 0.45, -size.z / 2 + 0.11]}>
        <boxGeometry args={[0.02, 0.06, 0.03]} />
      </mesh>
      <mesh position={[size.x * 0.35, size.y * 0.9, size.z * 0.25]}>
        <boxGeometry args={[0.06, 0.04, 0.06]} />
      </mesh>
      <mesh position={[size.x * 0.35, size.y * 1.15, size.z * 0.25]}>
        <cylinderGeometry args={[0.015, 0.015, size.y * 0.3, 6]} />
      </mesh>
      <mesh position={[size.x * 0.35, size.y * 1.28, size.z * 0.25]} rotation={[-Math.PI / 6, 0, 0]}>
        <coneGeometry args={[0.08, 0.12, 8]} />
      </mesh>
    </group>
  )
}

export function LaundryBasketModel({ size }: GeometryProps) {
  return (
    <group>
      <mesh position={[0, size.y * 0.4, 0]}>
        <cylinderGeometry args={[size.x / 2, size.x / 2 * 0.85, size.y * 0.8, 16]} />
      </mesh>
      <mesh position={[0, size.y * 0.82, 0]}>
        <cylinderGeometry args={[size.x / 2 + 0.03, size.x / 2 + 0.03, 0.04, 16]} />
      </mesh>
      <mesh position={[0, size.y * 0.84, 0]}>
        <cylinderGeometry args={[size.x / 2 - 0.02, size.x / 2 - 0.02, 0.02, 16]} />
      </mesh>
      <mesh position={[0, size.y * 0.15, 0]}>
        <cylinderGeometry args={[size.x / 2 + 0.02, size.x / 2 + 0.02, 0.03, 16]} />
      </mesh>
      <mesh position={[size.x * 0.2, size.y * 0.5, size.z / 2 + 0.01]}>
        <boxGeometry args={[0.15, 0.1, 0.015]} />
      </mesh>
      <mesh position={[size.x * 0.2, size.y * 0.5, size.z / 2 + 0.015]}>
        <boxGeometry args={[0.13, 0.08, 0.005]} />
      </mesh>
      <mesh position={[0, size.y * 0.35, 0]}>
        <cylinderGeometry args={[size.x / 2 * 0.8, size.x / 2 * 0.8, size.y * 0.5, 16]} />
      </mesh>
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={i} position={[0, size.y * 0.2 + i * (size.y * 0.4) / 4, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[size.x / 2 * 0.75, size.x / 2 * 0.75, 0.015, 16]} />
        </mesh>
      ))}
      <mesh position={[0, size.y * 0.8, 0]}>
        <cylinderGeometry args={[size.x / 2 + 0.01, size.x / 2 + 0.01, 0.02, 16]} />
      </mesh>
    </group>
  )
}

export function EntranceTrayModel({ size }: GeometryProps) {
  return (
    <group>
      <mesh position={[0, size.y / 2, 0]}>
        <boxGeometry args={[size.x, size.y, size.z]} />
      </mesh>
      <mesh position={[0, size.y / 2 + 0.01, 0]}>
        <boxGeometry args={[size.x * 0.95, size.y * 0.3, size.z * 0.95]} />
      </mesh>
      <mesh position={[0, size.y * 0.1, 0]}>
        <boxGeometry args={[size.x * 1.05, 0.02, size.z * 1.05]} />
      </mesh>
      <mesh position={[0, size.y * 0.12, 0]}>
        <boxGeometry args={[size.x * 1.02, 0.01, size.z * 1.02]} />
      </mesh>
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[size.x * (-0.4 + i * 0.2), size.y / 2 + 0.005, 0]}>
          <boxGeometry args={[0.01, size.y * 0.15, size.z * 0.9]} />
        </mesh>
      ))}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[0, size.y / 2 + 0.005, size.z * (-0.4 + i * 0.2)]}>
          <boxGeometry args={[size.x * 0.9, size.y * 0.15, 0.01]} />
        </mesh>
      ))}
      <mesh position={[0, size.y / 2 + 0.02, 0]}>
        <boxGeometry args={[size.x * 0.6, size.y * 0.01, size.z * 0.6]} />
      </mesh>
      <mesh position={[0, size.y / 2 + 0.025, 0]}>
        <boxGeometry args={[size.x * 0.62, size.y * 0.005, size.z * 0.62]} />
      </mesh>
      <mesh position={[-size.x * 0.3, size.y / 2 + 0.03, -size.z * 0.3]} rotation={[Math.PI / 6, 0, Math.PI / 4]}>
        <boxGeometry args={[size.x * 0.1, size.y * 0.15, size.z * 0.1]} />
      </mesh>
      <mesh position={[size.x * 0.3, size.y / 2 + 0.03, size.z * 0.3]} rotation={[-Math.PI / 6, 0, -Math.PI / 4]}>
        <boxGeometry args={[size.x * 0.1, size.y * 0.15, size.z * 0.1]} />
      </mesh>
    </group>
  )
}

export function CarpetModel({ size }: GeometryProps) {
  return (
    <group>
      <mesh position={[0, size.y / 2, 0]}>
        <boxGeometry args={[size.x, size.y, size.z]} />
      </mesh>
      <mesh position={[0, size.y / 2 + 0.005, 0]}>
        <boxGeometry args={[size.x * 0.98, size.y * 0.3, size.z * 0.98]} />
      </mesh>
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[0, size.y / 2 + 0.008, size.z * (-0.45 + i * 0.15)]}>
          <boxGeometry args={[size.x * 0.8, 0.003, size.z * 0.08]} />
        </mesh>
      ))}
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={i} position={[size.x * (-0.4 + i * 0.2), size.y / 2 + 0.008, 0]}>
          <boxGeometry args={[size.x * 0.1, 0.003, size.z * 0.8]} />
        </mesh>
      ))}
    </group>
  )
}

export function FloorLampModel({ size }: GeometryProps) {
  return (
    <group>
      <mesh position={[0, size.y * 0.05, 0]}>
        <cylinderGeometry args={[size.x * 0.3, size.x * 0.35, size.y * 0.1, 12]} />
      </mesh>
      <mesh position={[0, size.y * 0.4, 0]}>
        <cylinderGeometry args={[0.02, 0.02, size.y * 0.7, 8]} />
      </mesh>
      <mesh position={[0, size.y * 0.85, 0]}>
        <cylinderGeometry args={[0.015, 0.015, size.y * 0.1, 8]} />
      </mesh>
      <mesh position={[0, size.y * 0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[size.x * 0.6, size.y * 0.25, 16]} />
      </mesh>
      <mesh position={[0, size.y * 0.98, 0]}>
        <cylinderGeometry args={[size.x * 0.4, size.x * 0.4, 0.02, 16]} />
      </mesh>
    </group>
  )
}

export function TableLampModel({ size }: GeometryProps) {
  return (
    <group>
      <mesh position={[0, size.y * 0.1, 0]}>
        <cylinderGeometry args={[size.x * 0.25, size.x * 0.3, size.y * 0.2, 12]} />
      </mesh>
      <mesh position={[0, size.y * 0.4, 0]}>
        <cylinderGeometry args={[0.015, 0.015, size.y * 0.35, 6]} />
      </mesh>
      <mesh position={[0, size.y * 0.6, 0]}>
        <cylinderGeometry args={[0.012, 0.012, size.y * 0.08, 6]} />
      </mesh>
      <mesh position={[0, size.y * 0.75, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[size.x * 0.45, size.y * 0.2, 12]} />
      </mesh>
      <mesh position={[0, size.y * 0.88, 0]}>
        <cylinderGeometry args={[size.x * 0.32, size.x * 0.32, 0.015, 12]} />
      </mesh>
    </group>
  )
}

export function PillowModel({ size }: GeometryProps) {
  return (
    <group>
      <mesh position={[0, size.y / 2, 0]} rotation={[Math.PI / 12, 0, Math.PI / 18]}>
        <boxGeometry args={[size.x, size.y, size.z]} />
      </mesh>
      <mesh position={[0, size.y / 2 + 0.01, 0]} rotation={[Math.PI / 12, 0, Math.PI / 18]}>
        <boxGeometry args={[size.x * 0.95, size.y * 0.8, size.z * 0.95]} />
      </mesh>
      <mesh position={[0, size.y * 0.3, 0]} rotation={[Math.PI / 10, 0, Math.PI / 15]}>
        <boxGeometry args={[size.x * 0.85, size.y * 0.5, size.z * 0.85]} />
      </mesh>
    </group>
  )
}

export function CoatHookModel({ size }: GeometryProps) {
  return (
    <group>
      <mesh position={[0, size.y / 2, 0]}>
        <boxGeometry args={[size.x, size.y, size.z]} />
      </mesh>
      <mesh position={[0, size.y / 2 + 0.01, 0]}>
        <boxGeometry args={[size.x * 0.95, size.y * 0.2, size.z * 0.95]} />
      </mesh>
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={i} position={[size.x * (-0.35 + i * 0.23), size.y * 0.65, 0]}>
          <boxGeometry args={[0.03, size.y * 0.35, 0.03]} />
        </mesh>
      ))}
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={i} position={[size.x * (-0.35 + i * 0.23), size.y * 0.78, size.z * 0.05]} rotation={[0, 0, Math.PI / 4]}>
          <cylinderGeometry args={[0.02, 0.02, size.y * 0.15, 6]} />
        </mesh>
      ))}
    </group>
  )
}

export function ShoeCabinetModel({ size }: GeometryProps) {
  return (
    <group>
      <mesh position={[0, size.y / 2, 0]}>
        <boxGeometry args={[size.x, size.y, size.z]} />
      </mesh>
      {Array.from({ length: 3 }).map((_, i) => (
        <mesh key={i} position={[0, size.y * 0.2 + i * (size.y * 0.6) / 3, size.z / 2 + 0.01]}>
          <boxGeometry args={[size.x * 0.85, 0.02, size.z * 0.9]} />
        </mesh>
      ))}
      {Array.from({ length: 3 }).map((_, i) => (
        <mesh key={i} position={[size.x * 0.3, size.y * 0.2 + i * (size.y * 0.6) / 3, size.z / 2 + 0.02]}>
          <boxGeometry args={[0.02, 0.12, 0.06]} />
        </mesh>
      ))}
      <mesh position={[0, size.y * 0.1, 0]}>
        <boxGeometry args={[size.x * 1.05, 0.03, size.z * 1.05]} />
      </mesh>
    </group>
  )
}

export function TowelRackModel({ size }: GeometryProps) {
  return (
    <group>
      <mesh position={[-size.x / 2, size.y / 2, 0]}>
        <boxGeometry args={[0.03, size.y, size.z]} />
      </mesh>
      <mesh position={[size.x / 2, size.y / 2, 0]}>
        <boxGeometry args={[0.03, size.y, size.z]} />
      </mesh>
      <mesh position={[0, size.y * 0.85, 0]} rotation={[0, Math.PI / 2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, size.x, 8]} />
      </mesh>
      <mesh position={[0, size.y * 0.6, 0]} rotation={[0, Math.PI / 2, 0]}>
        <cylinderGeometry args={[0.015, 0.015, size.x * 0.9, 8]} />
      </mesh>
      <mesh position={[0, size.y * 0.45, 0]} rotation={[0, Math.PI / 2, 0]}>
        <cylinderGeometry args={[0.015, 0.015, size.x * 0.9, 8]} />
      </mesh>
      <mesh position={[-size.x * 0.2, size.y * 0.8, size.z * 0.05]} rotation={[Math.PI / 6, 0, 0]}>
        <boxGeometry args={[size.x * 0.15, size.y * 0.25, size.z * 0.02]} />
      </mesh>
      <mesh position={[size.x * 0.2, size.y * 0.65, size.z * 0.05]} rotation={[-Math.PI / 8, 0, 0]}>
        <boxGeometry args={[size.x * 0.15, size.y * 0.2, size.z * 0.02]} />
      </mesh>
    </group>
  )
}

export function TVStandModel({ size }: GeometryProps) {
  return (
    <group>
      <mesh position={[0, size.y * 0.4, 0]}>
        <boxGeometry args={[size.x, size.y * 0.8, size.z]} />
      </mesh>
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={i} position={[size.x * (-0.4 + i * 0.27), size.y * 0.6, size.z / 2 + 0.01]}>
          <boxGeometry args={[size.x * 0.22, 0.02, size.z * 0.9]} />
        </mesh>
      ))}
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={i} position={[size.x * (-0.4 + i * 0.27), size.y * 0.6, size.z / 2 + 0.02]}>
          <boxGeometry args={[0.02, 0.1, 0.05]} />
        </mesh>
      ))}
      <mesh position={[0, size.y * 0.95, 0]}>
        <boxGeometry args={[size.x * 0.85, size.y * 0.1, size.z * 0.6]} />
      </mesh>
      <mesh position={[0, size.y * 1.05, 0]}>
        <boxGeometry args={[size.x * 0.7, size.y * 0.02, size.z * 0.05]} />
      </mesh>
    </group>
  )
}

export function WardrobeModel({ size }: GeometryProps) {
  return (
    <group>
      <mesh position={[0, size.y / 2, 0]}>
        <boxGeometry args={[size.x, size.y, size.z]} />
      </mesh>
      <mesh position={[0, size.y / 2, size.z / 2 + 0.01]}>
        <boxGeometry args={[size.x * 0.95, size.y * 0.95, 0.02]} />
      </mesh>
      <mesh position={[0, size.y / 2, size.z / 2 + 0.02]}>
        <boxGeometry args={[0.01, size.y, size.z]} />
      </mesh>
      {Array.from({ length: 2 }).map((_, i) => (
        <mesh key={i} position={[size.x * (0.3 + i * (-0.6)), size.y * 0.4, size.z / 2 + 0.03]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, size.y * 0.6, 8]} />
        </mesh>
      ))}
      {Array.from({ length: 3 }).map((_, i) => (
        <mesh key={i} position={[0, size.y * 0.2 + i * (size.y * 0.6) / 3, size.z / 2 - 0.01]}>
          <boxGeometry args={[size.x * 0.9, 0.02, size.z * 0.9]} />
        </mesh>
      ))}
      <mesh position={[0, size.y * 0.1, 0]}>
        <boxGeometry args={[size.x * 1.05, 0.03, size.z * 1.05]} />
      </mesh>
    </group>
  )
}

export function NightstandModel({ size }: GeometryProps) {
  return (
    <group>
      <mesh position={[0, size.y / 2, 0]}>
        <boxGeometry args={[size.x, size.y, size.z]} />
      </mesh>
      <mesh position={[0, size.y * 0.5, size.z / 2 + 0.01]}>
        <boxGeometry args={[size.x * 0.9, 0.02, size.z * 0.9]} />
      </mesh>
      <mesh position={[0, size.y * 0.75, size.z / 2 + 0.01]}>
        <boxGeometry args={[size.x * 0.9, 0.02, size.z * 0.9]} />
      </mesh>
      <mesh position={[size.x * 0.3, size.y * 0.5, size.z / 2 + 0.02]}>
        <boxGeometry args={[0.02, 0.1, 0.05]} />
      </mesh>
      <mesh position={[size.x * 0.3, size.y * 0.75, size.z / 2 + 0.02]}>
        <boxGeometry args={[0.02, 0.1, 0.05]} />
      </mesh>
      <mesh position={[0, size.y * 0.1, 0]}>
        <boxGeometry args={[size.x * 1.05, 0.02, size.z * 1.05]} />
      </mesh>
    </group>
  )
}

export function ChandelierModel({ size }: GeometryProps) {
  return (
    <group>
      <mesh position={[0, size.y * 0.1, 0]}>
        <cylinderGeometry args={[size.x * 0.15, size.x * 0.12, size.y * 0.1, 8]} />
      </mesh>
      <mesh position={[0, size.y * 0.3, 0]}>
        <cylinderGeometry args={[0.015, 0.015, size.y * 0.25, 6]} />
      </mesh>
      <mesh position={[0, size.y * 0.5, 0]}>
        <boxGeometry args={[size.x * 0.8, 0.03, size.z * 0.8]} />
      </mesh>
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i * Math.PI * 2) / 6
        return (
          <mesh key={i} position={[Math.cos(angle) * size.x * 0.35, size.y * 0.65, Math.sin(angle) * size.z * 0.35]} rotation={[-Math.PI / 3, angle, 0]}>
            <coneGeometry args={[size.x * 0.08, size.y * 0.2, 8]} />
          </mesh>
        )
      })}
      <mesh position={[0, size.y * 0.8, 0]}>
        <cylinderGeometry args={[size.x * 0.2, size.x * 0.15, size.y * 0.15, 12]} />
      </mesh>
      <mesh position={[0, size.y * 0.9, 0]}>
        <sphereGeometry args={[size.x * 0.12, 8, 8]} />
      </mesh>
    </group>
  )
}