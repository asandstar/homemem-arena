import type { LevelBalanceConfig } from '../data/levelBalance'

export function calcComboMultiplier(combo: number, config: LevelBalanceConfig): number {
  return Math.min(1 + Math.max(0, combo - 1) * config.comboMultiplierStep, config.maxComboMultiplier)
}

export function calcCorrectPlaceScore(combo: number, config: LevelBalanceConfig): number {
  const mult = calcComboMultiplier(combo, config)
  return Math.floor(config.correctPlaceScore * mult)
}

export function calcPickScore(config: LevelBalanceConfig): number {
  return config.pickTargetScore
}

export function calcTimeBonus(remainingMs: number, config: LevelBalanceConfig): number {
  const remainingSeconds = Math.floor(remainingMs / 1000)
  return Math.max(0, Math.floor(remainingSeconds * config.timeBonusRate))
}

export function calcMemoryEfficiencyBonus(memoryEffectiveRate: number, config: LevelBalanceConfig): number {
  if (memoryEffectiveRate >= 0.8) return config.memoryEfficiencyBonus
  if (memoryEffectiveRate >= 0.6) return Math.floor(config.memoryEfficiencyBonus * 0.5)
  return 0
}

export function calcEarlyCompletionBonus(remainingMs: number, timeLimit: number, config: LevelBalanceConfig): number {
  const remainingPercent = remainingMs / (timeLimit * 1000)
  if (remainingPercent >= 0.3) return config.earlyCompletionBonus
  if (remainingPercent >= 0.15) return Math.floor(config.earlyCompletionBonus * 0.5)
  return 0
}

export function calcComboBreakPenalty(combo: number, config: LevelBalanceConfig): number {
  if (combo >= 5) return config.comboBreakPenalty
  return 0
}

export function getRank(score: number): { rank: string; color: string } {
  if (score >= 1200) return { rank: 'S', color: 'text-amber-400' }
  if (score >= 900) return { rank: 'A', color: 'text-green-400' }
  if (score >= 650) return { rank: 'B', color: 'text-blue-400' }
  if (score >= 400) return { rank: 'C', color: 'text-purple-400' }
  return { rank: 'D', color: 'text-gray-400' }
}

export function getTitle(
  score: number,
  maxCombo: number,
  wrongPlaceCount: number,
  chaosPeak: number,
  memoryEffectiveRate: number,
  levelCompleted: boolean,
  memoryLockCount?: number
): string {
  if (!levelCompleted) return '家务系统崩溃'
  if (score >= 1200 && wrongPlaceCount === 0 && chaosPeak < 45) return '完美记忆管家'
  if (score >= 1200 && memoryEffectiveRate > 0.8 && memoryLockCount && memoryLockCount > 0) return '记忆守护专家'
  if (score >= 900 && memoryEffectiveRate > 0.7) return '高效家务机器人'
  if (score >= 900 && maxCombo >= 8) return '连击高手'
  if (score >= 650) return '稳定运行中'
  if (score >= 400) return '记忆模块待维护'
  return '新手操作员'
}
