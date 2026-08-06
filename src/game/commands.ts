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

export function executePick(entityId: string): GameCommandResult {
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
}

export function executePlace(containerId: string): GameCommandResult {
  const blocked = ensurePlaying()
  if (blocked) return blocked

  const before = useGameStore.getState()

  const result = before.placeEntity(containerId)
  const step = advanceStep()
  recordAction('place', containerId, result, before.currentRoom, step)
  processPostCommand()
  return { ...result, action: 'place' }
}

export function executeToggleContainer(containerId: string): GameCommandResult {
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
}

export function executeContainerInteraction(containerId: string): GameCommandResult {
  return useGameStore.getState().heldEntityId
    ? executePlace(containerId)
    : executeToggleContainer(containerId)
}

export function executeSaveMemory(entityId: string): GameCommandResult {
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
}

export function executeRoomTransition(
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
}
