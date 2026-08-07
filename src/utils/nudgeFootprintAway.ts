/**
 * src/utils/nudgeFootprintAway.ts
 *
 * F5 · L2 猫脚印简单避让茶几/家具。
 *
 * 背景：CatPrintsEffect 在 start→end 之间线性插值打脚印，若起止点连线上穿过
 * 茶几/沙发（如 living 默认演示路径），脚印会印在茶几内部（浮空/穿越家具的视觉错误）。
 *
 * 修复：对每个脚印候选位置做 2D OBB（有向矩形）包含检测，若在家具内部，
 * 沿最靠近矩形边的方向推到矩形外 + 0.1m 缓冲。纯数学，零 React/Three 依赖。
 */

export interface FootprintOccSpec {
  /** 矩形中心（XZ 平面，世界坐标） */
  cx: number
  cz: number
  /** 矩形 X 向半尺寸 × 2（全宽） */
  sx: number
  /** 矩形 Z 向半尺寸 × 2（全深） */
  sz: number
  /** Y 轴旋转角（弧度），与 Three.js / furniture rotationY 一致 */
  rotationY?: number
}

export interface NudgeResult {
  x: number
  z: number
  nudged: boolean
}

/** 距离矩形外边缘的缓冲量（避免印在茶几边儿上看起来悬浮） */
const BUFFER = 0.1

/**
 * 判断 (px, pz) 是否在任意 occluder 矩形内部；若是则推到最近边 + BUFFER 外。
 *
 * 处理多次迭代：推出后可能刚好进入相邻另一件家具（比如沙发和茶几挨得近），
 * 所以最多迭代 3 次。
 */
export function nudgeFootprintAway(
  px: number,
  pz: number,
  occluders: FootprintOccSpec[],
): NudgeResult {
  let x = px
  let z = pz
  let nudged = false

  for (let iter = 0; iter < 3; iter++) {
    let hitOcc: FootprintOccSpec | null = null
    let localX = 0
    let localZ = 0

    for (const occ of occluders) {
      const rot = occ.rotationY ?? 0
      // 将世界点变换到 occluder 局部坐标（反旋转）
      const dx = x - occ.cx
      const dz = z - occ.cz
      const cos = Math.cos(-rot)
      const sin = Math.sin(-rot)
      const lx = dx * cos - dz * sin
      const lz = dx * sin + dz * cos
      if (Math.abs(lx) < occ.sx / 2 && Math.abs(lz) < occ.sz / 2) {
        hitOcc = occ
        localX = lx
        localZ = lz
        break
      }
    }

    if (!hitOcc) break // 不在任何 occluder 内部 → OK
    nudged = true

    // 找距离最近的边，沿该方向推到边外 + BUFFER
    const halfX = hitOcc.sx / 2
    const halfZ = hitOcc.sz / 2
    const distNegX = localX - (-halfX) // 到左边距离（负边）
    const distPosX = halfX - localX // 到右边距离（正边）
    const distNegZ = localZ - (-halfZ)
    const distPosZ = halfZ - localZ
    const minDist = Math.min(distNegX, distPosX, distNegZ, distPosZ)

    // 局部坐标下目标位置
    let targetLocalX = localX
    let targetLocalZ = localZ
    if (minDist === distNegX) targetLocalX = -halfX - BUFFER
    else if (minDist === distPosX) targetLocalX = halfX + BUFFER
    else if (minDist === distNegZ) targetLocalZ = -halfZ - BUFFER
    else targetLocalZ = halfZ + BUFFER

    // 局部 → 世界：正向旋转
    const rot = hitOcc.rotationY ?? 0
    const cos = Math.cos(rot)
    const sin = Math.sin(rot)
    x = hitOcc.cx + targetLocalX * cos - targetLocalZ * sin
    z = hitOcc.cz + targetLocalX * sin + targetLocalZ * cos
  }

  return { x, z, nudged }
}
