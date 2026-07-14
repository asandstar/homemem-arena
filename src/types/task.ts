// 任务类型定义

import type { RoomId } from './room'
import type { ObjectSpec, ContainerSpec } from './object'
import type { MemoryType } from './memory'

export type { MemoryType }

export type Difficulty = 'tutorial' | 'easy' | 'medium' | 'hard'

/** 单个目标 */
export interface GoalSpec {
  id: string
  description: string
  /** 历史里程碑达成后保持完成；终局约束必须在结算时仍成立 */
  kind?: 'milestone' | 'terminal-constraint'
  /** 只有依赖目标已经达成后，当前目标才会开始判定 */
  dependsOnGoalIds?: string[]
  /** 可选阶段名，用于多阶段任务的 UI 分组 */
  stage?: string
  /** 目标依赖的记忆类型 */
  memoryType: MemoryType
  /** 目标判定函数（接收当前所有实体状态） */
  predicate: (entities: EntityStateSnapshot[]) => boolean
  /** 与此目标关联的物品 configId 列表（用于判定任务关键物品，影响记忆优先级） */
  relatedObjectIds?: string[]
  /** 完成时的简短消息 */
  achievedMessage?: string
  /**
   * 程序记忆：要求的操作序列（仅当 memoryType === 'procedural' 时生效）
   * 玩家必须按顺序执行这些操作，才能达成此目标。
   * 每一步错误操作会触发混乱值增加和提示。
   */
  requiredSequence?: ProceduralStep[]
}

/** 程序记忆的一个步骤 */
export interface ProceduralStep {
  /** 操作类型 */
  action: 'pick' | 'place' | 'use'
  /**
   * 操作目标标识：
   * - pick: 物体 configId（拿起了什么）
   * - place: 物体 configId（放下了什么）
   * - use: 容器 id（打开/关闭了哪个容器）
   */
  targetId: string
  /** 步骤描述（用于HUD显示） */
  label: string
}

/** 实体状态快照（用于目标判定，避免循环依赖） */
export interface EntityStateSnapshot {
  configId: string
  status: string
  currentRoom: RoomId
  placedIn?: string
  category: string
  properties: Record<string, string | number | boolean>
}

/** 脚本化环境事件 */
export interface ScriptedEventSpec {
  id: string
  /** 触发时机：步数 N 后触发，或条件函数 */
  trigger: number | ((step: number, entities: EntityStateSnapshot[]) => boolean)
  /** 事件类型 */
  type: 'move-entity' | 'hide-entity' | 'show-entity' | 'message'
  /** 目标物体 ID（移动/隐藏/显示 时使用） */
  targetId?: string
  /** 移动目标位置（move-entity 时） */
  targetPosition?: { room: RoomId; x: number; y: number; z: number }
  /** 消息内容（message 时） */
  message?: string
  /** 自然语言描述（写入记忆） */
  description: string
  /** 关联的记忆类型 */
  memoryType: MemoryType
  /** 标记哪个物体的记忆为过期 */
  markMemoryOutdated?: string
  /** 触发的 3D 效果名称 */
  eventEffect?: string
  /** 房间方向提示 */
  roomHint?: string
  /** Toast 类型覆盖（优先于自动判断） */
  toastType?: 'cat' | 'phone' | 'warning' | 'event' | 'info'
}

/** 记忆测试题 */
export interface ProbeQuestionSpec {
  id: string
  type: 'count' | 'location' | 'state' | 'sequence' | 'object-id' | 'recognition'
  question: string
  options?: string[]
  correctAnswer: string | string[]
  /** 关联的记忆类型 */
  dependsOnMemoryType: MemoryType
  /** 题目的难度 */
  difficulty?: Difficulty
  /** 提示（可选） */
  hint?: string
  /** 关联的物体 ID */
  relatedObjectIds?: string[]
  /** 关联的事件 ID */
  relatedEventIds?: string[]
}

/** 任务配置 */
export interface TaskConfig {
  id: string
  name: string
  description: string
  memoryTypes: MemoryType[]
  difficulty: Difficulty
  /** 使用的房间 ID 列表 */
  rooms: RoomId[]
  objects: ObjectSpec[]
  containers: ContainerSpec[]
  goals: GoalSpec[]
  scriptedEvents: ScriptedEventSpec[]
  probes: ProbeQuestionSpec[]
  /** 任务开始提示 */
  briefing: string
  /** 关卡完成文案 */
  completionText?: string
  /** 关卡失败文案 */
  failureText?: string
  /** 机器人系统提示（开场时显示） */
  systemPrompt?: string
  /** 标签 - 用于任务卡片展示 */
  tags?: string[]
  /** 任务图标 key */
  iconKey?: 'door' | 'dish' | 'shirt' | 'breakfast'
  /** 关卡时间限制（秒） */
  timeLimit?: number
  /** 玩家初始位置（房间局部坐标，可选），不填则为房间中心 */
  spawnPosition?: { x: number; z: number }
  /** 玩家初始朝向（弧度，可选），0=朝南(-Z)，π=朝北(+Z)，π/2=朝东(+X)，-π/2=朝西(-X) */
  spawnRotation?: number
}
