import { DEFAULT_LEVEL_BALANCE } from '../../data/levelBalance'

export interface ScoreSliceState {
  score: number
  combo: number
  maxCombo: number
  wrongPlaceCount: number
  repeatSearchCount: number
  memoryUsedCount: number
  outdatedMemoryCount: number
  memoryUpdateCount: number

  addScore: (points: number) => void
  resetScore: () => void
  addCombo: () => void
  breakCombo: () => void
  incrementWrongPlace: () => void
  incrementRepeatSearch: () => void
  incrementMemoryUsed: () => void
  incrementOutdatedMemory: () => void
  incrementMemoryUpdate: () => void
}

export const createScoreSlice = (set: any, get: any): ScoreSliceState => ({
  score: 0,
  combo: 0,
  maxCombo: 0,
  wrongPlaceCount: 0,
  repeatSearchCount: 0,
  memoryUsedCount: 0,
  outdatedMemoryCount: 0,
  memoryUpdateCount: 0,

  addScore: (points: number) => {
    set((state: any) => ({
      score: Math.max(0, state.score + points),
    }))
  },

  resetScore: () => {
    set({ score: 0 })
  },

  addCombo: () => {
    set((state: any) => {
      const newCombo = state.combo + 1
      return {
        combo: newCombo,
        maxCombo: Math.max(state.maxCombo, newCombo),
      }
    })
    const { combo } = get()
    if (combo >= 2) {
      get().showFeedback({
        type: 'combo',
        message: `${combo} COMBO!`,
        combo,
      })
    }
  },

  breakCombo: () => {
    set({ combo: 0 })
  },

  incrementWrongPlace: () => {
    set((state: any) => ({
      wrongPlaceCount: state.wrongPlaceCount + 1,
    }))
  },

  incrementRepeatSearch: () => {
    set((state: any) => ({
      repeatSearchCount: state.repeatSearchCount + 1,
    }))
    get().addScore(-DEFAULT_LEVEL_BALANCE.repeatSearchPenalty)
    get().incrementChaos(DEFAULT_LEVEL_BALANCE.repeatSearchChaos)
    get().breakCombo()
  },

  incrementMemoryUsed: () => {
    set((state: any) => ({
      memoryUsedCount: state.memoryUsedCount + 1,
    }))
  },

  incrementOutdatedMemory: () => {
    set((state: any) => ({
      outdatedMemoryCount: state.outdatedMemoryCount + 1,
    }))
  },

  incrementMemoryUpdate: () => {
    set((state: any) => ({
      memoryUpdateCount: state.memoryUpdateCount + 1,
    }))
  },
})
