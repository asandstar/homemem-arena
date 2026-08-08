import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getTaskById } from '../data/tasks'
import { useGameStore } from '../store/useGameStore'
import {
  SAVE_VERSION,
  autosaveGame,
  computeTaskConfigHash,
  hasSavedGame,
} from './saveSystem'

const TASK_ID = 'task-clean-table'
const SAVE_KEY = `homemem_autosave_${TASK_ID}`

describe('saveSystem', () => {
  beforeEach(() => {
    localStorage.clear()
    useGameStore.getState().initializeTask(TASK_ID)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('简报阶段不生成 00:00 的可继续存档', () => {
    expect(useGameStore.getState().phase).toBe('briefing')
    expect(autosaveGame(TASK_ID)).toBeNull()
    expect(localStorage.getItem(SAVE_KEY)).toBeNull()
    expect(hasSavedGame(TASK_ID).ok).toBe(false)
  })

  it('playing 阶段一次自动存档只收集一次快照且写入有效记录', () => {
    useGameStore.getState().startPlaying()
    const originalSaveCurrentGame = useGameStore.getState().saveCurrentGame
    const snapshotSpy = vi.fn(originalSaveCurrentGame)
    useGameStore.setState({ saveCurrentGame: snapshotSpy })

    const saved = autosaveGame(TASK_ID)

    expect(snapshotSpy).toHaveBeenCalledTimes(1)
    expect(saved?.version).toBe(SAVE_VERSION)
    expect(hasSavedGame(TASK_ID).ok).toBe(true)
    expect(JSON.parse(localStorage.getItem(SAVE_KEY) ?? '{}').taskId).toBe(TASK_ID)
  })

  it('物品初始位置变化会改变配置指纹，避免恢复旧摆放', () => {
    const task = getTaskById(TASK_ID)
    const target = task?.objects[0]
    expect(target?.initialPosition).toBeDefined()
    if (!target?.initialPosition) return

    const originalPosition = target.initialPosition
    const before = computeTaskConfigHash(TASK_ID)
    try {
      target.initialPosition = { ...originalPosition, x: originalPosition.x + 0.125 }
      expect(computeTaskConfigHash(TASK_ID)).not.toBe(before)
    } finally {
      target.initialPosition = originalPosition
    }
  })

  it('旧版本存档不会显示为可继续，并会被清理', () => {
    useGameStore.getState().startPlaying()
    const current = autosaveGame(TASK_ID)
    expect(current).not.toBeNull()
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...current, version: SAVE_VERSION - 1 }))

    expect(hasSavedGame(TASK_ID).ok).toBe(false)
    expect(localStorage.getItem(SAVE_KEY)).toBeNull()
  })
})
