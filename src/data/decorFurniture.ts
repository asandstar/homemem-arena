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
      // MVP C1: 缩小碰撞盒从 (2.4, 0.9, 1.0) → (2.0, 0.9, 0.85)
      // 使碰撞 footprint 接近 GLB effectiveAabb (1.96, 0.92, 0.82)，
      // 避免 relocated key (-2.6, 1.9) 落在碰撞盒内导致 LAYOUT_COLLISION_BLOCKER
      size: { x: 2.0, y: 0.9, z: 0.85 },
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
    // ROUND R1 §八：Bedroom — 静态 decor 唯一拥有 bed（static-decor 唯一视觉所有者，§九）
    // 床头柜 cnt-nightstand 由 task container 唯一所有，不新建 decor nightstand。
    // 地毯为单一系统渲染（只有一个 rug 条目）。
    {
      id: 'decor-bed',
      position: { x: 0, y: 0, z: -0.8 },
      // 由 furniture/bedDouble effectiveAabb (1.867, 0.581, 2.199) 略收紧为碰撞盒
      size: { x: 1.87, y: 0.58, z: 2.20 },
      modelAssetId: 'furniture/bedDouble',
    },
    // Bedroom 地毯（唯一系统渲染，所有权 static-decor 单条）
    {
      id: 'decor-bedroom-rug',
      position: { x: 0, y: 0, z: 0.3 },
      // 地毯不参与碰撞（collisionSize 已在 override 设成极小）
      size: { x: 1.57, y: 0.01, z: 0.92 },
      collisionMode: 'none',
      modelAssetId: 'furniture/rugRectangle',
    },
  ],
  dining: [
    // ========== ROUND R2A：DiningKitchen 核心模型实际替换 ==========
    // 餐桌由 cnt-dining-table (task-container) 唯一所有，不再建 decor-dining-table。
    // 垃圾桶由 cnt-trash-bin (task-container) 唯一所有，不再建 decor-kit-trash。
    // 洗碗机由 cnt-dishwasher (task-container, kitchenCabinetDrawer proxy) 唯一所有。
    // 餐具架由 cnt-utensil-rack (task-container) 唯一所有，保持程序化高辨识度模型。

    // 2 把餐椅（furniture/chair）：沿 X 轴对称夹餐桌，static-decor
    // effectiveAabb=(0.48, 1.128, 0.48)；与餐桌 x_extent ±0.842 留 0.218m 间隙
    {
      id: 'decor-chair-1',
      position: { x: -1.3, y: 0, z: 0 },
      size: { x: 0.48, y: 1.128, z: 0.48 },
      rotationY: ROT.FACE_PLUS_X,
      modelAssetId: 'furniture/chair',
    },
    {
      id: 'decor-chair-2',
      position: { x: 1.3, y: 0, z: 0 },
      size: { x: 0.48, y: 1.128, z: 0.48 },
      rotationY: ROT.FACE_NEG_X,
      modelAssetId: 'furniture/chair',
    },

    // 厨房工作区 — 北墙（z=-2.6）：3 件 GLB 紧贴排列
    // kitchenSink 居中，两侧 kitchenCabinetDrawer；effectiveAabb≈0.538×0.6 沿 X 紧贴
    {
      id: 'decor-kit-sink',
      position: { x: 0, y: 0, z: -2.1 },
      size: { x: 0.538, y: 0.613, z: 0.600 },
      rotationY: ROT.FACE_PLUS_Z,
      modelAssetId: 'furniture/kitchenSink',
    },
    {
      id: 'decor-kit-cabinet-1',
      position: { x: -0.6, y: 0, z: -2.1 },
      size: { x: 0.538, y: 0.563, z: 0.600 },
      rotationY: ROT.FACE_PLUS_Z,
      modelAssetId: 'furniture/kitchenCabinetDrawer',
    },
    {
      id: 'decor-kit-cabinet-2',
      position: { x: 0.6, y: 0, z: -2.1 },
      size: { x: 0.538, y: 0.563, z: 0.600 },
      rotationY: ROT.FACE_PLUS_Z,
      modelAssetId: 'furniture/kitchenCabinetDrawer',
    },

    // 墙饰（collisionMode='none'，不碰撞不覆盖门洞）
    {
      id: 'decor-painting',
      position: { x: -2.65, y: 1.2, z: 1.0 },
      size: { x: 0.05, y: 0.55, z: 0.7 },
      rotationY: ROT.FACE_PLUS_X,
      collisionMode: 'none',
    },
    {
      id: 'decor-clock',
      position: { x: 2.65, y: 1.8, z: -1.0 },
      size: { x: 0.05, y: 0.35, z: 0.35 },
      rotationY: ROT.FACE_NEG_X,
      collisionMode: 'none',
    },

    // ========== 已删除（R2A 重构） ==========
    // decor-dining-table: 由 cnt-dining-table (task-container) 唯一所有
    // decor-chair-3/4/5/6: 多余椅子，R2A 仅保留 2 把
    // decor-cabinet: 重复橱柜，由 GLB kitchenCabinetDrawer 取代
    // decor-kit-cabinet-3/4/5/6: 重复橱柜
    // decor-kit-fridge: 无对应 GLB，且与 L1 无关
    // decor-kit-stove/microwave: 无对应 GLB，删除
    // decor-kit-trash: 由 cnt-trash-bin (task-container) 唯一所有
    // decor-kit-shelf: 遮挡标签的装饰
    // decor-kit-chair: 多余椅子
    // decor-kit-plant: 与 L1 无关的落地物体
    // decor-plant-1/2: 与 L1 无关的落地物体
    // decor-shelf: 遮挡标签的装饰
  ],
  entrance: [
    // ROUND R1 §八：Entrance 地毯（唯一系统渲染，所有权 static-decor 单条）
    // entrance tray / umbrella-stand 由 task container 唯一负责，不重复建 decor 条目。
    // coatRackStanding 本轮仅注册不放置（§八）。
    {
      id: 'decor-entrance-rug',
      position: { x: 0, y: 0, z: -1.6 },
      size: { x: 0.86, y: 0.02, z: 0.47 },
      collisionMode: 'none',
      modelAssetId: 'furniture/rugDoormat',
    },
  ],
  laundry: [
    // ========== ROUND R2A：Laundry 核心模型实际替换 ==========
    // 三洗衣篮由 cnt-white/dark/towel-basket (task-container) 唯一所有，保持程序化模型。
    // 严格使用 modelOverrides 中各自 scale（washer 1.65 / dryer 1.70），禁止统一 scale=2。

    // 洗衣机（furniture/washer）：东墙中段，scale=1.65
    // effectiveAabb=(0.644, 0.825, 0.792)；x_extent [1.178, 1.822] 距东墙 0.178m
    {
      id: 'decor-washer',
      position: { x: 1.5, y: 0, z: -0.5 },
      size: { x: 0.644, y: 0.825, z: 0.792 },
      rotationY: ROT.FACE_NEG_X,
      modelAssetId: 'furniture/washer',
    },
    // 烘干机（furniture/dryer）：东墙中段，scale=1.70
    // effectiveAabb=(0.663, 1.02, 0.646)；x_extent [1.169, 1.831] 距东墙 0.169m
    {
      id: 'decor-dryer',
      position: { x: 1.5, y: 0, z: 0.5 },
      size: { x: 0.663, y: 1.02, z: 0.646 },
      rotationY: ROT.FACE_NEG_X,
      modelAssetId: 'furniture/dryer',
    },
    // 矮置物架（furniture/bookcaseOpenLow）：东墙南端，scale=1.6
    // effectiveAabb=(0.64, 0.64, 0.4)；x_extent [1.18, 1.82] 距东墙 0.18m
    {
      id: 'decor-utility-shelf',
      position: { x: 1.5, y: 0, z: 1.5 },
      size: { x: 0.64, y: 0.64, z: 0.4 },
      rotationY: ROT.FACE_NEG_X,
      modelAssetId: 'furniture/bookcaseOpenLow',
    },

    // ========== 已删除（R2A 重构） ==========
    // decor-washer-left/right: 旧程序化黑色机器模型，由 GLB washer/dryer 取代
    // decor-towel-rack: 遮挡三个篮子的旧家具
    // decor-shelf: 遮挡三个篮子的旧家具
    // decor-cabinet-1/2/3: 与任务无关的旧家具
    // decor-trash: 与任务无关
    // decor-plant: 与任务无关
  ],
}
