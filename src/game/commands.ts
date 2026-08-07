import { generateMemories } from '../ai/updateRobotMemory'
import { useGameStore } from '../store/useGameStore'
import { useSessionStore } from '../store/useSessionStore'
import { emitEvent } from '../engine/eventBus'
import type { ActionEvent, MemoryWriteEvent, MovementEvent } from '../types/event'
import type { RoomId, Vec3 } from '../types/room'
import { generateId } from '../utils/format'

type ActionName = ActionEvent['action']

export interface GameCommandResult {
  success: boolean
  reason?: string
  action?: ActionName | 'save-memory' | 'movement'
  slotIndex?: number
  isUpdate?: boolean
}

/**
 * F3 · 命令竞态互斥锁。
 *
 * 背景：FirstPersonControls 每帧读 KeyboardState，如果玩家 1s 内疯狂按
 * F→E→F→E，浏览器 keydown 会以 ~50Hz 速率回调触发 executeXxx，而单个
 * executeContainerInteraction 内部会串行调用 placeEntity + evaluateStageTransitions
 * + checkLevelCompletion（至少 3~5 次 zustand setState，每一次 setState 都会
 * 触发订阅的组件 rerender，render 过程中 KeyboardState 又可能被读到，下一个
 * keydown 事件已经在事件队列里）。
 *
 * 症状：heldEntityId 和 containerStates 的 set→check→set 互相覆盖，最终"物体
 * 从手里消失、也不在容器里"，玩家认为是坏档。
 *
 * 解决：模块级布尔 inFlight，任何 execute* 进入时先拿锁，释放前所有并发命令
 * 全部快速返回 `{ success: false, reason: '上一条指令处理中' }`。
 *
 * - 单线程 JS 不需要原子 CAS，普通布尔即可；
 * - 所有 6 个 execute* 函数都用 withInFlight 包；
 * - try/finally 保证即便内部抛异常锁也会释放（否则整个命令系统永久锁死）。
 */
let _commandInFlight = false

/**
 * 用于 DEV 诊断：如果连续 500ms 锁都不释放，说明有异常路径泄漏了锁，
 * DEV 模式下强制释放 + 报警（PROD 也释放但不报警，避免锁死用户）。
 */
const IN_FLIGHT_WATCHDOG_MS = 500
let _watchdogTimer: any = null

function _acquireInFlight(): boolean {
  if (_commandInFlight) return false
  _commandInFlight = true
  if (typeof window !== 'undefined') {
    clearTimeout(_watchdogTimer)
    _watchdogTimer = setTimeout(() => {
      if (!_commandInFlight) return
      // 锁在 500ms 内没释放 = 肯定泄漏了，强制释放以免整个命令系统死锁
      _commandInFlight = false
      try {
        const env = (import.meta as any)?.env
        if (env?.DEV) {
          // eslint-disable-next-line no-console
          console.warn(
            '[commands] inFlight 锁 500ms 未释放，疑似 executeXxx 抛异常绕过 finally。\n' +
            '已强制释放，请检查 commands.ts 内是否有未被 try/catch 包住的 throw。',
          )
        }
      } catch { /* import.meta 异常时静默 */ }
    }, IN_FLIGHT_WATCHDOG_MS)
  }
  return true
}

function _releaseInFlight(): void {
  _commandInFlight = false
  clearTimeout(_watchdogTimer)
}

function withCommandLock<T extends (...args: any[]) => GameCommandResult>(fn: T): T {
  const wrapped = function (this: any, ...args: any[]): GameCommandResult {
    if (!_acquireInFlight()) {
      return { success: false, reason: '上一条指令处理中' }
    }
    try {
      return fn.apply(this, args)
    } finally {
      _releaseInFlight()
    }
  } as any
  return wrapped
}

/** 测试辅助：重置锁状态（仅 vitest 场景用，生产访问不到） */
export function _debugResetCommandLock(): void {
  _commandInFlight = false
  clearTimeout(_watchdogTimer)
}

function ensurePlaying(): GameCommandResult | null {
  if (useGameStore.getState().phase !== 'playing') {
    return { success: false, reason: '请先开始任务' }
  }
  return null
}

function advanceStep(): number {
  const nextStep = useGameStore.getState().stepCount + 1
  useGameStore.getState().incrementStep()
  return nextStep
}

function processPostCommand(hint?: { afterEventId?: string; afterMemoryForEntityId?: string }): void {
  useGameStore.getState().triggerScriptedEvents()
  useGameStore.getState().evaluateStageTransitions(hint)
  useGameStore.getState().checkLevelCompletion()
}

function recordAction(
  action: ActionName,
  targetId: string,
  result: { success: boolean; reason?: string },
  roomId: RoomId,
  step: number,
): ActionEvent {
  const session = useSessionStore.getState().currentSession
  const actionEvent: ActionEvent = {
    id: generateId('evt'),
    timestamp: session ? Date.now() - session.startTime : Date.now(),
    step,
    type: 'action',
    action,
    targetId,
    result: result.success ? 'success' : 'fail',
    reason: result.reason,
    roomId,
  }
  // 通过事件总线统一分发
  emitEvent(actionEvent)

  if (result.success) {
    const memories = generateMemories({
      action: actionEvent,
      step,
      timestamp: session ? Date.now() - session.startTime : 0,
      existingMemories: session?.memories ?? [],
    })
    memories.forEach((memory) => useSessionStore.getState().addMemory(memory))
  }

  return actionEvent
}

export const executePick = withCommandLock(function executePick(entityId: string): GameCommandResult {
  const blocked = ensurePlaying()
  if (blocked) return blocked

  const before = useGameStore.getState()
  const entity = before.entities.find((item) => item.id === entityId)
  if (!entity) return { success: false, reason: '物体不存在', action: 'pick' }

  // L1 教学阶段：task-clean-table 的第一阶段（通常 stage-observe），
  // 未保存任何任务物体记忆前，禁止拾取 task.objects 中定义的任务物体，强制玩家先学 E。
  // 长期锁避免：只要当前阶段不是 stages[0] 就放行。
  const task = before.task
  const observeStageId = task?.stages?.[0]?.id
  const taskObjectIds = task?.objects?.map((o) => o.id) ?? []
  if (
    task?.id === 'task-clean-table' &&
    observeStageId &&
    before.currentStageId === observeStageId &&
    taskObjectIds.length > 0
  ) {
    if (taskObjectIds.includes(entity.configId)) {
      const anyTaskMemorySaved = before.memorySlots.some(
        (s) => s !== null && taskObjectIds.includes(s.entityConfigId),
      )
      if (!anyTaskMemorySaved) {
        return {
          success: false,
          reason: '先按 E 记住它的位置，再按 F 拾取。',
          action: 'pick',
        }
      }
    }
  }

  const result = before.pickEntity(entityId)
  const step = advanceStep()
  recordAction('pick', entity.configId, result, before.currentRoom, step)
  processPostCommand()
  return { ...result, action: 'pick' }
})

export const executePlace = withCommandLock(function executePlace(containerId: string): GameCommandResult {
  const blocked = ensurePlaying()
  if (blocked) return blocked

  const before = useGameStore.getState()

  const result = before.placeEntity(containerId)
  const step = advanceStep()
  recordAction('place', containerId, result, before.currentRoom, step)
  processPostCommand()
  return { ...result, action: 'place' }
})

export const executeToggleContainer = withCommandLock(function executeToggleContainer(containerId: string): GameCommandResult {
  const blocked = ensurePlaying()
  if (blocked) return blocked

  const before = useGameStore.getState()
  const wasOpen = before.containerStates[containerId]?.open ?? false
  const action: ActionName = wasOpen ? 'close' : 'open'
  const result = before.useContainer(containerId)
  const step = advanceStep()
  recordAction(action, containerId, result, before.currentRoom, step)
  processPostCommand()
  return { ...result, action }
})

// 注意：executeContainerInteraction 内部调用 executePlace / executeToggleContainer，
// 所以它本身不套 withCommandLock（否则会自己和自己抢锁 → 永远拿不到）。
// 它的子调用已经有锁，外层并发会被子调用拦住。
export function executeContainerInteraction(containerId: string): GameCommandResult {
  return useGameStore.getState().heldEntityId
    ? executePlace(containerId)
    : executeToggleContainer(containerId)
}

export const executeSaveMemory = withCommandLock(function executeSaveMemory(entityId: string): GameCommandResult {
  const blocked = ensurePlaying()
  if (blocked) return blocked

  const gameStore = useGameStore.getState()
  const entity = gameStore.entities.find((item) => item.id === entityId)
  if (!entity) return { success: false, reason: '物体不存在', action: 'save-memory' }

  const result = gameStore.saveMemory(entity)
  if (!result.success) {
    return { ...result, reason: '记忆槽已满且全部锁定', action: 'save-memory' }
  }

  const step = advanceStep()
  const session = useSessionStore.getState().currentSession
  const roomName = gameStore.task?.rooms.includes(entity.currentRoom)
    ? entity.currentRoom
    : gameStore.currentRoom
  const memory = useSessionStore.getState().addMemory({
    type: 'object',
    subject: entity.configId,
    room: roomName,
    content: `${result.isUpdate ? '更新' : '保存'} ${entity.name} 的位置与状态：${entity.currentRoom}${entity.placedIn ? ` / ${entity.placedIn}` : ''}`,
    timestamp: session ? Date.now() - session.startTime : 0,
    step,
    confidence: 1,
    source: 'action',
    relatedEntityId: entity.configId,
  })

  if (memory) {
    const memoryEvent: MemoryWriteEvent = {
      id: generateId('evt'),
      timestamp: session ? Date.now() - session.startTime : Date.now(),
      step,
      type: 'memory_write',
      memoryId: memory.id,
      memoryType: memory.type,
      content: memory.content,
    }
    // 通过事件总线统一分发
    emitEvent(memoryEvent)
  }

  processPostCommand({ afterMemoryForEntityId: entity.configId })

  return { ...result, action: 'save-memory' }
})

export const executeRoomTransition = withCommandLock(function executeRoomTransition(
  fromRoom: RoomId,
  toRoom: RoomId,
  position: Vec3,
): GameCommandResult {
  const blocked = ensurePlaying()
  if (blocked) return blocked

  useGameStore.getState().moveToRoom(toRoom, position)
  const step = advanceStep()
  const session = useSessionStore.getState().currentSession
  const movementEvent: MovementEvent = {
    id: generateId('evt'),
    timestamp: session ? Date.now() - session.startTime : Date.now(),
    step,
    type: 'movement',
    fromRoom,
    toRoom,
    crossedDoorway: true,
    position,
  }
  // 通过事件总线统一分发
  emitEvent(movementEvent)

  const memories = generateMemories({
    movement: movementEvent,
    step,
    timestamp: session ? Date.now() - session.startTime : 0,
    existingMemories: session?.memories ?? [],
  })
  memories.forEach((memory) => useSessionStore.getState().addMemory(memory))
  processPostCommand()
  return { success: true, action: 'movement' }
})
