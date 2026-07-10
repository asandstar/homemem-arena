import { describe, it, expect } from 'vitest'
import {
  buildSceneGraph,
  getEntitiesInRoom,
  findNearestEntity,
  getAdjacentRooms,
  getRoomPath,
  isEntityAccessible,
  getVisibleEntities,
  findEntityByConfigId,
  distanceXZ,
  distance3D,
} from './sceneGraph'
import type { EntityState } from '../types/object'
import type { TaskConfig } from '../types/task'

const mockTask: TaskConfig = {
  id: 'test-task',
  name: '测试任务',
  description: '',
  memoryTypes: ['spatial', 'object'],
  difficulty: 'easy',
  rooms: ['living', 'bedroom'],
  objects: [],
  containers: [
    {
      id: 'table',
      name: '桌子',
      room: 'living',
      position: { x: 0, y: 0, z: 0 },
      size: { x: 1, y: 0.7, z: 0.5 },
      color: '#8B4513',
      initialOpen: true,
      acceptedCategories: ['key'],
    },
    {
      id: 'bed',
      name: '床',
      room: 'bedroom',
      position: { x: 1, y: 0, z: 1 },
      size: { x: 2, y: 0.5, z: 1.5 },
      color: '#4169E1',
      initialOpen: true,
      acceptedCategories: ['phone'],
    },
  ],
  goals: [],
  scriptedEvents: [],
  probes: [],
  briefing: '',
}

const mockEntities: EntityState[] = [
  {
    id: 'ent-key',
    configId: 'key',
    type: 'object',
    name: '钥匙',
    category: 'key',
    currentRoom: 'living',
    position: { x: 0, y: 0, z: 0 },
    size: { x: 0.1, y: 0.1, z: 0.1 },
    color: '#gold',
    rotation: 0,
    status: 'free',
    properties: {},
  },
  {
    id: 'ent-phone',
    configId: 'phone',
    type: 'object',
    name: '手机',
    category: 'phone',
    currentRoom: 'bedroom',
    position: { x: 1, y: 0, z: 1 },
    size: { x: 0.1, y: 0.1, z: 0.1 },
    color: '#blue',
    rotation: 0,
    status: 'free',
    properties: {},
  },
  {
    id: 'ent-hidden',
    configId: 'umbrella',
    type: 'object',
    name: '雨伞',
    category: 'umbrella',
    currentRoom: 'living',
    position: { x: 2, y: 0, z: 2 },
    size: { x: 0.2, y: 0.8, z: 0.2 },
    color: '#red',
    rotation: 0,
    status: 'hidden',
    properties: {},
  },
]

const mockContainerStates: Record<string, { open: boolean; containedIds: string[] }> = {
  table: { open: true, containedIds: [] },
  bed: { open: true, containedIds: [] },
}

describe('buildSceneGraph', () => {
  it('应构建包含房间、容器、实体的场景图', () => {
    const graph = buildSceneGraph(mockEntities, mockContainerStates, mockTask)

    expect(graph.roomIds).toContain('living')
    expect(graph.roomIds).toContain('bedroom')
    expect(graph.containerIds).toContain('table')
    expect(graph.containerIds).toContain('bed')
    expect(graph.entityIds).toHaveLength(3)
  })

  it('应正确建立房间邻接关系', () => {
    const graph = buildSceneGraph(mockEntities, mockContainerStates, mockTask)
    const living = graph.nodes.get('living')
    expect(living?.type).toBe('room')
    if (living?.type === 'room') {
      expect(living.adjacent).toContain('bedroom')
    }
  })

  it('实体节点应包含正确的状态信息', () => {
    const graph = buildSceneGraph(mockEntities, mockContainerStates, mockTask)
    const key = graph.nodes.get('ent-key')
    expect(key?.type).toBe('entity')
    if (key?.type === 'entity') {
      expect(key.name).toBe('钥匙')
      expect(key.room).toBe('living')
      expect(key.isHidden).toBe(false)
      expect(key.isHeld).toBe(false)
    }
  })

  it('隐藏实体应标记为隐藏', () => {
    const graph = buildSceneGraph(mockEntities, mockContainerStates, mockTask)
    const umbrella = graph.nodes.get('ent-hidden')
    expect(umbrella?.type).toBe('entity')
    if (umbrella?.type === 'entity') {
      expect(umbrella.isHidden).toBe(true)
    }
  })
})

describe('getEntitiesInRoom', () => {
  it('应返回指定房间中的所有实体', () => {
    const graph = buildSceneGraph(mockEntities, mockContainerStates, mockTask)
    const livingEntities = getEntitiesInRoom(graph, 'living')
    expect(livingEntities).toHaveLength(2)
    expect(livingEntities.map((e) => e.name)).toContain('钥匙')
    expect(livingEntities.map((e) => e.name)).toContain('雨伞')
  })
})

describe('findNearestEntity', () => {
  it('应找到距离最近的实体', () => {
    const graph = buildSceneGraph(mockEntities, mockContainerStates, mockTask)
    const nearest = findNearestEntity(graph, { x: 0, y: 0, z: 0 }, 'living', 5)
    expect(nearest).not.toBeNull()
    expect(nearest?.configId).toBe('key')
  })

  it('不应返回隐藏实体', () => {
    const graph = buildSceneGraph(mockEntities, mockContainerStates, mockTask)
    // 从雨伞的位置查找，但雨伞是隐藏的
    const nearest = findNearestEntity(graph, { x: 2, y: 0, z: 2 }, 'living', 5)
    expect(nearest?.configId).not.toBe('umbrella')
  })
})

describe('getAdjacentRooms', () => {
  it('应返回相邻房间', () => {
    const graph = buildSceneGraph(mockEntities, mockContainerStates, mockTask)
    const adjacent = getAdjacentRooms(graph, 'living')
    expect(adjacent).toContain('bedroom')
  })
})

describe('getRoomPath', () => {
  it('应找到房间之间的路径', () => {
    const graph = buildSceneGraph(mockEntities, mockContainerStates, mockTask)
    const path = getRoomPath(graph, 'living', 'bedroom')
    expect(path).not.toBeNull()
    expect(path).toEqual(['living', 'bedroom'])
  })

  it('相同房间应返回单元素路径', () => {
    const graph = buildSceneGraph(mockEntities, mockContainerStates, mockTask)
    const path = getRoomPath(graph, 'living', 'living')
    expect(path).toEqual(['living'])
  })
})

describe('isEntityAccessible', () => {
  it('可见实体应可达', () => {
    const graph = buildSceneGraph(mockEntities, mockContainerStates, mockTask)
    expect(isEntityAccessible(graph, 'ent-key')).toBe(true)
  })

  it('隐藏实体不可达', () => {
    const graph = buildSceneGraph(mockEntities, mockContainerStates, mockTask)
    expect(isEntityAccessible(graph, 'ent-hidden')).toBe(false)
  })
})

describe('getVisibleEntities', () => {
  it('应只返回可见实体', () => {
    const graph = buildSceneGraph(mockEntities, mockContainerStates, mockTask)
    const visible = getVisibleEntities(graph)
    expect(visible).toHaveLength(2)
    expect(visible.map((e) => e.configId)).not.toContain('umbrella')
  })
})

describe('findEntityByConfigId', () => {
  it('应通过configId找到实体', () => {
    const graph = buildSceneGraph(mockEntities, mockContainerStates, mockTask)
    const entity = findEntityByConfigId(graph, 'phone')
    expect(entity).not.toBeUndefined()
    expect(entity?.name).toBe('手机')
  })
})

describe('distance helpers', () => {
  it('distanceXZ应计算XZ平面距离', () => {
    expect(distanceXZ({ x: 0, y: 10, z: 0 }, { x: 3, y: 5, z: 4 })).toBe(5)
  })

  it('distance3D应计算3D距离', () => {
    expect(distance3D({ x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 })).toBeCloseTo(1.732, 2)
  })
})
