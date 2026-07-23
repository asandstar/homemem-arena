/**
 * E2E Test API 类型声明
 *
 * 仅在 DEV && (MODE === 'e2e' || VITE_E2E === 'true') 时挂载到 window.__testApi__
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
  getScore(): number
  getMemorySlots(): unknown[]
  getEntities(): unknown[]
  getContainerStates(): Record<string, unknown>
  getAchievedGoalIds(): string[]
  getTriggeredEvents(): string[]
  getCurrentStageId(): string | null
  getCurrentObjective(): string | null
  getMemoryStats(): {
    memoryUpdateCount: number
    memoryUsedCount: number
    outdatedMemoryCount: number
  }
  getLevelCompleted(): boolean
  isBgmPlaying(): boolean
  hasActiveRoomAmbient(): boolean
  getActiveContinuousSfxCount(): number
  wasCleanupCalled(): boolean
  getLastCleanupTime(): number
  getCleanupCallCount(): number
  getResetAudioStateCallCount(): number
  wasBgmStopCalled(): boolean
  getBgmStopCount(): number

  // === Command-backed 方法（调用真实 command 层）===
  /** 按 configId 查找实体并调用 executeSaveMemory */
  saveMemoryByConfigId(configId: string): { success: boolean; reason?: string }
  /** 按 configId 查找实体并调用 executePick */
  pickByConfigId(configId: string): { success: boolean; reason?: string }
  /** 调用 executePlace（放置当前持有物品到容器） */
  placeIntoContainer(containerId: string): { success: boolean; reason?: string }
  /** 释放当前 heldEntity 为 free 状态（放回当前房间，相当于取消拾取）*/
  releaseHeldEntity(): { success: boolean; reason?: string }
  /** 调用 executeToggleContainer */
  toggleContainer(containerId: string): { success: boolean; reason?: string }
  /** 调用 executeRoomTransition（从当前房间切换到目标房间） */
  transitionToRoom(roomId: string): { success: boolean; reason?: string }
  /** 调用 store.startPlaying()（从 briefing 切换到 phase=playing；不直接 setState，走原生方法）*/
  startPlaying(): { success: boolean; phaseBefore: string; phaseAfter: string }
  /** 切换指定 slotIndex 的记忆锁（调用真实 toggleMemoryLock，返回 updated slot snapshot 或 null） */
  toggleMemoryLock(slotIndex: number): { success: boolean; reason?: string }
  /** 设置玩家在指定房间内的局部位置；必须已经在该房间内（或 transition 过去）才有效。
   *  仅用于 E2E 验证"靠近判定是否生效"等交互距离相关 case，不允许用此 teleport 跨房间穿墙。 */
  setRobotPositionInRoom(position: { x: number; z: number; y?: number }): { success: boolean; reason?: string }
  /** 获取距离当前玩家最近的可交互实体 configId（= StageContext.nearbyEntityConfigId）；null 表示范围内无可交互。 */
  getNearbyEntityConfigId(maxDistance?: number): string | null

  // ===== 调试 API（仅用于 E2E 诊断阶段推进问题，不用于生产路径）=====
  /** 直接复制 buildStageContext 核心逻辑，返回真实阶段上下文字段（用于调试 completionCondition 不满足的根因） */
  getStageContextForDebug(): {
    stepCount: number
    elapsedMs: number
    currentRoom: string
    playerPosition: { x: number; z: number; y?: number }
    entities: unknown[]
    memorySlots: unknown[]
    nearbyEntityConfigId: string | null
    heldEntityConfigId: string | null
    lockedConfigIds: string[]
    memoryUpdateCount: number
    memoryUsedCount: number
    outdatedMemoryCount: number
    currentStageId: string | null
  }
  /** 连续多次调用 evaluateStageTransitions，返回阶段变化历史（用于调试自动推进失败的 case） */
  forceEvaluateStageTransitions(maxIterations?: number): {
    success: boolean
    history: Array<{ before: string | null; after: string | null }>
    finalStage: string | null
  }

  // === Sprint B.1 E2E 辅助方法（仅用于 E2E 稳定化，不影响生产路径）===
  /**
   * 直接手动修改钥匙记忆状态：
   * - slot.outdated = false
   * - slot.confidence = 100
   * - slot.timestamp = Date.now()
   * - 调用 incrementMemoryUpdate()
   * - 调用 forceEvaluateStageTransitions 推进阶段
   * - 可选手动 setStage('stage-finalize')
   * 用于 E2E 测试中 saveMemory() 由于各种环境原因不稳定时兜底。
   */
  manualSetKeyMemoryFreshAndFinalize(): {
    success: boolean
    slotUpdated: boolean
    updateCountIncremented: boolean
    stageAfter: string | null
  }
  /** 直接调用 setEntityPositionById，给测试设置指定 configId 的位置（仅调试交互距离） */
  setEntityPositionByConfigId(configId: string, position: { x: number; z: number; y?: number }): {
    success: boolean
    reason?: string
  }
  /** 直接 pickEntity（绕过 commands.executePick 的阶段检查）用于测试稳定化 */
  directPickEntityByConfigId(configId: string): {
    success: boolean
    reason?: string
  }
  /** 强制设置 phase 为 playing（绕过 startTask 交互，仅 E2E 用）*/
  forceSetPhasePlaying(): { success: boolean; phaseBefore: string; phaseAfter: string }
  /** 强制 levelCompleted=true（绕过 goal 评估，兜底 E2E 用） */
  forceLevelCompleted(): { success: boolean }

  // === 音频状态管理方法 ===
  /** 重置音频状态（用于测试前准备） */
  resetAudioState(): { success: boolean }
  /** 强制清理音频（仅用于测试诊断） */
  forceCleanupAudio(): { success: boolean }
}

declare global {
  interface Window {
    __testApi__?: E2eTestApi
  }
}
