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

  it('L1: task-clean-table —— 9件餐具归位（杯勺→水槽，盘叉→橱柜）→Probe→Result', () => {
    useGameStore.getState().initializeTask('task-clean-table')
    const task = useGameStore.getState().task!
    useGameStore.getState().startPlaying()
    di('L1-0-INIT', snap(task, 'L1-0-INIT'))
    expect(useGameStore.getState().phase).toBe('playing')

    // 验证 9 件物品 + 4 个容器存在
    const allConfigs = useGameStore.getState().entities.map((e) => e.configId)
    di('L1-0-ENTITY-CONFIGS', allConfigs)
    expect(allConfigs).toEqual(
      expect.arrayContaining([
        'obj-mug-1', 'obj-mug-2',
        'obj-spoon-1', 'obj-spoon-2', 'obj-spoon-3',
        'obj-plate-1', 'obj-plate-2',
        'obj-fork-1', 'obj-fork-2',
      ]),
    )
    expect(allConfigs).toHaveLength(9)

    // 归位规则：杯勺→cnt-sink，盘叉→cnt-cabinet
    const sinkItems = ['obj-mug-1', 'obj-mug-2', 'obj-spoon-1', 'obj-spoon-2', 'obj-spoon-3']
    const cabinetItems = ['obj-plate-1', 'obj-plate-2', 'obj-fork-1', 'obj-fork-2']

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
      new Set(['g-mugs-sink', 'g-spoons-sink', 'g-plates-cabinet', 'g-forks-cabinet']),
    )
    expect(finalState.levelCompleted).toBe(true)
  })

  it('L2: task-leave-home —— 4件物品跨房间寻回→放回客厅茶几（严格断言通关）', () => {
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
    expect(allConfigs).toContain('obj-radio')
    // 旧出门大作战物体已移除
    expect(allConfigs).not.toContain('obj-key')
    expect(allConfigs).not.toContain('obj-phone')
    expect(allConfigs).not.toContain('obj-umbrella')

    // ========== 4 件物品拾取并放回客厅茶几 ==========
    const allObjects = ['obj-books', 'obj-mug', 'obj-bear', 'obj-radio']
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
      new Set(['g-books-table', 'g-mug-table', 'g-bear-table', 'g-radio-table']),
    )
    expect(finalState.levelCompleted).toBe(true)
  })
})
