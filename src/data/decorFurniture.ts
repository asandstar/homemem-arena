import type { RoomId, Vec3 } from '../types/room'
import type { ModelAssetId } from './assets/modelRegistry'

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
  /**
   * 可选：Room3D 检测到此字段后改用 RegisteredModel 渲染对应 GLB；
   * 加载中或失败时回退到程序化 fallback。
   * 该字段同时作为 decorFurniture → Room3D 的"单一数据源"标记：
   * 拥有此字段的 static decor，Room3D 不再手写其 transform。
   */
  modelAssetId?: ModelAssetId
}

const ROT = {
  FACE_PLUS_Z: 0,
  FACE_NEG_X: -Math.PI / 2,
  FACE_NEG_Z: Math.PI,
  FACE_PLUS_X: Math.PI / 2,
}

export const roomDecorFurniture: Record<RoomId, DecorFurnitureSpec[]> = {
  living: [
    // ========== A6 候选布局（ROUND B2 实现） ==========
    // 四件核心 static decor 为 Room3D 的单一数据源（modelAssetId 驱动 RegisteredModel）。
    // 坐标来自 docs/design/LIVING_A_CONSTRAINT_FREEZE.md §5 CANDIDATE A6。
    {
      id: 'decor-sofa-main',
      position: { x: -1.5, y: 0, z: 2.24 },
      size: { x: 2.4, y: 0.9, z: 1.0 },
      rotationY: ROT.FACE_NEG_Z,
      modelAssetId: 'furniture/loungeSofa',
    },
    {
      id: 'decor-tv-stand',
      position: { x: -2.0, y: 0, z: -2.1 },
      size: { x: 2.0, y: 0.55, z: 0.45 },
      rotationY: ROT.FACE_PLUS_Z,
      modelAssetId: 'furniture/cabinetTelevision',
    },
    {
      id: 'decor-tv',
      position: { x: -2.0, y: 0.62, z: -2.1 },
      size: { x: 1.6, y: 1.0, z: 0.15 },
      rotationY: ROT.FACE_PLUS_Z,
      collisionMode: 'none',
      modelAssetId: 'furniture/televisionModern',
    },
    {
      id: 'decor-bookshelf',
      position: { x: 2.75, y: 0, z: 1.5 },
      size: { x: 0.8, y: 1.8, z: 0.35 },
      rotationY: ROT.FACE_NEG_X,
      modelAssetId: 'furniture/bookcaseOpen',
    },
    // ========== 墙饰（collisionMode='none'，不碰撞不覆盖门洞，保留） ==========
    {
      id: 'decor-clock',
      position: { x: 3.7, y: 1.8, z: 0 },
      size: { x: 0.4, y: 0.4, z: 0.05 },
      rotationY: ROT.FACE_NEG_X,
      collisionMode: 'none',
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
    // ========== 已删除（A6 重构） ==========
    // decor-sofa-side: 侵入 Bedroom-Entrance 走廊，A6 移除
    // decor-side-table: 与 A6 无关的旧落地家具，本轮移除
    // decor-chair: 与 A6 无关的旧落地家具，本轮移除
    // decor-floor-lamp-1: 越界（X[3.0,3.4] 超出 room x_max=3.25），本轮移除
    // decor-plant-1: 越界（X[-3.75,-3.25] 且 Z[-3.75,-3.25] 超出房间），本轮移除
    // decor-plant-2: 越界（X[-3.675,-3.325] 超出 room x_min=-3.25），本轮移除
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
