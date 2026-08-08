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

/** 移动机器人到指定物品的初始房间和位置（跨房间寻物用） */
function setRobotAtEntity(task: TaskConfig, configId: string) {
  const objSpec = task.objects.find((o: any) => o.id === configId)
  if (!objSpec) return { success: false, reason: `no object spec:${configId}` }
  const roomId = objSpec.initialRoom
  const room = (sharedRooms as Record<string, any>)[roomId] ?? null
  if (!room) return { success: false, reason: `room not found:${roomId}` }
  const base = room.center ?? { x: 0, y: 0, z: 0 }
  const position = {
    x: base.x + objSpec.initialPosition.x,
    y: 0,
    z: base.z + objSpec.initialPosition.z,
  }
  const setFn = (useGameStore as any).setState
  if (typeof setFn === 'function') setFn({ robotPosition: position })
  // 如果房间不同，则同步切换房间
  if (useGameStore.getState().currentRoom !== roomId) {
    const s = useGameStore.getState()
    const setFn2 = (useGameStore as any).setState
    if (typeof setFn2 === 'function') {
      const newEntities = s.heldEntityId
        ? s.entities.map((e: any) => (e.id === s.heldEntityId ? { ...e, currentRoom: roomId } : e))
        : s.entities
      const newVisited = new Set(s.visitedRooms as Set<string>)
      newVisited.add(roomId)
      setFn2({ currentRoom: roomId, entities: newEntities, visitedRooms: newVisited })
    }
  }
  return { success: true, position }
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

function saveByCfg(cfg: string): { success: boolean; reason?: string } {
  const entity = findByCfg(cfg)
  if (!entity) return { success: false, reason: `no entity:${cfg}` }
  return executeSaveMemory(entity.id)
}

function finishMoveAnimations() {
  const state = useGameStore.getState()
  const setFn = (useGameStore as any).setState
  if (typeof setFn !== 'function' || state.moveAnimations.length === 0) return
  setFn({
    moveAnimations: state.moveAnimations.map((animation) => ({
      ...animation,
      startTime: Date.now() - animation.duration - 10,
    })),
  })
  useGameStore.getState().updateMoveAnimations()
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

  it('L1: task-clean-table —— 保存第一条记忆→3件餐具归位→Result', () => {
    useGameStore.getState().initializeTask('task-clean-table')
    const task = useGameStore.getState().task!
    useGameStore.getState().startPlaying()
    di('L1-0-INIT', snap(task, 'L1-0-INIT'))
    expect(useGameStore.getState().phase).toBe('playing')

    // 入门关只保留 3 件任务物品，避免操作教学被物量淹没。
    const allConfigs = useGameStore.getState().entities.map((e) => e.configId)
    di('L1-0-ENTITY-CONFIGS', allConfigs)
    expect(allConfigs).toEqual(expect.arrayContaining(['obj-mug-1', 'obj-plate-1', 'obj-fork-1']))
    expect(allConfigs).toHaveLength(3)

    // 第一关的记忆不是装饰：未按 E 前不能拾取任务物品。
    expect(pickByCfg('obj-mug-1').success).toBe(false)
    expect(setRobotAtEntity(task, 'obj-mug-1').success).toBe(true)
    expect(saveByCfg('obj-mug-1').success).toBe(true)
    evalAndCheck('L1-FIRST-MEMORY')
    expect(useGameStore.getState().achievedGoalIds.has('g-save-first-memory')).toBe(true)

    const sinkItems = ['obj-mug-1']
    const cabinetItems = ['obj-plate-1', 'obj-fork-1']

    // ========== 归位杯勺 → 水槽 ==========
    for (const cfg of sinkItems) {
      di(`L1-pick-${cfg}`, pickByCfg(cfg))
      di(`L1-move-to-sink`, setRobotAtContainer(task, 'cnt-sink'))
      di(`L1-place-${cfg}-sink`, placeInto('cnt-sink'))
      evalAndCheck(`L1-AFTER-${cfg}`)
      expect(useGameStore.getState().heldEntityId).toBeNull()
    }

    // ========== 归位盘叉 → 橱柜 ==========
    for (const cfg of cabinetItems) {
      di(`L1-pick-${cfg}`, pickByCfg(cfg))
      di(`L1-move-to-cabinet`, setRobotAtContainer(task, 'cnt-cabinet'))
      di(`L1-place-${cfg}-cabinet`, placeInto('cnt-cabinet'))
      evalAndCheck(`L1-AFTER-${cfg}`)
      expect(useGameStore.getState().heldEntityId).toBeNull()
    }

    // ========== 最终判定 ==========
    for (let i = 0; i < 5; i++) evalAndCheck(`L1-FINAL-pass-${i}`)
    const finalState = useGameStore.getState()
    di('L1-FINAL', {
      completed: finalState.levelCompleted,
      achieved: Array.from(finalState.achievedGoalIds),
      triggeredEvents: Array.from(finalState.triggeredEvents),
      stageId: finalState.currentStageId,
      phase: finalState.phase,
    })
    expect(finalState.achievedGoalIds).toEqual(
      new Set([
        'g-save-first-memory',
        'g-mug-1-sink',
        'g-plate-1-cabinet',
        'g-fork-1-cabinet',
      ]),
    )
    expect(finalState.levelCompleted).toBe(true)
  })

  it('L2: task-leave-home —— 先编码3个房间的位置→稳定回忆→放回客厅茶几', () => {
    useGameStore.getState().initializeTask('task-leave-home')
    const task = useGameStore.getState().task!
    useGameStore.getState().startPlaying()
    di('L2-0-INIT', snap(task, 'L2-0-INIT'))
    expect(useGameStore.getState().phase).toBe('playing')

    const allConfigs = useGameStore.getState().entities.map((e) => e.configId)
    di('L2-0-ENTITY-CONFIGS', allConfigs)
    expect(allConfigs).toContain('obj-books')
    expect(allConfigs).toContain('obj-mug')
    expect(allConfigs).toContain('obj-radio')
    // 旧出门大作战物体已移除
    expect(allConfigs).not.toContain('obj-key')
    expect(allConfigs).not.toContain('obj-phone')
    expect(allConfigs).not.toContain('obj-umbrella')

    const allObjects = ['obj-books', 'obj-mug', 'obj-radio']

    // ========== ENCODE：三条位置记忆全部建立前禁止开始搬运 ==========
    expect(setRobotAtEntity(task, 'obj-books').success).toBe(true)
    expect(pickByCfg('obj-books').success).toBe(false)
    const encodeGoalByObject: Record<string, string> = {
      'obj-books': 'g-encode-books',
      'obj-mug': 'g-encode-mug',
      'obj-radio': 'g-encode-radio',
    }
    for (const cfg of allObjects) {
      expect(setRobotAtEntity(task, cfg).success).toBe(true)
      expect(saveByCfg(cfg).success).toBe(true)
      evalAndCheck(`L2-SAVED-${cfg}`)
      expect(useGameStore.getState().achievedGoalIds.has(encodeGoalByObject[cfg])).toBe(true)
    }
    expect(useGameStore.getState().currentStageId).toBe('stage-recall-stable-map')

    // ========== RECALL：根据稳定记忆跨房间取回三件物品 ==========
    for (const cfg of allObjects) {
      di(`L2-move-to-${cfg}`, setRobotAtEntity(task, cfg))
      di(`L2-pick-${cfg}`, pickByCfg(cfg))
      di(`L2-move-to-coffee-table`, setRobotAtContainer(task, 'cnt-coffee-table'))
      di(`L2-place-${cfg}-table`, placeInto('cnt-coffee-table'))
      evalAndCheck(`L2-AFTER-${cfg}`)
      expect(useGameStore.getState().heldEntityId).toBeNull()
    }

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
    expect(finalState.achievedGoalIds).toEqual(
      new Set([
        'g-encode-books',
        'g-encode-mug',
        'g-encode-radio',
        'g-books-table',
        'g-mug-table',
        'g-radio-table',
      ]),
    )
    expect(finalState.levelCompleted).toBe(true)
  })

  it('L3: task-laundry-sort —— 保存旧位置→发现过期→更新记忆→完成早餐（严格断言通关）', () => {
    useGameStore.getState().initializeTask('task-laundry-sort')
    const task = useGameStore.getState().task!
    useGameStore.getState().startPlaying()

    expect(task.name).toBe('过期的早餐记忆')
    expect(task.rooms).toEqual(['dining'])
    expect(useGameStore.getState().currentStageId).toBe('stage-encode-cereal')

    // ENCODE：麦片在备餐台上直接可见，保存其旧位置，无需打开任何家具。
    expect(setRobotAtContainer(task, 'cnt-cabinet-lower').success).toBe(true)
    expect(findByCfg('obj-cereal')?.status).toBe('free')
    expect(saveByCfg('obj-cereal').success).toBe(true)
    evalAndCheck('L3-ENCODED')
    expect(useGameStore.getState().achievedGoalIds.has('g-encode-cereal-memory')).toBe(true)

    // DISTRACTOR：把碗、杯摆好；勺子开场已经在餐桌上。
    for (const cfg of ['obj-breakfast-bowl', 'obj-breakfast-cup']) {
      expect(setRobotAtEntity(task, cfg).success).toBe(true)
      expect(pickByCfg(cfg).success).toBe(true)
      expect(setRobotAtContainer(task, 'cnt-breakfast-table').success).toBe(true)
      expect(placeInto('cnt-breakfast-table').success).toBe(true)
      evalAndCheck(`L3-TABLE-${cfg}`)
    }
    expect(useGameStore.getState().currentStageId).toBe('stage-stale-memory')

    // 环境变化：脚本把麦片移到开放置物架，并把旧记忆标成 outdated。
    useGameStore.getState().triggerScriptedEvents()
    finishMoveAnimations()
    evalAndCheck('L3-CEREAL-MOVED')
    expect(useGameStore.getState().memorySlots.find((slot) => slot?.entityConfigId === 'obj-cereal')?.outdated).toBe(true)
    expect(findByCfg('obj-cereal')).toMatchObject({
      placedIn: 'cnt-cabinet-upper',
      status: 'placed',
    })

    // CONFLICT：回到旧柜前，发现现实与旧记忆冲突。
    expect(setRobotAtContainer(task, 'cnt-cabinet-lower').success).toBe(true)
    evalAndCheck('L3-CONFLICT')
    expect(useGameStore.getState().triggeredEvents.has('se-conflict-detected')).toBe(true)
    expect(useGameStore.getState().achievedGoalIds.has('g-detect-stale-memory')).toBe(true)

    // UPDATE：开放架上的麦片直接可见，按 E 刷新同一条记忆。
    expect(setRobotAtContainer(task, 'cnt-cabinet-upper').success).toBe(true)
    expect(saveByCfg('obj-cereal').success).toBe(true)
    evalAndCheck('L3-UPDATED')
    expect(useGameStore.getState().memoryUpdateCount).toBeGreaterThanOrEqual(1)
    expect(useGameStore.getState().achievedGoalIds.has('g-update-cereal-memory')).toBe(true)

    // APPLY：麦片上桌。
    expect(pickByCfg('obj-cereal').success).toBe(true)
    expect(setRobotAtContainer(task, 'cnt-breakfast-table').success).toBe(true)
    expect(placeInto('cnt-breakfast-table').success).toBe(true)
    evalAndCheck('L3-CEREAL-SERVED')

    const finalState = useGameStore.getState()
    expect(finalState.achievedGoalIds).toEqual(new Set([
      'g-encode-cereal-memory',
      'g-set-breakfast-table',
      'g-detect-stale-memory',
      'g-update-cereal-memory',
      'g-serve-cereal',
    ]))
    expect(finalState.levelCompleted).toBe(true)
  })

  it('L1 regression: 慢玩 6 分钟 —— 被动 chaos 增量为 0，记忆不衰减，不因 chaos 失败', () => {
    useGameStore.getState().initializeTask('task-clean-table')
    const task = useGameStore.getState().task!
    useGameStore.getState().startPlaying()
    // 先保存一条马克杯记忆，验证 fresh 状态
    expect(setRobotAtEntity(task, 'obj-mug-1').success).toBe(true)
    expect(saveByCfg('obj-mug-1').success).toBe(true)
    const mugSlotBefore = useGameStore.getState().memorySlots.find((s) => s?.entityConfigId === 'obj-mug-1')
    expect(mugSlotBefore).toBeTruthy()
    expect(mugSlotBefore!.outdated).toBe(false)
    expect(mugSlotBefore!.locked).toBe(false)
    // 记录保存记忆后的基准 chaos 值（操作带来的一次性 chaos 是允许的，关键是被动时间流逝不增加）
    const chaosBeforeTick = useGameStore.getState().chaosValue
    const peakBeforeTick = useGameStore.getState().chaosPeak
    expect(useGameStore.getState().levelFailed).toBe(false)

    // 模拟 6 分钟（360,000 ms）连续 tick，分成 360 个 1 秒步进
    for (let i = 0; i < 360; i++) {
      useGameStore.getState().tickElapsed(1000)
    }

    const finalState = useGameStore.getState()
    // 关键断言：被动流逝期间，chaos 不应有任何增长（增量精确为 0）
    expect(finalState.chaosValue).toBe(chaosBeforeTick)
    expect(finalState.chaosPeak).toBe(peakBeforeTick)
    // 记忆仍然 fresh（未因时间衰减变 outdated）
    const mugSlotAfter = finalState.memorySlots.find((s) => s?.entityConfigId === 'obj-mug-1')
    expect(mugSlotAfter).toBeTruthy()
    expect(mugSlotAfter!.outdated).toBe(false)
    // L1 无 timeLimit，且 chaos 远低于 max，应未失败
    expect(finalState.levelFailed).toBe(false)
    expect((finalState as any).failureReason).toBeFalsy()
    // 记忆槽仍有原始条目，未被清空
    expect(finalState.memorySlots.some((s) => s?.entityConfigId === 'obj-mug-1')).toBe(true)
    di('L1-LONG-PLAY', {
      elapsedMs: finalState.elapsedMs,
      chaosBeforeTick,
      chaosAfterTick: finalState.chaosValue,
      chaosDelta: finalState.chaosValue - chaosBeforeTick,
      chaosPeak: finalState.chaosPeak,
      failed: finalState.levelFailed,
      failReason: (finalState as any).failureReason,
      mugOutdated: mugSlotAfter?.outdated,
    })
  })

  it('L2/L3 completion buffer: 放宽时限，混乱值达到 100% 只影响评分而不判负', () => {
    const cases = [
      { taskId: 'task-leave-home', timeLimit: 360 },
      { taskId: 'task-laundry-sort', timeLimit: 600 },
    ] as const

    for (const { taskId, timeLimit } of cases) {
      useGameStore.getState().initializeTask(taskId)
      expect(useGameStore.getState().task?.timeLimit).toBe(timeLimit)
      useGameStore.getState().startPlaying()
      useGameStore.getState().incrementChaos(100)
      useGameStore.getState().tickElapsed(1000)

      const state = useGameStore.getState()
      expect(state.chaosValue).toBe(100)
      expect(state.levelFailed).toBe(false)
      expect(state.failureReason).toBeNull()
      expect(state.phase).toBe('playing')
    }
  })

  it('L3 regression: g-encode-cereal-memory 完成前，不能拾取碗/杯/勺；完成后可拾取', () => {
    useGameStore.getState().initializeTask('task-laundry-sort')
    const task = useGameStore.getState().task!
    useGameStore.getState().startPlaying()
    expect(useGameStore.getState().currentStageId).toBe('stage-encode-cereal')
    expect(useGameStore.getState().achievedGoalIds.has('g-encode-cereal-memory')).toBe(false)

    // ========== 编码前：三件餐具都拿不起来 ==========
    for (const cfg of ['obj-breakfast-bowl', 'obj-breakfast-cup', 'obj-breakfast-spoon']) {
      expect(setRobotAtEntity(task, cfg).success).toBe(true)
      const before = pickByCfg(cfg)
      di(`L3-PRE-ENCODE-PICK-${cfg}`, before)
      expect(before.success).toBe(false)
      expect(before.reason).toMatch(/麦片|先按 E|摆餐具|encode/i)
    }
    // 手仍然为空
    expect(useGameStore.getState().heldEntityId).toBeNull()

    // ========== 完成麦片记忆编码 ==========
    expect(setRobotAtContainer(task, 'cnt-cabinet-lower').success).toBe(true)
    expect(findByCfg('obj-cereal')?.status).toBe('free')
    expect(saveByCfg('obj-cereal').success).toBe(true)
    evalAndCheck('L3-ENCODED-POST')
    expect(useGameStore.getState().achievedGoalIds.has('g-encode-cereal-memory')).toBe(true)

    // ========== 编码后：三件餐具可以正常拾取 ==========
    for (const cfg of ['obj-breakfast-bowl', 'obj-breakfast-cup', 'obj-breakfast-spoon']) {
      expect(setRobotAtEntity(task, cfg).success).toBe(true)
      const after = pickByCfg(cfg)
      di(`L3-POST-ENCODE-PICK-${cfg}`, after)
      if (!after.success) {
        // spoon/bowl/cup 初始有些在 free，有些在 container 里；如失败，放下手上的重试确保不是因为手满
        useGameStore.getState().dropEntity()
        expect(setRobotAtEntity(task, cfg).success).toBe(true)
        const retry = pickByCfg(cfg)
        expect(retry.success).toBe(true)
      } else {
        expect(after.success).toBe(true)
      }
      // 把手上东西放下，避免影响后续循环
      useGameStore.getState().dropEntity()
    }
  })
})
