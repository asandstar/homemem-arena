import type { EntityStateSnapshot, GoalSpec, StageContext, TaskConfig, TaskStageSpec } from '../../types/task'
import type { EntityState } from '../../types/object'
import type { RoomId, Vec3 } from '../../types/room'
import type { ContainerSpec, ObjectSpec } from '../../types/object'
import type { RoomSpec } from '../../types/room'
import { useSessionStore } from '../useSessionStore'
import { useUiStore } from '../useUiStore'
import { getTaskById } from '../../data/tasks'
import { sharedRooms } from '../../data/rooms'
import { generateId } from '../../utils/format'
import { DEFAULT_LEVEL_BALANCE } from '../../data/levelBalance'
import { calcChaosGrowth } from '../../game/chaos'
import { playSfx, stopChaosAmbient, isAudioEnabled } from '../../audio/sfx'
import { emitEvent } from '../../engine/eventBus'
import { getFreeObjectInitialPosition } from '../../game/placement'
import { initProceduralProgress, checkProceduralStep } from '../../game/proceduralMemory'
import type { ProceduralProgress } from '../../game/proceduralMemory'
import { playGoalCompleteEffect, playTimeWarningEffect, playTaskCompleteEffect } from '../../effects/particleSystem'

export type GamePhase = 'idle' | 'briefing' | 'playing' | 'probing' | 'analyzing' | 'result' | 'aborted'

const roomCenter = (roomId: RoomId): Vec3 => {
  const room = (sharedRooms as Record<string, RoomSpec>)[roomId]
  if (!room) return { x: 0, y: 0, z: 0 }
  return { x: room.center.x, y: 0, z: room.center.z }
}

function toEntitySnapshots(entities: EntityState[]): EntityStateSnapshot[] {
  return entities.map((e) => ({
    configId: e.configId,
    status: e.status,
    currentRoom: e.currentRoom,
    placedIn: e.placedIn,
    category: e.category,
    properties: e.properties,
    position: { x: e.position.x, z: e.position.z, y: e.position.y },
  }))
}

export function isGoalSatisfied(
  goal: GoalSpec,
  entities: EntityStateSnapshot[],
  achievedGoalIds: Set<string>,
  ctx?: StageContext,
): boolean {
  const dependenciesMet = (goal.dependsOnGoalIds ?? []).every((id) => achievedGoalIds.has(id))
  if (!dependenciesMet) return false
  if (goal.kind === 'milestone' && achievedGoalIds.has(goal.id)) return true
  return goal.predicate(entities, entities, ctx)
}

function buildStageContext(get: any): StageContext {
  const s = get()
  const heldEntity = s.heldEntityId ? s.entities.find((e: EntityState) => e.id === s.heldEntityId) : null
  const playerPosition = { x: s.robotPosition.x, z: s.robotPosition.z, y: s.robotPosition.y ?? 0 }
  const entitySnapshots = toEntitySnapshots(s.entities)
  // nearbyEntity 基于真实 EntityState 计算（因为 EntityState 一定有 position），不依赖 snapshot 可选 position
  let nearby: string | null = null
  let bestDistance = 2.0
  for (const e of s.entities as EntityState[]) {
    if (e.currentRoom !== s.currentRoom) continue
    if (e.status === 'hidden' || e.status === 'held') continue
    if (e.properties?._moving === true) continue
    if (!e.position) continue
    const d = Math.hypot(e.position.x - playerPosition.x, e.position.z - playerPosition.z)
    if (d < bestDistance) {
      bestDistance = d
      nearby = e.configId
    }
  }
  return {
    stepCount: s.stepCount,
    elapsedMs: s.elapsedMs,
    currentRoom: s.currentRoom,
    playerPosition,
    entities: entitySnapshots,
    memorySlots: (s.memorySlots ?? []).map((sl: any) =>
      sl
        ? {
            entityConfigId: sl.entityConfigId,
            outdated: !!sl.outdated,
            locked: !!sl.locked,
            confidence: sl.confidence ?? 0,
            timestamp: sl.timestamp ?? 0,
          }
        : null,
    ),
    achievedGoalIds: new Set(s.achievedGoalIds ?? []),
    triggeredEvents: new Set(s.triggeredEvents ?? []),
    memoryUpdateCount: s.memoryUpdateCount ?? 0,
    memoryUsedCount: s.memoryUsedCount ?? 0,
    outdatedMemoryCount: s.outdatedMemoryCount ?? 0,
    heldEntityConfigId: heldEntity?.configId ?? null,
    containerStates: s.containerStates ?? {},
    nearbyEntityConfigId: nearby,
  }
}

export interface TaskSlice {
  task: TaskConfig | null
  phase: GamePhase
  startTime: number | null
  stepCount: number
  elapsedMs: number
  achievedGoalIds: Set<string>
  triggeredEvents: Set<string>
  levelCompleted: boolean
  levelFailed: boolean
  failureReason: string | null
  lastObservedIds: Set<string>
  proceduralProgress: Record<string, ProceduralProgress>
  currentStageId: string | null
  currentObjective: string | null

  initializeTask: (taskId: string) => void
  resetTask: () => void
  startPlaying: () => void
  setGamePhase: (phase: GamePhase) => void
  setLevelCompleted: () => void
  setLevelFailed: (reason?: string) => void
  checkLevelCompletion: () => void
  triggerScriptedEvents: () => void
  getEntitySnapshot: () => { id: string; configId: string; status: string; currentRoom: RoomId; placedIn?: string; category: string; properties: Record<string, string | number | boolean> }[]
  isGoalAchieved: (goal: GoalSpec) => boolean
  tickElapsed: (deltaMs: number) => void
  incrementStep: () => void
  checkProceduralAction: (action: 'pick' | 'place' | 'use', targetId: string) => { wrongOrder: boolean; currentStepLabel?: string }
  evaluateStageTransitions: (hint?: { afterEventId?: string; afterMemoryForEntityId?: string }) => void
  setStage: (stageId: string) => void
}

export function createTaskSlice(set: any, get: any): TaskSlice {
  return {
    task: null,
    phase: 'idle',
    startTime: null,
    stepCount: 0,
    elapsedMs: 0,
    achievedGoalIds: new Set<string>(),
    triggeredEvents: new Set<string>(),
    levelCompleted: false,
    levelFailed: false,
    failureReason: null,
    lastObservedIds: new Set<string>(),
    proceduralProgress: {},
    currentStageId: null,
    currentObjective: null,

    initializeTask: (taskId: string) => {
      useUiStore.getState().resetUi()
      const task = getTaskById(taskId)
      if (!task) return

      const entities: EntityState[] = []

      task.objects.forEach((obj: ObjectSpec) => {
        const status: EntityState['status'] = obj.hiddenInContainer ? 'hidden' : 'free'
        const worldPos: Vec3 = getFreeObjectInitialPosition(obj, task)
        entities.push({
          id: generateId('ent'),
          configId: obj.id,
          type: 'object',
          name: obj.name,
          category: obj.category,
          currentRoom: obj.initialRoom,
          position: worldPos,
          size: obj.size,
          color: obj.color,
          rotation: 0,
          status,
          properties: { ...(obj.stateProperties ?? {}) },
        })
      })

      const containerStates: Record<string, { open: boolean; containedIds: string[] }> = {}
      task.containers.forEach((cnt: ContainerSpec) => {
        containerStates[cnt.id] = {
          open: cnt.initialOpen,
          containedIds: cnt.containsObjectIds ? [...cnt.containsObjectIds] : [],
        }
      })

      const firstRoom = task.rooms[0]
      const firstRoomCenter = roomCenter(firstRoom)
      const startPos = task.spawnPosition
        ? { x: firstRoomCenter.x + task.spawnPosition.x, y: 0, z: firstRoomCenter.z + task.spawnPosition.z }
        : firstRoomCenter
      const startRotation = task.spawnRotation ?? 0
      const initialSnapshots = toEntitySnapshots(entities)
      const initiallyAchieved = new Set<string>()
      for (const goal of task.goals) {
        const dependenciesMet = (goal.dependsOnGoalIds ?? []).every((id) => initiallyAchieved.has(id))
        if (dependenciesMet && goal.predicate(initialSnapshots)) {
          initiallyAchieved.add(goal.id)
        }
      }

      const initialProceduralProgress: Record<string, ProceduralProgress> = {}
      task.goals.forEach((goal: GoalSpec) => {
        if (goal.requiredSequence && goal.requiredSequence.length > 0) {
          initialProceduralProgress[goal.id] = initProceduralProgress()
        }
      })

      set({
        phase: 'briefing',
        task,
        robotPosition: startPos,
        robotRotation: startRotation,
        cameraPitch: 0,
        currentRoom: firstRoom,
        entities,
        containerStates,
        heldEntityId: null,
        stepCount: 0,
        elapsedMs: 0,
        startTime: null,
        visitedRooms: new Set([firstRoom]),
        lastObservedIds: new Set(),
        viewMode: 'first-person' as const,
        memorySlots: new Array(DEFAULT_LEVEL_BALANCE.memorySlotCount).fill(null),
        flashingSlotIndex: null,
        chaosValue: 0,
        chaosPeak: 0,
        score: 0,
        combo: 0,
        maxCombo: 0,
        levelFailed: false,
        levelCompleted: false,
        failureReason: null,
        triggeredEvents: new Set<string>(),
        achievedGoalIds: initiallyAchieved,
        wrongPlaceCount: 0,
        repeatSearchCount: 0,
        memoryUsedCount: 0,
        outdatedMemoryCount: 0,
        memoryUpdateCount: 0,
        feedback: null,
        shakingEntityId: null,
        savingMemorySlotIndex: null,
        chaosEffectActive: false,
        floatingTexts: [],
        eventToasts: [],
        activeEventEffects: [],
        moveAnimations: [],
        lastMoveAnimation: null,
        lastGoalProgressMs: 0,
        longestProgressStallMs: 0,
        flowHintLevel: 0,
        flowInterventionCount: 0,
        activeFlowHint: null,
        proceduralProgress: initialProceduralProgress,
        currentStageId: task.stages?.length ? (task.initialStageId ?? task.stages[0].id) : null,
        currentObjective: task.stages?.length
          ? (task.stages.find((s) => s.id === (task.initialStageId ?? task.stages![0].id))?.playerObjective ?? null)
          : null,
      })
    },

    resetTask: () => {
      const { task } = get()
      if (task) {
        get().initializeTask(task.id)
        // 同步重置 session 数据，避免残留事件
        useSessionStore.getState().startSession(task.id, task.name, task.briefing)
      }
    },

    startPlaying: () => {
      if (!get().task) return
      set({ phase: 'playing', startTime: Date.now(), elapsedMs: 0 })
      if (isAudioEnabled()) {
        playSfx('task_start')
      }
    },

    setGamePhase: (phase: GamePhase) => {
      if (phase === 'result' || phase === 'aborted') {
        stopChaosAmbient()
      }
      set({ phase })
    },

    setLevelFailed: (reason?: string) => {
      set({
        phase: 'probing',
        levelFailed: true,
        failureReason: reason || '未知原因',
        combo: 0,
      })
    },

    setLevelCompleted: () => {
      const { task, score, elapsedMs } = get()
      set({ phase: 'probing', levelCompleted: true })
      if (isAudioEnabled()) {
        playSfx('level_complete')
      }
      const { robotPosition } = get()
      playTaskCompleteEffect(robotPosition)

      if (task) {
        emitEvent({
          type: 'task_progress',
          goalId: 'level_complete',
          status: 'achieved',
          description: '任务完成',
          id: generateId('evt'),
          timestamp: Date.now(),
          step: get().stepCount,
          taskId: task.id,
        } as any)

        get().completeLevel(task.id, score, elapsedMs)

        const taskIds = ['task-clean-table', 'task-leave-home', 'task-laundry-sort', 'task-breakfast', 'task-night-patrol']
        const currentIndex = taskIds.indexOf(task.id)
        if (currentIndex >= 0 && currentIndex < taskIds.length - 1) {
          get().unlockLevel(taskIds[currentIndex + 1])
        }
      }
    },

    checkLevelCompletion: () => {
      const { task, levelCompleted, levelFailed } = get()
      if (!task || levelCompleted || levelFailed) return

      const entitySnapshots = get().getEntitySnapshot()
      const achievedGoalIds = new Set<string>(get().achievedGoalIds)
      const ctx = buildStageContext(get)

      task.goals.forEach((goal: GoalSpec) => {
        const isAchieved = isGoalSatisfied(goal, entitySnapshots, achievedGoalIds, ctx)
        const alreadyReported = achievedGoalIds.has(goal.id)

        if (isAchieved && !alreadyReported) {
          achievedGoalIds.add(goal.id)
          const message = goal.achievedMessage || `目标完成：${goal.description}`
          const stepCount = get().stepCount
          get().addEventToast(message, 'info', 3000)
          get().addFloatingText(message, 'info', 0, 0)
          get().addScore(DEFAULT_LEVEL_BALANCE.validMemoryUseScore)
          const { robotPosition } = get()
          playGoalCompleteEffect(robotPosition)
          // 通过事件总线统一分发
          emitEvent({
            type: 'task_progress',
            goalId: goal.id,
            status: 'achieved',
            description: goal.description,
            id: generateId('evt'),
            timestamp: Date.now(),
            step: stepCount,
          } as any)
          set((state: any) => ({
            lastGoalProgressMs: state.elapsedMs,
            flowHintLevel: 0,
            activeFlowHint: null,
          }))
        }
      })

      set({ achievedGoalIds })

      const allGoalsAchieved = task.goals.every((goal: GoalSpec) => (
        isGoalSatisfied(goal, entitySnapshots, achievedGoalIds, ctx)
      ))

      if (allGoalsAchieved) {
        const timeBonus = Math.max(0, 50000 - get().elapsedMs) / 100
        const comboBonus = get().maxCombo * 50
        const chaosPenalty = get().chaosValue * 10
        const finalBonus = Math.max(0, Math.floor(timeBonus + comboBonus - chaosPenalty))

        get().addScore(finalBonus)
        get().setLevelCompleted()
      }
    },

    triggerScriptedEvents: () => {
      const { task, stepCount, triggeredEvents, chaosValue, levelFailed, levelCompleted, phase, currentRoom } = get()
      if (phase !== 'playing' || !task || levelFailed || levelCompleted) return

      const chaosMultiplier = 1 + (chaosValue / 100) * 2

      task.scriptedEvents.forEach((event: any) => {
        if (triggeredEvents.has(event.id)) return

        let shouldTrigger = false

        if (typeof event.trigger === 'number') {
          const adjustedStep = Math.floor(event.trigger / chaosMultiplier)
          if (stepCount >= adjustedStep) {
            shouldTrigger = true
          }
        } else if (typeof event.trigger === 'function') {
          const entitySnapshots = get().getEntitySnapshot()
          const ctx = buildStageContext(get)
          const rooms: Record<string, { id: RoomId; name?: string; center?: { x: number; z?: number; y?: number } }> = {}
          for (const r of task.rooms) {
            const spec = (sharedRooms as any)[r]
            rooms[r] = { id: r, name: spec?.name, center: spec?.center }
          }
          shouldTrigger = event.trigger(stepCount, entitySnapshots, currentRoom, rooms, ctx)
        }

        if (shouldTrigger) {
          switch (event.type) {
            case 'move-entity':
              if (event.targetId && event.targetPosition) {
                get().applyScriptedMove(event.targetId, event.targetPosition.room, {
                  x: event.targetPosition.x,
                  y: event.targetPosition.y,
                  z: event.targetPosition.z,
                })
              }
              break
            case 'hide-entity':
              if (event.targetId) {
                set({
                  entities: get().entities.map((e: any) =>
                    e.configId === event.targetId ? { ...e, status: 'hidden' as const } : e
                  ),
                })
              }
              break
            case 'show-entity':
              if (event.targetId) {
                set({
                  entities: get().entities.map((e: any) =>
                    e.configId === event.targetId ? { ...e, status: 'free' as const } : e
                  ),
                })
              }
              break
          }

          if (event.message) {
            const toastType = (event as any).toastType
              ?? (event.type === 'move-entity' && event.targetId?.includes('key')
                ? 'cat' as const
                : event.type === 'message' && event.message.includes('震动')
                  ? 'phone' as const
                  : 'event' as const)
            get().addEventToast(event.message, toastType, 4000)

            if (toastType === 'cat') {
              playSfx('cat_event')
            } else if (toastType === 'phone') {
              playSfx('phone_ring')
            }
          }

          if ('markMemoryOutdated' in event && (event as any).markMemoryOutdated) {
            get().markMemoryOutdated((event as any).markMemoryOutdated)
          }

          if ('eventEffect' in event && (event as any).eventEffect) {
            get().triggerEventEffect((event as any).eventEffect)
          }

          get().triggerChaosEffect()
          get().incrementChaos(DEFAULT_LEVEL_BALANCE.eventChaos)

          set((state: any) => ({
            triggeredEvents: new Set([...state.triggeredEvents, event.id]),
          }))

          // 通过事件总线统一分发
          emitEvent({
            type: 'scripted_event',
            eventId: event.id,
            description: event.description ?? event.message ?? '',
            affectedEntityIds: event.targetId ? [event.targetId] : [],
            id: generateId('evt'),
            timestamp: Date.now(),
            step: stepCount,
          } as any)

          // 阶段机推进：事件触发后走正常评估逻辑，让 completionCondition 决定是否推进
          // 注意：不能直接强制跳转 stage-key-outdated，必须先经过 stage-fetch-phone 的"手机取得"判定
          get().evaluateStageTransitions({ afterEventId: event.id })
        }
      })
    },

    tickElapsed: (deltaMs: number) => {
      const { levelFailed, levelCompleted, phase, task, elapsedMs } = get()
      if (phase !== 'playing' || levelFailed || levelCompleted) return

      get().updateMoveAnimations()

      const newElapsed = elapsedMs + deltaMs

      if (task?.timeLimit && newElapsed >= task.timeLimit * 1000) {
        set({ elapsedMs: task.timeLimit * 1000 })
        get().setLevelFailed('任务超时')
        return
      }

      const chaosGrowth = calcChaosGrowth(deltaMs, DEFAULT_LEVEL_BALANCE)
      if (chaosGrowth > 0) {
        get().incrementChaos(chaosGrowth)
      }

      const chaos = get().chaosValue
      if (chaos >= DEFAULT_LEVEL_BALANCE.maxChaos && !get().levelFailed) {
        get().setLevelFailed('混乱值过载')
      }

      get().decayMemories(deltaMs)

      if (task?.timeLimit) {
        const remainingSeconds = Math.floor((task.timeLimit * 1000 - newElapsed) / 1000)
        const previousRemainingSeconds = Math.floor((task.timeLimit * 1000 - elapsedMs) / 1000)
        
        if (remainingSeconds <= 30 && remainingSeconds > 0 && previousRemainingSeconds > 30) {
          if (isAudioEnabled()) {
            playSfx('time_warning')
          }
          const { robotPosition } = get()
          playTimeWarningEffect(robotPosition)
        }
        if (remainingSeconds <= 10 && remainingSeconds > 0 && previousRemainingSeconds > 10) {
          if (isAudioEnabled()) {
            playSfx('time_warning')
          }
          const { robotPosition } = get()
          playTimeWarningEffect(robotPosition)
        }
      }

      get().triggerScriptedEvents()
      get().updateFlowState(newElapsed)

      set({ elapsedMs: newElapsed })

      // 定期（约每 200ms）评估阶段推进，避免因缺少命令而停滞
      if (task?.stages && task.stages.length && Math.floor(newElapsed / 200) !== Math.floor(elapsedMs / 200)) {
        get().evaluateStageTransitions()
      }
    },

    getEntitySnapshot: () => {
      return get().entities.map((e: any) => ({
        id: e.id,
        ...toEntitySnapshots([e])[0],
      }))
    },

    isGoalAchieved: (goal: GoalSpec) => {
      const { entities, achievedGoalIds } = get()
      return isGoalSatisfied(goal, toEntitySnapshots(entities), achievedGoalIds, buildStageContext(get))
    },

    incrementStep: () => {
      set({ stepCount: get().stepCount + 1 })
    },

    checkProceduralAction: (action: 'pick' | 'place' | 'use', targetId: string) => {
      const { task, proceduralProgress, achievedGoalIds } = get()
      if (!task) return { wrongOrder: false }

      let wrongOrder = false
      let currentStepLabel: string | undefined
      const newProceduralProgress: Record<string, ProceduralProgress> = { ...proceduralProgress }

      task.goals.forEach((goal: GoalSpec) => {
        if (!goal.requiredSequence || goal.requiredSequence.length === 0) return

        // 只检查依赖已满足但未达成的目标
        const depsMet = (goal.dependsOnGoalIds ?? []).every((id: string) => achievedGoalIds.has(id))
        if (!depsMet) return
        if (achievedGoalIds.has(goal.id)) return

        const progress = newProceduralProgress[goal.id] ?? initProceduralProgress()
        if (progress.completed) return

        const result = checkProceduralStep(goal, progress, action, targetId)

        if (!result.matched) {
          wrongOrder = true
          currentStepLabel = result.stepLabel
        }
        if (result.progress !== progress) {
          newProceduralProgress[goal.id] = result.progress
        }
      })

      if (Object.keys(newProceduralProgress).length > 0) {
        set({ proceduralProgress: newProceduralProgress })
      }

      return { wrongOrder, currentStepLabel }
    },

    evaluateStageTransitions: (_hint) => {
      const { task, currentStageId, levelCompleted, levelFailed, phase } = get()
      if (!task || !task.stages || !task.stages.length) return
      if (phase !== 'playing' || levelCompleted || levelFailed) return
      // 在构建上下文前先刷新动画状态，清除已完成动画的 _moving 标记，避免 nearbyEntityConfigId 等判定受影响
      try {
        const st = get()
        if (typeof (st as any).updateMoveAnimations === 'function') {
          ;(st as any).updateMoveAnimations()
        }
      } catch (e) { /* ignore */ }
      const ctx = buildStageContext(get)
      let stageId = currentStageId ?? (task.initialStageId ?? task.stages[0].id)
      let changed = false
      let guard = 0
      // 推进策略：从当前阶段开始，只基于 completionCondition 推进到 nextStage；
      // 进入 nextStage 时才检查其 entryCondition，若不满足则回退到已完成的最远阶段。
      while (guard < task.stages!.length) {
        const stage = task.stages!.find((s: TaskStageSpec) => s.id === stageId)
        if (!stage) break
        // 当前阶段：只要 completionCondition 满足就推进（entryCondition 只是"进入门槛"，不是保持门槛）
        if (!stage.completionCondition(ctx)) break
        const next = stage.nextStage
        if (!next || next === stageId) break
        const nextStage = task.stages!.find((s: TaskStageSpec) => s.id === next)
        // 下一阶段必须满足 entryCondition 才能进入
        if (nextStage && !nextStage.entryCondition(ctx)) {
          // 无法进入下一阶段，保持当前阶段
          break
        }
        stageId = next
        changed = true
        guard += 1
      }
      if (changed || !currentStageId || currentStageId !== stageId) {
        const resolved = task.stages!.find((s: TaskStageSpec) => s.id === stageId)
        set({
          currentStageId: stageId,
          currentObjective: resolved?.playerObjective ?? null,
        })
      }
    },

    setStage: (stageId: string) => {
      const { task, phase, levelCompleted, levelFailed } = get()
      if (!task || !task.stages) return
      if (phase !== 'playing' || levelCompleted || levelFailed) return
      const resolved = task.stages.find((s: TaskStageSpec) => s.id === stageId)
      if (!resolved) return
      set({
        currentStageId: stageId,
        currentObjective: resolved.playerObjective,
      })
    },
  }
}
