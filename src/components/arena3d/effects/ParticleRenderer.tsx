import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getActiveParticleEffects, cleanupExpiredEffects, PARTICLE_COLORS, PARTICLE_DEFAULTS, type ParticleEffect } from '../../../effects/particleSystem'

interface ParticleInstance {
  position: THREE.Vector3
  velocity: THREE.Vector3
  color: THREE.Color
  size: number
  life: number
  maxLife: number
  type: string
}

function ParticleSystem() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const instancesRef = useRef<ParticleInstance[]>([])
  const dummyRef = useRef(new THREE.Object3D())

  const maxParticles = 500
  const geometry = useMemo(() => new THREE.PlaneGeometry(0.1, 0.1), [])
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide,
        depthWrite: false,
        vertexColors: true,
      }),
    []
  )

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  function createParticles(effect: ParticleEffect): ParticleInstance[] {
    const defaults = PARTICLE_DEFAULTS[effect.type]
    const count = effect.count || defaults.count
    const size = effect.size || defaults.size
    const speed = effect.speed || defaults.speed
    const color = new THREE.Color(effect.color || PARTICLE_COLORS[effect.type])

    const particles: ParticleInstance[] = []
    const center = new THREE.Vector3(effect.position.x, effect.position.y, effect.position.z)

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const radius = Math.random() * 0.3

      const position = new THREE.Vector3(
        center.x + radius * Math.sin(phi) * Math.cos(theta),
        center.y + radius * Math.sin(phi) * Math.sin(theta),
        center.z + radius * Math.cos(phi)
      )

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * speed,
        (Math.random() - 0.5) * speed + (effect.type === 'smoke' ? 0.1 : 0),
        (Math.random() - 0.5) * speed
      )

      particles.push({
        position,
        velocity,
        color: color.clone(),
        size: size * (0.5 + Math.random() * 0.5),
        life: 0,
        maxLife: effect.duration,
        type: effect.type,
      })
    }

    return particles
  }

  useFrame((state, delta) => {
    cleanupExpiredEffects()
    const effects = getActiveParticleEffects()

    for (const effect of effects) {
      const existingInstance = instancesRef.current.find(inst => inst.type === 'effect_' + effect.id)
      if (!existingInstance) {
        const newParticles = createParticles(effect)
        newParticles.forEach(p => {
          p.type = 'effect_' + effect.id
          instancesRef.current.push(p)
        })
      }
    }

    const now = Date.now()
    instancesRef.current = instancesRef.current.filter(instance => {
      const effect = effects.find(e => instance.type === 'effect_' + e.id)
      if (!effect) return false

      const elapsed = now - effect.startTime
      instance.life = elapsed
      const lifeRatio = elapsed / effect.duration

      if (lifeRatio >= 1) return false

      instance.position.addScaledVector(instance.velocity, delta * 60)

      if (instance.type.includes('smoke')) {
        instance.velocity.y += delta * 0.02
        instance.size += delta * 0.05
      }

      if (instance.type.includes('dust')) {
        instance.velocity.x += (Math.random() - 0.5) * delta * 0.1
        instance.velocity.z += (Math.random() - 0.5) * delta * 0.1
      }

      return true
    })

    if (!meshRef.current) return

    meshRef.current.count = instancesRef.current.length

    instancesRef.current.forEach((instance, index) => {
      const lifeRatio = instance.life / instance.maxLife
      const alpha = 1 - lifeRatio

      dummyRef.current.position.copy(instance.position)
      dummyRef.current.scale.set(instance.size * alpha, instance.size * alpha, 1)
      dummyRef.current.lookAt(state.camera.position)

      dummyRef.current.updateMatrix()
      meshRef.current!.setMatrixAt(index, dummyRef.current.matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, maxParticles]}
      frustumCulled={false}
    />
  )
}

export function ParticleRenderer() {
  return <ParticleSystem />
}
