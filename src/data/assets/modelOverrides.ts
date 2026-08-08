/**
 * src/data/assets/modelOverrides.ts
 *
 * ROUND R1 §六/七：Model Registry 的运行时校准参数。
 *
 * 每个条目独立字面值（per-entry literal）。
 * 禁止 GLOBAL_FURNITURE_SCALE，禁止统一 scale=2，禁止共享类别级 scale。
 * 初次接入 status=provisional；未经浏览器截图标定不得标记为 calibrated。
 */

import type { ModelAssetId, Vec3 } from './modelRegistry'

export interface ModelOverride {
  uniformScale: number
  pivotOffset: Vec3
  rotationOffset?: { x?: number; y?: number; z?: number }
  effectiveAabb: Vec3
  collisionSize: Vec3
  floorAligned: boolean
  status?: 'provisional' | 'calibrated'
}

type ModelOverrideMap = Record<ModelAssetId, ModelOverride> & {
  __DEFAULT__: ModelOverride
}

// ============================================================
// 每条 override 的计算来源（§七：校准目标尺寸）：
//   1. 取 rawAabb = (rx,ry,rz)
//   2. 目标尺寸 (tx,ty,tz) 对应三主轴：
//        uniformScale = min(tx/rx, tz/rz, ty?ty/ry:Infinity)   // 等比缩放
//   3. pivotOffset = 把模型 bottom-center 对齐世界原点：
//        x = -(rawAabbMax.x + rawAabbMin.x)/2
//        y = -rawAabbMin.y                                   // 底面贴地
//        z = -(rawAabbMax.z + rawAabbMin.z)/2
//   4. effectiveAabb = rawAabb * uniformScale
//   5. collisionSize = 比 effectiveAabb 略收紧（85% 宽深，100% 高或适当上限）
// ============================================================

export const MODEL_OVERRIDES: ModelOverrideMap = {
  __DEFAULT__: {
    uniformScale: 1,
    pivotOffset: { x: 0, y: 0, z: 0 },
    effectiveAabb: { x: 0.5, y: 0.5, z: 0.5 },
    collisionSize: { x: 0.45, y: 0.45, z: 0.45 },
    floorAligned: true,
    status: 'provisional',
  },

  // —— Living ——
  // Living A6 核心坐标禁止改变（§十一限制）。保留 WP0A 经验 scale = 2
  'furniture/loungeSofa': {
    uniformScale: 2,
    pivotOffset: { x: -0.49, y: 0, z: 0.205 },        // rawMin=[0,0,-0.41] rawMax=[0.98,0.46,0]
    effectiveAabb: { x: 1.96, y: 0.92, z: 0.82 },
    collisionSize: { x: 1.8, y: 0.92, z: 0.72 },
    floorAligned: true,
    status: 'provisional',
  },
  'furniture/tableCoffee': {
    uniformScale: 2,
    pivotOffset: { x: 0.130498, y: 0, z: 0.1 },       // rawMin=[-0.46,0,-0.3] rawMax=[0.2,0.23,0.1]
    effectiveAabb: { x: 1.321992, y: 0.46, z: 0.8 },
    collisionSize: { x: 1.18, y: 0.46, z: 0.72 },
    floorAligned: true,
    status: 'provisional',
  },
  'furniture/cabinetTelevision': {
    uniformScale: 2,
    pivotOffset: { x: -0.4, y: 0, z: 0.125 },         // rawMin=[0,0,-0.25] rawMax=[0.8,0.31,0]
    effectiveAabb: { x: 1.6, y: 0.62, z: 0.5 },
    collisionSize: { x: 1.5, y: 0.62, z: 0.45 },
    floorAligned: true,
    status: 'provisional',
  },
  'furniture/televisionModern': {
    uniformScale: 2,
    pivotOffset: { x: 0, y: 0, z: 0 },                // rawMin=[-0.34,0,-0.06] rawMax=[0.34,0.45,0.06]
    effectiveAabb: { x: 1.3696, y: 0.9095, z: 0.2568 },
    collisionSize: { x: 1.28, y: 0.9, z: 0.24 },
    floorAligned: true,
    status: 'provisional',
  },
  'furniture/bookcaseOpen': {
    uniformScale: 2,
    pivotOffset: { x: -0.2, y: 0, z: 0.125 },         // rawMin=[0,0,-0.25] rawMax=[0.4,0.88,0]
    effectiveAabb: { x: 0.8, y: 1.76, z: 0.5 },
    collisionSize: { x: 0.76, y: 1.76, z: 0.46 },
    floorAligned: true,
    status: 'provisional',
  },

  // —— Bedroom ——
  // target: 1.6–1.9m × 2.0–2.2m
  // rawAabb: (1.623, 0.505, 1.912)    rawMin=[-0.059,-0.13,-1.892] rawMax=[1.565,0.375,0.02]
  'furniture/bedDouble': {
    uniformScale: 1.15,
    pivotOffset: { x: -0.7530715, y: 0.13, z: 0.936 },
    effectiveAabb: { x: 1.867, y: 0.581, z: 2.199 },
    collisionSize: { x: 1.867, y: 0.55, z: 2.199 },
    floorAligned: true,
    status: 'provisional',
  },
  // target: 宽 0.5–0.7m  rawAabb=(0.266, 0.2632, 0.3813)
  // rawMin=[-0.01,0,-0.205] rawMax=[0.256,0.2632,0.1763]
  'furniture/cabinetBedDrawer': {
    uniformScale: 2.3,
    pivotOffset: { x: -0.123, y: 0, z: 0.01435 },
    effectiveAabb: { x: 0.612, y: 0.605, z: 0.877 },
    collisionSize: { x: 0.58, y: 0.605, z: 0.84 },
    floorAligned: true,
    status: 'provisional',
  },
  // target: 不超过卧室可通行面积（约 1.57×0.92），等比不放大
  // rawAabb=(1.57,0.01,0.92)
  'furniture/rugRectangle': {
    uniformScale: 1.0,
    pivotOffset: { x: -0.785, y: 0, z: 0.46 },
    effectiveAabb: { x: 1.57, y: 0.01, z: 0.92 },
    collisionSize: { x: 0.01, y: 0.01, z: 0.01 }, // 地毯不产生物理碰撞
    floorAligned: true,
    status: 'provisional',
  },
  // 台灯：不产生碰撞
  'furniture/lampRoundTable': {
    uniformScale: 1.8,
    pivotOffset: { x: -0.06, y: 0, z: 0.06 },
    effectiveAabb: { x: 0.274, y: 0.566, z: 0.316 },
    collisionSize: { x: 0.01, y: 0.01, z: 0.01 },
    floorAligned: true,
    status: 'provisional',
  },

  // —— Entrance ——
  // target: rugDoormat ~0.6–1.0m；rawAabb=(0.4293,0.01,0.2370)
  'furniture/rugDoormat': {
    uniformScale: 2.0,
    pivotOffset: { x: -0.21465, y: 0, z: 0.1185045 },
    effectiveAabb: { x: 0.859, y: 0.02, z: 0.474 },
    collisionSize: { x: 0.01, y: 0.01, z: 0.01 },
    floorAligned: true,
    status: 'provisional',
  },
  // target: coatRackStanding 高约 1.6–2.0m；rawAabb=(0.2728,0.77,0.2728)
  'furniture/coatRackStanding': {
    uniformScale: 2.2,
    pivotOffset: { x: 0, y: 0, z: 0 },
    effectiveAabb: { x: 0.6, y: 1.694, z: 0.6 },
    collisionSize: { x: 0.5, y: 1.694, z: 0.5 },
    floorAligned: true,
    status: 'provisional',
  },

  // —— DiningKitchen（仅注册，暂不布局） ——
  // target: table 宽 1.4–1.8m；rawAabb=(0.841,0.327,0.447)
  'furniture/table': {
    uniformScale: 2.0,
    pivotOffset: { x: -0.420744, y: 0, z: 0.2236865 },
    effectiveAabb: { x: 1.683, y: 0.653, z: 0.895 },
    collisionSize: { x: 1.6, y: 0.653, z: 0.8 },
    floorAligned: true,
    status: 'provisional',
  },
  // target: chair 宽 0.4–0.6m；rawAabb=(0.2,0.47,0.2)
  'furniture/chair': {
    uniformScale: 2.4,
    pivotOffset: { x: -0.1, y: 0, z: 0.1 },
    effectiveAabb: { x: 0.48, y: 1.128, z: 0.48 },
    collisionSize: { x: 0.44, y: 1.128, z: 0.44 },
    floorAligned: true,
    status: 'provisional',
  },
  // target: 深 0.45–0.65m；rawAabb=(0.43,0.45,0.48)   rawDepth=rz=0.48 -> scale=1.2 gives 0.576
  'furniture/kitchenCabinetDrawer': {
    uniformScale: 1.25,
    pivotOffset: { x: -0.215, y: 0, z: 0.21 },
    effectiveAabb: { x: 0.538, y: 0.563, z: 0.600 },
    collisionSize: { x: 0.52, y: 0.563, z: 0.58 },
    floorAligned: true,
    status: 'provisional',
  },
  'furniture/kitchenSink': {
    uniformScale: 1.25,
    pivotOffset: { x: -0.215, y: 0, z: 0.21 },
    effectiveAabb: { x: 0.538, y: 0.613, z: 0.600 },
    collisionSize: { x: 0.52, y: 0.613, z: 0.58 },
    floorAligned: true,
    status: 'provisional',
  },
  // target: 高 0.5–0.9m；rawAabb=(0.496,0.906,0.44) → ry 已符合，仅略收紧
  // L3 Laundry: 用作衣物篮的临时替代，等比放大至 0.8m 宽
  'furniture/trashcan': {
    uniformScale: 1.65,
    pivotOffset: { x: 0.01996, y: 0, z: 0 },
    effectiveAabb: { x: 0.779, y: 1.427, z: 0.726 },
    collisionSize: { x: 0.74, y: 1.42, z: 0.7 },
    floorAligned: true,
    status: 'provisional',
  },

  // —— Laundry（仅注册，暂不布局） ——
  // target: washer/dryer 各 ~0.6–0.7m 宽；禁止直接 scale=2
  // rawAabb washer=(0.39,0.5,0.48) -> 0.39*1.65=0.644, 0.48*1.65=0.792 (深 OK)
  'furniture/washer': {
    uniformScale: 1.65,
    pivotOffset: { x: -0.195, y: 0.03, z: 0.11 }, // rawMin.y=-0.03（小量下陷，抬回 0）
    effectiveAabb: { x: 0.644, y: 0.825, z: 0.792 },
    collisionSize: { x: 0.62, y: 0.82, z: 0.77 },
    floorAligned: true,
    status: 'provisional',
  },
  // rawAabb dryer=(0.39,0.6,0.38)  → 0.39*1.7=0.663 宽
  'furniture/dryer': {
    uniformScale: 1.7,
    pivotOffset: { x: -0.195, y: 0.13, z: 0.16 }, // rawMin.y=-0.13（抬回 0）
    effectiveAabb: { x: 0.663, y: 1.02, z: 0.646 },
    collisionSize: { x: 0.64, y: 1.02, z: 0.62 },
    floorAligned: true,
    status: 'provisional',
  },
  // 矮书架：rawAabb=(0.4,0.4,0.25)
  'furniture/bookcaseOpenLow': {
    uniformScale: 1.6,
    pivotOffset: { x: -0.2, y: 0, z: 0.125 },
    effectiveAabb: { x: 0.64, y: 0.64, z: 0.4 },
    collisionSize: { x: 0.6, y: 0.64, z: 0.38 },
    floorAligned: true,
    status: 'provisional',
  },

  // —— Food / task props ——
  // 下列 rawAabb 来自实际 GLB 的 THREE.Box3 测量；Food Kit 模型本身已经是小尺寸，
  // 不能再按占位的 [-1,1]³ 包围盒缩放，否则会小到几乎不可见。
  // mug rawAabb=(0.3437,0.2734,0.2851), raw center x=0.04837, bottom y=0
  'food/mug': {
    uniformScale: 0.44,
    pivotOffset: { x: -0.048374, y: 0, z: 0 },
    effectiveAabb: { x: 0.151, y: 0.12, z: 0.125 },
    collisionSize: { x: 0.13, y: 0.12, z: 0.11 },
    floorAligned: true,
    status: 'provisional',
  },
  // plate rawAabb=(0.8918,0.09,0.8918) → 约 0.22m 直径
  'food/plate': {
    uniformScale: 0.247,
    pivotOffset: { x: 0, y: 0, z: 0 },
    effectiveAabb: { x: 0.22, y: 0.022, z: 0.22 },
    collisionSize: { x: 0.01, y: 0.01, z: 0.01 },
    floorAligned: true,
    status: 'provisional',
  },
  // utensil 模型原生就是平放状态（长轴为 X，Y 仅是餐具厚度）。
  // fork rawAabb=(0.5035,0.0178,0.084)
  'food/utensil-fork': {
    uniformScale: 0.397,
    pivotOffset: { x: 0, y: 0, z: 0 },
    effectiveAabb: { x: 0.2, y: 0.007, z: 0.033 },
    collisionSize: { x: 0.01, y: 0.01, z: 0.01 },
    floorAligned: true,
    status: 'provisional',
  },
  // spoon rawAabb=(0.4796,0.0278,0.12)
  'food/utensil-spoon': {
    uniformScale: 0.42,
    pivotOffset: { x: 0, y: 0, z: 0 },
    effectiveAabb: { x: 0.201, y: 0.012, z: 0.05 },
    collisionSize: { x: 0.01, y: 0.01, z: 0.01 },
    floorAligned: true,
    status: 'provisional',
  },

  // —— 辅助视觉 ——
  // pillow  rawAabb=(0.23,0.222,0.088)
  // L3 Laundry: 用作衣物/毛巾的临时替代，等比放大至 0.5-0.6m 宽
  'furniture/pillow': {
    uniformScale: 2.2,
    pivotOffset: { x: -0.253, y: 0, z: 0.097 },
    effectiveAabb: { x: 0.506, y: 0.489, z: 0.313 },
    collisionSize: { x: 0.01, y: 0.01, z: 0.01 },
    floorAligned: true,
    status: 'provisional',
  },
  // bear rawAabb=(0.389711,0.45,0.2475) 玩具熊，目标高度 ~0.36m（手持级别）
  'furniture/bear': {
    uniformScale: 0.8,
    pivotOffset: { x: 0, y: 0, z: 0 },
    effectiveAabb: { x: 0.312, y: 0.36, z: 0.198 },
    collisionSize: { x: 0.01, y: 0.01, z: 0.01 },
    floorAligned: true,
    status: 'provisional',
  },
  // pillowBlue rawAabb=(0.23,0.128512,0.06339) 蓝色枕头，参照 pillow 沿用 scale=2.2
  'furniture/pillowBlue': {
    uniformScale: 2.2,
    pivotOffset: { x: 0, y: 0, z: 0 },
    effectiveAabb: { x: 0.506, y: 0.283, z: 0.139 },
    collisionSize: { x: 0.01, y: 0.01, z: 0.01 },
    floorAligned: true,
    status: 'provisional',
  },
  // pillowLong rawAabb=(0.386576,0.222163,0.088484) 长条枕，目标长度 ~0.5m
  'furniture/pillowLong': {
    uniformScale: 1.3,
    pivotOffset: { x: 0, y: 0, z: 0 },
    effectiveAabb: { x: 0.503, y: 0.289, z: 0.115 },
    collisionSize: { x: 0.01, y: 0.01, z: 0.01 },
    floorAligned: true,
    status: 'provisional',
  },
  // books rawAabb=(0.15,0.104,0.095)
  // L3 Laundry: 用作袜子/小件物品的临时替代，保持小巧
  'furniture/books': {
    uniformScale: 1.2,
    pivotOffset: { x: -0.09, y: 0, z: 0.057 },
    effectiveAabb: { x: 0.181, y: 0.125, z: 0.181 },
    collisionSize: { x: 0.01, y: 0.01, z: 0.01 },
    floorAligned: true,
    status: 'provisional',
  },
  // pottedPlant rawAabb=(0.255,0.536,0.291)
  'furniture/pottedPlant': {
    uniformScale: 1.6,
    pivotOffset: { x: -0.0845825, y: 0, z: 0.095966 },
    effectiveAabb: { x: 0.408, y: 0.857, z: 0.466 },
    collisionSize: { x: 0.36, y: 0.857, z: 0.42 },
    floorAligned: true,
    status: 'provisional',
  },

  // ===================== 新家具 provisional 校准 =====================
  // lampRoundFloor rawAabb=(0.152,0.86,0.1756) rawMin=(-0.016,0,-0.1478) rawMax=(0.136,0.86,0.0278)
  // 目标: 落地灯 高 ~1.72m（放大 2x）
  'furniture/lampRoundFloor': {
    uniformScale: 2.0,
    pivotOffset: { x: -0.06, y: 0, z: 0.06 },
    effectiveAabb: { x: 0.304, y: 1.72, z: 0.351 },
    collisionSize: { x: 0.28, y: 1.72, z: 0.32 },
    floorAligned: true,
    status: 'provisional',
  },
  // lampSquareFloor rawAabb=(0.12,0.86,0.12) rawMin=(0,0,-0.12) rawMax=(0.12,0.86,0)
  'furniture/lampSquareFloor': {
    uniformScale: 2.0,
    pivotOffset: { x: -0.06, y: 0, z: 0.06 },
    effectiveAabb: { x: 0.24, y: 1.72, z: 0.24 },
    collisionSize: { x: 0.22, y: 1.72, z: 0.22 },
    floorAligned: true,
    status: 'provisional',
  },
  // loungeChair rawAabb=(0.49,0.46,0.41) rawMin=(0,0,-0.41) rawMax=(0.49,0.46,0)
  // 参照 loungeSofa scale=2 → ~0.92 高 OK
  'furniture/loungeChair': {
    uniformScale: 2.0,
    pivotOffset: { x: -0.245, y: 0, z: 0.205 },
    effectiveAabb: { x: 0.98, y: 0.92, z: 0.82 },
    collisionSize: { x: 0.88, y: 0.92, z: 0.74 },
    floorAligned: true,
    status: 'provisional',
  },
  // loungeChairRelax rawAabb=(0.49,0.63,0.6747) rawMin=(0,0,-0.6747) rawMax=(0.49,0.63,0)
  'furniture/loungeChairRelax': {
    uniformScale: 1.8,
    pivotOffset: { x: -0.245, y: 0, z: 0.337 },
    effectiveAabb: { x: 0.882, y: 1.134, z: 1.214 },
    collisionSize: { x: 0.8, y: 1.134, z: 1.1 },
    floorAligned: true,
    status: 'provisional',
  },
  // loungeDesignChair rawAabb=(0.7296,0.4,0.41) rawMin=(0,0,-0.41) rawMax=(0.7296,0.4,0)
  'furniture/loungeDesignChair': {
    uniformScale: 2.0,
    pivotOffset: { x: -0.3648, y: 0, z: 0.205 },
    effectiveAabb: { x: 1.459, y: 0.8, z: 0.82 },
    collisionSize: { x: 1.32, y: 0.8, z: 0.74 },
    floorAligned: true,
    status: 'provisional',
  },
  // sideTable rawAabb=(0.5345,0.3844,0.22) rawMin=(-0.01,0,-0.21) rawMax=(0.5245,0.3844,0.01)
  // 参照 coffee table → 约 0.44m 台面高（~1.15x）
  'furniture/sideTable': {
    uniformScale: 1.6,
    pivotOffset: { x: -0.257, y: 0, z: 0.1 },
    effectiveAabb: { x: 0.855, y: 0.615, z: 0.352 },
    collisionSize: { x: 0.78, y: 0.615, z: 0.32 },
    floorAligned: true,
    status: 'provisional',
  },
  // sideTableDrawers rawAabb=(0.5345,0.3844,0.3863)
  'furniture/sideTableDrawers': {
    uniformScale: 1.6,
    pivotOffset: { x: -0.257, y: 0, z: 0.015 },
    effectiveAabb: { x: 0.855, y: 0.615, z: 0.618 },
    collisionSize: { x: 0.78, y: 0.615, z: 0.56 },
    floorAligned: true,
    status: 'provisional',
  },
  // plantSmall1/2/3 rawAabb≈(0.19,0.28,0.19) center
  // 目标 ~0.45m 高（小盆栽，放大 1.6x）
  'furniture/plantSmall1': {
    uniformScale: 1.6,
    pivotOffset: { x: 0, y: 0, z: 0 },
    effectiveAabb: { x: 0.303, y: 0.448, z: 0.303 },
    collisionSize: { x: 0.01, y: 0.01, z: 0.01 },
    floorAligned: true,
    status: 'provisional',
  },
  'furniture/plantSmall2': {
    uniformScale: 1.6,
    pivotOffset: { x: 0, y: 0, z: 0 },
    effectiveAabb: { x: 0.303, y: 0.448, z: 0.303 },
    collisionSize: { x: 0.01, y: 0.01, z: 0.01 },
    floorAligned: true,
    status: 'provisional',
  },
  'furniture/plantSmall3': {
    uniformScale: 1.6,
    pivotOffset: { x: 0, y: 0, z: 0 },
    effectiveAabb: { x: 0.272, y: 0.464, z: 0.314 },
    collisionSize: { x: 0.01, y: 0.01, z: 0.01 },
    floorAligned: true,
    status: 'provisional',
  },
  // rugRound rawAabb=(0.92,0.01,0.92) rawMin=(0,0,-0.92) rawMax=(0.92,0.01,0)
  // 圆形地毯 ~1.8m 直径，保持比例
  'furniture/rugRound': {
    uniformScale: 2.0,
    pivotOffset: { x: -0.46, y: 0, z: 0.46 },
    effectiveAabb: { x: 1.84, y: 0.02, z: 1.84 },
    collisionSize: { x: 0.01, y: 0.01, z: 0.01 },
    floorAligned: true,
    status: 'provisional',
  },
  // rugRounded rawAabb=(1.57,0.01,0.92)  类似 rugRectangle 保持 1x
  'furniture/rugRounded': {
    uniformScale: 1.0,
    pivotOffset: { x: -0.785, y: 0, z: 0.46 },
    effectiveAabb: { x: 1.57, y: 0.01, z: 0.92 },
    collisionSize: { x: 0.01, y: 0.01, z: 0.01 },
    floorAligned: true,
    status: 'provisional',
  },
  // speakerSmall rawAabb=(0.148,0.298,0.1332)
  'furniture/speakerSmall': {
    uniformScale: 1.8,
    pivotOffset: { x: -0.074, y: 0, z: 0.0666 },
    effectiveAabb: { x: 0.266, y: 0.536, z: 0.24 },
    collisionSize: { x: 0.01, y: 0.01, z: 0.01 },
    floorAligned: true,
    status: 'provisional',
  },
  // radio rawAabb=(0.315,0.2282,0.0975)
  'furniture/radio': {
    uniformScale: 1.8,
    pivotOffset: { x: -0.1575, y: 0, z: 0.04875 },
    effectiveAabb: { x: 0.567, y: 0.411, z: 0.176 },
    collisionSize: { x: 0.01, y: 0.01, z: 0.01 },
    floorAligned: true,
    status: 'provisional',
  },

  // —— Bedroom 新增 ——
  // cabinetBed rawAabb=(0.266,0.2332,0.2173) rawMin=(-0.01,0,-0.205) rawMax=(0.256,0.2332,0.0123)
  // 大衣柜：目标 ~1.06 宽 × 1.07 高 （放大 4.6x）
  'furniture/cabinetBed': {
    uniformScale: 4.6,
    pivotOffset: { x: -0.123, y: 0, z: 0.096 },
    effectiveAabb: { x: 1.224, y: 1.073, z: 1.0 },
    collisionSize: { x: 1.1, y: 1.073, z: 0.9 },
    floorAligned: true,
    status: 'provisional',
  },
  // cabinetBedDrawerTable rawAabb=(0.266,0.2632,0.3813)  同 cabinetBedDrawer scale=2.3
  'furniture/cabinetBedDrawerTable': {
    uniformScale: 2.3,
    pivotOffset: { x: -0.123, y: 0, z: 0.01435 },
    effectiveAabb: { x: 0.612, y: 0.605, z: 0.877 },
    collisionSize: { x: 0.58, y: 0.605, z: 0.84 },
    floorAligned: true,
    status: 'provisional',
  },
  // bedSingle rawAabb=(1.6232,0.505,1.892)  同 bedDouble scale=1.15
  'furniture/bedSingle': {
    uniformScale: 1.15,
    pivotOffset: { x: -0.753, y: 0.13, z: 0.946 },
    effectiveAabb: { x: 1.867, y: 0.581, z: 2.176 },
    collisionSize: { x: 1.867, y: 0.55, z: 2.176 },
    floorAligned: true,
    status: 'provisional',
  },
  // bathroomMirror rawAabb=(0.3013,0.4346,0.1444)  不碰撞的墙饰（放大 2x）
  'furniture/bathroomMirror': {
    uniformScale: 2.0,
    pivotOffset: { x: 0, y: 0, z: -0.0234 },
    effectiveAabb: { x: 0.603, y: 0.869, z: 0.289 },
    collisionSize: { x: 0.01, y: 0.01, z: 0.01 },
    floorAligned: false,
    status: 'provisional',
  },

  // —— Kitchen 新增 ——
  // kitchenFridge rawAabb=(0.43,0.92,0.3169) rawMin=(0,0,-0.2819) rawMax=(0.43,0.92,0.035)
  // 冰箱：目标 ~0.76m 宽 × 1.65m 高（放大 1.78x）
  'furniture/kitchenFridge': {
    uniformScale: 1.8,
    pivotOffset: { x: -0.215, y: 0, z: 0.12345 },
    effectiveAabb: { x: 0.774, y: 1.656, z: 0.57 },
    collisionSize: { x: 0.74, y: 1.656, z: 0.54 },
    floorAligned: true,
    status: 'provisional',
  },
  // kitchenFridgeLarge rawAabb=(0.7932,1.3232,0.3855)
  'furniture/kitchenFridgeLarge': {
    uniformScale: 1.25,
    pivotOffset: { x: -0.26, y: 0.4032, z: 0.149 },
    effectiveAabb: { x: 0.992, y: 1.654, z: 0.482 },
    collisionSize: { x: 0.95, y: 1.654, z: 0.46 },
    floorAligned: true,
    status: 'provisional',
  },
  // kitchenStove rawAabb=(0.43,0.45,0.48)  同 kitchenCabinetDrawer scale=1.25
  'furniture/kitchenStove': {
    uniformScale: 1.25,
    pivotOffset: { x: -0.215, y: 0, z: 0.21 },
    effectiveAabb: { x: 0.538, y: 0.563, z: 0.6 },
    collisionSize: { x: 0.52, y: 0.563, z: 0.58 },
    floorAligned: true,
    status: 'provisional',
  },
  // kitchenStoveElectric rawAabb=(0.43,0.45,0.45)
  'furniture/kitchenStoveElectric': {
    uniformScale: 1.25,
    pivotOffset: { x: -0.215, y: 0, z: 0.225 },
    effectiveAabb: { x: 0.538, y: 0.563, z: 0.563 },
    collisionSize: { x: 0.52, y: 0.563, z: 0.54 },
    floorAligned: true,
    status: 'provisional',
  },
  // kitchenMicrowave rawAabb=(0.29,0.18,0.23) rawMin=(0,0,-0.22) rawMax=(0.29,0.18,0.01)
  // 微波炉：台上电器，给 0.538m 宽的橱柜台面留出明确边距
  'furniture/kitchenMicrowave': {
    uniformScale: 1.5,
    pivotOffset: { x: -0.145, y: 0, z: 0.105 },
    effectiveAabb: { x: 0.435, y: 0.27, z: 0.345 },
    collisionSize: { x: 0.01, y: 0.01, z: 0.01 },
    floorAligned: true,
    status: 'provisional',
  },
  // kitchenCabinet rawAabb=(0.43,0.45,0.48)  同 kitchenCabinetDrawer
  'furniture/kitchenCabinet': {
    uniformScale: 1.25,
    pivotOffset: { x: -0.215, y: 0, z: 0.21 },
    effectiveAabb: { x: 0.538, y: 0.563, z: 0.6 },
    collisionSize: { x: 0.52, y: 0.563, z: 0.58 },
    floorAligned: true,
    status: 'provisional',
  },
  // cabinetTelevisionDoors rawAabb=(1.16,0.31,0.28) rawMin=(-0.36,0,-0.25) rawMax=(0.8,0.31,0.03)
  // 带门电视柜：放大 2x → ~2.32 宽
  'furniture/cabinetTelevisionDoors': {
    uniformScale: 2.0,
    pivotOffset: { x: -0.22, y: 0, z: 0.11 },
    effectiveAabb: { x: 2.32, y: 0.62, z: 0.56 },
    collisionSize: { x: 2.1, y: 0.62, z: 0.5 },
    floorAligned: true,
    status: 'provisional',
  },

  // —— Chair 变体（参照 chair scale=2.4） ——
  'furniture/chairCushion': {
    uniformScale: 2.4,
    pivotOffset: { x: -0.1, y: 0, z: 0.1 },
    effectiveAabb: { x: 0.48, y: 1.104, z: 0.48 },
    collisionSize: { x: 0.44, y: 1.104, z: 0.44 },
    floorAligned: true,
    status: 'provisional',
  },
  'furniture/chairRounded': {
    uniformScale: 2.4,
    pivotOffset: { x: -0.1, y: 0, z: 0.1 },
    effectiveAabb: { x: 0.48, y: 1.092, z: 0.48 },
    collisionSize: { x: 0.44, y: 1.092, z: 0.44 },
    floorAligned: true,
    status: 'provisional',
  },
  'furniture/chairModernCushion': {
    uniformScale: 2.4,
    pivotOffset: { x: -0.1, y: 0, z: 0.1 },
    effectiveAabb: { x: 0.48, y: 1.104, z: 0.48 },
    collisionSize: { x: 0.44, y: 1.104, z: 0.44 },
    floorAligned: true,
    status: 'provisional',
  },
  // chairDesk rawAabb=(0.4787,0.4176,0.4432) rawMin=(-0.1675,0,-0.2832) rawMax=(0.3113,0.4176,0.16)
  // 办公椅（滚轮款，比普通椅子宽大）
  'furniture/chairDesk': {
    uniformScale: 2.2,
    pivotOffset: { x: -0.0719, y: 0, z: 0.0616 },
    effectiveAabb: { x: 1.053, y: 0.919, z: 0.975 },
    collisionSize: { x: 0.96, y: 0.919, z: 0.88 },
    floorAligned: true,
    status: 'provisional',
  },

  // —— Bathroom 浴室（装饰用，collision 基本关闭） ——
  'furniture/bathroomSink': {
    uniformScale: 2.0,
    pivotOffset: { x: -0.17, y: 0.4, z: 0.145 },
    effectiveAabb: { x: 0.68, y: 1.12, z: 0.58 },
    collisionSize: { x: 0.62, y: 1.12, z: 0.52 },
    floorAligned: true,
    status: 'provisional',
  },
  'furniture/bathroomCabinet': {
    uniformScale: 2.0,
    pivotOffset: { x: -0.215, y: 0, z: 0.1 },
    effectiveAabb: { x: 0.86, y: 0.78, z: 0.44 },
    collisionSize: { x: 0.8, y: 0.78, z: 0.4 },
    floorAligned: true,
    status: 'provisional',
  },
  // bathtub rawAabb=(1.19,0.42,0.56) rawMin=(0,0,-0.56) rawMax=(1.19,0.42,0)
  'furniture/bathtub': {
    uniformScale: 1.5,
    pivotOffset: { x: -0.595, y: 0, z: 0.28 },
    effectiveAabb: { x: 1.785, y: 0.63, z: 0.84 },
    collisionSize: { x: 1.62, y: 0.63, z: 0.76 },
    floorAligned: true,
    status: 'provisional',
  },
  // toilet rawAabb=(1.0046,0.9494,0.7897) rawMin=(0,0,-0.658) rawMax=(1.0046,0.9494,0.1317)
  'furniture/toilet': {
    uniformScale: 1.1,
    pivotOffset: { x: -0.5023, y: 0, z: 0.2632 },
    effectiveAabb: { x: 1.105, y: 1.044, z: 0.869 },
    collisionSize: { x: 1.0, y: 1.044, z: 0.78 },
    floorAligned: true,
    status: 'provisional',
  },

  // —— Desk / Office 办公 ——
  // desk rawAabb=(0.7345,0.3844,0.5563) rawMin=(-0.01,0,-0.38) rawMax=(0.7245,0.3844,0.1763)
  // 书桌：约 1.4 宽 × 0.78 高（放大 2x）
  'furniture/desk': {
    uniformScale: 2.0,
    pivotOffset: { x: -0.357, y: 0, z: 0.10185 },
    effectiveAabb: { x: 1.469, y: 0.769, z: 1.113 },
    collisionSize: { x: 1.32, y: 0.769, z: 1.0 },
    floorAligned: true,
    status: 'provisional',
  },
  // deskCorner rawAabb=(0.9745,0.3844,1.1508) rawMin=(0,0,-0.9745) rawMax=(0.9745,0.3844,0.1763)
  'furniture/deskCorner': {
    uniformScale: 2.0,
    pivotOffset: { x: -0.4872, y: 0, z: 0.3991 },
    effectiveAabb: { x: 1.949, y: 0.769, z: 2.302 },
    collisionSize: { x: 1.76, y: 0.769, z: 2.08 },
    floorAligned: true,
    status: 'provisional',
  },
  // computerScreen rawAabb=(0.3927,0.2943,0.104)
  'furniture/computerScreen': {
    uniformScale: 2.4,
    pivotOffset: { x: -0.19635, y: 0, z: 0.052 },
    effectiveAabb: { x: 0.942, y: 0.706, z: 0.25 },
    collisionSize: { x: 0.01, y: 0.01, z: 0.01 },
    floorAligned: true,
    status: 'provisional',
  },
  // computerKeyboard rawAabb=(0.2822,0.0276,0.1182)
  'furniture/computerKeyboard': {
    uniformScale: 2.4,
    pivotOffset: { x: -0.1411, y: 0, z: 0.0591 },
    effectiveAabb: { x: 0.677, y: 0.066, z: 0.284 },
    collisionSize: { x: 0.01, y: 0.01, z: 0.01 },
    floorAligned: true,
    status: 'provisional',
  },
  // computerMouse rawAabb=(0.0497,0.0236,0.0851)
  'furniture/computerMouse': {
    uniformScale: 2.4,
    pivotOffset: { x: 0, y: 0, z: 0.04255 },
    effectiveAabb: { x: 0.119, y: 0.057, z: 0.204 },
    collisionSize: { x: 0.01, y: 0.01, z: 0.01 },
    floorAligned: true,
    status: 'provisional',
  },
  // laptop rawAabb=(0.6,0.3677,0.5456) rawMin=(0,0,-0.5456) rawMax=(0.6,0.3677,0)
  'furniture/laptop': {
    uniformScale: 1.2,
    pivotOffset: { x: -0.3, y: 0, z: 0.2728 },
    effectiveAabb: { x: 0.72, y: 0.441, z: 0.655 },
    collisionSize: { x: 0.01, y: 0.01, z: 0.01 },
    floorAligned: true,
    status: 'provisional',
  },
  // bookcaseClosed rawAabb=(0.4,0.85,0.25) rawMin=(0,0,-0.25) rawMax=(0.4,0.85,0)
  'furniture/bookcaseClosed': {
    uniformScale: 2.0,
    pivotOffset: { x: -0.2, y: 0, z: 0.125 },
    effectiveAabb: { x: 0.8, y: 1.7, z: 0.5 },
    collisionSize: { x: 0.76, y: 1.7, z: 0.46 },
    floorAligned: true,
    status: 'provisional',
  },
  // toaster rawAabb=(0.188,0.13,0.1)  台上小家电
  'furniture/toaster': {
    uniformScale: 2.0,
    pivotOffset: { x: 0, y: 0, z: 0 },
    effectiveAabb: { x: 0.376, y: 0.26, z: 0.2 },
    collisionSize: { x: 0.01, y: 0.01, z: 0.01 },
    floorAligned: true,
    status: 'provisional',
  },
  // kitchenCoffeeMachine rawAabb=(0.2738,0.3034,0.3301) rawMin=(-0.0338,0,-0.3041) rawMax=(0.24,0.3034,0.026)
  'furniture/kitchenCoffeeMachine': {
    uniformScale: 1.8,
    pivotOffset: { x: -0.1031, y: 0, z: 0.139 },
    effectiveAabb: { x: 0.493, y: 0.546, z: 0.594 },
    collisionSize: { x: 0.01, y: 0.01, z: 0.01 },
    floorAligned: true,
    status: 'provisional',
  },
  // kitchenBlender rawAabb=(0.1719,0.16,0.1323)
  'furniture/kitchenBlender': {
    uniformScale: 1.8,
    pivotOffset: { x: -0.076, y: 0, z: 0.066 },
    effectiveAabb: { x: 0.309, y: 0.288, z: 0.238 },
    collisionSize: { x: 0.01, y: 0.01, z: 0.01 },
    floorAligned: true,
    status: 'provisional',
  },

  // ===================== L3 关键任务模型（Commit 2 接入） =====================
  // kitchenCabinetUpper rawAabb=(0.43,0.56,0.32) — 挂墙式上层橱柜
  // 与下柜同宽，适度加高，避免此前 0.8×1.04×0.6 的巨型柜体压住灶台。
  // rawMin≈(0,0,-0.32) rawMax≈(0.43,0.56,0) → center x=-0.215, z=0.16
  'furniture/kitchenCabinetUpper': {
    uniformScale: 1.25,
    pivotOffset: { x: -0.215, y: 0, z: 0.16 },
    effectiveAabb: { x: 0.538, y: 0.7, z: 0.4 },
    collisionSize: { x: 0.01, y: 0.01, z: 0.01 },
    floorAligned: false, // 挂墙式，位置 y=0.9 表示柜底离地高度
    status: 'provisional',
  },
  // carton rawAabb=(0.23,0.5905,0.23) — 麦片盒，目标高度约 0.42m
  'food/carton': {
    uniformScale: 0.711,
    pivotOffset: { x: 0, y: 0, z: 0 },
    effectiveAabb: { x: 0.164, y: 0.42, z: 0.164 },
    collisionSize: { x: 0.15, y: 0.42, z: 0.15 },
    floorAligned: true,
    status: 'provisional',
  },
  // bowl rawAabb=(0.5022,0.2138,0.5798) — 口径约 0.24m，高约 0.09m
  'food/bowl': {
    uniformScale: 0.414,
    pivotOffset: { x: 0, y: 0, z: 0 },
    effectiveAabb: { x: 0.208, y: 0.089, z: 0.24 },
    collisionSize: { x: 0.01, y: 0.01, z: 0.01 },
    floorAligned: true,
    status: 'provisional',
  },
  // cup rawAabb=(0.23,0.2,0.2921), raw center z=-0.03106
  'food/cup': {
    uniformScale: 0.7,
    pivotOffset: { x: 0, y: 0, z: 0.031058 },
    effectiveAabb: { x: 0.161, y: 0.14, z: 0.204 },
    collisionSize: { x: 0.14, y: 0.14, z: 0.18 },
    floorAligned: true,
    status: 'provisional',
  },
}
