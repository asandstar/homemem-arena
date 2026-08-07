/**
 * 游戏核心类型定义
 *
 * 将 useGameStore 中需要被 slice 共享的类型提取到此文件，
 * 避免 useGameStore.ts 与 slices/ 之间的循环依赖。
 */

import type { RoomId, Vec3 } from '../types/room'

export type ViewMode = 'first-person' | 'top-down'
export type GamePhase = 'idle' | 'briefing' | 'playing' | 'probing' | 'analyzing' | 'result' | 'aborted'

export type MemoryPriority = 'high' | 'medium' | 'low'

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
  /** 记忆优先级：high=任务关键（不易被覆盖），medium=普通，low=最易被覆盖 */
  priority?: MemoryPriority
  /** 记忆记录时物体的世界坐标（Minimap 过期位置标记使用） */
  position?: { x: number; y: number; z: number }
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

export type EventToastType = 'info' | 'success' | 'warning' | 'event' | 'cat' | 'phone'

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

/** L2 示范高亮：scriptedEvent.highlightDemo 触发后被推入 activeDemoHighlights；
 *  Object3D / Container3D 检测命中即显示强化发光环。 */
export interface DemoHighlight {
  /** 唯一 id（通常就是 scriptedEvent id） */
  id: string
  /** 高亮对应物体 configId（obj-books 等） */
  objectConfigId?: string
  /** 高亮对应容器 id（cnt-bookcase 等） */
  containerId?: string
  /** 高亮颜色（默认琥珀色 #f59e0b） */
  color: string
  /** 过期绝对时间（Date.now()+durationMs）；sweepExpiredDemoHighlights 清理 */
  expireAt: number
}
