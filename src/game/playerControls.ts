// 坐标系约定：
// - Three.js 默认 forward = -Z（yaw=0 时看向 -Z）
// - Y 轴向上
// - yaw (rotation.y)：绕 Y 轴旋转，正值表示向左转（从上方看逆时针）
// - pitch (rotation.x)：绕 X 轴旋转，正值表示抬头
// - roll (rotation.z)：始终为 0

export const PLAYER_SPEED = 3.0
export const TOP_DOWN_SPEED = 4.0
export const PLAYER_RADIUS = 0.3
export const PLAYER_HEIGHT = 1.6
export const PITCH_MIN = -Math.PI / 3
export const PITCH_MAX = Math.PI / 3
export const MOUSE_SENSITIVITY = 0.002

export const ACCELERATION = 25.0
export const DECELERATION = 35.0
export const TURN_SMOOTHING = 12.0

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
