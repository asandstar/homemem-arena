export interface MemorySlotData {
  id: string
  objectName: string
  roomName: string
  containerName: string | null
  state: string
  timestamp: number
  locked: boolean
  confidence: number
  outdated: boolean
  entityConfigId: string
  priority?: 'high' | 'medium' | 'low'
}

export type MemorySlot = MemorySlotData | null

export function findSlotByEntityConfigId(
  slots: MemorySlot[],
  entityConfigId: string
): number {
  return slots.findIndex(s => s && s.entityConfigId === entityConfigId)
}

export function findEmptySlot(slots: MemorySlot[]): number {
  return slots.findIndex(s => s === null)
}

export function findUnlockedSlot(slots: MemorySlot[]): number {
  return slots.findIndex(s => s && !s.locked)
}

export function markOutdatedByEntityConfigId(
  slots: MemorySlot[],
  entityConfigId: string
): MemorySlot[] {
  return slots.map(s => {
    if (s && s.entityConfigId === entityConfigId && !s.locked) {
      return { ...s, outdated: true, confidence: Math.max(20, s.confidence * 0.5) }
    }
    return s
  })
}

export function updateMemoryConfidence(slots: MemorySlot[], elapsedMs: number): MemorySlot[] {
  const decayRate = 0.005
  return slots.map(s => {
    if (s && !s.locked && s.confidence > 10) {
      const decay = (elapsedMs / 1000) * decayRate * 100
      const newConfidence = Math.max(10, s.confidence - decay)
      return {
        ...s,
        confidence: newConfidence,
        outdated: s.outdated || newConfidence < 40
      }
    }
    return s
  })
}

/**
 * 从任务目标中收集所有任务关键物品的 configId。
 * 任务关键物品 = 出现在 task.goals 中的物品（通过 relatedObjectIds 或 requiredSequence.targetId 声明）。
 */
export function getTaskCriticalObjectIds(
  goals: { relatedObjectIds?: string[]; requiredSequence?: { targetId: string }[] }[]
): Set<string> {
  const ids = new Set<string>()
  for (const goal of goals) {
    if (goal.relatedObjectIds) {
      for (const id of goal.relatedObjectIds) {
        ids.add(id)
      }
    }
    if (goal.requiredSequence) {
      for (const step of goal.requiredSequence) {
        ids.add(step.targetId)
      }
    }
  }
  return ids
}

/**
 * 在需要覆盖记忆时，根据优先级选择最该被覆盖的槽位。
 * 优先级顺序：low > medium > high（优先覆盖 low），同优先级内选最旧的。
 * locked 槽位永不覆盖。
 */
export function findOverwriteableSlot(
  slots: MemorySlot[]
): number {
  const priorityOrder: Record<string, number> = { low: 0, medium: 1, high: 2 }
  let bestIndex = -1
  let bestPriority = Infinity
  let bestTimestamp = Infinity

  for (let i = 0; i < slots.length; i++) {
    const s = slots[i]
    if (!s || s.locked) continue
    const p = priorityOrder[s.priority ?? 'medium'] ?? 1
    if (p < bestPriority || (p === bestPriority && s.timestamp < bestTimestamp)) {
      bestIndex = i
      bestPriority = p
      bestTimestamp = s.timestamp
    }
  }

  return bestIndex
}

export function calcMemoryEffectiveRate(
  memoryUsedCount: number,
  outdatedMemoryCount: number
): number {
  if (memoryUsedCount === 0) return 0
  return Math.max(0, (memoryUsedCount - outdatedMemoryCount) / memoryUsedCount)
}
