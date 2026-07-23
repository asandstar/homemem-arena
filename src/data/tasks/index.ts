// 任务注册表
import type { TaskConfig } from '../../types/task'
import { leaveHomeTask } from './leave-home'
import { cleanTableTask } from './clean-table'
import { laundrySortTask } from './laundry-sort'
import { breakfastTask } from './breakfast'
import { nightPatrolTask } from './night-patrol'

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
