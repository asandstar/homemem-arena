import type { RoomId, RoomSpec, Vec3 } from '../../types/room'
import { sharedRooms } from '../../data/rooms'
import type { ViewMode } from '../gameTypes'
import { playSfx, isAudioEnabled } from '../../audio/sfx'

/**
 * 规范化门 key：两个房间 ID 字典序排列后拼接，确保 A→B 和 B→A 得到同一 key。
 * 用于 doorOpenStates 中唯一标识一扇双向门。
 */
export function doorKey(a: RoomId, b: RoomId): string {
  return [a, b].sort().join('::')
}

export interface PlayerSliceState {
  robotPosition: Vec3
  robotRotation: number
  cameraPitch: number
  currentRoom: RoomId
  viewMode: ViewMode
  visitedRooms: Set<RoomId>
  /** 门开关状态：key=doorKey(roomA, roomB)，true=开，false/undefined=关。默认全关，需 F 键交互打开。 */
  doorOpenStates: Record<string, boolean>
}

export interface PlayerSliceActions {
  moveToRoom: (toRoom: RoomId, position: Vec3) => void
  rotateRobot: (deltaRot: number) => void
  setCameraPitch: (pitch: number) => void
  moveForward: (distance: number) => { success: boolean; reason?: string }
  toggleViewMode: () => void
  forgetCloseContainer: (roomId: RoomId) => void
  /** 切换两房间之间的门开关状态，返回切换后的开/关状态 */
  toggleDoor: (roomA: RoomId, roomB: RoomId) => boolean
}

export interface PlayerSlice extends PlayerSliceState, PlayerSliceActions {}

export const createPlayerSlice = (set: any, get: any): PlayerSlice => ({
  robotPosition: { x: 0, y: 0, z: 0 },
  robotRotation: 0,
  cameraPitch: 0,
  currentRoom: 'living',
  viewMode: 'first-person',
  visitedRooms: new Set<RoomId>(),
  doorOpenStates: {},

  toggleDoor: (roomA: RoomId, roomB: RoomId) => {
    const key = doorKey(roomA, roomB)
    const current = get().doorOpenStates[key] ?? false
    const next = !current
    set({
      doorOpenStates: { ...get().doorOpenStates, [key]: next },
    })
    // 开门音效
    if (isAudioEnabled()) {
      playSfx(next ? 'door_open' : 'door_close')
    }
    return next
  },

  moveToRoom: (toRoom, position) => {
    const { visitedRooms, currentRoom, entities, heldEntityId } = get()
    const visitedCount = visitedRooms.size
    const newVisited = new Set([...visitedRooms, toRoom])
    const stillVisited = newVisited.size === visitedCount

    if (stillVisited) {
      get().incrementRepeatSearch()
    }

    get().forgetCloseContainer(currentRoom)

    const updatedEntities = heldEntityId
      ? entities.map((e: any) =>
          e.id === heldEntityId ? { ...e, currentRoom: toRoom } : e
        )
      : entities

    set({
      currentRoom: toRoom,
      robotPosition: position,
      visitedRooms: newVisited,
      entities: updatedEntities,
    })

    if (!stillVisited && isAudioEnabled()) {
      playSfx('room_enter')
    }
  },

  forgetCloseContainer: (_roomId: RoomId) => {
    const { containerStates, task } = get()
    if (!task) return

    let openCount = 0
    for (const [containerId, state] of Object.entries(containerStates)) {
      const containerSpec = task.containers.find((c: any) => c.id === containerId)
      if (containerSpec && (state as { open: boolean }).open) {
        openCount++
      }
    }

    if (openCount > 0) {
      const chaosAmount = openCount * 5
      get().incrementChaos(chaosAmount)
      get().addScore(-openCount * 20)
      get().breakCombo()
    }
  },

  rotateRobot: (deltaRot) => {
    set({ robotRotation: get().robotRotation + deltaRot })
  },

  setCameraPitch: (pitch) => {
    set({ cameraPitch: pitch })
  },

  moveForward: (distance) => {
    const { robotRotation, robotPosition, currentRoom } = get()
    const dx = Math.sin(robotRotation) * distance
    const dz = -Math.cos(robotRotation) * distance

    const newPos: Vec3 = {
      x: robotPosition.x + dx,
      y: robotPosition.y,
      z: robotPosition.z + dz,
    }

    const room = (sharedRooms as Record<string, RoomSpec>)[currentRoom]
    if (!room) return { success: false, reason: '房间不存在' }

    const halfX = room.size.x / 2
    const halfZ = room.size.z / 2
    const localX = newPos.x - room.center.x
    const localZ = newPos.z - room.center.z

    if (Math.abs(localX) > halfX || Math.abs(localZ) > halfZ) {
      return { success: false, reason: '碰到墙壁，需要找门穿过' }
    }

    set({ robotPosition: newPos })
    return { success: true }
  },

  toggleViewMode: () => {
    set((state: any) => ({
      viewMode: state.viewMode === 'first-person' ? 'top-down' : 'first-person',
    }))
  },
})
