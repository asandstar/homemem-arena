// 工具函数 - 格式化、ID 生成、可见性计算

import type { Vec3 } from '../types/room'

export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
}

export function formatNumber(n: number, digits = 0): string {
  return n.toFixed(digits)
}

/** 计算两个 3D 点的欧氏距离 */
export function distance(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const dz = a.z - b.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

/** 计算点 a 到点 b 的水平距离 (忽略 Y) */
export function distanceFlat(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x
  const dz = a.z - b.z
  return Math.sqrt(dx * dx + dz * dz)
}

/** Y 轴旋转的朝向向量 */
export function getForwardVector(rotationY: number): Vec3 {
  return {
    x: Math.sin(rotationY),
    y: 0,
    z: Math.cos(rotationY),
  }
}

/** 判断点是否在机器人的第一人称视锥内（简化版） */
export function isInFieldOfView(
  observerPos: Vec3,
  observerRotY: number,
  targetPos: Vec3,
  fovDeg = 90,
  maxDist = 8
): boolean {
  const dist = distanceFlat(observerPos, targetPos)
  if (dist > maxDist) return false

  const dx = targetPos.x - observerPos.x
  const dz = targetPos.z - observerPos.z

  // 目标相对机器人的角度
  const targetAngle = Math.atan2(dx, dz)
  // 机器人朝向
  let diff = targetAngle - observerRotY
  // 归一化到 -PI..PI
  while (diff > Math.PI) diff -= 2 * Math.PI
  while (diff < -Math.PI) diff += 2 * Math.PI

  const halfFov = (fovDeg * Math.PI) / 180 / 2
  return Math.abs(diff) <= halfFov
}

/** 生成环境事件 ID */
export function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}
