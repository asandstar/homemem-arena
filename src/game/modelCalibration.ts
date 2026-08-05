/**
 * src/game/modelCalibration.ts
 *
 * §九 · Pure THREE helpers（不依赖 React、不导入 R3F / Zustand）。
 *
 * 对外：
 *  - measureObjectAabb(object: THREE.Object3D): { min, max, size }
 *  - computeBottomCenterOffset(box: THREE.Box3): Vec3 (内层 group 用的 pivot, 把模型中心 XZ 归零且 Y 最小值对齐 floor=0)
 *  - computeScaledAabb(rawSize: Vec3, uniformScale: number): Vec3
 *  - compareAabb(actual, expected, tolerance?): { verdict, perAxis } （§七 ≤0.01 PASS / ≤0.03 WARN / >0.03 FAIL）
 *
 * 纯函数，可被 vitest（jsdom + THREE jsdom 单测）直接 import。
 */
import * as THREE from 'three'

export type Vec3 = { x: number; y: number; z: number }
export type CalibrationVerdict = 'PASS' | 'WARN' | 'FAIL'

export type AabbResult = {
  min: THREE.Vector3
  max: THREE.Vector3
  size: Vec3
}

function boxIsFinite(box: THREE.Box3): boolean {
  // 兼容 three r140 之前版本（没有 Box3.isFinite 方法），手写有限性检查。
  return (
    Number.isFinite(box.min.x) && Number.isFinite(box.min.y) && Number.isFinite(box.min.z)
    && Number.isFinite(box.max.x) && Number.isFinite(box.max.y) && Number.isFinite(box.max.z)
  )
}

/**
 * §九 measureObjectAabb。
 * 若传入对象无 mesh children（empty Object3D）：抛出明确错误（由调用方决定 fallback 策略）。
 * NaN 或无限坐标直接 FAIL（抛错），避免下游静默。
 */
export function measureObjectAabb(object: THREE.Object3D): AabbResult {
  const box = new THREE.Box3()
  // updateMatrixWorld(true) 保证子节点变换已应用（skeletal / morph 本项目不涉及，但保底）。
  object.updateMatrixWorld(true)
  box.setFromObject(object)

  if (!boxIsFinite(box)) {
    throw new Error('[modelCalibration] Box3 not finite (contains NaN or Infinity). Empty or corrupted GLB?')
  }
  if (box.isEmpty()) {
    throw new Error('[modelCalibration] Box3 empty. No meshes found in the Object3D.')
  }
  const size = new THREE.Vector3()
  box.getSize(size)
  return {
    min: box.min.clone(),
    max: box.max.clone(),
    size: { x: size.x, y: size.y, z: size.z },
  }
}

/**
 * §九 computeBottomCenterOffset。
 * 对于一个"原始 GLB" Box3（未 apply uniformScale，仅 GLB 自身坐标）：
 *  - 水平方向：把 (min+max)/2 归零 → XZ 居中
 *  - 垂直方向：把 min.y 归零 → bottom floor 对齐
 *
 * 即：pivotOffset = { -centerX, -minY, -centerZ }
 */
export function computeBottomCenterOffset(box: THREE.Box3): Vec3 {
  if (!boxIsFinite(box) || box.isEmpty()) {
    // 返回 NaN 向量让下游显式 FAIL，不静默给 0
    return { x: NaN, y: NaN, z: NaN }
  }
  const center = new THREE.Vector3()
  box.getCenter(center)
  return {
    x: -center.x,
    y: -box.min.y,
    z: -center.z,
  }
}

export function computeScaledAabb(rawSize: Vec3, uniformScale: number): Vec3 {
  if (!Number.isFinite(uniformScale) || uniformScale <= 0) {
    return { x: NaN, y: NaN, z: NaN }
  }
  if (![rawSize.x, rawSize.y, rawSize.z].every((v) => Number.isFinite(v) && v >= 0)) {
    return { x: NaN, y: NaN, z: NaN }
  }
  return {
    x: rawSize.x * uniformScale,
    y: rawSize.y * uniformScale,
    z: rawSize.z * uniformScale,
  }
}

/**
 * §九 compareAabb。
 * tolerancePASS = 0.01（§七 ≤0.01 PASS），toleranceWARN = 0.03（≤0.03 WARN，> FAIL）。
 */
export function compareAabb(
  actual: Vec3,
  expected: Vec3,
  tolerancePASS = 0.01,
  toleranceWARN = 0.03,
): {
  verdict: CalibrationVerdict
  perAxis: { axis: 'x' | 'y' | 'z'; delta: number; verdict: CalibrationVerdict }[]
  maxAbsDelta: number
} {
  const axes: ('x' | 'y' | 'z')[] = ['x', 'y', 'z']
  let overall: CalibrationVerdict = 'PASS'
  let maxAbs = 0
  const perAxis = axes.map((axis) => {
    const a = actual[axis]
    const e = expected[axis]
    const d = Math.abs(a - e)
    if (!Number.isFinite(d)) {
      overall = 'FAIL'
      return { axis, delta: NaN, verdict: 'FAIL' as CalibrationVerdict }
    }
    if (d > maxAbs) maxAbs = d
    let v: CalibrationVerdict = 'PASS'
    if (d > toleranceWARN) {
      v = 'FAIL'
    } else if (d > tolerancePASS) {
      v = 'WARN'
    }
    if (v === 'FAIL') overall = 'FAIL'
    else if (v === 'WARN' && overall === 'PASS') overall = 'WARN'
    return { axis, delta: d, verdict: v }
  })
  return { verdict: overall, perAxis, maxAbsDelta: maxAbs }
}
