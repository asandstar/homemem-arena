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
}

export const DEFAULT_LEVEL_BALANCE: LevelBalanceConfig = {
  timeLimit: 180,
  chaosGrowthPerSecond: 0.15,
  wrongPlacementChaos: 8,
  repeatSearchChaos: 2,
  outdatedMemoryChaos: 4,
  eventChaos: 6,
  maxChaos: 100,
  chaosGlitchThreshold: 60,
  chaosEventBoostThreshold: 80,
  memorySlotCount: 3,
  pickTargetScore: 20,
  correctPlaceScore: 100,
  validMemoryUseScore: 50,
  memoryUpdateScore: 30,
  wrongPlacePenalty: 50,
  repeatSearchPenalty: 10,
  timeBonusRate: 2,
  comboMultiplierStep: 0.1,
  maxComboMultiplier: 2.0,
}
