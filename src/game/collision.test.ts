import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  isInsideRoomBounds,
  isInsideDoorway,
  resolveRoomCollision,
  checkRoomTransition,
  resolveFurnitureCollision,
  PLAYER_RADIUS,
  DOOR_COOLDOWN_MS,
  DOOR_PADDING,
  type Position2D,
  type DoorwaySpec,
} from './collision'
import { sharedRooms } from '../data/rooms'
import type { RoomId } from '../types/room'

describe('collision - 统一碰撞系统', () => {
  const roomCenter = { x: 0, z: 0 }
  const roomSize = { x: 6, z: 6 }
  const halfX = roomSize.x / 2
  const halfZ = roomSize.z / 2

  describe('isInsideRoomBounds', () => {
    it('房间内合法位置返回 true', () => {
      expect(isInsideRoomBounds({ x: 0, z: 0 }, roomCenter, roomSize, PLAYER_RADIUS)).toBe(true)
      expect(isInsideRoomBounds({ x: 1, z: 1 }, roomCenter, roomSize, PLAYER_RADIUS)).toBe(true)
    })

    it('房间中心附近位置返回 true', () => {
      for (let i = 0; i < 10; i++) {
        const x = (Math.random() - 0.5) * (roomSize.x - PLAYER_RADIUS * 2)
        const z = (Math.random() - 0.5) * (roomSize.z - PLAYER_RADIUS * 2)
        expect(isInsideRoomBounds({ x, z }, roomCenter, roomSize, PLAYER_RADIUS)).toBe(true)
      }
    })

    it('超出东墙返回 false', () => {
      expect(isInsideRoomBounds({ x: halfX + 1, z: 0 }, roomCenter, roomSize, PLAYER_RADIUS)).toBe(false)
    })

    it('超出西墙返回 false', () => {
      expect(isInsideRoomBounds({ x: -halfX - 1, z: 0 }, roomCenter, roomSize, PLAYER_RADIUS)).toBe(false)
    })

    it('超出北墙返回 false', () => {
      expect(isInsideRoomBounds({ x: 0, z: halfZ + 1 }, roomCenter, roomSize, PLAYER_RADIUS)).toBe(false)
    })

    it('超出南墙返回 false', () => {
      expect(isInsideRoomBounds({ x: 0, z: -halfZ - 1 }, roomCenter, roomSize, PLAYER_RADIUS)).toBe(false)
    })

    it('边界处（正好在边界内）返回 true', () => {
      expect(
        isInsideRoomBounds(
          { x: halfX - PLAYER_RADIUS - 0.001, z: 0 },
          roomCenter,
          roomSize,
          PLAYER_RADIUS
        )
      ).toBe(true)
    })

    it('边界处（正好在边界外）返回 false', () => {
      expect(
        isInsideRoomBounds(
          { x: halfX - PLAYER_RADIUS + 0.001, z: 0 },
          roomCenter,
          roomSize,
          PLAYER_RADIUS
        )
      ).toBe(false)
    })
  })

  describe('isInsideDoorway', () => {
    const eastDoor: DoorwaySpec = {
      offsetX: halfX,
      offsetZ: 0,
      width: 1.5,
      connectsTo: 'next',
      targetPosition: { x: -2.25, y: 0, z: 0 },
    }

    it('在东门洞内返回 true', () => {
      expect(
        isInsideDoorway(
          { x: halfX, z: 0 },
          roomCenter,
          roomSize,
          eastDoor,
          PLAYER_RADIUS
        )
      ).toBe(true)
    })

    it('在东门洞外侧附近返回 true', () => {
      expect(
        isInsideDoorway(
          { x: halfX + 0.5, z: 0 },
          roomCenter,
          roomSize,
          eastDoor,
          PLAYER_RADIUS
        )
      ).toBe(true)
    })

    it('远离门洞返回 false', () => {
      expect(
        isInsideDoorway(
          { x: 0, z: 0 },
          roomCenter,
          roomSize,
          eastDoor,
          PLAYER_RADIUS
        )
      ).toBe(false)
    })

    it('门洞宽度外返回 false', () => {
      expect(
        isInsideDoorway(
          { x: halfX, z: 2 },
          roomCenter,
          roomSize,
          eastDoor,
          PLAYER_RADIUS
        )
      ).toBe(false)
    })

    const northDoor: DoorwaySpec = {
      offsetX: 0,
      offsetZ: halfZ,
      width: 1.5,
      connectsTo: 'next',
      targetPosition: { x: 0, y: 0, z: -2.25 },
    }

    it('在北门洞内返回 true', () => {
      expect(
        isInsideDoorway(
          { x: 0, z: halfZ },
          roomCenter,
          roomSize,
          northDoor,
          PLAYER_RADIUS
        )
      ).toBe(true)
    })
  })

  describe('resolveRoomCollision - 沿墙滑动', () => {
    const doorways: DoorwaySpec[] = [
      {
        offsetX: halfX,
        offsetZ: 0,
        width: 1.5,
        connectsTo: 'east',
        targetPosition: { x: -2.25, y: 0, z: 0 },
      },
      {
        offsetX: -halfX,
        offsetZ: 0,
        width: 1.5,
        connectsTo: 'west',
        targetPosition: { x: 2.25, y: 0, z: 0 },
      },
    ]

    it('房间内移动 - 直接通过', () => {
      const current = { x: 0, z: 0 }
      const desired = { x: 1, z: 1 }
      const result = resolveRoomCollision(current, desired, roomCenter, roomSize, PLAYER_RADIUS, doorways)
      expect(result.x).toBe(desired.x)
      expect(result.z).toBe(desired.z)
    })

    it('撞东墙非门洞处 - 被挡住，不能穿墙', () => {
      const current = { x: halfX - PLAYER_RADIUS - 0.1, z: 2 }
      const desired = { x: halfX + 5, z: 2 }
      const result = resolveRoomCollision(current, desired, roomCenter, roomSize, PLAYER_RADIUS, doorways)
      expect(result.x).toBeLessThanOrEqual(halfX - PLAYER_RADIUS + 0.01)
    })

    it('撞西墙非门洞处 - 被挡住', () => {
      const current = { x: -halfX + PLAYER_RADIUS + 0.1, z: 2 }
      const desired = { x: -halfX - 5, z: 2 }
      const result = resolveRoomCollision(current, desired, roomCenter, roomSize, PLAYER_RADIUS, doorways)
      expect(result.x).toBeGreaterThanOrEqual(-halfX + PLAYER_RADIUS - 0.01)
    })

    it('撞北墙 - 被挡住', () => {
      const current = { x: 2, z: halfZ - PLAYER_RADIUS - 0.1 }
      const desired = { x: 2, z: halfZ + 5 }
      const result = resolveRoomCollision(current, desired, roomCenter, roomSize, PLAYER_RADIUS, doorways)
      expect(result.z).toBeLessThanOrEqual(halfZ - PLAYER_RADIUS + 0.01)
    })

    it('撞南墙 - 被挡住', () => {
      const current = { x: 2, z: -halfZ + PLAYER_RADIUS + 0.1 }
      const desired = { x: 2, z: -halfZ - 5 }
      const result = resolveRoomCollision(current, desired, roomCenter, roomSize, PLAYER_RADIUS, doorways)
      expect(result.z).toBeGreaterThanOrEqual(-halfZ + PLAYER_RADIUS - 0.01)
    })

    it('沿东墙非门洞处斜向滑动 - 只移动 z 方向', () => {
      const current = { x: halfX - PLAYER_RADIUS - 0.01, z: 1.5 }
      const desired = { x: halfX + 1, z: 2.5 }
      const result = resolveRoomCollision(current, desired, roomCenter, roomSize, PLAYER_RADIUS, doorways)
      const maxX = halfX - PLAYER_RADIUS
      expect(result.x).toBeLessThanOrEqual(maxX + 0.05)
      expect(result.z).toBeGreaterThan(current.z)
    })

    it('沿西墙非门洞处斜向滑动 - 只移动 z 方向', () => {
      const current = { x: -halfX + PLAYER_RADIUS + 0.01, z: 1.5 }
      const desired = { x: -halfX - 1, z: 2.5 }
      const result = resolveRoomCollision(current, desired, roomCenter, roomSize, PLAYER_RADIUS, doorways)
      const minX = -halfX + PLAYER_RADIUS
      expect(result.x).toBeGreaterThanOrEqual(minX - 0.05)
      expect(result.z).toBeGreaterThan(current.z)
    })

    it('撞墙角 - 两个方向都被挡住', () => {
      const current = { x: halfX - 0.5, z: halfZ - 0.5 }
      const desired = { x: halfX + 5, z: halfZ + 5 }
      const result = resolveRoomCollision(current, desired, roomCenter, roomSize, PLAYER_RADIUS, doorways)
      const maxX = halfX - PLAYER_RADIUS
      const maxZ = halfZ - PLAYER_RADIUS
      expect(result.x).toBeLessThanOrEqual(maxX + 0.01)
      expect(result.z).toBeLessThanOrEqual(maxZ + 0.01)
    })

    it('门洞允许越界 - 东门洞处可以穿过', () => {
      const current = { x: halfX - 0.1, z: 0 }
      const desired = { x: halfX + 1, z: 0 }
      const result = resolveRoomCollision(current, desired, roomCenter, roomSize, PLAYER_RADIUS, doorways)
      expect(result.x).toBe(desired.x)
      expect(result.z).toBe(desired.z)
    })
  })

  describe('checkRoomTransition - 房间切换检测', () => {
    const roomData: Record<string, any> = {
      roomA: {
        center: { x: 0, y: 0, z: 0 },
        size: { x: 6, y: 3, z: 6 },
        doorways: [
          {
            offset: { x: 3, y: 0, z: 0 },
            width: 1.5,
            height: 2.4,
            connectsTo: 'roomB',
            targetPosition: { x: -2.25, y: 0, z: 0 },
          },
        ],
      },
      roomB: {
        center: { x: 6, y: 0, z: 0 },
        size: { x: 6, y: 3, z: 6 },
        doorways: [
          {
            offset: { x: -3, y: 0, z: 0 },
            width: 1.5,
            height: 2.4,
            connectsTo: 'roomA',
            targetPosition: { x: 2.25, y: 0, z: 0 },
          },
        ],
      },
    }

    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))
    })

    it('在房间中心 - 不触发切换', () => {
      const result = checkRoomTransition(
        { x: 0, z: 0 },
        'roomA',
        roomData,
        ['roomA', 'roomB'],
        0
      )
      expect(result).toBeNull()
    })

    it('冷却中 - 不触发切换', () => {
      const result = checkRoomTransition(
        { x: 3.5, z: 0 },
        'roomA',
        roomData,
        ['roomA', 'roomB'],
        Date.now() + 10000
      )
      expect(result).toBeNull()
    })

    it('穿过东门洞 - 触发切换到 roomB', () => {
      const result = checkRoomTransition(
        { x: 3.5, z: 0 },
        'roomA',
        roomData,
        ['roomA', 'roomB'],
        0
      )
      expect(result).not.toBeNull()
      expect(result?.toRoom).toBe('roomB')
      expect(result?.targetPos.x).toBeCloseTo(6 + (-2.25))
      expect(result?.targetPos.z).toBeCloseTo(0)
    })

    it('allowedRooms 过滤 - 不可达房间不触发切换', () => {
      const result = checkRoomTransition(
        { x: 3.5, z: 0 },
        'roomA',
        roomData,
        ['roomA'],
        0
      )
      expect(result).toBeNull()
    })

    it('切换后的目标位置在目标房间内', () => {
      const result = checkRoomTransition(
        { x: 3.5, z: 0 },
        'roomA',
        roomData,
        ['roomA', 'roomB'],
        0
      )
      expect(result).not.toBeNull()
      const targetPos = result!.targetPos
      const targetRoom = roomData['roomB']
      expect(Math.abs(targetPos.x - targetRoom.center.x)).toBeLessThan(targetRoom.size.x / 2)
      expect(Math.abs(targetPos.z - targetRoom.center.z)).toBeLessThan(targetRoom.size.z / 2)
    })
  })

  describe('resolveFurnitureCollision - 家具碰撞', () => {
    const furnitureList = [
      {
        position: { x: 1, y: 0, z: 1 },
        size: { x: 1, y: 1, z: 1 },
      },
    ]

    it('远离家具 - 直接通过', () => {
      const current = { x: 0, z: 0 }
      const desired = { x: -1, z: -1 }
      const result = resolveFurnitureCollision(current, desired, furnitureList, roomCenter, PLAYER_RADIUS)
      expect(result.x).toBe(desired.x)
      expect(result.z).toBe(desired.z)
    })

    it('撞家具 - 被推开', () => {
      const current = { x: 0, z: 1 }
      const desired = { x: 2, z: 1 }
      const result = resolveFurnitureCollision(current, desired, furnitureList, roomCenter, PLAYER_RADIUS)
      const furnitureCenter = { x: 1, z: 1 }
      const dist = Math.sqrt(
        (result.x - furnitureCenter.x) ** 2 + (result.z - furnitureCenter.z) ** 2
      )
      expect(dist).toBeGreaterThanOrEqual(PLAYER_RADIUS + 0.5 - 0.01)
    })

    it('家具碰撞后不穿墙 - 家具靠近墙时', () => {
      const smallRoomSize = { x: 4, z: 4 }
      const smallRoomCenter = { x: 0, z: 0 }
      const wallFurniture = [
        {
          position: { x: 1.8, y: 0, z: 0 },
          size: { x: 0.5, y: 1, z: 1 },
        },
      ]
      const doorways: DoorwaySpec[] = []

      const current = { x: 1, z: 0 }
      const desired = { x: 2.5, z: 0 }

      let result = resolveFurnitureCollision(
        current,
        desired,
        wallFurniture,
        smallRoomCenter,
        PLAYER_RADIUS
      )

      result = resolveRoomCollision(
        current,
        result,
        smallRoomCenter,
        smallRoomSize,
        PLAYER_RADIUS,
        doorways
      )

      const halfX = smallRoomSize.x / 2
      expect(Math.abs(result.x)).toBeLessThanOrEqual(halfX - PLAYER_RADIUS + 0.01)
      expect(Math.abs(result.z)).toBeLessThanOrEqual(halfX - PLAYER_RADIUS + 0.01)
    })

    it('沿家具滑动', () => {
      const current = { x: 0, z: 0.5 }
      const desired = { x: 2, z: 1.5 }
      const result = resolveFurnitureCollision(current, desired, furnitureList, roomCenter, PLAYER_RADIUS)
      const movedAlongZ = result.z > current.z
      expect(movedAlongZ).toBe(true)
    })
  })

  describe('sharedRooms 集成测试', () => {

    it('所有房间门洞通行测试', () => {
      const rooms: RoomId[] = ['living', 'bedroom', 'kitchen', 'entrance', 'dining', 'laundry']
      for (const roomId of rooms) {
        const r = sharedRooms[roomId]
        for (const door of r.doorways) {
          const doorways: DoorwaySpec[] = r.doorways.map((d) => ({
            offsetX: d.offset.x,
            offsetZ: d.offset.z,
            width: d.width,
            connectsTo: d.connectsTo,
            targetPosition: d.targetPosition,
          }))
          const doorWorldPos: Position2D = {
            x: r.center.x + door.offset.x + Math.sign(door.offset.x) * 0.5,
            z: r.center.z + door.offset.z,
          }
          const current: Position2D = {
            x: r.center.x + door.offset.x * 0.8,
            z: r.center.z + door.offset.z,
          }
          const result = resolveRoomCollision(
            current,
            doorWorldPos,
            { x: r.center.x, z: r.center.z },
            { x: r.size.x, z: r.size.z },
            PLAYER_RADIUS,
            doorways
          )
          expect(result.x).toBe(doorWorldPos.x)
          expect(result.z).toBe(doorWorldPos.z)
        }
      }
    })

    it('随机 1000 次移动都不会穿墙（非门洞区域）', () => {
      const rooms: RoomId[] = ['living', 'bedroom', 'kitchen', 'entrance', 'dining', 'laundry']
      let passCount = 0

      for (const roomId of rooms) {
        const r = sharedRooms[roomId]
        const doorways: DoorwaySpec[] = r.doorways.map((d) => ({
          offsetX: d.offset.x,
          offsetZ: d.offset.z,
          width: d.width,
          connectsTo: d.connectsTo,
          targetPosition: d.targetPosition,
        }))
        for (let i = 0; i < 200; i++) {
          const startX = r.center.x + (Math.random() - 0.5) * r.size.x * 0.8
          const startZ = r.center.z + (Math.random() - 0.5) * r.size.z * 0.8
          const current = { x: startX, z: startZ }

          const angle = Math.random() * Math.PI * 2
          const dist = Math.random() * 10
          const desired = {
            x: startX + Math.cos(angle) * dist,
            z: startZ + Math.sin(angle) * dist,
          }

          const result = resolveRoomCollision(
            current,
            desired,
            { x: r.center.x, z: r.center.z },
            { x: r.size.x, z: r.size.z },
            PLAYER_RADIUS,
            doorways
          )

          const localX = result.x - r.center.x
          const localZ = result.z - r.center.z
          const halfX = r.size.x / 2
          const halfZ = r.size.z / 2

          const inDoorway = doorways.some((door) =>
            isInsideDoorway(result, { x: r.center.x, z: r.center.z }, { x: r.size.x, z: r.size.z }, door, PLAYER_RADIUS)
          )

          if (!inDoorway) {
            expect(Math.abs(localX)).toBeLessThanOrEqual(halfX - PLAYER_RADIUS + 0.05)
            expect(Math.abs(localZ)).toBeLessThanOrEqual(halfZ - PLAYER_RADIUS + 0.05)
          }
          expect(Number.isFinite(result.x)).toBe(true)
          expect(Number.isFinite(result.z)).toBe(true)
          passCount++
        }
      }
      expect(passCount).toBe(1200)
    })
  })

  describe('常量导出', () => {
    it('PLAYER_RADIUS 已导出', () => {
      expect(PLAYER_RADIUS).toBe(0.3)
    })

    it('DOOR_COOLDOWN_MS 已导出', () => {
      expect(DOOR_COOLDOWN_MS).toBe(800)
    })

    it('DOOR_PADDING 已导出', () => {
      expect(DOOR_PADDING).toBe(0.1)
    })
  })
})
