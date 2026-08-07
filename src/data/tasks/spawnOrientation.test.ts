import { describe, expect, it } from 'vitest'
import { getForwardVector } from '../../game/playerControls'
import { cleanTableTask } from './clean-table'
import { leaveHomeTask } from './leave-home'
import { laundrySortTask } from './laundry-sort'

describe('公开关卡起始视角', () => {
  const cases = [
    { task: cleanTableTask, focus: { x: 0, z: 0 } },
    { task: leaveHomeTask, focus: { x: -1.5, z: -0.5 } },
    { task: laundrySortTask, focus: { x: 0, z: -1.3 } },
  ] as const

  it.each(cases)('$task.name 开局朝向当前任务区域', ({ task, focus }) => {
    const spawn = task.spawnPosition!
    const forward = getForwardVector(task.spawnRotation ?? 0)
    const toFocus = { x: focus.x - spawn.x, z: focus.z - spawn.z }
    const length = Math.hypot(toFocus.x, toFocus.z)
    const dot = forward.x * (toFocus.x / length) + forward.z * (toFocus.z / length)

    expect(dot).toBeGreaterThan(0.5)
  })
})
