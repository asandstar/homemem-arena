import { describe, it, expect } from 'vitest'
import { taskTemplates, taskPresentationById, tutorialTaskId, coreTaskId } from './index'
import { checkTaskLayout } from '../../../scripts/qa-layout'

describe('任务一致性测试', () => {
  it('taskTemplates 中 task id 唯一', () => {
    const ids = taskTemplates.map(t => t.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('taskPresentationById 覆盖所有 taskTemplates', () => {
    const templateIds = new Set(taskTemplates.map(t => t.id))
    const presentationIds = new Set(Object.keys(taskPresentationById))
    
    for (const id of templateIds) {
      expect(presentationIds.has(id)).toBe(true)
    }
  })

  it('taskPresentationById 不包含不存在的 task id', () => {
    const templateIds = new Set(taskTemplates.map(t => t.id))
    const presentationIds = Object.keys(taskPresentationById)
    
    for (const id of presentationIds) {
      expect(templateIds.has(id)).toBe(true)
    }
  })

  it('tutorialTaskId 存在且为 task-clean-table', () => {
    expect(tutorialTaskId).toBe('task-clean-table')
    const exists = taskTemplates.some(t => t.id === tutorialTaskId)
    expect(exists).toBe(true)
  })

  it('coreTaskId 存在且为 task-leave-home', () => {
    expect(coreTaskId).toBe('task-leave-home')
    const exists = taskTemplates.some(t => t.id === coreTaskId)
    expect(exists).toBe(true)
  })

  it('关卡总数为 taskTemplates.length', () => {
    expect(taskTemplates.length).toBe(5)
  })

  it('每个任务都有有效的 presentation 配置', () => {
    for (const task of taskTemplates) {
      const presentation = taskPresentationById[task.id]
      expect(presentation).toBeDefined()
      expect(['tutorial', 'semifinal-core', 'challenge']).toContain(presentation.role)
      expect(presentation.shortDescription).toBeDefined()
      expect(presentation.shortDescription.length).toBeGreaterThan(0)
      expect(presentation.estimatedMinutes).toBeGreaterThan(0)
    }
  })

  it('只有一个教学关', () => {
    const tutorialCount = Object.values(taskPresentationById).filter(p => p.role === 'tutorial').length
    expect(tutorialCount).toBe(1)
  })

  it('只有一个核心展示关', () => {
    const coreCount = Object.values(taskPresentationById).filter(p => p.role === 'semifinal-core').length
    expect(coreCount).toBe(1)
  })

  it('复赛产品顺序正确', () => {
    const expectedOrder = [
      'task-clean-table',
      'task-leave-home',
      'task-laundry-sort',
      'task-breakfast',
      'task-night-patrol',
    ]
    const actualOrder = taskTemplates.map(t => t.id)
    expect(actualOrder).toEqual(expectedOrder)
  })

  it('所有任务的 spawn 都在 rooms[0] 房间内（无 blocker）', () => {
    for (const t of taskTemplates) {
      const results = checkTaskLayout(t)
      const bad = results.filter(
        (r) => !r.passed && ['spawn-inside-room'].includes(String(r.check)),
      )
      expect(bad.map((r) => r.message)).toEqual([])
    }
  })

  it('所有物体都在其声明的 initialRoom 房间内（无 blocker）', () => {
    for (const t of taskTemplates) {
      const results = checkTaskLayout(t)
      const bad = results.filter(
        (r) => !r.passed && ['object-inside-room'].includes(String(r.check)),
      )
      expect(bad.map((r) => r.message)).toEqual([])
    }
  })

  it('所有容器都在其声明的 room 房间内（无 blocker）', () => {
    for (const t of taskTemplates) {
      const results = checkTaskLayout(t)
      const bad = results.filter(
        (r) => !r.passed && ['container-inside-room'].includes(String(r.check)),
      )
      expect(bad.map((r) => r.message)).toEqual([])
    }
  })

  it('所有房间内容器无 AABB 重叠（无 major）', () => {
    for (const t of taskTemplates) {
      const results = checkTaskLayout(t)
      const bad = results.filter(
        (r) => !r.passed && ['container-overlap'].includes(String(r.check)),
      )
      expect(bad.map((r) => r.message)).toEqual([])
    }
  })

  it('指定 surfaceContainerId 的物体，其 xz 投影都在容器顶面范围内（无 major）', () => {
    for (const t of taskTemplates) {
      const results = checkTaskLayout(t)
      const bad = results.filter(
        (r) => !r.passed && ['object-on-container'].includes(String(r.check)),
      )
      expect(bad.map((r) => r.message)).toEqual([])
    }
  })
})