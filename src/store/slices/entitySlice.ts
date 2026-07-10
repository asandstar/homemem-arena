import type { EntityState } from '../../types/object'
import type { RoomId, RoomSpec, Vec3 } from '../../types/room'
import { sharedRooms } from '../../data/rooms'
import { DEFAULT_LEVEL_BALANCE } from '../../data/levelBalance'
import { calcCorrectPlaceScore } from '../../game/scoring'
import { snapEntityToWorld } from '../../game/placement'
import { playSfx } from '../../audio/sfx'

export interface EntitySliceState {
  entities: EntityState[]
  heldEntityId: string | null
  containerStates: Record<string, { open: boolean; containedIds: string[] }>
}

export interface EntitySliceActions {
  pickEntity: (entityId: string) => { success: boolean; reason?: string }
  placeEntity: (containerId: string) => { success: boolean; reason?: string }
  useContainer: (containerId: string) => { success: boolean; reason?: string }
  applyScriptedMove: (entityId: string, newRoom: RoomId, newPos: Vec3) => void
}

export interface EntitySlice extends EntitySliceState, EntitySliceActions {}

export const createEntitySlice = (set: any, get: any): EntitySlice => ({
  entities: [],
  heldEntityId: null,
  containerStates: {},

  pickEntity: (entityId) => {
    const { entities, heldEntityId, currentRoom, containerStates } = get()
    if (heldEntityId) return { success: false, reason: '手里已经拿着东西了' }

    const entity = entities.find((e: any) => e.id === entityId)
    if (!entity) return { success: false, reason: '物体不存在' }

    if (entity.currentRoom !== currentRoom) return { success: false, reason: '不在当前房间' }

    if (entity.status === 'hidden') {
      const container = Object.entries(containerStates).find(([_, s]: [string, any]) => s.containedIds.includes(entity.configId))
      if (!container) return { success: false, reason: '找不到容器' }
      const [_containerId, containerState] = container as [string, { open: boolean; containedIds: string[] }]
      if (!containerState.open) return { success: false, reason: '需要先打开容器' }
    }

    get().addScore(DEFAULT_LEVEL_BALANCE.pickTargetScore)
    get().addCombo()
    get().addFloatingText(`+${DEFAULT_LEVEL_BALANCE.pickTargetScore}`, 'score', entity.position.x, entity.position.y + 1)
    playSfx('pick')

    const nextContainerStates = Object.fromEntries(
      Object.entries(containerStates).map(([id, containerState]: [string, any]) => [
        id,
        {
          ...containerState,
          containedIds: containerState.containedIds.filter((configId: string) => configId !== entity.configId),
        },
      ]),
    )

    set({
      heldEntityId: entity.id,
      containerStates: nextContainerStates,
      entities: entities.map((e: any) => (
        e.id === entity.id
          ? { ...e, status: 'held' as const, placedIn: undefined }
          : e
      )),
    })

    // 程序记忆检查
    const procResult = get().checkProceduralAction('pick', entity.configId)
    if (procResult.wrongOrder) {
      get().incrementChaos(5)
      get().addFloatingText(
        `顺序不对！${procResult.currentStepLabel ?? '应该先做别的'}`,
        'error',
        entity.position.x,
        entity.position.y + 1.5,
      )
      get().breakCombo()
    }

    return { success: true }
  },

  placeEntity: (containerId: string): { success: boolean; reason?: string } => {
    const { heldEntityId, entities, currentRoom, containerStates } = get()
    if (!heldEntityId) return { success: false, reason: '手里没有东西' }

    const heldEntity = entities.find((e: any) => e.id === heldEntityId)
    if (!heldEntity) return { success: false, reason: '物体丢失' }

    const containerSpec = get().task?.containers.find((c: any) => c.id === containerId)
    if (!containerSpec) return { success: false, reason: '容器不存在' }
    if (containerSpec.room !== currentRoom) return { success: false, reason: '容器不在当前房间' }

    const containerRoomCenter = (sharedRooms as Record<string, RoomSpec>)[currentRoom].center
    const containerPos: Vec3 = {
      x: containerRoomCenter.x + containerSpec.position.x,
      y: containerRoomCenter.y,
      z: containerRoomCenter.z + containerSpec.position.z,
    }
    const dist = Math.sqrt(
      (containerPos.x - get().robotPosition.x) ** 2 + (containerPos.z - get().robotPosition.z) ** 2
    )
    if (dist > 2.5) return { success: false, reason: '距离容器太远' }

    if (containerSpec.acceptedCategories.length > 0 && !containerSpec.acceptedCategories.includes(heldEntity.category as never)) {
      get().addScore(-DEFAULT_LEVEL_BALANCE.wrongPlacePenalty)
      get().incrementChaos(DEFAULT_LEVEL_BALANCE.wrongPlacementChaos)
      get().incrementWrongPlace()
      get().breakCombo()
      get().triggerEntityShake(heldEntityId)
      get().addFloatingText(`-${DEFAULT_LEVEL_BALANCE.wrongPlacePenalty}`, 'error', containerPos.x, containerPos.y + 1)
      get().showFeedback({
        type: 'error',
        message: `容器不接受 ${heldEntity.category} 类别的物体`,
      })
      playSfx('place_error')
      return { success: false, reason: `容器不接受 ${heldEntity.category} 类别的物体` }
    }

    const scoreGain = calcCorrectPlaceScore(get().combo, DEFAULT_LEVEL_BALANCE)
    get().addScore(scoreGain)
    get().addCombo()
    get().addFloatingText(`+${scoreGain}`, 'score', containerPos.x, containerPos.y + 1.2)
    get().showFeedback({
      type: 'success',
      message: '放置成功！',
    })
    playSfx('place_success')

    const placedEntity = entities.find((e: any) => e.id === heldEntityId)
    const placedPosition = placedEntity
      ? snapEntityToWorld(
          {
            ...placedEntity,
            status: 'placed' as const,
            placedIn: containerId,
            currentRoom,
            position: containerPos,
          } as EntityState,
          get().task
        )
      : { ...containerPos, y: containerPos.y + 0.2 }

    set({
      heldEntityId: null,
      containerStates: {
        ...containerStates,
        [containerId]: {
          ...(containerStates[containerId] ?? { open: containerSpec.initialOpen, containedIds: [] }),
          containedIds: Array.from(new Set([
            ...(containerStates[containerId]?.containedIds ?? []),
            heldEntity.configId,
          ])),
        },
      },
      entities: entities.map((e: any) =>
        e.id === heldEntityId
          ? {
              ...e,
              status: 'placed' as const,
              placedIn: containerId,
              position: placedPosition,
            }
          : e
      ),
    })

    // 程序记忆检查（检查放置的物体是否符合序列顺序）
    const procResultPlace = get().checkProceduralAction('place', heldEntity.configId)
    if (procResultPlace.wrongOrder) {
      get().incrementChaos(5)
      get().addFloatingText(
        `顺序不对！${procResultPlace.currentStepLabel ?? '应该先放别的'}`,
        'error',
        containerPos.x,
        containerPos.y + 1.5,
      )
      get().breakCombo()
    }

    return { success: true }
  },

  useContainer: (containerId: string): { success: boolean; reason?: string } => {
    const { containerStates, currentRoom, task } = get()
    if (!task) return { success: false, reason: '任务未初始化' }

    const containerSpec = task.containers.find((c: any) => c.id === containerId)
    if (!containerSpec) return { success: false, reason: '容器不存在' }
    if (containerSpec.room !== currentRoom) return { success: false, reason: '容器不在当前房间' }

    const roomCenter = (sharedRooms as Record<string, RoomSpec>)[currentRoom].center
    const cntPos: Vec3 = {
      x: roomCenter.x + containerSpec.position.x,
      y: containerSpec.position.y,
      z: roomCenter.z + containerSpec.position.z,
    }
    const dist = Math.sqrt(
      (cntPos.x - get().robotPosition.x) ** 2 + (cntPos.z - get().robotPosition.z) ** 2
    )
    if (dist > 2.5) return { success: false, reason: '距离容器太远' }

    const currentState = containerStates[containerId]
    if (!currentState) return { success: false, reason: '容器状态未初始化' }

    const newOpen = !currentState.open
    let newContainedIds = currentState.containedIds
    let entityUpdates: EntityState[] = []

    if (newOpen) {
      const task = get().task
      if (task) {
        const containerConfig = task.containers.find((c: any) => c.id === containerId)
        const containerRoomCenter = (sharedRooms as Record<string, RoomSpec>)[currentRoom].center
        const containerSpec = containerConfig
        const containedConfigIds = currentState.containedIds
        entityUpdates = get().entities.map((e: any) => {
          if (containedConfigIds.includes(e.configId)) {
            const surfacePos = containerSpec
              ? snapEntityToWorld(
                  {
                    ...e,
                    status: 'placed' as const,
                    placedIn: containerId,
                    currentRoom,
                    position: {
                      x: containerRoomCenter.x + containerSpec.position.x,
                      y: 0,
                      z: containerRoomCenter.z + containerSpec.position.z,
                    },
                  } as EntityState,
                  task
                )
              : { x: e.position.x, y: e.position.y + 0.2, z: e.position.z }
            return { ...e, status: 'free' as const, placedIn: undefined, currentRoom, position: surfacePos }
          }
          return e
        })
      }
    } else {
      const task = get().task
      if (task) {
        const containerConfig = task.containers.find((c: any) => c.id === containerId)
        if (containerConfig) {
          const cPos: Vec3 = {
            x: roomCenter.x + containerConfig.position.x,
            y: containerConfig.position.y,
            z: roomCenter.z + containerConfig.position.z,
          }
          const containedConfigIds: string[] = []
          entityUpdates = get().entities.map((e: any) => {
            if (e.currentRoom === currentRoom && (e.status === 'free' || e.placedIn === containerId)) {
              const d = Math.sqrt((e.position.x - cPos.x) ** 2 + (e.position.z - cPos.z) ** 2)
              if (e.placedIn === containerId || d < 0.6) {
                containedConfigIds.push(e.configId)
                return { ...e, status: 'hidden' as const, placedIn: containerId }
              }
            }
            return e
          })
          newContainedIds = containedConfigIds
        }
      }
    }

    set({
      containerStates: {
        ...containerStates,
        [containerId]: { open: newOpen, containedIds: newContainedIds },
      },
      entities: entityUpdates.length > 0 ? entityUpdates : get().entities,
    })

    // 程序记忆检查
    const procResultUse = get().checkProceduralAction('use', containerId)
    if (procResultUse.wrongOrder) {
      get().incrementChaos(3)
      get().addFloatingText(
        `顺序不对！${procResultUse.currentStepLabel ?? '应该先做别的'}`,
        'error',
        cntPos.x,
        cntPos.y + 1.5,
      )
    }

    return { success: true }
  },

  applyScriptedMove: (entityId: string, newRoom: RoomId, newPos: Vec3) => {
    const room = (sharedRooms as Record<string, RoomSpec>)[newRoom]
    if (!room) return
    const toWorldPos: Vec3 = {
      x: room.center.x + newPos.x,
      y: newPos.y,
      z: room.center.z + newPos.z,
    }
    get().startMoveAnimation(entityId, newRoom, toWorldPos)
  },
})
