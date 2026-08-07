import { create } from 'zustand'
import type { GoalSpec, TaskConfig } from '../types/task'
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
import { saveGame, autosaveGame, type SaveData } from '../save/saveSystem'
import { withSafeSnapshot } from './safeStore'
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
  DemoHighlight,
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
  isPaused: boolean
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
  /** 当前阶段（仅任务定义了 stages 时有效；否则为 null） */
  currentStageId: string | null
  /** 当前阶段玩家目标文案（直接来自 stages[].playerObjective 或 fallback 自动生成） */
  currentObjective: string | null
  /** L2 睡前仪式示范高亮集合：每个 id+objectConfigId/containerId+颜色+过期时间，Object3D/Container3D 订阅后做强化发光 */
  activeDemoHighlights: DemoHighlight[]
  /** L3 洗衣分拣容器位置交换：containerId → 覆盖后的 position（task.containers 渲染时先 merge 本映射） */
  containerOverrides: Record<string, { position?: Vec3 }>
  /** saveMemory 后触发的"清晰回冲"效果（Memory Modulator 用）：时间戳 ms，0 表示未触发 */
  memoryClearPulseMs: number
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
  setPaused: (paused: boolean) => void
  togglePause: () => void
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
  modifyChaos: (amount: number) => void
  decreaseChaos: (amount: number) => void
  resetChaos: () => void
  recordMistake: () => void
  recordSuccess: () => void
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
  decayMemories: (deltaMs: number) => void
  triggerEventEffect: (effectName: string) => void
  startMoveAnimation: (entityId: string, toRoom: RoomId, toPos: Vec3) => void
  updateMoveAnimations: () => void
  updateFlowState: (elapsedMs: number) => void
  checkProceduralAction: (action: 'pick' | 'place' | 'use', targetId: string) => { wrongOrder: boolean; currentStepLabel?: string }
  saveCurrentGame: () => SaveData | null
  loadFromSave: (saveData: SaveData) => void
  /** 阶段机：评估是否可以从当前阶段推进（命令、保存记忆、脚本事件后调用） */
  evaluateStageTransitions: (hint?: { afterEventId?: string; afterMemoryForEntityId?: string }) => void
  /** 强制推进到给定阶段（仅用于 leave-home 等任务内部脚本事件） */
  setStage: (stageId: string) => void
  /** L2 示范高亮：推入或覆盖一条示范高亮（带过期时间），durationMs 后自动清除 */
  pushDemoHighlight: (hl: Omit<DemoHighlight, 'expireAt'> & { durationMs?: number }) => void
  /** 清除指定 id 的示范高亮 */
  clearDemoHighlight: (id: string) => void
  /** 每帧清理过期的示范高亮 */
  sweepExpiredDemoHighlights: () => void
  /** L3 洗衣分拣：交换两个 task-container 的 position（同时交换 acceptedCategories 对应映射，便于 acceptedCategories 校验与放置后分类一致） */
  swapContainers: (a: string, b: string) => { success: boolean; reason?: string }
  /** Memory Modulator：触发一次"清晰回冲"脉冲（saveMemory 调用） */
  triggerMemoryClearPulse: () => void
}

// Hotfix 2026-08-07: 首帧 getSnapshot=null → 全局 withSafeSnapshot v3 包装
//   (safeStore.ts: useCallback([])+ref 使 stableSelector 引用永远不变，
//    用户 inline selector 通过 ref 取最新值，彻底消除 MAX_DEPTH 订阅循环)
// 同时，slice/跨 slice 聚合内部 rawGet → safeGet 包装防御 action 内读 state。
const _rawGameStore = create<GameStore>((set, rawGet, _store) => {
  // Hotfix 2026-08-07: 代码分包 / 路由懒加载会导致 zustand 内部首次 getSnapshot 返回 null；
  // 所有 slice 与跨 slice 聚合统一通过 safeGet 访问，避免 "Cannot read properties of null"。
  const EMPTY_STATE = {} as GameStore
  const safeGet = (): GameStore => (rawGet() ?? EMPTY_STATE)
  return {
  ...createTaskSlice(set, safeGet),
  ...createPlayerSlice(set, safeGet),
  ...createEntitySlice(set, safeGet),
  ...createMemorySlice(set, safeGet),
  ...createChaosSlice(set, safeGet),
  ...createScoreSlice(set, safeGet),
  ...createFeedbackSlice(set, safeGet),
  ...createAnimationSlice(set, safeGet),
  ...createFlowSlice(set, safeGet),
  ...createProgressSlice(set, safeGet),

  // Cross-slice aggregations that don't belong to any single slice
  getGameStats: () => {
    const { score, maxCombo, wrongPlaceCount, repeatSearchCount, memoryUsedCount, outdatedMemoryCount, memoryUpdateCount, elapsedMs, stepCount, chaosValue, chaosPeak, levelCompleted, levelFailed, failureReason, task, memorySlots } = safeGet()
    const memoryEffectiveRate = calcMemoryEffectiveRate(memoryUsedCount ?? 0, outdatedMemoryCount ?? 0)
    const spatialMemoryUsed = (memorySlots ?? []).filter(s => s?.memoryType === 'spatial').length
    const objectMemoryUsed = (memorySlots ?? []).filter(s => s?.memoryType === 'object').length
    const temporalMemoryUsed = (memorySlots ?? []).filter(s => s?.memoryType === 'temporal').length
    const proceduralMemoryUsed = (memorySlots ?? []).filter(s => s?.memoryType === 'procedural').length
    return {
      score: score ?? 0,
      maxCombo: maxCombo ?? 0,
      wrongPlaceCount: wrongPlaceCount ?? 0,
      repeatSearchCount: repeatSearchCount ?? 0,
      memoryUsedCount: memoryUsedCount ?? 0,
      outdatedMemoryCount: outdatedMemoryCount ?? 0,
      memoryUpdateCount: memoryUpdateCount ?? 0,
      memoryEffectiveRate,
      spatialMemoryUsed,
      objectMemoryUsed,
      temporalMemoryUsed,
      proceduralMemoryUsed,
      elapsedMs: elapsedMs ?? 0,
      stepCount: stepCount ?? 0,
      chaosValue: chaosValue ?? 0,
      chaosPeak: chaosPeak ?? 0,
      levelCompleted: !!levelCompleted,
      levelFailed: !!levelFailed,
      failureReason: failureReason ?? null,
      taskName: task?.name ?? null,
    }
  },

  saveCurrentGame: () => {
    const state = safeGet()
    if (!state?.task) return null

    try {
      const data = saveGame({
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
      // 完成/失败后仍写一次存档（但 hasSavedGame 会过滤掉这些状态，不显示继续按钮），
      // 方便 SessionDataPage 后续从存档恢复研究数据。
      try { autosaveGame(state.task.id) } catch { /* ignore */ }
      return data
    } catch {
      return null
    }
  },

  loadFromSave: (saveData: SaveData) => {
    // 恢复时先确保 task/config 引用与存档对应（task 本身不会持久化在 localStorage，
    // 因为它包含函数与不可序列化字段；所以我们从 getTaskById 重新取一份）。
    // 如果 task 尚未初始化，就调用 initializeTask 一次，保证所有 slices 的基础状态都正确。
    const stateBefore = safeGet()
    if (!stateBefore.task || stateBefore.task.id !== saveData.taskId) {
      const init = safeGet().initializeTask
      if (typeof init === 'function') init(saveData.taskId)
    }
    set({
      phase: saveData.phase as GamePhase,
      isPaused: false,
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
}
})

export const useGameStore = withSafeSnapshot(_rawGameStore)
