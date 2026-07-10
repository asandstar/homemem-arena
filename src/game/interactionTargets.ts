import { sharedRooms } from '../data/rooms'
import type { EntityState } from '../types/object'
import type { RoomId, Vec3 } from '../types/room'
import type { TaskConfig } from '../types/task'

export function findNearestInteractableEntity(
  entities: EntityState[],
  playerPosition: Vec3,
  currentRoom: RoomId,
  maxDistance = 2,
): EntityState | null {
  let nearest: EntityState | null = null
  let nearestDistance = maxDistance

  for (const entity of entities) {
    if (entity.currentRoom !== currentRoom) continue
    if (entity.status === 'hidden' || entity.status === 'held') continue
    if (entity.properties?._moving === true) continue
    const distance = Math.hypot(
      entity.position.x - playerPosition.x,
      entity.position.z - playerPosition.z,
    )
    if (distance < nearestDistance) {
      nearest = entity
      nearestDistance = distance
    }
  }

  return nearest
}

export function findNearestInteractableContainer(
  task: TaskConfig | null,
  playerPosition: Vec3,
  currentRoom: RoomId,
  maxDistance = 2.5,
): TaskConfig['containers'][number] | null {
  if (!task) return null
  const room = sharedRooms[currentRoom]
  if (!room) return null

  let nearest: TaskConfig['containers'][number] | null = null
  let nearestDistance = maxDistance

  for (const container of task.containers) {
    if (container.room !== currentRoom) continue
    const distance = Math.hypot(
      room.center.x + container.position.x - playerPosition.x,
      room.center.z + container.position.z - playerPosition.z,
    )
    if (distance < nearestDistance) {
      nearest = container
      nearestDistance = distance
    }
  }

  return nearest
}
