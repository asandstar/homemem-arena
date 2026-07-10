import {
  buildFlowHint,
  findActiveGoal,
  FLOW_HINT_LEVEL_ONE_MS,
  FLOW_HINT_LEVEL_TWO_MS,
} from '../../game/flow'
import { useSessionStore } from '../useSessionStore'
import type { EntityState } from '../../types/object'
import type { EntityStateSnapshot } from '../../types/task'

function toEntitySnapshots(entities: EntityState[]): EntityStateSnapshot[] {
  return entities.map((e) => ({
    configId: e.configId,
    status: e.status,
    currentRoom: e.currentRoom,
    placedIn: e.placedIn,
    category: e.category,
    properties: e.properties,
  }))
}

export interface FlowSlice {
  lastGoalProgressMs: number
  longestProgressStallMs: number
  flowHintLevel: 0 | 1 | 2
  flowInterventionCount: number
  activeFlowHint: { goalId: string; level: 1 | 2; message: string } | null

  updateFlowState: (elapsedMs: number) => void
}

export function createFlowSlice(set: any, get: any): FlowSlice {
  return {
    lastGoalProgressMs: 0,
    longestProgressStallMs: 0,
    flowHintLevel: 0,
    flowInterventionCount: 0,
    activeFlowHint: null,

    updateFlowState: (elapsedMs: number) => {
      const state = get()
      if (state.phase !== 'playing' || !state.task) return

      const progressStallMs = Math.max(0, elapsedMs - state.lastGoalProgressMs)
      const nextLevel: 0 | 1 | 2 = progressStallMs >= FLOW_HINT_LEVEL_TWO_MS
        ? 2
        : progressStallMs >= FLOW_HINT_LEVEL_ONE_MS
          ? 1
          : 0

      set({ longestProgressStallMs: Math.max(state.longestProgressStallMs, progressStallMs) })
      if (nextLevel === 0 || nextLevel <= state.flowHintLevel) return

      const goal = findActiveGoal(state.task, toEntitySnapshots(state.entities), state.achievedGoalIds)
      if (!goal) return

      const message = buildFlowHint(goal, nextLevel)
      set({
        flowHintLevel: nextLevel,
        flowInterventionCount: state.flowInterventionCount + 1,
        activeFlowHint: { goalId: goal.id, level: nextLevel, message },
      })
      get().addEventToast(message, 'info', nextLevel === 1 ? 4500 : 6500)
      useSessionStore.getState().addEvent({
        type: 'flow_intervention',
        kind: 'stagnation-hint',
        level: nextLevel,
        goalId: goal.id,
        message,
        progressStallMs,
      }, state.stepCount)
    },
  }
}
