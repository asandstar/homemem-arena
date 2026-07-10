import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface PhoneRingEffectProps {
  position: [number, number, number]
  ringCount?: number
}

export function PhoneRingEffect({ position, ringCount = 3 }: PhoneRingEffectProps) {
  const groupRef = useRef<THREE.Group>(null)
  const startTime = useRef(Date.now())

  const rings = useMemo(() => {
    return Array.from({ length: ringCount }, (_, i) => ({
      delay: i * 0.4,
      maxRadius: 1.5 + i * 0.3,
    }))
  }, [ringCount])

  useFrame(() => {
    const elapsed = (Date.now() - startTime.current) / 1000
    if (!groupRef.current) return

    groupRef.current.children.forEach((child, i) => {
      const ring = rings[i]
      if (!ring) return

      const age = elapsed - ring.delay
      if (age < 0 || age > 2.5) {
        child.visible = false
        return
      }

      child.visible = true
      const progress = age / 2.5
      const currentRadius = ring.maxRadius * progress
      const scale = currentRadius / 0.5

      child.scale.setScalar(scale)
      child.traverse((c) => {
        const mesh = c as THREE.Mesh
        if (mesh.material && 'opacity' in mesh.material) {
          ;(mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.8 - progress * 0.8)
        }
      })
    })
  })

  return (
    <group ref={groupRef} position={[position[0], position[1] + 0.1, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      {rings.map((_, i) => (
        <mesh key={i}>
          <ringGeometry args={[0.45, 0.5, 32]} />
          <meshBasicMaterial
            color="#3b82f6"
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}
