import { describe, it, expect } from 'vitest'
import {
  findSlotByEntityConfigId,
  findEmptySlot,
  findUnlockedSlot,
  markOutdatedByEntityConfigId,
  updateMemoryConfidence,
  calcMemoryEffectiveRate,
  type MemorySlot,
  type MemorySlotData,
} from './memorySlots'

function makeMemory(partial: Partial<MemorySlotData> = {}): MemorySlotData {
  return {
    id: 'mem-1',
    objectName: '测试物体',
    roomName: '客厅',
    containerName: '茶几',
    state: 'placed',
    timestamp: Date.now(),
    locked: false,
    confidence: 100,
    outdated: false,
    entityConfigId: 'obj-1',
    ...partial,
  }
}

function makeSlots(count: number): MemorySlot[] {
  return new Array(count).fill(null)
}

describe('memorySlots - 压力/边界测试', () => {
  describe('findSlotByEntityConfigId', () => {
    it('找到匹配的槽位', () => {
      const slots: MemorySlot[] = [
        makeMemory({ entityConfigId: 'obj-1' }),
        null,
        makeMemory({ entityConfigId: 'obj-2' }),
      ]
      expect(findSlotByEntityConfigId(slots, 'obj-2')).toBe(2)
    })

    it('找不到返回 -1', () => {
      const slots: MemorySlot[] = [null, makeMemory({ entityConfigId: 'obj-1' })]
      expect(findSlotByEntityConfigId(slots, 'nonexistent')).toBe(-1)
    })

    it('空数组返回 -1', () => {
      expect(findSlotByEntityConfigId([], 'obj-1')).toBe(-1)
    })

    it('全空槽返回 -1', () => {
      const slots = makeSlots(5)
      expect(findSlotByEntityConfigId(slots, 'obj-1')).toBe(-1)
    })

    it('100 个槽位查找正确', () => {
      const slots: MemorySlot[] = []
      for (let i = 0; i < 100; i++) {
        slots.push(makeMemory({ entityConfigId: `obj-${i}`, id: `mem-${i}` }))
      }
      expect(findSlotByEntityConfigId(slots, 'obj-50')).toBe(50)
      expect(findSlotByEntityConfigId(slots, 'obj-99')).toBe(99)
      expect(findSlotByEntityConfigId(slots, 'obj-100')).toBe(-1)
    })
  })

  describe('findEmptySlot', () => {
    it('找到第一个空槽', () => {
      const slots: MemorySlot[] = [
        makeMemory(),
        null,
        makeMemory(),
        null,
      ]
      expect(findEmptySlot(slots)).toBe(1)
    })

    it('全满返回 -1', () => {
      const slots: MemorySlot[] = [makeMemory(), makeMemory()]
      expect(findEmptySlot(slots)).toBe(-1)
    })

    it('全空返回 0', () => {
      const slots = makeSlots(5)
      expect(findEmptySlot(slots)).toBe(0)
    })

    it('空数组返回 -1', () => {
      expect(findEmptySlot([])).toBe(-1)
    })

    it('100 个槽位全满返回 -1', () => {
      const slots: MemorySlot[] = []
      for (let i = 0; i < 100; i++) {
        slots.push(makeMemory({ id: `mem-${i}` }))
      }
      expect(findEmptySlot(slots)).toBe(-1)
    })
  })

  describe('findUnlockedSlot', () => {
    it('找到第一个未锁定的槽位', () => {
      const slots: MemorySlot[] = [
        makeMemory({ locked: true }),
        makeMemory({ locked: false }),
        null,
      ]
      expect(findUnlockedSlot(slots)).toBe(1)
    })

    it('全锁定返回 -1', () => {
      const slots: MemorySlot[] = [
        makeMemory({ locked: true }),
        makeMemory({ locked: true }),
      ]
      expect(findUnlockedSlot(slots)).toBe(-1)
    })

    it('全空返回 -1', () => {
      expect(findUnlockedSlot(makeSlots(5))).toBe(-1)
    })

    it('空数组返回 -1', () => {
      expect(findUnlockedSlot([])).toBe(-1)
    })

    it('100 个槽位混合锁定状态 - 找到正确位置', () => {
      const slots: MemorySlot[] = []
      for (let i = 0; i < 100; i++) {
        slots.push(makeMemory({ id: `mem-${i}`, locked: i < 50 }))
      }
      expect(findUnlockedSlot(slots)).toBe(50)
    })
  })

  describe('markOutdatedByEntityConfigId', () => {
    it('标记匹配的记忆为过期', () => {
      const slots: MemorySlot[] = [
        makeMemory({ entityConfigId: 'obj-1', confidence: 100, outdated: false }),
        null,
      ]
      const result = markOutdatedByEntityConfigId(slots, 'obj-1')
      expect(result[0]?.outdated).toBe(true)
      expect(result[0]?.confidence).toBeLessThan(100)
    })

    it('不修改不匹配的记忆', () => {
      const slots: MemorySlot[] = [
        makeMemory({ entityConfigId: 'obj-1', confidence: 100, outdated: false }),
      ]
      const result = markOutdatedByEntityConfigId(slots, 'obj-2')
      expect(result[0]?.outdated).toBe(false)
      expect(result[0]?.confidence).toBe(100)
    })

    it('锁定的记忆仍然被标记为过期（锁定只防止覆盖，不阻止真实世界变化导致的过期）', () => {
      const slots: MemorySlot[] = [
        makeMemory({ entityConfigId: 'obj-1', locked: true, confidence: 100, outdated: false }),
      ]
      const result = markOutdatedByEntityConfigId(slots, 'obj-1')
      expect(result[0]?.outdated).toBe(true)
      expect(result[0]?.confidence).toBeLessThan(100)
      expect(result[0]?.locked).toBe(true)
    })

    it('不修改原数组', () => {
      const slots: MemorySlot[] = [
        makeMemory({ entityConfigId: 'obj-1', confidence: 100 }),
      ]
      const originalConfidence = slots[0]?.confidence
      markOutdatedByEntityConfigId(slots, 'obj-1')
      expect(slots[0]?.confidence).toBe(originalConfidence)
    })

    it('过期后置信度不低于 20', () => {
      const slots: MemorySlot[] = [
        makeMemory({ entityConfigId: 'obj-1', confidence: 30 }),
      ]
      const result = markOutdatedByEntityConfigId(slots, 'obj-1')
      expect(result[0]?.confidence).toBeGreaterThanOrEqual(20)
    })

    it('100 个槽位批量过期 - 只影响匹配的', () => {
      const slots: MemorySlot[] = []
      for (let i = 0; i < 100; i++) {
        slots.push(makeMemory({
          id: `mem-${i}`,
          entityConfigId: `obj-${i % 10}`,
          confidence: 100,
          outdated: false,
        }))
      }
      const result = markOutdatedByEntityConfigId(slots, 'obj-3')
      let affected = 0
      for (let i = 0; i < 100; i++) {
        if (result[i]?.outdated) affected++
      }
      expect(affected).toBe(10)
    })
  })

  describe('updateMemoryConfidence', () => {
    it('时间越长置信度越低', () => {
      const slots: MemorySlot[] = [
        makeMemory({ confidence: 100, locked: false }),
      ]
      const r1 = updateMemoryConfidence(slots, 1000)
      const r2 = updateMemoryConfidence(slots, 5000)
      expect(r2[0]!.confidence).toBeLessThan(r1[0]!.confidence)
    })

    it('锁定的记忆不衰减', () => {
      const slots: MemorySlot[] = [
        makeMemory({ confidence: 100, locked: true }),
      ]
      const result = updateMemoryConfidence(slots, 10000)
      expect(result[0]?.confidence).toBe(100)
    })

    it('置信度不低于 10', () => {
      const slots: MemorySlot[] = [
        makeMemory({ confidence: 50, locked: false }),
      ]
      const result = updateMemoryConfidence(slots, 99999999)
      expect(result[0]!.confidence).toBeGreaterThanOrEqual(10)
    })

    it('置信度低于 40 时标记为过期', () => {
      const slots: MemorySlot[] = [
        makeMemory({ confidence: 45, locked: false, outdated: false }),
      ]
      const result = updateMemoryConfidence(slots, 100000)
      if (result[0]!.confidence < 40) {
        expect(result[0]!.outdated).toBe(true)
      }
    })

    it('0 毫秒不改变', () => {
      const slots: MemorySlot[] = [makeMemory({ confidence: 80 })]
      const result = updateMemoryConfidence(slots, 0)
      expect(result[0]?.confidence).toBe(80)
    })

    it('空槽不受影响', () => {
      const slots: MemorySlot[] = [null, null]
      const result = updateMemoryConfidence(slots, 1000)
      expect(result[0]).toBeNull()
      expect(result[1]).toBeNull()
    })

    it('100 个槽位批量衰减 - 全部在合理范围', () => {
      const slots: MemorySlot[] = []
      for (let i = 0; i < 100; i++) {
        slots.push(makeMemory({
          id: `mem-${i}`,
          confidence: 50 + Math.random() * 50,
          locked: i % 10 === 0,
        }))
      }
      const result = updateMemoryConfidence(slots, 5000)
      for (let i = 0; i < 100; i++) {
        const mem = result[i]!
        expect(mem.confidence).toBeGreaterThanOrEqual(10)
        expect(mem.confidence).toBeLessThanOrEqual(100)
        if (i % 10 === 0) {
          expect(mem.locked).toBe(true)
          expect(mem.confidence).toBe(slots[i]!.confidence)
        }
      }
    })

    it('长时间模拟 - 置信度衰减到阈值后停止', () => {
      const slots: MemorySlot[] = [makeMemory({ confidence: 100 })]
      let current = slots
      for (let i = 0; i < 200; i++) {
        current = updateMemoryConfidence(current, 1000)
      }
      expect(current[0]!.confidence).toBeLessThanOrEqual(30)
      expect(current[0]!.confidence).toBeGreaterThanOrEqual(10)
    })
  })

  describe('calcMemoryEffectiveRate', () => {
    it('0 个记忆返回 0，避免把未使用显示为 100% 有效', () => {
      expect(calcMemoryEffectiveRate(0, 0)).toBe(0)
    })

    it('全部有效返回 1.0', () => {
      expect(calcMemoryEffectiveRate(10, 0)).toBe(1.0)
    })

    it('全部过期返回 0', () => {
      expect(calcMemoryEffectiveRate(5, 5)).toBe(0)
    })

    it('一半有效返回 0.5', () => {
      expect(calcMemoryEffectiveRate(10, 5)).toBe(0.5)
    })

    it('过期数大于使用数 - 返回 0 而不是负数', () => {
      expect(calcMemoryEffectiveRate(3, 10)).toBe(0)
    })

    it('1000 组随机值都在 [0, 1] 范围内', () => {
      for (let i = 0; i < 1000; i++) {
        const used = Math.floor(Math.random() * 20)
        const outdated = Math.floor(Math.random() * 20)
        const rate = calcMemoryEffectiveRate(used, outdated)
        expect(rate).toBeGreaterThanOrEqual(0)
        expect(rate).toBeLessThanOrEqual(1)
        expect(Number.isFinite(rate)).toBe(true)
      }
    })
  })

  describe('记忆槽完整生命周期模拟 - 压力测试', () => {
    it('模拟 100 次添加/过期/更新循环', () => {
      const SLOT_COUNT = 3
      let slots: MemorySlot[] = makeSlots(SLOT_COUNT)
      let nextId = 0

      for (let i = 0; i < 100; i++) {
        const emptyIdx = findEmptySlot(slots)
        if (emptyIdx !== -1) {
          slots[emptyIdx] = makeMemory({
            id: `mem-${nextId}`,
            entityConfigId: `obj-${nextId % 20}`,
            confidence: 100,
            timestamp: Date.now(),
          })
          nextId++
        } else {
          const unlockedIdx = findUnlockedSlot(slots)
          if (unlockedIdx !== -1) {
            slots[unlockedIdx] = makeMemory({
              id: `mem-${nextId}`,
              entityConfigId: `obj-${nextId % 20}`,
              confidence: 100,
              timestamp: Date.now(),
            })
            nextId++
          }
        }

        slots = updateMemoryConfidence(slots, 500)

        if (i % 5 === 0 && i > 0) {
          slots = markOutdatedByEntityConfigId(slots, `obj-${i % 20}`)
        }

        expect(slots.length).toBe(SLOT_COUNT)
      }

      expect(nextId).toBeGreaterThan(50)
    })
  })
})
