

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

function loadProgress(): Record<string, LevelProgress> {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : {}
  } catch {
    return {}
  }
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

    taskIds.forEach((taskId, index) => {
      if (!updated[taskId]) {
        updated[taskId] = {
          taskId,
          unlocked: index === 0,
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
    const index = allTasks.indexOf(taskId)

    if (index === 0) return true

    for (let i = 0; i < index; i++) {
      if (!progress[allTasks[i]]?.completed) {
        return false
      }
    }

    return progress[taskId]?.unlocked || false
  },

  resetProgress: () => {
    const current = get().levelProgress
    const taskIds = Object.keys(current)

    const reset: Record<string, LevelProgress> = {}
    taskIds.forEach((taskId, index) => {
      reset[taskId] = {
        taskId,
        unlocked: index === 0,
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
