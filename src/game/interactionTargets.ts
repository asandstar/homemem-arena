import { sharedRooms } from '../data/rooms'
import type { ContainerSpec, EntityState } from '../types/object'
import type { RoomId, Vec3 } from '../types/room'
import type { TaskConfig } from '../types/task'

function containerAcceptsCategory(container: ContainerSpec, heldCategory: string | null): boolean {
  // 没持东西：所有容器都可交互（打开/关闭）
  if (heldCategory === null) return true
  const acceptAny = container.acceptAny === true
  const hasEmptyList = !container.acceptedCategories || container.acceptedCategories.length === 0
  const isTargetZone = container.isTargetZone === true
  if (acceptAny) return true
  if (hasEmptyList) return isTargetZone
  return container.acceptedCategories.includes(heldCategory as never)
}

export function findNearestInteractableEntity(
  entities: EntityState[],
  playerPosition: Vec3,
  currentRoom: RoomId,
  maxDistance = 2,
  /** 可选：只返回允许在当前阶段交互的物体（例如 L3 STAGE_ENCODE 前过滤掉 BOWL/CUP/SPOON） */
  entityFilter?: (entity: EntityState) => boolean,
): EntityState | null {
  let nearest: EntityState | null = null
  let nearestDistance = maxDistance

  for (const entity of entities) {
    if (entity.currentRoom !== currentRoom) continue
    if (entity.status === 'hidden' || entity.status === 'held') continue
    if (entity.properties?._moving === true) continue
    if (entityFilter && !entityFilter(entity)) continue
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
  /** 可选：手持物体的 category；若传入，仅返回接受该类别（或 acceptAny / isTargetZone 空列表）的容器 */
  heldCategory: string | null = null,
): TaskConfig['containers'][number] | null {
  if (!task) return null
  const room = sharedRooms[currentRoom]
  if (!room) return null

  let nearest: TaskConfig['containers'][number] | null = null
  let nearestDistance = maxDistance

  for (const container of task.containers) {
    if (container.room !== currentRoom) continue
    if (!containerAcceptsCategory(container, heldCategory)) continue
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
