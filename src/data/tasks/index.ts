// 任务注册表
import type { TaskConfig } from '../../types/task'
import { leaveHomeTask } from './leave-home'
import { cleanTableTask } from './clean-table'
import { laundrySortTask } from './laundry-sort'

export const PUBLIC_LEVEL_ORDER = [
  'task-clean-table',
  'task-leave-home',
  'task-laundry-sort',
] as const

export type PublicTaskId = typeof PUBLIC_LEVEL_ORDER[number]
export const HIDDEN_TASK_IDS = [] as const
export type HiddenTaskId = typeof HIDDEN_TASK_IDS[number]

/**
 * 全部 5 关均公开显示，无需通关解锁。
 */
export function getPublicTaskTemplates(): TaskConfig[] {
  return taskTemplates.slice()
}

export function isPublicTaskId(id: string): id is PublicTaskId {
  return (PUBLIC_LEVEL_ORDER as readonly string[]).includes(id)
}

export function isHiddenTaskId(id: string): id is HiddenTaskId {
  return (HIDDEN_TASK_IDS as readonly string[]).includes(id)
}

export function getNextPublicTaskId(currentTaskId: string): PublicTaskId | null {
  const currentIndex = PUBLIC_LEVEL_ORDER.findIndex((id) => id === currentTaskId)
  if (currentIndex === -1 || currentIndex >= PUBLIC_LEVEL_ORDER.length - 1) {
    return null
  }
  return PUBLIC_LEVEL_ORDER[currentIndex + 1]
}

export const taskTemplates: TaskConfig[] = [
  cleanTableTask,
  leaveHomeTask,
  laundrySortTask,
]

export function getTaskById(id: string): TaskConfig | undefined {
  return taskTemplates.find((task) => task.id === id)
}

export type TaskRole = 'tutorial' | 'semifinal-core' | 'challenge'

export interface TaskPresentation {
  role: TaskRole
  shortDescription: string
  estimatedMinutes: number
  emoji: string
}

export const taskPresentationById: Record<string, TaskPresentation> = {
  'task-clean-table': {
    role: 'tutorial',
    shortDescription: '把 9 件餐具按类别归位：杯勺→水槽，盘叉→橱柜',
    estimatedMinutes: 2,
    emoji: '🍽️',
  },
  'task-leave-home': {
    role: 'semifinal-core',
    shortDescription: '钥匙猫把书、杯子、小熊、收音机藏到全屋，90秒内找回放回茶几',
    estimatedMinutes: 4,
    emoji: '🚪',
  },
  'task-laundry-sort': {
    role: 'challenge',
    shortDescription: '六件衣物三类分拣，篮子会被交换位置——靠颜色而非位置记忆',
    estimatedMinutes: 5,
    emoji: '👕',
  },
}

export const tutorialTaskId = 'task-clean-table'
export const coreTaskId = 'task-leave-home'

export {
  leaveHomeTask,
  cleanTableTask,
  laundrySortTask,
}
