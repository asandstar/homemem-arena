import { describe, it, expect } from 'vitest'
import {
  calcComboMultiplier,
  calcCorrectPlaceScore,
  calcPickScore,
  calcTimeBonus,
  getRank,
  getTitle,
} from './scoring'
import { DEFAULT_LEVEL_BALANCE } from '../data/levelBalance'

describe('scoring - 压力/边界测试', () => {
  describe('calcComboMultiplier', () => {
    it('combo = 0 返回 1.0', () => {
      expect(calcComboMultiplier(0, DEFAULT_LEVEL_BALANCE)).toBe(1)
    })

    it('combo = 1 返回 1.0', () => {
      expect(calcComboMultiplier(1, DEFAULT_LEVEL_BALANCE)).toBe(1)
    })

    it('combo = 2 返回 1 + step', () => {
      const expected = 1 + DEFAULT_LEVEL_BALANCE.comboMultiplierStep
      expect(calcComboMultiplier(2, DEFAULT_LEVEL_BALANCE)).toBeCloseTo(expected, 5)
    })

    it('combo 很大时受 maxComboMultiplier 限制', () => {
      const result = calcComboMultiplier(999, DEFAULT_LEVEL_BALANCE)
      expect(result).toBe(DEFAULT_LEVEL_BALANCE.maxComboMultiplier)
    })

    it('负 combo 视为 0，返回 1.0', () => {
      expect(calcComboMultiplier(-5, DEFAULT_LEVEL_BALANCE)).toBe(1)
    })

    it('100 次连续 combo - 倍率单调递增且不超过最大值', () => {
      let prev = 0
      for (let i = 0; i < 100; i++) {
        const mult = calcComboMultiplier(i, DEFAULT_LEVEL_BALANCE)
        expect(mult).toBeGreaterThanOrEqual(prev)
        expect(mult).toBeLessThanOrEqual(DEFAULT_LEVEL_BALANCE.maxComboMultiplier)
        expect(Number.isFinite(mult)).toBe(true)
        prev = mult
      }
    })

    it('maxComboMultiplier = 1 时所有 combo 都不加成', () => {
      const config = { ...DEFAULT_LEVEL_BALANCE, maxComboMultiplier: 1 }
      for (let i = 0; i < 20; i++) {
        expect(calcComboMultiplier(i, config)).toBe(1)
      }
    })
  })

  describe('calcCorrectPlaceScore', () => {
    it('combo = 1 基础分', () => {
      const score = calcCorrectPlaceScore(1, DEFAULT_LEVEL_BALANCE)
      expect(score).toBe(DEFAULT_LEVEL_BALANCE.correctPlaceScore)
    })

    it('combo = 2 有加成', () => {
      const s1 = calcCorrectPlaceScore(1, DEFAULT_LEVEL_BALANCE)
      const s2 = calcCorrectPlaceScore(2, DEFAULT_LEVEL_BALANCE)
      expect(s2).toBeGreaterThan(s1)
    })

    it('得分总是整数（floor）', () => {
      for (let i = 1; i <= 50; i++) {
        const score = calcCorrectPlaceScore(i, DEFAULT_LEVEL_BALANCE)
        expect(Number.isInteger(score)).toBe(true)
      }
    })

    it('combo 封顶时得分也封顶', () => {
      const s1 = calcCorrectPlaceScore(11, DEFAULT_LEVEL_BALANCE)
      const s2 = calcCorrectPlaceScore(100, DEFAULT_LEVEL_BALANCE)
      expect(s1).toBe(s2)
    })

    it('1000 次随机 combo - 得分都为正整数', () => {
      for (let i = 0; i < 1000; i++) {
        const combo = Math.floor(Math.random() * 100)
        const score = calcCorrectPlaceScore(combo, DEFAULT_LEVEL_BALANCE)
        expect(Number.isInteger(score)).toBe(true)
        expect(score).toBeGreaterThan(0)
        expect(score).toBeLessThanOrEqual(
          Math.floor(DEFAULT_LEVEL_BALANCE.correctPlaceScore * DEFAULT_LEVEL_BALANCE.maxComboMultiplier)
        )
      }
    })
  })

  describe('calcPickScore', () => {
    it('返回固定拾取分数', () => {
      expect(calcPickScore(DEFAULT_LEVEL_BALANCE)).toBe(DEFAULT_LEVEL_BALANCE.pickTargetScore)
    })

    it('不同配置返回不同值', () => {
      const config = { ...DEFAULT_LEVEL_BALANCE, pickTargetScore: 999 }
      expect(calcPickScore(config)).toBe(999)
    })
  })

  describe('calcTimeBonus', () => {
    it('时间为 0 返回 0', () => {
      expect(calcTimeBonus(0, DEFAULT_LEVEL_BALANCE)).toBe(0)
    })

    it('剩余时间越多奖励越高', () => {
      const s1 = calcTimeBonus(10000, DEFAULT_LEVEL_BALANCE)
      const s2 = calcTimeBonus(60000, DEFAULT_LEVEL_BALANCE)
      expect(s2).toBeGreaterThan(s1)
    })

    it('负时间返回 0', () => {
      expect(calcTimeBonus(-5000, DEFAULT_LEVEL_BALANCE)).toBe(0)
    })

    it('返回整数', () => {
      for (let i = 0; i < 1000; i++) {
        const ms = Math.floor(Math.random() * 200000)
        const bonus = calcTimeBonus(ms, DEFAULT_LEVEL_BALANCE)
        expect(Number.isInteger(bonus)).toBe(true)
        expect(bonus).toBeGreaterThanOrEqual(0)
      }
    })

    it('完整 180 秒时间奖励正确', () => {
      const bonus = calcTimeBonus(180 * 1000, DEFAULT_LEVEL_BALANCE)
      expect(bonus).toBe(180 * DEFAULT_LEVEL_BALANCE.timeBonusRate)
    })
  })

  describe('getRank', () => {
    it('S 级 - 1200 分以上', () => {
      expect(getRank(1200).rank).toBe('S')
      expect(getRank(2000).rank).toBe('S')
    })

    it('A 级 - 900-1199', () => {
      expect(getRank(900).rank).toBe('A')
      expect(getRank(1199).rank).toBe('A')
    })

    it('B 级 - 650-899', () => {
      expect(getRank(650).rank).toBe('B')
      expect(getRank(899).rank).toBe('B')
    })

    it('C 级 - 400-649', () => {
      expect(getRank(400).rank).toBe('C')
      expect(getRank(649).rank).toBe('C')
    })

    it('D 级 - 400 以下', () => {
      expect(getRank(0).rank).toBe('D')
      expect(getRank(399).rank).toBe('D')
    })

    it('负分也是 D 级', () => {
      expect(getRank(-100).rank).toBe('D')
    })

    it('每个等级颜色不同', () => {
      const ranks = [0, 400, 650, 900, 1200].map(s => getRank(s).color)
      const unique = new Set(ranks)
      expect(unique.size).toBe(5)
    })

    it('1000 次随机分数都返回有效等级', () => {
      const validRanks = ['S', 'A', 'B', 'C', 'D']
      for (let i = 0; i < 1000; i++) {
        const score = Math.floor(Math.random() * 2000 - 200)
        const { rank, color } = getRank(score)
        expect(validRanks).toContain(rank)
        expect(typeof color).toBe('string')
        expect(color.length).toBeGreaterThan(0)
      }
    })

    it('边界值精确测试', () => {
      const boundaries = [
        [399, 'D'],
        [400, 'C'],
        [649, 'C'],
        [650, 'B'],
        [899, 'B'],
        [900, 'A'],
        [1199, 'A'],
        [1200, 'S'],
      ] as const
      for (const [score, expectedRank] of boundaries) {
        expect(getRank(score).rank).toBe(expectedRank)
      }
    })
  })

  describe('getTitle', () => {
    it('未完成关卡 - 返回家务系统崩溃', () => {
      expect(getTitle(1000, 5, 0, 30, 0.8, false)).toBe('家务系统崩溃')
    })

    it('完美记忆管家 - 高分零失误低混乱', () => {
      expect(getTitle(1200, 10, 0, 40, 0.9, true)).toBe('完美记忆管家')
    })

    it('高效家务机器人 - 高分高记忆有效率', () => {
      expect(getTitle(900, 5, 2, 50, 0.8, true)).toBe('高效家务机器人')
    })

    it('稳定运行中 - 中等分数', () => {
      expect(getTitle(650, 3, 1, 60, 0.6, true)).toBe('稳定运行中')
    })

    it('记忆模块待维护 - 较低分数', () => {
      expect(getTitle(400, 2, 3, 70, 0.5, true)).toBe('记忆模块待维护')
    })

    it('新手操作员 - 低分', () => {
      expect(getTitle(100, 1, 5, 80, 0.3, true)).toBe('新手操作员')
    })

    it('S 级但有错误放置 - 不是完美', () => {
      const title = getTitle(1300, 10, 1, 30, 0.9, true)
      expect(title).not.toBe('完美记忆管家')
    })

    it('1000 次随机参数都返回非空字符串', () => {
      for (let i = 0; i < 1000; i++) {
        const score = Math.floor(Math.random() * 1500)
        const maxCombo = Math.floor(Math.random() * 20)
        const wrongPlaceCount = Math.floor(Math.random() * 10)
        const chaosPeak = Math.random() * 100
        const memoryEffectiveRate = Math.random()
        const levelCompleted = Math.random() > 0.3

        const title = getTitle(score, maxCombo, wrongPlaceCount, chaosPeak, memoryEffectiveRate, levelCompleted)
        expect(typeof title).toBe('string')
        expect(title.length).toBeGreaterThan(0)
      }
    })
  })

  describe('完整游戏模拟 - 压力测试', () => {
    it('模拟 20 次正确放置 - 分数累加正确', () => {
      let totalScore = 0
      let combo = 0

      for (let i = 0; i < 20; i++) {
        combo++
        totalScore += calcPickScore(DEFAULT_LEVEL_BALANCE)
        totalScore += calcCorrectPlaceScore(combo, DEFAULT_LEVEL_BALANCE)
      }

      expect(totalScore).toBeGreaterThan(0)
      expect(Number.isInteger(totalScore)).toBe(true)
      expect(combo).toBe(20)
    })

    it('正确放置后错误放置 - combo 重置', () => {
      const s1 = calcCorrectPlaceScore(5, DEFAULT_LEVEL_BALANCE)
      const s2 = calcCorrectPlaceScore(1, DEFAULT_LEVEL_BALANCE)
      expect(s1).toBeGreaterThan(s2)
    })

    it('满 combo 的得分是基础分的 maxComboMultiplier 倍', () => {
      const base = calcCorrectPlaceScore(1, DEFAULT_LEVEL_BALANCE)
      const maxed = calcCorrectPlaceScore(999, DEFAULT_LEVEL_BALANCE)
      const ratio = maxed / base
      expect(ratio).toBeCloseTo(DEFAULT_LEVEL_BALANCE.maxComboMultiplier, 1)
    })
  })
})
