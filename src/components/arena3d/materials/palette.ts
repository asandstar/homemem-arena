export const PALETTE = {
  background: {
    wall_warm: '#f5eddc',
    wall_cream: '#faf3e0',
    wall_sage: '#e8e4d4',
    floor_warm: '#d4c5a8',
    floor_oak: '#c4a77d',
    floor_walnut: '#8b7355',
    ceiling: '#fdfbf7',
    trim: '#e8dcc8',
  },

  furniture: {
    wood_light: '#c9a87c',
    wood_medium: '#a67c52',
    wood_dark: '#6b4423',
    wood_walnut: '#5c4033',
    fabric_cream: '#f0e6d3',
    fabric_beige: '#d4c4a8',
    fabric_gray: '#9ca3af',
    fabric_sage: '#a8b5a0',
    fabric_dusty_blue: '#8fa3b0',
    fabric_terracotta: '#c47c60',
    metal_silver: '#b8c0c4',
    metal_black: '#3d3d3d',
    ceramic_white: '#f8f8f8',
    ceramic_cream: '#f5f0e8',
  },

  taskObjects: {
    key: '#f59e0b',
    phone: '#1f2937',
    phone_screen: '#10b981',
    umbrella: '#ef4444',
    milk_carton: '#ffffff',
    milk_label: '#4f46e5',
    cereal_box: '#fbbf24',
    cup: '#f87171',
    bowl: '#9ca3af',
    plate: '#fef3c7',
    remote: '#6b7280',
    cloth_white: '#f8fafc',
    cloth_dark: '#334155',
    towel: '#3b82f6',
    trash: '#78350f',
  },

  status: {
    success: '#22c55e',
    success_light: '#86efac',
    success_dark: '#15803d',
    error: '#ef4444',
    error_light: '#fca5a5',
    error_dark: '#b91c1c',
    warning: '#f59e0b',
    warning_light: '#fcd34d',
    warning_dark: '#b45309',
    info: '#3b82f6',
    info_light: '#93c5fd',
    info_dark: '#1d4ed8',
    memory: '#8b5cf6',
    memory_light: '#c4b5fd',
    memory_dark: '#6d28d9',
  },

  roomThemes: {
    entrance: {
      wall: '#e8f5e9',
      floor: '#c8dcc8',
      accent: '#66bb6a',
    },
    living: {
      wall: '#fff3e0',
      floor: '#d4c5a8',
      accent: '#ff8a65',
    },
    kitchen: {
      wall: '#e0f7fa',
      floor: '#b2dfdb',
      accent: '#26a69a',
    },
    bedroom: {
      wall: '#fce4ec',
      floor: '#d4c5a8',
      accent: '#f48fb1',
    },
    laundry: {
      wall: '#e8eaf6',
      floor: '#c5cae9',
      accent: '#7986cb',
    },
    dining: {
      wall: '#fff8e1',
      floor: '#d4c5a8',
      accent: '#ffb74d',
    },
  },
}

export type RoomThemeKey = keyof typeof PALETTE.roomThemes
export type StatusColorKey = keyof typeof PALETTE.status
