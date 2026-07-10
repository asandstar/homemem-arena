// AI 模块 - 事件 → 记忆生成
// 这是模拟的"机器人记忆系统"，把观察和操作转化为结构化记忆

import type { ObservationEvent, ActionEvent, ScriptedEventTrigger, MovementEvent } from '../types/event'
import type { MemoryEntry, MemoryType } from '../types/memory'
import { sharedRooms } from '../data/rooms'

export interface MemoryInput {
  observation?: ObservationEvent
  action?: ActionEvent
  movement?: MovementEvent
  scripted?: ScriptedEventTrigger
  step: number
  timestamp: number
  /** 已知记忆列表（用于去重与覆盖） */
  existingMemories: MemoryEntry[]
}

/**
 * 基于事件生成新的记忆条目
 * 返回 0 或多个记忆
 */
export function generateMemories(input: MemoryInput): Omit<MemoryEntry, 'id'>[] {
  const result: Omit<MemoryEntry, 'id'>[] = []

  // 1. 观察事件 → 空间/物体记忆
  if (input.observation) {
    const obs = input.observation
    const roomName = sharedRooms[obs.roomId]?.name ?? obs.roomId

    // 记录"在 XX 房间看到 XX"
    if (obs.visibleEntityIds.length > 0) {
      result.push({
        type: 'spatial',
        subject: '当前位置',
        room: obs.roomId,
        content: `在${roomName}看到 ${obs.visibleEntityIds.length} 件物品`,
        timestamp: input.timestamp,
        step: input.step,
        confidence: 0.9,
        source: 'observation',
      })
    }
  }

  // 2. 操作事件 → 程序/物体记忆
  if (input.action) {
    const act = input.action
    const roomName = sharedRooms[act.roomId]?.name ?? act.roomId

    if (act.result === 'success') {
      if (act.action === 'pick') {
        result.push({
          type: 'object',
          subject: act.targetId,
          room: act.roomId,
          content: `在${roomName}拾取了 ${act.targetId}`,
          timestamp: input.timestamp,
          step: input.step,
          confidence: 1.0,
          source: 'action',
          relatedEntityId: act.targetId,
        })
      } else if (act.action === 'place') {
        result.push({
          type: 'procedural',
          subject: act.targetId,
          room: act.roomId,
          content: `在${roomName}执行了放置操作`,
          timestamp: input.timestamp,
          step: input.step,
          confidence: 1.0,
          source: 'action',
        })
      } else if (act.action === 'open') {
        result.push({
          type: 'object',
          subject: act.targetId,
          room: act.roomId,
          content: `打开了 ${act.targetId}`,
          timestamp: input.timestamp,
          step: input.step,
          confidence: 0.95,
          source: 'action',
        })
      }
    }
  }

  // 3. 移动事件 → 空间记忆
  if (input.movement) {
    const mv = input.movement
    const toRoomName = sharedRooms[mv.toRoom]?.name ?? mv.toRoom
    if (mv.crossedDoorway) {
      result.push({
        type: 'spatial',
        subject: '当前位置',
        room: mv.toRoom,
        content: `从 ${mv.fromRoom} 移动到了 ${toRoomName}`,
        timestamp: input.timestamp,
        step: input.step,
        confidence: 1.0,
        source: 'action',
      })
    }
  }

  // 4. 脚本事件 → 高置信度记忆
  if (input.scripted) {
    result.push({
      type: input.scripted.eventId.includes('move') ? 'spatial' : 'object',
      subject: input.scripted.affectedEntityIds[0] ?? 'event',
      room: null,
      content: input.scripted.description,
      timestamp: input.timestamp,
      step: input.step,
      confidence: 1.0,
      source: 'scripted-event',
    })
  }

  return result
}

/**
 * 合并新记忆到现有记忆库
 * - 同一主体的"spatial"类型记忆会被更新（覆盖位置）
 * - 其他类型累加
 */
export function mergeMemories(
  existing: MemoryEntry[],
  newMemories: Omit<MemoryEntry, 'id'>[]
): MemoryEntry[] {
  const result = [...existing]

  for (const mem of newMemories) {
    // 空间记忆：同类同主题则覆盖
    if (mem.type === 'spatial') {
      const existingIdx = result.findIndex(
        (m) => m.type === 'spatial' && m.subject === mem.subject
      )
      if (existingIdx >= 0) {
        result[existingIdx] = { ...mem, id: result[existingIdx].id }
      } else {
        result.push({ ...mem, id: `mem_${Date.now()}_${Math.random()}` })
      }
    } else {
      result.push({ ...mem, id: `mem_${Date.now()}_${Math.random()}` })
    }
  }

  return result
}

export interface MemorySlotSuggestion {
  slotType: MemoryType
  priority: 'high' | 'medium' | 'low'
  targetSubject: string
  expectedContent: string
  confidenceThreshold: number
}

/**
 * 生成记忆槽建议
 * 分析当前事件和现有记忆状态，建议机器人应该优先记录哪些类型的记忆
 */
export function memorySlotSuggestion(input: MemoryInput): MemorySlotSuggestion[] {
  const suggestions: MemorySlotSuggestion[] = []
  const existing = input.existingMemories

  const memByType: Record<string, number> = {}
  for (const m of existing) {
    memByType[m.type] = (memByType[m.type] ?? 0) + 1
  }

  if (input.observation) {
    const obs = input.observation
    const roomName = sharedRooms[obs.roomId]?.name ?? obs.roomId

    if (obs.visibleEntityIds.length > 0) {
      const spatialCount = memByType.spatial ?? 0
      if (spatialCount < 3) {
        suggestions.push({
          slotType: 'spatial',
          priority: 'high',
          targetSubject: `room_${obs.roomId}`,
          expectedContent: `空间定位：${roomName} 区域的物品分布`,
          confidenceThreshold: 0.9,
        })
      }

      for (const entityId of obs.visibleEntityIds.slice(0, 3)) {
        const hasObjectMem = existing.some(m => m.type === 'object' && m.subject === entityId)
        if (!hasObjectMem) {
          suggestions.push({
            slotType: 'object',
            priority: 'medium',
            targetSubject: entityId,
            expectedContent: `物体识别：${entityId} 的属性与状态`,
            confidenceThreshold: 0.85,
          })
        }
      }
    }
  }

  if (input.action) {
    const act = input.action

    if (act.action === 'pick') {
      suggestions.push({
        slotType: 'object',
        priority: 'high',
        targetSubject: act.targetId,
        expectedContent: `抓取记录：已拾取 ${act.targetId}，更新持有状态`,
        confidenceThreshold: 1.0,
      })
    }

    if (act.action === 'place') {
      suggestions.push({
        slotType: 'procedural',
        priority: 'high',
        targetSubject: `container_${act.targetId}`,
        expectedContent: `放置记录：物品已放入 ${act.targetId}`,
        confidenceThreshold: 1.0,
      })
      suggestions.push({
        slotType: 'spatial',
        priority: 'medium',
        targetSubject: act.targetId,
        expectedContent: `位置更新：${act.targetId} 内物品清单`,
        confidenceThreshold: 0.95,
      })
    }

    if (act.action === 'open') {
      suggestions.push({
        slotType: 'procedural',
        priority: 'medium',
        targetSubject: act.targetId,
        expectedContent: `交互记录：${act.targetId} 已被打开`,
        confidenceThreshold: 0.95,
      })
    }
  }

  if (input.movement) {
    const mv = input.movement
    const toRoomName = sharedRooms[mv.toRoom]?.name ?? mv.toRoom

    suggestions.push({
      slotType: 'spatial',
      priority: 'high',
      targetSubject: 'current_location',
      expectedContent: `位置追踪：从 ${mv.fromRoom} 移动至 ${toRoomName}`,
      confidenceThreshold: 1.0,
    })

    if (mv.crossedDoorway) {
      suggestions.push({
        slotType: 'temporal',
        priority: 'medium',
        targetSubject: 'navigation',
        expectedContent: `路径记录：穿越 ${mv.fromRoom}-${mv.toRoom} 通道`,
        confidenceThreshold: 0.9,
      })
    }
  }

  const temporalCount = memByType.temporal ?? 0
  if (temporalCount < 2 && (input.action || input.movement)) {
    suggestions.push({
      slotType: 'temporal',
      priority: 'low',
      targetSubject: 'timeline',
      expectedContent: `时序标记：第 ${input.step} 步事件记录`,
      confidenceThreshold: 0.7,
    })
  }

  return suggestions
}
