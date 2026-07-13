import { create } from 'zustand'
import type { EntityStateSnapshot, GoalSpec, TaskConfig } from '../types/task'
import type { EntityState } from '../types/object'
import type { RoomId, Vec3 } from '../types/room'
import { calcMemoryEffectiveRate } from '../game/memorySlots'
import { createTaskSlice } from './slices/taskSlice'
import { createPlayerSlice } from './slices/playerSlice'
import { createEntitySlice } from './slices/entitySlice'
import { createMemorySlice } from './slices/memorySlice'
import { createChaosSlice } from './slices/chaosSlice'
import { createScoreSlice } from './slices/scoreSlice'
import { createFeedbackSlice } from './slices/feedbackSlice'
import { createAnimationSlice } from './slices/animationSlice'
import { createFlowSlice } from './slices/flowSlice'
import { createProgressSlice } from './slices/progressSlice'
import { saveGame, type SaveData } from '../save/saveSystem'
import type {
  ViewMode,
  GamePhase,
  MemorySlot,
  FloatingText,
  FloatingTextType,
  EventToast,
  EventToastType,
  MoveAnimation,
  FeedbackState,
} from './gameTypes'
import type { ProceduralProgress } from '../game/proceduralMemory'
import type { ProgressState } from './slices/progressSlice'

// Re-export shared types for backward compatibility
export type {
  ViewMode,
  GamePhase,
  MemorySlot,
  FloatingText,
  FloatingTextType,
  EventToast,
  EventToastType,
  MoveAnimation,
  FeedbackState,
} from './gameTypes'

export interface GameState {
  phase: GamePhase
  task: TaskConfig | null
  robotPosition: Vec3
  robotRotation: number
  cameraPitch: number
  currentRoom: RoomId
  entities: EntityState[]
  containerStates: Record<string, { open: boolean; containedIds: string[] }>
  heldEntityId: string | null
  stepCount: number
  elapsedMs: number
  startTime: number | null
  visitedRooms: Set<RoomId>
  lastObservedIds: Set<string>
  viewMode: ViewMode
  memorySlots: (MemorySlot | null)[]
  flashingSlotIndex: number | null
  chaosValue: number
  chaosPeak: number
  score: number
  combo: number
  maxCombo: number
  levelFailed: boolean
  levelCompleted: boolean
  failureReason: string | null
  triggeredEvents: Set<string>
  achievedGoalIds: Set<string>
  wrongPlaceCount: number
  repeatSearchCount: number
  memoryUsedCount: number
  outdatedMemoryCount: number
  memoryUpdateCount: number
  feedback: FeedbackState | null
  shakingEntityId: string | null
  savingMemorySlotIndex: number | null
  chaosEffectActive: boolean
  floatingTexts: FloatingText[]
  eventToasts: EventToast[]
  activeEventEffects: string[]
  moveAnimations: MoveAnimation[]
  lastMoveAnimation: MoveAnimation | null
  lastGoalProgressMs: number
  longestProgressStallMs: number
  flowHintLevel: 0 | 1 | 2
  flowInterventionCount: number
  activeFlowHint: { goalId: string; level: 1 | 2; message: string } | null
  proceduralProgress: Record<string, ProceduralProgress>
}

export interface GameStats {
  score: number
  maxCombo: number
  wrongPlaceCount: number
  repeatSearchCount: number
  memoryUsedCount: number
  outdatedMemoryCount: number
  memoryUpdateCount: number
  memoryEffectiveRate: number
  spatialMemoryUsed: number
  objectMemoryUsed: number
  temporalMemoryUsed: number
  proceduralMemoryUsed: number
  elapsedMs: number
  stepCount: number
  chaosValue: number
  chaosPeak: number
  levelCompleted: boolean
  levelFailed: boolean
  failureReason: string | null
  taskName: string | null
}

interface GameStore extends GameState, ProgressState {
  initializeTask: (taskId: string) => void
  resetTask: () => void
  startPlaying: () => void
  setGamePhase: (phase: GamePhase) => void
  moveToRoom: (toRoom: RoomId, position: Vec3) => void
  rotateRobot: (deltaRot: number) => void
  setCameraPitch: (pitch: number) => void
  moveForward: (distance: number) => { success: boolean; reason?: string }
  pickEntity: (entityId: string) => { success: boolean; reason?: string }
  placeEntity: (containerId: string) => { success: boolean; reason?: string }
  useContainer: (containerId: string) => { success: boolean; reason?: string }
  tickElapsed: (deltaMs: number) => void
  incrementStep: () => void
  applyScriptedMove: (entityId: string, newRoom: RoomId, newPos: Vec3) => void
  getEntitySnapshot: () => { id: string; configId: string; status: string; currentRoom: RoomId; placedIn?: string; category: string; properties: Record<string, string | number | boolean> }[]
  toggleViewMode: () => void
  saveMemory: (entity: EntityState) => { success: boolean; slotIndex?: number; isUpdate?: boolean }
  lockMemorySlot: (slotIndex: number) => void
  clearMemorySlot: (slotIndex: number) => void
  setFlashingSlotIndex: (index: number | null) => void
  incrementChaos: (amount: number) => void
  resetChaos: () => void
  addScore: (points: number) => void
  resetScore: () => void
  addCombo: () => void
  breakCombo: () => void
  setLevelFailed: (reason?: string) => void
  setLevelCompleted: () => void
  incrementWrongPlace: () => void
  incrementRepeatSearch: () => void
  incrementMemoryUsed: () => void
  incrementOutdatedMemory: () => void
  incrementMemoryUpdate: () => void
  triggerEntityShake: (entityId: string) => void
  forgetCloseContainer: (roomId: RoomId) => void
  checkLevelCompletion: () => void
  triggerScriptedEvents: () => void
  showFeedback: (feedback: FeedbackState) => void
  hideFeedback: () => void
  getGameStats: () => GameStats
  isGoalAchieved: (goal: GoalSpec) => boolean
  triggerMemorySaveEffect: (slotIndex: number) => void
  triggerChaosEffect: () => void
  addFloatingText: (text: string, type: FloatingTextType, x: number, y: number) => void
  removeFloatingText: (id: string) => void
  addEventToast: (message: string, type: EventToastType, duration?: number, icon?: string) => void
  removeEventToast: (id: string) => void
  markMemoryOutdated: (entityConfigId: string) => void
  triggerEventEffect: (effectName: string) => void
  startMoveAnimation: (entityId: string, toRoom: RoomId, toPos: Vec3) => void
  updateMoveAnimations: () => void
  updateFlowState: (elapsedMs: number) => void
  checkProceduralAction: (action: 'pick' | 'place' | 'use', targetId: string) => { wrongOrder: boolean; currentStepLabel?: string }
  saveCurrentGame: () => SaveData | null
  loadFromSave: (saveData: SaveData) => void
}

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

export function isGoalSatisfied(
  goal: GoalSpec,
  entities: EntityStateSnapshot[],
  achievedGoalIds: Set<string>,
): boolean {
  const dependenciesMet = (goal.dependsOnGoalIds ?? []).every((id) => achievedGoalIds.has(id))
  if (!dependenciesMet) return false
  if (goal.kind === 'milestone' && achievedGoalIds.has(goal.id)) return true
  return goal.predicate(entities)
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...createTaskSlice(set, get),
  ...createPlayerSlice(set, get),
  ...createEntitySlice(set, get),
  ...createMemorySlice(set, get),
  ...createChaosSlice(set, get),
  ...createScoreSlice(set, get),
  ...createFeedbackSlice(set, get),
  ...createAnimationSlice(set, get),
  ...createFlowSlice(set, get),
  ...createProgressSlice(set, get),

  // Cross-slice aggregations that don't belong to any single slice
  getGameStats: () => {
    const { score, maxCombo, wrongPlaceCount, repeatSearchCount, memoryUsedCount, outdatedMemoryCount, memoryUpdateCount, elapsedMs, stepCount, chaosValue, chaosPeak, levelCompleted, levelFailed, failureReason, task, memorySlots } = get()
    const memoryEffectiveRate = calcMemoryEffectiveRate(memoryUsedCount, outdatedMemoryCount)
    const spatialMemoryUsed = memorySlots.filter(s => s?.memoryType === 'spatial').length
    const objectMemoryUsed = memorySlots.filter(s => s?.memoryType === 'object').length
    const temporalMemoryUsed = memorySlots.filter(s => s?.memoryType === 'temporal').length
    const proceduralMemoryUsed = memorySlots.filter(s => s?.memoryType === 'procedural').length
    return {
      score,
      maxCombo,
      wrongPlaceCount,
      repeatSearchCount,
      memoryUsedCount,
      outdatedMemoryCount,
      memoryUpdateCount,
      memoryEffectiveRate,
      spatialMemoryUsed,
      objectMemoryUsed,
      temporalMemoryUsed,
      proceduralMemoryUsed,
      elapsedMs,
      stepCount,
      chaosValue,
      chaosPeak,
      levelCompleted,
      levelFailed,
      failureReason,
      taskName: task?.name ?? null,
    }
  },

  isGoalAchieved: (goal) => {
    const { entities, achievedGoalIds } = get()
    return isGoalSatisfied(goal, toEntitySnapshots(entities), achievedGoalIds)
  },

  saveCurrentGame: () => {
    const state = get()
    if (!state.task) return null

    try {
      return saveGame({
        taskId: state.task.id,
        taskName: state.task.name,
        phase: state.phase,
        robotPosition: state.robotPosition,
        robotRotation: state.robotRotation,
        currentRoom: state.currentRoom,
        entities: state.entities,
        containerStates: state.containerStates,
        heldEntityId: state.heldEntityId,
        stepCount: state.stepCount,
        elapsedMs: state.elapsedMs,
        visitedRooms: Array.from(state.visitedRooms),
        memorySlots: state.memorySlots,
        chaosValue: state.chaosValue,
        score: state.score,
        combo: state.combo,
        maxCombo: state.maxCombo,
        triggeredEvents: Array.from(state.triggeredEvents),
        achievedGoalIds: Array.from(state.achievedGoalIds),
        proceduralProgress: state.proceduralProgress,
        levelCompleted: state.levelCompleted,
        levelFailed: state.levelFailed,
      })
    } catch {
      return null
    }
  },

  loadFromSave: (saveData: SaveData) => {
    set({
      phase: saveData.phase as GamePhase,
      robotPosition: saveData.robotPosition,
      robotRotation: saveData.robotRotation,
      currentRoom: saveData.currentRoom,
      entities: saveData.entities,
      containerStates: saveData.containerStates,
      heldEntityId: saveData.heldEntityId,
      stepCount: saveData.stepCount,
      elapsedMs: saveData.elapsedMs,
      visitedRooms: new Set(saveData.visitedRooms) as Set<RoomId>,
      memorySlots: saveData.memorySlots,
      chaosValue: saveData.chaosValue,
      score: saveData.score,
      combo: saveData.combo,
      maxCombo: saveData.maxCombo,
      triggeredEvents: new Set(saveData.triggeredEvents),
      achievedGoalIds: new Set(saveData.achievedGoalIds),
      proceduralProgress: saveData.proceduralProgress,
      levelCompleted: saveData.levelCompleted,
      levelFailed: saveData.levelFailed,
    })
  },
}))
