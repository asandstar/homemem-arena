import { describe, it, expect } from 'vitest'
import {
  PUBLIC_LEVEL_ORDER,
  HIDDEN_TASK_IDS,
  getNextPublicTaskId,
  isPublicTaskId,
  isHiddenTaskId,
  getTaskById,
  taskTemplates,
} from './index'

describe('关卡范围（三个公开关卡）', () => {
  it('公开关卡集合 PUBLIC_LEVEL_ORDER 长度为 3', () => {
    expect(PUBLIC_LEVEL_ORDER.length).toBe(3)
  })

  it('PUBLIC_LEVEL_ORDER 包含全部 3 个关卡', () => {
    expect([...PUBLIC_LEVEL_ORDER]).toEqual([
      'task-clean-table',
      'task-leave-home',
      'task-laundry-sort',
    ])
  })

  it('HIDDEN_TASK_IDS 为空（无隐藏关卡）', () => {
    expect([...HIDDEN_TASK_IDS]).toEqual([])
  })

  it('getNextPublicTaskId 按顺序返回下一关', () => {
    expect(getNextPublicTaskId('task-clean-table')).toBe('task-leave-home')
    expect(getNextPublicTaskId('task-leave-home')).toBe('task-laundry-sort')
  })

  it('getNextPublicTaskId(最后一关) = null', () => {
    expect(getNextPublicTaskId('task-laundry-sort')).toBeNull()
  })

  it('未知 taskId 不会产生下一关', () => {
    expect(getNextPublicTaskId('task-nonexistent')).toBeNull()
  })

  it('isHiddenTaskId 对所有关卡均返回 false（无隐藏关卡）', () => {
    expect(isHiddenTaskId('task-clean-table')).toBe(false)
    expect(isHiddenTaskId('task-leave-home')).toBe(false)
    expect(isHiddenTaskId('task-laundry-sort')).toBe(false)
    expect(isHiddenTaskId('')).toBe(false)
  })

  it('isPublicTaskId 识别全部 3 个关卡', () => {
    expect(isPublicTaskId('task-clean-table')).toBe(true)
    expect(isPublicTaskId('task-leave-home')).toBe(true)
    expect(isPublicTaskId('task-laundry-sort')).toBe(true)
    expect(isPublicTaskId('task-nonexistent')).toBe(false)
  })

  it('全部 3 个关卡均在 taskTemplates 中存在，getTaskById 可正常获取', () => {
    for (const id of PUBLIC_LEVEL_ORDER) {
      const task = getTaskById(id)
      expect(task).toBeDefined()
      expect(task?.id).toBe(id)
      expect(task?.name).toBeTruthy()
      expect(task?.goals.length).toBeGreaterThan(0)
    }
  })

  it('taskTemplates 总数为 3', () => {
    expect(taskTemplates.length).toBe(3)
  })
})
