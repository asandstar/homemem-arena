import { describe, it, expect } from 'vitest'
import { doorwayBoxes, boxesOverlap2D, localAabbMinMax } from '../../scripts/qa-layout'
import { roomsOverlap } from '../../scripts/qa-rooms'
import { sharedRooms } from '../data/rooms'
import { roomDecorFurniture } from '../data/decorFurniture'
import { cleanTableTask } from '../data/tasks/clean-table'
import { laundrySortTask } from '../data/tasks/laundry-sort'
import { getModelAsset } from '../data/assets/modelRegistry'
import { PLAYER_RADIUS } from '../game/playerControls'
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

describe('spawn-furniture-clearance — 出生点不能与装饰家具 AABB 重叠', () => {
  it('L1 task-clean-table 出生点不卡在 dining 任何装饰家具内 (含 PLAYER_RADIUS 余量)', () => {
    const task = cleanTableTask
    const roomId = task.rooms[0]
    const spawn = task.spawnPosition
    expect(spawn, 'L1 必须显式配置 spawnPosition').toBeDefined()
    // 玩家碰撞圆近似为 2*PLAYER_RADIUS 见方的 AABB（外接）
    const playerBox = localAabbMinMax(
      { x: spawn!.x, z: spawn!.z },
      { x: PLAYER_RADIUS * 2, z: PLAYER_RADIUS * 2 },
    )
    const decor = roomDecorFurniture[roomId] ?? []
    const collidable = decor.filter((d) => (d.collisionMode ?? 'self') !== 'none')
    const overlaps = collidable
      .filter((d) =>
        boxesOverlap2D(
          playerBox,
          localAabbMinMax({ x: d.position.x, z: d.position.z }, { x: d.size.x, z: d.size.z }),
          0,
        ),
      )
      .map((d) => d.id)
    expect(overlaps, `出生点 ${JSON.stringify(spawn)} 与家具重叠：${overlaps.join(', ')}`).toEqual([])
  })

  it('L1 旧出生点 (-2.2,-2.1) 会被该检查捕获（回归保护）', () => {
    // 原 L1 spawn 落在 decor-kit-fridge AABB 内（x∈[-2.747,-1.973], z∈[-2.595,-2.025]）
    const playerBox = localAabbMinMax(
      { x: -2.2, z: -2.1 },
      { x: PLAYER_RADIUS * 2, z: PLAYER_RADIUS * 2 },
    )
    const decor = roomDecorFurniture['dining'] ?? []
    const collidable = decor.filter((d) => (d.collisionMode ?? 'self') !== 'none')
    const overlaps = collidable.filter((d) =>
      boxesOverlap2D(
        playerBox,
        localAabbMinMax({ x: d.position.x, z: d.position.z }, { x: d.size.x, z: d.size.z }),
        0,
      ),
    )
    expect(overlaps.map((d) => d.id)).toContain('decor-kit-fridge')
  })
})

describe('dining worktop decor — 台面装饰应合理摆放', () => {
  it('水槽上没有与任务物件混淆的装饰书', () => {
    const diningDecor = roomDecorFurniture.dining
    expect(diningDecor.find((item) => item.id === 'decor-kit-books')).toBeUndefined()
  })

  it('微波炉完整落在第二个橱柜台面的 XZ 范围内', () => {
    const diningDecor = roomDecorFurniture.dining
    const cabinet = diningDecor.find((item) => item.id === 'decor-kit-cabinet-2')!
    const microwave = diningDecor.find((item) => item.id === 'decor-kit-microwave')!
    const cabinetBox = localAabbMinMax(cabinet.position, cabinet.size)
    const microwaveBox = localAabbMinMax(microwave.position, microwave.size)

    expect(microwaveBox.x1).toBeGreaterThanOrEqual(cabinetBox.x1)
    expect(microwaveBox.x2).toBeLessThanOrEqual(cabinetBox.x2)
    expect(microwaveBox.z1).toBeGreaterThanOrEqual(cabinetBox.z1)
    expect(microwaveBox.z2).toBeLessThanOrEqual(cabinetBox.z2)
    expect(microwave.position.y).toBeCloseTo(cabinet.size.y, 3)
  })

  it('L1 水槽和橱柜只提供交互，且交互区完整落在静态模型内', () => {
    for (const [containerId, decorId] of [
      ['cnt-sink', 'decor-kit-sink'],
      ['cnt-cabinet', 'decor-kit-cabinet-1'],
    ] as const) {
      const container = cleanTableTask.containers.find((item) => item.id === containerId)!
      const decor = roomDecorFurniture.dining.find((item) => item.id === decorId)!
      expect(container.visualOwner).toBe('room')
      expect(container.collisionMode).toBe('static-furniture')
      const containerBox = localAabbMinMax(container.position, container.size)
      const decorBox = localAabbMinMax(decor.position, decor.size)
      expect(containerBox.x1).toBeGreaterThanOrEqual(decorBox.x1)
      expect(containerBox.x2).toBeLessThanOrEqual(decorBox.x2)
      expect(containerBox.z1).toBeGreaterThanOrEqual(decorBox.z1)
      expect(containerBox.z2).toBeLessThanOrEqual(decorBox.z2)
      expect(container.surfaceHeight).toBeCloseTo(decor.size.y, 3)
    }
  })

  it('L3 水槽复用静态模型，不再叠加第二个水槽', () => {
    const sink = laundrySortTask.containers.find((item) => item.id === 'cnt-breakfast-sink')!
    const decor = roomDecorFurniture.dining.find((item) => item.id === 'decor-kit-sink')!
    expect(sink.visualOwner).toBe('room')
    expect(sink.collisionMode).toBe('static-furniture')
    expect(sink.position.x).toBe(decor.position.x)
    expect(sink.surfaceHeight).toBeCloseTo(decor.size.y, 3)
  })

  it('L3 下柜位于冰箱与工作台之间，上柜尺寸不会压住整排厨房', () => {
    const lower = laundrySortTask.containers.find((item) => item.id === 'cnt-cabinet-lower')!
    const upper = laundrySortTask.containers.find((item) => item.id === 'cnt-cabinet-upper')!
    const fridge = roomDecorFurniture.dining.find((item) => item.id === 'decor-kit-fridge')!
    const cabinet = roomDecorFurniture.dining.find((item) => item.id === 'decor-kit-cabinet-1')!
    const lowerBox = localAabbMinMax(lower.position, lower.size)
    expect(boxesOverlap2D(lowerBox, localAabbMinMax(fridge.position, fridge.size), 0)).toBe(false)
    expect(boxesOverlap2D(lowerBox, localAabbMinMax(cabinet.position, cabinet.size), 0)).toBe(false)
    expect(upper.size.x).toBeLessThanOrEqual(0.55)
    expect(upper.size.y).toBeLessThanOrEqual(0.72)
  })

  it('Food Kit 任务物件使用真实可见尺寸，餐具保持平放厚度', () => {
    const mug = getModelAsset('food/mug').effectiveAabb
    const plate = getModelAsset('food/plate').effectiveAabb
    const fork = getModelAsset('food/utensil-fork').effectiveAabb
    const spoon = getModelAsset('food/utensil-spoon').effectiveAabb
    expect(mug.y).toBeGreaterThanOrEqual(0.1)
    expect(plate.x).toBeGreaterThanOrEqual(0.18)
    expect(fork.x).toBeGreaterThanOrEqual(0.18)
    expect(fork.y).toBeLessThan(0.02)
    expect(spoon.x).toBeGreaterThanOrEqual(0.18)
    expect(spoon.y).toBeLessThan(0.02)
  })
})
