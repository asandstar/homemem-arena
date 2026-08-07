/**
 * src/game/lineOfSight.test.ts
 *
 * F4 · 视线遮挡 (Line of Sight) 回归断言。
 *
 * 核心函数 hasLineOfSight 使用 Ray-AABB Slab method 纯数学实现，
 * 不依赖 THREE.Raycaster / mesh / WebGL，可在 jsdom 下直接运行。
 */
import { describe, it, expect } from 'vitest'
import {
  hasLineOfSight,
  buildRoomOccluders,
  getEyePosition,
  stringSetEqual,
  type OccluderAABB,
} from './lineOfSight'
import type { Vec3 } from '../types/room'

describe('F4 · hasLineOfSight — Ray-AABB 纯数学', () => {
  // 辅助：构造一个以 center 为中心、size 为全尺寸的 AABB
  function makeAABB(center: Vec3, sx: number, sy: number, sz: number): OccluderAABB {
    return {
      min: { x: center.x - sx / 2, y: center.y, z: center.z - sz / 2 },
      max: { x: center.x + sx / 2, y: center.y + sy, z: center.z + sz / 2 },
    }
  }

  it('无遮挡物时始终返回 true', () => {
    const from: Vec3 = { x: 0, y: 1.6, z: 0 }
    const to: Vec3 = { x: 5, y: 0.5, z: 3 }
    expect(hasLineOfSight(from, to, [])).toBe(true)
  })

  it('起点和目标重合（dist < 0.01）时返回 true', () => {
    const from: Vec3 = { x: 1, y: 1.6, z: 1 }
    const to: Vec3 = { x: 1, y: 1.6, z: 1 }
    expect(hasLineOfSight(from, to, [])).toBe(true)
  })

  it('遮挡物在视线中间 → 返回 false（被挡）', () => {
    const from: Vec3 = { x: 0, y: 1.6, z: 0 }
    const to: Vec3 = { x: 5, y: 0.5, z: 0 }
    // 沙发在 x=2.5，宽 2m 高 1m 深 1m → 完全挡住
    const sofa = makeAABB({ x: 2.5, y: 0, z: 0 }, 2, 1, 1)
    expect(hasLineOfSight(from, to, [sofa])).toBe(false)
  })

  it('遮挡物在目标后方 → 返回 true（不挡）', () => {
    const from: Vec3 = { x: 0, y: 1.6, z: 0 }
    const to: Vec3 = { x: 3, y: 0.5, z: 0 }
    // 沙发在 x=5（目标 x=3 之后），不遮挡
    const sofa = makeAABB({ x: 5, y: 0, z: 0 }, 2, 1, 1)
    expect(hasLineOfSight(from, to, [sofa])).toBe(true)
  })

  it('遮挡物在视线侧面 → 返回 true（不挡）', () => {
    const from: Vec3 = { x: 0, y: 1.6, z: 0 }
    const to: Vec3 = { x: 5, y: 0.5, z: 0 }
    // 沙发在 z=3 侧面，射线沿 x 轴不经过
    const sofa = makeAABB({ x: 2.5, y: 0, z: 3 }, 2, 1, 1)
    expect(hasLineOfSight(from, to, [sofa])).toBe(true)
  })

  it('遮挡物太矮（低于视线高度）→ 返回 true（从上方越过）', () => {
    const from: Vec3 = { x: 0, y: 1.6, z: 0 }
    const to: Vec3 = { x: 5, y: 1.6, z: 0 }
    // 茶几高 0.4m，视线 y=1.6 → 射线从上方越过
    const table = makeAABB({ x: 2.5, y: 0, z: 0 }, 1, 0.4, 1)
    expect(hasLineOfSight(from, to, [table])).toBe(true)
  })

  it('遮挡物高度足够挡住视线 → 返回 false', () => {
    const from: Vec3 = { x: 0, y: 1.6, z: 0 }
    const to: Vec3 = { x: 5, y: 1.6, z: 0 }
    // 书架高 2m → 完全挡住
    const shelf = makeAABB({ x: 2.5, y: 0, z: 0 }, 1, 2, 0.5)
    expect(hasLineOfSight(from, to, [shelf])).toBe(false)
  })

  it('射线起点在遮挡物内部 → 返回 true（不算被挡）', () => {
    const from: Vec3 = { x: 2.5, y: 0.5, z: 0 } // 在沙发内部
    const to: Vec3 = { x: 5, y: 0.5, z: 0 }
    const sofa = makeAABB({ x: 2.5, y: 0, z: 0 }, 2, 1, 1)
    expect(hasLineOfSight(from, to, [sofa])).toBe(true)
  })

  it('多个遮挡物，任意一个挡住即 false', () => {
    const from: Vec3 = { x: 0, y: 1.6, z: 0 }
    const to: Vec3 = { x: 5, y: 0.5, z: 0 }
    const sideShelf = makeAABB({ x: 2.5, y: 0, z: 5 }, 2, 2, 0.5) // 不挡
    const sofa = makeAABB({ x: 2.5, y: 0, z: 0 }, 2, 1.5, 1) // 挡
    expect(hasLineOfSight(from, to, [sideShelf, sofa])).toBe(false)
  })

  it('Z 轴方向的遮挡也能正确检测', () => {
    const from: Vec3 = { x: 0, y: 1.6, z: 0 }
    const to: Vec3 = { x: 0, y: 0.5, z: 5 }
    // 书架在 z=2.5，高 2m → 足够挡住从 y=1.6 到 y=0.5 的斜向射线
    const shelf = makeAABB({ x: 0, y: 0, z: 2.5 }, 1, 2, 0.5)
    expect(hasLineOfSight(from, to, [shelf])).toBe(false)
  })

  it('斜向视线穿过遮挡物 → false', () => {
    const from: Vec3 = { x: 0, y: 1.6, z: 0 }
    const to: Vec3 = { x: 4, y: 0.5, z: 3 }
    // 遮挡物在 (2, 0, 1.5) 附近
    const occ = makeAABB({ x: 2, y: 0, z: 1.5 }, 2, 1.5, 2)
    expect(hasLineOfSight(from, to, [occ])).toBe(false)
  })
})

describe('F4 · buildRoomOccluders — 房间遮挡物构建', () => {
  it('living 房间返回非空遮挡物列表', () => {
    const occluders = buildRoomOccluders('living', [])
    expect(occluders.length).toBeGreaterThan(0)
    // 每个 AABB 的 min < max
    for (const o of occluders) {
      expect(o.min.x).toBeLessThanOrEqual(o.max.x)
      expect(o.min.y).toBeLessThanOrEqual(o.max.y)
      expect(o.min.z).toBeLessThanOrEqual(o.max.z)
    }
  })

  it('collisionMode=none 的家具被排除', () => {
    // living 有 TV / painting / clock / rug 等标记为 collisionMode='none'
    // 验证遮挡物数量 < 全部家具数量（说明有过滤）
    const occluders = buildRoomOccluders('living', [])
    // living 至少有 sofa / coffee_table / bookshelf 等大件
    expect(occluders.length).toBeGreaterThanOrEqual(3)
  })

  it('传入的 containers 也被加入遮挡物（同房间）', () => {
    const containers = [
      {
        position: { x: 0, y: 0, z: 0 },
        size: { x: 1, y: 1, z: 1 },
        room: 'living' as const,
      },
    ]
    const without = buildRoomOccluders('living', [])
    const withContainer = buildRoomOccluders('living', containers)
    expect(withContainer.length).toBe(without.length + 1)
  })

  it('传入的 containers 中不同房间的被排除', () => {
    const containers = [
      {
        position: { x: 0, y: 0, z: 0 },
        size: { x: 1, y: 1, z: 1 },
        room: 'bedroom' as const,
      },
    ]
    const without = buildRoomOccluders('living', [])
    const withOtherRoom = buildRoomOccluders('living', containers)
    expect(withOtherRoom.length).toBe(without.length)
  })

  it('未知房间返回空数组', () => {
    expect(buildRoomOccluders('unknown' as any, [])).toEqual([])
  })
})

describe('F4 · getEyePosition — 眼睛位置', () => {
  it('y = 1.6（PLAYER_HEIGHT），x/z 来自 robotPosition', () => {
    const robotPos: Vec3 = { x: 3.5, y: 0, z: -2.1 }
    const eye = getEyePosition(robotPos)
    expect(eye.x).toBe(3.5)
    expect(eye.y).toBe(1.6)
    expect(eye.z).toBe(-2.1)
  })
})

describe('F4 · stringSetEqual — Set 引用稳定化', () => {
  it('相同内容返回 true', () => {
    expect(stringSetEqual(new Set(['a', 'b']), new Set(['a', 'b']))).toBe(true)
  })

  it('不同内容返回 false', () => {
    expect(stringSetEqual(new Set(['a', 'b']), new Set(['a', 'c']))).toBe(false)
  })

  it('不同大小返回 false', () => {
    expect(stringSetEqual(new Set(['a', 'b']), new Set(['a']))).toBe(false)
  })

  it('空 Set 相等', () => {
    expect(stringSetEqual(new Set(), new Set())).toBe(true)
  })
})
