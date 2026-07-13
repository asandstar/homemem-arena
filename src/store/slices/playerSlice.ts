import type { RoomId, RoomSpec, Vec3 } from '../../types/room'
import { sharedRooms } from '../../data/rooms'
import type { ViewMode } from '../gameTypes'
import { playSfx, isAudioEnabled } from '../../audio/sfx'

export interface PlayerSliceState {
  robotPosition: Vec3
  robotRotation: number
  cameraPitch: number
  currentRoom: RoomId
  viewMode: ViewMode
  visitedRooms: Set<RoomId>
}

export interface PlayerSliceActions {
  moveToRoom: (toRoom: RoomId, position: Vec3) => void
  rotateRobot: (deltaRot: number) => void
  setCameraPitch: (pitch: number) => void
  moveForward: (distance: number) => { success: boolean; reason?: string }
  toggleViewMode: () => void
  forgetCloseContainer: (roomId: RoomId) => void
}

export interface PlayerSlice extends PlayerSliceState, PlayerSliceActions {}

export const createPlayerSlice = (set: any, get: any): PlayerSlice => ({
  robotPosition: { x: 0, y: 0, z: 0 },
  robotRotation: 0,
  cameraPitch: 0,
  currentRoom: 'living',
  viewMode: 'first-person',
  visitedRooms: new Set<RoomId>(),

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
