// 坐标系约定：
// - Three.js 默认 forward = -Z（yaw=0 时看向 -Z）
// - Y 轴向上
// - yaw (rotation.y)：绕 Y 轴旋转，正值表示向左转（从上方看逆时针）
// - pitch (rotation.x)：绕 X 轴旋转，正值表示抬头
// - roll (rotation.z)：始终为 0

export const PLAYER_SPEED = 3.0
export const TOP_DOWN_SPEED = 4.5
export const PLAYER_RADIUS = 0.3
// 玩家眼睛高度：从 1.5m 降至 1.35m，更贴近"机器人管家"设定，俯视感过强的问题缓解
export const PLAYER_HEIGHT = 1.35
// 俯仰角限制：收窄到 ±50°，避免极端抬头/低头导致天花板/地板填满屏幕的不适感
export const PITCH_MIN = -Math.PI * 5 / 18 // -50°
export const PITCH_MAX = Math.PI * 5 / 18  // +50°
// 鼠标灵敏度：降低约 27%（0.0015 → 0.0011），让缓慢转动更精确、不"粘手"
export const MOUSE_SENSITIVITY = 0.0011

export const ACCELERATION = 40.0
export const DECELERATION = 50.0
export const TURN_SMOOTHING = 20.0

export interface MoveInput {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
}

export function getForwardVector(yaw: number): { x: number; z: number } {
  return {
    x: Math.sin(yaw),
    z: -Math.cos(yaw),
  }
}

/**
 * 游戏 yaw 使用“0 朝北(-Z)、正值顺时针朝东(+X)”；Three.js 相机的
 * rotation.y 正值方向相反，因此渲染相机时必须取负号。
 */
export function gameYawToCameraYaw(yaw: number): number {
  return -yaw
}

/** 水平鼠标/触摸向右移动时，游戏 yaw 顺时针增加。 */
export function applyHorizontalLookDelta(yaw: number, movementX: number, sensitivity: number): number {
  return yaw + movementX * sensitivity
}

/** 将游戏世界前向投影到小地图画布（+x 向右，+y 向下）。 */
export function getMinimapForwardVector(yaw: number): { x: number; y: number } {
  const forward = getForwardVector(yaw)
  return { x: forward.x, y: forward.z }
}

export function getRightVector(yaw: number): { x: number; z: number } {
  return {
    x: Math.cos(yaw),
    z: Math.sin(yaw),
  }
}

export function computeMovementVector(
  input: MoveInput,
  yaw: number,
  speed: number,
  delta: number
): { dx: number; dz: number } {
  const forward = Number(input.forward) - Number(input.backward)
  const right = Number(input.right) - Number(input.left)

  if (forward === 0 && right === 0) {
    return { dx: 0, dz: 0 }
  }

  const length = Math.sqrt(forward * forward + right * right)
  const nForward = forward / length
  const nRight = right / length

  const forwardVec = getForwardVector(yaw)
  const rightVec = getRightVector(yaw)

  const distance = speed * delta
  return {
    dx: (forwardVec.x * nForward + rightVec.x * nRight) * distance,
    dz: (forwardVec.z * nForward + rightVec.z * nRight) * distance,
  }
}

export function clampPitch(pitch: number): number {
  return Math.max(PITCH_MIN, Math.min(PITCH_MAX, pitch))
}
