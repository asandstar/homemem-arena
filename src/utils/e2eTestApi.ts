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
import { isBgmPlaying } from '../audio/bgm'
import { hasActiveRoomAmbient, getActiveContinuousSfxCount } from '../audio/sfx'
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

      // 计算落地位置：优先降落在房间内容器附近
      // placeEntity/useContainer 使用 room.center + container.position 作为容器世界坐标
      // 距离检查为 2.5，所以需要降落在容器附近
      const task = useGameStore.getState().task
      const containersInRoom = task?.containers.filter((c) => c.room === toRoom) ?? []

      let landingPos: { x: number; y: number; z: number }
      if (containersInRoom.length > 0) {
        // 降落在容器位置的质心，确保后续 place/toggle 距离检查通过
        const sumX = containersInRoom.reduce(
          (sum, c) => sum + (room.center.x + c.position.x), 0,
        )
        const sumZ = containersInRoom.reduce(
          (sum, c) => sum + (room.center.z + c.position.z), 0,
        )
        landingPos = {
          x: sumX / containersInRoom.length,
          y: 0,
          z: sumZ / containersInRoom.length,
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
