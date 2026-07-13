import type { Vec3 } from '../types/room'

export type ParticleType = 'sparkle' | 'magic' | 'firework' | 'smoke' | 'glow' | 'confetti' | 'dust' | 'ripple'

export interface ParticleEffect {
  id: string
  type: ParticleType
  position: Vec3
  duration: number
  startTime: number
  color?: string
  count?: number
  size?: number
  speed?: number
}

const particleEffects: ParticleEffect[] = []

function generateEffectId(): string {
  return `particle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function spawnParticleEffect(
  type: ParticleType,
  position: Vec3,
  options: {
    duration?: number
    color?: string
    count?: number
    size?: number
    speed?: number
  } = {}
): string {
  const effect: ParticleEffect = {
    id: generateEffectId(),
    type,
    position,
    duration: options.duration || 1000,
    startTime: Date.now(),
    color: options.color,
    count: options.count,
    size: options.size,
    speed: options.speed,
  }
  particleEffects.push(effect)
  return effect.id
}

export function getActiveParticleEffects(): ParticleEffect[] {
  const now = Date.now()
  return particleEffects.filter(e => now - e.startTime < e.duration)
}

export function removeParticleEffect(effectId: string): void {
  const index = particleEffects.findIndex(e => e.id === effectId)
  if (index !== -1) {
    particleEffects.splice(index, 1)
  }
}

export function clearAllParticleEffects(): void {
  particleEffects.length = 0
}

export function cleanupExpiredEffects(): void {
  const now = Date.now()
  let expiredIndex = particleEffects.findIndex(e => now - e.startTime >= e.duration)
  while (expiredIndex !== -1) {
    particleEffects.splice(expiredIndex, 1)
    expiredIndex = particleEffects.findIndex(e => now - e.startTime >= e.duration)
  }
}

export const PARTICLE_COLORS: Record<ParticleType, string> = {
  sparkle: '#FFD700',
  magic: '#9B59B6',
  firework: '#E74C3C',
  smoke: '#BDC3C7',
  glow: '#3498DB',
  confetti: '#1ABC9C',
  dust: '#F39C12',
  ripple: '#8E44AD',
}

export const PARTICLE_DEFAULTS: Record<ParticleType, { count: number; size: number; speed: number; duration: number }> = {
  sparkle: { count: 15, size: 0.03, speed: 0.5, duration: 800 },
  magic: { count: 20, size: 0.04, speed: 0.3, duration: 1500 },
  firework: { count: 30, size: 0.05, speed: 0.8, duration: 2000 },
  smoke: { count: 10, size: 0.1, speed: 0.15, duration: 2500 },
  glow: { count: 8, size: 0.08, speed: 0.2, duration: 1000 },
  confetti: { count: 25, size: 0.06, speed: 0.6, duration: 3000 },
  dust: { count: 12, size: 0.04, speed: 0.1, duration: 3000 },
  ripple: { count: 6, size: 0.15, speed: 0.4, duration: 1200 },
}

export function playPickEffect(position: Vec3): void {
  spawnParticleEffect('sparkle', position, { color: '#FFD700', duration: 600 })
}

export function playPlaceEffect(position: Vec3): void {
  spawnParticleEffect('glow', position, { color: '#27AE60', duration: 800 })
}

export function playMemorySaveEffect(position: Vec3): void {
  spawnParticleEffect('magic', position, { color: '#9B59B6', duration: 2000 })
}

export function playMemoryExpireEffect(position: Vec3): void {
  spawnParticleEffect('smoke', position, { color: '#7F8C8D', duration: 1500 })
}

export function playGoalCompleteEffect(position: Vec3): void {
  spawnParticleEffect('firework', position, { color: '#E74C3C', duration: 2500 })
  spawnParticleEffect('confetti', position, { color: '#F1C40F', duration: 2500 })
}

export function playChaosEffect(position: Vec3): void {
  spawnParticleEffect('dust', position, { color: '#34495E', duration: 2000 })
}

export function playTimeWarningEffect(position: Vec3): void {
  spawnParticleEffect('ripple', position, { color: '#E67E22', duration: 1000 })
}

export function playTaskStartEffect(position: Vec3): void {
  spawnParticleEffect('glow', position, { color: '#3498DB', duration: 1500 })
}

export function playTaskCompleteEffect(position: Vec3): void {
  spawnParticleEffect('firework', position, { color: '#27AE60', duration: 3000 })
}
