// 三关后端"模拟手玩"脚本
// 使用 useGameStore 模拟玩家手动操作流程 + 输出每一步证据链
// 运行: VITE_E2E=true npx vitest run src/game/threeLevelBackendSim.test.ts --reporter=verbose 2>&1 | tee out.log

import { describe, expect, it, beforeEach } from 'vitest'
import { useGameStore } from '../store/useGameStore'
import type { EntityState } from '../types/object'
import type { TaskConfig } from '../types/task'
import type { GoalSpec } from '../types/task'
import { sharedRooms } from '../data/rooms'
import {
  executePick,
  executePlace,
  executeSaveMemory,
} from './commands'

function di(key: string, payload: unknown) {
  // 简单把关键快照写入 console，方便在测试输出中收集证据链
  console.info(`[DIAG:${key}]`, JSON.stringify(payload, null, 2))
}

function findByCfg(cfg: string): EntityState | undefined {
  return useGameStore.getState().entities.find((e) => e.configId === cfg)
}

function snap(task: TaskConfig | null, stage: string) {
  const s = useGameStore.getState()
  return {
    stage,
    phase: s.phase,
    room: s.currentRoom,
    pos: s.robotPosition,
    stageId: s.currentStageId,
    objective: s.currentObjective,
    held: s.heldEntityId,
    memorySlots: s.memorySlots.map((x) => (x ? { entityConfigId: x.entityConfigId, locked: x.locked, outdated: x.outdated } : null)),
    achieved: Array.from(s.achievedGoalIds),
    completed: s.levelCompleted,
    failed: s.levelFailed,
    chaos: s.chaosValue,
    score: s.score,
    entities: s.entities
      .slice()
      .sort((a, b) => a.configId.localeCompare(b.configId))
      .map((e) => ({
        id: e.id,
        cfg: e.configId,
        room: e.currentRoom,
        status: e.status,
        placedIn: e.placedIn,
        moving: (e.properties as any)?._moving,
      })),
    containers: Object.fromEntries(
      Object.entries(s.containerStates).map(([k, v]) => [k, { open: v.open, contained: [...v.containedIds] }]),
    ),
    taskGoals: task
      ? task.goals.map((g: GoalSpec) => ({
          id: g.id,
          desc: g.description,
          deps: (g as any).dependsOn ?? [],
          achieved: s.achievedGoalIds.has(g.id),
        }))
      : [],
  }
}

function setRobotAt(task: TaskConfig, localPos: { x: number; z: number; y?: number }) {
  const room = (sharedRooms as Record<string, any>)[task.rooms[0]] ?? (sharedRooms as any)[useGameStore.getState().currentRoom]
  const base = room?.center ?? { x: 0, y: 0, z: 0 }
  const p = { x: base.x + localPos.x, y: localPos.y ?? 0, z: base.z + localPos.z }
  const setFn = (useGameStore as any).setState
  if (typeof setFn === 'function') setFn({ robotPosition: p })
  return p
}

function setRobotAtContainer(task: TaskConfig, containerId: string) {
  const container = task.containers.find((c: any) => c.id === containerId)
  if (!container) return { success: false, reason: `no container:${containerId}` }
  const room = (sharedRooms as Record<string, any>)[container.room] ?? null
  if (!room) return { success: false, reason: `room not found` }
  const base = room.center ?? { x: 0, y: 0, z: 0 }
  const position = {
    x: base.x + container.position.x,
    y: 0,
    z: base.z + container.position.z,
  }
  const setFn = (useGameStore as any).setState
  if (typeof setFn === 'function') setFn({ robotPosition: position })
  // 如果房间不同，则同步切换房间
  if (useGameStore.getState().currentRoom !== container.room) {
    const s = useGameStore.getState()
    const setFn2 = (useGameStore as any).setState
    if (typeof setFn2 === 'function') {
      const newEntities = s.heldEntityId
        ? s.entities.map((e: any) => (e.id === s.heldEntityId ? { ...e, currentRoom: container.room } : e))
        : s.entities
      const newVisited = new Set(s.visitedRooms as Set<string>)
      newVisited.add(container.room)
      setFn2({ currentRoom: container.room, entities: newEntities, visitedRooms: newVisited })
    }
  }
  return { success: true, position }
}

function saveByCfg(cfg: string): { success: boolean; slotIndex?: number; reason?: string } {
  const e = findByCfg(cfg)
  if (!e) return { success: false, reason: `no entity:${cfg}` }
  return executeSaveMemory(e.id)
}

function pickByCfg(cfg: string): { success: boolean; reason?: string } {
  const e = findByCfg(cfg)
  if (!e) return { success: false, reason: `no entity:${cfg}` }
  return executePick(e.id)
}

function placeInto(containerId: string) {
  if (!useGameStore.getState().heldEntityId) return { success: false, reason: 'no held' }
  return executePlace(containerId)
}

function evalAndCheck(label: string) {
  const s = useGameStore.getState() as any
  for (let i = 0; i < 3; i++) {
    if (typeof s.updateMoveAnimations === 'function') s.updateMoveAnimations()
    if (typeof s.triggerScriptedEvents === 'function') s.triggerScriptedEvents()
    if (typeof s.evaluateStageTransitions === 'function') s.evaluateStageTransitions()
  }
  if (typeof s.checkLevelCompletion === 'function') s.checkLevelCompletion()
  const task = s.task ?? null
  di(label, snap(task, label))
}

describe('三关后端模拟实玩 & 证据链', () => {
  beforeEach(() => {
    useGameStore.getState().resetTask()
  })

  it('L1: task-clean-table —— 观察4件→保存记忆→靠近水槽触发猫移勺子→找回勺子→四件归位→Probe→Result', () => {
    useGameStore.getState().initializeTask('task-clean-table')
    const task = useGameStore.getState().task!
    useGameStore.getState().startPlaying()
    di('L1-0-INIT', snap(task, 'L1-0-INIT'))
    expect(useGameStore.getState().phase).toBe('playing')

    // 1) 观察四件餐具：靠近餐桌，保存勺子位置记忆（勺子即将被猫移走）
    di('L1-1-move-to-table', setRobotAt(task, { x: 0, z: 0 }))
    di('L1-1-saveMemory-spoon', saveByCfg('obj-spoon'))
    evalAndCheck('L1-1-AFTER-SAVE-MEMORY')
    expect(useGameStore.getState().memorySlots.some((s) => s !== null)).toBe(true)

    // 2) 保持间隔：离开餐桌去厨房水槽——确定性触发猫移走勺子（OVERRIDES: 保存记忆+靠近水槽）
    di('L1-2-move-to-kitchen-sink', setRobotAtContainer(task, 'cnt-kitchen-sink'))
    for (let i = 0; i < 3; i++) evalAndCheck(`L1-2-AFTER-SINK-pass-${i}`)
    // 验证猫事件已触发 + 阶段切到 stage-perturbed
    expect(useGameStore.getState().triggeredEvents.has('se-cat-moves-spoon')).toBe(true)
    expect(useGameStore.getState().currentStageId).toBe('stage-perturbed')

    // 3) 验证勺子被移走后仍可拾取（不软锁）：status 仍为 free
    const spoonAfterMove = findByCfg('obj-spoon')!
    expect(spoonAfterMove.status).toBe('free')
    di('L1-3-pick-spoon-from-floor', pickByCfg('obj-spoon'))
    expect(useGameStore.getState().heldEntityId).toBe(spoonAfterMove.id)

    // 4) 勺子 → 水槽（玩家已在水槽旁）
    di('L1-4-place-spoon-sink', placeInto('cnt-kitchen-sink'))
    evalAndCheck('L1-4-AFTER-SPOON-SINK')

    // 5) 马克杯 → 水槽（pick 无距离限制，放置需靠近水槽）
    di('L1-5-pick-mug', pickByCfg('obj-mug'))
    di('L1-5-move-to-sink', setRobotAtContainer(task, 'cnt-kitchen-sink'))
    di('L1-5-place-mug-sink', placeInto('cnt-kitchen-sink'))
    evalAndCheck('L1-5-AFTER-MUG-SINK')

    // 6) 盘子 → 橱柜
    di('L1-6-pick-plate', pickByCfg('obj-plate'))
    di('L1-6-move-to-cabinet', setRobotAtContainer(task, 'cnt-cabinet'))
    di('L1-6-place-plate-cabinet', placeInto('cnt-cabinet'))
    evalAndCheck('L1-6-AFTER-PLATE-CABINET')

    // 7) 叉子 → 橱柜
    di('L1-7-pick-fork', pickByCfg('obj-fork'))
    di('L1-7-move-to-cabinet-2', setRobotAtContainer(task, 'cnt-cabinet'))
    di('L1-7-place-fork-cabinet', placeInto('cnt-cabinet'))
    evalAndCheck('L1-7-AFTER-FORK-CABINET')

    // 8) 最终判：四件归位 + 里程碑 g-observe → completion
    for (let i = 0; i < 5; i++) evalAndCheck(`L1-FINAL-pass-${i}`)
    const finalState = useGameStore.getState()
    di('L1-FINAL', {
      completed: finalState.levelCompleted,
      achieved: Array.from(finalState.achievedGoalIds),
      triggeredEvents: Array.from(finalState.triggeredEvents),
      stageId: finalState.currentStageId,
      phase: finalState.phase,
    })
    expect(finalState.levelCompleted).toBe(true)
  })

  it('L2: task-leave-home —— 观看示范→错误顺序恢复→按序放置书→杯子→小熊（严格断言通关）', () => {
    useGameStore.getState().initializeTask('task-leave-home')
    const task = useGameStore.getState().task!
    useGameStore.getState().startPlaying()
    di('L2-0-INIT', snap(task, 'L2-0-INIT'))
    expect(useGameStore.getState().phase).toBe('playing')

    const allConfigs = useGameStore.getState().entities.map((e) => e.configId)
    di('L2-0-ENTITY-CONFIGS', allConfigs)
    expect(allConfigs).toContain('obj-books')
    expect(allConfigs).toContain('obj-mug')
    expect(allConfigs).toContain('obj-bear')
    // 旧出门大作战物体已移除
    expect(allConfigs).not.toContain('obj-key')
    expect(allConfigs).not.toContain('obj-phone')
    expect(allConfigs).not.toContain('obj-umbrella')

    // ========== 阶段 1：观看示范（推进 step 触发 4 个示范事件） ==========
    for (let i = 0; i < 8; i++) {
      useGameStore.getState().incrementStep()
      evalAndCheck(`L2-1-DEMO-step-${i + 1}`)
    }
    expect(useGameStore.getState().triggeredEvents.has('se-ritual-demo-1')).toBe(true)
    expect(useGameStore.getState().triggeredEvents.has('se-ritual-demo-2')).toBe(true)
    expect(useGameStore.getState().triggeredEvents.has('se-ritual-demo-3')).toBe(true)
    expect(useGameStore.getState().triggeredEvents.has('se-ritual-demo-done')).toBe(true)
    expect(useGameStore.getState().currentStageId).toBe('STAGE_REPRODUCE')

    // ========== 阶段 2：错误顺序恢复场景 ==========
    // 拿起小熊（序列第3步），尝试放到床（目标区）→ 序列当前是第1步 books → 拒绝放置，保持 held
    di('L2-2-move-to-coffee-table', setRobotAtContainer(task, 'cnt-coffee-table'))
    di('L2-2-pick-bear', pickByCfg('obj-bear'))
    evalAndCheck('L2-2-AFTER-BEAR-PICKED')
    expect(useGameStore.getState().heldEntityId).not.toBeNull()

    di('L2-2b-move-to-bed', setRobotAtContainer(task, 'cnt-bed'))
    di('L2-2b-place-bed-wrong', placeInto('cnt-bed'))
    evalAndCheck('L2-2b-AFTER-BEAR-PLACE-WRONG')
    // 验证：放置被拒绝，仍持有小熊（OVERRIDES：错误顺序拒绝放置并保持 held）
    expect(useGameStore.getState().heldEntityId).not.toBeNull()
    const bearHeld = useGameStore.getState().entities.find((e) => e.configId === 'obj-bear')!
    expect(bearHeld.status).toBe('held')

    // 放回茶几（非目标区，不触发序列检查，成功换手）
    di('L2-2c-move-to-coffee-table', setRobotAtContainer(task, 'cnt-coffee-table'))
    di('L2-2c-place-bear-back', placeInto('cnt-coffee-table'))
    evalAndCheck('L2-2c-AFTER-BEAR-BACK')
    expect(useGameStore.getState().heldEntityId).toBeNull()

    // ========== 阶段 3：正确按序放置（📖书→☕杯子→🧸小熊） ==========
    // 第1步：书 → 书架
    di('L2-3-pick-books', pickByCfg('obj-books'))
    di('L2-3-move-to-bookcase', setRobotAtContainer(task, 'cnt-bookcase'))
    di('L2-3-place-bookcase', placeInto('cnt-bookcase'))
    evalAndCheck('L2-3-AFTER-BOOKS-PLACE')
    const progressAfterBooks = useGameStore.getState().proceduralProgress['g-ritual-sequence']
    expect(progressAfterBooks?.currentStepIndex).toBe(1)
    expect(progressAfterBooks?.completed).toBe(false)

    // 第2步：杯子 → 床头柜
    di('L2-4-pick-mug', pickByCfg('obj-mug'))
    di('L2-4-move-to-nightstand', setRobotAtContainer(task, 'cnt-nightstand'))
    di('L2-4-place-nightstand', placeInto('cnt-nightstand'))
    evalAndCheck('L2-4-AFTER-MUG-PLACE')
    const progressAfterMug = useGameStore.getState().proceduralProgress['g-ritual-sequence']
    expect(progressAfterMug?.currentStepIndex).toBe(2)
    expect(progressAfterMug?.completed).toBe(false)

    // 第3步：小熊 → 床（小熊在客厅茶几上，需先回客厅拾取再去卧室床边放置）
    di('L2-5-move-to-coffee-table', setRobotAtContainer(task, 'cnt-coffee-table'))
    di('L2-5-pick-bear', pickByCfg('obj-bear'))
    di('L2-5-move-to-bed', setRobotAtContainer(task, 'cnt-bed'))
    di('L2-5-place-bed', placeInto('cnt-bed'))
    evalAndCheck('L2-5-AFTER-BEAR-PLACE')
    const progressAfterBear = useGameStore.getState().proceduralProgress['g-ritual-sequence']
    expect(progressAfterBear?.completed).toBe(true)

    // ========== 最终判定 ==========
    for (let i = 0; i < 5; i++) evalAndCheck(`L2-FINAL-pass-${i}`)
    const finalState = useGameStore.getState()
    di('L2-FINAL', {
      completed: finalState.levelCompleted,
      achieved: Array.from(finalState.achievedGoalIds),
      triggeredEvents: Array.from(finalState.triggeredEvents),
      stageId: finalState.currentStageId,
      phase: finalState.phase,
    })
    expect(finalState.levelCompleted).toBe(true)
  })

  it('L3: task-laundry-sort —— 六件三类分拣：2 件浅色→白篮 / 2 件深色→蓝篮 / 2 件毛巾→橙篮（错误类别被拒绝）', () => {
    useGameStore.getState().initializeTask('task-laundry-sort')
    const task = useGameStore.getState().task!
    useGameStore.getState().startPlaying()
    di('L3-0-INIT', snap(task, 'L3-0-INIT'))
    expect(useGameStore.getState().phase).toBe('playing')

    const allCfgs = useGameStore.getState().entities.map((e) => e.configId)
    di('L3-0-ENTITY-CONFIGS', allCfgs)
    const containerCfgs = useGameStore.getState().task?.containers.map((c) => c.id) ?? []
    di('L3-0-CONTAINER-CONFIGS', containerCfgs)

    // L3_INTERFERENCE_DEFERRED：篮子交换本轮不实现，仅验证基础六件分类
    // 6 件物体（2 件浅色 / 2 件深色 / 2 件毛巾）三类分拣到对应篮子
    expect(allCfgs).toEqual(
      expect.arrayContaining([
        'obj-white-1', 'obj-white-2',
        'obj-dark-1', 'obj-dark-2',
        'obj-towel-1', 'obj-towel-2',
      ]),
    )
    expect(allCfgs).toHaveLength(6)
    expect(containerCfgs).toEqual(
      expect.arrayContaining(['cnt-white-basket', 'cnt-dark-basket', 'cnt-towel-basket']),
    )

    // 物体初始位置（laundry 房间局部坐标）
    const cfgLocal: Record<string, { x: number; z: number }> = {
      'obj-white-1': { x: -1.2, z: 1.0 },
      'obj-white-2': { x: -1.2, z: 1.4 },
      'obj-dark-1': { x: 0, z: 1.0 },
      'obj-dark-2': { x: 0, z: 1.4 },
      'obj-towel-1': { x: 1.2, z: 1.0 },
      'obj-towel-2': { x: 1.2, z: 1.4 },
    }
    const cfgBucket: Record<string, string> = {
      'obj-white-1': 'cnt-white-basket',
      'obj-white-2': 'cnt-white-basket',
      'obj-dark-1': 'cnt-dark-basket',
      'obj-dark-2': 'cnt-dark-basket',
      'obj-towel-1': 'cnt-towel-basket',
      'obj-towel-2': 'cnt-towel-basket',
    }

    // ========== 阶段 1：规则编码（STAGE_RULES）—— save 一个记忆推进到 STAGE_SORT ==========
    const firstObserve = 'obj-white-1'
    di(`L3-1-move-${firstObserve}`, setRobotAt(task, cfgLocal[firstObserve]))
    di(`L3-1-save-${firstObserve}`, saveByCfg(firstObserve))
    evalAndCheck('L3-1-AFTER-OBSERVE')
    expect(useGameStore.getState().memorySlots.some((s) => s !== null)).toBe(true)
    // STAGE_RULES 完成条件：保存了记忆 → 推进到 STAGE_SORT
    expect(useGameStore.getState().currentStageId).toBe('stage-sort-six-items')

    // ========== 阶段 2：错误类别拒绝场景 ==========
    // 拿起浅色衣物 obj-white-1，尝试放入深色篮 cnt-dark-basket → 应被拒绝（acceptedCategories 不匹配）
    di('L3-2-move-white-1', setRobotAt(task, cfgLocal['obj-white-1']))
    di('L3-2-pick-white-1', pickByCfg('obj-white-1'))
    evalAndCheck('L3-2-AFTER-PICK-WHITE-1')
    expect(useGameStore.getState().heldEntityId).not.toBeNull()

    di('L3-2b-move-dark-basket', setRobotAtContainer(task, 'cnt-dark-basket'))
    const rejectResult = placeInto('cnt-dark-basket')
    di('L3-2b-place-white-1-into-dark-basket-REJECTED', rejectResult)
    evalAndCheck('L3-2b-AFTER-REJECTED-PLACE')
    // 验证：错误类别被篮子拒绝，仍持有浅色衣物（acceptedCategories 机制生效）
    expect(rejectResult.success).toBe(false)
    expect(useGameStore.getState().heldEntityId).not.toBeNull()
    const white1Held = useGameStore.getState().entities.find((e) => e.configId === 'obj-white-1')!
    expect(white1Held.status).toBe('held')
    expect(white1Held.placedIn).toBeUndefined()

    // ========== 阶段 3：六件正确分类 ==========
    // 先把持有的浅色衣物 #1 放进白篮（玩家当前在深色篮旁，需要移动到白篮）
    di('L3-3-move-white-basket', setRobotAtContainer(task, 'cnt-white-basket'))
    di('L3-3-place-white-1-into-white-basket', placeInto('cnt-white-basket'))
    evalAndCheck('L3-3-AFTER-WHITE-1-PLACE')
    expect(useGameStore.getState().heldEntityId).toBeNull()

    // 剩余 5 件按序拾取并放入对应篮子
    const remaining = ['obj-white-2', 'obj-dark-1', 'obj-dark-2', 'obj-towel-1', 'obj-towel-2']
    for (const cfg of remaining) {
      di(`L3-4-move-${cfg}`, setRobotAt(task, cfgLocal[cfg]))
      di(`L3-4-pick-${cfg}`, pickByCfg(cfg))
      const bucket = cfgBucket[cfg]
      di(`L3-4-move-bucket-${bucket}`, setRobotAtContainer(task, bucket))
      di(`L3-4-place-${cfg}-into-${bucket}`, placeInto(bucket))
      evalAndCheck(`L3-4-AFTER-${cfg}`)
      // 每件放置后应不再持有
      expect(useGameStore.getState().heldEntityId).toBeNull()
    }

    // ========== 最终判定 ==========
    for (let i = 0; i < 8; i++) evalAndCheck(`L3-FINAL-pass-${i}`)
    const finalState = useGameStore.getState()
    di('L3-FINAL', {
      completed: finalState.levelCompleted,
      achieved: Array.from(finalState.achievedGoalIds),
      goals: task.goals.map((g) => g.id),
      stageId: finalState.currentStageId,
      phase: finalState.phase,
    })
    // 六个目标全部达成
    expect(finalState.achievedGoalIds).toEqual(
      new Set([
        'g-white-1-basket', 'g-white-2-basket',
        'g-dark-1-basket', 'g-dark-2-basket',
        'g-towel-1-basket', 'g-towel-2-basket',
      ]),
    )
    expect(finalState.levelCompleted).toBe(true)
  })
})
