import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from '../store/useGameStore'
import { useSessionStore } from '../store/useSessionStore'
import { calculateMetrics } from '../ai/analyzeSession'
import {
  buildFlowHint,
  findActiveGoal,
  FLOW_HINT_LEVEL_ONE_MS,
  FLOW_HINT_LEVEL_TWO_MS,
} from './flow'
import { executeSaveMemory } from './commands'

describe('心流辅助', () => {
  beforeEach(() => {
    useGameStore.getState().initializeTask('task-clean-table')
    useSessionStore.getState().resetSession()
  })

  it('从当前状态选出一个尚未完成且依赖满足的目标', () => {
    const state = useGameStore.getState()
    const goal = findActiveGoal(state.task, state.getEntitySnapshot(), state.achievedGoalIds)

    expect(goal?.id).toBe('g-save-first-memory')
    expect(buildFlowHint(goal!, 1)).toContain(goal!.description)
    expect(buildFlowHint(goal!, 2)).toContain('先核对物体状态和容器')
  })

  it('20 秒和 45 秒停滞时逐级提示，并写入 Session', () => {
    const task = useGameStore.getState().task!
    useSessionStore.getState().startSession(task.id, task.name, task.briefing)
    useGameStore.getState().startPlaying()

    useGameStore.getState().tickElapsed(FLOW_HINT_LEVEL_ONE_MS)
    expect(useGameStore.getState().flowHintLevel).toBe(1)
    expect(useGameStore.getState().flowInterventionCount).toBe(1)

    useGameStore.getState().tickElapsed(FLOW_HINT_LEVEL_TWO_MS - FLOW_HINT_LEVEL_ONE_MS)
    expect(useGameStore.getState().flowHintLevel).toBe(2)
    expect(useGameStore.getState().flowInterventionCount).toBe(2)

    const interventions = useSessionStore.getState().currentSession?.events.filter(
      (event) => event.type === 'flow_intervention',
    ) ?? []
    expect(interventions).toHaveLength(2)

    const session = useSessionStore.getState().currentSession!
    const metrics = calculateMetrics(session, task.goals.length, 1, 50_000)
    expect(metrics.flowInterventionCount).toBe(2)
    expect(metrics.longestGoalGapMs).toBe(50_000)
  })

  it('目标取得进展后清除旧提示并重新计算停滞', () => {
    useGameStore.setState({
      elapsedMs: 30_000,
      lastGoalProgressMs: 0,
      flowHintLevel: 1,
      activeFlowHint: { goalId: 'g-save-first-memory', level: 1, message: 'test' },
    })

    const cup1 = useGameStore.getState().entities.find((entity) => entity.configId === 'obj-mug-1')!
    useGameStore.setState({
      phase: 'playing',
      robotPosition: { ...cup1.position },
    })
    expect(executeSaveMemory(cup1.id).success).toBe(true)

    expect(useGameStore.getState().lastGoalProgressMs).toBe(30_000)
    expect(useGameStore.getState().flowHintLevel).toBe(0)
    expect(useGameStore.getState().activeFlowHint).toBeNull()
  })
})
