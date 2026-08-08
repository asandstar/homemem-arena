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
  // ===================== Furniture 扩展：Living 客厅增强 =====================
  'furniture/lampRoundFloor': {
    id: 'furniture/lampRoundFloor',
    url: '/assets/models/kenney/furniture/lampRoundFloor.glb',
    sourceStem: 'lampRoundFloor',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '50fe1b5b588edf15bfa9cc880f71a02a4fda6036350b24733d0ef4de5cc5e908',
    rawAabb: { x: 0.152, y: 0.86, z: 0.1756 },
  },
  'furniture/lampSquareFloor': {
    id: 'furniture/lampSquareFloor',
    url: '/assets/models/kenney/furniture/lampSquareFloor.glb',
    sourceStem: 'lampSquareFloor',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '6466993748d8e184de9ec5b6b0af613867c50c0ce320d1898b1db9e4c27c2561',
    rawAabb: { x: 0.12, y: 0.86, z: 0.12 },
  },
  'furniture/loungeChair': {
    id: 'furniture/loungeChair',
    url: '/assets/models/kenney/furniture/loungeChair.glb',
    sourceStem: 'loungeChair',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: 'ddfe6bc4b3451bca61666d7b614552d6ed2a03d82fc76244b72ae3155874dc6c',
    rawAabb: { x: 0.49, y: 0.46, z: 0.41 },
  },
  'furniture/loungeChairRelax': {
    id: 'furniture/loungeChairRelax',
    url: '/assets/models/kenney/furniture/loungeChairRelax.glb',
    sourceStem: 'loungeChairRelax',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: 'def698179e44de6cd17f4cfc2730273da54dd25458a29b079fbf4468abe5d98e',
    rawAabb: { x: 0.49, y: 0.63, z: 0.6747 },
  },
  'furniture/loungeDesignChair': {
    id: 'furniture/loungeDesignChair',
    url: '/assets/models/kenney/furniture/loungeDesignChair.glb',
    sourceStem: 'loungeDesignChair',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: 'f0766a7d5698974b711adac18a2108f0e74e3a036fa4e4e0ccf91195b0ee5abf',
    rawAabb: { x: 0.7296, y: 0.4, z: 0.41 },
  },
  'furniture/sideTable': {
    id: 'furniture/sideTable',
    url: '/assets/models/kenney/furniture/sideTable.glb',
    sourceStem: 'sideTable',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '8227810584f7d37582e4e9ec821c56f1dc54b99c88a8dc74242ea3b7402bc472',
    rawAabb: { x: 0.5345, y: 0.3844, z: 0.22 },
  },
  'furniture/sideTableDrawers': {
    id: 'furniture/sideTableDrawers',
    url: '/assets/models/kenney/furniture/sideTableDrawers.glb',
    sourceStem: 'sideTableDrawers',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '911145653c11b103b2c2e84f3d019205d1886186015c3b52aceddc3801ae8fdf',
    rawAabb: { x: 0.5345, y: 0.3844, z: 0.3863 },
  },
  'furniture/plantSmall1': {
    id: 'furniture/plantSmall1',
    url: '/assets/models/kenney/furniture/plantSmall1.glb',
    sourceStem: 'plantSmall1',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '2b9c022feb47be857b2c4fdc29f36522766ba9b70c578c31d7c05d71b4377d15',
    rawAabb: { x: 0.1893, y: 0.28, z: 0.1893 },
  },
  'furniture/plantSmall2': {
    id: 'furniture/plantSmall2',
    url: '/assets/models/kenney/furniture/plantSmall2.glb',
    sourceStem: 'plantSmall2',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: 'd7c8ff42c66dd4f9238a73570549813d1ca6c5f6f661d7af9cb764c4fce314b9',
    rawAabb: { x: 0.1893, y: 0.28, z: 0.1893 },
  },
  'furniture/plantSmall3': {
    id: 'furniture/plantSmall3',
    url: '/assets/models/kenney/furniture/plantSmall3.glb',
    sourceStem: 'plantSmall3',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '1aa38b1b22bd19fa4f9f3abd8c4cbf50da2d6fa721cf1f9aa4d80bb89b1bef94',
    rawAabb: { x: 0.1697, y: 0.29, z: 0.196 },
  },
  'furniture/rugRound': {
    id: 'furniture/rugRound',
    url: '/assets/models/kenney/furniture/rugRound.glb',
    sourceStem: 'rugRound',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: 'c4cdc8f51ed2dbfb853b147521ed40e995307392fd3b19045b2203ea50f376db',
    rawAabb: { x: 0.92, y: 0.01, z: 0.92 },
  },
  'furniture/rugRounded': {
    id: 'furniture/rugRounded',
    url: '/assets/models/kenney/furniture/rugRounded.glb',
    sourceStem: 'rugRounded',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '2ef5cc634bb1060a1a5774cfcaf6e11c235791c99d6b59da5fdbc09edfb95a68',
    rawAabb: { x: 1.57, y: 0.01, z: 0.92 },
  },
  'furniture/speakerSmall': {
    id: 'furniture/speakerSmall',
    url: '/assets/models/kenney/furniture/speakerSmall.glb',
    sourceStem: 'speakerSmall',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '34db09984703282822f3f57fc9a31bfdfa6a8f6bf8251893d0c907e7ee6601b2',
    rawAabb: { x: 0.148, y: 0.298, z: 0.1332 },
  },
  'furniture/radio': {
    id: 'furniture/radio',
    url: '/assets/models/kenney/furniture/radio.glb',
    sourceStem: 'radio',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '1ba93d6ba6f049750853b4652b92f286f2898e527695a0705b75cc7615897fed',
    rawAabb: { x: 0.315, y: 0.2282, z: 0.0975 },
  },
  // ===================== Furniture 扩展：Bedroom 卧室增强 =====================
  'furniture/cabinetBed': {
    id: 'furniture/cabinetBed',
    url: '/assets/models/kenney/furniture/cabinetBed.glb',
    sourceStem: 'cabinetBed',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: 'b651fafb9e2c8e4adcb8cad3d10dc94404b46fe039b26e66b2c9020df4e5301d',
    rawAabb: { x: 0.266, y: 0.2332, z: 0.2173 },
  },
  'furniture/cabinetBedDrawerTable': {
    id: 'furniture/cabinetBedDrawerTable',
    url: '/assets/models/kenney/furniture/cabinetBedDrawerTable.glb',
    sourceStem: 'cabinetBedDrawerTable',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: 'fec6271639df5aff9f8ac75d6679385eab2abb7c8d2f51abeba3ed689ddb6f0d',
    rawAabb: { x: 0.266, y: 0.2632, z: 0.3813 },
  },
  'furniture/bedSingle': {
    id: 'furniture/bedSingle',
    url: '/assets/models/kenney/furniture/bedSingle.glb',
    sourceStem: 'bedSingle',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: 'ca00c63f9a12da3138d902b2f5f18e0360fb6e8a5ac42ccb4bc3f185724b65d1',
    rawAabb: { x: 1.6232, y: 0.505, z: 1.892 },
  },
  'furniture/bathroomMirror': {
    id: 'furniture/bathroomMirror',
    url: '/assets/models/kenney/furniture/bathroomMirror.glb',
    sourceStem: 'bathroomMirror',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '940b986894101ea59b50541554b6dc608a22b133057975849259009012984175',
    rawAabb: { x: 0.3013, y: 0.4346, z: 0.1444 },
  },
  // ===================== Furniture 扩展：Kitchen 厨房增强 =====================
  'furniture/kitchenFridge': {
    id: 'furniture/kitchenFridge',
    url: '/assets/models/kenney/furniture/kitchenFridge.glb',
    sourceStem: 'kitchenFridge',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '8af4f4bbb1b5525ad8226e97926a5af60fa8fb20a3cb74dbda5328a9d320dbab',
    rawAabb: { x: 0.43, y: 0.92, z: 0.3169 },
  },
  'furniture/kitchenFridgeLarge': {
    id: 'furniture/kitchenFridgeLarge',
    url: '/assets/models/kenney/furniture/kitchenFridgeLarge.glb',
    sourceStem: 'kitchenFridgeLarge',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '5851cc59c7e12f6f34a01a2ea93d5b9540be4078c1b703f517239fcede98fb32',
    rawAabb: { x: 0.7932, y: 1.3232, z: 0.3855 },
  },
  // L3：上层橱柜（挂墙式，非落地）
  'furniture/kitchenCabinetUpper': {
    id: 'furniture/kitchenCabinetUpper',
    url: '/assets/models/kenney/furniture/kitchenCabinetUpper.glb',
    sourceStem: 'kitchenCabinetUpper',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '0000000000000000000000000000000000000000000000000000000000000000',
    rawAabb: { x: 0.43, y: 0.56, z: 0.32 },
  },
  'furniture/kitchenStove': {
    id: 'furniture/kitchenStove',
    url: '/assets/models/kenney/furniture/kitchenStove.glb',
    sourceStem: 'kitchenStove',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '3239edb36295dfca9530a9b9a6ad0aff98ce62e7cf8d13ca2a5a1a6b2a904656',
    rawAabb: { x: 0.43, y: 0.45, z: 0.48 },
  },
  'furniture/kitchenStoveElectric': {
    id: 'furniture/kitchenStoveElectric',
    url: '/assets/models/kenney/furniture/kitchenStoveElectric.glb',
    sourceStem: 'kitchenStoveElectric',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: 'cf646b960d7dfed1fac27898ff6de1f0671cfa33beecbed06ead7d0684517392',
    rawAabb: { x: 0.43, y: 0.45, z: 0.45 },
  },
  'furniture/kitchenMicrowave': {
    id: 'furniture/kitchenMicrowave',
    url: '/assets/models/kenney/furniture/kitchenMicrowave.glb',
    sourceStem: 'kitchenMicrowave',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: 'dd6a6c919f4bebc6e2080fe419262cf97a0d6461ead3f3998aa3c9edf4d2bd27',
    rawAabb: { x: 0.29, y: 0.18, z: 0.23 },
  },
  'furniture/kitchenCabinet': {
    id: 'furniture/kitchenCabinet',
    url: '/assets/models/kenney/furniture/kitchenCabinet.glb',
    sourceStem: 'kitchenCabinet',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '7238c57778935ae25db5e57e9f7af3ba7068c71b005ff7cfbff3b6f3b1a13200',
    rawAabb: { x: 0.43, y: 0.45, z: 0.48 },
  },
  'furniture/cabinetTelevisionDoors': {
    id: 'furniture/cabinetTelevisionDoors',
    url: '/assets/models/kenney/furniture/cabinetTelevisionDoors.glb',
    sourceStem: 'cabinetTelevisionDoors',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '8959347bfe26b1ac7e44c476f05789466bb84bcd2ad8b0fb40286005399bfcfc',
    rawAabb: { x: 1.16, y: 0.31, z: 0.28 },
  },
  // ===================== Furniture 扩展：Dining Chairs 餐椅变体 =====================
  'furniture/chairCushion': {
    id: 'furniture/chairCushion',
    url: '/assets/models/kenney/furniture/chairCushion.glb',
    sourceStem: 'chairCushion',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '33544228984857f2cb502b58452fed72157335f9b1caf29e96da5c9094c53fdc',
    rawAabb: { x: 0.2, y: 0.46, z: 0.2 },
  },
  'furniture/chairRounded': {
    id: 'furniture/chairRounded',
    url: '/assets/models/kenney/furniture/chairRounded.glb',
    sourceStem: 'chairRounded',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '53f4933ec547179c499f04dbda1231cf44b83ec82c7f4ab981cdf680aee5c973',
    rawAabb: { x: 0.2, y: 0.455, z: 0.2 },
  },
  'furniture/chairModernCushion': {
    id: 'furniture/chairModernCushion',
    url: '/assets/models/kenney/furniture/chairModernCushion.glb',
    sourceStem: 'chairModernCushion',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '245132697e633e907e2b48c86d56f6c8543604a3440a055d1c71c06ce11d2858',
    rawAabb: { x: 0.2, y: 0.46, z: 0.2 },
  },
  'furniture/chairDesk': {
    id: 'furniture/chairDesk',
    url: '/assets/models/kenney/furniture/chairDesk.glb',
    sourceStem: 'chairDesk',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '46406619186034cbe92b19b79a5f1a8e3f442a17a70a7524ef2c0ad0f35095c6',
    rawAabb: { x: 0.4787, y: 0.4176, z: 0.4432 },
  },
  // ===================== Furniture 扩展：Bathroom 浴室（视觉装饰用） =====================
  'furniture/bathroomSink': {
    id: 'furniture/bathroomSink',
    url: '/assets/models/kenney/furniture/bathroomSink.glb',
    sourceStem: 'bathroomSink',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '39d4f19608cab7e0fed52303b2c689f5f51fae1bad9b6913cb53d838875e797e',
    rawAabb: { x: 0.34, y: 0.56, z: 0.29 },
  },
  'furniture/bathroomCabinet': {
    id: 'furniture/bathroomCabinet',
    url: '/assets/models/kenney/furniture/bathroomCabinet.glb',
    sourceStem: 'bathroomCabinet',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '9db540227acaaedbbadc6a085f4a00460b73944e608afaad4770e53238a3b7f8',
    rawAabb: { x: 0.43, y: 0.39, z: 0.22 },
  },
  'furniture/bathtub': {
    id: 'furniture/bathtub',
    url: '/assets/models/kenney/furniture/bathtub.glb',
    sourceStem: 'bathtub',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '54c405c7035aab63dc41e709dc3c50fc5bcfbc4cddc91ffc54188075a6d25d01',
    rawAabb: { x: 1.19, y: 0.42, z: 0.56 },
  },
  'furniture/toilet': {
    id: 'furniture/toilet',
    url: '/assets/models/kenney/furniture/toilet.glb',
    sourceStem: 'toilet',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '16165cfd03c56c2cb443b800570810a22ef770f65e7a468f6761d9dc14eaaeae',
    rawAabb: { x: 1.0046, y: 0.9494, z: 0.7897 },
  },
  // ===================== Furniture 扩展：Desk / Office 办公/书桌 =====================
  'furniture/desk': {
    id: 'furniture/desk',
    url: '/assets/models/kenney/furniture/desk.glb',
    sourceStem: 'desk',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '0164fe828f028b321730fb8c74502e353583f751be74da1682d42fff7d3c5a42',
    rawAabb: { x: 0.7345, y: 0.3844, z: 0.5563 },
  },
  'furniture/deskCorner': {
    id: 'furniture/deskCorner',
    url: '/assets/models/kenney/furniture/deskCorner.glb',
    sourceStem: 'deskCorner',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: 'a6a77ba0083d5ecd34ad50f738867b03ed7b7f469429bb1acc78f423bcc3f034',
    rawAabb: { x: 0.9745, y: 0.3844, z: 1.1508 },
  },
  'furniture/computerScreen': {
    id: 'furniture/computerScreen',
    url: '/assets/models/kenney/furniture/computerScreen.glb',
    sourceStem: 'computerScreen',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '5942cbad29a2d2b956619569926e81d50a4174403d592fece6556e57632dc643',
    rawAabb: { x: 0.3927, y: 0.2943, z: 0.104 },
  },
  'furniture/computerKeyboard': {
    id: 'furniture/computerKeyboard',
    url: '/assets/models/kenney/furniture/computerKeyboard.glb',
    sourceStem: 'computerKeyboard',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '9d9135789de2120e9f41ce3f0a56dd1b15f40adcc7888739bb842a2d820da322',
    rawAabb: { x: 0.2822, y: 0.0276, z: 0.1182 },
  },
  'furniture/computerMouse': {
    id: 'furniture/computerMouse',
    url: '/assets/models/kenney/furniture/computerMouse.glb',
    sourceStem: 'computerMouse',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: 'd3ad1a923f0f7707ef367bb969eb94c9076e211c98c830ba52e133fadc5cdfc0',
    rawAabb: { x: 0.0497, y: 0.0236, z: 0.0851 },
  },
  'furniture/laptop': {
    id: 'furniture/laptop',
    url: '/assets/models/kenney/furniture/laptop.glb',
    sourceStem: 'laptop',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '5fa8a1f4a71ab8d82ef64da77a6973ffd350c6d4557516069a4ffd4bb8d808af',
    rawAabb: { x: 0.6, y: 0.3677, z: 0.5456 },
  },
  'furniture/bookcaseClosed': {
    id: 'furniture/bookcaseClosed',
    url: '/assets/models/kenney/furniture/bookcaseClosed.glb',
    sourceStem: 'bookcaseClosed',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '9d210448de5e1179541da895450bbc7a39f4cd673d677654cd6b134e4ea0e047',
    rawAabb: { x: 0.4, y: 0.85, z: 0.25 },
  },
  'furniture/toaster': {
    id: 'furniture/toaster',
    url: '/assets/models/kenney/furniture/toaster.glb',
    sourceStem: 'toaster',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '38c1fb7b122be9997758c8ee855d87f28014cf282f24d66d39f4e8d8b236d2af',
    rawAabb: { x: 0.188, y: 0.13, z: 0.1 },
  },
  'furniture/kitchenCoffeeMachine': {
    id: 'furniture/kitchenCoffeeMachine',
    url: '/assets/models/kenney/furniture/kitchenCoffeeMachine.glb',
    sourceStem: 'kitchenCoffeeMachine',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '063f582c6fa0f00a9f24e3393dac2295491c4becdaf5513c893ab1a2826b6ec3',
    rawAabb: { x: 0.2738, y: 0.3034, z: 0.3301 },
  },
  'furniture/kitchenBlender': {
    id: 'furniture/kitchenBlender',
    url: '/assets/models/kenney/furniture/kitchenBlender.glb',
    sourceStem: 'kitchenBlender',
    pack: 'kenney-furniture-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: 'f471defb5b2b1cf3b949a1a8aaef0a8b727afe662b0815068cf4e963325a3c1f',
    rawAabb: { x: 0.1719, y: 0.16, z: 0.1323 },
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
  // L3：麦片盒（carton），food kit 模型：[-1,1]³ 包络
  'food/carton': {
    id: 'food/carton',
    url: '/assets/models/kenney/food/carton.glb',
    sourceStem: 'carton',
    pack: 'kenney-food-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '0000000000000000000000000000000000000000000000000000000000000000',
    rawAabb: { x: 2.0, y: 2.0, z: 2.0 },
  },
  // L3：早餐碗（bowl），food kit 模型：[-1,1]³ 包络
  'food/bowl': {
    id: 'food/bowl',
    url: '/assets/models/kenney/food/bowl.glb',
    sourceStem: 'bowl',
    pack: 'kenney-food-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '0000000000000000000000000000000000000000000000000000000000000000',
    rawAabb: { x: 2.0, y: 2.0, z: 2.0 },
  },
  // L3：早餐杯（cup），food kit 模型：[-1,1]³ 包络
  'food/cup': {
    id: 'food/cup',
    url: '/assets/models/kenney/food/cup.glb',
    sourceStem: 'cup',
    pack: 'kenney-food-kit' as const,
    license: 'CC0-1.0' as const,
    sourceSha256: '0000000000000000000000000000000000000000000000000000000000000000',
    rawAabb: { x: 2.0, y: 2.0, z: 2.0 },
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
