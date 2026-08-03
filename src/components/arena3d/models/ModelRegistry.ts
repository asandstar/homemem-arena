import React from 'react'
import { PALETTE } from '../materials/palette'
import {
  KeyFallback,
  PhoneFallback,
  UmbrellaFallback,
  MilkCartonFallback,
  CerealBoxFallback,
  CupFallback,
  BowlFallback,
  PlateFallback,
  SpoonFallback,
  ForkFallback,
  TissueFallback,
  RemoteFallback,
  ClothWhiteFallback,
  ClothDarkFallback,
  TowelFallback,
  TrashFallback,
  FridgeFallback,
  CabinetFallback,
  SinkFallback,
  DishwasherFallback,
  SofaFallback,
  CoffeeTableFallback,
  BedFallback,
  DeskFallback,
  LaundryBasketFallback,
  EntranceTrayFallback,
  LampFallback,
  PlantFallback,
  RugFallback,
  PillowFallback,
  ShoesFallback,
  HookFallback,
  TVFallback,
  BookshelfFallback,
  ChairFallback,
  DresserFallback,
  PaintingFallback,
  ClockFallback,
  ShelfFallback,
} from './FallbackModels'

export interface ModelConfig {
  path: string
  /** false 表示刻意使用程序化 fallback，避免浏览器请求不存在的 GLB */
  assetAvailable?: boolean
  fallback: React.ComponentType<any>
  scale: number
  rotation: [number, number, number]
  heightOffset: number
  highlightColor: string
  castShadow: boolean
  receiveShadow: boolean
  materialType: string
}

export const MODEL_REGISTRY: Record<string, ModelConfig> = {
  key: {
    path: '/assets/models/props/key.glb',
    fallback: KeyFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0.02,
    highlightColor: PALETTE.taskObjects.key,
    castShadow: true,
    receiveShadow: false,
    materialType: 'metal',
  },

  phone: {
    path: '/assets/models/props/phone.glb',
    fallback: PhoneFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0.01,
    highlightColor: PALETTE.taskObjects.phone_screen,
    castShadow: true,
    receiveShadow: false,
    materialType: 'plastic',
  },

  umbrella: {
    path: '/assets/models/props/umbrella.glb',
    fallback: UmbrellaFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0,
    highlightColor: PALETTE.taskObjects.umbrella,
    castShadow: true,
    receiveShadow: false,
    materialType: 'fabric',
  },

  milk_carton: {
    path: '/assets/models/props/milk_carton.glb',
    fallback: MilkCartonFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0,
    highlightColor: PALETTE.taskObjects.milk_label,
    castShadow: true,
    receiveShadow: false,
    materialType: 'paper',
  },

  cereal_box: {
    path: '/assets/models/props/cereal_box.glb',
    fallback: CerealBoxFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0,
    highlightColor: PALETTE.taskObjects.cereal_box,
    castShadow: true,
    receiveShadow: false,
    materialType: 'paper',
  },

  cup: {
    path: '/assets/models/props/cup.glb',
    fallback: CupFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0,
    highlightColor: PALETTE.taskObjects.cup,
    castShadow: true,
    receiveShadow: false,
    materialType: 'ceramic',
  },

  bowl: {
    path: '/assets/models/props/bowl.glb',
    fallback: BowlFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0,
    highlightColor: PALETTE.taskObjects.bowl,
    castShadow: true,
    receiveShadow: false,
    materialType: 'ceramic',
  },

  plate: {
    path: '/assets/models/props/plate.glb',
    fallback: PlateFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0,
    highlightColor: PALETTE.taskObjects.plate,
    castShadow: true,
    receiveShadow: true,
    materialType: 'ceramic',
  },

  remote: {
    path: '/assets/models/props/remote.glb',
    fallback: RemoteFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0.01,
    highlightColor: PALETTE.status.info,
    castShadow: true,
    receiveShadow: false,
    materialType: 'plastic',
  },

  cloth_white: {
    path: '/assets/models/props/cloth_white.glb',
    fallback: ClothWhiteFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0,
    highlightColor: PALETTE.status.info,
    castShadow: true,
    receiveShadow: false,
    materialType: 'fabric',
  },

  cloth_dark: {
    path: '/assets/models/props/cloth_dark.glb',
    fallback: ClothDarkFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0,
    highlightColor: PALETTE.status.memory,
    castShadow: true,
    receiveShadow: false,
    materialType: 'fabric',
  },

  towel: {
    path: '/assets/models/props/towel.glb',
    fallback: TowelFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0,
    highlightColor: PALETTE.taskObjects.towel,
    castShadow: true,
    receiveShadow: false,
    materialType: 'fabric',
  },

  trash: {
    path: '/assets/models/props/trash.glb',
    fallback: TrashFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0,
    highlightColor: PALETTE.status.error,
    castShadow: true,
    receiveShadow: false,
    materialType: 'plastic',
  },

  spoon: {
    path: '',
    assetAvailable: false,
    fallback: SpoonFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0,
    highlightColor: PALETTE.status.info,
    castShadow: true,
    receiveShadow: false,
    materialType: 'metal',
  },

  fork: {
    path: '',
    assetAvailable: false,
    fallback: ForkFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0,
    highlightColor: PALETTE.status.info,
    castShadow: true,
    receiveShadow: false,
    materialType: 'metal',
  },

  tissue: {
    path: '',
    assetAvailable: false,
    fallback: TissueFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0,
    highlightColor: PALETTE.status.info,
    castShadow: true,
    receiveShadow: false,
    materialType: 'paper',
  },

  fridge: {
    path: '/assets/models/furniture/fridge.glb',
    fallback: FridgeFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0,
    highlightColor: PALETTE.status.info,
    castShadow: true,
    receiveShadow: true,
    materialType: 'metal',
  },

  cabinet: {
    path: '/assets/models/furniture/cabinet.glb',
    fallback: CabinetFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0,
    highlightColor: PALETTE.status.info,
    castShadow: true,
    receiveShadow: true,
    materialType: 'wood',
  },

  sink: {
    path: '/assets/models/furniture/sink.glb',
    fallback: SinkFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0,
    highlightColor: PALETTE.status.info,
    castShadow: true,
    receiveShadow: true,
    materialType: 'ceramic',
  },

  dishwasher: {
    path: '/assets/models/furniture/dishwasher.glb',
    fallback: DishwasherFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0,
    highlightColor: PALETTE.status.success,
    castShadow: true,
    receiveShadow: true,
    materialType: 'metal',
  },

  sofa: {
    path: '/assets/models/furniture/sofa.glb',
    fallback: SofaFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0,
    highlightColor: PALETTE.roomThemes.living.accent,
    castShadow: true,
    receiveShadow: true,
    materialType: 'fabric',
  },

  coffee_table: {
    path: '/assets/models/furniture/coffee_table.glb',
    fallback: CoffeeTableFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0,
    highlightColor: PALETTE.roomThemes.living.accent,
    castShadow: true,
    receiveShadow: true,
    materialType: 'wood',
  },

  bed: {
    path: '/assets/models/furniture/bed.glb',
    fallback: BedFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0,
    highlightColor: PALETTE.roomThemes.bedroom.accent,
    castShadow: true,
    receiveShadow: true,
    materialType: 'fabric',
  },

  desk: {
    path: '/assets/models/furniture/desk.glb',
    fallback: DeskFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0,
    highlightColor: PALETTE.roomThemes.bedroom.accent,
    castShadow: true,
    receiveShadow: true,
    materialType: 'wood',
  },

  laundry_basket: {
    path: '/assets/models/furniture/laundry_basket.glb',
    fallback: LaundryBasketFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0,
    highlightColor: PALETTE.roomThemes.laundry.accent,
    castShadow: true,
    receiveShadow: true,
    materialType: 'plastic',
  },

  entrance_tray: {
    path: '/assets/models/furniture/entrance_tray.glb',
    fallback: EntranceTrayFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0,
    highlightColor: PALETTE.roomThemes.entrance.accent,
    castShadow: true,
    receiveShadow: true,
    materialType: 'wood',
  },

  lamp: {
    path: '/assets/models/decor/lamp.glb',
    fallback: LampFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0,
    highlightColor: PALETTE.status.warning,
    castShadow: true,
    receiveShadow: false,
    materialType: 'emissive',
  },

  plant: {
    path: '/assets/models/decor/plant.glb',
    fallback: PlantFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0,
    highlightColor: PALETTE.status.success,
    castShadow: true,
    receiveShadow: true,
    materialType: 'plastic',
  },

  rug: {
    path: '/assets/models/decor/rug.glb',
    fallback: RugFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0.01,
    highlightColor: PALETTE.roomThemes.living.accent,
    castShadow: false,
    receiveShadow: true,
    materialType: 'fabric',
  },

  pillow: {
    path: '/assets/models/decor/pillow.glb',
    fallback: PillowFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0,
    highlightColor: PALETTE.roomThemes.bedroom.accent,
    castShadow: true,
    receiveShadow: false,
    materialType: 'fabric',
  },

  shoes: {
    path: '/assets/models/decor/shoes.glb',
    fallback: ShoesFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0.02,
    highlightColor: PALETTE.roomThemes.entrance.accent,
    castShadow: true,
    receiveShadow: false,
    materialType: 'rubber',
  },

  hook: {
    path: '/assets/models/decor/hook.glb',
    fallback: HookFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0,
    highlightColor: PALETTE.status.info,
    castShadow: true,
    receiveShadow: false,
    materialType: 'metal',
  },

  // 以下模型当前使用程序化 Fallback，避免请求不存在的 GLB（防止多次 setLoadError 导致 WebGL context lost）
  tv: {
    path: '',
    assetAvailable: false,
    fallback: TVFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0,
    highlightColor: PALETTE.status.info,
    castShadow: true,
    receiveShadow: true,
    materialType: 'plastic',
  },
  bookshelf: {
    path: '',
    assetAvailable: false,
    fallback: BookshelfFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0,
    highlightColor: PALETTE.roomThemes.living.accent,
    castShadow: true,
    receiveShadow: true,
    materialType: 'wood',
  },
  chair: {
    path: '',
    assetAvailable: false,
    fallback: ChairFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0,
    highlightColor: PALETTE.roomThemes.dining.accent,
    castShadow: true,
    receiveShadow: true,
    materialType: 'wood',
  },
  dresser: {
    path: '',
    assetAvailable: false,
    fallback: DresserFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0,
    highlightColor: PALETTE.roomThemes.bedroom.accent,
    castShadow: true,
    receiveShadow: true,
    materialType: 'wood',
  },
  painting: {
    path: '',
    assetAvailable: false,
    fallback: PaintingFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0,
    highlightColor: PALETTE.status.info,
    castShadow: false,
    receiveShadow: false,
    materialType: 'plastic',
  },
  clock: {
    path: '',
    assetAvailable: false,
    fallback: ClockFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0,
    highlightColor: PALETTE.status.warning,
    castShadow: false,
    receiveShadow: false,
    materialType: 'plastic',
  },
  shelf: {
    path: '',
    assetAvailable: false,
    fallback: ShelfFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0,
    highlightColor: PALETTE.status.info,
    castShadow: true,
    receiveShadow: true,
    materialType: 'metal',
  },
  cat: {
    path: '',
    assetAvailable: false,
    fallback: KeyFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0,
    highlightColor: PALETTE.roomThemes.entrance.accent,
    castShadow: true,
    receiveShadow: false,
    materialType: 'fabric',
  },
  entray: {
    path: '',
    assetAvailable: false,
    fallback: EntranceTrayFallback,
    scale: 1.0,
    rotation: [0, 0, 0],
    heightOffset: 0,
    highlightColor: PALETTE.roomThemes.entrance.accent,
    castShadow: true,
    receiveShadow: true,
    materialType: 'wood',
  },
}

export function getModelConfig(modelId: string): ModelConfig | undefined {
  return MODEL_REGISTRY[modelId]
}

export function getModelConfigOrThrow(modelId: string): ModelConfig {
  const config = MODEL_REGISTRY[modelId]
  if (!config) {
    throw new Error(`Model not found in registry: ${modelId}`)
  }
  return config
}

export const modelCategories = {
  props: [
    'key', 'phone', 'umbrella', 'milk_carton', 'cereal_box',
    'cup', 'bowl', 'plate', 'remote', 'cloth_white',
    'cloth_dark', 'towel', 'trash',
  ],
  furniture: [
    'fridge', 'cabinet', 'sink', 'dishwasher', 'sofa',
    'coffee_table', 'bed', 'desk', 'laundry_basket', 'entrance_tray',
  ],
  decor: [
    'lamp', 'plant', 'rug', 'pillow', 'shoes', 'hook',
  ],
}

// === A2 开发期注册表自检：只在 DEV 下做一次，发现不合法打 warn ===
;// noop 防止 ASI 把上一个对象字面量解析成 IIFE 的被调方
;(function DEV_MODEL_REGISTRY_SELF_CHECK() {
  try {
    const _env = (import.meta as any)?.env
    if (!_env?.DEV) return
    const warnedAt = new Map<string, number>()
    const warn = (k: string, msg: string) => {
      const key = `ModelRegistry|${k}|${msg}`
      const now = Date.now()
      if (now - (warnedAt.get(key) || 0) < 5000) return
      warnedAt.set(key, now)
      console.warn(`[ModelRegistry:DEV] ${msg} (modelId=${k})`)
    }

    for (const [id, cfg] of Object.entries(MODEL_REGISTRY)) {
      if (cfg.assetAvailable === false) {
        if (cfg.path) {
          warn(id, `assetAvailable=false 但 path 非空，建议置空以免误导`)
        }
      } else {
        if (!cfg.path) {
          warn(id, `assetAvailable !== false 但 path 为空，会被 ModelAsset 跳过加载`)
        } else if (!String(cfg.path).startsWith('/assets/models/')) {
          warn(id, `path 不以 '/assets/models/' 开头：${cfg.path}`)
        }
      }
      if (!cfg.fallback || typeof cfg.fallback !== 'function') {
        warn(id, `fallback 缺失 / 非法`)
      }
    }

    const allListed = [
      ...modelCategories.props,
      ...modelCategories.furniture,
      ...modelCategories.decor,
    ]
    allListed.forEach((id) => {
      if (!MODEL_REGISTRY[id]) {
        warn(id, `modelCategories 列出但 MODEL_REGISTRY 未注册`)
      }
    })
  } catch {
    /* 任何自检异常都不影响运行 */
  }
})()
