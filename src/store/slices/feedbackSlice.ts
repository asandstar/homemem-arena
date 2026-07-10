import { generateId } from '../../utils/format'

export type FloatingTextType = 'score' | 'combo' | 'error' | 'memory' | 'info'

export interface FloatingText {
  id: string
  text: string
  type: FloatingTextType
  x: number
  y: number
  createdAt: number
}

export type EventToastType = 'info' | 'warning' | 'event' | 'cat' | 'phone'

export interface EventToast {
  id: string
  message: string
  type: EventToastType
  icon?: string
  createdAt: number
  duration: number
}

export type FeedbackType = 'success' | 'error' | 'combo' | 'event'

export interface FeedbackState {
  type: FeedbackType
  message: string
  combo?: number
  eventData?: any
}

export interface FeedbackSlice {
  floatingTexts: FloatingText[]
  eventToasts: EventToast[]
  feedback: FeedbackState | null
  activeEventEffects: string[]
  shakingEntityId: string | null
  savingMemorySlotIndex: number | null

  addFloatingText: (text: string, type: FloatingTextType, x: number, y: number) => void
  removeFloatingText: (id: string) => void
  addEventToast: (message: string, type: EventToastType, duration?: number, icon?: string) => void
  removeEventToast: (id: string) => void
  triggerEventEffect: (effectName: string) => void
  triggerEntityShake: (entityId: string) => void
  triggerMemorySaveEffect: (slotIndex: number) => void
  showFeedback: (feedback: FeedbackState) => void
  hideFeedback: () => void
}

export const createFeedbackSlice = (set: any, get: any): FeedbackSlice => ({
  floatingTexts: [],
  eventToasts: [],
  feedback: null,
  activeEventEffects: [],
  shakingEntityId: null,
  savingMemorySlotIndex: null,

  addFloatingText: (text: string, type: FloatingTextType, x: number, y: number) => {
    const id = generateId('ft')
    set((state: any) => ({
      floatingTexts: [...state.floatingTexts, { id, text, type, x, y, createdAt: Date.now() }],
    }))
    setTimeout(() => {
      get().removeFloatingText(id)
    }, 1500)
  },

  removeFloatingText: (id: string) => {
    set((state: any) => ({
      floatingTexts: state.floatingTexts.filter((t: FloatingText) => t.id !== id),
    }))
  },

  addEventToast: (message: string, type: EventToastType, duration = 4000, icon?: string) => {
    const id = generateId('toast')
    set((state: any) => ({
      eventToasts: [...state.eventToasts, { id, message, type, icon, createdAt: Date.now(), duration }],
    }))
    setTimeout(() => {
      get().removeEventToast(id)
    }, duration)
  },

  removeEventToast: (id: string) => {
    set((state: any) => ({
      eventToasts: state.eventToasts.filter((t: EventToast) => t.id !== id),
    }))
  },

  triggerEventEffect: (effectName: string) => {
    set((state: any) => ({
      activeEventEffects: [...state.activeEventEffects, effectName],
    }))
    setTimeout(() => {
      set((state: any) => ({
        activeEventEffects: state.activeEventEffects.filter((e: string) => e !== effectName),
      }))
    }, 5000)
  },

  triggerEntityShake: (entityId: string) => {
    set({ shakingEntityId: entityId })
    setTimeout(() => {
      set({ shakingEntityId: null })
    }, 500)
  },

  triggerMemorySaveEffect: (slotIndex: number) => {
    set({ savingMemorySlotIndex: slotIndex })
    setTimeout(() => {
      set({ savingMemorySlotIndex: null })
    }, 1500)
  },

  showFeedback: (feedback: FeedbackState) => {
    set({ feedback })
  },

  hideFeedback: () => {
    set({ feedback: null })
  },
})
