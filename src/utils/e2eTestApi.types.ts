/**
 * E2E Test API 类型声明
 *
 * 仅在 DEV && VITE_E2E === 'true' 时挂载到 window.__testApi__
 * 生产构建和普通开发模式不暴露。
 */
export interface E2eTestApi {
  // === 只读方法 ===
  getPhase(): string
  getRobotPosition(): { x: number; y: number; z: number }
  getRobotRotation(): number
  getViewMode(): string
  getCurrentRoom(): string
  getStepCount(): number
  getElapsedMs(): number
  getChaosValue(): number
  getMemorySlots(): unknown[]
  getEntities(): unknown[]
  getContainerStates(): Record<string, unknown>
  isBgmPlaying(): boolean
  hasActiveRoomAmbient(): boolean
  getActiveContinuousSfxCount(): number

  // === Command-backed 方法（调用真实 command 层）===
  /** 按 configId 查找实体并调用 executeSaveMemory */
  saveMemoryByConfigId(configId: string): { success: boolean; reason?: string }
  /** 按 configId 查找实体并调用 executePick */
  pickByConfigId(configId: string): { success: boolean; reason?: string }
  /** 调用 executePlace（放置当前持有物品到容器） */
  placeIntoContainer(containerId: string): { success: boolean; reason?: string }
  /** 调用 executeToggleContainer */
  toggleContainer(containerId: string): { success: boolean; reason?: string }
  /** 调用 executeRoomTransition（从当前房间切换到目标房间） */
  transitionToRoom(roomId: string): { success: boolean; reason?: string }
}

declare global {
  interface Window {
    __testApi__?: E2eTestApi
  }
}
