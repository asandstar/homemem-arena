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
  MOUSE_SENSITIVITY_H,
  MOUSE_SENSITIVITY_V,
  ACCELERATION,
  DECELERATION,
  TURN_SMOOTHING,
  FOV_DEFAULT,
  FOV_MIN,
  FOV_MAX,
  applyHorizontalLookDelta,
  gameYawToCameraYaw,
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
  executeDrop,
  executePick,
  executeRoomTransition,
  executeSaveMemory,
} from '../../game/commands'
import {
  findNearestInteractableContainer,
  findNearestInteractableEntity,
  isEntityProtectedAfterGoal,
} from '../../game/interactionTargets'
import { doorKey } from '../../store/slices/playerSlice'
import { decideEscapeAction } from '../../game/pointerLockEscStateMachine'

const DOOR_INTERACT_DISTANCE = 2.5

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
  const currentSpeedRef = useRef(0)
  const moveDirectionRef = useRef(new THREE.Vector3(0, 0, -1))
  const targetMoveDirRef = useRef(new THREE.Vector3(0, 0, -1))
  const cameraFovRef = useRef(FOV_DEFAULT)

  // ⚠️ 用单字段 selector 避免 getSnapshot 引用变化 → 无限循环
  const phase = useGameStore((s) => s.phase)
  const robotPosition = useGameStore((s) => s.robotPosition)
  const robotRotation = useGameStore((s) => s.robotRotation)
  const task = useGameStore((s) => s.task)
  const entities = useGameStore((s) => s.entities)
  const setFlashingSlotIndex = useGameStore((s) => s.setFlashingSlotIndex)
  const heldEntityId = useGameStore((s) => s.heldEntityId)
  const containerStates = useGameStore((s) => s.containerStates)
  const addToast = useToastStore((s) => s.addToast)
  const lastSavedCleanTableFlagRef = useRef(false)

  const lastPosRef = useRef({ x: robotPosition.x, z: robotPosition.z })
  const doorCooldownRef = useRef(0)
  const lastHintRef = useRef<string | null>(null)

  // 防抖：E/F 连续按键时忽略短于 180ms 的重复触发
  const lastActionAtRef = useRef<Record<string, number>>({})
  const ACTION_DEBOUNCE_MS = 180

  const isActionCooled = (key: string, now = performance.now()): boolean => {
    const last = lastActionAtRef.current[key] ?? 0
    if (now - last < ACTION_DEBOUNCE_MS) return false
    lastActionAtRef.current[key] = now
    return true
  }

  const findNearbyEntity = useCallback(() => {
    const state = useGameStore.getState()
    // L3 阶段门禁：g-encode-cereal-memory 完成前，不允许与 BOWL/CUP/SPOON 交互
    const stageAwareFilter = (entity: any) => {
      if (isEntityProtectedAfterGoal(state.task, entity, state.achievedGoalIds)) return false
      if (state.task?.id === 'task-laundry-sort' && !state.achievedGoalIds.has('g-encode-cereal-memory')) {
        const blockedIds = ['obj-breakfast-bowl', 'obj-breakfast-cup', 'obj-breakfast-spoon']
        if (blockedIds.includes(entity.configId)) return false
      }
      return true
    }
    return findNearestInteractableEntity(entities, state.robotPosition, state.currentRoom, 2, stageAwareFilter)
  }, [entities])

  const findNearbyContainer = useCallback(() => {
    const state = useGameStore.getState()
    const heldEntity = state.heldEntityId ? state.entities.find((e: any) => e.id === state.heldEntityId) : null
    const heldCategory = heldEntity?.category ?? null
    return findNearestInteractableContainer(state.task, state.robotPosition, state.currentRoom, 2.5, heldCategory)
  }, [])

  // 查找附近可交互的门（任务相关 + 距离 < 阈值）
  const findNearbyDoor = useCallback(() => {
    const state = useGameStore.getState()
    const { robotPosition, currentRoom, task } = state
    const roomSpec = sharedRooms[currentRoom]
    if (!roomSpec || !task) return null

    const taskRooms = task.rooms
    let nearest: { connectsTo: RoomId; distance: number } | null = null

    for (const d of roomSpec.doorways) {
      if (!taskRooms.includes(d.connectsTo as RoomId)) continue
      const doorWorldX = roomSpec.center.x + d.offset.x
      const doorWorldZ = roomSpec.center.z + d.offset.z
      const dx = robotPosition.x - doorWorldX
      const dz = robotPosition.z - doorWorldZ
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist < DOOR_INTERACT_DISTANCE && (!nearest || dist < nearest.distance)) {
        nearest = { connectsTo: d.connectsTo as RoomId, distance: dist }
      }
    }

    return nearest
  }, [])

  // 同步初始旋转：当 robotRotation 被设置（任务初始化完成）时，确保相机 targetYawRef 正确
  // 关键：依赖 phase 和 robotRotation，确保 initializeTask 设置旋转后能立即同步
  useEffect(() => {
    const state = useGameStore.getState()
    // 只有当 phase 不是 idle（即任务已初始化）时才同步，避免初始 0 值覆盖
    if (state.phase !== 'idle') {
      targetYawRef.current = state.robotRotation
      targetPitchRef.current = state.cameraPitch
      lastSyncedYawRef.current = state.robotRotation
      lastSyncedPitchRef.current = state.cameraPitch
      smoothedCamRot.current.set(state.cameraPitch, gameYawToCameraYaw(state.robotRotation), 0, 'YXZ')
    }
  }, [phase, robotRotation])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const gs = useGameStore.getState()
      // ESC 无论是否暂停都要处理（才能触发 setPaused 取消暂停，或恢复锁定）
      if (e.code !== 'Escape') {
        if (gs.phase !== 'playing') return
        if (gs.isPaused) return
      }

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
          if (!isActionCooled('KeyE')) break
          const nearbyEntityForMemory = findNearbyEntity()
          if (nearbyEntityForMemory) {
            const stateBefore = useGameStore.getState()
            const placedContainerName = nearbyEntityForMemory.placedIn
              ? stateBefore.task?.containers?.find((c) => c.id === nearbyEntityForMemory.placedIn)?.name
              : null
            const roomName = stateBefore.currentRoom
            const result = executeSaveMemory(nearbyEntityForMemory.id)
            if (result.success && result.slotIndex !== undefined) {
              // §三 限制全局 Toast：
              //  - 仅 task-clean-table 使用详细"已记住：<物体> 在 <位置>"位置 Toast；
              //  - 其他任务保持原有简洁 Toast 行为（已保存记忆 / 已更新记忆）。
              if (task?.id === 'task-clean-table') {
                const locStr = placedContainerName ? `${placedContainerName}（${roomName}）` : roomName
                addToast('success', `已记住：${nearbyEntityForMemory.name} 在 ${locStr}`)
              } else if (result.isUpdate) {
                addToast('success', `已更新记忆：${nearbyEntityForMemory.name}`)
              } else {
                addToast('success', `已保存记忆：${nearbyEntityForMemory.name}`)
              }
              setFlashingSlotIndex(result.slotIndex)
              setTimeout(() => setFlashingSlotIndex(null), 1200)
              // §三 限制全局 Toast："现在按 F 拾取物品"仅 task-clean-table 首次保存触发；
              // 其他任务绝不输出这条教学提示。
              if (task?.id === 'task-clean-table' && !lastSavedCleanTableFlagRef.current) {
                lastSavedCleanTableFlagRef.current = true
                setTimeout(() => addToast('info', '现在按 F 拾取物品'), 600)
              }
            } else if (result.reason) {
              addToast('error', result.reason)
            } else {
              addToast('error', '记忆槽已满且全部锁定')
            }
          } else {
            addToast('info', '附近没有可保存的物体')
          }
          break
        }
        case 'KeyF': {
          if (!isActionCooled('KeyF')) break
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
              // 附近没有容器 → 丢弃物品到地面（解决持物死锁）
              const result = executeDrop()
              if (result.success) {
                const gs = useGameStore.getState()
                const entity = gs.entities.find((e) => e.id === heldEntityId)
                addToast('info', `已放回地面${entity ? `：${entity.name}` : ''}`)
              }
            }
          } else {
            // F 键交互回退链：拾取 → 容器 → 门
            // 任一步失败时继续尝试下一步，避免拾取被锁（如 L2 stage 0 任务物体拾取锁）
            // 但门就在附近时玩家无法开门。开门等有效操作优先于拾取失败提示。
            let handled = false
            let firstFailureReason: string | null = null

            const entity = findNearbyEntity()
            if (entity) {
              const result = executePick(entity.id)
              if (result.success) {
                addToast('success', `已拾取 ${entity.name}`)
                handled = true
              } else if (result.reason) {
                firstFailureReason = result.reason
              }
            }

            if (!handled) {
              const container = findNearbyContainer()
              if (container) {
                const isOpen = containerStates[container.id]?.open ?? container.initialOpen
                const result = executeContainerInteraction(container.id)
                if (result.success) {
                  addToast('info', isOpen ? `已关闭 ${container.name}` : `已打开 ${container.name}`)
                  handled = true
                }
              }
            }

            if (!handled) {
              const nearbyDoor = findNearbyDoor()
              if (nearbyDoor) {
                const gs = useGameStore.getState()
                const nowOpen = gs.toggleDoor(gs.currentRoom, nearbyDoor.connectsTo)
                const targetRoomName = sharedRooms[nearbyDoor.connectsTo]?.name ?? nearbyDoor.connectsTo
                addToast('info', nowOpen ? `已开门 → ${targetRoomName}` : `已关门`)
                handled = true
              }
            }

            if (!handled) {
              // 全部失败：显示最早的失败原因（保留原拾取失败提示），否则通用提示
              if (firstFailureReason) {
                addToast('error', firstFailureReason)
              } else {
                addToast('info', '附近没有可交互的物体、容器或门')
              }
            }
          }
          break
        }
        case 'Escape': {
          const gs = useGameStore.getState()
          const phase = gs.phase
          const inGame = phase === 'playing' || phase === 'briefing'
          const canvasEl = gl.domElement
          // 唯一权威：真实 Pointer Lock 元素 == 当前 canvas
          const pointerLocked = !!(canvasEl && document.pointerLockElement === canvasEl)
          const nowMs = performance.now()

          // 检查 Dialog 是否打开：如果 Dialog 打开，ESC 应该由 Dialog 处理（关闭对话框）
          // 而不是 FirstPersonControls
          const dialogRoot = document.querySelector('[data-dialog-root]')
          if (dialogRoot) {
            break
          }

          // 调用纯状态机（决策与 DOM/副作用解耦，便于 Vitest 独立测试）
          const decision = decideEscapeAction('KEYDOWN_ESCAPE', {
            pointerLocked,
            isPaused: gs.isPaused,
            inGamePhase: inGame,
            escapeReleasedUnlockAtMs: escapeReleasedUnlockAtRef.current,
            nowMs,
            cooldownMs: ESC_UNLOCK_COOLDOWN_MS,
          })

          // 根据 decision 执行副作用
          switch (decision.action) {
            case 'EXIT_LOCK': {
              e.preventDefault()
              e.stopPropagation()
              if (decision.setUnlockTimestampToMs !== undefined) {
                escapeReleasedUnlockAtRef.current = decision.setUnlockTimestampToMs
              } else {
                escapeReleasedUnlockAtRef.current = nowMs
              }
              try {
                document.exitPointerLock?.()
              } catch {
                // 忽略异常
              }
              if (inGame) {
                addToast('info', '鼠标已释放，再按 ESC 暂停游戏')
              } else {
                addToast('info', '鼠标已释放，点击游戏画面重新锁定')
              }
              break
            }
            case 'OPEN_PAUSE': {
              e.preventDefault()
              e.stopPropagation()
              // 进入暂停前再做一次保险：如果 Pointer Lock 仍在（比如绕过锁定判断的极端分支），
              // 强制退出锁定，保证暂停菜单点击可用
              try {
                if (document.pointerLockElement) document.exitPointerLock?.()
              } catch {
                // 忽略
              }
              gs.setPaused(true)
              break
            }
            case 'CLOSE_PAUSE': {
              e.preventDefault()
              e.stopPropagation()
              gs.setPaused(false)
              // ⚠️ 不恢复 Pointer Lock → 符合"点继续后保持未锁定，再次点击画面才锁定"
              break
            }
            case 'NO_OP':
            default:
              break
          }
          break
        }
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      const gs = useGameStore.getState()
      if (gs.phase !== 'playing' || gs.isPaused) {
        // 暂停或非 playing 时，仍清除所有方向按键的 state，避免恢复后持续漂移
        moveState.current.forward = false
        moveState.current.backward = false
        moveState.current.left = false
        moveState.current.right = false
        return
      }
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
  }, [phase, findNearbyEntity, findNearbyContainer, findNearbyDoor, setFlashingSlotIndex, addToast, heldEntityId, containerStates])

  const isDraggingRef = useRef(false)
  const isPointerOverCanvasRef = useRef(false)
  // ⚠️ 初始值必须为 false，真实锁定状态唯一权威 = document.pointerLockElement === canvas
  // 比赛桌面版：除 Pointer Lock 激活外，其他途径均不允许 mousemove 转视角（删除了"悬停即转"逻辑）
  const isMouseLockedRef = useRef(false)
  const touchStartRef = useRef({ x: 0, y: 0 })
  const touchRotRef = useRef({ yaw: 0, pitch: 0 })
  const lastTouchTimeRef = useRef(0)
  const isTouchInteractionRef = useRef(false)
  // ESC ↔ PointerLock 竞态保护：记录"刚因 ESC 释放了 Pointer Lock"的时间戳（ms），
  // 同一次 ESC 按下导致的 keydown + pointerlockchange 序列里，不允许顺带打开暂停；
  // 必须等到下一次独立按键（距此时间 > ESC_UNLOCK_COOLDOWN_MS）才允许开暂停。
  // 用 -Infinity 表示"从未因 ESC 释放过锁"，保证 nowMs - (-Infinity) = Infinity > 任何 cooldown。
  const escapeReleasedUnlockAtRef = useRef<number>(Number.NEGATIVE_INFINITY)
  const ESC_UNLOCK_COOLDOWN_MS = 250

  // 使用 ref 保存 tap 处理函数，避免在 useEffect 依赖中列出所有状态
  // useEffect 只订阅一次事件，tap 时通过 ref 调用最新闭包
  const tapHandlerRef = useRef<() => void>(() => {})

  useEffect(() => {
    tapHandlerRef.current = () => {
      const state = useGameStore.getState()
      if (state.phase !== 'playing') return
      // L3 阶段门禁
      const stageAwareFilter = (entity: any) => {
        if (isEntityProtectedAfterGoal(state.task, entity, state.achievedGoalIds)) return false
        if (state.task?.id === 'task-laundry-sort' && !state.achievedGoalIds.has('g-encode-cereal-memory')) {
          const blockedIds = ['obj-breakfast-bowl', 'obj-breakfast-cup', 'obj-breakfast-spoon']
          if (blockedIds.includes(entity.configId)) return false
        }
        return true
      }
      const nearbyEntity = findNearestInteractableEntity(
        state.entities,
        state.robotPosition,
        state.currentRoom,
        2,
        stageAwareFilter,
      )
      const heldEntityForCategory = state.heldEntityId ? state.entities.find((e: any) => e.id === state.heldEntityId) : null
      const heldCategory = heldEntityForCategory?.category ?? null
      const nearbyContainer = findNearestInteractableContainer(
        state.task,
        state.robotPosition,
        state.currentRoom,
        2.5,
        heldCategory,
      )
      const { addToast: addToastNow } = useToastStore.getState()

      if (state.heldEntityId) {
        if (nearbyContainer) {
          const result = executeContainerInteraction(nearbyContainer.id)
          if (result.success) {
            addToastNow('success', `已放置到 ${nearbyContainer.name}`)
          } else if (result.reason) {
            addToastNow('error', result.reason)
          }
        }
      } else {
        if (nearbyEntity) {
          const result = executePick(nearbyEntity.id)
          if (result.success) {
            addToastNow('success', `已拾取 ${nearbyEntity.name}`)
          } else if (result.reason) {
            addToastNow('error', result.reason)
          }
        } else if (nearbyContainer) {
          const isOpen =
            state.containerStates[nearbyContainer.id]?.open ?? nearbyContainer.initialOpen
          const result = executeContainerInteraction(nearbyContainer.id)
          if (result.success) {
            addToastNow('info', isOpen ? `已关闭 ${nearbyContainer.name}` : `已打开 ${nearbyContainer.name}`)
          }
        }
      }
    }
  })

  useEffect(() => {
    const canvas = gl.domElement

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return
      // 对话打开时不请求 Pointer Lock，否则光标会被锁定到 canvas，
      // 玩家无法点击对话选项按钮（必须按 ESC 才能退出）。
      if (document.querySelector('[data-dialog-root]')) return

      // 唯一权威：直接检查 document.pointerLockElement 是否就是 canvas
      const lockedNow = document.pointerLockElement === canvas
      if (!lockedNow) {
        // 未锁定：点击画面 → 请求 Pointer Lock；由 pointerlockchange 来同步真实状态
        canvas.requestPointerLock?.()
        // ⚠️ 不手动 set isMouseLockedRef = true（如果 requestPointerLock 失败，
        // 比如 iframe 安全策略，ref 会和浏览器真实态发生分歧，造成"UI以为锁了/实际上没锁"）
        return
      }
      // 已锁定：比赛版禁止"鼠标按下 + 拖动"再旋转一次（Pointer Lock 独占鼠标已经在转），
      // 所以不再进入 dragging 分支，也不再改 cursor。
    }

    // 同步 isMouseLockedRef 与浏览器真实 Pointer Lock 状态（唯一权威事件源）。
    // - DialogBox 打开时会调用 document.exitPointerLock()，这里监听变化把 ref 置 false
    // - 玩家点击画面 requestPointerLock() 成功 → 也由此事件置 true
    const handlePointerLockChange = () => {
      const nowLocked = document.pointerLockElement === canvas
      const wasLocked = isMouseLockedRef.current
      isMouseLockedRef.current = nowLocked

      if (wasLocked && !nowLocked) {
        // Locked → Unlocked：提示"点击画面继续控制"
        const gs = useGameStore.getState()
        if (gs.phase === 'playing' || gs.phase === 'briefing') {
          if (!gs.isPaused) {
            addToast('info', '点击画面继续控制视角')
          }
        }
      }
    }
    document.addEventListener('pointerlockchange', handlePointerLockChange)

    const handleMouseMove = (e: MouseEvent) => {
      // ⚠️ 比赛桌面版：只有 Pointer Lock 激活才允许用 mousemove 转视角。
      // 已经移除"鼠标悬停 canvas 上也旋转"和"未锁定时按左键拖动也旋转"两条路径，
      // 避免玩家在 UI 点击期间误转动相机。
      if (!isMouseLockedRef.current) return
      // Pointer Lock 激活时使用 movementX/Y（真正相对位移），水平/垂直灵敏度分开
      targetYawRef.current = applyHorizontalLookDelta(targetYawRef.current, e.movementX, MOUSE_SENSITIVITY_H)
      targetPitchRef.current = clampPitch(targetPitchRef.current - e.movementY * MOUSE_SENSITIVITY_V)
    }

    const handleMouseUp = () => {
      isDraggingRef.current = false
      canvas.style.cursor = 'grab'
    }

    const handleMouseLeave = () => {
      isDraggingRef.current = false
      isPointerOverCanvasRef.current = false
      canvas.style.cursor = 'grab'
    }

    const handleMouseEnter = () => {
      isPointerOverCanvasRef.current = true
      canvas.style.cursor = 'grab'
    }

    const handleWheel = (e: WheelEvent) => {
      // 比赛版：FOV 只允许在 65~80 间小幅调整（默认 72），且步进大幅削弱，
      // 避免一次滚轮 100 deltaY 直接从 72 → 66，看起来像"滚轮把画面 Zoom 爆了"
      if (!isPointerOverCanvasRef.current) return
      e.preventDefault()
      e.stopPropagation()
      // 原系数 0.05 下调到 0.005：每次滚轮约 ±0.5°，3 次小幅调整 ≈ 1.5°
      const delta = e.deltaY * 0.005
      cameraFovRef.current = Math.max(FOV_MIN, Math.min(FOV_MAX, cameraFovRef.current + delta))
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      const touch = e.touches[0]
      touchStartRef.current = { x: touch.clientX, y: touch.clientY }
      touchRotRef.current = { yaw: targetYawRef.current, pitch: targetPitchRef.current }
      isDraggingRef.current = true
      isTouchInteractionRef.current = false
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1 || !isDraggingRef.current) return
      const touch = e.touches[0]
      const dx = touch.clientX - touchStartRef.current.x
      const dy = touch.clientY - touchStartRef.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > 10) {
        isTouchInteractionRef.current = true
        // 移动端：仍沿用水平 1.5x 旧系数基础；但垂直要 * 0.8 与桌面统一比例
        const senH = MOUSE_SENSITIVITY_H * 1.5
        const senV = MOUSE_SENSITIVITY_V * 1.5
        targetYawRef.current = applyHorizontalLookDelta(touchRotRef.current.yaw, dx, senH)
        targetPitchRef.current = clampPitch(touchRotRef.current.pitch - dy * senV)
      }
    }

    const handleTouchEnd = () => {
      if (!isTouchInteractionRef.current && Date.now() - lastTouchTimeRef.current > 300) {
        tapHandlerRef.current()
      }
      isDraggingRef.current = false
      lastTouchTimeRef.current = Date.now()
    }

    canvas.style.cursor = 'grab'
    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mouseenter', handleMouseEnter)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('mouseleave', handleMouseLeave)
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mouseenter', handleMouseEnter)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
      canvas.removeEventListener('wheel', handleWheel)
      canvas.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      document.removeEventListener('pointerlockchange', handlePointerLockChange)
    }
  }, [gl, phase, addToast])

  useFrame((_, delta) => {
    const state = useGameStore.getState()
    const { robotPosition, currentRoom, viewMode, phase: gamePhase, isPaused } = state

    // ⚠️ briefing 阶段完全禁用任何回写 store，避免浮点插值抖动 → store setState → 无限重渲染循环
    // ⚠️ 暂停时禁用移动/旋转，只保留相机位置与 store 同步（避免机器人冻结后继续漂移）
    const isPlaying = gamePhase === 'playing' && !isPaused

    const storeYaw = state.robotRotation
    const storePitch = state.cameraPitch
    if (isPlaying) {
      if (Math.abs(storeYaw - lastSyncedYawRef.current) > ROTATION_SYNC_THRESHOLD) {
        targetYawRef.current = storeYaw
        lastSyncedYawRef.current = storeYaw
      }
      if (Math.abs(storePitch - lastSyncedPitchRef.current) > ROTATION_SYNC_THRESHOLD) {
        targetPitchRef.current = storePitch
        lastSyncedPitchRef.current = storePitch
      }
    }

    const posLerp = Math.min(1, delta * 12)
    const rotLerp = Math.min(1, delta * 18)

    if (viewMode === 'first-person') {
      const targetY = PLAYER_HEIGHT
      smoothedCamPos.current.x += (robotPosition.x - smoothedCamPos.current.x) * posLerp
      smoothedCamPos.current.y += (targetY - smoothedCamPos.current.y) * posLerp
      smoothedCamPos.current.z += (robotPosition.z - smoothedCamPos.current.z) * posLerp

      const targetCameraYaw = gameYawToCameraYaw(targetYawRef.current)
      smoothedCamRot.current.y += (targetCameraYaw - smoothedCamRot.current.y) * rotLerp
      smoothedCamRot.current.x += (targetPitchRef.current - smoothedCamRot.current.x) * rotLerp
      smoothedCamRot.current.z = 0

      camera.position.copy(smoothedCamPos.current)
      camera.rotation.copy(smoothedCamRot.current)
      if ('fov' in camera) camera.fov = cameraFovRef.current
    } else {
      const targetY = 8
      const topDownPosLerp = Math.min(1, delta * 8)
      smoothedCamPos.current.x += (robotPosition.x - smoothedCamPos.current.x) * topDownPosLerp
      smoothedCamPos.current.y += (targetY - smoothedCamPos.current.y) * topDownPosLerp
      smoothedCamPos.current.z += (robotPosition.z - smoothedCamPos.current.z) * topDownPosLerp

      const targetCameraYaw = gameYawToCameraYaw(targetYawRef.current)
      smoothedCamRot.current.y += (targetCameraYaw - smoothedCamRot.current.y) * rotLerp
      smoothedCamRot.current.x = -Math.PI / 2.5
      smoothedCamRot.current.z = 0

      camera.position.copy(smoothedCamPos.current)
      camera.rotation.copy(smoothedCamRot.current)
      if ('fov' in camera) camera.fov = 60
    }
    camera.updateProjectionMatrix()

    if (isPlaying) {
      // 无条件同步 robotRotation/cameraPitch 到 store，
      // 确保小地图箭头与实际相机朝向严格一致，避免 90° 偏差
      useGameStore.setState({
        robotRotation: targetYawRef.current,
        cameraPitch: targetPitchRef.current,
      })
      lastSyncedYawRef.current = targetYawRef.current
      lastSyncedPitchRef.current = targetPitchRef.current
    }

    if (!isPlaying) return

    const speed = viewMode === 'top-down' ? TOP_DOWN_SPEED : PLAYER_SPEED
    let moveDx = 0
    let moveDz = 0
    if (viewMode === 'top-down') {
      const forward = Number(moveState.current.forward) - Number(moveState.current.backward)
      const right = Number(moveState.current.right) - Number(moveState.current.left)

      const hasInput = forward !== 0 || right !== 0

      if (hasInput) {
        const cameraForward = new THREE.Vector3()
        camera.getWorldDirection(cameraForward)
        cameraForward.y = 0
        cameraForward.normalize()

        const cameraRight = new THREE.Vector3()
        cameraRight.crossVectors(cameraForward, new THREE.Vector3(0, 1, 0)).normalize()

        const moveDir = new THREE.Vector3(0, 0, 0)
          .addScaledVector(cameraForward, forward)
          .addScaledVector(cameraRight, right)
          .normalize()

        const distance = speed * delta
        moveDx = moveDir.x * distance
        moveDz = moveDir.z * distance
      }
    } else {
      const forward = Number(moveState.current.forward) - Number(moveState.current.backward)
      const right = Number(moveState.current.right) - Number(moveState.current.left)

      const hasInput = forward !== 0 || right !== 0

      if (hasInput) {
        const cameraForward = new THREE.Vector3()
        camera.getWorldDirection(cameraForward)
        cameraForward.y = 0
        cameraForward.normalize()

        const cameraRight = new THREE.Vector3()
        cameraRight.crossVectors(cameraForward, new THREE.Vector3(0, 1, 0)).normalize()

        targetMoveDirRef.current
          .set(0, 0, 0)
          .addScaledVector(cameraForward, forward)
          .addScaledVector(cameraRight, right)
          .normalize()
      }

      const targetSpeed = hasInput ? speed : 0

      if (targetSpeed > currentSpeedRef.current) {
        currentSpeedRef.current = Math.min(targetSpeed, currentSpeedRef.current + ACCELERATION * delta)
      } else {
        currentSpeedRef.current = Math.max(targetSpeed, currentSpeedRef.current - DECELERATION * delta)
      }

      if (currentSpeedRef.current > 0.001) {
        const turnFactor = Math.min(1, TURN_SMOOTHING * delta)
        moveDirectionRef.current.lerp(targetMoveDirRef.current, turnFactor).normalize()

        const distance = currentSpeedRef.current * delta
        moveDx = moveDirectionRef.current.x * distance
        moveDz = moveDirectionRef.current.z * distance
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
      const doorOpenStates = useGameStore.getState().doorOpenStates ?? {}
      // 门关闭时阻挡通行：只把"任务相关 + 门已开"的门洞加入碰撞可通过列表
      const effectiveDoorways: CollisionDoorwaySpec[] = roomSpec
        ? roomSpec.doorways
            .filter((d) => !taskRooms || taskRooms.includes(d.connectsTo))
            .filter((d) => doorOpenStates[doorKey(currentRoom, d.connectsTo as RoomId)] === true)
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
      // 门关闭时不允许房间切换：只允许门已开的目标房间
      const doorStates = useGameStore.getState().doorOpenStates ?? {}
      const allowedRooms = task.rooms.filter((r: RoomId) =>
        r === currentRoom || doorStates[doorKey(currentRoom, r)] === true
      )
      const transition = checkRoomTransition(
        { x: robotPosition.x, z: robotPosition.z },
        currentRoom,
        sharedRooms,
        allowedRooms,
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
