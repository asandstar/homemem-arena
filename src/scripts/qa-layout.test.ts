import { describe, it, expect } from 'vitest'
import { doorwayBoxes, boxesOverlap2D, localAabbMinMax } from '../../scripts/qa-layout'
import { roomsOverlap } from '../../scripts/qa-rooms'
import { sharedRooms } from '../data/rooms'
import type { RoomSpec } from '../types/room'

describe('doorwayBoxes — A1.5 门洞方向正确性', () => {
  describe('X 墙门洞（东/西墙，宽度沿 Z 轴展开）', () => {
    it('living 西墙门洞（→bedroom）：x 展开为 clearance，z 展开为 width', () => {
      // living doorway[0]: offset=(-3.25, 0, 0), width=1.4 → 西墙
      const boxes = doorwayBoxes('living')
      const box = boxes[0]
      const clearance = 0.3
      const width = 1.4

      // X 方向：clearance 厚度
      expect(box.x2 - box.x1).toBeCloseTo(clearance * 2, 5)
      // Z 方向：width 展开
      expect(box.z2 - box.z1).toBeCloseTo(width, 5)
    })

    it('living 东墙门洞（→entrance）：x 展开为 clearance，z 展开为 width', () => {
      // living doorway[1]: offset=(3.25, 0, -2.0), width=1.4 → 东墙（偏南）
      const boxes = doorwayBoxes('living')
      const box = boxes[1]
      const clearance = 0.3
      const width = 1.4

      expect(box.x2 - box.x1).toBeCloseTo(clearance * 2, 5)
      expect(box.z2 - box.z1).toBeCloseTo(width, 5)
    })
  })

  describe('Z 墙门洞（北/南墙，宽度沿 X 轴展开）', () => {
    it('living 南墙门洞（→dining）：x 展开为 width，z 展开为 clearance', () => {
      // living doorway[2]: offset=(0, 0, -2.75), width=1.4 → 南墙
      const boxes = doorwayBoxes('living')
      const box = boxes[2]
      const clearance = 0.3
      const width = 1.4

      // X 方向：width 展开（旧 bug 这里错误地用 clearance）
      expect(box.x2 - box.x1).toBeCloseTo(width, 5)
      // Z 方向：clearance 厚度（旧 bug 这里错误地用 width）
      expect(box.z2 - box.z1).toBeCloseTo(clearance * 2, 5)
    })

    it('dining 北墙门洞（→living）：x 展开为 width，z 展开为 clearance', () => {
      // dining doorway[0]: offset=(0, 0, 2.6), width=1.4 → 北墙
      const boxes = doorwayBoxes('dining')
      const box = boxes[0]
      const clearance = 0.3
      const width = 1.4

      expect(box.x2 - box.x1).toBeCloseTo(width, 5)
      expect(box.z2 - box.z1).toBeCloseTo(clearance * 2, 5)
    })

    it('dining 东墙门洞（→laundry）：x 展开为 clearance，z 展开为 width', () => {
      // dining doorway[1]: offset=(2.75, 0, -0.25), width=1.4 → 东墙
      const boxes = doorwayBoxes('dining')
      const box = boxes[1]
      const clearance = 0.3
      const width = 1.4

      expect(box.x2 - box.x1).toBeCloseTo(clearance * 2, 5)
      expect(box.z2 - box.z1).toBeCloseTo(width, 5)
    })
  })

  describe('门洞方向与容器堵门检测', () => {
    it('Z 墙门洞下，容器压在门宽范围内会被检测到', () => {
      // living 南墙门洞（→dining）offset=(0,0,-2.75), width=1.4
      // 容器放在 (0, 0, -2.75)（门洞正中心），size=(0.6, _, 0.6)
      const boxes = doorwayBoxes('living')
      const southDoorBox = boxes[2]
      const cntBox = localAabbMinMax({ x: 0, z: -2.75 }, { x: 0.6, z: 0.6 })
      expect(boxesOverlap2D(cntBox, southDoorBox, 0)).toBe(true)
    })

    it('Z 墙门洞下，容器偏离门宽范围不会被误报', () => {
      // living 南墙门洞 offset.x=0, width=1.4 → x 范围 [-0.7, 0.7]
      // 容器放在 (2.0, 0, -2.75)（门洞 z 位置但 x 远离门宽），size=(0.6, _, 0.6)
      const boxes = doorwayBoxes('living')
      const southDoorBox = boxes[2]
      const cntBox = localAabbMinMax({ x: 2.0, z: -2.75 }, { x: 0.6, z: 0.6 })
      expect(boxesOverlap2D(cntBox, southDoorBox, 0)).toBe(false)
    })
  })
})

describe('roomsOverlap — A1.5 共享墙容差', () => {
  function makeRoom(center: { x: number; z: number }, size: { x: number; z: number }): RoomSpec {
    return {
      id: 'living',
      name: 'test',
      center: { x: center.x, y: 0, z: center.z },
      size: { x: size.x, y: 3, z: size.z },
      ambientColor: '#fff',
      floorColor: '#fff',
      wallColor: '#fff',
      doorways: [],
    }
  }

  it('共享墙（交叠厚度=0）不算重叠', () => {
    // room A: x=[-3, 3], z=[-2, 2]
    // room B: x=[-3, 3], z=[2, 6] → z=2 共享边
    const a = makeRoom({ x: 0, z: 0 }, { x: 6, z: 4 })
    const b = makeRoom({ x: 0, z: 4 }, { x: 6, z: 4 })
    expect(roomsOverlap(a, b)).toBe(false)
  })

  it('真实重叠（交叠厚度 > 0.01m）算重叠', () => {
    // room A: x=[-3, 3], z=[-2, 2]
    // room B: x=[-3, 3], z=[1.5, 5.5] → z=[1.5, 2] 重叠 0.5m
    const a = makeRoom({ x: 0, z: 0 }, { x: 6, z: 4 })
    const b = makeRoom({ x: 0, z: 3.5 }, { x: 6, z: 4 })
    expect(roomsOverlap(a, b)).toBe(true)
  })

  it('浮点误差级交叠（< 0.01m）不算重叠', () => {
    // room A: z=[-2, 2], room B: z=[1.9999, 5.9999] → 交叠 0.0001m
    const a = makeRoom({ x: 0, z: 0 }, { x: 6, z: 4 })
    const b = makeRoom({ x: 0, z: 3.9999 }, { x: 6, z: 4 })
    expect(roomsOverlap(a, b)).toBe(false)
  })

  it('A1.5 实际布局：living 与 dining 共享墙不算重叠', () => {
    // living: z=[-2.75, 2.75], dining: z=[-7.95, -2.75] → z=-2.75 共享边
    expect(roomsOverlap(sharedRooms.living, sharedRooms.dining)).toBe(false)
  })

  it('A1.5 实际布局：entrance 与 laundry 共享墙不算重叠', () => {
    // entrance: z=[-3.875, 0.625], laundry: z=[-8.375, -3.875] → z=-3.875 共享边
    expect(roomsOverlap(sharedRooms.entrance, sharedRooms.laundry)).toBe(false)
  })
})
