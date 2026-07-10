import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface CatPrintsEffectProps {
  startPosition: [number, number, number]
  endPosition: [number, number, number]
  printCount?: number
}

export function CatPrintsEffect({
  startPosition,
  endPosition,
  printCount = 5,
}: CatPrintsEffectProps) {
  const groupRef = useRef<THREE.Group>(null)
  const startTime = useRef(Date.now())

  const prints = useMemo(() => {
    const result: { pos: [number, number, number]; rot: number; delay: number }[] = []
    for (let i = 0; i < printCount; i++) {
      const t = (i + 1) / (printCount + 1)
      const x = startPosition[0] + (endPosition[0] - startPosition[0]) * t
      const z = startPosition[2] + (endPosition[2] - startPosition[2]) * t
      const offsetX = (Math.random() - 0.5) * 0.3
      const offsetZ = (Math.random() - 0.5) * 0.3
      result.push({
        pos: [x + offsetX, 0.01, z + offsetZ],
        rot: Math.random() * Math.PI * 0.5 - Math.PI * 0.25,
        delay: i * 0.15,
      })
    }
    return result
  }, [startPosition, endPosition, printCount])

  useFrame(() => {
    const elapsed = (Date.now() - startTime.current) / 1000
    if (!groupRef.current) return

    groupRef.current.children.forEach((child, i) => {
      const print = prints[i]
      if (!print) return

      const age = elapsed - print.delay
      if (age < 0) {
        child.visible = false
        return
      }

      child.visible = true
      const opacity = Math.max(0, 1 - age / 4)
      child.traverse((c) => {
        const mesh = c as THREE.Mesh
        if (mesh.material && 'opacity' in mesh.material) {
          ;(mesh.material as THREE.MeshStandardMaterial).opacity = opacity
        }
      })
    })
  })

  return (
    <group ref={groupRef}>
      {prints.map((print, i) => (
        <group key={i} position={print.pos} rotation={[-Math.PI / 2, print.rot, 0]}>
          <mesh>
            <circleGeometry args={[0.07, 12]} />
            <meshStandardMaterial
              color="#d97706"
              transparent
              opacity={0.8}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          <mesh position={[0.04, -0.02, 0]}>
            <circleGeometry args={[0.015, 6]} />
            <meshStandardMaterial
              color="#b45309"
              transparent
              opacity={0.7}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          <mesh position={[0.04, 0.02, 0]}>
            <circleGeometry args={[0.015, 6]} />
            <meshStandardMaterial
              color="#b45309"
              transparent
              opacity={0.7}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}
