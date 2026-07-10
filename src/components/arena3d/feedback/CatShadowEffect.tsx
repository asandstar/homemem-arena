import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface CatShadowEffectProps {
  startPosition: [number, number, number]
  endPosition: [number, number, number]
  duration?: number
}

export function CatShadowEffect({
  startPosition,
  endPosition,
  duration = 0.8,
}: CatShadowEffectProps) {
  const groupRef = useRef<THREE.Group>(null)
  const startTime = useRef(Date.now())

  const shadowGeometries = useMemo(() => {
    return Array.from({ length: 4 }, (_, i) => {
      const scale = 1 - i * 0.2
      return new THREE.CircleGeometry(0.25 * scale, 12)
    })
  }, [])

  useFrame(() => {
    const elapsed = (Date.now() - startTime.current) / 1000
    const t = Math.min(elapsed / duration, 1)

    if (t < 1) {
      const x = startPosition[0] + (endPosition[0] - startPosition[0]) * t
      const z = startPosition[2] + (endPosition[2] - startPosition[2]) * t

      if (groupRef.current) {
        groupRef.current.position.set(x, startPosition[1], z)

        groupRef.current.children.forEach((child, i) => {
          const trailT = Math.max(0, t - i * 0.08)
          const trailX = startPosition[0] + (endPosition[0] - startPosition[0]) * trailT
          const trailZ = startPosition[2] + (endPosition[2] - startPosition[2]) * trailT
          child.position.set(
            trailX - x,
            0,
            trailZ - z,
          )
          const opacity = (1 - i * 0.25) * (1 - t * 0.3)
          const mesh = child as THREE.Mesh
          const mat = mesh.material as THREE.MeshBasicMaterial
          if (mat) mat.opacity = Math.max(0, opacity)
        })
      }
    } else {
      const fadeT = Math.min((elapsed - duration) / 0.5, 1)
      if (groupRef.current) {
        groupRef.current.children.forEach((child) => {
          const mesh = child as THREE.Mesh
          const mat = mesh.material as THREE.MeshBasicMaterial
          if (mat) mat.opacity = Math.max(0, (mat.opacity || 0.4) * (1 - fadeT))
        })
        if (fadeT >= 1) {
          groupRef.current.visible = false
        }
      }
    }
  })

  return (
    <group ref={groupRef}>
      {shadowGeometries.map((geo, i) => (
        <mesh key={i} geometry={geo} position={[0, 0, 0]}>
          <meshBasicMaterial
            color={0x000000}
            transparent
            opacity={0.4 - i * 0.1}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}
