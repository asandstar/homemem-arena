// 任务注册表
import type { TaskConfig } from '../../types/task'
import { leaveHomeTask } from './leave-home'
import { cleanTableTask } from './clean-table'
import { laundrySortTask } from './laundry-sort'
import { breakfastTask } from './breakfast'
import { nightPatrolTask } from './night-patrol'

export const PUBLIC_LEVEL_ORDER = [
  'task-clean-table',
  'task-leave-home',
  'task-laundry-sort',
] as const

export type PublicTaskId = typeof PUBLIC_LEVEL_ORDER[number]
export const HIDDEN_TASK_IDS = ['task-breakfast', 'task-night-patrol'] as const
export type HiddenTaskId = typeof HIDDEN_TASK_IDS[number]

/**
 * DEV-only 预留：VITE_UNLOCK_HIDDEN_LEVELS=true/'1' 时把 breakfast / night-patrol 也放进
 *  显示列表（TaskSelectPage 会用），但仍通过 isHiddenTaskId 守卫生产路由，保证 PRD 禁令不变。
 *  生产环境 / 未设置 flag：始终只显示 3 个公开关卡。
 */
export function getPublicTaskTemplates(): TaskConfig[] {
  const hiddenEnabled = (() => {
    try {
      const env = (import.meta as any)?.env
      if (!env?.DEV) return false
      const flag = String(env.VITE_UNLOCK_HIDDEN_LEVELS ?? '')
      return flag === 'true' || flag === '1'
    } catch {
      return false
    }
  })()
  if (hiddenEnabled) {
    return taskTemplates.slice() // 5 关全部
  }
  return taskTemplates.filter((t) => isPublicTaskId(t.id)) // 默认 3 关
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
  breakfastTask,
  nightPatrolTask,
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
    shortDescription: '学习基本操作——移动、拾取、放置、保存记忆',
    estimatedMinutes: 2,
    emoji: '🍽️',
  },
  'task-leave-home': {
    role: 'semifinal-core',
    shortDescription: '找钥匙、手机、雨伞，小心猫咪把钥匙推到地上',
    estimatedMinutes: 4,
    emoji: '🚪',
  },
  'task-laundry-sort': {
    role: 'challenge',
    shortDescription: '衣物分类大作战，幽灵会交换篮子位置、藏起袜子',
    estimatedMinutes: 5,
    emoji: '👕',
  },
  'task-breakfast': {
    role: 'challenge',
    shortDescription: '困在时间循环里的早餐，按正确流程准备再归位',
    estimatedMinutes: 5,
    emoji: '⏰',
  },
  'task-night-patrol': {
    role: 'challenge',
    shortDescription: '深夜巡逻，黑暗中巡查各个房间，应对夜间扰动',
    estimatedMinutes: 6,
    emoji: '🌙',
  },
}

export const tutorialTaskId = 'task-clean-table'
export const coreTaskId = 'task-leave-home'

export {
  leaveHomeTask,
  cleanTableTask,
  laundrySortTask,
  breakfastTask,
  nightPatrolTask,
}
