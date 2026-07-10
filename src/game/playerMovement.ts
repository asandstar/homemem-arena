import { sharedRooms } from '../data/rooms'
import type { RoomId, Vec3 } from '../types/room'
import {
  PLAYER_RADIUS,
  PLAYER_SPEED,
  TOP_DOWN_SPEED,
  computeMovementVector,
  type MoveInput,
} from './playerControls'

export { PLAYER_RADIUS, PLAYER_SPEED, TOP_DOWN_SPEED }
export type { MoveInput }

export const DOOR_COOLDOWN_MS = 800

export interface DoorwayTransition {
  toRoom: RoomId
  targetPosition: Vec3
}

export function computeMoveVector(
  input: MoveInput,
  rotation: number,
  speed: number,
  delta: number
): { dx: number; dz: number } {
  return computeMovementVector(input, rotation, speed, delta)
}

function isInsideDoorway(
  localX: number,
  localZ: number,
  halfX: number,
  halfZ: number,
  door: (typeof sharedRooms)[RoomId]['doorways'][number]
): boolean {
  const dx = door.offset.x
  const dz = door.offset.z
  const halfW = door.width / 2

  const padding = PLAYER_RADIUS + 0.05

  // 东/西墙门洞
  if (Math.abs(dx) > Math.abs(dz)) {
    const isEast = dx > 0
    // 玩家必须在门洞宽度区间内
    if (Math.abs(localZ - dz) > halfW + padding) return false
    // 玩家必须在墙外沿附近（允许 slightly 越过墙体）
    if (isEast) {
      return localX >= halfX - padding && localX <= halfX + halfW + padding
    } else {
      return localX <= -halfX + padding && localX >= -halfX - halfW - padding
    }
  }

  // 南/北墙门洞
  const isNorth = dz > 0
  if (Math.abs(localX - dx) > halfW + padding) return false
  if (isNorth) {
    return localZ >= halfZ - padding && localZ <= halfZ + halfW + padding
  } else {
    return localZ <= -halfZ + padding && localZ >= -halfZ - halfW - padding
  }
}

function isPositionInsideRoom(
  position: Vec3,
  roomId: RoomId,
  radius: number,
  doorways?: (typeof sharedRooms)[RoomId]['doorways']
): boolean {
  const room = sharedRooms[roomId]
  if (!room) return false

  const halfX = room.size.x / 2
  const halfZ = room.size.z / 2
  const localX = position.x - room.center.x
  const localZ = position.z - room.center.z

  // 在房间内
  if (
    localX >= -halfX + radius &&
    localX <= halfX - radius &&
    localZ >= -halfZ + radius &&
    localZ <= halfZ - radius
  ) {
    return true
  }

  // 在门洞可通行区域内
  const effectiveDoorways = doorways ?? room.doorways
  for (const door of effectiveDoorways) {
    if (isInsideDoorway(localX, localZ, halfX, halfZ, door)) {
      return true
    }
  }

  return false
}

export function resolveRoomCollision(
  position: Vec3,
  desiredPosition: Vec3,
  currentRoom: RoomId,
  radius: number = PLAYER_RADIUS,
  allowedRoomIds?: RoomId[]
): Vec3 {
  const room = sharedRooms[currentRoom]
  if (!room) return desiredPosition

  const halfX = room.size.x / 2
  const halfZ = room.size.z / 2

  // 过滤掉通向当前任务不可达房间的门洞
  const effectiveDoorways = allowedRoomIds
    ? room.doorways.filter((d) => allowedRoomIds.includes(d.connectsTo))
    : room.doorways

  // 若目标位置合法，直接返回
  if (isPositionInsideRoom(desiredPosition, currentRoom, radius, effectiveDoorways)) {
    return desiredPosition
  }

  // 尝试仅 x 方向滑动
  const slideX: Vec3 = { x: desiredPosition.x, y: desiredPosition.y, z: position.z }
  if (isPositionInsideRoom(slideX, currentRoom, radius, effectiveDoorways)) {
    return slideX
  }

  // 尝试仅 z 方向滑动
  const slideZ: Vec3 = { x: position.x, y: desiredPosition.y, z: desiredPosition.z }
  if (isPositionInsideRoom(slideZ, currentRoom, radius, effectiveDoorways)) {
    return slideZ
  }

  // 都无法移动，保持在房间内最近的合法位置
  const localX = desiredPosition.x - room.center.x
  const localZ = desiredPosition.z - room.center.z

  let clampedX = localX
  let clampedZ = localZ

  // 只有当不在有效门洞区间内才 clamp
  const inAnyDoorway = effectiveDoorways.some((door) =>
    isInsideDoorway(localX, localZ, halfX, halfZ, door)
  )

  if (!inAnyDoorway) {
    clampedX = Math.max(-halfX + radius, Math.min(halfX - radius, localX))
    clampedZ = Math.max(-halfZ + radius, Math.min(halfZ - radius, localZ))
  }

  return {
    x: room.center.x + clampedX,
    y: desiredPosition.y,
    z: room.center.z + clampedZ,
  }
}

export function checkDoorwayTransition(
  position: Vec3,
  currentRoom: RoomId,
  cooldownUntil: number,
  allowedRoomIds?: RoomId[]
): DoorwayTransition | null {
  if (Date.now() < cooldownUntil) return null

  const room = sharedRooms[currentRoom]
  if (!room) return null

  const halfX = room.size.x / 2
  const halfZ = room.size.z / 2
  const localX = position.x - room.center.x
  const localZ = position.z - room.center.z

  for (const door of room.doorways) {
    if (allowedRoomIds && !allowedRoomIds.includes(door.connectsTo)) continue

    const dx = door.offset.x
    const dz = door.offset.z
    const halfW = door.width / 2

    let inDoorway = false

    if (Math.abs(dx) > Math.abs(dz)) {
      const isEast = dx > 0
      if (
        Math.abs(localZ - dz) <= halfW + PLAYER_RADIUS &&
        ((isEast && localX >= halfX + PLAYER_RADIUS * 0.5) ||
          (!isEast && localX <= -halfX - PLAYER_RADIUS * 0.5))
      ) {
        inDoorway = true
      }
    } else {
      const isNorth = dz > 0
      if (
        Math.abs(localX - dx) <= halfW + PLAYER_RADIUS &&
        ((isNorth && localZ >= halfZ + PLAYER_RADIUS * 0.5) ||
          (!isNorth && localZ <= -halfZ - PLAYER_RADIUS * 0.5))
      ) {
        inDoorway = true
      }
    }

    if (inDoorway) {
      const targetRoom = sharedRooms[door.connectsTo]
      if (!targetRoom) continue

      return {
        toRoom: door.connectsTo,
        targetPosition: {
          x: targetRoom.center.x + door.targetPosition.x,
          y: position.y,
          z: targetRoom.center.z + door.targetPosition.z,
        },
      }
    }
  }

  return null
}

export function getNearbyDoorwayHint(
  position: Vec3,
  currentRoom: RoomId,
  allowedRoomIds?: RoomId[]
): { roomName: string; distance: number } | null {
  const room = sharedRooms[currentRoom]
  if (!room) return null

  let closest: { roomName: string; distance: number } | null = null

  for (const door of room.doorways) {
    if (allowedRoomIds && !allowedRoomIds.includes(door.connectsTo)) continue

    const doorWorldX = room.center.x + door.offset.x
    const doorWorldZ = room.center.z + door.offset.z
    const dist = Math.sqrt(
      (position.x - doorWorldX) ** 2 + (position.z - doorWorldZ) ** 2
    )

    if (dist < 2.0) {
      const targetRoomName = sharedRooms[door.connectsTo]?.name || door.connectsTo
      if (!closest || dist < closest.distance) {
        closest = { roomName: targetRoomName, distance: dist }
      }
    }
  }

  return closest
}

function circleRectCollision(
  cx: number,
  cz: number,
  radius: number,
  rx: number,
  rz: number,
  rw: number,
  rd: number
): { collides: boolean; pushX: number; pushZ: number } {
  const halfW = rw / 2
  const halfD = rd / 2

  const closestX = Math.max(rx - halfW, Math.min(cx, rx + halfW))
  const closestZ = Math.max(rz - halfD, Math.min(cz, rz + halfD))

  const dx = cx - closestX
  const dz = cz - closestZ
  const distSq = dx * dx + dz * dz

  if (distSq < radius * radius) {
    const dist = Math.sqrt(distSq)
    if (dist < 0.001) {
      return { collides: true, pushX: radius, pushZ: 0 }
    }
    const overlap = radius - dist
    return {
      collides: true,
      pushX: (dx / dist) * overlap,
      pushZ: (dz / dist) * overlap,
    }
  }

  return { collides: false, pushX: 0, pushZ: 0 }
}

interface FurnitureCollisionItem {
  position: Vec3
  size: Vec3
}

export function resolveFurnitureCollision(
  position: Vec3,
  desiredPosition: Vec3,
  furnitureList: FurnitureCollisionItem[],
  roomCenter: Vec3,
  radius: number = PLAYER_RADIUS
): Vec3 {
  let result = { ...desiredPosition }

  for (const furniture of furnitureList) {
    const fwX = roomCenter.x + furniture.position.x
    const fwZ = roomCenter.z + furniture.position.z

    const collision = circleRectCollision(
      result.x,
      result.z,
      radius,
      fwX,
      fwZ,
      furniture.size.x,
      furniture.size.z
    )

    if (collision.collides) {
      const testX = { x: result.x + collision.pushX, y: result.y, z: position.z }
      const testZ = { x: position.x, y: result.y, z: result.z + collision.pushZ }

      const colX = circleRectCollision(testX.x, testX.z, radius, fwX, fwZ, furniture.size.x, furniture.size.z)
      const colZ = circleRectCollision(testZ.x, testZ.z, radius, fwX, fwZ, furniture.size.x, furniture.size.z)

      if (!colX.collides) {
        result = testX
      } else if (!colZ.collides) {
        result = testZ
      } else {
        result.x += collision.pushX
        result.z += collision.pushZ
      }
    }
  }

  return result
}
