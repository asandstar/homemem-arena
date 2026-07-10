/**
 * Scene Graph - 运行时场景图查询层
 *
 * 从游戏状态构建统一的场景图数据结构，提供高效的查询API。
 * 不改动任何现有数据结构，纯运行时构建。
 */

import { sharedRooms } from '../data/rooms'
import type { EntityState } from '../types/object'
import type { RoomId, Vec3 } from '../types/room'
import type { TaskConfig } from '../types/task'

// ============================================================================
// 节点类型
// ============================================================================

export type SceneNodeType = 'entity' | 'container' | 'room'

export interface EntityNode {
  type: 'entity'
  id: string
  configId: string
  name: string
  category: string
  room: RoomId
  position: Vec3
  state: string
  placedIn: string | null
  isHeld: boolean
  isHidden: boolean
}

export interface ContainerNode {
  type: 'container'
  id: string
  name: string
  room: RoomId
  position: Vec3
  open: boolean
  contents: string[]
  acceptsCategories: string[]
}

export interface RoomNode {
  type: 'room'
  id: RoomId
  name: string
  center: Vec3
  size: Vec3
  adjacent: RoomId[]
}

export type SceneNode = EntityNode | ContainerNode | RoomNode

// ============================================================================
// 边类型
// ============================================================================

export type SceneEdgeType =
  | 'located-in'    // entity -> room
  | 'placed-in'     // entity -> container
  | 'contains'      // container -> entity
  | 'adjacent'      // room <-> room
  | 'accessible-from' // room -> room (通过门洞)

export interface SceneEdge {
  type: SceneEdgeType
  source: string
  target: string
}

// ============================================================================
// 场景图数据结构
// ============================================================================

export interface SceneGraph {
  /** 所有节点，按ID索引 */
  nodes: Map<string, SceneNode>
  /** 所有边 */
  edges: SceneEdge[]
  /** 按类型分组的节点ID */
  entityIds: string[]
  containerIds: string[]
  roomIds: RoomId[]
}

// ============================================================================
// 构建函数
// ============================================================================

/**
 * 从游戏状态构建场景图
 */
export function buildSceneGraph(
  entities: EntityState[],
  containerStates: Record<string, { open: boolean; containedIds: string[] }>,
  task: TaskConfig | null,
): SceneGraph {
  const nodes = new Map<string, SceneNode>()
  const edges: SceneEdge[] = []
  const entityIds: string[] = []
  const containerIds: string[] = []
  const roomIds: RoomId[] = []

  // 构建房间节点
  if (task) {
    for (const roomId of task.rooms) {
      const roomSpec = sharedRooms[roomId]
      if (!roomSpec) continue

      const roomNode: RoomNode = {
        type: 'room',
        id: roomId,
        name: roomSpec.name,
        center: { ...roomSpec.center },
        size: { ...roomSpec.size },
        adjacent: roomSpec.doorways.map((d) => d.connectsTo),
      }
      nodes.set(roomId, roomNode)
      roomIds.push(roomId)

      // 房间邻接边
      for (const adjacentId of roomNode.adjacent) {
        edges.push({ type: 'adjacent', source: roomId, target: adjacentId })
        edges.push({ type: 'accessible-from', source: roomId, target: adjacentId })
      }
    }
  }

  // 构建容器节点
  if (task) {
    for (const container of task.containers) {
      const state = containerStates[container.id]
      const roomSpec = sharedRooms[container.room]

      const containerNode: ContainerNode = {
        type: 'container',
        id: container.id,
        name: container.name,
        room: container.room,
        position: {
          x: roomSpec.center.x + container.position.x,
          y: roomSpec.center.y + container.position.y,
          z: roomSpec.center.z + container.position.z,
        },
        open: state?.open ?? container.initialOpen,
        contents: state?.containedIds ?? [...(container.containsObjectIds ?? [])],
        acceptsCategories: container.acceptedCategories ?? [],
      }
      nodes.set(container.id, containerNode)
      containerIds.push(container.id)

      // 容器位于房间中
      edges.push({ type: 'located-in', source: container.id, target: container.room })
    }
  }

  // 构建实体节点
  for (const entity of entities) {
    const entityNode: EntityNode = {
      type: 'entity',
      id: entity.id,
      configId: entity.configId,
      name: entity.name,
      category: entity.category,
      room: entity.currentRoom,
      position: { ...entity.position },
      state: entity.status,
      placedIn: entity.placedIn ?? null,
      isHeld: entity.status === 'held',
      isHidden: entity.status === 'hidden',
    }
    nodes.set(entity.id, entityNode)
    entityIds.push(entity.id)

    // 实体位于房间中
    edges.push({ type: 'located-in', source: entity.id, target: entity.currentRoom })

    // 实体放置在容器中
    if (entity.placedIn) {
      edges.push({ type: 'placed-in', source: entity.id, target: entity.placedIn })
      edges.push({ type: 'contains', source: entity.placedIn, target: entity.id })
    }
  }

  return { nodes, edges, entityIds, containerIds, roomIds }
}

// ============================================================================
// 查询 API
// ============================================================================

/** 查找指定ID的节点 */
export function getNode(graph: SceneGraph, id: string): SceneNode | undefined {
  return graph.nodes.get(id)
}

/** 获取指定房间中的所有实体 */
export function getEntitiesInRoom(graph: SceneGraph, roomId: RoomId): EntityNode[] {
  return graph.entityIds
    .map((id) => graph.nodes.get(id))
    .filter((node): node is EntityNode => node?.type === 'entity' && node.room === roomId)
}

/** 获取指定房间中的所有容器 */
export function getContainersInRoom(graph: SceneGraph, roomId: RoomId): ContainerNode[] {
  return graph.containerIds
    .map((id) => graph.nodes.get(id))
    .filter((node): node is ContainerNode => node?.type === 'container' && node.room === roomId)
}

/** 获取指定容器中的所有实体 */
export function getEntitiesInContainer(graph: SceneGraph, containerId: string): EntityNode[] {
  const container = graph.nodes.get(containerId)
  if (container?.type !== 'container') return []
  return container.contents
    .map((id) => graph.nodes.get(id))
    .filter((node): node is EntityNode => node?.type === 'entity')
}

/** 获取指定容器的包含关系边 */
export function getContainerContentsEdges(graph: SceneGraph, containerId: string): SceneEdge[] {
  return graph.edges.filter(
    (e) => e.type === 'contains' && e.source === containerId,
  )
}

/** 查找距离指定位置最近的实体 */
export function findNearestEntity(
  graph: SceneGraph,
  position: Vec3,
  roomId: RoomId,
  maxDistance = 2,
): EntityNode | null {
  const roomEntities = getEntitiesInRoom(graph, roomId)
  let nearest: EntityNode | null = null
  let nearestDist = maxDistance

  for (const entity of roomEntities) {
    if (entity.isHidden || entity.isHeld) continue
    const dist = Math.hypot(
      entity.position.x - position.x,
      entity.position.z - position.z,
    )
    if (dist < nearestDist) {
      nearest = entity
      nearestDist = dist
    }
  }

  return nearest
}

/** 查找距离指定位置最近的容器 */
export function findNearestContainer(
  graph: SceneGraph,
  position: Vec3,
  roomId: RoomId,
  maxDistance = 2.5,
): ContainerNode | null {
  const roomContainers = getContainersInRoom(graph, roomId)
  let nearest: ContainerNode | null = null
  let nearestDist = maxDistance

  for (const container of roomContainers) {
    const dist = Math.hypot(
      container.position.x - position.x,
      container.position.z - position.z,
    )
    if (dist < nearestDist) {
      nearest = container
      nearestDist = dist
    }
  }

  return nearest
}

/** 获取与指定房间相邻的所有房间 */
export function getAdjacentRooms(graph: SceneGraph, roomId: RoomId): RoomId[] {
  const room = graph.nodes.get(roomId)
  if (room?.type !== 'room') return []
  return room.adjacent
}

/** 检查实体是否可达（未被隐藏、未被手持） */
export function isEntityAccessible(graph: SceneGraph, entityId: string): boolean {
  const entity = graph.nodes.get(entityId)
  if (entity?.type !== 'entity') return false
  return !entity.isHidden && !entity.isHeld
}

/** 获取房间之间的最短路径（BFS） */
export function getRoomPath(graph: SceneGraph, from: RoomId, to: RoomId): RoomId[] | null {
  if (from === to) return [from]

  const visited = new Set<RoomId>()
  const queue: { room: RoomId; path: RoomId[] }[] = [{ room: from, path: [from] }]

  while (queue.length > 0) {
    const { room, path } = queue.shift()!
    if (room === to) return path

    if (visited.has(room)) continue
    visited.add(room)

    const adjacent = getAdjacentRooms(graph, room)
    for (const next of adjacent) {
      if (!visited.has(next)) {
        queue.push({ room: next, path: [...path, next] })
      }
    }
  }

  return null
}

/** 获取指定类别的所有实体 */
export function getEntitiesByCategory(graph: SceneGraph, category: string): EntityNode[] {
  return graph.entityIds
    .map((id) => graph.nodes.get(id))
    .filter((node): node is EntityNode => node?.type === 'entity' && node.category === category)
}

/** 获取指定configId的实体 */
export function findEntityByConfigId(graph: SceneGraph, configId: string): EntityNode | undefined {
  return graph.entityIds
    .map((id) => graph.nodes.get(id))
    .find((node): node is EntityNode => node?.type === 'entity' && node.configId === configId) as EntityNode | undefined
}

/** 获取场景中所有可见（非隐藏）的实体 */
export function getVisibleEntities(graph: SceneGraph): EntityNode[] {
  return graph.entityIds
    .map((id) => graph.nodes.get(id))
    .filter((node): node is EntityNode => node?.type === 'entity' && !node.isHidden)
}

/** 获取手持的实体 */
export function getHeldEntity(graph: SceneGraph): EntityNode | undefined {
  return graph.entityIds
    .map((id) => graph.nodes.get(id))
    .find((node): node is EntityNode => node?.type === 'entity' && node.isHeld) as EntityNode | undefined
}

/** 统计各房间的实体数量 */
export function getRoomEntityCounts(graph: SceneGraph): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const entityId of graph.entityIds) {
    const entity = graph.nodes.get(entityId)
    if (entity?.type === 'entity') {
      counts[entity.room] = (counts[entity.room] ?? 0) + 1
    }
  }
  return counts
}

/** 统计各房间中可见的实体数量 */
export function getRoomVisibleEntityCounts(graph: SceneGraph): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const entityId of graph.entityIds) {
    const entity = graph.nodes.get(entityId)
    if (entity?.type === 'entity' && !entity.isHidden && !entity.isHeld) {
      counts[entity.room] = (counts[entity.room] ?? 0) + 1
    }
  }
  return counts
}

// ============================================================================
// 辅助函数
// ============================================================================

/** 计算两点之间的XZ平面距离 */
export function distanceXZ(a: Vec3, b: Vec3): number {
  return Math.hypot(a.x - b.x, a.z - b.z)
}

/** 计算两点之间的3D距离 */
export function distance3D(a: Vec3, b: Vec3): number {
  return Math.sqrt(
    (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2,
  )
}
