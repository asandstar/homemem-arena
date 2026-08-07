

export type LevelRank = 'S' | 'A' | 'B' | 'C' | 'D' | null

export interface LevelProgress {
  taskId: string
  unlocked: boolean
  completed: boolean
  rank: LevelRank
  bestScore: number
  completionTime: number | null
  attempts: number
}

export interface ProgressState {
  levelProgress: Record<string, LevelProgress>
  initializeProgress: (taskIds: string[]) => void
  unlockLevel: (taskId: string) => void
  completeLevel: (taskId: string, score: number, time: number) => void
  getLevelProgress: (taskId: string) => LevelProgress
  isLevelUnlocked: (taskId: string, allTasks: string[]) => boolean
  resetProgress: () => void
}

const STORAGE_KEY = 'homemem-level-progress'

function calculateRank(score: number): LevelRank {
  if (score >= 900) return 'S'
  if (score >= 700) return 'A'
  if (score >= 500) return 'B'
  if (score >= 300) return 'C'
  return 'D'
}

const DEFAULT_UNLOCKED_PUBLIC_TASK_IDS = [
  'task-clean-table',
  'task-leave-home',
  'task-laundry-sort',
] as const

function loadProgress(): Record<string, LevelProgress> {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      const parsed = JSON.parse(data) as Record<string, LevelProgress>
      // 兼容：老存档只有 L1 解锁时，自动把 L2/L3 也设为 unlocked，
      // 避免"升级后只看到 1 关"的困惑。
      DEFAULT_UNLOCKED_PUBLIC_TASK_IDS.forEach((id) => {
        if (!parsed[id]) {
          parsed[id] = {
            taskId: id,
            unlocked: true,
            completed: false,
            rank: null,
            bestScore: 0,
            completionTime: null,
            attempts: 0,
          }
        } else if (!parsed[id].unlocked) {
          parsed[id] = { ...parsed[id], unlocked: true }
        }
      })
      return parsed
    }
  } catch {
    /* ignore */
  }
  // 首次启动：默认解锁 3 个公开关卡
  const initial: Record<string, LevelProgress> = {}
  DEFAULT_UNLOCKED_PUBLIC_TASK_IDS.forEach((id) => {
    initial[id] = {
      taskId: id,
      unlocked: true,
      completed: false,
      rank: null,
      bestScore: 0,
      completionTime: null,
      attempts: 0,
    }
  })
  return initial
}

function saveProgress(progress: Record<string, LevelProgress>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
  }
}

export function createProgressSlice(set: any, get: any): ProgressState {
  return {
  levelProgress: loadProgress(),

  initializeProgress: (taskIds: string[]) => {
    const current = get().levelProgress
    const updated: Record<string, LevelProgress> = { ...current }

    taskIds.forEach((taskId) => {
      // 修复：强制覆盖 unlocked 为 true，避免旧存档锁定状态污染 DEV 模式的全解锁逻辑。
      // 如果该关卡已有记录，保留其 completed/rank 等进度信息，但强制解锁。
      if (updated[taskId]) {
        updated[taskId] = {
          ...updated[taskId],
          unlocked: true,
        }
      } else {
        updated[taskId] = {
          taskId,
          unlocked: true,
          completed: false,
          rank: null,
          bestScore: 0,
          completionTime: null,
          attempts: 0,
        }
      }
    })

    set({ levelProgress: updated })
    saveProgress(updated)
  },

  unlockLevel: (taskId: string) => {
    const current = get().levelProgress
    const updated = {
      ...current,
      [taskId]: {
        ...current[taskId],
        unlocked: true,
      },
    }
    set({ levelProgress: updated })
    saveProgress(updated)
  },

  completeLevel: (taskId: string, score: number, time: number) => {
    const current = get().levelProgress
    const existing = current[taskId] || {
      taskId,
      unlocked: true,
      completed: false,
      rank: null,
      bestScore: 0,
      completionTime: null,
      attempts: 0,
    }

    const newRank = calculateRank(score)
    const isNewBest = score > existing.bestScore

    const updated = {
      ...current,
      [taskId]: {
        ...existing,
        completed: true,
        rank: isNewBest ? newRank : existing.rank,
        bestScore: isNewBest ? score : existing.bestScore,
        completionTime: isNewBest ? time : existing.completionTime,
        attempts: existing.attempts + 1,
      },
    }

    set({ levelProgress: updated })
    saveProgress(updated)
  },

  getLevelProgress: (taskId: string) => {
    return get().levelProgress[taskId] || {
      taskId,
      unlocked: true,
      completed: false,
      rank: null,
      bestScore: 0,
      completionTime: null,
      attempts: 0,
    }
  },

  isLevelUnlocked: (_taskId: string, _allTasks: string[]) => {
    // 2026-08-07 修复：所有公开关卡默认解锁，不再要求前置关卡完成。
    // 仅隐藏关卡（如 breakfast/night-patrol）可能需要特殊解锁。
    return true
  },

  resetProgress: () => {
    const current = get().levelProgress
    const taskIds = Object.keys(current).length > 0
      ? Object.keys(current)
      : [...DEFAULT_UNLOCKED_PUBLIC_TASK_IDS]

    const reset: Record<string, LevelProgress> = {}
    taskIds.forEach((taskId) => {
      reset[taskId] = {
        taskId,
        unlocked: true,
        completed: false,
        rank: null,
        bestScore: 0,
        completionTime: null,
        attempts: 0,
      }
    })

    set({ levelProgress: reset })
    saveProgress(reset)
  },
  }
}
