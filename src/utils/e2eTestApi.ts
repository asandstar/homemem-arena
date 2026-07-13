/**
 * E2E Test API 实现
 *
 * 仅在 DEV && VITE_E2E === 'true' 时挂载到 window.__testApi__
 * 生产构建和普通开发模式不暴露。
 *
 * 约束：
 * - 所有可写方法必须调用现有真实 command 层
 * - 不允许直接 set Zustand 最终状态
 * - 不允许直接写 entities、containerStates、phase、score、goals
 * - 不允许提供 advanceStep、setPhase、setLevelCompleted、completeGoal、setEntityPosition、markMemoryOutdated
 */
import type { E2eTestApi } from './e2eTestApi.types'
import { useGameStore } from '../store/useGameStore'
import {
  executePick,
  executePlace,
  executeToggleContainer,
  executeSaveMemory,
  executeRoomTransition,
  type GameCommandResult,
} from '../game/commands'
import { sharedRooms } from '../data/rooms'
import { isBgmPlaying, stopBgmImmediate, resetArenaCleanupFlag } from '../audio/bgm'
import { hasActiveRoomAmbient, getActiveContinuousSfxCount, stopAllSfx, resetRoomAmbientFlag } from '../audio/sfx'
import type { RoomId } from '../types/room'

function toResult(r: GameCommandResult): { success: boolean; reason?: string } {
  return { success: r.success, reason: r.reason }
}

function buildTestApi(): E2eTestApi {
  return {
    // === 只读方法 ===
    getPhase: () => useGameStore.getState().phase,
    getRobotPosition: () => {
      const { robotPosition } = useGameStore.getState()
      return { x: robotPosition.x, y: robotPosition.y, z: robotPosition.z }
    },
    getRobotRotation: () => useGameStore.getState().robotRotation,
    getViewMode: () => useGameStore.getState().viewMode,
    getCurrentRoom: () => useGameStore.getState().currentRoom,
    getStepCount: () => useGameStore.getState().stepCount,
    getElapsedMs: () => useGameStore.getState().elapsedMs,
    getChaosValue: () => useGameStore.getState().chaosValue,
    getMemorySlots: () => useGameStore.getState().memorySlots,
    getEntities: () =>
      useGameStore.getState().entities.map((e) => ({
        id: e.id,
        configId: e.configId,
        name: e.name,
        status: e.status,
        currentRoom: e.currentRoom,
        placedIn: e.placedIn,
        category: e.category,
      })),
    getContainerStates: () => useGameStore.getState().containerStates,
    isBgmPlaying: () => isBgmPlaying(),
    hasActiveRoomAmbient: () => hasActiveRoomAmbient(),
    getActiveContinuousSfxCount: () => getActiveContinuousSfxCount(),

    // === 强制清理（仅用于测试诊断）===
    forceCleanupAudio: () => {
      stopBgmImmediate()
      stopAllSfx()
      return { success: true }
    },
    resetAudioState: () => {
      resetArenaCleanupFlag()
      resetRoomAmbientFlag()
      ;(window as any).__resetAudioStateCallCount = ((window as any).__resetAudioStateCallCount || 0) + 1
      ;(window as any).__lastResetTime = Date.now()
      return { success: true }
    },
    wasCleanupCalled: () => {
      return !!(window as any).__arenaCleanupCalled
    },
    getLastCleanupTime: () => {
      return (window as any).__lastCleanupTime || 0
    },
    getCleanupCallCount: () => {
      return (window as any).__cleanupCallCount || 0
    },
    getResetAudioStateCallCount: () => {
      return (window as any).__resetAudioStateCallCount || 0
    },
    wasBgmStopCalled: () => {
      return !!(window as any).__bgmStopCalled
    },
    getBgmStopCount: () => {
      return (window as any).__bgmStopCount || 0
    },

    // === Command-backed 方法 ===
    saveMemoryByConfigId: (configId: string) => {
      const entity = useGameStore.getState().entities.find((e) => e.configId === configId)
      if (!entity) return { success: false, reason: `未找到 configId=${configId} 的实体` }
      return toResult(executeSaveMemory(entity.id))
    },
    pickByConfigId: (configId: string) => {
      const entity = useGameStore.getState().entities.find((e) => e.configId === configId)
      if (!entity) return { success: false, reason: `未找到 configId=${configId} 的实体` }
      return toResult(executePick(entity.id))
    },
    placeIntoContainer: (containerId: string) => toResult(executePlace(containerId)),
    toggleContainer: (containerId: string) => toResult(executeToggleContainer(containerId)),
    transitionToRoom: (roomId: string) => {
      const fromRoom = useGameStore.getState().currentRoom as RoomId
      const toRoom = roomId as RoomId
      const room = Object.values(sharedRooms).find((r) => r.id === toRoom)
      if (!room) return { success: false, reason: `未知房间: ${roomId}` }

      const task = useGameStore.getState().task
      const containersInRoom = task?.containers.filter((c) => c.room === toRoom) ?? []
      const entitiesInRoom = useGameStore.getState().entities.filter((e) => e.currentRoom === toRoom && e.status !== 'hidden')

      const allTargets = [
        ...containersInRoom.map((c) => ({ x: room.center.x + c.position.x, z: room.center.z + c.position.z })),
        ...entitiesInRoom.map((e) => ({ x: e.position.x, z: e.position.z })),
      ]

      let landingPos: { x: number; y: number; z: number }
      if (allTargets.length > 0) {
        const sumX = allTargets.reduce((sum, t) => sum + t.x, 0)
        const sumZ = allTargets.reduce((sum, t) => sum + t.z, 0)
        landingPos = {
          x: sumX / allTargets.length,
          y: 0,
          z: sumZ / allTargets.length,
        }
      } else {
        landingPos = { x: room.center.x, y: 0, z: room.center.z }
      }

      return toResult(executeRoomTransition(fromRoom, toRoom, landingPos))
    },
  }
}

/**
 * 在 E2E 环境下挂载 Test API 到 window。
 * 必须在 DEV && VITE_E2E === 'true' 时才调用。
 */
export function installE2eTestApi(): void {
  if (
    import.meta.env.DEV &&
    import.meta.env.VITE_E2E === 'true' &&
    typeof window !== 'undefined'
  ) {
    window.__testApi__ = buildTestApi()
  }
}
