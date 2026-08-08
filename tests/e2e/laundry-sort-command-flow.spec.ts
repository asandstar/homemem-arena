import { test, expect, type Page } from '@playwright/test'
import {
  advanceStageTransitions,
  callCommand,
  callNearbyEntityCommand,
  createErrorCollector,
  expectNoErrors,
  navigateToTaskAndStart,
  placeIntoContainerStable,
  readState,
  teleportToContainer,
} from './helpers'

const EXPECTED_GOALS = [
  'g-encode-cereal-memory',
  'g-set-breakfast-table',
  'g-detect-stale-memory',
  'g-update-cereal-memory',
  'g-serve-cereal',
] as const

async function setupLevel(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.setItem(
      'homemem-level-progress',
      JSON.stringify({
        'task-clean-table': { taskId: 'task-clean-table', unlocked: true, completed: true },
        'task-leave-home': { taskId: 'task-leave-home', unlocked: true, completed: true },
        'task-laundry-sort': { taskId: 'task-laundry-sort', unlocked: true, completed: false },
      }),
    )
  })
  await navigateToTaskAndStart(page, 'task-laundry-sort')
  await expect.poll(() => readState<string>(page, 'getPhase')).toBe('playing')
}

async function pickAndPlace(page: Page, objectId: string, containerId: string): Promise<void> {
  void (await callCommand(page, 'releaseHeldEntity'))
  const pick = await callNearbyEntityCommand(page, 'pickByConfigId', objectId, 'dining')
  expect(pick.success, `${objectId} 无法拾取：${pick.reason ?? '未知原因'}`).toBe(true)
  const place = await placeIntoContainerStable(page, containerId)
  expect(place.success, `${objectId} 无法放入 ${containerId}：${place.reason ?? '未知原因'}`).toBe(true)
  await advanceStageTransitions(page, 2)
}

test.describe('L3 过期早餐记忆 · Command-backed 流程验证', () => {
  test('旧位置编码 → 注意分散 → 冲突 → 更新记忆 → 麦片上桌，严格完成第三关', async ({ page }) => {
    test.setTimeout(60_000)
    const errors = createErrorCollector(page)
    await setupLevel(page)

    await teleportToContainer(page, 'cnt-cabinet-lower')

    const encode = await callNearbyEntityCommand(page, 'saveMemoryByConfigId', 'obj-cereal', 'dining')
    expect(encode.success, encode.reason).toBe(true)
    await advanceStageTransitions(page, 1)
    await expect(page.getByTestId('goal-completion-banner')).toContainText('按 E 记住麦片在备餐台的位置')

    await pickAndPlace(page, 'obj-breakfast-bowl', 'cnt-breakfast-table')
    await pickAndPlace(page, 'obj-breakfast-cup', 'cnt-breakfast-table')

    await expect.poll(() => readState<string>(page, 'getCurrentStageId')).toBe('stage-stale-memory')
    await advanceStageTransitions(page, 10)
    await expect.poll(async () => {
      const entities = await readState<Array<{ configId: string; placedIn?: string; status: string }>>(page, 'getEntities')
      return entities.find((entity) => entity.configId === 'obj-cereal')
    }).toMatchObject({ placedIn: 'cnt-cabinet-upper', status: 'placed' })

    await teleportToContainer(page, 'cnt-cabinet-lower')
    await advanceStageTransitions(page, 2)
    await expect.poll(() => readState<string>(page, 'getCurrentStageId')).toBe('stage-update-memory')
    expect(await readState<string[]>(page, 'getTriggeredEvents')).toContain('se-conflict-detected')

    await teleportToContainer(page, 'cnt-cabinet-upper')
    const update = await callNearbyEntityCommand(page, 'saveMemoryByConfigId', 'obj-cereal', 'dining')
    expect(update.success, update.reason).toBe(true)
    await advanceStageTransitions(page, 2)
    expect((await readState<{ memoryUpdateCount: number }>(page, 'getMemoryStats')).memoryUpdateCount).toBeGreaterThanOrEqual(1)

    await pickAndPlace(page, 'obj-cereal', 'cnt-breakfast-table')

    await expect.poll(() => readState<boolean>(page, 'getLevelCompleted')).toBe(true)
    expect(await readState<string[]>(page, 'getAchievedGoalIds')).toEqual(expect.arrayContaining(EXPECTED_GOALS))
    expectNoErrors(errors)
  })

  test('不形成麦片旧位置记忆时，任务不能跳过编码阶段', async ({ page }) => {
    await setupLevel(page)
    expect((await readState<{ memoryUpdateCount: number }>(page, 'getMemoryStats')).memoryUpdateCount).toBe(0)
    expect(await readState<boolean>(page, 'getLevelCompleted')).toBe(false)
    expect(await readState<string>(page, 'getCurrentStageId')).toBe('stage-encode-cereal')
  })
})
