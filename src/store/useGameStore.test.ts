import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './useGameStore'
import type { EntityState } from '../types/object'
import { sharedRooms } from '../data/rooms'

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
      // L3 有真正可开合的橱柜；L2 仅有不可开合的茶几放置面。
      useGameStore.getState().initializeTask('task-laundry-sort')
    })

    it('可以使用当前房间的容器', () => {
      const state = useGameStore.getState()
      const currentRoom = state.currentRoom
      const container = state.task?.containers.find(c => c.room === currentRoom && c.openable !== false)
      expect(container).toBeDefined()
      const containerId = container!.id

      // 先移动机器人到容器附近（useContainer 有 2.5m 距离检查）
      const roomCenter = sharedRooms[currentRoom].center
      useGameStore.setState({
        robotPosition: {
          x: roomCenter.x + container!.position.x,
          y: 0,
          z: roomCenter.z + container!.position.z,
        },
      })

      const result = useGameStore.getState().useContainer(containerId)
      expect(result.success).toBe(true)
    })

    it('不能使用其他房间的容器', () => {
      const state = useGameStore.getState()
      // 当前公开关卡没有其他房间的任务容器，使用虚构 ID 模拟越界访问。
      // 使用一个虚构的容器 ID 模拟"其他房间的容器"场景。
      const result = state.useContainer('cnt-other-room-fake')
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
      const timeLimitMs = store.task?.timeLimit ? store.task.timeLimit * 1000 : 180_000
      store.tickElapsed(timeLimitMs + 1)
      const state = useGameStore.getState()
      expect(state.elapsedMs).toBe(timeLimitMs)
      expect(state.levelFailed).toBe(true)
      expect(state.failureReason).toBe('任务超时')
      // BUG-P1-2：终局 phase 统一为 result
      expect(state.phase).toBe('result')
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
      const freeObjs = getFreeEntities(3)

      for (let i = 0; i < 3; i++) {
        useGameStore.getState().saveMemory(freeObjs[i])
      }

      const slots = useGameStore.getState().memorySlots
      const filled = slots.filter(s => s !== null).length
      expect(filled).toBe(3)

      const result = useGameStore.getState().saveMemory(freeObjs[0])
      expect(result.success).toBe(true)
    })

    it('锁定的记忆槽不会被替换', () => {
      const freeObjs = getFreeEntities(3)

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
    it('打开 L3 下层橱柜后，柜内物件分开展示并保持在柜面', () => {
      useGameStore.getState().initializeTask('task-laundry-sort')
      const state = useGameStore.getState()
      const cabinet = state.task!.containers.find((item) => item.id === 'cnt-cabinet-lower')!
      useGameStore.setState({
        robotPosition: {
          x: cabinet.position.x,
          y: 0,
          z: -5.35 + cabinet.position.z + 0.8,
        },
      })

      expect(useGameStore.getState().useContainer(cabinet.id).success).toBe(true)
      const revealed = useGameStore.getState().entities.filter((item) => (
        ['obj-cereal', 'obj-breakfast-bowl', 'obj-breakfast-cup'].includes(item.configId)
      ))
      expect(revealed.every((item) => item.status === 'free')).toBe(true)
      expect(revealed.every((item) => item.surfaceContainerId === cabinet.id)).toBe(true)
      expect(new Set(revealed.map((item) => item.position.x)).size).toBe(3)
      expect(revealed.every((item) => item.position.y > cabinet.surfaceHeight!)).toBe(true)
    })

    it('脚本移动已放置物体时清除旧 placedIn 和容器成员关系', () => {
      useGameStore.getState().initializeTask('task-clean-table')
      const entity = useGameStore.getState().entities.find((item) => item.configId === 'obj-mug-1')!
      useGameStore.setState((state) => ({
        entities: state.entities.map((item) => (
          item.id === entity.id ? { ...item, status: 'placed' as const, placedIn: 'cnt-sink' } : item
        )),
        containerStates: {
          ...state.containerStates,
          'cnt-sink': {
            ...state.containerStates['cnt-sink'],
            containedIds: ['obj-mug-1'],
          },
        },
      }))

      useGameStore.getState().startMoveAnimation('obj-mug-1', 'dining', { x: 0, y: 0, z: 0 })

      const moved = useGameStore.getState().entities.find((item) => item.id === entity.id)
      expect(moved?.status).toBe('free')
      expect(moved?.placedIn).toBeUndefined()
      expect(useGameStore.getState().containerStates['cnt-sink'].containedIds).not.toContain('obj-mug-1')
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
      useGameStore.getState().initializeTask('task-leave-home')
    })

    it('可以切换房间', () => {
      const state = useGameStore.getState()
      const startRoom = state.currentRoom
      // leave-home spawns in living (rooms[0]), switch to bedroom which is in rooms list
      const targetRoom = startRoom === 'living' ? 'bedroom' : 'living'
      state.moveToRoom(targetRoom, { x: 0, y: 0, z: 0 })
      expect(useGameStore.getState().currentRoom).toBe(targetRoom)
      expect(useGameStore.getState().currentRoom).not.toBe(startRoom)
    })

    it('切换房间时位置更新', () => {
      useGameStore.getState().moveToRoom('entrance', { x: 1, y: 2, z: 3 })
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
      state.moveToRoom('dining', { x: 0, y: 0, z: 0 })

      const held = useGameStore.getState().entities.find(e => e.id === freeObj.id)
      expect(held?.currentRoom).toBe('dining')
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
