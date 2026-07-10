import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { updateChaosAmbient, isAudioEnabled } from '../../audio/sfx'

interface ChaosEffectProps {
  active: boolean
  chaosValue: number
}

export function ChaosEffect({ chaosValue }: ChaosEffectProps) {
  const { camera } = useThree()
  const shakeTime = useRef(0)
  const lastAudioUpdate = useRef(0)
  const chaosLightRef = useRef<THREE.PointLight>(null)

  useFrame((_, delta) => {
    shakeTime.current += delta
    lastAudioUpdate.current += delta

    const normalizedChaos = Math.min(1, Math.max(0, chaosValue / 100))

    if (lastAudioUpdate.current > 0.1 && isAudioEnabled()) {
      lastAudioUpdate.current = 0
      updateChaosAmbient(chaosValue)
    }

    if (chaosLightRef.current) {
      const targetIntensity = normalizedChaos * 1.5
      chaosLightRef.current.intensity = THREE.MathUtils.lerp(
        chaosLightRef.current.intensity,
        targetIntensity,
        0.05
      )
    }

    if (normalizedChaos > 0.4) {
      const shakeIntensity = normalizedChaos * 0.008
      const shakeX = (Math.sin(shakeTime.current * 12) + Math.sin(shakeTime.current * 7.5) * 0.5) * shakeIntensity
      const shakeY = (Math.sin(shakeTime.current * 9.2) + Math.sin(shakeTime.current * 6.3) * 0.5) * shakeIntensity * 0.5
      const shakeZ = (Math.sin(shakeTime.current * 10.1) * 0.5) * shakeIntensity * 0.3

      camera.position.x += shakeX
      camera.position.y += shakeY
      camera.position.z += shakeZ
    }
  })

  return (
    <group>
      <pointLight
        ref={chaosLightRef}
        position={[0, 5, 0]}
        color="#7f1d1d"
        intensity={0}
        distance={20}
      />
    </group>
  )
}
