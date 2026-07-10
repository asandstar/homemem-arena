import { DEFAULT_LEVEL_BALANCE } from '../../data/levelBalance'
import { playChaosWarning } from '../../audio/sfx'

export interface ChaosSlice {
  chaosValue: number
  chaosPeak: number
  chaosEffectActive: boolean

  incrementChaos: (amount: number) => void
  resetChaos: () => void
  triggerChaosEffect: () => void
}

export const createChaosSlice = (set: any, get: any): ChaosSlice => ({
  chaosValue: 0,
  chaosPeak: 0,
  chaosEffectActive: false,

  incrementChaos: (amount: number) => {
    const currentChaos = get().chaosValue
    set((state: any) => {
      const newValue = Math.min(DEFAULT_LEVEL_BALANCE.maxChaos, state.chaosValue + amount)
      return {
        chaosValue: newValue,
        chaosPeak: Math.max(state.chaosPeak, newValue),
      }
    })
    const newChaos = get().chaosValue
    if (newChaos >= 80 && currentChaos < 80) {
      playChaosWarning()
    }
  },

  resetChaos: () => {
    set({ chaosValue: 0 })
  },

  triggerChaosEffect: () => {
    set({ chaosEffectActive: true })
    setTimeout(() => {
      set({ chaosEffectActive: false })
    }, 2000)
  },
})
