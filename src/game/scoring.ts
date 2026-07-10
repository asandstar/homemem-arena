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

export function getRank(score: number): { rank: string; color: string } {
  if (score >= 1200) return { rank: 'S', color: 'text-amber-400' }
  if (score >= 900) return { rank: 'A', color: 'text-green-400' }
  if (score >= 650) return { rank: 'B', color: 'text-blue-400' }
  if (score >= 400) return { rank: 'C', color: 'text-purple-400' }
  return { rank: 'D', color: 'text-gray-400' }
}

export function getTitle(
  score: number,
  _maxCombo: number,
  wrongPlaceCount: number,
  chaosPeak: number,
  memoryEffectiveRate: number,
  levelCompleted: boolean
): string {
  if (!levelCompleted) return '家务系统崩溃'
  if (score >= 1200 && wrongPlaceCount === 0 && chaosPeak < 45) return '完美记忆管家'
  if (score >= 900 && memoryEffectiveRate > 0.7) return '高效家务机器人'
  if (score >= 650) return '稳定运行中'
  if (score >= 400) return '记忆模块待维护'
  return '新手操作员'
}
