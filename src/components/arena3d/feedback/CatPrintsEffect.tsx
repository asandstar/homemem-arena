import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { nudgeFootprintAway, type FootprintOccSpec } from '../../../utils/nudgeFootprintAway'

interface CatPrintsEffectProps {
  startPosition: [number, number, number]
  endPosition: [number, number, number]
  printCount?: number
  /** F5 · 猫脚印避让家具：脚印候选位置若落入这些矩形内部，会被推到最近边外 */
  occluders?: FootprintOccSpec[]
}

export function CatPrintsEffect({
  startPosition,
  endPosition,
  printCount = 5,
  occluders = [],
}: CatPrintsEffectProps) {
  const groupRef = useRef<THREE.Group>(null)
  const startTime = useRef(Date.now())

  const prints = useMemo(() => {
    const result: { pos: [number, number, number]; rot: number; delay: number }[] = []
    for (let i = 0; i < printCount; i++) {
      const t = (i + 1) / (printCount + 1)
      let x = startPosition[0] + (endPosition[0] - startPosition[0]) * t
      let z = startPosition[2] + (endPosition[2] - startPosition[2]) * t
      const offsetX = (Math.random() - 0.5) * 0.3
      const offsetZ = (Math.random() - 0.5) * 0.3
      x += offsetX
      z += offsetZ
      // F5 · 若候选脚印落在家具矩形内 → 推到最近边 + 0.1m 缓冲外
      const nudged = nudgeFootprintAway(x, z, occluders)
      result.push({
        pos: [nudged.x, 0.01, nudged.z],
        rot: Math.random() * Math.PI * 0.5 - Math.PI * 0.25,
        delay: i * 0.15,
      })
    }
    return result
  }, [startPosition, endPosition, printCount, occluders])

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
