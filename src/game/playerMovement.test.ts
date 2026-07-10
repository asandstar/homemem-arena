import { describe, it, expect } from 'vitest'
import {
  computeMoveVector,
  resolveRoomCollision,
  checkDoorwayTransition,
  PLAYER_RADIUS,
} from './playerMovement'
import { sharedRooms } from '../data/rooms'
import type { RoomId, Vec3 } from '../types/room'

describe('playerMovement - 压力/边界测试', () => {
  const centerPos = (room: RoomId): Vec3 => ({
    x: sharedRooms[room].center.x,
    y: 1.6,
    z: sharedRooms[room].center.z,
  })

  describe('computeMoveVector', () => {
    it('零输入返回零向量', () => {
      const result = computeMoveVector(
        { forward: false, backward: false, left: false, right: false },
        0,
        3.0,
        0.016
      )
      expect(result.dx).toBe(0)
      expect(result.dz).toBe(0)
    })

    it('全方向输入向量长度等于 speed*delta', () => {
      const speed = 3.0
      const delta = 0.016
      const result = computeMoveVector(
        { forward: true, backward: false, left: true, right: false },
        0,
        speed,
        delta
      )
      const length = Math.sqrt(result.dx * result.dx + result.dz * result.dz)
      expect(length).toBeCloseTo(speed * delta, 5)
    })

    it('同时按前进和后退 - 输入相互抵消', () => {
      const result = computeMoveVector(
        { forward: true, backward: true, left: false, right: false },
        0,
        3.0,
        0.016
      )
      expect(result.dx).toBe(0)
      expect(result.dz).toBe(0)
    })

    it('同时按左右 - 输入相互抵消', () => {
      const result = computeMoveVector(
        { forward: false, backward: false, left: true, right: true },
        0,
        3.0,
        0.016
      )
      expect(result.dx).toBe(0)
      expect(result.dz).toBe(0)
    })

    it('旋转 360 度后方向一致', () => {
      const input = { forward: true, backward: false, left: false, right: false }
      const r1 = computeMoveVector(input, 0, 3.0, 0.016)
      const r2 = computeMoveVector(input, Math.PI * 2, 3.0, 0.016)
      expect(r1.dx).toBeCloseTo(r2.dx, 5)
      expect(r1.dz).toBeCloseTo(r2.dz, 5)
    })

    it('旋转 180 度后方向相反', () => {
      const input = { forward: true, backward: false, left: false, right: false }
      const r1 = computeMoveVector(input, 0, 3.0, 0.016)
      const r2 = computeMoveVector(input, Math.PI, 3.0, 0.016)
      expect(r1.dx).toBeCloseTo(-r2.dx, 5)
      expect(r1.dz).toBeCloseTo(-r2.dz, 5)
    })

    it('极端大的 delta 值不会导致 NaN', () => {
      const result = computeMoveVector(
        { forward: true, backward: false, left: false, right: false },
        0.5,
        3.0,
        1000
      )
      expect(Number.isNaN(result.dx)).toBe(false)
      expect(Number.isNaN(result.dz)).toBe(false)
      expect(Number.isFinite(result.dx)).toBe(true)
      expect(Number.isFinite(result.dz)).toBe(true)
    })

    it('零 speed 和零 delta 返回零', () => {
      const result = computeMoveVector(
        { forward: true, backward: false, left: false, right: false },
        0,
        0,
        0
      )
      expect(result.dx).toBeCloseTo(0, 10)
      expect(result.dz).toBeCloseTo(0, 10)
    })

    it('1000 次随机旋转输入都产生有效向量', () => {
      for (let i = 0; i < 1000; i++) {
        const rotation = Math.random() * Math.PI * 2
        const input = {
          forward: Math.random() > 0.5,
          backward: Math.random() > 0.5,
          left: Math.random() > 0.5,
          right: Math.random() > 0.5,
        }
        const result = computeMoveVector(input, rotation, 3.0, 0.016)
        expect(Number.isFinite(result.dx)).toBe(true)
        expect(Number.isFinite(result.dz)).toBe(true)
        const len = Math.sqrt(result.dx * result.dx + result.dz * result.dz)
        expect(len).toBeLessThanOrEqual(3.0 * 0.016 + 0.0001)
      }
    })
  })

  describe('resolveRoomCollision - 边界压力测试', () => {
    it('房间中心 - 直接通过', () => {
      const room: RoomId = 'living'
      const pos = centerPos(room)
      const desired = { ...pos, x: pos.x + 0.5, z: pos.z + 0.5 }
      const result = resolveRoomCollision(pos, desired, room)
      expect(result.x).toBe(desired.x)
      expect(result.z).toBe(desired.z)
    })

    it('从内部撞东墙 - 被挡住，不能穿墙', () => {
      const room: RoomId = 'living'
      const r = sharedRooms[room]
      const pos = { x: r.center.x + r.size.x / 2 - 0.5, y: 1.6, z: r.center.z }
      const desired = { x: r.center.x + r.size.x / 2 + 5, y: 1.6, z: r.center.z }
      const result = resolveRoomCollision(pos, desired, room)
      expect(result.x).toBeLessThan(r.center.x + r.size.x / 2 - PLAYER_RADIUS + 0.01)
    })

    it('从内部撞西墙 - 被挡住', () => {
      const room: RoomId = 'living'
      const r = sharedRooms[room]
      const pos = { x: r.center.x - r.size.x / 2 + 0.5, y: 1.6, z: r.center.z }
      const desired = { x: r.center.x - r.size.x / 2 - 5, y: 1.6, z: r.center.z }
      const result = resolveRoomCollision(pos, desired, room)
      expect(result.x).toBeGreaterThan(r.center.x - r.size.x / 2 + PLAYER_RADIUS - 0.01)
    })

    it('从内部撞北墙 - 被挡住', () => {
      const room: RoomId = 'living'
      const r = sharedRooms[room]
      const pos = { x: r.center.x, y: 1.6, z: r.center.z + r.size.z / 2 - 0.5 }
      const desired = { x: r.center.x, y: 1.6, z: r.center.z + r.size.z / 2 + 5 }
      const result = resolveRoomCollision(pos, desired, room)
      expect(result.z).toBeLessThan(r.center.z + r.size.z / 2 - PLAYER_RADIUS + 0.01)
    })

    it('从内部撞南墙 - 被挡住', () => {
      const room: RoomId = 'living'
      const r = sharedRooms[room]
      const pos = { x: r.center.x, y: 1.6, z: r.center.z - r.size.z / 2 + 0.5 }
      const desired = { x: r.center.x, y: 1.6, z: r.center.z - r.size.z / 2 - 5 }
      const result = resolveRoomCollision(pos, desired, room)
      expect(result.z).toBeGreaterThan(r.center.z - r.size.z / 2 + PLAYER_RADIUS - 0.01)
    })

    it('沿东墙非门洞处斜向滑动 - 只移动 z 方向', () => {
      const room: RoomId = 'living'
      const r = sharedRooms[room]
      const pos = {
        x: r.center.x + r.size.x / 2 - PLAYER_RADIUS - 0.01,
        y: 1.6,
        z: r.center.z + 1.5,
      }
      const desired = {
        x: r.center.x + r.size.x / 2 + 1,
        y: 1.6,
        z: r.center.z + 2.5,
      }
      const result = resolveRoomCollision(pos, desired, room)
      const maxX = r.center.x + r.size.x / 2 - PLAYER_RADIUS
      expect(result.x).toBeLessThanOrEqual(maxX + 0.05)
      expect(result.z).toBeGreaterThan(r.center.z + 1.5)
    })

    it('撞墙角 - 两个方向都被挡住', () => {
      const room: RoomId = 'living'
      const r = sharedRooms[room]
      const pos = {
        x: r.center.x + r.size.x / 2 - 0.5,
        y: 1.6,
        z: r.center.z + r.size.z / 2 - 0.5,
      }
      const desired = {
        x: r.center.x + r.size.x / 2 + 5,
        y: 1.6,
        z: r.center.z + r.size.z / 2 + 5,
      }
      const result = resolveRoomCollision(pos, desired, room)
      const maxX = r.center.x + r.size.x / 2 - PLAYER_RADIUS
      const maxZ = r.center.z + r.size.z / 2 - PLAYER_RADIUS
      expect(result.x).toBeLessThanOrEqual(maxX + 0.01)
      expect(result.z).toBeLessThanOrEqual(maxZ + 0.01)
    })

    it('所有房间 - 随机 1000 次移动都不会穿墙', () => {
      const rooms: RoomId[] = ['living', 'bedroom', 'kitchen', 'entrance', 'dining', 'laundry']
      let passCount = 0

      for (const room of rooms) {
        const r = sharedRooms[room]
        for (let i = 0; i < 200; i++) {
          const startX = r.center.x + (Math.random() - 0.5) * r.size.x * 0.8
          const startZ = r.center.z + (Math.random() - 0.5) * r.size.z * 0.8
          const pos = { x: startX, y: 1.6, z: startZ }

          const angle = Math.random() * Math.PI * 2
          const dist = Math.random() * 10
          const desired = {
            x: startX + Math.cos(angle) * dist,
            y: 1.6,
            z: startZ + Math.sin(angle) * dist,
          }

          const result = resolveRoomCollision(pos, desired, room, PLAYER_RADIUS, [
            'living', 'bedroom', 'kitchen', 'entrance', 'dining', 'laundry',
          ])

          const localX = result.x - r.center.x
          const localZ = result.z - r.center.z
          const halfX = r.size.x / 2
          const halfZ = r.size.z / 2

          const inDoorway = r.doorways.some((door) => {
            const dx = door.offset.x
            const dz = door.offset.z
            const halfW = door.width / 2
            const padding = PLAYER_RADIUS + 0.05
            if (Math.abs(dx) > Math.abs(dz)) {
              if (Math.abs(localZ - dz) > halfW + padding) return false
              return (
                (dx > 0 && localX >= halfX - padding) ||
                (dx < 0 && localX <= -halfX + padding)
              )
            } else {
              if (Math.abs(localX - dx) > halfW + padding) return false
              return (
                (dz > 0 && localZ >= halfZ - padding) ||
                (dz < 0 && localZ <= -halfZ + padding)
              )
            }
          })

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

    it('allowedRoomIds 限制 - 不可达房间的门洞应该被挡住', () => {
      const room: RoomId = 'dining'
      const r = sharedRooms[room]
      const pos = {
        x: r.center.x + r.size.x / 2 - 0.5,
        y: 1.6,
        z: r.center.z,
      }
      const desired = {
        x: r.center.x + r.size.x / 2 + 2,
        y: 1.6,
        z: r.center.z,
      }
      const result = resolveRoomCollision(pos, desired, room, PLAYER_RADIUS, ['dining', 'kitchen'])
      const localX = result.x - r.center.x
      expect(localX).toBeLessThanOrEqual(r.size.x / 2 - PLAYER_RADIUS + 0.05)
    })

    it('极大的移动距离 - 仍然被限制在房间内', () => {
      const room: RoomId = 'living'
      const pos = centerPos(room)
      const desired = { x: pos.x + 99999, y: 1.6, z: pos.z + 99999 }
      const result = resolveRoomCollision(pos, desired, room)
      const r = sharedRooms[room]
      expect(Math.abs(result.x - r.center.x)).toBeLessThanOrEqual(r.size.x / 2 + 2)
      expect(Math.abs(result.z - r.center.z)).toBeLessThanOrEqual(r.size.z / 2 + 2)
    })

    it('y 坐标保持不变', () => {
      const room: RoomId = 'living'
      const pos = centerPos(room)
      pos.y = 2.5
      const desired = { ...pos, x: pos.x + 10 }
      const result = resolveRoomCollision(pos, desired, room)
      expect(result.y).toBe(desired.y)
    })
  })

  describe('checkDoorwayTransition', () => {
    it('在房间中心 - 不触发切换', () => {
      const result = checkDoorwayTransition(centerPos('living'), 'living', 0, [
        'living', 'bedroom',
      ])
      expect(result).toBeNull()
    })

    it('冷却中 - 不触发切换', () => {
      const room: RoomId = 'living'
      const r = sharedRooms[room]
      const doorPos = {
        x: r.center.x + r.size.x / 2 + 0.2,
        y: 1.6,
        z: r.center.z,
      }
      const result = checkDoorwayTransition(doorPos, 'living', Date.now() + 10000, [
        'living', 'kitchen',
      ])
      expect(result).toBeNull()
    })

    it('所有房间 - 靠近门洞外侧时触发切换', () => {
      const testCases: { from: RoomId; to: RoomId; doorIndex: number }[] = [
        { from: 'living', to: 'bedroom', doorIndex: 0 },
        { from: 'living', to: 'kitchen', doorIndex: 1 },
        { from: 'living', to: 'entrance', doorIndex: 2 },
        { from: 'bedroom', to: 'living', doorIndex: 0 },
        { from: 'kitchen', to: 'living', doorIndex: 0 },
        { from: 'kitchen', to: 'dining', doorIndex: 1 },
        { from: 'entrance', to: 'living', doorIndex: 0 },
        { from: 'dining', to: 'kitchen', doorIndex: 0 },
        { from: 'dining', to: 'laundry', doorIndex: 1 },
        { from: 'laundry', to: 'dining', doorIndex: 0 },
      ]

      for (const tc of testCases) {
        const r = sharedRooms[tc.from]
        const door = r.doorways[tc.doorIndex]
        const isXWall = Math.abs(door.offset.x) > Math.abs(door.offset.z)
        const outsidePos: Vec3 = {
          x: isXWall
            ? r.center.x + door.offset.x + Math.sign(door.offset.x) * PLAYER_RADIUS * 2
            : r.center.x + door.offset.x,
          y: 1.6,
          z: isXWall
            ? r.center.z + door.offset.z
            : r.center.z + door.offset.z + Math.sign(door.offset.z) * PLAYER_RADIUS * 2,
        }
        const result = checkDoorwayTransition(outsidePos, tc.from, 0, [
          tc.from, tc.to,
        ])
        expect(result).not.toBeNull()
        expect(result?.toRoom).toBe(tc.to)
      }
    })

    it('allowedRoomIds 过滤 - 不可达房间不触发切换', () => {
      const room: RoomId = 'dining'
      const r = sharedRooms[room]
      const door = r.doorways[1]
      const pos: Vec3 = {
        x: r.center.x + door.offset.x + Math.sign(door.offset.x) * PLAYER_RADIUS * 0.8,
        y: 1.6,
        z: r.center.z + door.offset.z,
      }
      const result = checkDoorwayTransition(pos, 'dining', 0, ['dining', 'kitchen'])
      expect(result).toBeNull()
    })

    it('切换后的目标位置在目标房间内', () => {
      const r = sharedRooms['living']
      const door = r.doorways[1]
      const pos: Vec3 = {
        x: r.center.x + door.offset.x + Math.sign(door.offset.x) * PLAYER_RADIUS * 0.8,
        y: 1.6,
        z: r.center.z + door.offset.z,
      }
      const result = checkDoorwayTransition(pos, 'living', 0, ['living', 'kitchen'])
      expect(result).not.toBeNull()
      const target = result!.targetPosition
      const tr = sharedRooms['kitchen']
      expect(Math.abs(target.x - tr.center.x)).toBeLessThan(tr.size.x / 2)
      expect(Math.abs(target.z - tr.center.z)).toBeLessThan(tr.size.z / 2)
    })
  })
})
