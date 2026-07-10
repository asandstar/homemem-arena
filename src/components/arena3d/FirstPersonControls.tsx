import { useEffect, useRef, useCallback } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../../store/useGameStore'
import { useToastStore } from '../../store/useToastStore'
import { sharedRooms } from '../../data/rooms'
import { roomDecorFurniture } from '../../data/decorFurniture'
import type { RoomId } from '../../types/room'
import {
  clampPitch,
  PLAYER_SPEED,
  PLAYER_HEIGHT,
  TOP_DOWN_SPEED,
  MOUSE_SENSITIVITY,
} from '../../game/playerControls'
import {
  resolveRoomCollision,
  checkRoomTransition,
  getNearbyDoorwayHint,
  resolveFurnitureCollision,
  DOOR_COOLDOWN_MS,
  PLAYER_RADIUS,
  type DoorwaySpec as CollisionDoorwaySpec,
  type Position2D,
} from '../../game/collision'
import {
  executeContainerInteraction,
  executePick,
  executeRoomTransition,
  executeSaveMemory,
} from '../../game/commands'
import {
  findNearestInteractableContainer,
  findNearestInteractableEntity,
} from '../../game/interactionTargets'

const ROTATION_SYNC_THRESHOLD = 0.001

export function FirstPersonControls() {
  const { camera, gl } = useThree()
  const moveState = useRef({ forward: false, backward: false, left: false, right: false })
  const smoothedCamPos = useRef(new THREE.Vector3())
  const smoothedCamRot = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))
  const targetYawRef = useRef(0)
  const targetPitchRef = useRef(0)
  const lastSyncedYawRef = useRef(0)
  const lastSyncedPitchRef = useRef(0)

  const {
    phase,
    robotPosition,
    task,
    entities,
    setFlashingSlotIndex,
    heldEntityId,
    containerStates,
  } = useGameStore()
  const { addToast } = useToastStore()

  const lastPosRef = useRef({ x: robotPosition.x, z: robotPosition.z })
  const doorCooldownRef = useRef(0)
  const lastHintRef = useRef<string | null>(null)

  const findNearbyEntity = useCallback(() => {
    const state = useGameStore.getState()
    return findNearestInteractableEntity(entities, state.robotPosition, state.currentRoom)
  }, [entities])

  const findNearbyContainer = useCallback(() => {
    const state = useGameStore.getState()
    return findNearestInteractableContainer(state.task, state.robotPosition, state.currentRoom)
  }, [])

  useEffect(() => {
    const state = useGameStore.getState()
    targetYawRef.current = state.robotRotation
    targetPitchRef.current = state.cameraPitch
    lastSyncedYawRef.current = state.robotRotation
    lastSyncedPitchRef.current = state.cameraPitch
    smoothedCamRot.current.set(state.cameraPitch, state.robotRotation, 0, 'YXZ')
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (phase !== 'playing') return

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          moveState.current.forward = true
          break
        case 'KeyS':
        case 'ArrowDown':
          moveState.current.backward = true
          break
        case 'KeyA':
        case 'ArrowLeft':
          moveState.current.left = true
          break
        case 'KeyD':
        case 'ArrowRight':
          moveState.current.right = true
          break
        case 'KeyV':
          useGameStore.getState().toggleViewMode()
          break
        case 'KeyE': {
          const nearbyEntityForMemory = findNearbyEntity()
          if (nearbyEntityForMemory) {
            const result = executeSaveMemory(nearbyEntityForMemory.id)
            if (result.success && result.slotIndex !== undefined) {
              addToast('success', `已保存记忆：${nearbyEntityForMemory.name}`)
              setFlashingSlotIndex(result.slotIndex)
              setTimeout(() => setFlashingSlotIndex(null), 1000)
            } else {
              addToast('error', '记忆槽已满且全部锁定')
            }
          } else {
            addToast('info', '附近没有可保存的物体')
          }
          break
        }
        case 'KeyF': {
          if (heldEntityId) {
            const container = findNearbyContainer()
            if (container) {
              const result = executeContainerInteraction(container.id)
              if (result.success) {
                addToast('success', `已放置到 ${container.name}`)
              } else if (result.reason) {
                addToast('error', result.reason)
              }
            } else {
              addToast('info', '附近没有可放置的容器')
            }
          } else {
            const entity = findNearbyEntity()
            if (entity) {
              const result = executePick(entity.id)
              if (result.success) {
                addToast('success', `已拾取 ${entity.name}`)
              } else if (result.reason) {
                addToast('error', result.reason)
              }
            } else {
              const container = findNearbyContainer()
              if (container) {
                const isOpen = containerStates[container.id]?.open ?? container.initialOpen
                const result = executeContainerInteraction(container.id)
                if (result.success) {
                  addToast('info', isOpen ? `已关闭 ${container.name}` : `已打开 ${container.name}`)
                }
              } else {
                addToast('info', '附近没有可交互的物体或容器')
              }
            }
          }
          break
        }
        case 'Escape':
          break
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          moveState.current.forward = false
          break
        case 'KeyS':
        case 'ArrowDown':
          moveState.current.backward = false
          break
        case 'KeyA':
        case 'ArrowLeft':
          moveState.current.left = false
          break
        case 'KeyD':
        case 'ArrowRight':
          moveState.current.right = false
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [phase, findNearbyEntity, findNearbyContainer, setFlashingSlotIndex, addToast, heldEntityId, containerStates])

  const isDraggingRef = useRef(false)

  useEffect(() => {
    const canvas = gl.domElement

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return
      isDraggingRef.current = true
      canvas.style.cursor = 'grabbing'
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return
      targetYawRef.current -= e.movementX * MOUSE_SENSITIVITY
      targetPitchRef.current = clampPitch(targetPitchRef.current - e.movementY * MOUSE_SENSITIVITY)
    }

    const handleMouseUp = () => {
      isDraggingRef.current = false
      canvas.style.cursor = 'grab'
    }

    const handleMouseLeave = () => {
      isDraggingRef.current = false
      canvas.style.cursor = 'grab'
    }

    canvas.style.cursor = 'grab'
    canvas.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [gl])

  useFrame((_, delta) => {
    const state = useGameStore.getState()
    const { robotPosition, currentRoom, viewMode } = state

    const storeYaw = state.robotRotation
    const storePitch = state.cameraPitch

    if (Math.abs(storeYaw - lastSyncedYawRef.current) > ROTATION_SYNC_THRESHOLD) {
      targetYawRef.current = storeYaw
      lastSyncedYawRef.current = storeYaw
    }
    if (Math.abs(storePitch - lastSyncedPitchRef.current) > ROTATION_SYNC_THRESHOLD) {
      targetPitchRef.current = storePitch
      lastSyncedPitchRef.current = storePitch
    }

    const posLerp = Math.min(1, delta * 12)
    const rotLerp = Math.min(1, delta * 18)

    if (viewMode === 'first-person') {
      const targetY = PLAYER_HEIGHT
      smoothedCamPos.current.x += (robotPosition.x - smoothedCamPos.current.x) * posLerp
      smoothedCamPos.current.y += (targetY - smoothedCamPos.current.y) * posLerp
      smoothedCamPos.current.z += (robotPosition.z - smoothedCamPos.current.z) * posLerp

      smoothedCamRot.current.y += (targetYawRef.current - smoothedCamRot.current.y) * rotLerp
      smoothedCamRot.current.x += (targetPitchRef.current - smoothedCamRot.current.x) * rotLerp
      smoothedCamRot.current.z = 0

      camera.position.copy(smoothedCamPos.current)
      camera.rotation.copy(smoothedCamRot.current)
      if ('fov' in camera) camera.fov = 75
    } else {
      const targetY = 8
      const topDownPosLerp = Math.min(1, delta * 8)
      smoothedCamPos.current.x += (robotPosition.x - smoothedCamPos.current.x) * topDownPosLerp
      smoothedCamPos.current.y += (targetY - smoothedCamPos.current.y) * topDownPosLerp
      smoothedCamPos.current.z += (robotPosition.z - smoothedCamPos.current.z) * topDownPosLerp

      smoothedCamRot.current.y += (targetYawRef.current - smoothedCamRot.current.y) * rotLerp
      smoothedCamRot.current.x = -Math.PI / 2.5
      smoothedCamRot.current.z = 0

      camera.position.copy(smoothedCamPos.current)
      camera.rotation.copy(smoothedCamRot.current)
      if ('fov' in camera) camera.fov = 60
    }
    camera.updateProjectionMatrix()

    const yawDiff = Math.abs(targetYawRef.current - lastSyncedYawRef.current)
    const pitchDiff = Math.abs(targetPitchRef.current - lastSyncedPitchRef.current)
    if (yawDiff > ROTATION_SYNC_THRESHOLD || pitchDiff > ROTATION_SYNC_THRESHOLD) {
      useGameStore.setState({
        robotRotation: targetYawRef.current,
        cameraPitch: targetPitchRef.current,
      })
      lastSyncedYawRef.current = targetYawRef.current
      lastSyncedPitchRef.current = targetPitchRef.current
    }

    if (state.phase !== 'playing') return

    const speed = viewMode === 'top-down' ? TOP_DOWN_SPEED : PLAYER_SPEED
    let moveDx = 0
    let moveDz = 0
    if (viewMode === 'top-down') {
      if (moveState.current.forward) moveDz += 1
      if (moveState.current.backward) moveDz -= 1
      if (moveState.current.left) moveDx -= 1
      if (moveState.current.right) moveDx += 1
      const len = Math.hypot(moveDx, moveDz)
      if (len > 0) {
        moveDx = (moveDx / len) * speed * delta
        moveDz = (moveDz / len) * speed * delta
      }
    } else {
      const forward = Number(moveState.current.forward) - Number(moveState.current.backward)
      const right = Number(moveState.current.right) - Number(moveState.current.left)

      if (forward !== 0 || right !== 0) {
        const length = Math.sqrt(forward * forward + right * right)
        const nForward = forward / length
        const nRight = right / length

        const cameraForward = new THREE.Vector3()
        camera.getWorldDirection(cameraForward)
        cameraForward.y = 0
        cameraForward.normalize()

        const cameraRight = new THREE.Vector3()
        cameraRight.crossVectors(new THREE.Vector3(0, 1, 0), cameraForward).normalize()

        const distance = speed * delta
        moveDx = (cameraForward.x * nForward + cameraRight.x * nRight) * distance
        moveDz = (cameraForward.z * nForward + cameraRight.z * nRight) * distance
      }
    }

    const roomSpec = sharedRooms[currentRoom]

    if (moveDx !== 0 || moveDz !== 0) {
      const desiredPos2D: Position2D = {
        x: robotPosition.x + moveDx,
        z: robotPosition.z + moveDz,
      }
      const currentPos2D: Position2D = { x: robotPosition.x, z: robotPosition.z }

      const taskRooms = task?.rooms
      const effectiveDoorways: CollisionDoorwaySpec[] = roomSpec
        ? roomSpec.doorways
            .filter((d) => !taskRooms || taskRooms.includes(d.connectsTo))
            .map((d) => ({
              offsetX: d.offset.x,
              offsetZ: d.offset.z,
              width: d.width,
              connectsTo: d.connectsTo,
              targetPosition: d.targetPosition,
            }))
        : []

      let resolved2D = resolveRoomCollision(
        currentPos2D,
        desiredPos2D,
        { x: roomSpec.center.x, z: roomSpec.center.z },
        { x: roomSpec.size.x, z: roomSpec.size.z },
        PLAYER_RADIUS,
        effectiveDoorways
      )

      const decorFurniture = roomDecorFurniture[currentRoom] || []
      const taskContainers = task?.containers.filter((c) => c.room === currentRoom) || []
      const allFurniture = [...taskContainers, ...decorFurniture]

      if (allFurniture.length > 0 && roomSpec) {
        resolved2D = resolveFurnitureCollision(
          currentPos2D,
          resolved2D,
          allFurniture,
          { x: roomSpec.center.x, z: roomSpec.center.z },
          PLAYER_RADIUS
        )

        resolved2D = resolveRoomCollision(
          currentPos2D,
          resolved2D,
          { x: roomSpec.center.x, z: roomSpec.center.z },
          { x: roomSpec.size.x, z: roomSpec.size.z },
          PLAYER_RADIUS,
          effectiveDoorways
        )
      }

      const resolved = {
        x: resolved2D.x,
        y: robotPosition.y,
        z: resolved2D.z,
      }

      const dx = resolved.x - lastPosRef.current.x
      const dz = resolved.z - lastPosRef.current.z

      if (dx * dx + dz * dz > 0.000001) {
        useGameStore.setState({ robotPosition: resolved })
        lastPosRef.current = { x: resolved.x, z: resolved.z }
      }
    }

    if (task && roomSpec) {
      const transition = checkRoomTransition(
        { x: robotPosition.x, z: robotPosition.z },
        currentRoom,
        sharedRooms,
        task.rooms,
        doorCooldownRef.current,
        PLAYER_RADIUS
      )
      if (transition) {
        const targetRoom = sharedRooms[transition.toRoom as keyof typeof sharedRooms]
        if (targetRoom) {
          const targetPosition = {
            x: transition.targetPos.x,
            y: robotPosition.y,
            z: transition.targetPos.z,
          }
          executeRoomTransition(currentRoom, transition.toRoom as RoomId, targetPosition)
          addToast('info', `进入 ${targetRoom.name}`)
          doorCooldownRef.current = Date.now() + DOOR_COOLDOWN_MS
          lastPosRef.current = { x: targetPosition.x, z: targetPosition.z }
          lastHintRef.current = null
        }
      }
    }

    const hint = getNearbyDoorwayHint({ x: robotPosition.x, z: robotPosition.z }, currentRoom, task?.rooms)
    if (hint && hint.roomName !== lastHintRef.current) {
      addToast('info', `进入 ${hint.roomName}`)
      lastHintRef.current = hint.roomName
    } else if (!hint) {
      lastHintRef.current = null
    }
  })

  return null
}
