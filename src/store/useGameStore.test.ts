import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './useGameStore'
import type { EntityState } from '../types/object'

describe('useGameStore - 核心状态流转测试', () => {
  beforeEach(() => {
    useGameStore.getState().resetTask()
  })

  describe('初始化', () => {
    it('初始状态 - 没有任务', () => {
      const state = useGameStore.getState()
      expect(state.task).toBeNull()
      expect(state.heldEntityId).toBeNull()
      expect(state.score).toBe(0)
      expect(state.combo).toBe(0)
      expect(state.levelCompleted).toBe(false)
      expect(state.levelFailed).toBe(false)
    })

    it('可以初始化第一关', () => {
      useGameStore.getState().initializeTask('task-leave-home')
      const state = useGameStore.getState()
      expect(state.task).not.toBeNull()
      expect(state.task?.id).toBe('task-leave-home')
      expect(state.entities.length).toBeGreaterThan(0)
      expect(state.currentRoom).toBeDefined()
    })

    it('可以初始化第二关', () => {
      useGameStore.getState().initializeTask('task-clean-table')
      const state = useGameStore.getState()
      expect(state.task).not.toBeNull()
      expect(state.task?.id).toBe('task-clean-table')
      expect(state.entities.length).toBeGreaterThan(0)
    })

    it('重置后重新初始化当前任务', () => {
      useGameStore.getState().initializeTask('task-leave-home')
      const before = useGameStore.getState()
      before.addScore(100)
      before.addCombo()
      useGameStore.getState().resetTask()
      const after = useGameStore.getState()
      expect(after.task?.id).toBe('task-leave-home')
      expect(after.score).toBe(0)
      expect(after.combo).toBe(0)
      expect(after.heldEntityId).toBeNull()
    })
  })

  describe('实体拾取/放置', () => {
    beforeEach(() => {
      useGameStore.getState().initializeTask('task-clean-table')
    })

    function getFreeEntity(): EntityState {
      const e = useGameStore.getState().entities.find(e => e.status === 'free')
      if (!e) throw new Error('No free entity found')
      return e
    }

    it('可以拾取一个 free 状态的物体', () => {
      const state = useGameStore.getState()
      const freeObj = getFreeEntity()

      const result = state.pickEntity(freeObj.id)
      expect(result.success).toBe(true)
      expect(useGameStore.getState().heldEntityId).toBe(freeObj.id)

      const picked = useGameStore.getState().entities.find(e => e.id === freeObj.id)
      expect(picked?.status).toBe('held')
    })

    it('手里拿着东西时不能再拾取', () => {
      const state = useGameStore.getState()
      const freeObjs = state.entities.filter(e => e.status === 'free')
      expect(freeObjs.length).toBeGreaterThan(1)

      const r1 = state.pickEntity(freeObjs[0].id)
      expect(r1.success).toBe(true)

      const r2 = state.pickEntity(freeObjs[1].id)
      expect(r2.success).toBe(false)
    })

    it('拾取后当前房间同步', () => {
      const state = useGameStore.getState()
      const startRoom = state.currentRoom
      const freeObj = state.entities.find(e => e.status === 'free' && e.currentRoom === startRoom)
      if (!freeObj) return

      state.pickEntity(freeObj.id)
      const held = useGameStore.getState().entities.find(e => e.id === freeObj.id)
      expect(held?.currentRoom).toBe(startRoom)
    })

    it('不存在的实体不能拾取', () => {
      const state = useGameStore.getState()
      const result = state.pickEntity('nonexistent-entity')
      expect(result.success).toBe(false)
    })
  })

  describe('容器操作', () => {
    beforeEach(() => {
      useGameStore.getState().initializeTask('task-leave-home')
    })

    it('可以使用当前房间的容器', () => {
      const state = useGameStore.getState()
      const currentRoom = state.currentRoom
      const containerId = state.task?.containers.find(c => c.room === currentRoom)?.id
      expect(containerId).toBeDefined()

      const result = state.useContainer(containerId!)
      expect(result.success).toBe(true)
    })

    it('不能使用其他房间的容器', () => {
      const state = useGameStore.getState()
      const currentRoom = state.currentRoom
      const otherContainer = state.task?.containers.find(c => c.room !== currentRoom)
      expect(otherContainer).toBeDefined()

      const result = state.useContainer(otherContainer!.id)
      expect(result.success).toBe(false)
    })

    it('不存在的容器不能使用', () => {
      const state = useGameStore.getState()
      const result = state.useContainer('nonexistent-container')
      expect(result.success).toBe(false)
    })
  })

  describe('计分与连击', () => {
    beforeEach(() => {
      useGameStore.getState().initializeTask('task-leave-home')
    })

    it('初始分数为 0', () => {
      expect(useGameStore.getState().score).toBe(0)
    })

    it('加分后分数增加', () => {
      useGameStore.getState().addScore(100)
      expect(useGameStore.getState().score).toBe(100)
    })

    it('连续加分可以累加', () => {
      useGameStore.getState().addScore(50)
      useGameStore.getState().addScore(30)
      expect(useGameStore.getState().score).toBe(80)
    })

    it('初始连击为 0', () => {
      expect(useGameStore.getState().combo).toBe(0)
    })

    it('addCombo 增加连击', () => {
      useGameStore.getState().addCombo()
      expect(useGameStore.getState().combo).toBe(1)
      useGameStore.getState().addCombo()
      expect(useGameStore.getState().combo).toBe(2)
    })

    it('breakCombo 重置连击', () => {
      useGameStore.getState().addCombo()
      useGameStore.getState().addCombo()
      useGameStore.getState().breakCombo()
      expect(useGameStore.getState().combo).toBe(0)
    })

    it('maxCombo 记录最高连击', () => {
      useGameStore.getState().addCombo()
      useGameStore.getState().addCombo()
      useGameStore.getState().breakCombo()
      useGameStore.getState().addCombo()
      expect(useGameStore.getState().maxCombo).toBe(2)
    })

    it('重置分数后归零', () => {
      useGameStore.getState().addScore(999)
      useGameStore.getState().resetScore()
      expect(useGameStore.getState().score).toBe(0)
    })
  })

  describe('混乱度系统', () => {
    beforeEach(() => {
      useGameStore.getState().initializeTask('task-leave-home')
    })

    it('初始混乱度为 0', () => {
      expect(useGameStore.getState().chaosValue).toBe(0)
    })

    it('incrementChaos 增加混乱度', () => {
      useGameStore.getState().incrementChaos(10)
      expect(useGameStore.getState().chaosValue).toBe(10)
    })

    it('chaosPeak 记录最高混乱度', () => {
      useGameStore.getState().incrementChaos(30)
      useGameStore.getState().resetChaos()
      expect(useGameStore.getState().chaosPeak).toBe(30)
    })

    it('resetChaos 重置当前混乱度但不重置峰值', () => {
      useGameStore.getState().incrementChaos(50)
      useGameStore.getState().resetChaos()
      expect(useGameStore.getState().chaosValue).toBe(0)
      expect(useGameStore.getState().chaosPeak).toBe(50)
    })
  })

  describe('游戏状态切换', () => {
    beforeEach(() => {
      useGameStore.getState().initializeTask('task-leave-home')
    })

    it('初始状态 - 未完成未失败', () => {
      const state = useGameStore.getState()
      expect(state.phase).toBe('briefing')
      expect(state.levelCompleted).toBe(false)
      expect(state.levelFailed).toBe(false)
    })

    it('简报阶段暂停，开始后按关卡 timeLimit 超时', () => {
      const store = useGameStore.getState()
      store.tickElapsed(30_000)
      expect(useGameStore.getState().elapsedMs).toBe(0)
      expect(useGameStore.getState().chaosValue).toBe(0)

      store.startPlaying()
      store.tickElapsed(600_001)
      const state = useGameStore.getState()
      expect(state.elapsedMs).toBe(600_000)
      expect(state.levelFailed).toBe(true)
      expect(state.failureReason).toBe('任务超时')
      expect(state.phase).toBe('probing')
    })

    it('setLevelCompleted 标记完成', () => {
      useGameStore.getState().setLevelCompleted()
      expect(useGameStore.getState().levelCompleted).toBe(true)
      expect(useGameStore.getState().levelFailed).toBe(false)
    })

    it('setLevelFailed 标记失败', () => {
      useGameStore.getState().setLevelFailed('timeout')
      expect(useGameStore.getState().levelFailed).toBe(true)
      expect(useGameStore.getState().failureReason).toBe('timeout')
    })

    it('重置后状态清除', () => {
      useGameStore.getState().setLevelCompleted()
      useGameStore.getState().resetTask()
      const state = useGameStore.getState()
      expect(state.levelCompleted).toBe(false)
      expect(state.levelFailed).toBe(false)
      expect(state.score).toBe(0)
      expect(state.combo).toBe(0)
      expect(state.chaosValue).toBe(0)
    })
  })

  describe('记忆槽系统', () => {
    beforeEach(() => {
      useGameStore.getState().initializeTask('task-clean-table')
    })

    function getFreeEntities(count: number): EntityState[] {
      const list = useGameStore.getState().entities.filter(e => e.status === 'free')
      if (list.length < count) throw new Error(`Not enough free entities: ${list.length}`)
      return list.slice(0, count)
    }

    it('初始记忆槽全空', () => {
      const slots = useGameStore.getState().memorySlots
      expect(slots.every(s => s === null)).toBe(true)
    })

    it('可以保存记忆', () => {
      const state = useGameStore.getState()
      const [freeObj] = getFreeEntities(1)
      const result = state.saveMemory(freeObj)
      expect(result.success).toBe(true)
      expect(result.slotIndex).toBe(0)

      const slots = useGameStore.getState().memorySlots
      expect(slots[0]).not.toBeNull()
      expect(slots[0]?.entityConfigId).toBe(freeObj.configId)
    })

    it('记忆槽满了会替换', () => {
      const freeObjs = getFreeEntities(5)

      for (let i = 0; i < 3; i++) {
        useGameStore.getState().saveMemory(freeObjs[i])
      }

      const slots = useGameStore.getState().memorySlots
      const filled = slots.filter(s => s !== null).length
      expect(filled).toBe(3)

      const result = useGameStore.getState().saveMemory(freeObjs[4])
      expect(result.success).toBe(true)
    })

    it('锁定的记忆槽不会被替换', () => {
      const freeObjs = getFreeEntities(4)

      useGameStore.getState().saveMemory(freeObjs[0])
      useGameStore.getState().lockMemorySlot(0)

      useGameStore.getState().saveMemory(freeObjs[1])
      useGameStore.getState().saveMemory(freeObjs[2])

      const slots = useGameStore.getState().memorySlots
      expect(slots[0]?.locked).toBe(true)
      expect(slots[0]?.entityConfigId).toBe(freeObjs[0].configId)
    })

    it('可以清空记忆槽', () => {
      const [freeObj] = getFreeEntities(1)
      useGameStore.getState().saveMemory(freeObj)
      useGameStore.getState().clearMemorySlot(0)
      expect(useGameStore.getState().memorySlots[0]).toBeNull()
    })

    it('markMemoryOutdated 标记过期', () => {
      const [freeObj] = getFreeEntities(1)
      useGameStore.getState().saveMemory(freeObj)
      useGameStore.getState().markMemoryOutdated(freeObj.configId)

      const slot = useGameStore.getState().memorySlots[0]
      expect(slot?.outdated).toBe(true)
    })
  })

  describe('目标里程碑与脚本状态一致性', () => {
    it('早餐准备里程碑完成后可以在归位状态下完成关卡', () => {
      useGameStore.getState().initializeTask('task-breakfast')
      useGameStore.getState().startPlaying()
      const milestoneIds = [
        'g-open-fridge',
        'g-open-cabinet',
        'g-get-milk',
        'g-get-cup',
        'g-get-bowl',
        'g-get-cereal',
        'g-prepare-breakfast',
      ]
      useGameStore.setState((state) => ({
        achievedGoalIds: new Set(milestoneIds),
        entities: state.entities.map((entity) => {
          if (entity.configId === 'obj-milk') return { ...entity, status: 'hidden' as const, placedIn: 'cnt-fridge' }
          if (entity.configId === 'obj-cereal') return { ...entity, status: 'hidden' as const, placedIn: 'cnt-cabinet-upper' }
          if (entity.configId === 'obj-cup' || entity.configId === 'obj-bowl') {
            return { ...entity, status: 'placed' as const, placedIn: 'cnt-dishwasher' }
          }
          return entity
        }),
      }))

      useGameStore.getState().checkLevelCompletion()

      expect(useGameStore.getState().levelCompleted).toBe(true)
      expect(useGameStore.getState().phase).toBe('probing')
      expect(useGameStore.getState().achievedGoalIds.has('g-close-containers')).toBe(true)
    })

    it('脚本移动已放置物体时清除旧 placedIn 和容器成员关系', () => {
      useGameStore.getState().initializeTask('task-clean-table')
      const entity = useGameStore.getState().entities.find((item) => item.configId === 'obj-plate')!
      useGameStore.setState((state) => ({
        entities: state.entities.map((item) => (
          item.id === entity.id ? { ...item, status: 'placed' as const, placedIn: 'cnt-dishwasher' } : item
        )),
        containerStates: {
          ...state.containerStates,
          'cnt-dishwasher': {
            ...state.containerStates['cnt-dishwasher'],
            containedIds: ['obj-plate'],
          },
        },
      }))

      useGameStore.getState().startMoveAnimation('obj-plate', 'dining', { x: 0, y: 0, z: 0 })

      const moved = useGameStore.getState().entities.find((item) => item.id === entity.id)
      expect(moved?.status).toBe('free')
      expect(moved?.placedIn).toBeUndefined()
      expect(useGameStore.getState().containerStates['cnt-dishwasher'].containedIds).not.toContain('obj-plate')
    })

    it('已放置物体可以重新拾取并从容器中移除', () => {
      useGameStore.getState().initializeTask('task-clean-table')
      const entity = useGameStore.getState().entities.find((item) => item.currentRoom === useGameStore.getState().currentRoom)!
      useGameStore.setState((state) => ({
        entities: state.entities.map((item) => (
          item.id === entity.id ? { ...item, status: 'placed' as const, placedIn: 'cnt-dining-table' } : item
        )),
        containerStates: {
          ...state.containerStates,
          'cnt-dining-table': {
            ...state.containerStates['cnt-dining-table'],
            containedIds: [entity.configId],
          },
        },
      }))

      const result = useGameStore.getState().pickEntity(entity.id)

      expect(result.success).toBe(true)
      expect(useGameStore.getState().entities.find((item) => item.id === entity.id)?.placedIn).toBeUndefined()
      expect(useGameStore.getState().containerStates['cnt-dining-table'].containedIds).not.toContain(entity.configId)
    })
  })

  describe('房间切换', () => {
    beforeEach(() => {
      useGameStore.getState().initializeTask('task-clean-table')
    })

    it('可以切换房间', () => {
      const state = useGameStore.getState()
      const startRoom = state.currentRoom
      state.moveToRoom('kitchen', { x: 0, y: 0, z: 0 })
      expect(useGameStore.getState().currentRoom).toBe('kitchen')
      expect(useGameStore.getState().currentRoom).not.toBe(startRoom)
    })

    it('切换房间时位置更新', () => {
      useGameStore.getState().moveToRoom('kitchen', { x: 1, y: 2, z: 3 })
      const pos = useGameStore.getState().robotPosition
      expect(pos.x).toBe(1)
      expect(pos.y).toBe(2)
      expect(pos.z).toBe(3)
    })

    it('手持物体切换房间 - 物体跟随', () => {
      const state = useGameStore.getState()
      const freeObj = state.entities.find(e => e.status === 'free')
      if (!freeObj) return

      state.pickEntity(freeObj.id)
      state.moveToRoom('kitchen', { x: 0, y: 0, z: 0 })

      const held = useGameStore.getState().entities.find(e => e.id === freeObj.id)
      expect(held?.currentRoom).toBe('kitchen')
    })
  })

  describe('压力测试 - 快速状态切换', () => {
    beforeEach(() => {
      useGameStore.getState().initializeTask('task-clean-table')
    })

    it('1000 次加分 - 分数正确累加', () => {
      for (let i = 0; i < 1000; i++) {
        useGameStore.getState().addScore(1)
      }
      expect(useGameStore.getState().score).toBe(1000)
    })

    it('100 次连击增减 - 状态一致', () => {
      for (let i = 0; i < 100; i++) {
        useGameStore.getState().addCombo()
      }
      expect(useGameStore.getState().combo).toBe(100)
      expect(useGameStore.getState().maxCombo).toBe(100)

      useGameStore.getState().breakCombo()
      expect(useGameStore.getState().combo).toBe(0)
      expect(useGameStore.getState().maxCombo).toBe(100)
    })

    it('100 次重置循环 - 不报错', () => {
      for (let i = 0; i < 100; i++) {
        useGameStore.getState().resetTask()
        useGameStore.getState().initializeTask('task-clean-table')
      }

      const final = useGameStore.getState()
      expect(final.task).not.toBeNull()
      expect(final.heldEntityId).toBeNull()
    })

    it('所有 free 实体都能被拾取 - 状态正确流转', () => {
      const freeObjs = useGameStore.getState().entities.filter(e => e.status === 'free')
      expect(freeObjs.length).toBeGreaterThan(0)

      for (const obj of freeObjs.slice(0, 10)) {
        useGameStore.getState().resetTask()
        useGameStore.getState().initializeTask('task-clean-table')
        const s = useGameStore.getState()
        const entity = s.entities.find(e => e.id === obj.id)
        if (entity && entity.status === 'free') {
          const result = s.pickEntity(entity.id)
          expect(result.success).toBe(true)
          expect(s.heldEntityId).toBe(entity.id)
        }
      }
    })
  })
})
