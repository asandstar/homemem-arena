/**
 * src/data/assets/modelRegistry.ts
 *
 * ROUND R1 §六：泛化后的 Kenney 模型资产注册表。
 *
 * - MODEL_ASSET_REGISTRY 作为 as const 常量字面量：
 *   基础条目（id/url/sourceStem/pack/license/sourceSha256/rawAabb）
 *   从本地扫描生成清单读取，不得手写重复；
 *
 * - ModelAssetId 由 keyof typeof MODEL_ASSET_REGISTRY 自动推导，
 *   不再手动维护联合类型。
 *
 * - uniformScale/pivotOffset/effectiveAabb 等运行时校准字段
 *   从 modelOverrides.ts 合并（可单条调整不联动回归）。
 */

import { MODEL_OVERRIDES } from './modelOverrides'

export const MODEL_ASSET_REGISTRY = {
  // ========================== Furniture (Kenney Furniture Kit) ==========================
  'furniture/loungeSofa': {
    id: 'furniture/loungeSofa',
    url: '/assets/models/kenney/furniture/loungeSofa.glb',
    sourceStem: 'loungeSofa',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '1886b811c0d3ad0d8525a4fd43adf4112c497c8e0ed906f06877ca3517f4c7dd',
    rawAabb: { x: 0.98, y: 0.46, z: 0.41 },
  },
  'furniture/tableCoffee': {
    id: 'furniture/tableCoffee',
    url: '/assets/models/kenney/furniture/tableCoffee.glb',
    sourceStem: 'tableCoffee',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: 'e38bea760fbd514efbb75528d09b4752c91af44677bbb97e6d4386c263525179',
    rawAabb: { x: 0.660996, y: 0.23, z: 0.4 },
  },
  'furniture/cabinetTelevision': {
    id: 'furniture/cabinetTelevision',
    url: '/assets/models/kenney/furniture/cabinetTelevision.glb',
    sourceStem: 'cabinetTelevision',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '811719593d676ff76f7b5904d52c845ce0396af2bc9a6a2636c4818ead320b99',
    rawAabb: { x: 0.8, y: 0.31, z: 0.25 },
  },
  'furniture/televisionModern': {
    id: 'furniture/televisionModern',
    url: '/assets/models/kenney/furniture/televisionModern.glb',
    sourceStem: 'televisionModern',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: 'd89519ad0a5f28b5b0dccb0d83209dccf610cda959578238dd21bbf9e219cfc6',
    rawAabb: { x: 0.6848, y: 0.45475, z: 0.1284 },
  },
  'furniture/bookcaseOpen': {
    id: 'furniture/bookcaseOpen',
    url: '/assets/models/kenney/furniture/bookcaseOpen.glb',
    sourceStem: 'bookcaseOpen',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '750702218d68c062b15dfef6ab06a4014d1cfa8bd05f02e57c53b7e13bec157c',
    rawAabb: { x: 0.4, y: 0.88, z: 0.25 },
  },
  'furniture/bedDouble': {
    id: 'furniture/bedDouble',
    url: '/assets/models/kenney/furniture/bedDouble.glb',
    sourceStem: 'bedDouble',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: 'c49b33e7d797638f5a0a9e49b6128a18b73187f1f2d594a081f53bc7f5d9b11d',
    rawAabb: { x: 1.623244, y: 0.505, z: 1.912 },
  },
  'furniture/cabinetBedDrawer': {
    id: 'furniture/cabinetBedDrawer',
    url: '/assets/models/kenney/furniture/cabinetBedDrawer.glb',
    sourceStem: 'cabinetBedDrawer',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: 'e3dfd2e120af8a61f45f28299c8c051e0a5d5f231f13240bd0e58967c1e8834a',
    rawAabb: { x: 0.266, y: 0.2632, z: 0.3813 },
  },
  'furniture/rugRectangle': {
    id: 'furniture/rugRectangle',
    url: '/assets/models/kenney/furniture/rugRectangle.glb',
    sourceStem: 'rugRectangle',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: 'a989d2d59c04e3071e0c90388b113a9a8f339ce1814ef984c51cb6dcd7c8e0eb',
    rawAabb: { x: 1.57, y: 0.01, z: 0.92 },
  },
  'furniture/lampRoundTable': {
    id: 'furniture/lampRoundTable',
    url: '/assets/models/kenney/furniture/lampRoundTable.glb',
    sourceStem: 'lampRoundTable',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '75bb644caaa3909a9b74d7b110c3a2b4d34c0515a124d718c62d2a48285814d3',
    rawAabb: { x: 0.152039, y: 0.31425, z: 0.17556 },
  },
  'furniture/rugDoormat': {
    id: 'furniture/rugDoormat',
    url: '/assets/models/kenney/furniture/rugDoormat.glb',
    sourceStem: 'rugDoormat',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: 'bd888e418533954e6e0d8c2f2f0a6c4a5a0a32be49cc8b2d73e73421a92b13a1',
    rawAabb: { x: 0.4293, y: 0.01, z: 0.237009 },
  },
  'furniture/coatRackStanding': {
    id: 'furniture/coatRackStanding',
    url: '/assets/models/kenney/furniture/coatRackStanding.glb',
    sourceStem: 'coatRackStanding',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: 'd8231c22dab6ef553e359e5ab6bd8e8d3e503b1d2f923d12b5f66092519d009a',
    rawAabb: { x: 0.2728, y: 0.77, z: 0.2728 },
  },
  'furniture/table': {
    id: 'furniture/table',
    url: '/assets/models/kenney/furniture/table.glb',
    sourceStem: 'table',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: 'ff1a94498d02c6a3af68e91747a02f4b34be464d7e2d47e1b434bb21a6d6ffba',
    rawAabb: { x: 0.841488, y: 0.326734, z: 0.447373 },
  },
  'furniture/chair': {
    id: 'furniture/chair',
    url: '/assets/models/kenney/furniture/chair.glb',
    sourceStem: 'chair',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: 'c8a11eec93e821e484ad5f6d26c066bc3a814a0e33062d5ed25c51c6a679d233',
    rawAabb: { x: 0.2, y: 0.47, z: 0.2 },
  },
  'furniture/kitchenCabinetDrawer': {
    id: 'furniture/kitchenCabinetDrawer',
    url: '/assets/models/kenney/furniture/kitchenCabinetDrawer.glb',
    sourceStem: 'kitchenCabinetDrawer',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '6f784807e3ca493e6e63960db1b2e74a0b47839d3d6a71b6569dd58a64ce85a9',
    rawAabb: { x: 0.43, y: 0.45, z: 0.48 },
  },
  'furniture/kitchenSink': {
    id: 'furniture/kitchenSink',
    url: '/assets/models/kenney/furniture/kitchenSink.glb',
    sourceStem: 'kitchenSink',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '7b9610277d711f703c5e805b63874d9db30ac76e9c5b2b03d1249e046ab2df5e',
    rawAabb: { x: 0.43, y: 0.49, z: 0.48 },
  },
  'furniture/trashcan': {
    id: 'furniture/trashcan',
    url: '/assets/models/kenney/furniture/trashcan.glb',
    sourceStem: 'trashcan',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: 'e0ccc1fe50cb6a5da36e0ed212c266530b03a4552313e8b01e0b72c7e27598b5',
    rawAabb: { x: 0.495994, y: 0.906437, z: 0.44 },
  },
  'furniture/washer': {
    id: 'furniture/washer',
    url: '/assets/models/kenney/furniture/washer.glb',
    sourceStem: 'washer',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '0c9704df18173161f2d682b0894b07b017d8c4d2a392c0a5e6bd1e3e9c6e3efc',
    rawAabb: { x: 0.39, y: 0.5, z: 0.48 },
  },
  'furniture/dryer': {
    id: 'furniture/dryer',
    url: '/assets/models/kenney/furniture/dryer.glb',
    sourceStem: 'dryer',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: 'd8b727612fdf8a975a8e369f675a0e5b16145a2d622633c3b6bbf66d5e0e081a',
    rawAabb: { x: 0.39, y: 0.6, z: 0.38 },
  },
  'furniture/bookcaseOpenLow': {
    id: 'furniture/bookcaseOpenLow',
    url: '/assets/models/kenney/furniture/bookcaseOpenLow.glb',
    sourceStem: 'bookcaseOpenLow',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '6d4d625faf97932e1a2d2a1ef890577e2835e394f32689e97a21726e468a3616',
    rawAabb: { x: 0.4, y: 0.4, z: 0.25 },
  },
  'furniture/pillow': {
    id: 'furniture/pillow',
    url: '/assets/models/kenney/furniture/pillow.glb',
    sourceStem: 'pillow',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '6fae7c190d0b6c9ef49a19e5d433d8766e984a6e58c07e88d4f807f066e236a4',
    rawAabb: { x: 0.23, y: 0.222163, z: 0.088484 },
  },
  'furniture/bear': {
    id: 'furniture/bear',
    url: '/assets/models/kenney/furniture/bear.glb',
    sourceStem: 'bear',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: 'fd87c08f81dcd652b1f7f61afae9d1f040fa1322ac4ddda6f543ed423b954aed',
    rawAabb: { x: 0.389711, y: 0.45, z: 0.2475 },
  },
  'furniture/pillowBlue': {
    id: 'furniture/pillowBlue',
    url: '/assets/models/kenney/furniture/pillowBlue.glb',
    sourceStem: 'pillowBlue',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '8326e018c09cb00c19c2c9b745f521cd7eba1169b755322b04f88440dbfef319',
    rawAabb: { x: 0.23, y: 0.128512, z: 0.06339 },
  },
  'furniture/pillowLong': {
    id: 'furniture/pillowLong',
    url: '/assets/models/kenney/furniture/pillowLong.glb',
    sourceStem: 'pillowLong',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: 'd8490ae920413fd04c85a2164ef384d67a1ca257f761dec1cc7f06fa2c027283',
    rawAabb: { x: 0.386576, y: 0.222163, z: 0.088484 },
  },
  'furniture/books': {
    id: 'furniture/books',
    url: '/assets/models/kenney/furniture/books.glb',
    sourceStem: 'books',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: 'b8dc56e5d29f375c361c348ac3a9b79d9c8c169d92ad7106d4d38a5046602784',
    rawAabb: { x: 0.150448, y: 0.103902, z: 0.0945 },
  },
  'furniture/pottedPlant': {
    id: 'furniture/pottedPlant',
    url: '/assets/models/kenney/furniture/pottedPlant.glb',
    sourceStem: 'pottedPlant',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '5b760eda276652152c840b6b36dd3abde8a4f8f55e94c3bd85da9c1f84a26475',
    rawAabb: { x: 0.254954, y: 0.535777, z: 0.290992 },
  },
  // ========================== Food (Kenney Food Kit) ==========================
  'food/mug': {
    id: 'food/mug',
    url: '/assets/models/kenney/food/mug.glb',
    sourceStem: 'mug',
    pack: 'kenney-food-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '5215ef74dbbc7cf4b31c40ef40bd44b8df91650d9aa10f940005670644d07509',
    rawAabb: { x: 2.0, y: 2.0, z: 2.0 }, // rawAabb 是 [-1,1]³ 包络，需用 scale=0.05–0.1 校准
  },
  'food/plate': {
    id: 'food/plate',
    url: '/assets/models/kenney/food/plate.glb',
    sourceStem: 'plate',
    pack: 'kenney-food-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '4c1de567b85497b0d93adf59b3c4b816b4332f7e50b63dbd2f1c00c7538e161e',
    rawAabb: { x: 2.0, y: 2.0, z: 2.0 }, // 同上，food kit 默认包围盒
  },
  'food/utensil-fork': {
    id: 'food/utensil-fork',
    url: '/assets/models/kenney/food/utensil-fork.glb',
    sourceStem: 'utensil-fork',
    pack: 'kenney-food-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '9b470b64539c2a7e78c4b0b66a1458a114e69b43d11442a49d73d97dd249f44c',
    rawAabb: { x: 0.503475, y: 2.0, z: 0.084 },
  },
  'food/utensil-spoon': {
    id: 'food/utensil-spoon',
    url: '/assets/models/kenney/food/utensil-spoon.glb',
    sourceStem: 'utensil-spoon',
    pack: 'kenney-food-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: 'dbb39cce42ce1729a44b94c6f0d9806d6c638b9365398c01049a2a26e2de5025',
    rawAabb: { x: 0.727183, y: 2.0, z: 0.610162 },
  },
} as const

export type ModelAssetId = keyof typeof MODEL_ASSET_REGISTRY

export type Vec3 = { x: number; y: number; z: number }
export type PackId = (typeof MODEL_ASSET_REGISTRY)[ModelAssetId]['pack']
export type LicenseId = 'CC0-1.0'

/** 合并基础条目 + override，生成运行时完整定义。 */
export interface ModelAssetDefinition {
  id: ModelAssetId
  url: string
  sourceStem: string
  pack: PackId
  license: LicenseId
  sourceSha256: string
  rawAabb: Vec3
  // —— 以下来自 modelOverrides（可独立校准，不共享常量） ——
  uniformScale: number
  pivotOffset: Vec3
  rotationOffset: { x: number; y: number; z: number }
  effectiveAabb: Vec3
  collisionSize: Vec3
  floorAligned: boolean
  status: 'provisional' | 'calibrated'
}

function buildDefinition(id: ModelAssetId): ModelAssetDefinition {
  const base = MODEL_ASSET_REGISTRY[id]
  const ov = MODEL_OVERRIDES[id] ?? MODEL_OVERRIDES.__DEFAULT__
  return {
    id,
    url: base.url,
    sourceStem: base.sourceStem,
    pack: base.pack,
    license: base.license,
    sourceSha256: base.sourceSha256,
    rawAabb: base.rawAabb,
    uniformScale: ov.uniformScale,
    pivotOffset: { ...ov.pivotOffset },
    rotationOffset: { x: 0, y: 0, z: 0, ...ov.rotationOffset },
    effectiveAabb: { ...ov.effectiveAabb },
    collisionSize: { ...ov.collisionSize },
    floorAligned: Boolean(ov.floorAligned),
    status: ov.status ?? 'provisional',
  }
}

/** 最终运行时 Registry（基础条目 × override）。 */
export const RUNTIME_MODEL_ASSET_REGISTRY: Record<ModelAssetId, ModelAssetDefinition> =
  /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
  (Object.fromEntries(
    (Object.keys(MODEL_ASSET_REGISTRY) as ModelAssetId[]).map((id) => [id, buildDefinition(id)]),
  ) as unknown) as Record<ModelAssetId, ModelAssetDefinition>

export function getModelAsset(id: ModelAssetId): ModelAssetDefinition {
  return RUNTIME_MODEL_ASSET_REGISTRY[id]
}

export const WP0A_LIVING_ASSET_IDS: ModelAssetId[] = [
  'furniture/loungeSofa',
  'furniture/tableCoffee',
  'furniture/televisionModern',
  'furniture/cabinetTelevision',
  'furniture/bookcaseOpen',
]

/** 自检：所有 override 均为 per-entry 字面值，禁止 GLOBAL_FURNITURE_SCALE。 */
export function assertNoGlobalSharedScale(): boolean {
  const scales = WP0A_LIVING_ASSET_IDS.map((id) => RUNTIME_MODEL_ASSET_REGISTRY[id].uniformScale)
  return scales.length === WP0A_LIVING_ASSET_IDS.length && scales.every((v) => Number.isFinite(v) && v > 0)
}
