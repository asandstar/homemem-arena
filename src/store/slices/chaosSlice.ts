import { DEFAULT_LEVEL_BALANCE } from '../../data/levelBalance'
import { playChaosWarning } from '../../audio/sfx'

export interface ChaosSlice {
  chaosValue: number
  chaosPeak: number
  chaosEffectActive: boolean
  consecutiveMistakes: number
  consecutiveSuccesses: number
  lastRandomEventTime: number

  incrementChaos: (amount: number) => void
  modifyChaos: (amount: number) => void
  resetChaos: () => void
  triggerChaosEffect: () => void
  recordMistake: () => void
  recordSuccess: () => void
  checkRandomEvent: () => void
}

export const createChaosSlice = (set: any, get: any): ChaosSlice => ({
  chaosValue: 0,
  chaosPeak: 0,
  chaosEffectActive: false,
  consecutiveMistakes: 0,
  consecutiveSuccesses: 0,
  lastRandomEventTime: 0,

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

  modifyChaos: (amount: number) => {
    const currentChaos = get().chaosValue
    set((state: any) => {
      const newValue = Math.max(0, Math.min(DEFAULT_LEVEL_BALANCE.maxChaos, state.chaosValue + amount))
      return {
        chaosValue: newValue,
        chaosPeak: amount > 0 ? Math.max(state.chaosPeak, newValue) : state.chaosPeak,
      }
    })
    const newChaos = get().chaosValue
    if (newChaos >= 80 && currentChaos < 80) {
      playChaosWarning()
    }
  },

  resetChaos: () => {
    set({ chaosValue: 0, consecutiveMistakes: 0, consecutiveSuccesses: 0, lastRandomEventTime: 0 })
  },

  triggerChaosEffect: () => {
    set({ chaosEffectActive: true })
    setTimeout(() => {
      set({ chaosEffectActive: false })
    }, 2000)
  },

  recordMistake: () => {
    const { consecutiveMistakes } = get()
    const newMistakes = consecutiveMistakes + 1

    if (newMistakes >= 3) {
      get().addEventToast({
        id: 'evt-frustration',
        type: 'warning' as const,
        message: '⚠️ 连续错误操作！混乱值增加！',
        icon: 'alert',
      })
      get().incrementChaos(15)
      get().breakCombo()
    }

    set({
      consecutiveMistakes: newMistakes,
      consecutiveSuccesses: 0,
    })
  },

  recordSuccess: () => {
    const { consecutiveSuccesses } = get()
    const newSuccesses = consecutiveSuccesses + 1

    if (newSuccesses >= 5) {
      get().addEventToast({
        id: 'evt-focus',
        type: 'success' as const,
        message: '✨ 连续正确操作！混乱值下降！',
        icon: 'sparkles',
      })
      get().modifyChaos(-10)
    }

    set({
      consecutiveSuccesses: newSuccesses,
      consecutiveMistakes: 0,
    })
  },

  checkRandomEvent: () => {
    const { chaosValue, lastRandomEventTime, entities } = get()
    const now = Date.now()

    if (now - lastRandomEventTime < 10000) return

    const probability = chaosValue < 50 ? 0 : chaosValue < 70 ? 0.02 : chaosValue < 85 ? 0.05 : 0.1

    if (Math.random() < probability) {
      set({ lastRandomEventTime: now })

      const freeEntities = entities.filter((e: any) => e.status === 'free' && !e.placedIn)
      if (freeEntities.length > 0) {
        const randomEntity = freeEntities[Math.floor(Math.random() * freeEntities.length)]

        get().addEventToast({
          id: 'evt-chaos-move',
          type: 'warning' as const,
          message: `🌪️ 混乱中！${randomEntity.name} 被移动了！`,
          icon: 'wind',
        })
        get().markMemoryOutdated(randomEntity.configId)
      }
    }
  },
})
