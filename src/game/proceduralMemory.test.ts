import { describe, it, expect } from 'vitest'
import {
  checkProceduralStep,
  initProceduralProgress,
  isSequenceCompleted,
  getCurrentStepLabel,
  getSequenceProgressPercent,
} from './proceduralMemory'
import type { GoalSpec, EntityStateSnapshot } from '../types/task'

const alwaysFalse = (): boolean => false

const makeGoal = (sequence: { action: 'pick' | 'place' | 'use'; targetId: string; label: string }[]): GoalSpec => ({
  id: 'g-test',
  description: 'test',
  memoryType: 'procedural',
  predicate: alwaysFalse as (entities: EntityStateSnapshot[]) => boolean,
  requiredSequence: sequence,
})

describe('proceduralMemory', () => {
  describe('initProceduralProgress', () => {
    it('初始状态正确', () => {
      const p = initProceduralProgress()
      expect(p.currentStepIndex).toBe(0)
      expect(p.mistakeCount).toBe(0)
      expect(p.completed).toBe(false)
    })
  })

  describe('checkProceduralStep', () => {
    it('无序列时任何操作都匹配', () => {
      const goal: GoalSpec = {
        id: 'g-test',
        description: 'test',
        memoryType: 'spatial',
        predicate: alwaysFalse as (entities: EntityStateSnapshot[]) => boolean,
      }
      const progress = initProceduralProgress()
      const result = checkProceduralStep(goal, progress, 'pick', 'obj-foo')
      expect(result.matched).toBe(true)
      expect(result.justCompleted).toBe(false)
    })

    it('匹配正确的步骤会推进进度', () => {
      const goal = makeGoal([
        { action: 'pick', targetId: 'obj-a', label: '拿起A' },
        { action: 'place', targetId: 'obj-b', label: '放下B' },
      ])
      let progress = initProceduralProgress()

      const r1 = checkProceduralStep(goal, progress, 'pick', 'obj-a')
      expect(r1.matched).toBe(true)
      expect(r1.progress.currentStepIndex).toBe(1)
      expect(r1.progress.completed).toBe(false)
      expect(r1.stepLabel).toBe('拿起A')

      progress = r1.progress
      const r2 = checkProceduralStep(goal, progress, 'place', 'obj-b')
      expect(r2.matched).toBe(true)
      expect(r2.progress.currentStepIndex).toBe(2)
      expect(r2.progress.completed).toBe(true)
      expect(r2.justCompleted).toBe(true)
    })

    it('顺序错误会增加 mistakeCount', () => {
      const goal = makeGoal([
        { action: 'pick', targetId: 'obj-a', label: '拿起A' },
        { action: 'pick', targetId: 'obj-b', label: '拿起B' },
      ])
      const progress = initProceduralProgress()

      const result = checkProceduralStep(goal, progress, 'pick', 'obj-b')
      expect(result.matched).toBe(false)
      expect(result.progress.mistakeCount).toBe(1)
      expect(result.progress.currentStepIndex).toBe(0)
    })

    it('不在序列中的操作被忽略', () => {
      const goal = makeGoal([
        { action: 'pick', targetId: 'obj-a', label: '拿起A' },
      ])
      const progress = initProceduralProgress()

      const result = checkProceduralStep(goal, progress, 'pick', 'obj-z')
      expect(result.matched).toBe(true)
      expect(result.progress.currentStepIndex).toBe(0)
    })

    it('已完成的序列不再响应', () => {
      const goal = makeGoal([
        { action: 'pick', targetId: 'obj-a', label: '拿起A' },
      ])
      const progress = { currentStepIndex: 1, mistakeCount: 0, completed: true }

      const result = checkProceduralStep(goal, progress, 'pick', 'obj-a')
      expect(result.matched).toBe(true)
      expect(result.justCompleted).toBe(false)
    })
  })

  describe('isSequenceCompleted', () => {
    it('无序列视为已完成', () => {
      const goal: GoalSpec = {
        id: 'g-test',
        description: 'test',
        memoryType: 'spatial',
        predicate: alwaysFalse as (entities: EntityStateSnapshot[]) => boolean,
      }
      expect(isSequenceCompleted(goal, initProceduralProgress())).toBe(true)
    })

    it('有序列但未完成时返回 false', () => {
      const goal = makeGoal([
        { action: 'pick', targetId: 'obj-a', label: '拿起A' },
      ])
      expect(isSequenceCompleted(goal, initProceduralProgress())).toBe(false)
    })

    it('序列完成后返回 true', () => {
      const goal = makeGoal([
        { action: 'pick', targetId: 'obj-a', label: '拿起A' },
      ])
      expect(isSequenceCompleted(goal, { currentStepIndex: 1, mistakeCount: 0, completed: true })).toBe(true)
    })
  })

  describe('getCurrentStepLabel', () => {
    it('返回当前步骤的 label', () => {
      const goal = makeGoal([
        { action: 'pick', targetId: 'obj-a', label: '第一步' },
        { action: 'place', targetId: 'cnt-x', label: '第二步' },
      ])
      expect(getCurrentStepLabel(goal, initProceduralProgress())).toBe('第一步')
    })

    it('已完成时返回 null', () => {
      const goal = makeGoal([
        { action: 'pick', targetId: 'obj-a', label: '第一步' },
      ])
      expect(getCurrentStepLabel(goal, { currentStepIndex: 1, mistakeCount: 0, completed: true })).toBeNull()
    })
  })

  describe('getSequenceProgressPercent', () => {
    it('空序列返回 100%', () => {
      const goal: GoalSpec = {
        id: 'g-test',
        description: 'test',
        memoryType: 'spatial',
        predicate: alwaysFalse as (entities: EntityStateSnapshot[]) => boolean,
      }
      expect(getSequenceProgressPercent(goal, initProceduralProgress())).toBe(100)
    })

    it('计算正确百分比', () => {
      const goal = makeGoal([
        { action: 'pick', targetId: 'a', label: '1' },
        { action: 'pick', targetId: 'b', label: '2' },
        { action: 'pick', targetId: 'c', label: '3' },
        { action: 'pick', targetId: 'd', label: '4' },
      ])
      expect(getSequenceProgressPercent(goal, { currentStepIndex: 0, mistakeCount: 0, completed: false })).toBe(0)
      expect(getSequenceProgressPercent(goal, { currentStepIndex: 2, mistakeCount: 0, completed: false })).toBe(50)
      expect(getSequenceProgressPercent(goal, { currentStepIndex: 4, mistakeCount: 0, completed: true })).toBe(100)
    })
  })
})
