/**
 * Event Bus - 统一事件分发系统
 *
 * 所有游戏事件通过单一入口分发，解决事件系统碎片化问题。
 * 采用同步发布-订阅模式，不引入异步复杂度。
 */

import type { SessionEvent } from '../types/event'

type EventHandler = (event: SessionEvent) => void

const listeners = new Set<EventHandler>()

/** 订阅事件 */
export function subscribeEvent(handler: EventHandler): () => void {
  listeners.add(handler)
  return () => {
    listeners.delete(handler)
  }
}

/** 发布事件 */
export function emitEvent(event: SessionEvent): void {
  listeners.forEach((handler) => {
    try {
      handler(event)
    } catch (err) {
      console.error('Event handler error:', err)
    }
  })
}

/** 获取当前监听器数量（调试用） */
export function getListenerCount(): number {
  return listeners.size
}

/** 清空所有监听器（测试用） */
export function clearListeners(): void {
  listeners.clear()
}
