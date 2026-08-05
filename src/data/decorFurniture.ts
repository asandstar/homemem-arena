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

// 常用旋转常量
const ROT = {
  FACE_PLUS_Z: 0,            // 面朝 +Z（北向）
  FACE_NEG_X: -Math.PI / 2,  // 面朝 -X（西向）
  FACE_NEG_Z: Math.PI,       // 面朝 -Z（南向）
  FACE_PLUS_X: Math.PI / 2,  // 面朝 +X（东向）
}

export const roomDecorFurniture: Record<RoomId, DecorFurnitureSpec[]> = {
  living: [
    // 南墙：沙发 + 电视柜 一排朝南墙，朝房间中心 (+Z)
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
    // 东墙：书架 / 挂钟 / 椅子 —— 面朝房间中心 (-X)
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
    // 西墙：置物架 / 挂画 —— 面朝房间中心 (+X)
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
    // 角落植物
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
    // 床：卧室中心靠南，床头朝西墙 (-X)，卧室中心 -8,0,0（+X 东，-X 西）
    {
      id: 'decor-bed',
      position: { x: -8, y: 0, z: -0.8 },
      size: { x: 2.0, y: 1.0, z: 2.4 },
    },
    // 西墙：床头柜 + 衣柜 + 梳妆台 —— 面朝房间中心 (+X)
    {
      id: 'decor-nightstand-left',
      position: { x: -11.15, y: 0, z: -1.5 },
      size: { x: 0.55, y: 0.55, z: 0.45 },
      rotationY: ROT.FACE_PLUS_X,
    },
    {
      id: 'decor-wardrobe',
      position: { x: -11.15, y: 0, z: 0.6 },
      size: { x: 1.8, y: 2.1, z: 0.65 },
      rotationY: ROT.FACE_PLUS_X,
    },
    {
      id: 'decor-dresser',
      position: { x: -9.5, y: 0, z: 1.5 },
      size: { x: 1.2, y: 0.9, z: 0.45 },
      rotationY: ROT.FACE_PLUS_X,
    },
    // 东墙：书桌 + 书架 + 椅子 + 挂钟 —— 面朝房间中心 (-X)
    {
      id: 'decor-desk',
      position: { x: -6.4, y: 0, z: 1.0 },
      size: { x: 1.3, y: 0.75, z: 0.65 },
      rotationY: ROT.FACE_NEG_X,
    },
    {
      id: 'decor-bookshelf',
      position: { x: -4.6, y: 0, z: 1.0 },
      size: { x: 0.7, y: 1.6, z: 0.3 },
      rotationY: ROT.FACE_NEG_X,
    },
    {
      id: 'decor-clock',
      position: { x: -4.3, y: 1.8, z: -1.5 },
      size: { x: 0.4, y: 0.4, z: 0.05 },
      rotationY: ROT.FACE_NEG_X,
      collisionMode: 'none',
    },
    {
      id: 'decor-chair',
      position: { x: -5.5, y: 0, z: 1.0 },
      size: { x: 0.45, y: 0.65, z: 0.45 },
      rotationY: ROT.FACE_NEG_X,
    },
    // 北墙：挂画 —— 面朝房间中心 (-Z)
    {
      id: 'decor-painting',
      position: { x: -8, y: 1.2, z: 3.7 },
      size: { x: 0.7, y: 0.5, z: 0.05 },
      rotationY: ROT.FACE_NEG_Z,
      collisionMode: 'none',
    },
    // 角落植物
    {
      id: 'decor-plant',
      position: { x: -4.6, y: 0, z: 2.5 },
      size: { x: 0.3, y: 0.7, z: 0.3 },
    },
  ],
  kitchen: [
    // 西墙：橱柜 x=5.5（房间中心 +X=+4 东墙？不对：kitchen center=8,0,0，西墙 x=4，东墙 x=12）
    // cabinet 1-3: x=5.5 属于西向一侧（靠近客厅门），面朝 -X（房间中心方向：朝西 → 不对，朝房间中心 kitchen 中心 x=8，所以西墙 cabinet 面朝 +X 东向 = 朝房间中心 = 朝 8）
    {
      id: 'decor-cabinet-1',
      position: { x: 5.5, y: 0, z: -3.4 },
      size: { x: 0.8, y: 0.9, z: 0.6 },
      rotationY: ROT.FACE_PLUS_X,
    },
    {
      id: 'decor-cabinet-2',
      position: { x: 5.5, y: 0, z: 0.5 },
      size: { x: 0.8, y: 0.9, z: 0.6 },
      rotationY: ROT.FACE_PLUS_X,
    },
    {
      id: 'decor-cabinet-3',
      position: { x: 5.5, y: 0, z: 3.4 },
      size: { x: 0.8, y: 0.9, z: 0.6 },
      rotationY: ROT.FACE_PLUS_X,
    },
    // 北墙：中心一排橱柜 + 水槽 + 灶台 + 微波炉
    {
      id: 'decor-cabinet-4',
      position: { x: 8, y: 0, z: 3.5 },
      size: { x: 1.6, y: 0.9, z: 0.6 },
      rotationY: ROT.FACE_NEG_Z,
    },
    {
      id: 'decor-sink',
      position: { x: 7.5, y: 0.85, z: 3.5 },
      size: { x: 0.6, y: 0.3, z: 0.4 },
      rotationY: ROT.FACE_NEG_Z,
      collisionMode: 'none',
    },
    {
      id: 'decor-stove',
      position: { x: 8.5, y: 0.85, z: 3.5 },
      size: { x: 0.7, y: 0.2, z: 0.5 },
      rotationY: ROT.FACE_NEG_Z,
    },
    {
      id: 'decor-microwave',
      position: { x: 8.5, y: 1.5, z: 3.5 },
      size: { x: 0.5, y: 0.35, z: 0.4 },
      rotationY: ROT.FACE_NEG_Z,
    },
    {
      id: 'decor-plant',
      position: { x: 7.2, y: 0, z: 3.5 },
      size: { x: 0.25, y: 0.45, z: 0.25 },
    },
    // 东墙：橱柜 + 冰箱 + 置物架 —— 面朝房间中心 (-X)
    {
      id: 'decor-cabinet-5',
      position: { x: 10.5, y: 0, z: 3.4 },
      size: { x: 0.8, y: 0.9, z: 0.6 },
      rotationY: ROT.FACE_NEG_X,
    },
    {
      id: 'decor-cabinet-6',
      position: { x: 10.5, y: 0, z: 0.5 },
      size: { x: 0.8, y: 0.9, z: 0.6 },
      rotationY: ROT.FACE_NEG_X,
    },
    {
      id: 'decor-fridge',
      position: { x: 10.4, y: 0, z: -3.2 },
      size: { x: 0.7, y: 2.0, z: 0.6 },
      rotationY: ROT.FACE_NEG_X,
    },
    {
      id: 'decor-trash',
      position: { x: 10.4, y: 0, z: -1.0 },
      size: { x: 0.35, y: 0.45, z: 0.35 },
      rotationY: ROT.FACE_NEG_X,
    },
    {
      id: 'decor-shelf',
      position: { x: 10.5, y: 0, z: 2.0 },
      size: { x: 0.5, y: 1.0, z: 0.15 },
      rotationY: ROT.FACE_NEG_X,
      collisionMode: 'none',
    },
    {
      id: 'decor-chair',
      position: { x: 9.5, y: 0, z: -1.0 },
      size: { x: 0.45, y: 0.65, z: 0.45 },
      rotationY: ROT.FACE_PLUS_Z,
    },
  ],
  entrance: [
    // 玄关：中心 0,0,8；size 6×3×6，x range [-3, +3]，z range [5, +11]
    // 西墙：鞋柜 + 植物 + 鞋子（x=-3 附近，面朝 +X 房间中心）
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
    // 东墙：挂钩 + 挂钟 + 置物架 + 植物 —— 面朝房间中心 (-X)
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
    // 南墙（z=-3，靠近客厅）：挂画 —— 面朝 +Z（进入玄关的人）
    {
      id: 'decor-painting',
      position: { x: 0, y: 1.0, z: 2.7 },
      size: { x: 0.6, y: 0.45, z: 0.05 },
      rotationY: ROT.FACE_NEG_Z,
      collisionMode: 'none',
    },
  ],
  laundry: [
    // 洗衣房：中心 24,0,0
    // 南墙：洗衣机 + 烘干机 —— 面朝房间中心 (+Z)
    {
      id: 'decor-washer-left',
      position: { x: 23.5, y: 0.55, z: -1.8 },
      size: { x: 0.6, y: 1.1, z: 0.6 },
      rotationY: ROT.FACE_NEG_Z,
    },
    {
      id: 'decor-washer-right',
      position: { x: 24.5, y: 0.55, z: -1.8 },
      size: { x: 0.6, y: 1.1, z: 0.6 },
      rotationY: ROT.FACE_NEG_Z,
    },
    // 东墙：毛巾架 + 置物架 + 植物 —— 面朝房间中心 (-X)
    {
      id: 'decor-towel-rack',
      position: { x: 26.6, y: 0.8, z: 0 },
      size: { x: 1.0, y: 1.5, z: 0.05 },
      rotationY: ROT.FACE_NEG_X,
      collisionMode: 'none',
    },
    {
      id: 'decor-shelf',
      position: { x: 26.5, y: 0, z: 1.5 },
      size: { x: 0.5, y: 1.0, z: 0.15 },
      rotationY: ROT.FACE_NEG_X,
      collisionMode: 'none',
    },
    {
      id: 'decor-plant',
      position: { x: 25.8, y: 0, z: -0.5 },
      size: { x: 0.25, y: 0.6, z: 0.25 },
    },
    // 西墙（靠近餐厅门）：橱柜 + 垃圾桶 —— 面朝房间中心 (+X)
    {
      id: 'decor-cabinet-1',
      position: { x: 19.5, y: 0, z: -3.4 },
      size: { x: 0.6, y: 0.9, z: 0.5 },
      rotationY: ROT.FACE_PLUS_X,
    },
    {
      id: 'decor-cabinet-2',
      position: { x: 19.5, y: 0, z: 0.5 },
      size: { x: 0.6, y: 0.9, z: 0.5 },
      rotationY: ROT.FACE_PLUS_X,
    },
    {
      id: 'decor-cabinet-3',
      position: { x: 19.5, y: 0, z: 3.4 },
      size: { x: 0.6, y: 0.9, z: 0.5 },
      rotationY: ROT.FACE_PLUS_X,
    },
    {
      id: 'decor-trash',
      position: { x: 19.6, y: 0, z: -1.0 },
      size: { x: 0.3, y: 0.4, z: 0.3 },
      rotationY: ROT.FACE_PLUS_X,
    },
  ],
  dining: [
    // 餐厅：中心 16,0,0
    // 中心：餐桌 + 4 椅子
    {
      id: 'decor-dining-table',
      position: { x: 16, y: 0.45, z: 0 },
      size: { x: 1.8, y: 0.9, z: 0.9 },
    },
    {
      id: 'decor-chair-1',
      position: { x: 15.0, y: 0.35, z: -0.5 },
      size: { x: 0.45, y: 0.7, z: 0.45 },
      rotationY: ROT.FACE_PLUS_X,
    },
    {
      id: 'decor-chair-2',
      position: { x: 17.0, y: 0.35, z: -0.5 },
      size: { x: 0.45, y: 0.7, z: 0.45 },
      rotationY: ROT.FACE_NEG_X,
    },
    {
      id: 'decor-chair-3',
      position: { x: 15.0, y: 0.35, z: 0.5 },
      size: { x: 0.45, y: 0.7, z: 0.45 },
      rotationY: ROT.FACE_PLUS_X,
    },
    {
      id: 'decor-chair-4',
      position: { x: 17.0, y: 0.35, z: 0.5 },
      size: { x: 0.45, y: 0.7, z: 0.45 },
      rotationY: ROT.FACE_NEG_X,
    },
    // 东墙：餐边柜 + 置物架 + 挂钟 + 多余椅子
    {
      id: 'decor-cabinet',
      position: { x: 19.4, y: 0, z: 0 },
      size: { x: 1.2, y: 0.85, z: 0.5 },
      rotationY: ROT.FACE_NEG_X,
    },
    {
      id: 'decor-shelf',
      position: { x: 19.5, y: 0, z: 1.5 },
      size: { x: 0.5, y: 1.0, z: 0.15 },
      rotationY: ROT.FACE_NEG_X,
      collisionMode: 'none',
    },
    {
      id: 'decor-clock',
      position: { x: 19.7, y: 1.8, z: -1.0 },
      size: { x: 0.35, y: 0.35, z: 0.05 },
      rotationY: ROT.FACE_NEG_X,
      collisionMode: 'none',
    },
    {
      id: 'decor-chair-5',
      position: { x: 18.0, y: 0, z: -0.8 },
      size: { x: 0.45, y: 0.65, z: 0.45 },
      rotationY: ROT.FACE_PLUS_Z,
    },
    {
      id: 'decor-chair-6',
      position: { x: 18.0, y: 0, z: 0.8 },
      size: { x: 0.45, y: 0.65, z: 0.45 },
      rotationY: ROT.FACE_PLUS_Z,
    },
    // 西墙：挂画 + 植物 2 件
    {
      id: 'decor-painting',
      position: { x: 12.3, y: 1.2, z: 1.0 },
      size: { x: 0.7, y: 0.55, z: 0.05 },
      rotationY: ROT.FACE_PLUS_X,
      collisionMode: 'none',
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
  ],
}
