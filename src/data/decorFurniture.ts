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
    // 设计文档 docs/DESIGN_ROOM_LAYOUT.md §3.2 客厅布局（R3 草案）
    // 沙发北移 z=0.8 与电视柜 z=-2.4 间距 2.78m（合理观看距离 2.5–3.0m）
    // 电视柜贴北墙 x=-2.25 避开餐厨门洞 clearance（x∈[-1.2,1.2]）
    // 茶几由 cnt-coffee-table (task-container) 唯一负责，居于沙发与电视之间 (-1.5, 0, -0.5)
    {
      id: 'decor-tv-stand',
      position: { x: -2.25, y: 0, z: -2.4 },
      size: { x: 2.0, y: 0.55, z: 0.45 },
      rotationY: ROT.FACE_PLUS_Z,
      modelAssetId: 'furniture/cabinetTelevision',
    },
    {
      id: 'decor-tv',
      // 电视放在柜顶 y=0.62（柜 effectiveAabb y），面朝 +Z 看沙发
      position: { x: -2.25, y: 0.62, z: -2.4 },
      size: { x: 1.6, y: 1.0, z: 0.15 },
      rotationY: ROT.FACE_PLUS_Z,
      collisionMode: 'none',
      modelAssetId: 'furniture/televisionModern',
    },
    // 落地式音箱：电视柜两侧前方地面（y=0，原 y=0.55 悬空已修复）
    {
      id: 'decor-speaker-l',
      position: { x: -3.0, y: 0, z: -1.9 },
      size: { x: 0.266, y: 0.536, z: 0.24 },
      rotationY: ROT.FACE_PLUS_Z,
      modelAssetId: 'furniture/speakerSmall',
    },
    {
      id: 'decor-speaker-r',
      position: { x: -1.5, y: 0, z: -1.9 },
      size: { x: 0.266, y: 0.536, z: 0.24 },
      rotationY: ROT.FACE_PLUS_Z,
      modelAssetId: 'furniture/speakerSmall',
    },
    {
      id: 'decor-sofa-main',
      // 沙发北移：z=2.24→0.8，与电视柜(z=-2.4)间距缩至 2.78m
      // 面朝 -Z（北）看电视；x=-1.5 距西墙 1.75m，西墙门洞 clearance 完全畅通
      position: { x: -1.5, y: 0, z: 0.8 },
      size: { x: 2.0, y: 0.9, z: 0.85 },
      rotationY: ROT.FACE_NEG_Z,
      modelAssetId: 'furniture/loungeSofa',
    },
    // 圆形地毯：居于沙发与电视之间，茶几压在其上
    {
      id: 'decor-living-rug-round',
      position: { x: -1.5, y: 0, z: -0.2 },
      size: { x: 1.84, y: 0.02, z: 1.84 },
      rotationY: ROT.FACE_PLUS_Z,
      collisionMode: 'none',
      modelAssetId: 'furniture/rugRound',
    },
    // 书架：贴东墙南段 (2.9, 1.5)，面朝 -X，避开玄关门 z=-1.1；0.10m margin 内移
    {
      id: 'decor-bookshelf',
      position: { x: 2.9, y: 0, z: 1.5 },
      size: { x: 0.8, y: 1.8, z: 0.35 },
      rotationY: ROT.FACE_NEG_X,
      modelAssetId: 'furniture/bookcaseOpen',
    },
    // 落地灯：西墙南段，沙发左后方
    {
      id: 'decor-floor-lamp',
      position: { x: -2.8, y: 0, z: 1.5 },
      size: { x: 0.304, y: 1.72, z: 0.351 },
      rotationY: ROT.FACE_PLUS_Z,
      modelAssetId: 'furniture/lampRoundFloor',
    },
    // 休闲椅：东墙中段 (2.0, -0.5)，面朝 -X 加入会客区
    {
      id: 'decor-lounge-chair',
      position: { x: 2.0, y: 0, z: -0.5 },
      size: { x: 0.98, y: 0.92, z: 0.82 },
      rotationY: ROT.FACE_NEG_X,
      modelAssetId: 'furniture/loungeChair',
    },
    // 三处盆栽：三个角落
    {
      id: 'decor-plant-1',
      position: { x: 2.8, y: 0, z: 2.2 },
      size: { x: 0.303, y: 0.448, z: 0.303 },
      rotationY: ROT.FACE_PLUS_Z,
      collisionMode: 'none',
      modelAssetId: 'furniture/plantSmall1',
    },
    {
      id: 'decor-plant-2',
      position: { x: -2.8, y: 0, z: 2.2 },
      size: { x: 0.303, y: 0.448, z: 0.303 },
      rotationY: ROT.FACE_PLUS_Z,
      collisionMode: 'none',
      modelAssetId: 'furniture/plantSmall2',
    },
    {
      id: 'decor-plant-3',
      position: { x: 2.8, y: 0, z: -2.0 },
      size: { x: 0.272, y: 0.464, z: 0.314 },
      rotationY: ROT.FACE_PLUS_Z,
      collisionMode: 'none',
      modelAssetId: 'furniture/plantSmall3',
    },
    // ========== 墙饰（collisionMode='none'，不碰撞不覆盖门洞） ==========
    // 西墙挂画：沙发上方墙面
    {
      id: 'decor-painting',
      position: { x: -3.2, y: 1.2, z: 1.5 },
      size: { x: 0.8, y: 0.6, z: 0.05 },
      rotationY: ROT.FACE_PLUS_X,
      collisionMode: 'none',
    },
    // 东墙挂钟：书架对面墙面
    {
      id: 'decor-clock',
      position: { x: 3.2, y: 1.8, z: 0 },
      size: { x: 0.4, y: 0.4, z: 0.05 },
      rotationY: ROT.FACE_NEG_X,
      collisionMode: 'none',
    },
    // ========== 已删除（R3 重构） ==========
    // decor-sofa-side: 侵入 Bedroom-Entrance 走廊，A6 移除
    // decor-side-table: 与 A6 无关的旧落地家具，本轮移除
    // decor-chair: 与 A6 无关的旧落地家具，本轮移除
    // decor-shelf: 越界且遮挡，本轮移除
  ],
  bedroom: [
    // 设计文档 docs/DESIGN_ROOM_LAYOUT.md §3.1 卧室布局
    // 床头贴北墙，床头柜在床两侧，大衣柜迁西墙南段，玩具熊在床头枕头区
    {
      id: 'decor-bed',
      // 床头贴北墙：床中心 z=-1.4，床头 z≈-2.5（贴墙），床尾 z≈-0.3
      position: { x: 0, y: 0, z: -1.4 },
      // 由 furniture/bedDouble effectiveAabb (1.867, 0.581, 2.199) 略收紧为碰撞盒
      size: { x: 1.87, y: 0.58, z: 2.20 },
      modelAssetId: 'furniture/bedDouble',
    },
    // 大衣柜：迁至西墙南段 (-1.79, 1.6)，柜门朝 +Z，腾出北墙给床头
    {
      id: 'decor-bedroom-wardrobe',
      position: { x: -1.79, y: 0, z: 1.6 },
      size: { x: 1.224, y: 1.073, z: 1.0 },
      rotationY: ROT.FACE_PLUS_Z,
      modelAssetId: 'furniture/cabinetBed',
    },
    // 床头柜 1：床左侧 (x=-1.35, z=-2.0)，对齐枕头区
    {
      id: 'decor-nightstand-left',
      position: { x: -1.35, y: 0, z: -2.0 },
      size: { x: 0.612, y: 0.605, z: 0.877 },
      rotationY: ROT.FACE_PLUS_Z,
      modelAssetId: 'furniture/cabinetBedDrawerTable',
    },
    // 床头柜 2：床右侧 (x=1.35, z=-2.0)，与左侧对称
    {
      id: 'decor-nightstand-right',
      position: { x: 1.35, y: 0, z: -2.0 },
      size: { x: 0.612, y: 0.605, z: 0.877 },
      rotationY: ROT.FACE_PLUS_Z,
      modelAssetId: 'furniture/cabinetBedDrawerTable',
    },
    // 西侧床头柜台灯：y=台面高 0.605
    {
      id: 'decor-nightstand-lamp-l',
      position: { x: -1.35, y: 0.605, z: -2.0 },
      size: { x: 0.274, y: 0.566, z: 0.316 },
      rotationY: ROT.FACE_PLUS_Z,
      collisionMode: 'none',
      modelAssetId: 'furniture/lampRoundTable',
    },
    // 东侧床头柜台灯（新增，对称）
    {
      id: 'decor-nightstand-lamp-r',
      position: { x: 1.35, y: 0.605, z: -2.0 },
      size: { x: 0.274, y: 0.566, z: 0.316 },
      rotationY: ROT.FACE_PLUS_Z,
      collisionMode: 'none',
      modelAssetId: 'furniture/lampRoundTable',
    },
    // 玩具熊：放在床头枕头区 (y=0.32 床面高度，z=-2.0 对齐枕头区)
    {
      id: 'decor-toy-bear',
      position: { x: 0.5, y: 0.32, z: -2.0 },
      size: { x: 0.312, y: 0.36, z: 0.198 },
      rotationY: ROT.FACE_PLUS_Z,
      collisionMode: 'none',
      modelAssetId: 'furniture/bear',
    },
    // 地毯：移到床尾南方 (z=0.7)，完全位于床尾外，外露完整
    {
      id: 'decor-bedroom-rug',
      position: { x: 0, y: 0, z: 0.7 },
      size: { x: 1.57, y: 0.01, z: 0.92 },
      collisionMode: 'none',
      modelAssetId: 'furniture/rugRectangle',
    },
    // 浴室镜：西墙挂镜 (-2.3, 1.4, 0.3)，柜门上方墙面
    {
      id: 'decor-bedroom-mirror',
      position: { x: -2.3, y: 1.4, z: 0.3 },
      size: { x: 0.603, y: 0.869, z: 0.289 },
      rotationY: ROT.FACE_PLUS_X,
      collisionMode: 'none',
      modelAssetId: 'furniture/bathroomMirror',
    },
  ],
  dining: [
    // ========== ROUND R2A：DiningKitchen 核心模型实际替换 ==========
    // 餐桌由 cnt-dining-table (task-container) 唯一所有，不再建 decor-dining-table。
    // 垃圾桶由 cnt-trash-bin (task-container) 唯一所有，不再建 decor-kit-trash。
    // 洗碗机由 cnt-dishwasher (task-container, kitchenCabinetDrawer proxy) 唯一所有。
    // 餐具架由 cnt-utensil-rack (task-container) 唯一所有，保持程序化高辨识度模型。

    // 4 把餐椅（furniture/chair）：围绕餐桌（task-container cnt-dining-table 在 (0,0,0.3)），static-decor
    {
      id: 'decor-chair-1',
      position: { x: -1.3, y: 0, z: 0.3 },
      size: { x: 0.48, y: 1.128, z: 0.48 },
      rotationY: ROT.FACE_PLUS_X,
      modelAssetId: 'furniture/chair',
    },
    {
      id: 'decor-chair-2',
      position: { x: 1.3, y: 0, z: 0.3 },
      size: { x: 0.48, y: 1.128, z: 0.48 },
      rotationY: ROT.FACE_NEG_X,
      modelAssetId: 'furniture/chair',
    },
    {
      id: 'decor-chair-3',
      position: { x: 0, y: 0, z: -0.5 },
      size: { x: 0.48, y: 1.128, z: 0.48 },
      rotationY: ROT.FACE_PLUS_Z,
      modelAssetId: 'furniture/chair',
    },
    {
      id: 'decor-chair-4',
      position: { x: 0, y: 0, z: 1.1 },
      size: { x: 0.48, y: 1.128, z: 0.48 },
      rotationY: ROT.FACE_NEG_Z,
      modelAssetId: 'furniture/chair',
    },

    // 厨房工作区 — 北墙（z=-2.3）：冰箱+橱柜+水槽+橱柜+灶台，家具深度0.6m → 后沿贴北墙z=-2.6
    {
      id: 'decor-kit-fridge',
      // x = -2.75（西墙） + 0.774/2 = -2.363，贴西墙
      position: { x: -2.36, y: 0, z: -2.31 },
      size: { x: 0.774, y: 1.656, z: 0.57 },
      rotationY: ROT.FACE_PLUS_X,
      modelAssetId: 'furniture/kitchenFridge',
    },
    {
      id: 'decor-kit-cabinet-1',
      position: { x: -0.6, y: 0, z: -2.3 },
      size: { x: 0.538, y: 0.563, z: 0.600 },
      rotationY: ROT.FACE_PLUS_Z,
      modelAssetId: 'furniture/kitchenCabinetDrawer',
    },
    {
      id: 'decor-kit-sink',
      position: { x: 0, y: 0, z: -2.3 },
      size: { x: 0.538, y: 0.613, z: 0.600 },
      rotationY: ROT.FACE_PLUS_Z,
      modelAssetId: 'furniture/kitchenSink',
    },
    {
      id: 'decor-kit-cabinet-2',
      position: { x: 0.6, y: 0, z: -2.3 },
      size: { x: 0.538, y: 0.563, z: 0.600 },
      rotationY: ROT.FACE_PLUS_Z,
      modelAssetId: 'furniture/kitchenCabinetDrawer',
    },
    {
      id: 'decor-kit-stove',
      position: { x: 1.2, y: 0, z: -2.3 },
      size: { x: 0.538, y: 0.563, z: 0.6 },
      rotationY: ROT.FACE_PLUS_Z,
      modelAssetId: 'furniture/kitchenStove',
    },
    // 收音机：放 cabinet-1 台面 (-0.6, 0.563, -2.1) 后沿贴墙
    {
      id: 'decor-kit-radio',
      position: { x: -0.6, y: 0.563, z: -2.1 },
      size: { x: 0.567, y: 0.411, z: 0.176 },
      rotationY: ROT.FACE_PLUS_Z,
      collisionMode: 'none',
      modelAssetId: 'furniture/radio',
    },
    // 微波炉：缩小后居中放稳在 cabinet-2 台面，四周留出余量。
    {
      id: 'decor-kit-microwave',
      position: { x: 0.6, y: 0.563, z: -2.3 },
      size: { x: 0.435, y: 0.27, z: 0.345 },
      rotationY: ROT.FACE_PLUS_Z,
      collisionMode: 'none',
      modelAssetId: 'furniture/kitchenMicrowave',
    },
    // 大盆栽：厨房东南角
    {
      id: 'decor-kit-plant',
      position: { x: 2.4, y: 0, z: 2.0 },
      size: { x: 0.408, y: 0.857, z: 0.466 },
      rotationY: ROT.FACE_PLUS_Z,
      collisionMode: 'none',
      modelAssetId: 'furniture/pottedPlant',
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
    // 设计文档 docs/DESIGN_ROOM_LAYOUT.md §3.4 玄关布局
    // 门垫移到门内侧，挂衣架贴西墙北侧，新增鞋柜、穿衣镜、盆栽、南墙挂画
    {
      id: 'decor-entrance-rug',
      position: { x: -0.5, y: 0, z: 0.5 },
      size: { x: 0.86, y: 0.02, z: 0.47 },
      collisionMode: 'none',
      modelAssetId: 'furniture/rugDoormat',
    },
    // 挂衣架：贴西墙北侧 (-1.2, -1.0)，避开门洞 clearance
    {
      id: 'decor-entrance-coatrack',
      position: { x: -1.2, y: 0, z: -1.0 },
      size: { x: 0.6, y: 1.694, z: 0.6 },
      rotationY: ROT.FACE_PLUS_Z,
      modelAssetId: 'furniture/coatRackStanding',
    },
    // 鞋柜：贴北墙 (0.5, -1.9)
    {
      id: 'decor-entrance-shoe-cabinet',
      position: { x: 0.5, y: 0, z: -1.9 },
      size: { x: 0.855, y: 0.615, z: 0.618 },
      rotationY: ROT.FACE_PLUS_Z,
      modelAssetId: 'furniture/sideTableDrawers',
    },
    // 穿衣镜：东墙 (1.4, 1.4, 0)，collisionMode='none'
    {
      id: 'decor-entrance-mirror',
      position: { x: 1.4, y: 1.4, z: 0 },
      size: { x: 0.603, y: 0.869, z: 0.289 },
      rotationY: ROT.FACE_NEG_X,
      collisionMode: 'none',
      modelAssetId: 'furniture/bathroomMirror',
    },
    // 东南角小盆栽
    {
      id: 'decor-entrance-plant',
      position: { x: 1.0, y: 0, z: 1.5 },
      size: { x: 0.303, y: 0.448, z: 0.303 },
      rotationY: ROT.FACE_PLUS_Z,
      collisionMode: 'none',
      modelAssetId: 'furniture/plantSmall1',
    },
    // 南墙挂画
    {
      id: 'decor-entrance-painting',
      position: { x: 0, y: 1.5, z: 2.2 },
      size: { x: 0.6, y: 0.4, z: 0.05 },
      rotationY: ROT.FACE_NEG_Z,
      collisionMode: 'none',
    },
  ],
  laundry: [
    // 设计文档 docs/DESIGN_ROOM_LAYOUT.md §3.5 洗衣房布局
    // 东墙机器 + 南墙储物柜 + 西南角盆栽 + 北墙挂钟 + 中央分拣区
    {
      id: 'decor-washer',
      position: { x: 1.5, y: 0, z: -0.5 },
      size: { x: 0.644, y: 0.825, z: 0.792 },
      rotationY: ROT.FACE_NEG_X,
      modelAssetId: 'furniture/washer',
    },
    {
      id: 'decor-dryer',
      position: { x: 1.5, y: 0, z: 0.5 },
      size: { x: 0.663, y: 1.02, z: 0.646 },
      rotationY: ROT.FACE_NEG_X,
      modelAssetId: 'furniture/dryer',
    },
    // 烘干机上方台面：放洗衣液（用 mug 模型）
    {
      id: 'decor-laundry-detergent',
      position: { x: 1.5, y: 1.02, z: 0.5 },
      size: { x: 0.08, y: 0.08, z: 0.08 },
      rotationY: ROT.FACE_PLUS_Z,
      collisionMode: 'none',
      modelAssetId: 'food/mug',
    },
    {
      id: 'decor-utility-shelf',
      position: { x: 1.5, y: 0, z: 1.5 },
      size: { x: 0.64, y: 0.64, z: 0.4 },
      rotationY: ROT.FACE_NEG_X,
      modelAssetId: 'furniture/bookcaseOpenLow',
    },
    // 置物架上面放几本书（说明书）
    {
      id: 'decor-laundry-books',
      position: { x: 1.5, y: 0.64, z: 1.5 },
      size: { x: 0.18, y: 0.13, z: 0.18 },
      rotationY: ROT.FACE_PLUS_Z,
      collisionMode: 'none',
      modelAssetId: 'furniture/books',
    },
    // 储物柜：贴南墙 (0, 1.9)
    {
      id: 'decor-laundry-cabinet',
      position: { x: 0, y: 0, z: 1.9 },
      size: { x: 0.8, y: 1.7, z: 0.5 },
      rotationY: ROT.FACE_PLUS_Z,
      modelAssetId: 'furniture/bookcaseClosed',
    },
    // 储物柜里放一个洗衣篮装饰
    {
      id: 'decor-laundry-bin',
      position: { x: 0, y: 0.85, z: 1.9 },
      size: { x: 0.2, y: 0.2, z: 0.2 },
      rotationY: ROT.FACE_PLUS_Z,
      collisionMode: 'none',
    },
    // 西墙折叠桌：分拣辅助台
    {
      id: 'decor-folding-table',
      position: { x: -1.2, y: 0, z: -0.3 },
      size: { x: 0.84, y: 0.33, z: 0.45 },
      rotationY: ROT.FACE_PLUS_Z,
      modelAssetId: 'furniture/sideTable',
    },
    // 折叠桌上放一个分类盘
    {
      id: 'decor-sorting-plate',
      position: { x: -1.2, y: 0.33, z: -0.3 },
      size: { x: 0.2, y: 0.03, z: 0.2 },
      rotationY: ROT.FACE_PLUS_Z,
      collisionMode: 'none',
      modelAssetId: 'food/plate',
    },
    // 西南角盆栽
    {
      id: 'decor-laundry-plant',
      position: { x: -1.5, y: 0, z: 1.5 },
      size: { x: 0.303, y: 0.448, z: 0.303 },
      rotationY: ROT.FACE_PLUS_Z,
      collisionMode: 'none',
      modelAssetId: 'furniture/plantSmall2',
    },
    // 北墙挂钟
    {
      id: 'decor-laundry-clock',
      position: { x: 0, y: 1.8, z: -2.1 },
      size: { x: 0.35, y: 0.35, z: 0.05 },
      rotationY: ROT.FACE_PLUS_Z,
      collisionMode: 'none',
    },
    // 门旁墙面装饰：钩子挂一条毛巾（视觉提示区域）
    {
      id: 'decor-wall-hook-towel',
      position: { x: -1.9, y: 1.2, z: 0.525 },
      size: { x: 0.15, y: 0.4, z: 0.05 },
      rotationY: ROT.FACE_PLUS_X,
      collisionMode: 'none',
      modelAssetId: 'furniture/pillowLong',
    },
  ],
}
