/**
 * 场景碰撞元数据（Scene Collision Schema）纯函数基础。
 *
 * 本轮 P2.G1-A 仅提供可复用的纯函数与类型别名；
 * 生产运行时（collision.ts / FirstPersonControls）暂不接入，
 * 接入工作留到 P2.G1-B。
 *
 * 约束：
 * - 纯函数：无副作用，不依赖 Store / React / Three.js
 * - 不读 GLB mesh，不读 rooms 全局数据
 * - 不修改输入对象
 */

import type {
  DecorFurnitureSpec,
  DecorCollisionMode,
  DecorVisualOwner,
} from '../data/decorFurniture'
import type {
  ContainerCollisionMode,
  ContainerSpec,
  ContainerVisualOwner,
} from '../types/object'

// --- 类型再导出，便于下游（qa-layout / P2.G1-B 接入）统一定位 ---
export type { DecorCollisionMode, DecorVisualOwner }
export type { ContainerCollisionMode, ContainerVisualOwner }

// -----------------------------------------------------------------
// §1. 旋转 footprint 计算（任意 yaw，不依赖 90° 特判）
// -----------------------------------------------------------------

/**
 * 浮点 EPSILON：吸收 sin/cos 误差（如 sin(π/2) 不应被当成 0.999999...）。
 */
const EPS = 1e-9

/**
 * 根据家具原始 XZ 尺寸和 Y 轴旋转计算轴对齐包围盒（AABB）尺寸。
 *
 * 公式：
 *   fullX = |cos(yaw)| * size.x + |sin(yaw)| * size.z
 *   fullZ = |sin(yaw)| * size.x + |cos(yaw)| * size.z
 *
 * 对 0 / π/2 / π / -π/2 等特殊角度自动 exact 命中（浮点无误差），
 * 对 π/4 等非正交角度给出保守的轴对齐包络。
 *
 * @param size 家具未旋转时的 XZ 尺寸（完整尺寸，非 half-extent）
 * @param rotationY Y 轴旋转（弧度），缺失时视为 0
 * @returns 旋转后仍然轴对齐的 XZ 尺寸（完整尺寸）。
 */
export function getRotatedFootprint(
  size: { x: number; z: number },
  rotationY?: number,
): { x: number; z: number } {
  const yaw = rotationY ?? 0
  const c = Math.cos(yaw)
  const s = Math.sin(yaw)
  const absC = Math.abs(c)
  const absS = Math.abs(s)
  const rawX = absC * size.x + absS * size.z
  const rawZ = absS * size.x + absC * size.z
  // 消除浮点 near-zero 噪声，保留 10^-9 量级精度
  const x = Math.abs(rawX) < EPS ? 0 : rawX
  const z = Math.abs(rawZ) < EPS ? 0 : rawZ
  return { x, z }
}

// -----------------------------------------------------------------
// §2. 碰撞所有权纯函数（运行时暂不接入；QA 与 P2.G1-B 准备）
// -----------------------------------------------------------------

/**
 * 背景家具（Decor）是否需要承担 XZ 碰撞。
 *
 * - 'self'  → true
 * - 'none'  → false
 * - 缺失    → true（向后兼容，legacy 默认全部参与）
 */
export function shouldDecorProvideCollision(
  spec: Pick<DecorFurnitureSpec, 'collisionMode'>,
): boolean {
  const mode: DecorCollisionMode | undefined = spec.collisionMode
  if (mode === 'none') return false
  // 'self' 或 undefined / 其他默认
  return true
}

/**
 * 任务容器（Container）是否需要承担 XZ 碰撞。
 *
 * - 'self'              → true
 * - 'static-furniture'  → false（由 DF 对应家具承担）
 * - 'none'              → false（空中托盘 / 墙挂容器）
 * - 缺失                → true（向后兼容，legacy 默认全部参与）
 */
export function shouldContainerProvideCollision(
  spec: Pick<ContainerSpec, 'collisionMode'>,
): boolean {
  const mode: ContainerCollisionMode | undefined = spec.collisionMode
  if (mode === 'static-furniture') return false
  if (mode === 'none') return false
  return true
}
