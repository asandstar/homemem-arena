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

describe('心流辅助', () => {
  beforeEach(() => {
    useGameStore.getState().initializeTask('task-clean-table')
    useSessionStore.getState().resetSession()
  })

  it('从当前状态选出一个尚未完成且依赖满足的目标', () => {
    const state = useGameStore.getState()
    const goal = findActiveGoal(state.task, state.getEntitySnapshot(), state.achievedGoalIds)

    expect(goal?.id).toBe('g-dirty-cup')
    expect(buildFlowHint(goal!, 1)).toContain(goal!.description)
    expect(buildFlowHint(goal!, 2)).toContain('物体状态')
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
      activeFlowHint: { goalId: 'g-dirty-cup', level: 1, message: 'test' },
    })

    const cup = useGameStore.getState().entities.find((entity) => entity.configId === 'obj-dirty-cup')!
    useGameStore.setState((state) => ({
      phase: 'playing',
      entities: state.entities.map((entity) => (
        entity.id === cup.id
          ? { ...entity, status: 'placed' as const, placedIn: 'cnt-sink' }
          : entity
      )),
    }))
    useGameStore.getState().checkLevelCompletion()

    expect(useGameStore.getState().lastGoalProgressMs).toBe(30_000)
    expect(useGameStore.getState().flowHintLevel).toBe(0)
    expect(useGameStore.getState().activeFlowHint).toBeNull()
  })
})
