import type { EntityState } from '../../types/object'
import type { RoomSpec } from '../../types/room'
import type { MemorySlot } from '../gameTypes'
import { markOutdatedByEntityConfigId } from '../../game/memorySlots'
import { playSfx } from '../../audio/sfx'
import { DEFAULT_LEVEL_BALANCE } from '../../data/levelBalance'
import { generateId } from '../../utils/format'
import { sharedRooms } from '../../data/rooms'

export interface MemorySliceState {
  memorySlots: (MemorySlot | null)[]
  flashingSlotIndex: number | null

  saveMemory: (entity: EntityState) => { success: boolean; slotIndex?: number; isUpdate?: boolean }
  lockMemorySlot: (slotIndex: number) => void
  clearMemorySlot: (slotIndex: number) => void
  markMemoryOutdated: (entityConfigId: string) => void
  setFlashingSlotIndex: (index: number | null) => void
}

export const createMemorySlice = (set: any, get: any): MemorySliceState => ({
  memorySlots: new Array(DEFAULT_LEVEL_BALANCE.memorySlotCount).fill(null),
  flashingSlotIndex: null,

  saveMemory: (entity: EntityState) => {
    const { memorySlots, currentRoom, task } = get()

    let placedInContainerName: string | null = null
    if (entity.placedIn) {
      const container = task?.containers.find((c: any) => c.id === entity.placedIn)
      placedInContainerName = container?.name ?? null
    }

    const roomName = (sharedRooms as Record<string, RoomSpec>)[currentRoom]?.name ?? currentRoom

    const existingIndex = memorySlots.findIndex((s: MemorySlot | null) => s && s.entityConfigId === entity.configId)
    const isUpdate = existingIndex !== -1

    const newMemory: MemorySlot = {
      id: generateId('mem'),
      objectName: entity.name,
      roomName,
      containerName: placedInContainerName,
      state: entity.status,
      timestamp: Date.now(),
      locked: false,
      confidence: 100,
      outdated: false,
      entityConfigId: entity.configId,
    }

    if (isUpdate) {
      const oldSlot = memorySlots[existingIndex]
      if (oldSlot?.locked) {
        return { success: false, slotIndex: existingIndex, isUpdate: false }
      }
      const newSlots = [...memorySlots]
      newSlots[existingIndex] = { ...newMemory, id: oldSlot!.id }
      set({ memorySlots: newSlots })
      get().incrementMemoryUpdate()
      get().addScore(DEFAULT_LEVEL_BALANCE.memoryUpdateScore)
      get().addFloatingText(`+${DEFAULT_LEVEL_BALANCE.memoryUpdateScore}`, 'memory', entity.position.x, entity.position.y + 1)
      get().triggerMemorySaveEffect(existingIndex)
      return { success: true, slotIndex: existingIndex, isUpdate: true }
    }

    const emptyIndex = memorySlots.findIndex((slot: MemorySlot | null) => slot === null)

    if (emptyIndex !== -1) {
      const newSlots = [...memorySlots]
      newSlots[emptyIndex] = newMemory
      set({ memorySlots: newSlots })
      get().incrementMemoryUsed()
      get().triggerMemorySaveEffect(emptyIndex)
      get().addFloatingText('记忆已保存', 'memory', entity.position.x, entity.position.y + 1)
      playSfx('memory_save')
      return { success: true, slotIndex: emptyIndex, isUpdate: false }
    }

    const unlockedIndices = memorySlots
      .map((slot: MemorySlot | null, idx: number) => (slot && !slot.locked ? idx : -1))
      .filter((idx: number) => idx !== -1)

    if (unlockedIndices.length > 0) {
      const oldestIndex = unlockedIndices.reduce((oldest: number, idx: number) => {
        if (!memorySlots[oldest] || !memorySlots[idx]) return oldest
        return memorySlots[idx]!.timestamp < memorySlots[oldest]!.timestamp ? idx : oldest
      }, unlockedIndices[0])

      const newSlots = [...memorySlots]
      newSlots[oldestIndex] = newMemory
      set({ memorySlots: newSlots })
      get().incrementMemoryUsed()
      get().triggerMemorySaveEffect(oldestIndex)
      get().addFloatingText('记忆已覆盖', 'memory', entity.position.x, entity.position.y + 1)
      playSfx('memory_save')
      return { success: true, slotIndex: oldestIndex, isUpdate: false }
    }

    return { success: false, isUpdate: false }
  },

  lockMemorySlot: (slotIndex: number) => {
    const { memorySlots } = get()
    if (memorySlots[slotIndex]) {
      const newSlots = [...memorySlots]
      newSlots[slotIndex] = { ...newSlots[slotIndex]!, locked: !newSlots[slotIndex]!.locked }
      set({ memorySlots: newSlots })
    }
  },

  clearMemorySlot: (slotIndex: number) => {
    const { memorySlots } = get()
    const newSlots = [...memorySlots]
    newSlots[slotIndex] = null
    set({ memorySlots: newSlots })
  },

  setFlashingSlotIndex: (index: number | null) => {
    set({ flashingSlotIndex: index })
  },

  markMemoryOutdated: (entityConfigId: string) => {
    const { memorySlots } = get()
    const hasMatchingSlot = memorySlots.some((s: MemorySlot | null) => s && s.entityConfigId === entityConfigId && !s.outdated)
    if (!hasMatchingSlot) return

    const newSlots = markOutdatedByEntityConfigId(memorySlots, entityConfigId)
    set({ memorySlots: newSlots })
    get().incrementOutdatedMemory()
    get().incrementChaos(DEFAULT_LEVEL_BALANCE.outdatedMemoryChaos)
    playSfx('memory_outdated')
  },
})
