import { test, expect, type Page } from '@playwright/test'
import {
  advanceStageTransitions,
  callCommand,
  callNearbyEntityCommand,
  createErrorCollector,
  expectNoErrors,
  getTestApi,
  placeIntoContainerStable,
  readState,
  teleportToContainer,
} from './helpers'

type ItemGoal = {
  id: string
  room: string
  containerId: string
}

const LEVELS: ReadonlyArray<{
  taskId: string
  items: ReadonlyArray<ItemGoal>
}> = [
  {
    taskId: 'task-clean-table',
    items: [
      { id: 'obj-mug-1', room: 'dining', containerId: 'cnt-sink' },
      { id: 'obj-plate-1', room: 'dining', containerId: 'cnt-cabinet' },
      { id: 'obj-fork-1', room: 'dining', containerId: 'cnt-cabinet' },
    ],
  },
  {
    taskId: 'task-leave-home',
    items: [
      { id: 'obj-books', room: 'living', containerId: 'cnt-coffee-table' },
      { id: 'obj-mug', room: 'bedroom', containerId: 'cnt-coffee-table' },
      { id: 'obj-radio', room: 'entrance', containerId: 'cnt-coffee-table' },
    ],
  },
  {
    taskId: 'task-laundry-sort',
    items: [],
  },
]

async function startTask(page: Page, taskId: string): Promise<void> {
  await page.waitForURL(`**/play/${taskId}`)
  await page.getByTestId('briefing-modal').waitFor({ state: 'visible' })
  await page.getByTestId('briefing-start-button').click()
  await page.getByTestId('arena-hud').waitFor({ state: 'visible' })

  const tutorialButton = page.getByRole('button', { name: /^开始挑战/ })
  if (await tutorialButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await tutorialButton.click()
  }

  const dialog = page.locator('[data-dialog-root]')
  if (await dialog.isVisible({ timeout: 3000 }).catch(() => false)) {
    await dialog.locator('button').first().click({ force: true })
    await dialog.waitFor({ state: 'hidden' })
  }

  await getTestApi(page)
  await expect.poll(() => readState<string>(page, 'getPhase')).toBe('playing')
}

async function pickAndPlace(page: Page, item: ItemGoal): Promise<void> {
  void (await callCommand(page, 'releaseHeldEntity'))

  const currentRoom = await readState<string>(page, 'getCurrentRoom')
  if (currentRoom !== item.room) {
    const moved = await callCommand(page, 'transitionToRoom', item.room)
    expect(moved.success, `无法进入 ${item.room}：${moved.reason ?? '未知原因'}`).toBe(true)
  }

  const picked = await callNearbyEntityCommand(page, 'pickByConfigId', item.id, item.room)
  expect(picked.success, `${item.id} 无法拾取：${picked.reason ?? '未知原因'}`).toBe(true)

  const placed = await placeIntoContainerStable(page, item.containerId)
  expect(placed.success, `${item.id} 无法放入 ${item.containerId}：${placed.reason ?? '未知原因'}`).toBe(true)
  await advanceStageTransitions(page, 2)
}

async function assertLevelCompleted(page: Page, level: (typeof LEVELS)[number]): Promise<void> {
  await advanceStageTransitions(page, 4)

  const entities = await readState<
    Array<{ configId: string; status: string; placedIn?: string }>
  >(page, 'getEntities')
  for (const item of level.items) {
    const entity = entities.find((candidate) => candidate.configId === item.id)
    expect(entity?.status, `${item.id} 应处于 placed 状态`).toBe('placed')
    expect(entity?.placedIn, `${item.id} 应位于 ${item.containerId}`).toBe(item.containerId)
  }

  await expect.poll(() => readState<boolean>(page, 'getLevelCompleted')).toBe(true)
}

async function completeThirdLevel(page: Page): Promise<void> {
  await teleportToContainer(page, 'cnt-cabinet-lower')
  expect((await callCommand(page, 'toggleContainer', 'cnt-cabinet-lower')).success).toBe(true)
  expect((await callNearbyEntityCommand(page, 'saveMemoryByConfigId', 'obj-cereal', 'dining')).success).toBe(true)
  await advanceStageTransitions(page, 2)

  for (const item of [
    { id: 'obj-breakfast-bowl', room: 'dining', containerId: 'cnt-breakfast-table' },
    { id: 'obj-breakfast-cup', room: 'dining', containerId: 'cnt-breakfast-table' },
    { id: 'obj-breakfast-spoon', room: 'dining', containerId: 'cnt-breakfast-table' },
  ]) {
    await pickAndPlace(page, item)
  }

  await expect.poll(() => readState<string>(page, 'getCurrentStageId')).toBe('stage-stale-memory')
  await advanceStageTransitions(page, 10)
  await teleportToContainer(page, 'cnt-cabinet-lower')
  await advanceStageTransitions(page, 2)
  await expect.poll(() => readState<string>(page, 'getCurrentStageId')).toBe('stage-update-memory')

  await teleportToContainer(page, 'cnt-cabinet-upper')
  expect((await callCommand(page, 'toggleContainer', 'cnt-cabinet-upper')).success).toBe(true)
  expect((await callNearbyEntityCommand(page, 'saveMemoryByConfigId', 'obj-cereal', 'dining')).success).toBe(true)
  await advanceStageTransitions(page, 2)

  for (const item of [
    { id: 'obj-cereal', room: 'dining', containerId: 'cnt-breakfast-table' },
    { id: 'obj-breakfast-bowl', room: 'dining', containerId: 'cnt-breakfast-sink' },
    { id: 'obj-breakfast-cup', room: 'dining', containerId: 'cnt-breakfast-sink' },
  ]) {
    await pickAndPlace(page, item)
  }
}

async function openStrictResult(page: Page, taskId: string): Promise<void> {
  const resultButton = page.getByRole('button', { name: '查看分析结果' })
  await expect(resultButton).toBeVisible({ timeout: 12_000 })

  const dialog = page.locator('[data-dialog-root]')
  if (await dialog.isVisible({ timeout: 1000 }).catch(() => false)) {
    await dialog.locator('button').first().click({ force: true })
    await dialog.waitFor({ state: 'hidden' })
  }

  await resultButton.click()
  await page.waitForURL(`**/result/${taskId}`, { timeout: 12_000 })
  await expect(page.getByTestId('replay-button')).toBeVisible()
}

test('当前公开版可以从第一关连续完成到第三关最终结算', async ({ page }) => {
  test.setTimeout(120_000)
  const errors = createErrorCollector(page)
  await page.setViewportSize({ width: 1280, height: 720 })

  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByTestId('home-primary-cta').click()
  await page.waitForURL('**/tasks')
  await page.getByTestId('task-start-task-clean-table').click()

  for (let index = 0; index < LEVELS.length; index += 1) {
    const level = LEVELS[index]
    await startTask(page, level.taskId)

    if (level.taskId === 'task-clean-table') {
      const memory = await callNearbyEntityCommand(page, 'saveMemoryByConfigId', 'obj-mug-1', 'dining')
      expect(memory.success, `第一关无法保存教学记忆：${memory.reason ?? '未知原因'}`).toBe(true)
      await advanceStageTransitions(page, 1)
    }

    if (level.taskId === 'task-leave-home') {
      for (const item of level.items) {
        const currentRoom = await readState<string>(page, 'getCurrentRoom')
        if (currentRoom !== item.room) {
          const moved = await callCommand(page, 'transitionToRoom', item.room)
          expect(moved.success, `无法进入 ${item.room} 保存记忆`).toBe(true)
        }
        const memory = await callNearbyEntityCommand(page, 'saveMemoryByConfigId', item.id, item.room)
        expect(memory.success, `第二关无法保存 ${item.id} 的位置记忆：${memory.reason ?? '未知原因'}`).toBe(true)
      }
      await advanceStageTransitions(page, 2)
      await expect.poll(() => readState<string>(page, 'getCurrentStageId')).toBe('stage-recall-stable-map')
    }

    if (level.taskId === 'task-laundry-sort') {
      await completeThirdLevel(page)
    } else {
      for (const [itemIndex, item] of level.items.entries()) {
        await pickAndPlace(page, item)
        if (level.taskId === 'task-clean-table' && itemIndex === 0) {
          await expect(page.getByTestId('goal-completion-banner')).toContainText('马克杯放入水槽')
        }
      }
    }

    await assertLevelCompleted(page, level)
    await openStrictResult(page, level.taskId)

    const isLastLevel = index === LEVELS.length - 1
    if (isLastLevel) {
      await expect(page.getByText('已完成当前版本的全部挑战')).toBeVisible()
    } else {
      await page.getByTestId('next-level-button').click()
    }
  }

  expectNoErrors(errors)
})
