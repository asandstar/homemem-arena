export interface LevelBalanceConfig {
  timeLimit: number
  chaosGrowthPerSecond: number
  wrongPlacementChaos: number
  repeatSearchChaos: number
  outdatedMemoryChaos: number
  eventChaos: number
  maxChaos: number
  chaosGlitchThreshold: number
  chaosEventBoostThreshold: number
  memorySlotCount: number
  pickTargetScore: number
  correctPlaceScore: number
  validMemoryUseScore: number
  memoryUpdateScore: number
  wrongPlacePenalty: number
  repeatSearchPenalty: number
  timeBonusRate: number
  comboMultiplierStep: number
  maxComboMultiplier: number
  comboBreakPenalty: number
  memoryEfficiencyBonus: number
  memoryLockBonus: number
  earlyCompletionBonus: number
  chaosMemoryDecayMultiplierThreshold: number
}

export const DEFAULT_LEVEL_BALANCE: LevelBalanceConfig = {
  timeLimit: 180,
  chaosGrowthPerSecond: 0.3,
  wrongPlacementChaos: 12,
  repeatSearchChaos: 4,
  outdatedMemoryChaos: 10,
  eventChaos: 8,
  maxChaos: 100,
  chaosGlitchThreshold: 60,
  chaosEventBoostThreshold: 80,
  memorySlotCount: 3,
  pickTargetScore: 20,
  correctPlaceScore: 100,
  validMemoryUseScore: 50,
  memoryUpdateScore: 40,
  wrongPlacePenalty: 50,
  repeatSearchPenalty: 15,
  timeBonusRate: 3,
  comboMultiplierStep: 0.1,
  maxComboMultiplier: 2.0,
  comboBreakPenalty: 30,
  memoryEfficiencyBonus: 100,
  memoryLockBonus: 30,
  earlyCompletionBonus: 200,
  chaosMemoryDecayMultiplierThreshold: 30,
}
