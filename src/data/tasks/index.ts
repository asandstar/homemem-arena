// 任务注册表
import type { TaskConfig } from '../../types/task'
import { leaveHomeTask } from './leave-home'
import { cleanTableTask } from './clean-table'
import { laundrySortTask } from './laundry-sort'
import { breakfastTask } from './breakfast'

export const taskTemplates: TaskConfig[] = [
  cleanTableTask,
  leaveHomeTask,
  laundrySortTask,
  breakfastTask,
]

export function getTaskById(id: string): TaskConfig | undefined {
  return taskTemplates.find((task) => task.id === id)
}

export {
  leaveHomeTask,
  cleanTableTask,
  laundrySortTask,
  breakfastTask,
}
