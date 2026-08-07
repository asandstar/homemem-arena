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
  /** 门开关状态：key=doorKey(roomA, roomB)，true=开。默认全关，需 F 键交互打开。 */
  doorOpenStates: Record<string, boolean>
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
  /** 切换两房间之间的门开关状态，返回切换后的开/关状态 */
  toggleDoor: (roomA: RoomId, roomB: RoomId) => boolean
}

// Hotfix 2026-08-07: 首帧 getSnapshot=null → 全局 withSafeSnapshot v3 包装
//   (safeStore.ts: useCallback([])+ref 使 stableSelector 引用永远不变，
//    用户 inline selector 通过 ref 取最新值，彻底消除 MAX_DEPTH 订阅循环)
// 但 withSafeSnapshot 会破坏 getState() 返回空对象的问题，因此改为：
// - 直接导出原始 store（保留所有静态方法 getState/setState/subscribe 完整可用）
// - 同时导出 safeGetStore 包装函数用于 React 组件内使用（首帧 null 安全）
const _rawGameStore = create<GameStore>((set, rawGet, _store) => {
  // ⚠️ ROOT FIX 2026-08-07 (双保险):
  // 1. safeGet: 读 state null → EMPTY（空对象），避免 rawGet() 返回 null 时解引用崩溃
  //    注：不能用 _store.getInitialState()，createState 回调执行期间它还没初始化
  // 2. safeSet: 写 state fn 形式，fn 收到的 state 永远非 null（rawGet 为 null 时传 EMPTY）
  //    {}.score = undefined，不会崩（null.score 才崩），NaN 最终会被后续 fallback 消化
  const EMPTY_STATE: GameStore = {} as GameStore
  const safeGet = (): GameStore => rawGet() ?? EMPTY_STATE
  const safeSet: any = (partial: any, replace: boolean = false) => {
    if (typeof partial === 'function') {
      const actualState = safeGet()
      const next = partial(actualState)
      // ⚠️ ROOT FIX 2026-08-07: zustand 约定：set(fn) 的 fn 返回 null/undefined 表示"跳过这次更新"。
      // 之前的 safeSet 忽略了这个约定，直接 set(null) 把整个 state 清成了 null 或只剩 1 个 key！
      // 这是 sweepExpiredDemoHighlights 每帧调用 set(fn)，当过滤后 length 相等时 return null
      // 导致整个 store state 被清空成 {score} 的根因（之前反复出现的 initializeTask undefined 也是它！）
      if (next === null || next === undefined) return
      return replace ? set(next, true) : set(next)
    }
    // 对象形式：null/undefined 也跳过
    if (partial === null || partial === undefined) return
    return replace ? set(partial, true) : set(partial)
  }
  const _task = createTaskSlice(safeSet, safeGet)
  const _player = createPlayerSlice(safeSet, safeGet)
  const _entity = createEntitySlice(safeSet, safeGet)
  const _memory = createMemorySlice(safeSet, safeGet)
  const _chaos = createChaosSlice(safeSet, safeGet)
  const _score = createScoreSlice(safeSet, safeGet)
  const _feedback = createFeedbackSlice(safeSet, safeGet)
  const _anim = createAnimationSlice(safeSet, safeGet)
  const _flow = createFlowSlice(safeSet, safeGet)
  const _progress = createProgressSlice(safeSet, safeGet)
  // 诊断：HMR 下某些 slice 可能返回 undefined
  if (!_task || !_player || !_entity || !_flow) {
    console.error('[STORE CREATE DIAG]', {
      task: _task ? Object.keys(_task).length : 'NULL',
      player: _player ? Object.keys(_player).length : 'NULL',
      entity: _entity ? Object.keys(_entity).length : 'NULL',
      flow: _flow ? Object.keys(_flow).length : 'NULL',
      hasInit: typeof _task?.initializeTask,
    })
  }
  return {
  ..._task,
  ..._player,
  ..._entity,
  ..._memory,
  ..._chaos,
  ..._score,
  ..._feedback,
  ..._anim,
  ..._flow,
  ..._progress,

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

/**
 * Game store 导出 —— 使用 withSafeSnapshot 包装。
 * 包装器保护 React 首帧 getSnapshot 为 null 的情况（MAX_DEPTH / 崩溃），
 * 同时显式复制 getState/setState/subscribe/getInitialState 4 个静态方法，
 * 确保非 React 上下文（事件监听、初始化流程等）的 getState() 完整可用。
 */
export const useGameStore = withSafeSnapshot(_rawGameStore)

// 保护性监控：任何时刻 state 被意外清空为 <5 keys 时报警。
// 历史根因：safeSet 的 function 返回 null 时 zustand 被整包 set(null)，state 从 133 keys 被清空为 null 或 {score}。
{
  let _prevKeys = (_rawGameStore.getState() as any) ? Object.keys(_rawGameStore.getState() as any).length : 0
  _rawGameStore.subscribe((newState: any) => {
    const _newKeys = newState ? Object.keys(newState).length : 0
    if (_newKeys < 5 && _prevKeys >= 10) {
      console.error('[STORE SAFETY] state 被异常清空! from=', _prevKeys, 'keys to=', _newKeys, 'keys. next=', newState ? Object.keys(newState) : 'null')
    }
    _prevKeys = _newKeys
  })
}

/**
 * 直接获取 game store state 的辅助函数。
 *
 * 为什么需要这个：withSafeSnapshot 包装器的 getState 静态方法在某些场景下
 * （组件 remount、React Router 重新挂载）会返回 null，导致非 React 上下文
 * 的初始化逻辑崩溃。原始 _rawGameStore.getState() 始终正常（诊断已验证），
 * 所以这里直接委托给原始 store，绕过包装器的 bug。
 *
 * 用法：在非 React 上下文（useEffect、事件回调、初始化流程）中
 *   import { getGameState } from '../store/useGameStore'
 *   const state = getGameState()  // 永远不会返回 null
 */
export function getGameState(): GameStore {
  return _rawGameStore.getState()
}

/** 直接调用 setState（绕过 withSafeSnapshot 包装器） */
export const setGameState: (partial: Partial<GameStore> | ((s: GameStore) => Partial<GameStore>)) => void = (partial) => {
  _rawGameStore.setState(partial as any)
}
