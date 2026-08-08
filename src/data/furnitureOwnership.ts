/**
 * 家具所有权注册中心
 *
 * 解决"同一件家具在 decorFurniture / Room3D 内联 / task containers 三处都有定义"的三重所有权问题。
 *
 * 规则：
 * - task-container        = 家具本体（视觉+交互+碰撞）都由 task.containers 负责 → Room3D / decorFurniture 的同一件删除
 * - static-decor          = 纯静态装饰+碰撞（沙发/普通柜子/绿植）→ 仅 decorFurniture / Room3D 渲染，不做交互
 * - static-base-interactive-top = 底座 static-decor + 桌面托盘 task-container（玄关桌=static，托盘=task）
 */
import type { RoomId } from '../types/room'

export type Ownership = 'task-container' | 'static-decor' | 'static-base-interactive-top'

export interface FurnitureOwnershipEntry {
  /** 唯一 key `${roomId}::${decorId|containerId}` */
  key: string
  roomId: RoomId
  /** 对应 decorFurniture 的 id（task-container 接管时用于在碰撞/渲染中剔除） */
  decorId?: string
  /** 对应 task.containers 的 id（static-decor 不存在） */
  containerId?: string
  /** 谁是唯一真源 */
  ownership: Ownership
  note?: string
}

export const furnitureOwnershipRegistry: FurnitureOwnershipEntry[] = [
  // ===================== 客厅 living =====================
  // 茶几：task-container 接管（L2 唯一目标区）
  {
    key: 'living::cnt-coffee-table',
    roomId: 'living',
    containerId: 'cnt-coffee-table',
    decorId: '__DEPRECATED_BY_CONTAINER__coffee-table',
    ownership: 'task-container',
    note: '沙发组中心家具，唯一真身为 Container3D(cnt-coffee-table)，自带 hover/target/放置逻辑',
  },
  // 主沙发：static-decor
  { key: 'living::decor-sofa-main', roomId: 'living', decorId: 'decor-sofa-main', ownership: 'static-decor' },
  // 电视柜 + 电视 + 音箱：static-decor
  { key: 'living::decor-tv-stand', roomId: 'living', decorId: 'decor-tv-stand', ownership: 'static-decor' },
  { key: 'living::decor-tv', roomId: 'living', decorId: 'decor-tv', ownership: 'static-decor' },
  { key: 'living::decor-speaker-l', roomId: 'living', decorId: 'decor-speaker-l', ownership: 'static-decor' },
  { key: 'living::decor-speaker-r', roomId: 'living', decorId: 'decor-speaker-r', ownership: 'static-decor' },
  // 地毯 / 书架 / 落地灯 / 休闲椅：static-decor
  { key: 'living::decor-living-rug-round', roomId: 'living', decorId: 'decor-living-rug-round', ownership: 'static-decor' },
  { key: 'living::decor-bookshelf', roomId: 'living', decorId: 'decor-bookshelf', ownership: 'static-decor' },
  { key: 'living::decor-floor-lamp', roomId: 'living', decorId: 'decor-floor-lamp', ownership: 'static-decor' },
  { key: 'living::decor-lounge-chair', roomId: 'living', decorId: 'decor-lounge-chair', ownership: 'static-decor' },
  // 盆栽 ×3：static-decor
  { key: 'living::decor-plant-1', roomId: 'living', decorId: 'decor-plant-1', ownership: 'static-decor' },
  { key: 'living::decor-plant-2', roomId: 'living', decorId: 'decor-plant-2', ownership: 'static-decor' },
  { key: 'living::decor-plant-3', roomId: 'living', decorId: 'decor-plant-3', ownership: 'static-decor' },
  // 墙饰：挂画 / 挂钟
  { key: 'living::decor-painting', roomId: 'living', decorId: 'decor-painting', ownership: 'static-decor' },
  { key: 'living::decor-clock', roomId: 'living', decorId: 'decor-clock', ownership: 'static-decor' },
  // deprecated 记录：decor-sofa-side 已从 decorFurniture 移除（A6 布局重构）
  { key: 'living::decor-sofa-side', roomId: 'living', decorId: 'decor-sofa-side', ownership: 'static-decor', note: 'DEPRECATED: A6 移除，decorFurniture.living 已无此条目' },

  // ===================== 卧室 bedroom =====================
  // 卧室无 task-container（L2 物品放在房间内但不使用容器交互）
  { key: 'bedroom::decor-bed', roomId: 'bedroom', decorId: 'decor-bed', ownership: 'static-decor' },
  { key: 'bedroom::decor-bedroom-wardrobe', roomId: 'bedroom', decorId: 'decor-bedroom-wardrobe', ownership: 'static-decor' },
  { key: 'bedroom::decor-nightstand-left', roomId: 'bedroom', decorId: 'decor-nightstand-left', ownership: 'static-decor' },
  { key: 'bedroom::decor-nightstand-right', roomId: 'bedroom', decorId: 'decor-nightstand-right', ownership: 'static-decor' },
  { key: 'bedroom::decor-nightstand-lamp-l', roomId: 'bedroom', decorId: 'decor-nightstand-lamp-l', ownership: 'static-decor' },
  { key: 'bedroom::decor-nightstand-lamp-r', roomId: 'bedroom', decorId: 'decor-nightstand-lamp-r', ownership: 'static-decor' },
  { key: 'bedroom::decor-toy-bear', roomId: 'bedroom', decorId: 'decor-toy-bear', ownership: 'static-decor' },
  { key: 'bedroom::decor-bedroom-rug', roomId: 'bedroom', decorId: 'decor-bedroom-rug', ownership: 'static-decor' },
  { key: 'bedroom::decor-bedroom-mirror', roomId: 'bedroom', decorId: 'decor-bedroom-mirror', ownership: 'static-decor' },

  // ===================== 餐厨 dining =====================
  // L1 task-containers
  { key: 'dining::cnt-dining-table', roomId: 'dining', containerId: 'cnt-dining-table', decorId: '__DEPRECATED_BY_CONTAINER__dining-table', ownership: 'task-container', note: 'L1 餐桌，唯一真身为 Container3D' },
  { key: 'dining::cnt-sink', roomId: 'dining', containerId: 'cnt-sink', ownership: 'task-container', note: 'L1 水槽仅承担交互区，视觉和碰撞由 decor-kit-sink 承担' },
  { key: 'dining::cnt-cabinet', roomId: 'dining', containerId: 'cnt-cabinet', ownership: 'task-container', note: 'L1 橱柜仅承担交互区，视觉和碰撞由 decor-kit-cabinet-1 承担' },
  { key: 'dining::cnt-trashcan', roomId: 'dining', containerId: 'cnt-trashcan', ownership: 'task-container', note: 'L1 垃圾桶（教学开关容器），自渲染 GLB' },
  // 4 把餐椅：static-decor
  { key: 'dining::decor-chair-1', roomId: 'dining', decorId: 'decor-chair-1', ownership: 'static-decor' },
  { key: 'dining::decor-chair-2', roomId: 'dining', decorId: 'decor-chair-2', ownership: 'static-decor' },
  { key: 'dining::decor-chair-3', roomId: 'dining', decorId: 'decor-chair-3', ownership: 'static-decor' },
  { key: 'dining::decor-chair-4', roomId: 'dining', decorId: 'decor-chair-4', ownership: 'static-decor' },
  // 厨房工作区：冰箱 / 橱柜 / 水槽 / 灶台：static-decor
  { key: 'dining::decor-kit-fridge', roomId: 'dining', decorId: 'decor-kit-fridge', ownership: 'static-decor' },
  { key: 'dining::decor-kit-cabinet-1', roomId: 'dining', decorId: 'decor-kit-cabinet-1', ownership: 'static-decor' },
  { key: 'dining::decor-kit-sink', roomId: 'dining', decorId: 'decor-kit-sink', ownership: 'static-decor' },
  { key: 'dining::decor-kit-cabinet-2', roomId: 'dining', decorId: 'decor-kit-cabinet-2', ownership: 'static-decor' },
  { key: 'dining::decor-kit-stove', roomId: 'dining', decorId: 'decor-kit-stove', ownership: 'static-decor' },
  // 台上物品：收音机 / 微波炉。水槽上不堆与任务无关且易混淆的书。
  { key: 'dining::decor-kit-radio', roomId: 'dining', decorId: 'decor-kit-radio', ownership: 'static-decor' },
  { key: 'dining::decor-kit-microwave', roomId: 'dining', decorId: 'decor-kit-microwave', ownership: 'static-decor' },
  // 大盆栽 / 墙饰
  { key: 'dining::decor-kit-plant', roomId: 'dining', decorId: 'decor-kit-plant', ownership: 'static-decor' },
  { key: 'dining::decor-painting', roomId: 'dining', decorId: 'decor-painting', ownership: 'static-decor' },
  { key: 'dining::decor-clock', roomId: 'dining', decorId: 'decor-clock', ownership: 'static-decor' },

  // ===================== 玄关 entrance =====================
  // 玄关无 task-container（L2 物品放在鞋柜上但不使用容器交互）
  { key: 'entrance::decor-entrance-rug', roomId: 'entrance', decorId: 'decor-entrance-rug', ownership: 'static-decor' },
  { key: 'entrance::decor-entrance-coatrack', roomId: 'entrance', decorId: 'decor-entrance-coatrack', ownership: 'static-decor' },
  { key: 'entrance::decor-entrance-shoe-cabinet', roomId: 'entrance', decorId: 'decor-entrance-shoe-cabinet', ownership: 'static-decor' },
  { key: 'entrance::decor-entrance-mirror', roomId: 'entrance', decorId: 'decor-entrance-mirror', ownership: 'static-decor' },
  { key: 'entrance::decor-entrance-plant', roomId: 'entrance', decorId: 'decor-entrance-plant', ownership: 'static-decor' },
  { key: 'entrance::decor-entrance-painting', roomId: 'entrance', decorId: 'decor-entrance-painting', ownership: 'static-decor' },

  // ===================== 洗衣房 laundry =====================
  // L3 三个洗衣篮：task-container（程序化几何体，颜色编码辨识）
  { key: 'laundry::cnt-white-basket', roomId: 'laundry', containerId: 'cnt-white-basket', ownership: 'task-container' },
  { key: 'laundry::cnt-dark-basket', roomId: 'laundry', containerId: 'cnt-dark-basket', ownership: 'task-container' },
  { key: 'laundry::cnt-towel-basket', roomId: 'laundry', containerId: 'cnt-towel-basket', ownership: 'task-container' },
  // 洗衣机 / 烘干机 / 置物架 / 储物柜：static-decor
  { key: 'laundry::decor-washer', roomId: 'laundry', decorId: 'decor-washer', ownership: 'static-decor' },
  { key: 'laundry::decor-dryer', roomId: 'laundry', decorId: 'decor-dryer', ownership: 'static-decor' },
  { key: 'laundry::decor-utility-shelf', roomId: 'laundry', decorId: 'decor-utility-shelf', ownership: 'static-decor' },
  { key: 'laundry::decor-laundry-cabinet', roomId: 'laundry', decorId: 'decor-laundry-cabinet', ownership: 'static-decor' },
  { key: 'laundry::decor-laundry-plant', roomId: 'laundry', decorId: 'decor-laundry-plant', ownership: 'static-decor' },
  { key: 'laundry::decor-laundry-clock', roomId: 'laundry', decorId: 'decor-laundry-clock', ownership: 'static-decor' },
]

/**
 * 获取某个房间的"所有权为 decor"的 id 集合（渲染/碰撞保留，剔除 deprecated 项）
 */
export function getActiveDecorIdsForRoom(roomId: RoomId): Set<string> {
  const set = new Set<string>()
  for (const e of furnitureOwnershipRegistry) {
    if (e.roomId !== roomId) continue
    // 仅有所有权为 static-decor 时才保留 decor；task-container 接管下即使有 decorId 也剔除
    if (e.ownership === 'static-decor' && e.decorId) {
      set.add(e.decorId)
    }
  }
  return set
}

/**
 * 获取某个房间的"task-container 所有权"集合（用于判定是否应该在 Room3D 里删除对应内联几何）
 */
export function getOwnedContainerIdsForRoom(roomId: RoomId): Set<string> {
  const set = new Set<string>()
  for (const e of furnitureOwnershipRegistry) {
    if (e.roomId !== roomId) continue
    if ((e.ownership === 'task-container' || e.ownership === 'static-base-interactive-top') && e.containerId) {
      set.add(e.containerId)
    }
  }
  return set
}
