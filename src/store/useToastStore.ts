import { create } from 'zustand'
import { withSafeSnapshot } from './safeStore'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastMessage {
  id: string
  type: ToastType
  message: string
}

interface ToastStore {
  toasts: ToastMessage[]
  addToast: (type: ToastType, message: string) => void
  removeToast: (id: string) => void
}

// Hotfix 2026-08-07 v2: 首帧 getSnapshot=null 全局兜底（safeStore.ts withSafeSnapshot v2，useMemo 缓存 selector 避免 MAX_DEPTH 死循环）
const _rawToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (type, message) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }))

    const duration = type === 'error' ? 3000 : 2000
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, duration)
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  },
}))

export const useToastStore = withSafeSnapshot(_rawToastStore)
