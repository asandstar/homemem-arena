import { describe, it, expect } from 'vitest'
import { breakfastTask } from '../data/tasks/breakfast'

// Sprint 1A 回归测试：确保 breakfast 关卡两个 Probe 的正确答案
// 与对应 scriptedEvent 的真实效果一致。
//
// 背景：
// - se-fridge-auto-close 的 type 为 'message'，仅显示提醒，不实际关冰箱
// - se-milk-deduct-points 的 type 为 'message'，仅显示催促，不实际扣分
// 因此 Probe 的正确答案不得声称"自动关上"或"扣分"。

describe('breakfast Probe 与脚本事件一致性', () => {
  it('se-fridge-auto-close 是 message 事件，不改变冰箱状态', () => {
    const event = breakfastTask.scriptedEvents.find((e) => e.id === 'se-fridge-auto-close')
    expect(event).toBeDefined()
    expect(event?.type).toBe('message')
  })

  it('p-object-state-fridge 的正确答案与 message 事件一致（不声称自动关门）', () => {
    const probe = breakfastTask.probes.find((p) => p.id === 'p-object-state-fridge')
    expect(probe).toBeDefined()
    expect(probe?.correctAnswer).toBe('提醒玩家记得关冰箱门')
    // 回归保护：答案不得回退为声称状态变化
    expect(probe?.correctAnswer).not.toBe('自动关上冰箱门')
  })

  it('se-milk-deduct-points 是 message 事件，不实际扣分', () => {
    const event = breakfastTask.scriptedEvents.find((e) => e.id === 'se-milk-deduct-points')
    expect(event).toBeDefined()
    expect(event?.type).toBe('message')
  })

  it('p-temporal-penalty 的正确答案与 message 事件一致（不声称扣分）', () => {
    const probe = breakfastTask.probes.find((p) => p.id === 'p-temporal-penalty')
    expect(probe).toBeDefined()
    expect(probe?.correctAnswer).toBe('15 步')
    // 问题不得声称"扣分"，因为事件只是提醒
    expect(probe?.question).not.toMatch(/扣分/)
  })
})
