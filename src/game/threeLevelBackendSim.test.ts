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
  executeToggleContainer,
  executeRoomTransition,
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

function toggleByCfg(cfg: string) {
  const s = useGameStore.getState()
  if (!s.task) return { success: false, reason: 'no task' }
  const container = s.task.containers.find((c) => c.id === cfg)
  if (!container) return { success: false, reason: `no container:${cfg}` }
  return executeToggleContainer(container.id)
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

  it('L1: task-clean-table —— 先E保存记忆→F拾取→放容器→阶段切→终判', () => {
    useGameStore.getState().initializeTask('task-clean-table')
    const task = useGameStore.getState().task!
    useGameStore.getState().startPlaying()
    di('L1-0-INIT', snap(task, 'L1-0-INIT'))
    expect(useGameStore.getState().phase).toBe('playing')

    // 1) 先保存3条记忆：杯、纸巾、叉（叉放在抽屉，先保存记忆再操作抽屉）
    // 保存前需要"靠近物体"——把机器人移动到餐桌附近
    di('L1-0-move-to-table', setRobotAt(task, { x: 0, z: 0 }))
    di('L1-1-saveMemory-cup', saveByCfg('obj-dirty-cup'))
    di('L1-1-saveMemory-tissue', saveByCfg('obj-tissue'))
    di('L1-1-saveMemory-fork', saveByCfg('obj-fork'))
    evalAndCheck('L1-1-AFTER-SAVE-MEMORIES')

    // 2) 脏杯子 → 人移到 dishwasher 旁 → pick → 开 dishwasher → place
    di('L1-2-move-to-dishwasher', setRobotAtContainer(task, 'cnt-dishwasher'))
    di('L1-2-move-back-to-cup', setRobotAt(task, { x: -0.6, z: 0 }))
    di('L1-2-pick-cup', pickByCfg('obj-dirty-cup'))
    di('L1-2-move-to-dishwasher-2', setRobotAtContainer(task, 'cnt-dishwasher'))
    di('L1-2-toggle-dishwasher', toggleByCfg('cnt-dishwasher'))
    di('L1-2-place-cup-dishwasher', placeInto('cnt-dishwasher'))
    evalAndCheck('L1-2-AFTER-CUP')

    // 3) 纸巾 → 移回餐桌 → pick → 移到 trash → place
    di('L1-3-move-to-tissue', setRobotAt(task, { x: 0.6, z: 0 }))
    di('L1-3-pick-tissue', pickByCfg('obj-tissue'))
    di('L1-3-move-to-trash', setRobotAtContainer(task, 'cnt-trash-bin'))
    di('L1-3-toggle-trash', toggleByCfg('cnt-trash-bin'))
    di('L1-3-place-tissue', placeInto('cnt-trash-bin'))
    evalAndCheck('L1-3-AFTER-TISSUE')

    // 4) 叉子 → 先开餐具架（叉的终点）→ 移到餐桌 → 取叉子 → 放回餐具架
    di('L1-4-open-utensil-rack', (() => {
      const r = setRobotAtContainer(task, 'cnt-utensil-rack')
      return { ...(r as any), toggle: toggleByCfg('cnt-utensil-rack') }
    })())
    di('L1-4-move-to-fork', setRobotAt(task, { x: 0, z: -0.3 }))
    di('L1-4-pick-fork', pickByCfg('obj-fork'))
    di('L1-4-move-to-utensil-rack-2', setRobotAtContainer(task, 'cnt-utensil-rack'))
    di('L1-4-place-fork', placeInto('cnt-utensil-rack'))
    evalAndCheck('L1-4-AFTER-FORK')

    // 5) 最终判
    for (let i = 0; i < 5; i++) evalAndCheck(`L1-FINAL-pass-${i}`)
    const finalState = useGameStore.getState()
    expect(finalState.levelCompleted).toBe(true)
  })

  it('L2: task-leave-home —— 拿钥匙+拿手机+拿雨伞→cat事件→更新钥匙记忆→玄关托盘（严格断言通关）', () => {
    useGameStore.getState().initializeTask('task-leave-home')
    const task = useGameStore.getState().task!
    useGameStore.getState().startPlaying()
    di('L2-0-INIT', snap(task, 'L2-0-INIT'))
    expect(useGameStore.getState().phase).toBe('playing')

    // 辅助：直接 set 钥匙状态为 free（因为 cnt-coffee-table acceptedCategories=[]，放置会被拒绝，模拟玩家放在茶几表面即可）
    function forceKeyFreeAt(livingLocalX: number, livingLocalZ: number) {
      const s = useGameStore.getState()
      const key = s.entities.find((e: any) => e.configId === 'obj-key')
      if (!key) return { success: false, reason: 'no key' }
      const livingCenter = (sharedRooms as any).living.center
      const newEntities = s.entities.map((e: any) =>
        e.id === key.id
          ? { ...e, status: 'free' as const, placedIn: undefined, currentRoom: 'living' as const,
              position: { x: livingCenter.x + livingLocalX, y: 0.45, z: livingCenter.z + livingLocalZ } }
          : e
      )
      // 同时从所有 container.containedIds 中移除钥匙
      const newContainers: any = {}
      for (const [cid, cs] of Object.entries<any>(s.containerStates as any)) {
        newContainers[cid] = { ...(cs ?? {}), containedIds: (cs?.containedIds ?? []).filter((c: string) => c !== 'obj-key') }
      }
      const setFn = (useGameStore as any).setState
      if (typeof setFn === 'function') {
        setFn({ entities: newEntities, containerStates: newContainers, heldEntityId: s.heldEntityId === key.id ? null : s.heldEntityId })
      }
      return { success: true }
    }

    const allConfigs = useGameStore.getState().entities.map((e) => e.configId)
    di('L2-0-ENTITY-CONFIGS', allConfigs)

    // L2 策略顺序（注意每次只能拿一样东西，必须放好再拿下一个）：
    // Step A. living 茶几 → 保存钥匙记忆 → 拿起钥匙 → 直接 set 钥匙回茶几（free状态） → 去 bedroom
    di('L2-1-move-to-coffee-table', setRobotAtContainer(task, 'cnt-coffee-table'))
    di('L2-1-saveMemory-key', saveByCfg('obj-key'))
    di('L2-1-pick-key', pickByCfg('obj-key'))
    evalAndCheck('L2-1-AFTER-KEY-PICKED')

    // 把钥匙"放回"茶几 free（不走 placeEntity，避免茶几容器拒绝）
    di('L2-1a-force-key-free-on-coffee', forceKeyFreeAt(0, 0.3))
    evalAndCheck('L2-1-AFTER-KEY-FREE')

    // Step B. bedroom：走到床头柜 → 开抽屉 → 保存+拿手机 → 到玄关把手机放托盘
    di('L2-2-move-to-nightstand', setRobotAtContainer(task, 'cnt-nightstand'))
    di('L2-2-toggle-nightstand-open', toggleByCfg('cnt-nightstand'))
    evalAndCheck('L2-2-AFTER-NIGHTSTAND-OPEN')
    di('L2-2-saveMemory-phone', saveByCfg('obj-phone'))
    di('L2-2-pick-phone', pickByCfg('obj-phone'))
    evalAndCheck('L2-2-AFTER-PHONE-PICKED')

    di('L2-2b-move-to-tray-phone', setRobotAtContainer(task, 'cnt-entrance-tray'))
    di('L2-2b-place-phone-tray', placeInto('cnt-entrance-tray'))
    evalAndCheck('L2-2b-AFTER-PHONE-TRAY')

    // Step C. 玄关伞架 → 保存+拿雨伞 → 放托盘
    di('L2-3-move-to-umbrella-stand', setRobotAtContainer(task, 'cnt-umbrella-stand'))
    di('L2-3-saveMemory-umbrella', saveByCfg('obj-umbrella'))
    di('L2-3-pick-umbrella', pickByCfg('obj-umbrella'))
    di('L2-3-place-umbrella-tray', (() => {
      const r = setRobotAtContainer(task, 'cnt-entrance-tray')
      return { move: r, place: placeInto('cnt-entrance-tray') }
    })())
    evalAndCheck('L2-3-AFTER-UMBRELLA-TRAY')

    // Step D. 此时手机和雨伞都在托盘。切回 living（离开 entrance），
    // 触发 cat 条件：keyFreshSaved=true (L2-1-saveMemory-key) && keyFree=true (forceKeyFreeAt) && leftLiving=true
    const livingCenter = (sharedRooms as any).living.center
    di('L2-4-transit-living', executeRoomTransition(useGameStore.getState().currentRoom as any, 'living' as any, { x: livingCenter.x, y: 0, z: livingCenter.z }))
    evalAndCheck('L2-4-AFTER-CAT-EVENT-1')
    // 多触发几次 tick 确保 cat fired 和 memory marked outdated
    for (let i = 0; i < 3; i++) evalAndCheck(`L2-4-AFTER-CAT-EVENT-pass-${i}`)

    // Step E. 找到新位置的 key（living 沙发旁 x=-3.2,z=-3.2）→ saveMemory（更新记忆 outdated→fresh，memoryUpdateCount++）→ pick → 放玄关托盘
    di('L2-5-move-to-new-key', setRobotAt(task, { x: -3.2, z: -3.2 }))
    di('L2-5-saveMemory-key-update', saveByCfg('obj-key'))
    di('L2-5-pick-key-new-pos', pickByCfg('obj-key'))
    di('L2-5-place-key-tray', (() => {
      const r = setRobotAtContainer(task, 'cnt-entrance-tray')
      return { move: r, place: placeInto('cnt-entrance-tray') }
    })())
    evalAndCheck('L2-5-AFTER-KEY-TRAY')

    // Step F. 最终阶段切换 + 多轮 evaluate 确保 finalize stage completion
    for (let i = 0; i < 8; i++) evalAndCheck(`L2-FINAL-pass-${i}`)
    const finalState = useGameStore.getState()
    di('L2-FINAL', {
      completed: finalState.levelCompleted,
      achieved: Array.from(finalState.achievedGoalIds),
      held: finalState.heldEntityId,
      memoryUpdateCount: (finalState as any).memoryUpdateCount ?? 0,
      triggeredEvents: Array.from((finalState as any).triggeredEvents ?? []),
      goals: task.goals.map((g) => g.id),
      stageId: finalState.currentStageId,
      phase: finalState.phase,
    })
    expect(finalState.levelCompleted).toBe(true)
  })

  it('L3: task-laundry-sort —— 白→cnt-white-basket / 深→cnt-dark-basket / 毛巾→cnt-towel-basket / mystery→cnt-white-basket', () => {
    useGameStore.getState().initializeTask('task-laundry-sort')
    const task = useGameStore.getState().task!
    useGameStore.getState().startPlaying()
    di('L3-0-INIT', snap(task, 'L3-0-INIT'))
    expect(useGameStore.getState().phase).toBe('playing')

    const allCfgs = useGameStore.getState().entities.map((e) => e.configId)
    di('L3-0-ENTITY-CONFIGS', allCfgs)
    const containerCfgs = useGameStore.getState().task?.containers.map((c) => c.id) ?? []
    di('L3-0-CONTAINER-CONFIGS', containerCfgs)

    // 策略：先在 laundry room 观察记录 → save 一个 → 进入 stage2 → 按分类规则一个个搬
    const cfgLocal: Record<string, { x: number; z: number }> = {
      'obj-white-shirt': { x: -3.0, z: 1.0 },
      'obj-white-socks': { x: -2.4, z: 1.2 },
      'obj-white-towel-small': { x: -3.0, z: 1.4 },
      'obj-black-tshirt': { x: 0, z: 1.0 },
      'obj-jeans': { x: 0.6, z: 1.2 },
      'obj-dark-socks': { x: 0, z: 1.4 },
      'obj-towel-large': { x: 3.0, z: 1.0 },
      'obj-towel-small': { x: 3.0, z: 1.2 },
      'obj-mystery-shirt': { x: -2.7, z: 1.4 },
    }
    const cfgBucket: Record<string, string> = {
      'obj-white-shirt': 'cnt-white-basket',
      'obj-white-socks': 'cnt-white-basket',
      'obj-white-towel-small': 'cnt-white-basket',
      'obj-black-tshirt': 'cnt-dark-basket',
      'obj-jeans': 'cnt-dark-basket',
      'obj-dark-socks': 'cnt-dark-basket',
      'obj-towel-large': 'cnt-towel-basket',
      'obj-towel-small': 'cnt-towel-basket',
      'obj-mystery-shirt': 'cnt-white-basket',
    }

    // 先 save memory 让 stage observe → sort 推进（白衬衫/黑T恤/大毛巾先记一个）
    const firstObserve = 'obj-white-shirt'
    di(`L3-1-move-${firstObserve}`, setRobotAt(task, cfgLocal[firstObserve]))
    di(`L3-1-save-${firstObserve}`, saveByCfg(firstObserve))
    evalAndCheck('L3-1-AFTER-OBSERVE')

    const ordered = Object.keys(cfgBucket)
    for (const cfg of ordered) {
      // step 5 会有 se-cat-moves-clothes (white-socks → +z1.4毛巾旁)，要能重新 pick 到；
      // step 9 se-cat-moves-towel (towel-small → -x3,z1.4 白衣旁)
      const posAfterEvent: Record<string, { x: number; z: number } | undefined> = {
        'obj-white-socks': { x: 2.7, z: 1.4 },
        'obj-towel-small': { x: -3.0, z: 1.4 },
        'obj-dark-socks': { x: -1.5, z: 1.6 },
      }
      const currentEntity = findByCfg(cfg)!
      const local = posAfterEvent[cfg] && (currentEntity.properties as any)?._catMoved
        ? posAfterEvent[cfg]
        : cfgLocal[cfg]
      // save+pick
      di(`L3-2-move-${cfg}`, setRobotAt(task, local))
      di(`L3-2-save-${cfg}`, saveByCfg(cfg))
      di(`L3-2-pick-${cfg}`, pickByCfg(cfg))
      // place到对应bucket
      const bucket = cfgBucket[cfg]
      di(`L3-2-move-bucket-${bucket}`, setRobotAtContainer(task, bucket))
      di(`L3-2-place-${cfg}-into-${bucket}`, placeInto(bucket))
      evalAndCheck(`L3-2-AFTER-${cfg}`)
    }

    for (let i = 0; i < 8; i++) evalAndCheck(`L3-FINAL-pass-${i}`)
    const finalState = useGameStore.getState()
    di('L3-FINAL', {
      completed: finalState.levelCompleted,
      achieved: Array.from(finalState.achievedGoalIds),
      goals: task.goals.map((g) => g.id),
      stageId: finalState.currentStageId,
      phase: finalState.phase,
    })
    expect(finalState.levelCompleted).toBe(true)
  })
})
