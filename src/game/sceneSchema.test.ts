import { describe, it, expect } from 'vitest'
import {
  getRotatedFootprint,
  shouldDecorProvideCollision,
  shouldContainerProvideCollision,
} from './sceneSchema'

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
