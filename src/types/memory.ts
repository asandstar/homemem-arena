// 记忆类型与记忆库

export type MemoryType = 'temporal' | 'spatial' | 'object' | 'procedural'

export interface MemoryEntry {
  id: string
  type: MemoryType
  /** 物体或事件主体 */
  subject: string
  /** 关联房间 */
  room: string | null
  /** 自然语言描述 */
  content: string
  /** 时间戳 (相对任务开始) */
  timestamp: number
  /** 步数 */
  step: number
  /** 置信度 0-1 */
  confidence: number
  /** 记忆来源 */
  source: 'observation' | 'action' | 'scripted-event' | 'inference'
  /** 关联的实体 ID */
  relatedEntityId?: string
}
