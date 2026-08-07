/**
 * src/utils/nudgeFootprintAway.test.ts
 *
 * F5 · 猫脚印避让家具 回归断言。
 *
 * 被测试函数 nudgeFootprintAway 纯数学实现，无 Three/React 依赖。
 * 主要测：
 *   - 点在 AABB 内 → 沿最近边推出（4 个方向分别测试）
 *   - 点在 OBB 内（旋转90°）→ 推出到正确边
 *   - 点不在任何矩形内 → 不变，nudged=false
 *   - 多件家具相邻 → 迭代最多 3 次，保证最终不落在任何一件内
 *   - 客厅真实家具布局：默认 L2 living 演示路径从 (-1.2,-1.0) → (0.5,-1.5)
 *     中间经过 tv-stand (cx=-2.0, cz=-2.1, sx=2.0, sz=0.45)
 *     以及可能的 cnt-coffee-table，检查中间脚印不在家具内部
 */
import { describe, it, expect } from 'vitest'
import { nudgeFootprintAway, type FootprintOccSpec } from './nudgeFootprintAway'

// 辅助：判断一个点是否在某件 occluder 矩形内（局部坐标检查）
function isInsideAnyOcc(px: number, pz: number, occs: FootprintOccSpec[]): boolean {
  for (const occ of occs) {
    const rot = occ.rotationY ?? 0
    const dx = px - occ.cx
    const dz = pz - occ.cz
    const cos = Math.cos(-rot)
    const sin = Math.sin(-rot)
    const lx = dx * cos - dz * sin
    const lz = dx * sin + dz * cos
    if (Math.abs(lx) < occ.sx / 2 && Math.abs(lz) < occ.sz / 2) return true
  }
  return false
}

describe('F5 · nudgeFootprintAway — AABB（rotationY=0）推出 4 方向', () => {
  // 茶几：(0, 0)，宽 1.322 × 深 0.8（与 tableCoffee override 一致）
  const table: FootprintOccSpec = { cx: 0, cz: 0, sx: 1.322, sz: 0.8 }

  it('点在中心 → 沿最短边（深度 0.8 更窄，推到 ±z 外面）', () => {
    const r = nudgeFootprintAway(0, 0, [table])
    expect(r.nudged).toBe(true)
    // 推出后应当不再在矩形内部
    expect(isInsideAnyOcc(r.x, r.z, [table])).toBe(false)
    // 到中心的距离 ≥ 最短边/2 + BUFFER(0.1)
    expect(Math.max(Math.abs(r.x), Math.abs(r.z))).toBeGreaterThan(0.8 / 2 + 0.09)
  })

  it('点在靠近负边位置 (0.1, -0.35) → 推到 cz 的负边外', () => {
    const r = nudgeFootprintAway(0.1, -0.35, [table])
    expect(r.nudged).toBe(true)
    expect(isInsideAnyOcc(r.x, r.z, [table])).toBe(false)
    // 主要被推向 z 负方向
    expect(r.z).toBeLessThan(-0.4 - 0.09) // sz/2 + buffer
  })

  it('点在靠近正边位置 (-0.6, 0.05) → 推到 x 的负边外', () => {
    const r = nudgeFootprintAway(-0.6, 0.05, [table])
    expect(r.nudged).toBe(true)
    expect(isInsideAnyOcc(r.x, r.z, [table])).toBe(false)
    expect(r.x).toBeLessThan(-1.322 / 2 - 0.09)
  })

  it('点在靠近 x 正边位置 (0.6, -0.05) → 推到 x 正边外', () => {
    const r = nudgeFootprintAway(0.6, -0.05, [table])
    expect(r.nudged).toBe(true)
    expect(isInsideAnyOcc(r.x, r.z, [table])).toBe(false)
    expect(r.x).toBeGreaterThan(1.322 / 2 + 0.09)
  })

  it('点在靠近 z 正边位置 (0.05, 0.36) → 推到 z 正边外', () => {
    const r = nudgeFootprintAway(0.05, 0.36, [table])
    expect(r.nudged).toBe(true)
    expect(isInsideAnyOcc(r.x, r.z, [table])).toBe(false)
    expect(r.z).toBeGreaterThan(0.8 / 2 + 0.09)
  })
})

describe('F5 · nudgeFootprintAway — 非遮挡情况（不推）', () => {
  const table: FootprintOccSpec = { cx: 0, cz: 0, sx: 1, sz: 0.8 }

  it('点在矩形外很远 → 不变，nudged=false', () => {
    const r = nudgeFootprintAway(5, 3, [table])
    expect(r.nudged).toBe(false)
    expect(r.x).toBe(5)
    expect(r.z).toBe(3)
  })

  it('点刚好在矩形边缘外 0.01 → 不推', () => {
    // 0.5 + 0.01 = 0.51，而 x 半宽 = 0.5
    const r = nudgeFootprintAway(0.51, 0, [table])
    expect(r.nudged).toBe(false)
    expect(r.x).toBe(0.51)
    expect(r.z).toBe(0)
  })

  it('空 occluders 列表 → 不推', () => {
    const r = nudgeFootprintAway(0, 0, [])
    expect(r.nudged).toBe(false)
    expect(r.x).toBe(0)
    expect(r.z).toBe(0)
  })
})

describe('F5 · nudgeFootprintAway — OBB（旋转矩形）推出', () => {
  // bookshelf FACE_NEG_X 相当于 rotationY = -π/2 = -1.5708（面朝负 X）
  // 模型局部 x 轴转 -90° 后，模型「宽」变成了世界 Z 方向
  const bookshelf: FootprintOccSpec = {
    cx: 0,
    cz: 0,
    sx: 0.8, // 原 x 尺寸（局部）
    sz: 0.35, // 原 z 尺寸（局部）
    rotationY: -Math.PI / 2,
  }

  it('点在 OBB 中心（世界 x=0, z=0）→ 推出，最终不在任何矩形内', () => {
    const r = nudgeFootprintAway(0, 0, [bookshelf])
    expect(r.nudged).toBe(true)
    expect(isInsideAnyOcc(r.x, r.z, [bookshelf])).toBe(false)
  })

  it('点在 OBB 内部（在模型「宽」方向 0.3 处 → 世界 z=0.3, x=0.1）→ 推出', () => {
    // 验证点确实在内部：(0.1, 0.3) 反旋转后应当在局部矩形内
    const r = nudgeFootprintAway(0.1, 0.3, [bookshelf])
    expect(r.nudged).toBe(true)
    expect(isInsideAnyOcc(r.x, r.z, [bookshelf])).toBe(false)
  })

  it('点在 OBB 外（x=2, z=0）→ 不推', () => {
    const r = nudgeFootprintAway(2, 0, [bookshelf])
    expect(r.nudged).toBe(false)
  })
})

describe('F5 · nudgeFootprintAway — 多件相邻家具（迭代推出）', () => {
  // 两件家具沿 x 轴并排，间距只有 0.1m（小于 BUFFER=0.1，但不会重叠）
  // 左：cx=-0.55, sx=1, sz=1  → 右边界 x=-0.05
  // 右：cx=0.55,  sx=1, sz=1  → 左边界 x=0.05
  // 两者之间是 x=(-0.05, +0.05)，宽度 0.1m 走廊
  const left: FootprintOccSpec = { cx: -0.55, cz: 0, sx: 1, sz: 1 }
  const right: FootprintOccSpec = { cx: 0.55, cz: 0, sx: 1, sz: 1 }

  it('点在左侧家具内部 → 推到右侧家具之间的走廊里，不进入右侧家具', () => {
    // 候选点在左侧家具中心，距右侧家具很近
    const r = nudgeFootprintAway(-0.55, 0, [left, right])
    expect(r.nudged).toBe(true)
    expect(isInsideAnyOcc(r.x, r.z, [left, right])).toBe(false)
  })
})

describe('F5 · living 真实家具布局 — 默认演示路径脚印避让', () => {
  // living 的四件核心家具 + decor-tv-stand
  const sofa: FootprintOccSpec = {
    cx: -1.5, // world x
    cz: 2.24, // world z
    sx: 2.0,
    sz: 0.85,
    rotationY: -Math.PI, // FACE_NEG_Z
  }
  const tvStand: FootprintOccSpec = {
    cx: -2.0,
    cz: -2.1,
    sx: 2.0,
    sz: 0.45,
    rotationY: 0, // FACE_PLUS_Z
  }
  const bookshelf: FootprintOccSpec = {
    cx: 2.75,
    cz: 1.5,
    sx: 0.8,
    sz: 0.35,
    rotationY: -Math.PI / 2, // FACE_NEG_X
  }
  // 模拟 cnt-coffee-table 可能的位置（在 living 沙发和电视之间）
  const coffeeTable: FootprintOccSpec = {
    cx: -0.5,
    cz: -1.0,
    sx: 1.322,
    sz: 0.8,
  }
  const livingOccs = [sofa, tvStand, bookshelf, coffeeTable]

  it('客厅默认演示路径的 5 个候选脚印（线性插值）全部不会落在任何家具内部', () => {
    // 默认路径：living center x-1.2 → +0.5，center z-1.0 → -1.5
    // living center = (0,0,0)，所以路径 (-1.2,-1.0) → (0.5,-1.5)
    const startX = -1.2
    const startZ = -1.0
    const endX = 0.5
    const endZ = -1.5
    const printCount = 5
    for (let i = 0; i < printCount; i++) {
      const t = (i + 1) / (printCount + 1)
      const x = startX + (endX - startX) * t
      const z = startZ + (endZ - startZ) * t
      const nudged = nudgeFootprintAway(x, z, livingOccs)
      // 无论推出与否，最终必须不在任何家具内
      expect(isInsideAnyOcc(nudged.x, nudged.z, livingOccs)).toBe(false)
    }
  })
})
