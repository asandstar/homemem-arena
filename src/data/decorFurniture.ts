import type { RoomId, Vec3 } from '../types/room'

/**
 * ⚠️ 坐标系约定：所有 position 字段为**房间局部坐标**（相对于 sharedRooms[roomId].center）。
 * 碰撞系统（resolveFurnitureCollision）和 Minimap 渲染会叠加 roomCenter 得到世界坐标。
 * A1.5 前此文件混合了世界坐标/局部坐标，已统一为局部坐标。
 *
 * 背景装饰家具语义标签（用于承担视觉背景的纯装饰性家具）。
 * 所有新增字段均为可选，确保向后兼容。
 */
export type DecorCollisionMode = 'self' | 'none'
export type DecorVisualOwner = 'room' | 'decor' | 'task-container'

export interface DecorFurnitureSpec {
  id: string
  position: Vec3
  size: Vec3
  semanticKey?: string
  rotationY?: number
  collisionMode?: DecorCollisionMode
  visualOwner?: DecorVisualOwner
}

const ROT = {
  FACE_PLUS_Z: 0,
  FACE_NEG_X: -Math.PI / 2,
  FACE_NEG_Z: Math.PI,
  FACE_PLUS_X: Math.PI / 2,
}

export const roomDecorFurniture: Record<RoomId, DecorFurnitureSpec[]> = {
  living: [
    {
      id: 'decor-sofa-main',
      position: { x: 0, y: 0, z: -3.0 },
      size: { x: 2.4, y: 0.9, z: 1.0 },
      rotationY: ROT.FACE_NEG_Z,
    },
    {
      id: 'decor-sofa-side',
      position: { x: -1.5, y: 0, z: 0.0 },
      size: { x: 1.4, y: 0.85, z: 0.8 },
      rotationY: ROT.FACE_PLUS_X,
    },
    {
      id: 'decor-tv-stand',
      position: { x: 2.8, y: 0, z: -3.0 },
      size: { x: 2.0, y: 0.55, z: 0.45 },
      rotationY: ROT.FACE_NEG_Z,
    },
    {
      id: 'decor-tv',
      position: { x: 2.8, y: 0.8, z: -3.0 },
      size: { x: 1.6, y: 1.0, z: 0.15 },
      rotationY: ROT.FACE_NEG_Z,
    },
    {
      id: 'decor-bookshelf',
      position: { x: 3.5, y: 0, z: -2.5 },
      size: { x: 0.8, y: 1.8, z: 0.35 },
      rotationY: ROT.FACE_NEG_X,
    },
    {
      id: 'decor-clock',
      position: { x: 3.7, y: 1.8, z: 0 },
      size: { x: 0.4, y: 0.4, z: 0.05 },
      rotationY: ROT.FACE_NEG_X,
      collisionMode: 'none',
    },
    {
      id: 'decor-floor-lamp-1',
      position: { x: 3.2, y: 0, z: 2.0 },
      size: { x: 0.4, y: 1.8, z: 0.4 },
    },
    {
      id: 'decor-chair',
      position: { x: 3.0, y: 0, z: 1.5 },
      size: { x: 0.5, y: 0.7, z: 0.5 },
      rotationY: ROT.FACE_NEG_X,
    },
    {
      id: 'decor-side-table',
      position: { x: 3.8, y: 0, z: -2.0 },
      size: { x: 0.6, y: 0.35, z: 0.6 },
      rotationY: ROT.FACE_NEG_X,
    },
    {
      id: 'decor-shelf',
      position: { x: -3.8, y: 0, z: 1.5 },
      size: { x: 0.7, y: 1.2, z: 0.2 },
      rotationY: ROT.FACE_PLUS_X,
      collisionMode: 'none',
    },
    {
      id: 'decor-painting',
      position: { x: -3.7, y: 1.2, z: 1.5 },
      size: { x: 0.8, y: 0.6, z: 0.05 },
      rotationY: ROT.FACE_PLUS_X,
      collisionMode: 'none',
    },
    {
      id: 'decor-plant-1',
      position: { x: -3.5, y: 0, z: -3.5 },
      size: { x: 0.5, y: 1.2, z: 0.5 },
    },
    {
      id: 'decor-plant-2',
      position: { x: -3.5, y: 0, z: 2.5 },
      size: { x: 0.35, y: 0.8, z: 0.35 },
    },
  ],
  bedroom: [
    // Converted from world coords to room-local (old center: -8, 0, 0)
    {
      id: 'decor-bed',
      position: { x: 0, y: 0, z: -0.8 },
      size: { x: 2.0, y: 1.0, z: 2.4 },
    },
    {
      id: 'decor-nightstand-left',
      position: { x: -3.15, y: 0, z: -1.5 },
      size: { x: 0.55, y: 0.55, z: 0.45 },
      rotationY: ROT.FACE_PLUS_X,
    },
    {
      id: 'decor-wardrobe',
      position: { x: -3.15, y: 0, z: 0.6 },
      size: { x: 1.8, y: 2.1, z: 0.65 },
      rotationY: ROT.FACE_PLUS_X,
    },
    {
      id: 'decor-dresser',
      position: { x: -1.5, y: 0, z: 1.5 },
      size: { x: 1.2, y: 0.9, z: 0.45 },
      rotationY: ROT.FACE_PLUS_X,
    },
    {
      id: 'decor-desk',
      position: { x: 1.6, y: 0, z: 1.0 },
      size: { x: 1.3, y: 0.75, z: 0.65 },
      rotationY: ROT.FACE_NEG_X,
    },
    {
      id: 'decor-bookshelf',
      position: { x: 3.4, y: 0, z: 1.0 },
      size: { x: 0.7, y: 1.6, z: 0.3 },
      rotationY: ROT.FACE_NEG_X,
    },
    {
      id: 'decor-clock',
      position: { x: 3.7, y: 1.8, z: -1.5 },
      size: { x: 0.4, y: 0.4, z: 0.05 },
      rotationY: ROT.FACE_NEG_X,
      collisionMode: 'none',
    },
    {
      id: 'decor-chair',
      position: { x: 2.5, y: 0, z: 1.0 },
      size: { x: 0.45, y: 0.65, z: 0.45 },
      rotationY: ROT.FACE_NEG_X,
    },
    {
      id: 'decor-painting',
      position: { x: 0, y: 1.2, z: 3.7 },
      size: { x: 0.7, y: 0.5, z: 0.05 },
      rotationY: ROT.FACE_NEG_Z,
      collisionMode: 'none',
    },
    {
      id: 'decor-plant',
      position: { x: 3.4, y: 0, z: 2.5 },
      size: { x: 0.3, y: 0.7, z: 0.3 },
    },
  ],
  dining: [
    // ========== Dining furniture (converted from world, old center: 16, 0, 0) ==========
    {
      id: 'decor-dining-table',
      position: { x: 0, y: 0.45, z: 0 },
      size: { x: 1.8, y: 0.9, z: 0.9 },
    },
    {
      id: 'decor-chair-1',
      position: { x: -1.0, y: 0.35, z: -0.5 },
      size: { x: 0.45, y: 0.7, z: 0.45 },
      rotationY: ROT.FACE_PLUS_X,
    },
    {
      id: 'decor-chair-2',
      position: { x: 1.0, y: 0.35, z: -0.5 },
      size: { x: 0.45, y: 0.7, z: 0.45 },
      rotationY: ROT.FACE_NEG_X,
    },
    {
      id: 'decor-chair-3',
      position: { x: -1.0, y: 0.35, z: 0.5 },
      size: { x: 0.45, y: 0.7, z: 0.45 },
      rotationY: ROT.FACE_PLUS_X,
    },
    {
      id: 'decor-chair-4',
      position: { x: 1.0, y: 0.35, z: 0.5 },
      size: { x: 0.45, y: 0.7, z: 0.45 },
      rotationY: ROT.FACE_NEG_X,
    },
    {
      id: 'decor-cabinet',
      position: { x: 3.4, y: 0, z: 0 },
      size: { x: 1.2, y: 0.85, z: 0.5 },
      rotationY: ROT.FACE_NEG_X,
    },
    {
      id: 'decor-shelf',
      position: { x: 3.5, y: 0, z: 1.5 },
      size: { x: 0.5, y: 1.0, z: 0.15 },
      rotationY: ROT.FACE_NEG_X,
      collisionMode: 'none',
    },
    {
      id: 'decor-clock',
      position: { x: 3.7, y: 1.8, z: -1.0 },
      size: { x: 0.35, y: 0.35, z: 0.05 },
      rotationY: ROT.FACE_NEG_X,
      collisionMode: 'none',
    },
    {
      id: 'decor-chair-5',
      position: { x: 2.0, y: 0, z: -0.8 },
      size: { x: 0.45, y: 0.65, z: 0.45 },
      rotationY: ROT.FACE_PLUS_Z,
    },
    {
      id: 'decor-chair-6',
      position: { x: 2.0, y: 0, z: 0.8 },
      size: { x: 0.45, y: 0.65, z: 0.45 },
      rotationY: ROT.FACE_PLUS_Z,
    },
    {
      id: 'decor-painting',
      position: { x: -3.7, y: 1.2, z: 1.0 },
      size: { x: 0.7, y: 0.55, z: 0.05 },
      rotationY: ROT.FACE_PLUS_X,
      collisionMode: 'none',
    },
    {
      id: 'decor-plant-1',
      position: { x: -3.2, y: 0, z: -3.2 },
      size: { x: 0.35, y: 0.8, z: 0.35 },
    },
    {
      id: 'decor-plant-2',
      position: { x: -3.2, y: 0, z: 3.2 },
      size: { x: 0.3, y: 0.7, z: 0.3 },
    },
    // ========== Kitchen furniture (merged from kitchen, old center: 8, 0, 0) ==========
    // IDs prefixed with 'kit-' to avoid conflicts with dining furniture
    {
      id: 'decor-kit-cabinet-1',
      position: { x: -2.5, y: 0, z: -3.4 },
      size: { x: 0.8, y: 0.9, z: 0.6 },
      rotationY: ROT.FACE_PLUS_X,
    },
    {
      id: 'decor-kit-cabinet-2',
      position: { x: -2.5, y: 0, z: 0.5 },
      size: { x: 0.8, y: 0.9, z: 0.6 },
      rotationY: ROT.FACE_PLUS_X,
    },
    {
      id: 'decor-kit-cabinet-3',
      position: { x: -2.5, y: 0, z: 3.4 },
      size: { x: 0.8, y: 0.9, z: 0.6 },
      rotationY: ROT.FACE_PLUS_X,
    },
    {
      id: 'decor-kit-cabinet-4',
      position: { x: 0, y: 0, z: 3.5 },
      size: { x: 1.6, y: 0.9, z: 0.6 },
      rotationY: ROT.FACE_NEG_Z,
    },
    {
      id: 'decor-kit-sink',
      position: { x: -0.5, y: 0.85, z: 3.5 },
      size: { x: 0.6, y: 0.3, z: 0.4 },
      rotationY: ROT.FACE_NEG_Z,
      collisionMode: 'none',
    },
    {
      id: 'decor-kit-stove',
      position: { x: 0.5, y: 0.85, z: 3.5 },
      size: { x: 0.7, y: 0.2, z: 0.5 },
      rotationY: ROT.FACE_NEG_Z,
    },
    {
      id: 'decor-kit-microwave',
      position: { x: 0.5, y: 1.5, z: 3.5 },
      size: { x: 0.5, y: 0.35, z: 0.4 },
      rotationY: ROT.FACE_NEG_Z,
    },
    {
      id: 'decor-kit-plant',
      position: { x: -0.8, y: 0, z: 3.5 },
      size: { x: 0.25, y: 0.45, z: 0.25 },
    },
    {
      id: 'decor-kit-cabinet-5',
      position: { x: 2.5, y: 0, z: 3.4 },
      size: { x: 0.8, y: 0.9, z: 0.6 },
      rotationY: ROT.FACE_NEG_X,
    },
    {
      id: 'decor-kit-cabinet-6',
      position: { x: 2.5, y: 0, z: 0.5 },
      size: { x: 0.8, y: 0.9, z: 0.6 },
      rotationY: ROT.FACE_NEG_X,
    },
    {
      id: 'decor-kit-fridge',
      position: { x: 2.4, y: 0, z: -3.2 },
      size: { x: 0.7, y: 2.0, z: 0.6 },
      rotationY: ROT.FACE_NEG_X,
    },
    {
      id: 'decor-kit-trash',
      position: { x: 2.4, y: 0, z: -1.0 },
      size: { x: 0.35, y: 0.45, z: 0.35 },
      rotationY: ROT.FACE_NEG_X,
    },
    {
      id: 'decor-kit-shelf',
      position: { x: 2.5, y: 0, z: 2.0 },
      size: { x: 0.5, y: 1.0, z: 0.15 },
      rotationY: ROT.FACE_NEG_X,
      collisionMode: 'none',
    },
    {
      id: 'decor-kit-chair',
      position: { x: 1.5, y: 0, z: -1.0 },
      size: { x: 0.45, y: 0.65, z: 0.45 },
      rotationY: ROT.FACE_PLUS_Z,
    },
  ],
  entrance: [
    // Already room-local (no conversion needed)
    {
      id: 'decor-shoe-cabinet',
      position: { x: -2.4, y: 0, z: -0.5 },
      size: { x: 1.2, y: 1.1, z: 0.4 },
      rotationY: ROT.FACE_PLUS_X,
    },
    {
      id: 'decor-shoes',
      position: { x: -2.4, y: 0, z: 0.3 },
      size: { x: 0.35, y: 0.15, z: 0.45 },
      rotationY: ROT.FACE_PLUS_X,
      collisionMode: 'none',
    },
    {
      id: 'decor-plant-1',
      position: { x: -2.0, y: 0, z: 0.8 },
      size: { x: 0.3, y: 0.7, z: 0.3 },
    },
    {
      id: 'decor-hook',
      position: { x: 2.7, y: 1.5, z: 0 },
      size: { x: 1.0, y: 0.3, z: 0.05 },
      rotationY: ROT.FACE_NEG_X,
      collisionMode: 'none',
    },
    {
      id: 'decor-clock',
      position: { x: 2.7, y: 1.6, z: 1.0 },
      size: { x: 0.3, y: 0.3, z: 0.05 },
      rotationY: ROT.FACE_NEG_X,
      collisionMode: 'none',
    },
    {
      id: 'decor-shelf',
      position: { x: 2.5, y: 0, z: 1.5 },
      size: { x: 0.4, y: 0.8, z: 0.15 },
      rotationY: ROT.FACE_NEG_X,
      collisionMode: 'none',
    },
    {
      id: 'decor-plant-2',
      position: { x: 2.0, y: 0, z: -0.5 },
      size: { x: 0.25, y: 0.6, z: 0.25 },
    },
    {
      id: 'decor-painting',
      position: { x: 0, y: 1.0, z: 2.7 },
      size: { x: 0.6, y: 0.45, z: 0.05 },
      rotationY: ROT.FACE_NEG_Z,
      collisionMode: 'none',
    },
  ],
  laundry: [
    // Converted from world coords to room-local (old center: 24, 0, 0)
    {
      id: 'decor-washer-left',
      position: { x: -0.5, y: 0.55, z: -1.8 },
      size: { x: 0.6, y: 1.1, z: 0.6 },
      rotationY: ROT.FACE_NEG_Z,
    },
    {
      id: 'decor-washer-right',
      position: { x: 0.5, y: 0.55, z: -1.8 },
      size: { x: 0.6, y: 1.1, z: 0.6 },
      rotationY: ROT.FACE_NEG_Z,
    },
    {
      id: 'decor-towel-rack',
      position: { x: 2.6, y: 0.8, z: 0 },
      size: { x: 1.0, y: 1.5, z: 0.05 },
      rotationY: ROT.FACE_NEG_X,
      collisionMode: 'none',
    },
    {
      id: 'decor-shelf',
      position: { x: 2.5, y: 0, z: 1.5 },
      size: { x: 0.5, y: 1.0, z: 0.15 },
      rotationY: ROT.FACE_NEG_X,
      collisionMode: 'none',
    },
    {
      id: 'decor-plant',
      position: { x: 1.8, y: 0, z: -0.5 },
      size: { x: 0.25, y: 0.6, z: 0.25 },
    },
    {
      id: 'decor-cabinet-1',
      position: { x: -4.5, y: 0, z: -3.4 },
      size: { x: 0.6, y: 0.9, z: 0.5 },
      rotationY: ROT.FACE_PLUS_X,
    },
    {
      id: 'decor-cabinet-2',
      position: { x: -4.5, y: 0, z: 0.5 },
      size: { x: 0.6, y: 0.9, z: 0.5 },
      rotationY: ROT.FACE_PLUS_X,
    },
    {
      id: 'decor-cabinet-3',
      position: { x: -4.5, y: 0, z: 3.4 },
      size: { x: 0.6, y: 0.9, z: 0.5 },
      rotationY: ROT.FACE_PLUS_X,
    },
    {
      id: 'decor-trash',
      position: { x: -4.4, y: 0, z: -1.0 },
      size: { x: 0.3, y: 0.4, z: 0.3 },
      rotationY: ROT.FACE_PLUS_X,
    },
  ],
}
