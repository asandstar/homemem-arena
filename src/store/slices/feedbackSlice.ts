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
      const s = get()
      if (typeof s?.removeFloatingText === 'function') s.removeFloatingText(id)
    }, 1500)
  },

  removeFloatingText: (id: string) => {
    set((state: any) => ({
      floatingTexts: state.floatingTexts.filter((t: FloatingText) => t.id !== id),
    }))
  },

  addEventToast: (message: string | Record<string, any>, type: EventToastType, duration = 4000, icon?: string) => {
    const id = generateId('toast')
    // ⚠️ 运行时守卫：防止调用方把 {id,type,message,icon} 对象当第一个参数传入。
    // chaosSlice 历史上出现过 3 次此错误，导致 message 字段变成对象，
    // HUD 渲染 {toast.message} 时触发 "Objects are not valid as a React child" 崩溃。
    let msg: string
    let toastType: EventToastType = type
    let dur: number = duration
    let ico: string | undefined = icon
    if (typeof message === 'object' && message !== null) {
      const obj = message as any
      msg = String(obj.message ?? obj.msg ?? obj.text ?? JSON.stringify(obj).slice(0, 200))
      if (obj.type && typeof obj.type === 'string' && ['info','warning','event','cat','phone'].includes(obj.type)) {
        toastType = obj.type as EventToastType
      }
      if (typeof obj.duration === 'number') dur = obj.duration
      if (typeof obj.icon === 'string') ico = obj.icon
    } else {
      msg = String(message ?? '')
    }
    set((state: any) => ({
      eventToasts: [...state.eventToasts, { id, message: msg, type: toastType, icon: ico, createdAt: Date.now(), duration: dur }],
    }))
    setTimeout(() => {
      const s = get()
      if (typeof s?.removeEventToast === 'function') s.removeEventToast(id)
    }, dur)
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
