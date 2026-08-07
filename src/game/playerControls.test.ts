import { describe, expect, it } from 'vitest'
import {
  applyHorizontalLookDelta,
  gameYawToCameraYaw,
  getForwardVector,
  getMinimapForwardVector,
} from './playerControls'
import { isInFieldOfView } from '../utils/format'

describe('playerControls yaw 坐标约定', () => {
  const cases = [
    { name: '北', yaw: 0, world: { x: 0, z: -1 }, map: { x: 0, y: -1 } },
    { name: '东', yaw: Math.PI / 2, world: { x: 1, z: 0 }, map: { x: 1, y: 0 } },
    { name: '南', yaw: Math.PI, world: { x: 0, z: 1 }, map: { x: 0, y: 1 } },
    { name: '西', yaw: -Math.PI / 2, world: { x: -1, z: 0 }, map: { x: -1, y: 0 } },
  ] as const

  it.each(cases)('$name：相机、前进和小地图箭头方向一致', ({ yaw, world, map }) => {
    const forward = getForwardVector(yaw)
    const minimap = getMinimapForwardVector(yaw)
    const cameraYaw = gameYawToCameraYaw(yaw)

    // Three.js 相机默认朝 -Z；rotation.y 后的水平前向为 (-sin(y), -cos(y))。
    const cameraForward = {
      x: -Math.sin(cameraYaw),
      z: -Math.cos(cameraYaw),
    }

    expect(forward.x).toBeCloseTo(world.x)
    expect(forward.z).toBeCloseTo(world.z)
    expect(cameraForward.x).toBeCloseTo(world.x)
    expect(cameraForward.z).toBeCloseTo(world.z)
    expect(minimap.x).toBeCloseTo(map.x)
    expect(minimap.y).toBeCloseTo(map.y)
  })

  it('视野判定沿用同一套“0 朝北、正值朝东”约定', () => {
    const observer = { x: 0, y: 0, z: 0 }
    expect(isInFieldOfView(observer, 0, { x: 0, y: 0, z: -2 })).toBe(true)
    expect(isInFieldOfView(observer, 0, { x: 0, y: 0, z: 2 })).toBe(false)
    expect(isInFieldOfView(observer, Math.PI / 2, { x: 2, y: 0, z: 0 })).toBe(true)
  })

  it('鼠标向右移动时，相机与小地图共同向东侧转动', () => {
    const yaw = applyHorizontalLookDelta(0, 100, 0.001)
    const cameraYaw = gameYawToCameraYaw(yaw)
    const cameraForwardX = -Math.sin(cameraYaw)
    const minimapForwardX = getMinimapForwardVector(yaw).x

    expect(yaw).toBeGreaterThan(0)
    expect(cameraForwardX).toBeGreaterThan(0)
    expect(minimapForwardX).toBeGreaterThan(0)
  })
})
