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
