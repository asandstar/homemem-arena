import type { LevelBalanceConfig } from '../data/levelBalance'

export function calcChaosGrowth(deltaMs: number, config: LevelBalanceConfig): number {
  const deltaSeconds = deltaMs / 1000
  return deltaSeconds * config.chaosGrowthPerSecond
}

export function isGlitchActive(chaos: number, config: LevelBalanceConfig): boolean {
  return chaos >= config.chaosGlitchThreshold
}

export function isEventBoosted(chaos: number, config: LevelBalanceConfig): boolean {
  return chaos >= config.chaosEventBoostThreshold
}

export function getChaosLevel(chaos: number): 'low' | 'medium' | 'high' | 'critical' {
  if (chaos < 30) return 'low'
  if (chaos < 60) return 'medium'
  if (chaos < 85) return 'high'
  return 'critical'
}

export function getChaosColor(chaos: number): string {
  const level = getChaosLevel(chaos)
  switch (level) {
    case 'low': return '#22c55e'
    case 'medium': return '#f59e0b'
    case 'high': return '#ef4444'
    case 'critical': return '#dc2626'
  }
}
