// 事件类型 - 完整记录机器人执行过程

import type { RoomId } from './room'
import type { Vec3 } from './room'
import type { MemoryType } from './memory'

/** 通用事件基础 */
export interface BaseEvent {
  id: string
  /** 时间戳 (ms 相对任务开始) */
  timestamp: number
  /** 步数 */
  step: number
}

/** 观察事件 - 周期性记录机器人视野 */
export interface ObservationEvent extends BaseEvent {
  type: 'observation'
  roomId: RoomId
  /** 视野中可见的实体 ID 列表 */
  visibleEntityIds: string[]
  /** 不可见但已记忆的实体（遮挡或在其他房间） */
  rememberedEntityIds: string[]
  /** 机器人位置 */
  robotPosition: Vec3
  /** 机器人朝向 (Y 轴旋转) */
  robotRotation: number
}

/** 移动事件 */
export interface MovementEvent extends BaseEvent {
  type: 'movement'
  fromRoom: RoomId
  toRoom: RoomId
  /** 是否穿过门 */
  crossedDoorway: boolean
  /** 移动后的位置 */
  position: Vec3
}

/** 操作事件 */
export interface ActionEvent extends BaseEvent {
  type: 'action'
  action: 'pick' | 'place' | 'open' | 'close' | 'use'
  targetId: string
  result: 'success' | 'fail'
  reason?: string
  /** 关联的房间 */
  roomId: RoomId
}

/** 记忆写入事件 */
export interface MemoryWriteEvent extends BaseEvent {
  type: 'memory_write'
  memoryId: string
  memoryType: string
  content: string
}

/** 目标进度事件 */
export interface TaskProgressEvent extends BaseEvent {
  type: 'task_progress'
  goalId: string
  status: 'achieved' | 'failed'
  description: string
  taskId?: string
}

/** 为避免玩家长时间停滞而触发的渐进式心流辅助 */
export interface FlowInterventionEvent extends BaseEvent {
  type: 'flow_intervention'
  kind: 'stagnation-hint'
  level: 1 | 2
  goalId: string
  message: string
  /** 自上一次目标进展以来的毫秒数 */
  progressStallMs: number
}

/** 脚本化环境事件触发 */
export interface ScriptedEventTrigger extends BaseEvent {
  type: 'scripted_event'
  eventId: string
  description: string
  /** 涉及的实体 */
  affectedEntityIds: string[]
}

/** 记忆测试回答事件 */
export interface ProbeAnswerEvent extends BaseEvent {
  type: 'probe_answer'
  questionId: string
  questionType: string
  userAnswer: string | string[]
  correctAnswer: string | string[]
  isCorrect: boolean
  /** 反应时间 (ms) */
  reactionTime: number
  memoryType?: MemoryType
  relatedObjectIds?: string[]
  relatedEventIds?: string[]
}

export type SessionEvent =
  | ObservationEvent
  | MovementEvent
  | ActionEvent
  | MemoryWriteEvent
  | TaskProgressEvent
  | FlowInterventionEvent
  | ScriptedEventTrigger
  | ProbeAnswerEvent
