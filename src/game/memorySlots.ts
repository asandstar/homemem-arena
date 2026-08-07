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
  memoryType?: 'spatial' | 'object' | 'temporal' | 'procedural'
  /** 记忆记录时物体的世界坐标（Minimap 过期位置标记使用） */
  position?: { x: number; y: number; z: number }
}

export type MemorySlot = MemorySlotData | null

export const MEMORY_TYPE_WEIGHTS: Record<string, { scoreBonus: number; chaosReduction: number }> = {
  spatial: { scoreBonus: 50, chaosReduction: 5 },
  object: { scoreBonus: 30, chaosReduction: 3 },
  temporal: { scoreBonus: 40, chaosReduction: 4 },
  procedural: { scoreBonus: 60, chaosReduction: 6 },
}

export const MEMORY_PRIORITY_SCORE: Record<string, number> = {
  high: 100,
  medium: 50,
  low: 20,
}

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
  // 注意：锁定只防止被其他物品覆盖，不阻止真实世界变化导致的记忆过期
  return slots.map(s => {
    if (s && s.entityConfigId === entityConfigId && !s.outdated) {
      return { ...s, outdated: true, confidence: Math.max(20, s.confidence * 0.5) }
    }
    return s
  })
}

export function updateMemoryConfidence(slots: MemorySlot[], elapsedMs: number, chaosMultiplier: number = 1): MemorySlot[] {
  const baseDecayRate = 0.005
  return slots.map(s => {
    if (s && !s.locked && s.confidence > 10) {
      const decayRate = baseDecayRate * chaosMultiplier
      const decay = (elapsedMs / 1000) * decayRate * 100
      const priorityFactor = s.priority === 'high' ? 0.7 : s.priority === 'low' ? 1.3 : 1
      const adjustedDecay = decay * priorityFactor
      const newConfidence = Math.max(10, s.confidence - adjustedDecay)
      return {
        ...s,
        confidence: newConfidence,
        outdated: s.outdated || newConfidence < 40
      }
    }
    return s
  })
}

export function markRelatedMemoryOutdated(
  slots: MemorySlot[],
  entityConfigId: string
): MemorySlot[] {
  const targetSlot = slots.find(s => s?.entityConfigId === entityConfigId)
  if (!targetSlot) return slots

  const relatedIds = findRelatedEntityIds(entityConfigId)
  return slots.map(s => {
    if (s && !s.locked && relatedIds.includes(s.entityConfigId)) {
      return { ...s, outdated: true, confidence: Math.max(20, s.confidence * 0.7) }
    }
    return s
  })
}

function findRelatedEntityIds(entityConfigId: string): string[] {
  // L2 稳定空间记忆：3 件物品最终都归位到 cnt-coffee-table
  const relatedMap: Record<string, string[]> = {
    'obj-books': ['cnt-coffee-table', 'obj-mug', 'obj-radio'],
    'obj-mug': ['cnt-coffee-table', 'obj-books', 'obj-radio'],
    'obj-radio': ['cnt-coffee-table', 'obj-books', 'obj-mug'],
    'cnt-coffee-table': ['obj-books', 'obj-mug', 'obj-radio'],
  }
  return relatedMap[entityConfigId] || []
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
