import type { EntityState } from '../types/object'
import type { ContainerSpec, ObjectSpec } from '../types/object'
import type { TaskConfig } from '../types/task'
import type { RoomId, Vec3 } from '../types/room'
import { sharedRooms } from '../data/rooms'
import { CATEGORY_TO_MODEL_ID } from '../components/arena3d/modelIds'

export const FLOOR_Y = 0
export const Z_FIGHT_OFFSET = 0.015

export const MODEL_HEIGHTS: Record<string, number> = {
  key: 0.05,
  phone: 0.015,
  umbrella: 0.08,
  cup: 0.12,
  bowl: 0.08,
  plate: 0.03,
  spoon: 0.02,
  remote: 0.03,
  towel: 0.06,
  trash: 0.15,
  pillow: 0.15,
  milk_carton: 0.2,
  cereal_box: 0.25,
  cloth_white: 0.1,
  cloth_dark: 0.1,
  entrance_tray: 0.08,
  sofa: 0.9,
  coffee_table: 0.5,
  bed: 0.5,
  desk: 0.75,
  cabinet: 1.0,
  fridge: 1.8,
  sink: 0.9,
  dishwasher: 0.9,
  laundry_basket: 0.5,
  chair: 0.9,
  dining_table: 0.9,
}

export function getModelApproxHeight(modelId: string): number {
  return MODEL_HEIGHTS[modelId] ?? 0.1
}

export function getModelIdFromEntity(entity: EntityState): string {
  const cat = String(entity.category)
  return CATEGORY_TO_MODEL_ID[cat] || 'cup'
}

export function getEntityHalfHeight(entity: EntityState): number {
  const modelId = getModelIdFromEntity(entity)
  return getModelApproxHeight(modelId) / 2
}

/** @deprecated Use getEntityHalfHeight instead */
export function getEntityVisualHeight(entity: EntityState): number {
  return getModelApproxHeight(getModelIdFromEntity(entity))
}

/** 模型缩放比例：对应 PropModel 中的 modelScale */
export function getEntityModelScale(entity: EntityState): number {
  const size = entity.size
  if (!size) return 1
  const maxDim = Math.max(size.x, size.y, size.z)
  return maxDim / 0.5
}

const CONTAINER_MODEL_HEIGHTS: Record<string, number> = {
  fridge: 1.8,
  cabinet: 1.0,
  sink: 0.9,
  dishwasher: 0.9,
  laundry_basket: 0.5,
  sofa: 0.9,
  coffee_table: 0.5,
  dining_table: 0.9,
  bed: 0.5,
  desk: 0.75,
  entrance_tray: 0.08,
}

function getContainerModelId(container: ContainerSpec): string {
  const id = container.id
  if (id.includes('fridge')) return 'fridge'
  if (id.includes('sink')) return 'sink'
  if (id.includes('dishwasher')) return 'dishwasher'
  if (id.includes('laundry') || id.includes('basket') || id.includes('trash')) return 'laundry_basket'
  if (id.includes('sofa')) return 'sofa'
  if (id.includes('coffee-table') || id.includes('coffee_table')) return 'coffee_table'
  if (id.includes('dining-table') || id.includes('dining_table')) return 'dining_table'
  if (id.includes('bed')) return 'bed'
  if (id.includes('desk')) return 'desk'
  if (id.includes('tray')) return 'entrance_tray'
  if (id.includes('table')) return 'coffee_table'
  if (id.includes('cabinet') || id.includes('wardrobe') || id.includes('nightstand') || id.includes('drawer') || id.includes('stand') || id.includes('shelf') || id.includes('counter')) return 'cabinet'
  return 'cabinet'
}

export function getContainerSurfaceY(container: ContainerSpec): number {
  if (container.surfaceHeight !== undefined) {
    return container.surfaceHeight
  }
  const modelId = getContainerModelId(container)
  const modelHeight = CONTAINER_MODEL_HEIGHTS[modelId] ?? container.size.y
  return container.position.y + modelHeight / 2
}

export function snapToFloor(entity: EntityState): { x: number; y: number; z: number } {
  const halfHeight = getEntityHalfHeight(entity)
  return {
    x: entity.position.x,
    y: FLOOR_Y + halfHeight + Z_FIGHT_OFFSET,
    z: entity.position.z,
  }
}

export function snapToContainerSurface(
  entity: EntityState,
  container: ContainerSpec
): { x: number; y: number; z: number } {
  const surfaceY = getContainerSurfaceY(container)
  const halfHeight = getEntityHalfHeight(entity)
  return {
    x: entity.position.x,
    y: surfaceY + halfHeight + Z_FIGHT_OFFSET,
    z: entity.position.z,
  }
}

/** 物体放置在地面或容器表面后的正确 y 坐标 */
export function getObjectGroundY(
  entity: EntityState,
  containerOrRoom?: ContainerSpec | RoomId
): number {
  const halfHeight = getEntityHalfHeight(entity)

  if (containerOrRoom && typeof containerOrRoom !== 'string') {
    const surfaceY = getContainerSurfaceY(containerOrRoom)
    return surfaceY + halfHeight + Z_FIGHT_OFFSET
  }

  return FLOOR_Y + halfHeight + Z_FIGHT_OFFSET
}

/**
 * 把 entity.position.y 修正为贴地/贴表面的视觉 y。
 * 若 entity 被手持或隐藏，则保持原 y 不变。
 */
export function snapEntityPosition(
  entity: EntityState,
  containerOrRoom?: ContainerSpec | RoomId
): Vec3 {
  if (entity.status === 'held' || entity.status === 'hidden') {
    return { ...entity.position }
  }

  const y = getObjectGroundY(entity, containerOrRoom)
  return { x: entity.position.x, y, z: entity.position.z }
}

/** 计算物体放在某容器上的目标位置 */
export function getPlacedObjectPosition(
  entity: EntityState,
  container: ContainerSpec
): Vec3 {
  const halfHeight = getEntityHalfHeight(entity)
  return {
    x: container.position.x,
    y: getContainerSurfaceY(container) + halfHeight + Z_FIGHT_OFFSET,
    z: container.position.z,
  }
}

/**
 * 根据 entity 状态推断应使用哪个容器/房间作为放置基准。
 * - placed 状态的物体优先使用 placedIn 对应的容器
 * - 否则使用当前房间（地面）
 */
export function getEntityPlacementContext(
  entity: EntityState,
  task?: TaskConfig | null
): ContainerSpec | RoomId | undefined {
  if (entity.status === 'placed' && entity.placedIn && task) {
    const container = task.containers.find((c) => c.id === entity.placedIn)
    if (container) return container
  }
  return entity.currentRoom
}

/**
 * 把 entity 修正到世界坐标系下正确的视觉位置。
 * 优先根据 placedIn 对齐容器表面，否则对齐当前房间地面。
 */
export function snapEntityToWorld(
  entity: EntityState,
  task?: TaskConfig | null
): Vec3 {
  if (entity.status === 'held' || entity.status === 'hidden') {
    return { ...entity.position }
  }

  const context = getEntityPlacementContext(entity, task)
  const y = getObjectGroundY(entity, context)
  return { x: entity.position.x, y, z: entity.position.z }
}

function getModelIdFromCategory(category: string): string {
  return CATEGORY_TO_MODEL_ID[category] || 'cup'
}

/**
 * 根据 ObjectSpec 计算初始 free 物体的世界坐标。
 * 若指定了 surfaceContainerId，则保持 initialPosition 的 x/z，
 * 仅将 y 修正为该容器表面以上；否则贴地放置。
 */
export function getFreeObjectInitialPosition(
  objSpec: ObjectSpec,
  task: TaskConfig
): Vec3 {
  const room = sharedRooms[objSpec.initialRoom]
  const baseX = room.center.x + objSpec.initialPosition.x
  const baseZ = room.center.z + objSpec.initialPosition.z
  const modelId = getModelIdFromCategory(objSpec.category)
  const modelHeight = getModelApproxHeight(modelId)
  const halfHeight = modelHeight / 2

  if (!objSpec.surfaceContainerId) {
    return {
      x: baseX,
      y: FLOOR_Y + halfHeight + Z_FIGHT_OFFSET,
      z: baseZ,
    }
  }

  const container = task.containers.find((c) => c.id === objSpec.surfaceContainerId)
  if (!container) {
    return {
      x: baseX,
      y: FLOOR_Y + halfHeight + Z_FIGHT_OFFSET,
      z: baseZ,
    }
  }

  const surfaceY = getContainerSurfaceY(container)
  return {
    x: baseX,
    y: surfaceY + halfHeight + Z_FIGHT_OFFSET,
    z: baseZ,
  }
}
