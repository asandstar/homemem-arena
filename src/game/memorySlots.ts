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
    if (s && !s.locked && s.confidence > 30) {
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

export function calcMemoryEffectiveRate(
  memoryUsedCount: number,
  outdatedMemoryCount: number
): number {
  if (memoryUsedCount === 0) return 0
  return Math.max(0, (memoryUsedCount - outdatedMemoryCount) / memoryUsedCount)
}
