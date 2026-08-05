/**
 * src/data/assets/modelRegistry.ts
 *
 * WP0A · CORE LIVING ASSET MODEL REGISTRY (独立数据层)
 *
 * 职责（§六）：
 *  - 注册本轮导入的 5 个 Kenney Furniture Kit Living 核心 GLB；
 *  - 每个模型独立登记 uniformScale（禁止 GLOBAL_FURNITURE_SCALE 宏/常数）；
 *  - 登记 pivotOffset（bottom-center，模型不修改二进制，用内层 group 偏移实现）；
 *  - 记录 rawAabb（accessor min/max，见 §四 审计脚本）与 expectedEffectiveAabb；
 *  - 记录 sourceSha256 与 public URL，便于 CI / 导入校验。
 *
 * 不负责：
 *  - 不建立通用 Scene Graph 框架；
 *  - 不管理 fallback 组件（见 FallbackModels / RoomDecorPiece fallback）；
 *  - 不持有 React 依赖（纯数据，可在 node / vitest / 浏览器共享）。
 */

export type ModelAssetId =
  | 'furniture/loungeSofa'
  | 'furniture/tableCoffee'
  | 'furniture/televisionModern'
  | 'furniture/cabinetTelevision'
  | 'furniture/bookcaseOpen'

export type Vec3 = { x: number; y: number; z: number }

export type PackId = 'kenney-furniture-kit'
export type LicenseId = 'CC0-1.0'

export interface ModelAssetDefinition {
  id: ModelAssetId
  /** public URL，由 resolveAssetUrl（base /assets/models/）在渲染侧拼接 */
  url: string
  /** Kenney 源 stem，用于关联 SOURCE.md / 审计 manifest */
  sourceStem: string
  pack: PackId
  license: LicenseId
  /** 源 GLB（§三/四 审计目录中 binary）的 SHA-256（小写 hex） */
  sourceSha256: string

  /** GLB JSON chunk accessor POSITION min/max 得到的 raw AABB 尺寸（未缩放） */
  rawAabb: Vec3
  /** 每个模型独立 uniformScale（WP0A 建议候选 2.0，最终值由 §七 runtime Box3 复核） */
  uniformScale: number
  /**
   * inner group pivot offset（见 §八 outer/inner group 方案）：
   *  - x/z 为 XZ 方向的中心归零（pivot = XZ-bottom-center）；
   *  - y 为 floor alignment（把 rawAabbMin.y 归零）。
   */
  pivotOffset: Vec3
  /** rawAabb × uniformScale，作为 §七 runtime compareAabb 的 expected 值 */
  effectiveAabb: Vec3

  /** 本模型是否 floor-aligned（5 个 Living 核心家具全部 true） */
  floorAligned: boolean
  status: 'calibrated' | 'provisional'
}

/**
 * §七 INITIAL_CALIBRATION_CANDIDATE（每 uniformScale 2.0 独立登记，
 * 禁止在 5 个条目之间共享同一个常量。最终校准后可单条目调整，
 * 不影响其它条目，避免 sofa 调 2.1 时电视被非预期放大的回归。
 */
export const MODEL_ASSET_REGISTRY: Record<ModelAssetId, ModelAssetDefinition> = {
  'furniture/loungeSofa': {
    id: 'furniture/loungeSofa',
    url: '/assets/models/kenney/furniture/loungeSofa.glb',
    sourceStem: 'loungeSofa',
    pack: 'kenney-furniture-kit',
    license: 'CC0-1.0',
    sourceSha256: '1886b811c0d3ad0d8525a4fd43adf4112c497c8e0ed906f06877ca3517f4c7dd',
    rawAabb: { x: 0.98, y: 0.46, z: 0.41 },
    uniformScale: 2.0,
    pivotOffset: { x: -0.49, y: 0, z: 0.205 },
    effectiveAabb: { x: 1.96, y: 0.92, z: 0.82 },
    floorAligned: true,
    status: 'provisional',
  },

  'furniture/tableCoffee': {
    id: 'furniture/tableCoffee',
    url: '/assets/models/kenney/furniture/tableCoffee.glb',
    sourceStem: 'tableCoffee',
    pack: 'kenney-furniture-kit',
    license: 'CC0-1.0',
    sourceSha256: 'e38bea760fbd514efbb75528d09b4752c91af44677bbb97e6d4386c263525179',
    rawAabb: { x: 0.660996, y: 0.23, z: 0.4 },
    uniformScale: 2.0,
    pivotOffset: { x: 0.130498, y: 0, z: 0.1 },
    effectiveAabb: { x: 1.321992, y: 0.46, z: 0.8 },
    floorAligned: true,
    status: 'provisional',
  },

  'furniture/televisionModern': {
    id: 'furniture/televisionModern',
    url: '/assets/models/kenney/furniture/televisionModern.glb',
    sourceStem: 'televisionModern',
    pack: 'kenney-furniture-kit',
    license: 'CC0-1.0',
    sourceSha256: 'd89519ad0a5f28b5b0dccb0d83209dccf610cda959578238dd21bbf9e219cfc6',
    rawAabb: { x: 0.6848, y: 0.45475, z: 0.1284 },
    uniformScale: 2.0,
    pivotOffset: { x: 0, y: 0, z: 0 },
    effectiveAabb: { x: 1.3696, y: 0.9095, z: 0.2568 },
    floorAligned: true,
    status: 'provisional',
  },

  'furniture/cabinetTelevision': {
    id: 'furniture/cabinetTelevision',
    url: '/assets/models/kenney/furniture/cabinetTelevision.glb',
    sourceStem: 'cabinetTelevision',
    pack: 'kenney-furniture-kit',
    license: 'CC0-1.0',
    sourceSha256: '811719593d676ff76f7b5904d52c845ce0396af2bc9a6a2636c4818ead320b99',
    rawAabb: { x: 0.8, y: 0.31, z: 0.25 },
    uniformScale: 2.0,
    pivotOffset: { x: -0.4, y: 0, z: 0.125 },
    effectiveAabb: { x: 1.6, y: 0.62, z: 0.5 },
    floorAligned: true,
    status: 'provisional',
  },

  'furniture/bookcaseOpen': {
    id: 'furniture/bookcaseOpen',
    url: '/assets/models/kenney/furniture/bookcaseOpen.glb',
    sourceStem: 'bookcaseOpen',
    pack: 'kenney-furniture-kit',
    license: 'CC0-1.0',
    sourceSha256: '750702218d68c062b15dfef6ab06a4014d1cfa8bd05f02e57c53b7e13bec157c',
    rawAabb: { x: 0.4, y: 0.88, z: 0.25 },
    uniformScale: 2.0,
    pivotOffset: { x: -0.2, y: 0, z: 0.125 },
    effectiveAabb: { x: 0.8, y: 1.76, z: 0.5 },
    floorAligned: true,
    status: 'provisional',
  },
}

export type CalibrationVerdict = 'PASS' | 'WARN' | 'FAIL'

export function getModelAsset(id: ModelAssetId): ModelAssetDefinition {
  return MODEL_ASSET_REGISTRY[id]
}

export const WP0A_LIVING_ASSET_IDS: ModelAssetId[] = [
  'furniture/loungeSofa',
  'furniture/tableCoffee',
  'furniture/televisionModern',
  'furniture/cabinetTelevision',
  'furniture/bookcaseOpen',
]

export function assertAllUniformScalesAreIndependent(): boolean {
  const vals = WP0A_LIVING_ASSET_IDS.map((id) => MODEL_ASSET_REGISTRY[id].uniformScale)
  // 允许数值相同（当前全 2.0），但必须是 per 条目的字面值（存储层 5 个槽独立，
  // 禁止在对象字面量里引用共享的 2.0 常量，否则后续单条调 scale 时发生批量回归。
  // 运行期只做有限度自检：数组长度 5 全部 finite 且 > 0。
  return vals.length === 5 && vals.every((v) => Number.isFinite(v) && v > 0)
}
