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

  // —— Food / L1 props（仅注册，暂不修改任务对象） ——
  // mug rawAabb 是 [-1,1]³ → 实际几何体需要 scale≈0.05（0.1m 杯身）
  'food/mug': {
    uniformScale: 0.05,
    pivotOffset: { x: 0, y: 0.05, z: 0 }, // 把底部从 -1 带到 0 需要 +1*0.05
    effectiveAabb: { x: 0.1, y: 0.1, z: 0.1 },
    collisionSize: { x: 0.08, y: 0.08, z: 0.08 },
    floorAligned: true,
    status: 'provisional',
  },
  // plate rawAabb [-1,1]³  → scale≈0.09（约 0.18m 直径）
  'food/plate': {
    uniformScale: 0.09,
    pivotOffset: { x: 0, y: 0.005, z: 0 },
    effectiveAabb: { x: 0.18, y: 0.018, z: 0.18 },
    collisionSize: { x: 0.01, y: 0.01, z: 0.01 },
    floorAligned: true,
    status: 'provisional',
  },
  // utensil-fork  rawAabb=(0.503,2,0.084)  rawMin.y=-1
  'food/utensil-fork': {
    uniformScale: 0.1,
    pivotOffset: { x: 0, y: 0.1, z: 0 },
    effectiveAabb: { x: 0.05, y: 0.2, z: 0.0084 },
    collisionSize: { x: 0.01, y: 0.01, z: 0.01 },
    floorAligned: true,
    status: 'provisional',
  },
  // utensil-spoon rawAabb=(0.727,2,0.610)  rawMin.y=-1
  'food/utensil-spoon': {
    uniformScale: 0.1,
    pivotOffset: { x: 0, y: 0.1, z: 0 },
    effectiveAabb: { x: 0.073, y: 0.2, z: 0.061 },
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
}
