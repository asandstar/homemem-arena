import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { stopChaosAmbient, playChaosWarning } from '../../audio/sfx'

interface ChaosEffectProps {
  active: boolean
  chaosValue: number
}

export function ChaosEffect({ chaosValue }: ChaosEffectProps) {
  const { camera } = useThree()
  const shakeTime = useRef(0)
  const lastWarningTime = useRef(0)
  const chaosLightRef = useRef<THREE.PointLight>(null)
  const isMounted = useRef(true)

  useEffect(() => {
    return () => {
      isMounted.current = false
      stopChaosAmbient()
    }
  }, [])

  useFrame((_, delta) => {
    if (!isMounted.current) return
    shakeTime.current += delta
    lastWarningTime.current += delta

    const normalizedChaos = Math.min(1, Math.max(0, chaosValue / 100))

    // 【单源策略】公开任务 playing 时禁止 Chaos 持续 drone（第二层持续音源）
    // 只保留一次性 chaos_warning SFX（每 5 秒最多触发一次）
    if (lastWarningTime.current > 5 && normalizedChaos > 0.3) {
      lastWarningTime.current = 0
      playChaosWarning()
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
