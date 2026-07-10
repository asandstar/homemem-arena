import { describe, it, expect } from 'vitest'
import {
  calcChaosGrowth,
  isGlitchActive,
  isEventBoosted,
  getChaosLevel,
  getChaosColor,
} from './chaos'
import { DEFAULT_LEVEL_BALANCE } from '../data/levelBalance'

describe('chaos - 压力/边界测试', () => {
  describe('calcChaosGrowth', () => {
    it('1 秒增长等于 chaosGrowthPerSecond', () => {
      const growth = calcChaosGrowth(1000, DEFAULT_LEVEL_BALANCE)
      expect(growth).toBeCloseTo(DEFAULT_LEVEL_BALANCE.chaosGrowthPerSecond, 5)
    })

    it('deltaMs 为 0 返回 0', () => {
      const growth = calcChaosGrowth(0, DEFAULT_LEVEL_BALANCE)
      expect(growth).toBe(0)
    })

    it('负 deltaMs - 返回负增长（极端情况）', () => {
      const growth = calcChaosGrowth(-1000, DEFAULT_LEVEL_BALANCE)
      expect(growth).toBeCloseTo(-DEFAULT_LEVEL_BALANCE.chaosGrowthPerSecond, 5)
    })

    it('极大 deltaMs - 不会溢出或 NaN', () => {
      const growth = calcChaosGrowth(999999999, DEFAULT_LEVEL_BALANCE)
      expect(Number.isFinite(growth)).toBe(true)
      expect(Number.isNaN(growth)).toBe(false)
    })

    it('1000 次随机时长 - 增长都为有限值', () => {
      for (let i = 0; i < 1000; i++) {
        const delta = Math.random() * 10000
        const growth = calcChaosGrowth(delta, DEFAULT_LEVEL_BALANCE)
        expect(Number.isFinite(growth)).toBe(true)
        expect(growth).toBeGreaterThanOrEqual(0)
      }
    })

    it('增长与时间线性相关', () => {
      const g1 = calcChaosGrowth(1000, DEFAULT_LEVEL_BALANCE)
      const g2 = calcChaosGrowth(2000, DEFAULT_LEVEL_BALANCE)
      expect(g2).toBeCloseTo(g1 * 2, 5)
    })

    it('chaosGrowthPerSecond 为 0 时不增长', () => {
      const config = { ...DEFAULT_LEVEL_BALANCE, chaosGrowthPerSecond: 0 }
      const growth = calcChaosGrowth(5000, config)
      expect(growth).toBe(0)
    })
  })

  describe('isGlitchActive', () => {
    it('低于阈值 - 不激活', () => {
      expect(isGlitchActive(59, DEFAULT_LEVEL_BALANCE)).toBe(false)
    })

    it('等于阈值 - 激活', () => {
      expect(isGlitchActive(60, DEFAULT_LEVEL_BALANCE)).toBe(true)
    })

    it('高于阈值 - 激活', () => {
      expect(isGlitchActive(80, DEFAULT_LEVEL_BALANCE)).toBe(true)
    })

    it('0 混乱度 - 不激活', () => {
      expect(isGlitchActive(0, DEFAULT_LEVEL_BALANCE)).toBe(false)
    })

    it('100 混乱度 - 激活', () => {
      expect(isGlitchActive(100, DEFAULT_LEVEL_BALANCE)).toBe(true)
    })

    it('阈值为 0 - 任何正数都激活', () => {
      const config = { ...DEFAULT_LEVEL_BALANCE, chaosGlitchThreshold: 0 }
      expect(isGlitchActive(0.001, config)).toBe(true)
      expect(isGlitchActive(0, config)).toBe(true)
    })

    it('阈值为 100 - 只有满值才激活', () => {
      const config = { ...DEFAULT_LEVEL_BALANCE, chaosGlitchThreshold: 100 }
      expect(isGlitchActive(99, config)).toBe(false)
      expect(isGlitchActive(100, config)).toBe(true)
    })
  })

  describe('isEventBoosted', () => {
    it('低于阈值 - 不加速', () => {
      expect(isEventBoosted(79, DEFAULT_LEVEL_BALANCE)).toBe(false)
    })

    it('等于阈值 - 加速', () => {
      expect(isEventBoosted(80, DEFAULT_LEVEL_BALANCE)).toBe(true)
    })

    it('高于阈值 - 加速', () => {
      expect(isEventBoosted(95, DEFAULT_LEVEL_BALANCE)).toBe(true)
    })

    it('glitch 阈值和 event 阈值独立', () => {
      const config = {
        ...DEFAULT_LEVEL_BALANCE,
        chaosGlitchThreshold: 30,
        chaosEventBoostThreshold: 70,
      }
      expect(isGlitchActive(50, config)).toBe(true)
      expect(isEventBoosted(50, config)).toBe(false)
      expect(isEventBoosted(80, config)).toBe(true)
    })
  })

  describe('getChaosLevel', () => {
    it('0 - low', () => {
      expect(getChaosLevel(0)).toBe('low')
    })

    it('29 - low', () => {
      expect(getChaosLevel(29)).toBe('low')
    })

    it('30 - medium', () => {
      expect(getChaosLevel(30)).toBe('medium')
    })

    it('59 - medium', () => {
      expect(getChaosLevel(59)).toBe('medium')
    })

    it('60 - high', () => {
      expect(getChaosLevel(60)).toBe('high')
    })

    it('84 - high', () => {
      expect(getChaosLevel(84)).toBe('high')
    })

    it('85 - critical', () => {
      expect(getChaosLevel(85)).toBe('critical')
    })

    it('100 - critical', () => {
      expect(getChaosLevel(100)).toBe('critical')
    })

    it('边界值附近 100 次采样 - 等级正确', () => {
      for (let i = 0; i < 100; i++) {
        const chaos = Math.random() * 120 - 10
        const level = getChaosLevel(chaos)
        if (chaos < 30) {
          expect(level).toBe('low')
        } else if (chaos < 60) {
          expect(level).toBe('medium')
        } else if (chaos < 85) {
          expect(level).toBe('high')
        } else {
          expect(level).toBe('critical')
        }
      }
    })

    it('负数 - low（极端情况）', () => {
      expect(getChaosLevel(-10)).toBe('low')
    })

    it('超大值 - critical（极端情况）', () => {
      expect(getChaosLevel(9999)).toBe('critical')
    })
  })

  describe('getChaosColor', () => {
    it('每个等级都返回有效颜色字符串', () => {
      const levels = ['low', 'medium', 'high', 'critical'] as const
      for (const level of levels) {
        const chaos = level === 'low' ? 10 : level === 'medium' ? 40 : level === 'high' ? 70 : 90
        const color = getChaosColor(chaos)
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/)
      }
    })

    it('等级上升 - 颜色从绿到红', () => {
      const cLow = getChaosColor(10)
      const cMedium = getChaosColor(40)
      const cHigh = getChaosColor(70)
      const cCritical = getChaosColor(90)
      expect(cLow).toBe('#22c55e')
      expect(cMedium).toBe('#f59e0b')
      expect(cHigh).toBe('#ef4444')
      expect(cCritical).toBe('#dc2626')
    })

    it('1000 次随机值都返回有效颜色', () => {
      for (let i = 0; i < 1000; i++) {
        const chaos = Math.random() * 150
        const color = getChaosColor(chaos)
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/)
        expect(color.length).toBe(7)
      }
    })
  })

  describe('完整时间线模拟 - 压力测试', () => {
    it('模拟 180 秒游戏过程 - 混乱度单调递增且合理', () => {
      let chaos = 0
      const deltaMs = 16
      const totalFrames = (180 * 1000) / deltaMs

      for (let i = 0; i < totalFrames; i++) {
        const growth = calcChaosGrowth(deltaMs, DEFAULT_LEVEL_BALANCE)
        chaos += growth
        const level = getChaosLevel(chaos)
        const glitch = isGlitchActive(chaos, DEFAULT_LEVEL_BALANCE)
        const boosted = isEventBoosted(chaos, DEFAULT_LEVEL_BALANCE)
        const color = getChaosColor(chaos)

        expect(Number.isFinite(chaos)).toBe(true)
        expect(['low', 'medium', 'high', 'critical']).toContain(level)
        expect(typeof glitch).toBe('boolean')
        expect(typeof boosted).toBe('boolean')
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/)

        if (chaos >= 85) {
          expect(level).toBe('critical')
          expect(boosted).toBe(true)
        }
        if (chaos >= 60) {
          expect(glitch).toBe(true)
        }
      }

      const expectedTotal = 180 * DEFAULT_LEVEL_BALANCE.chaosGrowthPerSecond
      expect(chaos).toBeCloseTo(expectedTotal, 0)
    })

    it('快速切换阈值 - 状态正确', () => {
      const thresholds = [29, 30, 59, 60, 84, 85, 100]
      const results = thresholds.map((t) => ({
        chaos: t,
        level: getChaosLevel(t),
        glitch: isGlitchActive(t, DEFAULT_LEVEL_BALANCE),
        boosted: isEventBoosted(t, DEFAULT_LEVEL_BALANCE),
      }))

      expect(results[0].level).toBe('low')
      expect(results[1].level).toBe('medium')
      expect(results[2].level).toBe('medium')
      expect(results[3].level).toBe('high')
      expect(results[3].glitch).toBe(true)
      expect(results[4].level).toBe('high')
      expect(results[5].level).toBe('critical')
      expect(results[5].boosted).toBe(true)
    })
  })
})
