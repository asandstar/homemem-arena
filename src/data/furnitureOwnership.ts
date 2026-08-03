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
  // 茶几：task-container 接管 → 删除 Room3D 内联 CoffeeTable + decor deprecated
  {
    key: 'living::cnt-coffee-table',
    roomId: 'living',
    containerId: 'cnt-coffee-table',
    decorId: '__DEPRECATED_BY_CONTAINER__coffee-table',
    ownership: 'task-container',
    note: '沙发组中心家具，唯一真身为 Container3D(cnt-coffee-table)，自带 hover/target/放置逻辑',
  },
  // 主沙发 / 侧沙发：static-decor
  {
    key: 'living::decor-sofa-main',
    roomId: 'living',
    decorId: 'decor-sofa-main',
    ownership: 'static-decor',
    note: '北墙靠墙大件沙发',
  },
  {
    key: 'living::decor-sofa-side',
    roomId: 'living',
    decorId: 'decor-sofa-side',
    ownership: 'static-decor',
  },
  // 电视柜 + 电视：static-decor
  {
    key: 'living::decor-tv-stand',
    roomId: 'living',
    decorId: 'decor-tv-stand',
    ownership: 'static-decor',
  },
  {
    key: 'living::decor-tv',
    roomId: 'living',
    decorId: 'decor-tv',
    ownership: 'static-decor',
  },
  // 书架 / 边柜 / 挂画 / 时钟 / 落地灯 / 绿植 / 边几 / 椅子
  {
    key: 'living::decor-bookshelf',
    roomId: 'living',
    decorId: 'decor-bookshelf',
    ownership: 'static-decor',
  },
  {
    key: 'living::decor-shelf',
    roomId: 'living',
    decorId: 'decor-shelf',
    ownership: 'static-decor',
  },
  {
    key: 'living::decor-painting',
    roomId: 'living',
    decorId: 'decor-painting',
    ownership: 'static-decor',
  },
  {
    key: 'living::decor-clock',
    roomId: 'living',
    decorId: 'decor-clock',
    ownership: 'static-decor',
  },
  {
    key: 'living::decor-floor-lamp-1',
    roomId: 'living',
    decorId: 'decor-floor-lamp-1',
    ownership: 'static-decor',
  },
  {
    key: 'living::decor-plant-1',
    roomId: 'living',
    decorId: 'decor-plant-1',
    ownership: 'static-decor',
  },
  {
    key: 'living::decor-plant-2',
    roomId: 'living',
    decorId: 'decor-plant-2',
    ownership: 'static-decor',
  },
  {
    key: 'living::decor-chair',
    roomId: 'living',
    decorId: 'decor-chair',
    ownership: 'static-decor',
  },
  {
    key: 'living::decor-side-table',
    roomId: 'living',
    decorId: 'decor-side-table',
    ownership: 'static-decor',
  },

  // ===================== 玄关 entrance =====================
  // 玄关桌 = static-base，托盘 cnt-entrance-tray = task-container 放桌面上方
  {
    key: 'entrance::decor-entrance-table-base',
    roomId: 'entrance',
    decorId: 'decor-entrance-table-base',
    ownership: 'static-decor',
    note: '玄关桌面静态底座 1.4×0.8×0.45，其上方托盘由 task-container 渲染',
  },
  {
    key: 'entrance::cnt-entrance-tray',
    roomId: 'entrance',
    containerId: 'cnt-entrance-tray',
    ownership: 'task-container',
    note: '玄关托盘（目标区），钥匙/手机/雨伞归位用',
  },
  {
    key: 'entrance::cnt-umbrella-stand',
    roomId: 'entrance',
    containerId: 'cnt-umbrella-stand',
    ownership: 'task-container',
    note: '伞架（任务交互容器）',
  },
  {
    key: 'entrance::decor-shoe-cabinet',
    roomId: 'entrance',
    decorId: 'decor-shoe-cabinet',
    ownership: 'static-decor',
  },
  {
    key: 'entrance::decor-shoes',
    roomId: 'entrance',
    decorId: 'decor-shoes',
    ownership: 'static-decor',
  },
  {
    key: 'entrance::decor-hook',
    roomId: 'entrance',
    decorId: 'decor-hook',
    ownership: 'static-decor',
  },
  {
    key: 'entrance::decor-painting',
    roomId: 'entrance',
    decorId: 'decor-painting',
    ownership: 'static-decor',
  },
  {
    key: 'entrance::decor-clock',
    roomId: 'entrance',
    decorId: 'decor-clock',
    ownership: 'static-decor',
  },
  {
    key: 'entrance::decor-plant-1',
    roomId: 'entrance',
    decorId: 'decor-plant-1',
    ownership: 'static-decor',
  },
  {
    key: 'entrance::decor-plant-2',
    roomId: 'entrance',
    decorId: 'decor-plant-2',
    ownership: 'static-decor',
  },
  {
    key: 'entrance::decor-shelf',
    roomId: 'entrance',
    decorId: 'decor-shelf',
    ownership: 'static-decor',
  },

  // ===================== 餐厅 dining =====================
  // 餐桌：task-container 接管 → 删除 Room3D 内联 dining-table & decor deprecated
  {
    key: 'dining::cnt-dining-table',
    roomId: 'dining',
    containerId: 'cnt-dining-table',
    decorId: '__DEPRECATED_BY_CONTAINER__dining-table',
    ownership: 'task-container',
    note: '餐厅核心家具，唯一真身为 Container3D(cnt-dining-table)，放 L1 脏碗 & L4 早餐',
  },
  // 三件套：洗碗机/垃圾桶/餐具架
  {
    key: 'dining::cnt-dishwasher',
    roomId: 'dining',
    containerId: 'cnt-dishwasher',
    ownership: 'task-container',
  },
  {
    key: 'dining::cnt-trash-bin',
    roomId: 'dining',
    containerId: 'cnt-trash-bin',
    ownership: 'task-container',
  },
  {
    key: 'dining::cnt-utensil-rack',
    roomId: 'dining',
    containerId: 'cnt-utensil-rack',
    ownership: 'task-container',
  },
  // 4 把椅子围绕餐桌（static-decor，因为没有打开/放置逻辑）
  {
    key: 'dining::decor-chair-1',
    roomId: 'dining',
    decorId: 'decor-chair-1',
    ownership: 'static-decor',
  },
  {
    key: 'dining::decor-chair-2',
    roomId: 'dining',
    decorId: 'decor-chair-2',
    ownership: 'static-decor',
  },
  {
    key: 'dining::decor-chair-3',
    roomId: 'dining',
    decorId: 'decor-chair-3',
    ownership: 'static-decor',
  },
  {
    key: 'dining::decor-chair-4',
    roomId: 'dining',
    decorId: 'decor-chair-4',
    ownership: 'static-decor',
  },
  // 西墙边柜、小边架、挂画、时钟、绿植
  {
    key: 'dining::decor-cabinet',
    roomId: 'dining',
    decorId: 'decor-cabinet',
    ownership: 'static-decor',
  },
  {
    key: 'dining::decor-shelf',
    roomId: 'dining',
    decorId: 'decor-shelf',
    ownership: 'static-decor',
  },
  {
    key: 'dining::decor-painting',
    roomId: 'dining',
    decorId: 'decor-painting',
    ownership: 'static-decor',
  },
  {
    key: 'dining::decor-clock',
    roomId: 'dining',
    decorId: 'decor-clock',
    ownership: 'static-decor',
  },
  {
    key: 'dining::decor-plant-1',
    roomId: 'dining',
    decorId: 'decor-plant-1',
    ownership: 'static-decor',
  },
  {
    key: 'dining::decor-plant-2',
    roomId: 'dining',
    decorId: 'decor-plant-2',
    ownership: 'static-decor',
  },

  // ===================== 卧室 bedroom =====================
  // 床头柜（抽屉）：task-container 接管
  {
    key: 'bedroom::cnt-nightstand',
    roomId: 'bedroom',
    containerId: 'cnt-nightstand',
    decorId: 'decor-nightstand-left',
    ownership: 'task-container',
    note: 'L2 找手机场景抽屉；原 decor-nightstand-left 标记为 deprecated，仅 Container3D 渲染',
  },
  {
    key: 'bedroom::decor-bed',
    roomId: 'bedroom',
    decorId: 'decor-bed',
    ownership: 'static-decor',
  },
  {
    key: 'bedroom::decor-desk',
    roomId: 'bedroom',
    decorId: 'decor-desk',
    ownership: 'static-decor',
  },
  {
    key: 'bedroom::decor-wardrobe',
    roomId: 'bedroom',
    decorId: 'decor-wardrobe',
    ownership: 'static-decor',
  },
  {
    key: 'bedroom::decor-dresser',
    roomId: 'bedroom',
    decorId: 'decor-dresser',
    ownership: 'static-decor',
  },
  {
    key: 'bedroom::decor-bookshelf',
    roomId: 'bedroom',
    decorId: 'decor-bookshelf',
    ownership: 'static-decor',
  },
  {
    key: 'bedroom::decor-painting',
    roomId: 'bedroom',
    decorId: 'decor-painting',
    ownership: 'static-decor',
  },
  {
    key: 'bedroom::decor-clock',
    roomId: 'bedroom',
    decorId: 'decor-clock',
    ownership: 'static-decor',
  },
  {
    key: 'bedroom::decor-chair',
    roomId: 'bedroom',
    decorId: 'decor-chair',
    ownership: 'static-decor',
  },
  {
    key: 'bedroom::decor-plant',
    roomId: 'bedroom',
    decorId: 'decor-plant',
    ownership: 'static-decor',
  },

  // ===================== 厨房 kitchen =====================
  // 冰箱（早餐任务）：位置在西墙中段，取代同位置的 decor-cabinet-2 和 decor-fridge（北角那个）
  {
    key: 'kitchen::cnt-fridge',
    roomId: 'kitchen',
    containerId: 'cnt-fridge',
    decorId: 'decor-cabinet-2',
    ownership: 'task-container',
    note: '早餐任务拿牛奶；取代西墙原下柜 decor-cabinet-2 位置渲染/碰撞',
  },
  {
    key: 'kitchen::cnt-sink',
    roomId: 'kitchen',
    containerId: 'cnt-sink',
    ownership: 'task-container',
  },
  {
    key: 'kitchen::cnt-dishwasher',
    roomId: 'kitchen',
    containerId: 'cnt-dishwasher',
    ownership: 'task-container',
  },
  // 下层橱柜（早餐任务放麦片/杯碗）：南墙中段，取代 decor-cabinet-4
  {
    key: 'kitchen::cnt-cabinet-lower',
    roomId: 'kitchen',
    containerId: 'cnt-cabinet-lower',
    decorId: 'decor-cabinet-4',
    ownership: 'task-container',
    note: '早餐任务下层柜体（放麦片/杯碗）；直接接管南墙中柜 decor-cabinet-4',
  },
  // 上层橱柜（早餐任务麦片最终归位）：吊柜非落地，不与 decor 冲突
  {
    key: 'kitchen::cnt-cabinet-upper',
    roomId: 'kitchen',
    containerId: 'cnt-cabinet-upper',
    ownership: 'task-container',
    note: '早餐任务上层吊柜，非落地家具（size.z<0.15），不参与地面重叠',
  },
  // 下柜 1/3/5/6 保留 static-decor（2/4 被 task-container 接管）
  {
    key: 'kitchen::decor-cabinet-1',
    roomId: 'kitchen',
    decorId: 'decor-cabinet-1',
    ownership: 'static-decor',
  },
  {
    key: 'kitchen::decor-cabinet-3',
    roomId: 'kitchen',
    decorId: 'decor-cabinet-3',
    ownership: 'static-decor',
  },
  {
    key: 'kitchen::decor-cabinet-5',
    roomId: 'kitchen',
    decorId: 'decor-cabinet-5',
    ownership: 'static-decor',
  },
  {
    key: 'kitchen::decor-cabinet-6',
    roomId: 'kitchen',
    decorId: 'decor-cabinet-6',
    ownership: 'static-decor',
  },
  // 备注：原 decor-fridge（东北角）和 decor-cabinet-2（西墙中段）已由 cnt-fridge 所有权取代，
  // 但 decor-fridge id 未注册 active 所以 getActiveDecorIdsForRoom 会自动剔除。保留一条 deprecated
  // 标记的说明性条目（不注册 ownership，即可被过滤掉）：无需额外写。
  {
    key: 'kitchen::decor-cabinet-5',
    roomId: 'kitchen',
    decorId: 'decor-cabinet-5',
    ownership: 'static-decor',
  },
  {
    key: 'kitchen::decor-cabinet-6',
    roomId: 'kitchen',
    decorId: 'decor-cabinet-6',
    ownership: 'static-decor',
  },
  {
    key: 'kitchen::decor-sink',
    roomId: 'kitchen',
    decorId: 'decor-sink',
    ownership: 'static-decor',
    note: '仅水槽上半部分视觉；下柜交互由 cnt-sink 接管',
  },
  {
    key: 'kitchen::decor-stove',
    roomId: 'kitchen',
    decorId: 'decor-stove',
    ownership: 'static-decor',
  },
  {
    key: 'kitchen::decor-microwave',
    roomId: 'kitchen',
    decorId: 'decor-microwave',
    ownership: 'static-decor',
  },
  {
    key: 'kitchen::decor-trash',
    roomId: 'kitchen',
    decorId: 'decor-trash',
    ownership: 'static-decor',
  },
  {
    key: 'kitchen::decor-shelf',
    roomId: 'kitchen',
    decorId: 'decor-shelf',
    ownership: 'static-decor',
  },
  {
    key: 'kitchen::decor-plant',
    roomId: 'kitchen',
    decorId: 'decor-plant',
    ownership: 'static-decor',
  },
  {
    key: 'kitchen::decor-chair',
    roomId: 'kitchen',
    decorId: 'decor-chair',
    ownership: 'static-decor',
  },

  // ===================== 洗衣房 laundry =====================
  // 三洗衣篮：task-containers 接管，原 decor-basket-* 全部 deprecated
  {
    key: 'laundry::cnt-basket-white',
    roomId: 'laundry',
    containerId: 'cnt-basket-white',
    decorId: 'decor-basket-red',
    ownership: 'task-container',
    note: 'L3 三篮之一；原 decor 三个全部在 task-container 之上替换渲染',
  },
  {
    key: 'laundry::cnt-basket-dark',
    roomId: 'laundry',
    containerId: 'cnt-basket-dark',
    decorId: 'decor-basket-blue',
    ownership: 'task-container',
  },
  {
    key: 'laundry::cnt-basket-towel',
    roomId: 'laundry',
    containerId: 'cnt-basket-towel',
    decorId: 'decor-basket-green',
    ownership: 'task-container',
  },
  {
    key: 'laundry::decor-washer-left',
    roomId: 'laundry',
    decorId: 'decor-washer-left',
    ownership: 'static-decor',
  },
  {
    key: 'laundry::decor-washer-right',
    roomId: 'laundry',
    decorId: 'decor-washer-right',
    ownership: 'static-decor',
  },
  {
    key: 'laundry::decor-towel-rack',
    roomId: 'laundry',
    decorId: 'decor-towel-rack',
    ownership: 'static-decor',
  },
  {
    key: 'laundry::decor-cabinet-1',
    roomId: 'laundry',
    decorId: 'decor-cabinet-1',
    ownership: 'static-decor',
  },
  {
    key: 'laundry::decor-cabinet-2',
    roomId: 'laundry',
    decorId: 'decor-cabinet-2',
    ownership: 'static-decor',
  },
  {
    key: 'laundry::decor-cabinet-3',
    roomId: 'laundry',
    decorId: 'decor-cabinet-3',
    ownership: 'static-decor',
  },
  {
    key: 'laundry::decor-shelf',
    roomId: 'laundry',
    decorId: 'decor-shelf',
    ownership: 'static-decor',
  },
  {
    key: 'laundry::decor-trash',
    roomId: 'laundry',
    decorId: 'decor-trash',
    ownership: 'static-decor',
  },
  {
    key: 'laundry::decor-plant',
    roomId: 'laundry',
    decorId: 'decor-plant',
    ownership: 'static-decor',
  },
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
