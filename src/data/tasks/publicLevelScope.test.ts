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

describe('P0-B 公开关卡范围（三个递进关卡）', () => {
  // 1. 任务页只显示三个公开关卡（通过公开集合长度和内容保证）
  it('公开关卡集合 PUBLIC_LEVEL_ORDER 长度为 3（公开进度分母=3）', () => {
    expect(PUBLIC_LEVEL_ORDER.length).toBe(3)
  })

  // 2 & 3. 页面不存在早餐时间循环 / 深夜巡逻（隐藏关卡不在公开集合中）
  it('PUBLIC_LEVEL_ORDER 中不包含 task-breakfast（早餐时间循环）', () => {
    expect((PUBLIC_LEVEL_ORDER as readonly string[]).includes('task-breakfast')).toBe(false)
  })

  it('PUBLIC_LEVEL_ORDER 中不包含 task-night-patrol（深夜巡逻）', () => {
    expect((PUBLIC_LEVEL_ORDER as readonly string[]).includes('task-night-patrol')).toBe(false)
  })

  it('公开关卡顺序为：餐桌整理 → 出门大作战 → 洗衣幽灵', () => {
    expect([...PUBLIC_LEVEL_ORDER]).toEqual([
      'task-clean-table',
      'task-leave-home',
      'task-laundry-sort',
    ])
  })

  it('HIDDEN_TASK_IDS 明确声明了两个隐藏关卡', () => {
    expect([...HIDDEN_TASK_IDS]).toEqual(['task-breakfast', 'task-night-patrol'])
  })

  // 4. 第一关下一关是第二关
  it('getNextPublicTaskId(task-clean-table) = task-leave-home（第一关下一关是第二关）', () => {
    expect(getNextPublicTaskId('task-clean-table')).toBe('task-leave-home')
  })

  // 5. 第二关下一关是第三关
  it('getNextPublicTaskId(task-leave-home) = task-laundry-sort（第二关下一关是第三关）', () => {
    expect(getNextPublicTaskId('task-leave-home')).toBe('task-laundry-sort')
  })

  // 6. 第三关没有下一关
  it('getNextPublicTaskId(task-laundry-sort) = null（第三关没有下一关）', () => {
    expect(getNextPublicTaskId('task-laundry-sort')).toBeNull()
  })

  it('隐藏关卡不会产生下一关（不会把第四五关暴露在"下一关"按钮中）', () => {
    expect(getNextPublicTaskId('task-breakfast')).toBeNull()
    expect(getNextPublicTaskId('task-night-patrol')).toBeNull()
  })

  it('未知 taskId 不会产生下一关', () => {
    expect(getNextPublicTaskId('task-nonexistent')).toBeNull()
  })

  // 7. 公开进度分母为 3（已断言 PUBLIC_LEVEL_ORDER.length=3，再加交叉验证）
  it('公开进度分母恒为 3，与 taskTemplates 总数（保留5关数据）无关', () => {
    expect(PUBLIC_LEVEL_ORDER.length).toBe(3)
    expect(taskTemplates.length >= 5).toBe(true) // 第四五关源码保留
  })

  // 8. production 模式隐藏关卡路由被拦截（通过 isHiddenTaskId 守卫函数保证）
  it('isHiddenTaskId 正确识别隐藏关卡（路由守卫将基于此拦截）', () => {
    expect(isHiddenTaskId('task-breakfast')).toBe(true)
    expect(isHiddenTaskId('task-night-patrol')).toBe(true)
    expect(isHiddenTaskId('task-clean-table')).toBe(false)
    expect(isHiddenTaskId('task-leave-home')).toBe(false)
    expect(isHiddenTaskId('task-laundry-sort')).toBe(false)
    expect(isHiddenTaskId('')).toBe(false)
  })

  it('isPublicTaskId 只识别三个公开关卡', () => {
    expect(isPublicTaskId('task-clean-table')).toBe(true)
    expect(isPublicTaskId('task-leave-home')).toBe(true)
    expect(isPublicTaskId('task-laundry-sort')).toBe(true)
    expect(isPublicTaskId('task-breakfast')).toBe(false)
    expect(isPublicTaskId('task-night-patrol')).toBe(false)
  })

  // 9. 三个公开关卡仍可正常进入（task id 在注册表中真实存在且可 getTaskById 找到）
  it('三个公开关卡均在 taskTemplates 中存在，getTaskById 可正常获取', () => {
    for (const id of PUBLIC_LEVEL_ORDER) {
      const task = getTaskById(id)
      expect(task).toBeDefined()
      expect(task?.id).toBe(id)
      expect(task?.name).toBeTruthy()
      expect(task?.goals.length).toBeGreaterThan(0)
    }
  })

  it('隐藏关卡任务数据仍保留（不删除源码）', () => {
    expect(getTaskById('task-breakfast')).toBeDefined()
    expect(getTaskById('task-night-patrol')).toBeDefined()
  })
})
