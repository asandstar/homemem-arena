// 物体类型 - 包含 3D 几何信息与状态属性

import type { RoomId } from './room'
import type { Vec3 } from './room'

/** 物体大类 */
export type ObjectCategory =
  // 出门任务
  | 'key'
  | 'phone'
  | 'umbrella'
  | 'power-bank'
  | 'wallet'
  // 餐桌任务
  | 'cup'
  | 'plate'
  | 'tissue'
  | 'remote'
  | 'fork'
  // 洗衣任务
  | 'white-clothes'
  | 'dark-clothes'
  | 'towel'
  // 早餐任务
  | 'milk'
  | 'cereal'
  | 'bowl'
  | 'spoon'

/** 物体运行时类型 */
export type EntityType = 'object' | 'container' | 'target-zone' | 'robot'

/** 物体规格 - 任务配置中定义 */
export interface ObjectSpec {
  id: string
  name: string
  category: ObjectCategory
  /** 初始房间 */
  initialRoom: RoomId
  /** 初始位置 (房间中心坐标系) */
  initialPosition: Vec3
  /** 物体尺寸 (宽×高×深) */
  size: Vec3
  /** 物体颜色 */
  color: string
  /** 是否初始时藏在容器中（被遮挡） */
  hiddenInContainer?: string
  /** 初始时放在哪个容器的表面上（用于表面锚定 y 坐标） */
  surfaceContainerId?: string
  /** 状态属性（任务相关，会在运行中变化） */
  stateProperties?: Record<string, string | number | boolean>
}

/** 容器碰撞承担模式 */
export type ContainerCollisionMode = 'self' | 'static-furniture' | 'none'

/** 容器视觉承担方 */
export type ContainerVisualOwner = 'room' | 'task-container'

/** 容器规格 */
export interface ContainerSpec {
  id: string
  name: string
  /** 容器所属房间 */
  room: RoomId
  /** 容器位置 */
  position: Vec3
  /** 容器尺寸 */
  size: Vec3
  color: string
  /** 初始开合状态 */
  initialOpen: boolean
  /** 接受的物体类别（用于目标判定） */
  acceptedCategories: ObjectCategory[]
  /** 容器内是否藏有物体（id 列表） */
  containsObjectIds?: string[]
  /** 容器是否为目标区（如玄关桌是目标区） */
  isTargetZone?: boolean
  /** 目标区名称（用于 UI 提示） */
  targetLabel?: string
  /** 容器表面高度（用于放置物体时锚定 y 坐标） */
  surfaceHeight?: number
  /** 是否为抽屉式容器 */
  isDrawer?: boolean
  /**
   * 显式声明"本容器接受任何类别物体"。
   * - 当为 true（默认 false）时，即便 acceptedCategories 为空也会放行所有类别。
   * - 当为 false 且 acceptedCategories 为空时，配合 isTargetZone 决定是否判为错放惩罚（BUG-P0-1 的通用修复方案）。
   */
  acceptAny?: boolean
  /**
   * 语义 key，用于跨 TC / DF / Room3D 三方对齐"同一语义家具"做去重检查。
   * 如 'nightstand_right' / 'entrance_tray' 等。
   * 可选；未设置时视为 legacy 数据，不参与去重。
   */
  semanticKey?: string
  /**
   * 本容器是否承担 XZ 碰撞的模式。
   * - 'self'：自身承担碰撞（默认，向后兼容）
   * - 'static-furniture'：由对应 DF（静态家具）承担碰撞，TC 自身跳过（如柜顶托盘，DF 鞋柜已经挡住地面 XZ）
   * - 'none'：完全不参与 XZ 碰撞（如墙上挂件，空中托盘）
   * 缺失时视为 'self'。
   */
  collisionMode?: ContainerCollisionMode
  /**
   * 本容器的视觉由谁承担。
   * - 'room'：Room3D 硬编码渲染
   * - 'task-container'：Container3D 承担（默认）
   * 缺失时视为 legacy 未迁移数据，保持当前 Container3D 渲染行为。
   */
  visualOwner?: ContainerVisualOwner
}

/** 物体运行时状态 */
export interface EntityState {
  /** 对应配置 ID */
  configId: string
  /** 运行时唯一 ID */
  id: string
  type: EntityType
  name: string
  category: ObjectCategory | string
  /** 当前所在房间 */
  currentRoom: RoomId
  /** 当前 3D 位置 */
  position: Vec3
  /** 物体尺寸 */
  size: Vec3
  /** 物体颜色 */
  color: string
  /** 3D 朝向 (Y 轴旋转，弧度) */
  rotation: number
  /** 物体状态 */
  status: 'free' | 'held' | 'placed' | 'hidden' | 'target-met'
  /** 放在哪个容器中（如果 status === 'placed'） */
  placedIn?: string
  /** 任务相关状态属性 */
  properties: Record<string, string | number | boolean>
}
