import type { EntityState } from '../types/object'
import type { RoomId, Vec3 } from '../types/room'
import type { MemorySlot } from '../store/gameTypes'
import type { ProceduralProgress } from '../game/proceduralMemory'
import { useGameStore } from '../store/useGameStore'
import { useSessionStore } from '../store/useSessionStore'
import type { SessionData } from '../types/session'
import { getTaskById, PUBLIC_LEVEL_ORDER } from '../data/tasks'

/**
 * 存档系统（单槽覆盖）
 *
 * 约定：
 *  - 每关 1 个存档槽，key = `homemem_autosave_<taskId>`。用户没有手动多槽需求。
 *  - 触发：60 秒自动 / 暂停菜单打开 / 阶段切换后 / 离开页面前（beforeunload）。
 *  - 内容：game state（entities/containers/memory/score…）+ session 研究数据（events/probeAnswers），
 *          前者用于恢复游戏，后者用于保证研究数据不中断。
 *  - 兼容：SaveData 自带 `version` 和 `taskConfigHash`。版本或配置 hash 不匹配时，
 *          读档时拒绝并自动删除老存档，避免"旧数据灌进新关卡"的诡异回归。
 *
 * 关于 Set / 类 JSON 对象：
 *  - 存档写入时把 store 中的 Set（achievedGoalIds / triggeredEvents / visitedRooms）
 *    转为 Array（由 useGameStore.saveCurrentGame 负责，这里只对 SaveData 做 JSON 处理）。
 *  - 读档后 useGameStore.loadFromSave 会把数组转回 Set。
 */

export const SAVE_VERSION = 1
export const AUTOSAVE_INTERVAL_MS = 60_000
const KEY_PREFIX = 'homemem_autosave_'

export interface SaveData {
  version: number
  taskId: string
  taskName: string
  taskConfigHash: string
  timestamp: number
  phase: string
  isPaused?: boolean
  robotPosition: Vec3
  robotRotation: number
  currentRoom: RoomId
  entities: EntityState[]
  containerStates: Record<string, { open: boolean; containedIds: string[] }>
  heldEntityId: string | null
  stepCount: number
  elapsedMs: number
  visitedRooms: string[]
  memorySlots: (MemorySlot | null)[]
  chaosValue: number
  score: number
  combo: number
  maxCombo: number
  triggeredEvents: string[]
  achievedGoalIds: string[]
  proceduralProgress: Record<string, ProceduralProgress>
  levelCompleted: boolean
  levelFailed: boolean
  sessionData?: {
    id?: string
    episode_id?: string
    startTime?: number
    status?: SessionData['status']
    task_instruction?: string
    observations?: SessionData['observations']
    events?: SessionData['events']
    memories?: SessionData['memories']
    probeAnswers?: Record<string, any[]>
    aiSummary?: string
    finalize?: {
      status: SessionData['status']
      metrics: SessionData['metrics']
      failureReasons: any[]
      policySuggestions: any[]
    }
  }
}

// —— 内部工具 ——

function autosaveKey(taskId: string): string {
  return `${KEY_PREFIX}${taskId}`
}

/** 配置 hash：对当前 task 的 objects/containers/rooms 做简易指纹。
 *  变更过的关卡配置不能恢复旧存档。 */
export function computeTaskConfigHash(taskId: string): string {
  const t = getTaskById(taskId)
  if (!t) return 'no-task'
  const seed = JSON.stringify({
    objects: t.objects.map((o: any) => `${o.id}:${o.configId ?? o.category}:${o.initialRoom ?? o.startRoom ?? 'room'}`),
    containers: t.containers.map((c: any) => `${c.id}:${c.room ?? ''}`),
    rooms: (t.rooms || []).join(','),
    goals: (t.goals || []).map((g: any) => g.id),
  })
  // 快速 hash（不引入依赖，避免 package.json 变）
  let h = 2166136261 >>> 0
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

function readFromStorage<T = unknown>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function writeToStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn('[saveSystem] write failed:', e)
  }
}

function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

// —— 对外 API ——

/** 从 useGameStore + useSessionStore 快照组装 SaveData。 */
export function collectSaveData(taskId: string): SaveData | null {
  const snap = useGameStore.getState()
  if (!snap.task || snap.task.id !== taskId) return null
  const base = snap.saveCurrentGame() as SaveData | null
  if (!base) return null
  const session = useSessionStore.getState().currentSession
  const sess = session
    ? {
        id: session.id,
        episode_id: session.episode_id,
        startTime: session.startTime,
        status: session.status,
        task_instruction: session.task_instruction,
        observations: session.observations,
        events: session.events,
        memories: session.memories,
        probeAnswers: (session as any).probeAnswers,
        aiSummary: (session as any).aiSummary,
        finalize: (session as any).metrics && (session as any).metrics.durationMs > 0
          ? {
              status: session.status,
              metrics: (session as any).metrics,
              failureReasons: (session as any).failureReasons ?? [],
              policySuggestions: (session as any).policySuggestions ?? [],
            }
          : undefined,
      }
    : undefined
  // 注意：...base 已经由 saveGame() 填了 version/taskConfigHash。
  // 但 base 里没有 sessionData，所以最后展开 base 后只单独加 sessionData；
  // 不要重复覆盖 version/taskConfigHash，以免 TS 报错。
  return {
    ...base,
    sessionData: sess,
  } satisfies SaveData
}

/** 写单槽存档。自动覆盖上一次同 taskId 的存档。 */
export function autosaveGame(taskId: string): SaveData | null {
  const data = collectSaveData(taskId)
  if (!data) return null
  writeToStorage(autosaveKey(taskId), data)
  return data
}

/** 任务选择页判断某关是否存在可用存档。同时会顺手校验：version/hash 不对的旧存档直接清。 */
export function hasSavedGame(taskId: string): { ok: true; timestamp: number; elapsedMs: number; score: number } | { ok: false } {
  const raw = readFromStorage<SaveData>(autosaveKey(taskId))
  if (!raw) return { ok: false }
  if (raw.version !== SAVE_VERSION) {
    removeFromStorage(autosaveKey(taskId))
    return { ok: false }
  }
  const expectedHash = computeTaskConfigHash(taskId)
  if (raw.taskConfigHash !== expectedHash) {
    removeFromStorage(autosaveKey(taskId))
    return { ok: false }
  }
  // 完成/失败的关，不提示"继续"（但存档仍留给结果页展示）
  if (raw.levelCompleted || raw.levelFailed) return { ok: false }
  return { ok: true, timestamp: raw.timestamp, elapsedMs: raw.elapsedMs, score: raw.score }
}

/** 读取单槽存档（只读不灌 store）。 */
export function readSave(taskId: string): SaveData | null {
  const raw = readFromStorage<SaveData>(autosaveKey(taskId))
  if (!raw) return null
  if (raw.version !== SAVE_VERSION || raw.taskConfigHash !== computeTaskConfigHash(taskId)) {
    return null
  }
  return raw
}

/** 恢复存档到 useGameStore + useSessionStore。返回 true 表示成功。 */
export function restoreSave(taskId: string): boolean {
  const save = readSave(taskId)
  if (!save) return false
  try {
    useGameStore.getState().loadFromSave(save)
    if (save.sessionData) {
      const s = save.sessionData
      const sess: any = {
        id: s.id,
        episode_id: s.episode_id,
        taskId: save.taskId,
        taskName: save.taskName,
        task_instruction: s.task_instruction ?? '',
        scene_id: `scene-${save.taskId}`,
        startTime: s.startTime ?? save.timestamp,
        status: s.status ?? 'in-progress',
        events: s.events ?? [],
        memories: s.memories ?? [],
        observations: s.observations ?? [],
        metrics: s.finalize?.metrics ?? {
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
        },
      }
      if (s.probeAnswers) sess.probeAnswers = s.probeAnswers
      if (s.aiSummary) sess.aiSummary = s.aiSummary
      if (s.finalize) {
        sess.status = s.finalize.status
        sess.failureReasons = s.finalize.failureReasons
        sess.policySuggestions = s.finalize.policySuggestions
      }
      useSessionStore.setState({ currentSession: sess })
    }
    return true
  } catch (e) {
    console.warn('[saveSystem] restoreSave failed:', e)
    return false
  }
}

/** 显式删除单关存档（失败/重开时调用）。 */
export function deleteSave(taskId: string): void {
  removeFromStorage(autosaveKey(taskId))
}

/** 列出所有带存档的 taskId（用于"继续游戏"列表或排障）。 */
export function listSavedTaskIds(): string[] {
  const out: string[] = []
  for (const taskId of PUBLIC_LEVEL_ORDER) {
    if (hasSavedGame(taskId).ok) out.push(taskId)
  }
  return out
}

// —— 与旧实现兼容的存根 API：旧代码曾在 ArenaPage 调用 startAutoSave / stopAutoSave
//    且 `useGameStore.saveCurrentGame()` 直接 `saveGame({...})`，但 saveGame 之前不存在。
//    这里提供 3 个兼容函数，避免改动面太大。

export function saveGame(partial: Partial<SaveData> & { taskId: string; taskName: string }): SaveData {
  const taskId = partial.taskId
  const now = partial.timestamp ?? Date.now()
  const data: SaveData = {
    version: SAVE_VERSION,
    taskConfigHash: computeTaskConfigHash(taskId),
    timestamp: now,
    phase: 'briefing',
    robotPosition: { x: 0, y: 0, z: 0 },
    robotRotation: 0,
    currentRoom: 'entry' as RoomId,
    entities: [],
    containerStates: {},
    heldEntityId: null,
    stepCount: 0,
    elapsedMs: 0,
    visitedRooms: [],
    memorySlots: [],
    chaosValue: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    triggeredEvents: [],
    achievedGoalIds: [],
    proceduralProgress: {},
    levelCompleted: false,
    levelFailed: false,
    ...partial,
  }
  return data
}

let autoSaveTimer: ReturnType<typeof setInterval> | null = null

/** ArenaPage phase===playing 时启用，60 秒一次；暂停/阶段切换由各自路径单独调用 autosaveGame。 */
export function startAutoSave(saveFn?: () => void): void {
  stopAutoSave()
  autoSaveTimer = setInterval(() => {
    const gs = useGameStore.getState()
    if (gs.isPaused) return
    if (gs.phase !== 'playing') return
    if (saveFn) {
      try { saveFn() } catch (e) { console.warn('[saveSystem] saveFn threw:', e) }
      return
    }
    if (gs.task) autosaveGame(gs.task.id)
  }, AUTOSAVE_INTERVAL_MS)
}

export function stopAutoSave(): void {
  if (autoSaveTimer !== null) {
    clearInterval(autoSaveTimer)
    autoSaveTimer = null
  }
}
