/**
 * 游戏核心类型定义
 *
 * 将 useGameStore 中需要被 slice 共享的类型提取到此文件，
 * 避免 useGameStore.ts 与 slices/ 之间的循环依赖。
 */

import type { RoomId, Vec3 } from '../types/room'

export type ViewMode = 'first-person' | 'top-down'
export type GamePhase = 'idle' | 'briefing' | 'playing' | 'probing' | 'analyzing' | 'result' | 'aborted'

export interface MemorySlot {
  id: string
  objectName: string
  roomName: string
  containerName: string | null
  state: string
  timestamp: number
  locked: boolean
  confidence: number
  outdated: boolean
  entityConfigId: string
  memoryType?: string
}

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

/** 物体移动动画 */
export interface MoveAnimation {
  entityId: string
  fromPosition: Vec3
  toPosition: Vec3
  toRoom: RoomId
  startTime: number
  duration: number
  isActive: boolean
}

export type FeedbackType = 'success' | 'error' | 'combo' | 'event'

export interface FeedbackState {
  type: FeedbackType
  message: string
  combo?: number
  eventData?: any
}
