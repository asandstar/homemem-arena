import { PLAYER_RADIUS } from './playerControls'
import { sharedRooms } from '../data/rooms'
import type { RoomId } from '../types/room'

export { PLAYER_RADIUS }

export const DOOR_COOLDOWN_MS = 800
export const DOOR_PADDING = 0.1

export interface Position2D {
  x: number
  z: number
}

export interface RoomBounds {
  centerX: number
  centerZ: number
  halfX: number
  halfZ: number
}

export interface DoorwaySpec {
  offsetX: number
  offsetZ: number
  width: number
  connectsTo: string
  targetPosition: { x: number; y: number; z: number }
}

function toRoomBounds(roomCenter: Position2D, roomSize: { x: number; z: number }): RoomBounds {
  return {
    centerX: roomCenter.x,
    centerZ: roomCenter.z,
    halfX: roomSize.x / 2,
    halfZ: roomSize.z / 2,
  }
}

export function isInsideRoomBounds(
  pos: Position2D,
  roomCenter: Position2D,
  roomSize: { x: number; z: number },
  radius: number
): boolean {
  const bounds = toRoomBounds(roomCenter, roomSize)
  const localX = pos.x - bounds.centerX
  const localZ = pos.z - bounds.centerZ
  return (
    localX >= -bounds.halfX + radius &&
    localX <= bounds.halfX - radius &&
    localZ >= -bounds.halfZ + radius &&
    localZ <= bounds.halfZ - radius
  )
}

export function isInsideDoorway(
  pos: Position2D,
  roomCenter: Position2D,
  roomSize: { x: number; z: number },
  doorway: DoorwaySpec,
  radius: number
): boolean {
  const bounds = toRoomBounds(roomCenter, roomSize)
  const localX = pos.x - bounds.centerX
  const localZ = pos.z - bounds.centerZ
  const dx = doorway.offsetX
  const dz = doorway.offsetZ
  const halfW = doorway.width / 2
  const padding = radius + DOOR_PADDING

  if (Math.abs(dx) > Math.abs(dz)) {
    const isEast = dx > 0
    if (Math.abs(localZ - dz) > halfW + padding) return false
    if (isEast) {
      return localX >= bounds.halfX - padding && localX <= bounds.halfX + halfW + padding
    } else {
      return localX <= -bounds.halfX + padding && localX >= -bounds.halfX - halfW - padding
    }
  }

  const isNorth = dz > 0
  if (Math.abs(localX - dx) > halfW + padding) return false
  if (isNorth) {
    return localZ >= bounds.halfZ - padding && localZ <= bounds.halfZ + halfW + padding
  } else {
    return localZ <= -bounds.halfZ + padding && localZ >= -bounds.halfZ - halfW - padding
  }
}

function isPositionValid(
  pos: Position2D,
  roomCenter: Position2D,
  roomSize: { x: number; z: number },
  radius: number,
  doorways: DoorwaySpec[]
): boolean {
  if (isInsideRoomBounds(pos, roomCenter, roomSize, radius)) {
    return true
  }
  for (const door of doorways) {
    if (isInsideDoorway(pos, roomCenter, roomSize, door, radius)) {
      return true
    }
  }
  return false
}

export function resolveRoomCollision(
  currentPos: Position2D,
  desiredPos: Position2D,
  roomCenter: Position2D,
  roomSize: { x: number; z: number },
  radius: number,
  doorways: DoorwaySpec[]
): Position2D {
  if (isPositionValid(desiredPos, roomCenter, roomSize, radius, doorways)) {
    return desiredPos
  }

  const slideX = { x: desiredPos.x, z: currentPos.z }
  if (isPositionValid(slideX, roomCenter, roomSize, radius, doorways)) {
    return slideX
  }

  const slideZ = { x: currentPos.x, z: desiredPos.z }
  if (isPositionValid(slideZ, roomCenter, roomSize, radius, doorways)) {
    return slideZ
  }

  const bounds = toRoomBounds(roomCenter, roomSize)
  const localX = desiredPos.x - bounds.centerX
  const localZ = desiredPos.z - bounds.centerZ

  let clampedX = localX
  let clampedZ = localZ

  const inAnyDoorway = doorways.some((door) =>
    isInsideDoorway(desiredPos, roomCenter, roomSize, door, radius)
  )

  if (!inAnyDoorway) {
    clampedX = Math.max(-bounds.halfX + radius, Math.min(bounds.halfX - radius, localX))
    clampedZ = Math.max(-bounds.halfZ + radius, Math.min(bounds.halfZ - radius, localZ))
  }

  return {
    x: bounds.centerX + clampedX,
    z: bounds.centerZ + clampedZ,
  }
}

export function checkRoomTransition(
  pos: Position2D,
  currentRoom: string,
  roomData: Record<string, any>,
  allowedRooms: string[],
  cooldownUntil: number,
  radius: number = PLAYER_RADIUS
): { toRoom: string; targetPos: Position2D } | null {
  if (Date.now() < cooldownUntil) return null

  const room = roomData[currentRoom]
  if (!room) return null

  const bounds = toRoomBounds(
    { x: room.center.x, z: room.center.z },
    { x: room.size.x, z: room.size.z }
  )
  const localX = pos.x - bounds.centerX
  const localZ = pos.z - bounds.centerZ

  for (const door of room.doorways) {
    if (allowedRooms && !allowedRooms.includes(door.connectsTo)) continue

    const dx = door.offset.x
    const dz = door.offset.z
    const halfW = door.width / 2

    let inDoorway = false

    if (Math.abs(dx) > Math.abs(dz)) {
      const isEast = dx > 0
      if (
        Math.abs(localZ - dz) <= halfW + radius &&
        ((isEast && localX >= bounds.halfX + radius * 0.5) ||
          (!isEast && localX <= -bounds.halfX - radius * 0.5))
      ) {
        inDoorway = true
      }
    } else {
      const isNorth = dz > 0
      if (
        Math.abs(localX - dx) <= halfW + radius &&
        ((isNorth && localZ >= bounds.halfZ + radius * 0.5) ||
          (!isNorth && localZ <= -bounds.halfZ - radius * 0.5))
      ) {
        inDoorway = true
      }
    }

    if (inDoorway) {
      const targetRoom = roomData[door.connectsTo]
      if (!targetRoom) continue

      return {
        toRoom: door.connectsTo,
        targetPos: {
          x: targetRoom.center.x + door.targetPosition.x,
          z: targetRoom.center.z + door.targetPosition.z,
        },
      }
    }
  }

  return null
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

export function resolveFurnitureCollision(
  currentPos: Position2D,
  desiredPos: Position2D,
  furnitureList: Array<{ position: Position2D & { y: number }; size: { x: number; y: number; z: number } }>,
  roomCenter: Position2D,
  radius: number
): Position2D {
  let result = { ...desiredPos }

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
      const testX = { x: result.x + collision.pushX, z: currentPos.z }
      const testZ = { x: currentPos.x, z: result.z + collision.pushZ }

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

export function getNearbyDoorwayHint(
  position: Position2D,
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
