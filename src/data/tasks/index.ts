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

/** 当前比赛版公开三关。 */
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
    shortDescription: '保存第一条位置记忆，再把 3 件餐具正确归位',
    estimatedMinutes: 2,
    emoji: '🍽️',
  },
  'task-leave-home': {
    role: 'semifinal-core',
    shortDescription: '为三个房间的物品建立稳定记忆，再依靠记忆取回',
    estimatedMinutes: 3,
    emoji: '🧠',
  },
  'task-laundry-sort': {
    role: 'challenge',
    shortDescription: '记住麦片旧位置，发现冲突后重新观察并更新记忆',
    estimatedMinutes: 4,
    emoji: '🥣',
  },
}

export const tutorialTaskId = 'task-clean-table'
export const coreTaskId = 'task-leave-home'

export {
  leaveHomeTask,
  cleanTableTask,
  laundrySortTask,
}
