/**
 * src/game/modelCalibration.test.ts
 *
 * §九 单测：7 个场景（vitest）。
 */
import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import {
  measureObjectAabb,
  computeBottomCenterOffset,
  computeScaledAabb,
  compareAabb,
  type Vec3,
} from './modelCalibration'

describe('modelCalibration (§九)', () => {
  // 构造一个 simple box: min=(0,0,-0.41), max=(0.98, 0.46, 0) → 模仿 loungeSofa
  function makeBoxMesh(min: THREE.Vector3, max: THREE.Vector3) {
    const size = new THREE.Vector3().subVectors(max, min)
    const geom = new THREE.BoxGeometry(size.x, size.y, size.z)
    const mesh = new THREE.Mesh(geom)
    // 把 box 平移到指定区间 (因为 BoxGeometry 默认中心 0,0,0)
    mesh.position.set(
      (min.x + max.x) / 2,
      (min.y + max.y) / 2,
      (min.z + max.z) / 2,
    )
    return mesh
  }

  it('measureObjectAabb → sofa-like box 精确', () => {
    const g = new THREE.Group()
    g.add(makeBoxMesh(new THREE.Vector3(0, 0, -0.41), new THREE.Vector3(0.98, 0.46, 0)))
    const aabb = measureObjectAabb(g)
    expect(aabb.size.x).toBeCloseTo(0.98, 6)
    expect(aabb.size.y).toBeCloseTo(0.46, 6)
    expect(aabb.size.z).toBeCloseTo(0.41, 6)
    expect(aabb.min.x).toBeCloseTo(0, 6)
    expect(aabb.min.y).toBeCloseTo(0, 6)
    expect(aabb.max.x).toBeCloseTo(0.98, 6)
  })

  it('empty Object3D 应 throw 明确错误', () => {
    const g = new THREE.Group()
    expect(() => measureObjectAabb(g)).toThrow(/empty|No meshes/i)
  })

  it('computeBottomCenterOffset: bottom-center offset for sofa', () => {
    const box = new THREE.Box3(
      new THREE.Vector3(0, 0, -0.41),
      new THREE.Vector3(0.98, 0.46, 0),
    )
    const off = computeBottomCenterOffset(box)
    // center x = 0.49, pivot x = -0.49
    expect(off.x).toBeCloseTo(-0.49, 6)
    // floor aligned
    expect(off.y).toBeCloseTo(0, 6)
    // center z = -0.205, pivot z = 0.205
    expect(off.z).toBeCloseTo(0.205, 6)
  })

  it('computeBottomCenterOffset: negative source coordinates 仍可正确', () => {
    // 有模型 min=(-1,-2,-3), max=(3,2,1)
    const box = new THREE.Box3(
      new THREE.Vector3(-1, -2, -3),
      new THREE.Vector3(3, 2, 1),
    )
    const off = computeBottomCenterOffset(box)
    // cx=1 (从 (-1+3)/2), pX = -1
    expect(off.x).toBeCloseTo(-1, 6)
    // minY = -2, py=2  (抬 2 单位 → floor 对齐)
    expect(off.y).toBeCloseTo(2, 6)
    // cz = (-3+1)/2 = -1, pZ = 1
    expect(off.z).toBeCloseTo(1, 6)
  })

  it('computeScaledAabb: uniform scale 2.0', () => {
    const s = computeScaledAabb({ x: 0.98, y: 0.46, z: 0.41 }, 2)
    expect(s.x).toBeCloseTo(1.96, 6)
    expect(s.y).toBeCloseTo(0.92, 6)
    expect(s.z).toBeCloseTo(0.82, 6)
  })

  it('不允许 NaN: scale<=0 / 非法 raw 输出 NaN', () => {
    const a = computeScaledAabb({ x: 1, y: 1, z: 1 }, 0)
    expect(Number.isNaN(a.x)).toBe(true)
    const b = computeScaledAabb({ x: -1, y: 1, z: 1 }, 2)
    expect(Number.isNaN(b.x)).toBe(true)
  })

  it('compareAabb: PASS / WARN / FAIL 三档', () => {
    const exp: Vec3 = { x: 1, y: 1, z: 1 }
    // PASS
    expect(compareAabb({ x: 1.005, y: 1, z: 1 }, exp).verdict).toBe('PASS')
    // WARN (y = 0.02 > 0.01 但 ≤0.03)
    expect(compareAabb({ x: 1, y: 1.02, z: 1 }, exp).verdict).toBe('WARN')
    // FAIL (z = 0.04 > 0.03)
    expect(compareAabb({ x: 1, y: 1, z: 1.04 }, exp).verdict).toBe('FAIL')
    // perAxis 维度信息
    const res = compareAabb({ x: 1, y: 1.02, z: 1.04 }, exp)
    expect(res.perAxis.find((r) => r.axis === 'y')?.verdict).toBe('WARN')
    expect(res.perAxis.find((r) => r.axis === 'z')?.verdict).toBe('FAIL')
    expect(res.maxAbsDelta).toBeCloseTo(0.04, 6)
  })
})
