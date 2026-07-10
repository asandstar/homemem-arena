import { describe, it, expect } from 'vitest'
import {
  getEntityVisualHeight,
  getEntityModelScale,
  getContainerSurfaceY,
  getObjectGroundY,
  snapEntityPosition,
  getPlacedObjectPosition,
  getEntityPlacementContext,
  snapEntityToWorld,
  getFreeObjectInitialPosition,
  getModelApproxHeight,
  getEntityHalfHeight,
  snapToFloor,
  snapToContainerSurface,
  MODEL_HEIGHTS,
  Z_FIGHT_OFFSET,
  FLOOR_Y,
} from './placement'
import { sharedRooms } from '../data/rooms'
import type { EntityState, ContainerSpec, ObjectSpec } from '../types/object'
import type { TaskConfig } from '../types/task'
import type { RoomId } from '../types/room'

function makeEntity(partial: Partial<EntityState> = {}): EntityState {
  return {
    configId: 'test-obj',
    id: 'test-obj-1',
    type: 'object',
    name: '测试物体',
    category: 'cup',
    currentRoom: 'living',
    position: { x: 0, y: 0, z: 0 },
    size: { x: 0.1, y: 0.12, z: 0.1 },
    color: '#ffffff',
    rotation: 0,
    status: 'free',
    properties: {},
    ...partial,
  }
}

function makeContainer(partial: Partial<ContainerSpec> = {}): ContainerSpec {
  return {
    id: 'test-container',
    name: '测试容器',
    room: 'living',
    position: { x: 1, y: 0.5, z: 1 },
    size: { x: 1.0, y: 1.0, z: 0.5 },
    color: '#8b7355',
    initialOpen: true,
    acceptedCategories: ['cup'],
    ...partial,
  }
}

describe('placement - 压力/边界测试', () => {
  describe('getModelApproxHeight', () => {
    it('已知模型返回正确高度', () => {
      expect(getModelApproxHeight('cup')).toBe(MODEL_HEIGHTS.cup)
      expect(getModelApproxHeight('key')).toBe(MODEL_HEIGHTS.key)
      expect(getModelApproxHeight('sofa')).toBe(MODEL_HEIGHTS.sofa)
    })

    it('未知模型返回默认 0.1', () => {
      expect(getModelApproxHeight('unknown_model')).toBe(0.1)
    })
  })

  describe('getEntityHalfHeight', () => {
    it('返回模型高度的一半', () => {
      const e = makeEntity({ category: 'cup' })
      expect(getEntityHalfHeight(e)).toBe(MODEL_HEIGHTS.cup / 2)
    })

    it('未知类别回退到 cup 模型高度', () => {
      const e = makeEntity({ category: 'unknown' as any })
      expect(getEntityHalfHeight(e)).toBe(MODEL_HEIGHTS.cup / 2)
    })
  })

  describe('getEntityVisualHeight', () => {
    it('返回模型注册表中的高度', () => {
      const e = makeEntity({ category: 'cup' })
      expect(getEntityVisualHeight(e)).toBe(MODEL_HEIGHTS.cup)
    })

    it('未知类别回退到 cup 模型高度', () => {
      const e = makeEntity({ category: 'unknown' as any })
      expect(getEntityVisualHeight(e)).toBe(MODEL_HEIGHTS.cup)
    })
  })

  describe('snapToFloor', () => {
    it('物体底部贴地，包含 z-fighting 偏移', () => {
      const e = makeEntity({ category: 'cup' })
      const result = snapToFloor(e)
      const halfHeight = MODEL_HEIGHTS.cup / 2
      expect(result.y).toBeCloseTo(FLOOR_Y + halfHeight + Z_FIGHT_OFFSET, 10)
    })
  })

  describe('snapToContainerSurface', () => {
    it('物体底部贴容器表面，包含 z-fighting 偏移', () => {
      const e = makeEntity({ category: 'cup' })
      const c = makeContainer({ surfaceHeight: 0.8 })
      const result = snapToContainerSurface(e, c)
      const halfHeight = MODEL_HEIGHTS.cup / 2
      expect(result.y).toBeCloseTo(0.8 + halfHeight + Z_FIGHT_OFFSET, 10)
    })
  })

  describe('getEntityModelScale', () => {
    it('最大维度是 y 时正确计算', () => {
      const e = makeEntity({ size: { x: 0.1, y: 0.5, z: 0.1 } })
      expect(getEntityModelScale(e)).toBeCloseTo(0.5 / 0.5, 5)
    })

    it('最大维度是 x 时正确计算', () => {
      const e = makeEntity({ size: { x: 1.0, y: 0.1, z: 0.1 } })
      expect(getEntityModelScale(e)).toBeCloseTo(1.0 / 0.5, 5)
    })

    it('size 为 undefined 返回 1', () => {
      const e = makeEntity()
      ;(e as any).size = undefined
      expect(getEntityModelScale(e)).toBe(1)
    })

    it('零尺寸 - 返回 0（极端情况）', () => {
      const e = makeEntity({ size: { x: 0, y: 0, z: 0 } })
      expect(getEntityModelScale(e)).toBe(0)
    })
  })

  describe('getContainerSurfaceY', () => {
    it('有 surfaceHeight 时直接返回', () => {
      const c = makeContainer({ surfaceHeight: 1.2 })
      expect(getContainerSurfaceY(c)).toBe(1.2)
    })

    it('没有 surfaceHeight 时用 position.y + size.y/2', () => {
      const c = makeContainer({
        position: { x: 0, y: 0.5, z: 0 },
        size: { x: 1, y: 1, z: 0.5 },
      })
      ;(c as any).surfaceHeight = undefined
      expect(getContainerSurfaceY(c)).toBeCloseTo(0.5 + 0.5, 5)
    })

    it('surfaceHeight 为 0 也返回 0', () => {
      const c = makeContainer({ surfaceHeight: 0 })
      expect(getContainerSurfaceY(c)).toBe(0)
    })

    it('surfaceHeight 可以小于 position.y', () => {
      const c = makeContainer({
        position: { x: 0, y: 0.5, z: 0 },
        surfaceHeight: 0.2,
      })
      expect(getContainerSurfaceY(c)).toBe(0.2)
    })
  })

  describe('getObjectGroundY', () => {
    it('放在地面上 - y = 地面 + 半高 + offset', () => {
      const e = makeEntity({ category: 'cup' })
      const y = getObjectGroundY(e, 'living')
      const halfHeight = MODEL_HEIGHTS.cup / 2
      expect(y).toBeCloseTo(FLOOR_Y + halfHeight + Z_FIGHT_OFFSET, 5)
    })

    it('放在容器表面 - y = surface + 半高 + offset', () => {
      const e = makeEntity({ category: 'cup' })
      const c = makeContainer({ surfaceHeight: 0.8 })
      const y = getObjectGroundY(e, c)
      const halfHeight = MODEL_HEIGHTS.cup / 2
      expect(y).toBeCloseTo(0.8 + halfHeight + Z_FIGHT_OFFSET, 5)
    })

    it('不传容器/房间 - 贴地', () => {
      const e = makeEntity({ category: 'cup' })
      const y = getObjectGroundY(e)
      const halfHeight = MODEL_HEIGHTS.cup / 2
      expect(y).toBeCloseTo(FLOOR_Y + halfHeight + Z_FIGHT_OFFSET, 5)
    })

    it('不同模型高度 - 都大于表面高度', () => {
      const models = ['cup', 'bowl', 'plate', 'remote', 'trash', 'pillow', 'milk_carton', 'cereal_box']
      const surfaceY = 0.8
      for (const model of models) {
        const e = makeEntity({ category: model as any })
        const c = makeContainer({ surfaceHeight: surfaceY })
        const y = getObjectGroundY(e, c)
        expect(y).toBeGreaterThan(surfaceY)
        expect(Number.isFinite(y)).toBe(true)
      }
    })
  })

  describe('snapEntityPosition', () => {
    it('free 状态 - 调整 y', () => {
      const e = makeEntity({
        status: 'free',
        position: { x: 1, y: 999, z: 2 },
        category: 'cup',
      })
      const result = snapEntityPosition(e, 'living')
      const halfHeight = MODEL_HEIGHTS.cup / 2
      expect(result.x).toBe(1)
      expect(result.z).toBe(2)
      expect(result.y).toBeCloseTo(FLOOR_Y + halfHeight + Z_FIGHT_OFFSET, 5)
    })

    it('held 状态 - 保持原位置不变', () => {
      const e = makeEntity({
        status: 'held',
        position: { x: 1, y: 999, z: 2 },
      })
      const result = snapEntityPosition(e, 'living')
      expect(result.y).toBe(999)
    })

    it('hidden 状态 - 保持原位置不变', () => {
      const e = makeEntity({
        status: 'hidden',
        position: { x: 1, y: 999, z: 2 },
      })
      const result = snapEntityPosition(e, 'living')
      expect(result.y).toBe(999)
    })

    it('placed 状态 - 按容器表面调整', () => {
      const e = makeEntity({
        status: 'placed',
        position: { x: 1, y: 999, z: 2 },
        category: 'cup',
      })
      const c = makeContainer({ surfaceHeight: 0.8 })
      const result = snapEntityPosition(e, c)
      const halfHeight = MODEL_HEIGHTS.cup / 2
      expect(result.y).toBeCloseTo(0.8 + halfHeight + Z_FIGHT_OFFSET, 5)
    })
  })

  describe('getPlacedObjectPosition', () => {
    it('位置与容器中心对齐，高度在表面以上', () => {
      const e = makeEntity({ category: 'cup' })
      const c = makeContainer({
        position: { x: 2, y: 0.5, z: 3 },
        surfaceHeight: 0.9,
      })
      const result = getPlacedObjectPosition(e, c)
      expect(result.x).toBe(2)
      expect(result.z).toBe(3)
      expect(result.y).toBeGreaterThan(0.9)
    })

    it('不同模型物体都不穿透表面', () => {
      const models = ['cup', 'bowl', 'plate', 'trash', 'milk_carton', 'cereal_box']
      const c = makeContainer({ surfaceHeight: 0.8 })
      for (const model of models) {
        const e = makeEntity({ category: model as any })
        const result = getPlacedObjectPosition(e, c)
        const halfHeight = getEntityHalfHeight(e)
        const bottomY = result.y - halfHeight
        expect(bottomY).toBeGreaterThanOrEqual(0.8 - 0.001)
      }
    })
  })

  describe('getEntityPlacementContext', () => {
    it('placed 状态且有 placedIn - 返回对应容器', () => {
      const e = makeEntity({ status: 'placed', placedIn: 'cnt-1' })
      const containers = [makeContainer({ id: 'cnt-1' })]
      const task = { containers } as any as TaskConfig
      const ctx = getEntityPlacementContext(e, task)
      expect(ctx).not.toBeUndefined()
      expect((ctx as ContainerSpec).id).toBe('cnt-1')
    })

    it('placed 状态但容器不存在 - 返回当前房间', () => {
      const e = makeEntity({ status: 'placed', placedIn: 'nonexistent' })
      const task = { containers: [] } as any as TaskConfig
      const ctx = getEntityPlacementContext(e, task)
      expect(ctx).toBe('living')
    })

    it('free 状态 - 返回当前房间', () => {
      const e = makeEntity({ status: 'free' })
      const ctx = getEntityPlacementContext(e)
      expect(ctx).toBe('living')
    })

    it('task 为 null - 返回当前房间', () => {
      const e = makeEntity({ status: 'placed', placedIn: 'cnt-1' })
      const ctx = getEntityPlacementContext(e, null)
      expect(ctx).toBe('living')
    })
  })

  describe('snapEntityToWorld', () => {
    it('free 状态 - 贴地', () => {
      const e = makeEntity({
        status: 'free',
        currentRoom: 'living',
        position: { x: 0, y: 100, z: 0 },
        category: 'cup',
      })
      const result = snapEntityToWorld(e)
      const halfHeight = MODEL_HEIGHTS.cup / 2
      expect(result.y).toBeCloseTo(FLOOR_Y + halfHeight + Z_FIGHT_OFFSET, 5)
    })

    it('placed 状态 - 贴容器表面', () => {
      const e = makeEntity({
        status: 'placed',
        placedIn: 'cnt-1',
        currentRoom: 'living',
        position: { x: 0, y: 100, z: 0 },
        category: 'cup',
      })
      const task = {
        containers: [makeContainer({ id: 'cnt-1', surfaceHeight: 1.0 })],
      } as any as TaskConfig
      const result = snapEntityToWorld(e, task)
      const halfHeight = MODEL_HEIGHTS.cup / 2
      expect(result.y).toBeCloseTo(1.0 + halfHeight + Z_FIGHT_OFFSET, 5)
    })

    it('held 状态 - 保持原位', () => {
      const e = makeEntity({
        status: 'held',
        position: { x: 1, y: 2, z: 3 },
      })
      const result = snapEntityToWorld(e)
      expect(result.y).toBe(2)
      expect(result.x).toBe(1)
      expect(result.z).toBe(3)
    })
  })

  describe('getFreeObjectInitialPosition', () => {
    it('没有 surfaceContainerId - 贴地放置', () => {
      const obj: ObjectSpec = {
        id: 'obj-1',
        name: '测试',
        category: 'cup',
        initialRoom: 'living',
        initialPosition: { x: 1, y: 0, z: 2 },
        size: { x: 0.1, y: 0.12, z: 0.1 },
        color: '#fff',
      }
      const task = { containers: [] } as any as TaskConfig
      const result = getFreeObjectInitialPosition(obj, task)
      const halfHeight = MODEL_HEIGHTS.cup / 2
      expect(result.x).toBe(sharedRooms.living.center.x + 1)
      expect(result.z).toBe(sharedRooms.living.center.z + 2)
      expect(result.y).toBeCloseTo(FLOOR_Y + halfHeight + Z_FIGHT_OFFSET, 5)
    })

    it('有 surfaceContainerId - 放在容器表面', () => {
      const obj: ObjectSpec = {
        id: 'obj-1',
        name: '测试',
        category: 'cup',
        initialRoom: 'living',
        initialPosition: { x: 0, y: 0, z: 0 },
        size: { x: 0.1, y: 0.12, z: 0.1 },
        color: '#fff',
        surfaceContainerId: 'cnt-1',
      }
      const task = {
        containers: [
          makeContainer({ id: 'cnt-1', surfaceHeight: 0.9 }),
        ],
      } as any as TaskConfig
      const result = getFreeObjectInitialPosition(obj, task)
      const halfHeight = MODEL_HEIGHTS.cup / 2
      expect(result.y).toBeCloseTo(0.9 + halfHeight + Z_FIGHT_OFFSET, 5)
    })

    it('surfaceContainerId 不存在 - 回退到贴地', () => {
      const obj: ObjectSpec = {
        id: 'obj-1',
        name: '测试',
        category: 'cup',
        initialRoom: 'living',
        initialPosition: { x: 0, y: 0, z: 0 },
        size: { x: 0.1, y: 0.12, z: 0.1 },
        color: '#fff',
        surfaceContainerId: 'nonexistent',
      }
      const task = { containers: [] } as any as TaskConfig
      const result = getFreeObjectInitialPosition(obj, task)
      const halfHeight = MODEL_HEIGHTS.cup / 2
      expect(result.y).toBeCloseTo(FLOOR_Y + halfHeight + Z_FIGHT_OFFSET, 5)
    })

    it('不同房间 - 初始位置基于房间中心', () => {
      const rooms: RoomId[] = ['living', 'bedroom', 'kitchen', 'entrance', 'dining', 'laundry']
      for (const room of rooms) {
        const obj: ObjectSpec = {
          id: 'obj-1',
          name: '测试',
          category: 'cup',
          initialRoom: room,
          initialPosition: { x: 0.5, y: 0, z: -0.3 },
          size: { x: 0.1, y: 0.1, z: 0.1 },
          color: '#fff',
        }
        const task = { containers: [] } as any as TaskConfig
        const result = getFreeObjectInitialPosition(obj, task)
        expect(result.x).toBe((sharedRooms as Record<string, any>)[room].center.x + 0.5)
        expect(result.z).toBe((sharedRooms as Record<string, any>)[room].center.z + (-0.3))
      }
    })
  })

  describe('压力测试 - 大量物体放置', () => {
    it('1000 个物体同时 snapEntityToWorld 都返回有效坐标', () => {
      const containers: ContainerSpec[] = []
      for (let i = 0; i < 10; i++) {
        containers.push(makeContainer({
          id: `cnt-${i}`,
          surfaceHeight: 0.5 + i * 0.1,
        }))
      }
      const task = { containers } as any as TaskConfig

      for (let i = 0; i < 1000; i++) {
        const statuses: EntityState['status'][] = ['free', 'held', 'placed', 'hidden']
        const status = statuses[i % 4]
        const e = makeEntity({
          status,
          placedIn: status === 'placed' ? `cnt-${i % 10}` : undefined,
          currentRoom: 'living',
          position: {
            x: Math.random() * 10 - 5,
            y: Math.random() * 100,
            z: Math.random() * 10 - 5,
          },
          size: {
            x: 0.05 + Math.random() * 0.5,
            y: 0.05 + Math.random() * 0.5,
            z: 0.05 + Math.random() * 0.5,
          },
        })
        const result = snapEntityToWorld(e, task)
        expect(Number.isFinite(result.x)).toBe(true)
        expect(Number.isFinite(result.y)).toBe(true)
        expect(Number.isFinite(result.z)).toBe(true)
      }
    })
  })
})
