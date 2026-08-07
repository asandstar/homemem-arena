import { describe, it, expect } from 'vitest'
import {
  getRotatedFootprint,
  shouldDecorProvideCollision,
  shouldContainerProvideCollision,
} from './sceneSchema'
import { resolveFallbackSize } from '../utils/resolveFallbackSize'

describe('sceneSchema - 场景碰撞元数据纯函数基础', () => {
  // ---------------------------------------------------------------
  // §1. getRotatedFootprint
  // ---------------------------------------------------------------
  describe('getRotatedFootprint - 任意 yaw 轴对齐 AABB 尺寸', () => {
    // 公共基线尺寸：沙发主位 2.4 宽 × 1.0 深
    const size = { x: 2.4, z: 1.0 }

    it('rotation = 0 → 返回原尺寸', () => {
      const result = getRotatedFootprint(size, 0)
      expect(result.x).toBeCloseTo(2.4, 9)
      expect(result.z).toBeCloseTo(1.0, 9)
    })

    it('rotation = π/2 (90°) → x/z 交换', () => {
      const result = getRotatedFootprint(size, Math.PI / 2)
      // cos(π/2)=0, sin(π/2)=1
      // x = 0*2.4 + 1*1.0 = 1.0
      // z = 1*2.4 + 0*1.0 = 2.4
      expect(result.x).toBeCloseTo(1.0, 9)
      expect(result.z).toBeCloseTo(2.4, 9)
    })

    it('rotation = π (180°) → 与 0 等价（AABB 对称）', () => {
      const result = getRotatedFootprint(size, Math.PI)
      expect(result.x).toBeCloseTo(2.4, 9)
      expect(result.z).toBeCloseTo(1.0, 9)
    })

    it('rotation = -π/2 (-90°) → 与 π/2 等价（abs(cos/sin) 相同）', () => {
      const result = getRotatedFootprint(size, -Math.PI / 2)
      expect(result.x).toBeCloseTo(1.0, 9)
      expect(result.z).toBeCloseTo(2.4, 9)
    })

    it('rotation = π/4 (45°) → 保守轴对齐包络，x=z≈(2.4+1.0)*√2/2', () => {
      const result = getRotatedFootprint(size, Math.PI / 4)
      const sqrt2_2 = Math.SQRT2 / 2
      const expected = sqrt2_2 * 2.4 + sqrt2_2 * 1.0
      // ≈ 0.70710678 * 3.4 = 2.40416304
      expect(result.x).toBeCloseTo(expected, 9)
      expect(result.z).toBeCloseTo(expected, 9)
      // 非正交角度必须返回保守包络（比原尺寸的"长"边还大）
      expect(result.x).toBeGreaterThan(2.4)
      expect(result.z).toBeGreaterThan(2.4)
    })

    it('rotation 缺失（undefined） → 视为 0，返回原尺寸', () => {
      const result = getRotatedFootprint(size)
      expect(result.x).toBeCloseTo(2.4, 9)
      expect(result.z).toBeCloseTo(1.0, 9)
    })

    it('输入对象不被修改（纯函数）', () => {
      const input = { x: 2.4, z: 1.0 }
      const snapBefore = { ...input }
      getRotatedFootprint(input, Math.PI / 7)
      expect(input.x).toStrictEqual(snapBefore.x)
      expect(input.z).toStrictEqual(snapBefore.z)
    })
  })

  // ---------------------------------------------------------------
  // §2. shouldDecorProvideCollision
  // ---------------------------------------------------------------
  describe('shouldDecorProvideCollision - Decor 碰撞所有权判定', () => {
    it('collisionMode = self → 提供碰撞', () => {
      expect(
        shouldDecorProvideCollision({ collisionMode: 'self' }),
      ).toStrictEqual(true)
    })

    it('collisionMode = none → 不提供碰撞', () => {
      expect(
        shouldDecorProvideCollision({ collisionMode: 'none' }),
      ).toStrictEqual(false)
    })

    it('collisionMode 缺失（undefined）→ 向后兼容，默认提供碰撞', () => {
      expect(shouldDecorProvideCollision({})).toStrictEqual(true)
    })
  })

  // ---------------------------------------------------------------
  // §3. shouldContainerProvideCollision
  // ---------------------------------------------------------------
  describe('shouldContainerProvideCollision - Container 碰撞所有权判定', () => {
    it('collisionMode = self → 提供碰撞', () => {
      expect(
        shouldContainerProvideCollision({ collisionMode: 'self' }),
      ).toStrictEqual(true)
    })

    it('collisionMode = static-furniture → 转由 DF 承担，TC 不提供碰撞', () => {
      expect(
        shouldContainerProvideCollision({ collisionMode: 'static-furniture' }),
      ).toStrictEqual(false)
    })

    it('collisionMode = none → 完全不提供碰撞', () => {
      expect(
        shouldContainerProvideCollision({ collisionMode: 'none' }),
      ).toStrictEqual(false)
    })

    it('collisionMode 缺失（undefined）→ 向后兼容，默认提供碰撞', () => {
      expect(shouldContainerProvideCollision({})).toStrictEqual(true)
    })
  })
})

// ============================================================
// F1 · GLB fallback AABB 对齐 — resolveFallbackSize 回归断言
// 背景：之前 fallback 默认 0.5³，而沙发/茶几等 GLB + 碰撞盒尺寸要大得多（1~3m），
// 导致 fallback 视觉尺寸 ≪ 碰撞 AABB，玩家看到"穿墙/卡空气墙"。
// 修复：resolveFallbackSize 从 RUNTIME_MODEL_ASSET_REGISTRY.effectiveAabb 拉真实尺寸。
// ============================================================
describe('F1 · resolveFallbackSize (纯函数，零 React/Three 依赖)', () => {
  it('家具级 modelId (sofa / coffee_table / bookshelf / bed) 返回与 effectiveAabb 一致的大尺寸，而非默认 0.5³', () => {
    const sofa = resolveFallbackSize('sofa')
    const table = resolveFallbackSize('coffee_table')
    const shelf = resolveFallbackSize('bookshelf')
    const bed = resolveFallbackSize('bed')

    expect(sofa).toBeDefined()
    // sofa 主位 至少 1.5m 宽；kenney loungeSofa override 声明 1.96×0.92×0.82
    expect(sofa!.x).toBeGreaterThan(1.0)
    expect(sofa!.y).toBeGreaterThan(0.4)
    expect(sofa!.z).toBeGreaterThan(0.5)

    expect(table).toBeDefined()
    // 茶几至少 0.6×0.3×0.4；tableCoffee override 声明 1.322×0.46×0.8
    expect(table!.x).toBeGreaterThan(0.5)
    expect(table!.y).toBeGreaterThan(0.2)
    expect(table!.z).toBeGreaterThan(0.3)

    expect(shelf).toBeDefined()
    // 书架 override 声明 0.8×1.76×0.5，至少 0.4×1.0×0.2
    expect(shelf!.x).toBeGreaterThan(0.3)
    expect(shelf!.y).toBeGreaterThan(1.0)
    expect(shelf!.z).toBeGreaterThan(0.1)

    expect(bed).toBeDefined()
    // 双人床 override 声明 1.867×0.581×2.199
    expect(bed!.x).toBeGreaterThan(1.0)
    expect(bed!.y).toBeGreaterThan(0.3)
    expect(bed!.z).toBeGreaterThan(1.0)

    // 四者全部 ≠ 默认 0.5
    const allNotDefault = [sofa, table, shelf, bed].every(
      (s) => s!.x !== 0.5 || s!.y !== 0.5 || s!.z !== 0.5,
    )
    expect(allNotDefault).toBe(true)
  })

  it('显式传入的 explicitSize（每维 > 0）优先级最高，覆盖注册表', () => {
    const explicit = { x: 1.234, y: 2.345, z: 3.456 }
    const result = resolveFallbackSize('sofa', explicit)
    expect(result).toStrictEqual(explicit)
  })

  it('explicitSize 任意一维为 0 或负数 → 视为无效，回退到注册表', () => {
    const badX = { x: 0, y: 0.8, z: 0.8 }
    const badY = { x: 0.8, y: 0, z: 0.8 }
    const badZ = { x: 0.8, y: 0.8, z: 0 }
    const neg = { x: -1, y: 0.8, z: 0.8 }
    // 对 coffee_table 来说，注册表的 x/y/z 肯定不等于 0.8，所以会回退
    const fallbackReg = resolveFallbackSize('coffee_table')!
    expect(resolveFallbackSize('coffee_table', badX)).toStrictEqual(fallbackReg)
    expect(resolveFallbackSize('coffee_table', badY)).toStrictEqual(fallbackReg)
    expect(resolveFallbackSize('coffee_table', badZ)).toStrictEqual(fallbackReg)
    expect(resolveFallbackSize('coffee_table', neg)).toStrictEqual(fallbackReg)
  })

  it('未知小道具（不在 mapping 中）返回 undefined，保持 FallbackModels 原 0.5³', () => {
    expect(resolveFallbackSize('unknown-item-xx')).toBeUndefined()
    expect(resolveFallbackSize('')).toBeUndefined()
    // fridge 当前在 MODEL_ASSET_REGISTRY 里没有 entry，也会回 undefined
    expect(resolveFallbackSize('fridge')).toBeUndefined()
  })
})
