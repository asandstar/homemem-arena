import { create } from 'zustand'
import type { SessionEvent, ObservationEvent, ActionEvent, MovementEvent } from '../types/event'
import type { MemoryEntry, MemoryType } from '../types/memory'
import type { SessionData, SessionMetrics, FailureReason, PolicySuggestion, SessionStatus, ProbeAnswer } from '../types/session'
import { generateId } from '../utils/format'
import { subscribeEvent } from '../engine/eventBus'

type NewSessionEvent<T extends SessionEvent = SessionEvent> = T extends SessionEvent
  ? Omit<T, 'id' | 'timestamp' | 'step'>
  : never

interface SessionStore {
  currentSession: SessionData | null
  startSession: (taskId: string, taskName: string, taskInstruction: string) => void
  addEvent: (event: NewSessionEvent, step: number) => void
  addMemory: (memory: Omit<MemoryEntry, 'id'>) => MemoryEntry | null
  addObservation: (observation: Omit<SessionData['observations'][0], 'timestamp'>) => void
  recordProbeAnswers: (answers: ProbeAnswer[]) => void
  setAiSummary: (summary: string) => void
  finalizeSession: (status: SessionStatus, metrics: SessionMetrics, failureReasons: FailureReason[], policySuggestions: PolicySuggestion[]) => void
  resetSession: () => void
  _unsubscribeEventBus?: () => void
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  currentSession: null,

  startSession: (taskId, taskName, taskInstruction = '') => {
    const episodeId = generateId('ep')
    const session: SessionData = {
      id: generateId('sess'),
      episode_id: episodeId,
      taskId,
      task_instruction: taskInstruction,
      scene_id: `scene-${taskId}`,
      taskName,
      startTime: Date.now(),
      status: 'in-progress',
      events: [],
      memories: [],
      metrics: {
        durationMs: 0,
        stepCount: 0,
        roomTransitions: 0,
        repeatedSearchCount: 0,
        probeAccuracy: 0,
        goalsAchieved: 0,
        goalsTotal: 0,
        avgProbeReactionTime: 0,
        totalMemories: 0,
        spatialAccuracy: 0,
        objectStateAccuracy: 0,
        temporalAccuracy: 0,
        proceduralAccuracy: 0,
        totalActions: 0,
        unnecessaryRevisits: 0,
        wrongPlacements: 0,
        containerMistakes: 0,
        missedCleanupSteps: 0,
        flowInterventionCount: 0,
        longestGoalGapMs: 0,
        actionSuccessRate: 0,
      },
      failureReasons: [],
      policySuggestions: [],
      agent_pose_trace: [],
      camera_pose_trace: [],
      observations: [],
      visible_objects_per_step: {},
      actions: [],
      object_state_changes: [],
      container_state_changes: [],
      memory_updates: [],
      scripted_events: [],
      probe_questions: [],
      probe_answers: [],
      outcome_metrics: {} as SessionMetrics,
      failure_modes: [],
      ai_research_annotation: {
        timestamp: Date.now(),
        task_type: 'household-memory',
        difficulty_level: 'medium',
        memory_types_tested: [],
        scenario_summary: '',
        key_challenges: [],
        suggested_robot_policy: '',
      },
    }
    // 订阅事件总线，自动记录所有事件（复用 addEvent 的完整逻辑）
    const unsubscribe = subscribeEvent((event) => {
      const current = get().currentSession
      if (!current) return
      // 调用 addEvent 以维护 actions、scripted_events 等派生字段
      get().addEvent(event as any, event.step)
    })

    set({ currentSession: session, _unsubscribeEventBus: unsubscribe })
  },

  addEvent: (event, step) => {
    const session = get().currentSession
    if (!session) return

    const fullEvent = {
      ...event,
      id: generateId('evt'),
      timestamp: Date.now() - session.startTime,
      step,
    } as SessionEvent

    const newEvents = [...session.events, fullEvent]

    const isAction = event.type === 'action'
    const isMovement = event.type === 'movement'
    const isScripted = event.type === 'scripted_event'

    let newActions = session.actions
    let newScriptedEvents = session.scripted_events
    let newVisibleObjects = { ...session.visible_objects_per_step }
    let newRoomTransitions = session.metrics.roomTransitions

    if (isAction) {
      newActions = [...session.actions, fullEvent]
    }

    if (isScripted && 'eventId' in event) {
      const scriptedEvent = event as { eventId: string; description?: string; affectedEntityIds?: string[] }
      newScriptedEvents = [
        ...session.scripted_events,
        {
          id: scriptedEvent.eventId,
          timestamp: fullEvent.timestamp,
          step: fullEvent.step,
          type: 'scripted_event',
          description: scriptedEvent.description || '',
          affectedEntityIds: scriptedEvent.affectedEntityIds || [],
        },
      ]
    }

    if (isMovement && 'crossedDoorway' in event && event.crossedDoorway) {
      newRoomTransitions = session.metrics.roomTransitions + 1
    }

    if ('visibleEntityIds' in event) {
      newVisibleObjects[step] = (event as { visibleEntityIds: string[] }).visibleEntityIds
    }

    set({
      currentSession: {
        ...session,
        events: newEvents,
        actions: newActions,
        scripted_events: newScriptedEvents,
        visible_objects_per_step: newVisibleObjects,
        metrics: {
          ...session.metrics,
          roomTransitions: newRoomTransitions,
        },
      },
    })
  },

  addMemory: (memory) => {
    const session = get().currentSession
    if (!session) return null

    const fullMemory: MemoryEntry = {
      ...memory,
      id: generateId('mem'),
    }

    set({
      currentSession: {
        ...session,
        memories: [...session.memories, fullMemory],
        memory_updates: [...session.memory_updates, fullMemory],
      },
    })
    return fullMemory
  },

  addObservation: (observation) => {
    const session = get().currentSession
    if (!session) return

    const fullObservation = {
      ...observation,
      timestamp: Date.now() - session.startTime,
    }

    set({
      currentSession: {
        ...session,
        observations: [...session.observations, fullObservation],
      },
    })
  },

  recordProbeAnswers: (answers) => {
    const session = get().currentSession
    if (!session) return

    const spatialAnswers = answers.filter((a) => a.memoryType === 'spatial')
    const objectAnswers = answers.filter((a) => a.memoryType === 'object')
    const temporalAnswers = answers.filter((a) => a.memoryType === 'temporal')
    const proceduralAnswers = answers.filter((a) => a.memoryType === 'procedural')

    const spatialAccuracy = spatialAnswers.length > 0
      ? spatialAnswers.filter((a) => a.isCorrect).length / spatialAnswers.length
      : 0
    const objectStateAccuracy = objectAnswers.length > 0
      ? objectAnswers.filter((a) => a.isCorrect).length / objectAnswers.length
      : 0
    const temporalAccuracy = temporalAnswers.length > 0
      ? temporalAnswers.filter((a) => a.isCorrect).length / temporalAnswers.length
      : 0
    const proceduralAccuracy = proceduralAnswers.length > 0
      ? proceduralAnswers.filter((a) => a.isCorrect).length / proceduralAnswers.length
      : 0

    const totalCorrect = answers.filter((a) => a.isCorrect).length
    const probeAccuracy = answers.length > 0 ? totalCorrect / answers.length : 0
    const avgProbeReactionTime = answers.length > 0
      ? answers.reduce((sum, a) => sum + a.responseTime, 0) / answers.length
      : 0

    set({
      currentSession: {
        ...session,
        probe_answers: answers,
        metrics: {
          ...session.metrics,
          probeAccuracy,
          avgProbeReactionTime,
          spatialAccuracy,
          objectStateAccuracy,
          temporalAccuracy,
          proceduralAccuracy,
        },
      },
    })
  },

  setAiSummary: (summary) => {
    const session = get().currentSession
    if (!session) return
    set({ currentSession: { ...session, aiSummary: summary } })
  },

  finalizeSession: (status, metrics, failureReasons, policySuggestions) => {
    const session = get().currentSession
    if (!session) return

    const failureModes = failureReasons.map((fr) => ({
      type: fr.category,
      description: fr.description,
      timestamp: Date.now() - session.startTime,
      step: metrics.stepCount,
      relatedEntities: fr.relatedEntityId ? [fr.relatedEntityId] : [],
    }))

    const memoryTypes: MemoryType[] = [...new Set(session.memories.map((m) => m.type))]

    set({
      currentSession: {
        ...session,
        status,
        endTime: Date.now(),
        metrics: { ...metrics, totalMemories: session.memories.length },
        outcome_metrics: { ...metrics, totalMemories: session.memories.length },
        failureReasons,
        failure_modes: failureModes,
        policySuggestions,
        ai_research_annotation: {
          ...session.ai_research_annotation,
          timestamp: Date.now(),
          memory_types_tested: memoryTypes,
          scenario_summary: session.aiSummary || '',
        },
      },
    })
  },

  resetSession: () => {
    const unsubscribe = get()._unsubscribeEventBus
    if (unsubscribe) unsubscribe()
    set({ currentSession: null, _unsubscribeEventBus: undefined })
  },
}))

export type { ObservationEvent, ActionEvent, MovementEvent }
