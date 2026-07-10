export interface MaterialConfig {
  roughness: number
  metalness: number
  emissiveIntensity: number
  transparent?: boolean
  opacity?: number
}

export const STYLIZED_MATERIALS: Record<string, MaterialConfig> = {
  plastic: {
    roughness: 0.45,
    metalness: 0.1,
    emissiveIntensity: 0,
  },

  metal: {
    roughness: 0.25,
    metalness: 0.85,
    emissiveIntensity: 0,
  },

  fabric: {
    roughness: 0.9,
    metalness: 0,
    emissiveIntensity: 0,
  },

  glass: {
    roughness: 0.05,
    metalness: 0.1,
    emissiveIntensity: 0,
    transparent: true,
    opacity: 0.3,
  },

  wood: {
    roughness: 0.65,
    metalness: 0.05,
    emissiveIntensity: 0,
  },

  paper: {
    roughness: 0.92,
    metalness: 0,
    emissiveIntensity: 0,
  },

  ceramic: {
    roughness: 0.3,
    metalness: 0.05,
    emissiveIntensity: 0,
  },

  emissive: {
    roughness: 0.2,
    metalness: 0,
    emissiveIntensity: 1.0,
  },

  rubber: {
    roughness: 0.8,
    metalness: 0,
    emissiveIntensity: 0,
  },

  leather: {
    roughness: 0.55,
    metalness: 0.05,
    emissiveIntensity: 0,
  },

  stone: {
    roughness: 0.7,
    metalness: 0.05,
    emissiveIntensity: 0,
  },

  screen: {
    roughness: 0.1,
    metalness: 0.3,
    emissiveIntensity: 0.5,
  },
}

export type MaterialType = keyof typeof STYLIZED_MATERIALS

export function getMaterialConfig(type: string): MaterialConfig {
  return STYLIZED_MATERIALS[type] || STYLIZED_MATERIALS.plastic
}
