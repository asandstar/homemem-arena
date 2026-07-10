export const PALETTE = {
  background: {
    wall: '#f5f5dc',
    floor: '#d4c5b0',
    furniture: '#8b7355',
    wood: '#8b5a2b',
    darkWood: '#654321',
  },

  taskObjects: {
    milk: '#ffffff',
    milkLabel: '#4f46e5',
    cereal: '#fbbf24',
    cup: '#f87171',
    bowl: '#9ca3af',
    spoon: '#e5e7eb',
    plate: '#fef3c7',
    keys: '#f59e0b',
    phone: '#1f2937',
    phoneScreen: '#10b981',
    umbrella: '#ef4444',
    remote: '#6b7280',
    cloth: '#ec4899',
    towel: '#3b82f6',
    trash: '#78350f',
  },

  status: {
    success: '#22c55e',
    successLight: '#86efac',
    error: '#ef4444',
    errorLight: '#fca5a5',
    warning: '#f59e0b',
    warningLight: '#fcd34d',
    info: '#3b82f6',
    infoLight: '#93c5fd',
  },

  memory: {
    primary: '#8b5cf6',
    secondary: '#a78bfa',
    glow: '#c4b5fd',
    slot: '#6d28d9',
  },

  danger: {
    primary: '#ef4444',
    secondary: '#dc2626',
    warning: '#f97316',
  },

  target: {
    primary: '#10b981',
    secondary: '#059669',
    highlight: '#34d399',
  },

  ambient: {
    warm: '#ffecd2',
    cool: '#e0f7fa',
    soft: '#fce7f3',
    neutral: '#f3f4f6',
  },
}

export const MATERIAL_CONFIG: Record<string, { roughness: number; metalness: number; emissive?: string; emissiveIntensity?: number }> = {
  screen: { roughness: 0.1, metalness: 0.3, emissive: '#10b981', emissiveIntensity: 0.3 },
  metal: { roughness: 0.2, metalness: 0.8, emissive: '#000000', emissiveIntensity: 0 },
  cloth: { roughness: 0.85, metalness: 0.05, emissive: '#000000', emissiveIntensity: 0 },
  plastic: { roughness: 0.4, metalness: 0.1, emissive: '#000000', emissiveIntensity: 0 },
  ceramic: { roughness: 0.3, metalness: 0.1, emissive: '#000000', emissiveIntensity: 0 },
  wood: { roughness: 0.7, metalness: 0.1, emissive: '#000000', emissiveIntensity: 0 },
  glass: { roughness: 0.05, metalness: 0.05, emissive: '#000000', emissiveIntensity: 0 },
  paper: { roughness: 0.9, metalness: 0, emissive: '#000000', emissiveIntensity: 0 },
}

export const CATEGORY_MATERIAL_MAP: Record<string, keyof typeof MATERIAL_CONFIG> = {
  milk: 'paper',
  cereal: 'paper',
  cup: 'ceramic',
  bowl: 'ceramic',
  spoon: 'metal',
  plate: 'ceramic',
  keys: 'metal',
  phone: 'plastic',
  phoneScreen: 'screen',
  umbrella: 'plastic',
  remote: 'plastic',
  cloth: 'cloth',
  towel: 'cloth',
  trash: 'plastic',
}

export const ROOM_AMBIENT_COLORS: Record<string, string> = {
  living: '#ffecd2',
  bedroom: '#fce7f3',
  kitchen: '#e0f7fa',
  entrance: '#d1fae5',
  laundry: '#e0e7ff',
  dining: '#fef3c7',
}