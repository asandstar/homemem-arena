

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

    taskIds.forEach((taskId, _index) => {
      if (!updated[taskId]) {
        // 首次启动默认解锁所有公开关卡（不再"index===0 才解锁"），
        // 避免用户误以为只有 1~2 关；解锁顺序仍然保留在 UI 上的"下一关"提示。
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
      unlocked: false,
      completed: false,
      rank: null,
      bestScore: 0,
      completionTime: null,
      attempts: 0,
    }
  },

  isLevelUnlocked: (taskId: string, allTasks: string[]) => {
    const progress = get().levelProgress
    // ✅ 优先尊重显式 unlocked=true（初始化/loadProgress 设置的），避免「3 关都解锁了但用户只看得到 1 关」的 bug。
    if (progress[taskId]?.unlocked) {
      return true
    }
    const index = allTasks.indexOf(taskId)
    // 第一关默认始终可用（即使 progress 里还没初始化也可以玩）
    if (index <= 0) return true
    // fallback：前一关完成则解锁
    for (let i = 0; i < index; i++) {
      if (!progress[allTasks[i]]?.completed) {
        return false
      }
    }
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
