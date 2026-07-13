import type { EntityState } from '../types/object'
import type { RoomId, Vec3 } from '../types/room'
import type { MemorySlot } from '../store/gameTypes'
import type { ProceduralProgress } from '../game/proceduralMemory'

export interface SaveData {
  id: string
  taskId: string
  taskName: string
  timestamp: number
  phase: string
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
}

export interface SaveMetadata {
  id: string
  taskId: string
  taskName: string
  timestamp: number
  elapsedMs: number
  phase: string
  levelCompleted: boolean
  levelFailed: boolean
}

const STORAGE_KEY_PREFIX = 'homemem_save_'
const STORAGE_KEY_LIST = 'homemem_save_list'
const MAX_SAVES = 10
const AUTO_SAVE_INTERVAL = 30000

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null

function generateSaveId(): string {
  return `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function safeParse<T>(data: string): T | null {
  try {
    return JSON.parse(data) as T
  } catch {
    return null
  }
}

function safeStringify(data: unknown): string {
  try {
    return JSON.stringify(data)
  } catch {
    return '{}'
  }
}

export function saveGame(saveData: Omit<SaveData, 'id' | 'timestamp'>): SaveData {
  const id = generateSaveId()
  const fullSaveData: SaveData = {
    ...saveData,
    id,
    timestamp: Date.now(),
  }

  try {
    const saveList = getSaveList()
    const newList = [{ id, taskId: saveData.taskId, taskName: saveData.taskName, timestamp: fullSaveData.timestamp }]
      .concat(saveList.filter(s => s.id !== id))
      .slice(0, MAX_SAVES)

    localStorage.setItem(`${STORAGE_KEY_PREFIX}${id}`, safeStringify(fullSaveData))
    localStorage.setItem(STORAGE_KEY_LIST, safeStringify(newList))

    return fullSaveData
  } catch (error) {
    console.warn('Save game failed:', error)
    throw error
  }
}

export function loadGame(saveId: string): SaveData | null {
  try {
    const data = localStorage.getItem(`${STORAGE_KEY_PREFIX}${saveId}`)
    if (!data) return null

    const saveData = safeParse<SaveData>(data)
    if (!saveData) {
      deleteSave(saveId)
      return null
    }

    return saveData
  } catch (error) {
    console.warn('Load game failed:', error)
    return null
  }
}

export function deleteSave(saveId: string): void {
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${saveId}`)

    const saveList = getSaveList()
    const newList = saveList.filter(s => s.id !== saveId)
    localStorage.setItem(STORAGE_KEY_LIST, safeStringify(newList))
  } catch (error) {
    console.warn('Delete save failed:', error)
  }
}

export function getSaveList(): SaveMetadata[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_LIST)
    if (!data) return []

    const list = safeParse<SaveMetadata[]>(data)
    if (!list || !Array.isArray(list)) return []

    const validList: SaveMetadata[] = []
    for (const meta of list) {
      const fullData = loadGame(meta.id)
      if (fullData) {
        validList.push({
          id: meta.id,
          taskId: meta.taskId,
          taskName: meta.taskName,
          timestamp: meta.timestamp,
          elapsedMs: fullData.elapsedMs,
          phase: fullData.phase,
          levelCompleted: fullData.levelCompleted,
          levelFailed: fullData.levelFailed,
        })
      }
    }

    return validList.sort((a, b) => b.timestamp - a.timestamp)
  } catch (error) {
    console.warn('Get save list failed:', error)
    return []
  }
}

export function getLatestSave(taskId?: string): SaveData | null {
  const saveList = getSaveList()
  const filtered = taskId
    ? saveList.filter(s => s.taskId === taskId)
    : saveList

  if (filtered.length === 0) return null

  return loadGame(filtered[0].id)
}

export function hasSavedGame(taskId?: string): boolean {
  const saveList = getSaveList()
  if (taskId) {
    return saveList.some(s => s.taskId === taskId)
  }
  return saveList.length > 0
}

export function startAutoSave(callback: () => void): void {
  stopAutoSave()
  autoSaveTimer = setInterval(callback, AUTO_SAVE_INTERVAL)
}

export function stopAutoSave(): void {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
    autoSaveTimer = null
  }
}

export function formatSaveTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function formatElapsedTime(elapsedMs: number): string {
  const seconds = Math.floor(elapsedMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}
