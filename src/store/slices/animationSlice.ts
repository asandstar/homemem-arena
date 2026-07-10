import type { RoomId, Vec3 } from '../../types/room'

export interface MoveAnimation {
  entityId: string
  fromPosition: Vec3
  toPosition: Vec3
  toRoom: RoomId
  startTime: number
  duration: number
  isActive: boolean
}

export interface AnimationSlice {
  moveAnimations: MoveAnimation[]
  lastMoveAnimation: MoveAnimation | null

  startMoveAnimation: (entityId: string, toRoom: RoomId, toPos: Vec3) => void
  updateMoveAnimations: () => void
}

export const createAnimationSlice = (set: any, get: any): AnimationSlice => ({
  moveAnimations: [],
  lastMoveAnimation: null,

  startMoveAnimation: (entityId: string, toRoom: RoomId, toPos: Vec3) => {
    const entity = get().entities.find((e: any) => e.configId === entityId)
    if (!entity) return

    const duration = 600 + Math.random() * 400
    const anim: MoveAnimation = {
      entityId,
      fromPosition: { ...entity.position },
      toPosition: toPos,
      toRoom,
      startTime: Date.now(),
      duration,
      isActive: true,
    }

    set((state: any) => ({
      moveAnimations: [...state.moveAnimations, anim],
      lastMoveAnimation: anim,
      heldEntityId: state.heldEntityId === entity.id ? null : state.heldEntityId,
      containerStates: Object.fromEntries(
        Object.entries(state.containerStates).map(([id, containerState]: [string, any]) => [
          id,
          {
            ...containerState,
            containedIds: containerState.containedIds.filter((configId: string) => configId !== entityId),
          },
        ]),
      ),
      entities: state.entities.map((e: any) =>
        e.configId === entityId
          ? { ...e, status: 'free' as const, placedIn: undefined, properties: { ...e.properties, _moving: true } }
          : e
      ),
    }))
  },

  updateMoveAnimations: () => {
    const anims = get().moveAnimations
    if (anims.length === 0) return

    const now = Date.now()
    const stillActive: MoveAnimation[] = []

    for (const anim of anims) {
      const elapsed = now - anim.startTime
      const t = Math.min(elapsed / anim.duration, 1)

      if (t < 1) {
        const lerpPos: Vec3 = {
          x: anim.fromPosition.x + (anim.toPosition.x - anim.fromPosition.x) * t,
          y: anim.fromPosition.y + (anim.toPosition.y - anim.fromPosition.y) * t,
          z: anim.fromPosition.z + (anim.toPosition.z - anim.fromPosition.z) * t,
        }
        set((state: any) => ({
          entities: state.entities.map((e: any) =>
            e.configId === anim.entityId ? { ...e, position: lerpPos } : e
          ),
        }))
        stillActive.push(anim)
      } else {
        set((state: any) => ({
          entities: state.entities.map((e: any) =>
            e.configId === anim.entityId
              ? { ...e, position: anim.toPosition, currentRoom: anim.toRoom, properties: { ...e.properties, _moving: false } }
              : e
          ),
        }))
      }
    }

    set({ moveAnimations: stillActive })
  },
})
