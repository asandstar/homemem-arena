import type { RoomId, Vec3 } from '../types/room'

/**
 * 背景装饰家具语义标签（用于承担视觉背景的纯装饰性家具）。
 * 所有新增字段均为可选，确保向后兼容。
 */
export type DecorCollisionMode = 'self' | 'none'
export type DecorVisualOwner = 'room' | 'decor' | 'task-container'

export interface DecorFurnitureSpec {
  id: string
  position: Vec3
  size: Vec3
  /**
   * 语义 key，用于跨 TC / DF / Room3D 三方对齐"同一语义家具"做去重检查。
   * 如 'sofa_main' / 'coffee_table_left' 等。
   * 可选；未设置时视为 legacy 数据，不参与去重。
   */
  semanticKey?: string
  /**
   * Y 轴旋转（弧度）。用于 rotation-aware 碰撞系统旋转 footprint。
   * 可选；缺失时默认为 0。
   */
  rotationY?: number
  /**
   * 本家具是否产生 XZ 碰撞的模式。
   * - 'self'：自身承担碰撞（默认，向后兼容）
   * - 'none'：跳过碰撞（如墙上挂件、柜顶托盘装饰物）
   * 缺失时视为 'self'。
   */
  collisionMode?: DecorCollisionMode
  /**
   * 本家具的视觉由谁承担。
   * - 'room'：Room3D 硬编码渲染
   * - 'decor'：由 DF 渲染组件承担（未来）
   * - 'task-container'：由对应任务容器 TC 承担（如伞架、茶几上的托盘）
   * 缺失时视为 legacy 未迁移数据，不改变当前渲染行为。
   */
  visualOwner?: DecorVisualOwner
}

export const roomDecorFurniture: Record<RoomId, DecorFurnitureSpec[]> = {
  living: [
    {
      id: 'decor-sofa-main',
      position: { x: 0, y: 0, z: -3.0 },
      size: { x: 2.4, y: 0.9, z: 1.0 },
    },
    {
      id: 'decor-sofa-side',
      position: { x: -1.5, y: 0, z: 0.0 },
      size: { x: 1.4, y: 0.85, z: 0.8 },
    },
    {
      id: 'decor-tv-stand',
      position: { x: 2.8, y: 0, z: -3.0 },
      size: { x: 2.0, y: 0.55, z: 0.45 },
    },
    {
      id: 'decor-tv',
      position: { x: 2.8, y: 0.8, z: -3.0 },
      size: { x: 1.6, y: 1.0, z: 0.15 },
    },
    {
      id: 'decor-bookshelf',
      position: { x: 3.5, y: 0, z: -2.5 },
      size: { x: 0.8, y: 1.8, z: 0.35 },
    },
    {
      id: 'decor-shelf',
      position: { x: -3.8, y: 0, z: 1.5 },
      size: { x: 0.7, y: 1.2, z: 0.2 },
    },
    {
      id: 'decor-painting',
      position: { x: -3.7, y: 1.2, z: 1.5 },
      size: { x: 0.8, y: 0.6, z: 0.05 },
    },
    {
      id: 'decor-clock',
      position: { x: 3.7, y: 1.8, z: 0 },
      size: { x: 0.4, y: 0.4, z: 0.05 },
    },
    {
      id: 'decor-floor-lamp-1',
      position: { x: 3.2, y: 0, z: 2.0 },
      size: { x: 0.4, y: 1.8, z: 0.4 },
    },
    {
      id: 'decor-floor-lamp-2',
      position: { x: 3.5, y: 0, z: 1.5 },
      size: { x: 0.35, y: 1.6, z: 0.35 },
    },
    {
      id: 'decor-plant-1',
      position: { x: -3.5, y: 0, z: -3.5 },
      size: { x: 0.5, y: 1.2, z: 0.5 },
    },
    {
      id: 'decor-plant-2',
      position: { x: 3.6, y: 0, z: 2.0 },
      size: { x: 0.35, y: 0.8, z: 0.35 },
    },
    {
      id: 'decor-chair',
      position: { x: 3.0, y: 0, z: 1.5 },
      size: { x: 0.5, y: 0.7, z: 0.5 },
    },
    {
      id: 'decor-side-table',
      position: { x: 3.8, y: 0, z: -2.0 },
      size: { x: 0.6, y: 0.35, z: 0.6 },
    },
  ],
  bedroom: [
    {
      id: 'decor-bed',
      position: { x: -8, y: 0, z: -0.8 },
      size: { x: 2.0, y: 1.0, z: 2.4 },
    },
    {
      id: 'decor-nightstand-left',
      position: { x: -11.15, y: 0, z: -1.5 },
      size: { x: 0.55, y: 0.55, z: 0.45 },
    },
    {
      id: 'decor-desk',
      position: { x: -6.4, y: 0, z: 1.0 },
      size: { x: 1.3, y: 0.75, z: 0.65 },
    },
    {
      id: 'decor-wardrobe',
      position: { x: -11.15, y: 0, z: 0.6 },
      size: { x: 1.8, y: 2.1, z: 0.65 },
    },
    {
      id: 'decor-dresser',
      position: { x: -9.5, y: 0, z: 1.5 },
      size: { x: 1.2, y: 0.9, z: 0.45 },
    },
    {
      id: 'decor-bookshelf',
      position: { x: -4.6, y: 0, z: 1.0 },
      size: { x: 0.7, y: 1.6, z: 0.3 },
    },
    {
      id: 'decor-painting',
      position: { x: -8, y: 1.2, z: 3.7 },
      size: { x: 0.7, y: 0.5, z: 0.05 },
    },
    {
      id: 'decor-clock',
      position: { x: -4.3, y: 1.8, z: -1.5 },
      size: { x: 0.4, y: 0.4, z: 0.05 },
    },
    {
      id: 'decor-chair',
      position: { x: -5.5, y: 0, z: 1.0 },
      size: { x: 0.45, y: 0.65, z: 0.45 },
    },
    {
      id: 'decor-plant',
      position: { x: -4.6, y: 0, z: 2.5 },
      size: { x: 0.3, y: 0.7, z: 0.3 },
    },
  ],
  kitchen: [
    {
      id: 'decor-cabinet-1',
      position: { x: 5.5, y: 0, z: -3.4 },
      size: { x: 0.8, y: 0.9, z: 0.6 },
    },
    {
      id: 'decor-cabinet-2',
      position: { x: 5.5, y: 0, z: 0.5 },
      size: { x: 0.8, y: 0.9, z: 0.6 },
    },
    {
      id: 'decor-cabinet-3',
      position: { x: 5.5, y: 0, z: 3.4 },
      size: { x: 0.8, y: 0.9, z: 0.6 },
    },
    {
      id: 'decor-cabinet-4',
      position: { x: 8, y: 0, z: 3.5 },
      size: { x: 1.6, y: 0.9, z: 0.6 },
    },
    {
      id: 'decor-cabinet-5',
      position: { x: 10.5, y: 0, z: 3.4 },
      size: { x: 0.8, y: 0.9, z: 0.6 },
    },
    {
      id: 'decor-cabinet-6',
      position: { x: 10.5, y: 0, z: 0.5 },
      size: { x: 0.8, y: 0.9, z: 0.6 },
    },
    {
      id: 'decor-fridge',
      position: { x: 10.4, y: 0, z: -3.2 },
      size: { x: 0.7, y: 2.0, z: 0.6 },
    },
    {
      id: 'decor-sink',
      position: { x: 7.5, y: 0.85, z: 3.5 },
      size: { x: 0.6, y: 0.3, z: 0.4 },
    },
    {
      id: 'decor-stove',
      position: { x: 8.5, y: 0.85, z: 3.5 },
      size: { x: 0.7, y: 0.2, z: 0.5 },
    },
    {
      id: 'decor-microwave',
      position: { x: 8.5, y: 1.5, z: 3.5 },
      size: { x: 0.5, y: 0.35, z: 0.4 },
    },
    {
      id: 'decor-trash',
      position: { x: 10.4, y: 0, z: -1.0 },
      size: { x: 0.35, y: 0.45, z: 0.35 },
    },
    {
      id: 'decor-shelf',
      position: { x: 10.5, y: 0, z: 2.0 },
      size: { x: 0.5, y: 1.0, z: 0.15 },
    },
    {
      id: 'decor-plant',
      position: { x: 7.2, y: 0, z: 3.5 },
      size: { x: 0.25, y: 0.45, z: 0.25 },
    },
    {
      id: 'decor-chair',
      position: { x: 9.5, y: 0, z: -1.0 },
      size: { x: 0.45, y: 0.65, z: 0.45 },
    },
  ],
  entrance: [
    {
      id: 'decor-shoe-cabinet',
      position: { x: -2.4, y: 0, z: -0.5 },
      size: { x: 1.2, y: 1.1, z: 0.4 },
    },
    {
      id: 'decor-shoes',
      position: { x: -2.4, y: 0, z: 0.3 },
      size: { x: 0.35, y: 0.15, z: 0.45 },
    },
    {
      id: 'decor-hook',
      position: { x: 2.7, y: 1.5, z: 0 },
      size: { x: 1.0, y: 0.3, z: 0.05 },
    },
    {
      id: 'decor-painting',
      position: { x: 0, y: 1.0, z: 2.7 },
      size: { x: 0.6, y: 0.45, z: 0.05 },
    },
    {
      id: 'decor-clock',
      position: { x: 2.7, y: 1.6, z: 1.0 },
      size: { x: 0.3, y: 0.3, z: 0.05 },
    },
    {
      id: 'decor-plant-1',
      position: { x: -2.0, y: 0, z: 0.8 },
      size: { x: 0.3, y: 0.7, z: 0.3 },
    },
    {
      id: 'decor-plant-2',
      position: { x: 2.0, y: 0, z: -0.5 },
      size: { x: 0.25, y: 0.6, z: 0.25 },
    },
    {
      id: 'decor-shelf',
      position: { x: 2.5, y: 0, z: 1.5 },
      size: { x: 0.4, y: 0.8, z: 0.15 },
    },
  ],
  laundry: [
    {
      id: 'decor-washer-left',
      position: { x: 23.5, y: 0.55, z: -1.8 },
      size: { x: 0.6, y: 1.1, z: 0.6 },
    },
    {
      id: 'decor-washer-right',
      position: { x: 24.5, y: 0.55, z: -1.8 },
      size: { x: 0.6, y: 1.1, z: 0.6 },
    },
    {
      id: 'decor-basket-red',
      position: { x: 23.0, y: 0.25, z: -0.3 },
      size: { x: 0.45, y: 0.5, z: 0.45 },
    },
    {
      id: 'decor-basket-blue',
      position: { x: 24.0, y: 0.25, z: -0.3 },
      size: { x: 0.45, y: 0.5, z: 0.45 },
    },
    {
      id: 'decor-basket-green',
      position: { x: 25.0, y: 0.25, z: -0.3 },
      size: { x: 0.45, y: 0.5, z: 0.45 },
    },
    {
      id: 'decor-towel-rack',
      position: { x: 26.6, y: 0.8, z: 0 },
      size: { x: 1.0, y: 1.5, z: 0.05 },
    },
    {
      id: 'decor-cabinet-1',
      position: { x: 19.5, y: 0, z: -3.4 },
      size: { x: 0.6, y: 0.9, z: 0.5 },
    },
    {
      id: 'decor-cabinet-2',
      position: { x: 19.5, y: 0, z: 0.5 },
      size: { x: 0.6, y: 0.9, z: 0.5 },
    },
    {
      id: 'decor-cabinet-3',
      position: { x: 19.5, y: 0, z: 3.4 },
      size: { x: 0.6, y: 0.9, z: 0.5 },
    },
    {
      id: 'decor-shelf',
      position: { x: 26.5, y: 0, z: 1.5 },
      size: { x: 0.5, y: 1.0, z: 0.15 },
    },
    {
      id: 'decor-trash',
      position: { x: 19.6, y: 0, z: -1.0 },
      size: { x: 0.3, y: 0.4, z: 0.3 },
    },
    {
      id: 'decor-plant',
      position: { x: 25.8, y: 0, z: -0.5 },
      size: { x: 0.25, y: 0.6, z: 0.25 },
    },
  ],
  dining: [
    {
      id: 'decor-dining-table',
      position: { x: 16, y: 0.45, z: 0 },
      size: { x: 1.8, y: 0.9, z: 0.9 },
    },
    {
      id: 'decor-chair-1',
      position: { x: 15.0, y: 0.35, z: -0.5 },
      size: { x: 0.45, y: 0.7, z: 0.45 },
    },
    {
      id: 'decor-chair-2',
      position: { x: 17.0, y: 0.35, z: -0.5 },
      size: { x: 0.45, y: 0.7, z: 0.45 },
    },
    {
      id: 'decor-chair-3',
      position: { x: 15.0, y: 0.35, z: 0.5 },
      size: { x: 0.45, y: 0.7, z: 0.45 },
    },
    {
      id: 'decor-chair-4',
      position: { x: 17.0, y: 0.35, z: 0.5 },
      size: { x: 0.45, y: 0.7, z: 0.45 },
    },
    {
      id: 'decor-cabinet',
      position: { x: 19.4, y: 0, z: 0 },
      size: { x: 1.2, y: 0.85, z: 0.5 },
    },
    {
      id: 'decor-shelf',
      position: { x: 19.5, y: 0, z: 1.5 },
      size: { x: 0.5, y: 1.0, z: 0.15 },
    },
    {
      id: 'decor-painting',
      position: { x: 12.3, y: 1.2, z: 1.0 },
      size: { x: 0.7, y: 0.55, z: 0.05 },
    },
    {
      id: 'decor-clock',
      position: { x: 19.7, y: 1.8, z: -1.0 },
      size: { x: 0.35, y: 0.35, z: 0.05 },
    },
    {
      id: 'decor-plant-1',
      position: { x: 12.8, y: 0, z: -3.2 },
      size: { x: 0.35, y: 0.8, z: 0.35 },
    },
    {
      id: 'decor-plant-2',
      position: { x: 12.8, y: 0, z: 3.2 },
      size: { x: 0.3, y: 0.7, z: 0.3 },
    },
    {
      id: 'decor-chair-5',
      position: { x: 18.0, y: 0, z: -0.8 },
      size: { x: 0.45, y: 0.65, z: 0.45 },
    },
    {
      id: 'decor-chair-6',
      position: { x: 18.0, y: 0, z: 0.8 },
      size: { x: 0.45, y: 0.65, z: 0.45 },
    },
  ],
}
