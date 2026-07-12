import { test, expect } from '@playwright/test'
import {
  createErrorCollector,
  expectNoErrors,
  readState,
  closeStartDialog,
  waitForAudioActive,
  waitForAudioStopped,
} from './helpers'

/**
 * 导航与音频生命周期 E2E 测试
 *
 * 验证：
 * - 离开 ArenaPage 后 BGM 和环境音停止
 * - 浏览器后退时音频停止
 * - 重新进入关卡后状态重新初始化
 * - 无效 taskId 跳回任务列表
 * - 状态重置验证
 *
 * 注意：当前没有共享 AudioContext，不测试 isAudioSuspended。
 * 本轮验证的是可听音源和定时器停止。
 */

async function callCommand(
  page: import('@playwright/test').Page,
  method: string,
  ...args: unknown[]
): Promise<{ success: boolean; reason?: string }> {
  return page.evaluate(
    ({ method, args }) => {
      if (!window.__testApi__) throw new Error('testApi not available')
      const api = window.__testApi__ as unknown as Record<string, (...a: unknown[]) => unknown>
      return api[method](...args) as { success: boolean; reason?: string }
    },
    { method, args },
  )
}

test.describe('导航与音频生命周期', () => {
  test('返回任务列表后音频停止，重新进入后状态初始化', async ({ page }) => {
    const errors = createErrorCollector(page)

    // 进入第一关并开始游戏
    await page.goto('/')
    await page.getByTestId('home-primary-cta').click()
    await page.waitForURL('**/tasks')
    await page.getByTestId('task-card-task-leave-home').click()
    await page.waitForURL('**/play/task-leave-home')
    await page.getByTestId('briefing-start-button').click()
    await expect(page.getByTestId('arena-hud')).toBeVisible()

    // 2. 验证 BGM 或环境音进入活动状态（轮询等待，处理时序）
    const audioStarted = await waitForAudioActive(page, 5000)
    expect(audioStarted).toBe(true)

    // 产生一些游戏状态
    await callCommand(page, 'saveMemoryByConfigId', 'obj-key')
    await callCommand(page, 'transitionToRoom', 'bedroom')
    const stepBefore = await readState<number>(page, 'getStepCount')
    expect(stepBefore).toBeGreaterThan(0)

    // 关闭开场对话框（会拦截 back-to-tasks 点击）
    await closeStartDialog(page)

    // 3. 点击返回任务列表
    await page.getByTestId('back-to-tasks').click()
    await page.waitForURL('**/tasks')

    // 4. 验证音频停止（轮询等待 cleanup 完成）
    const audioStopped = await waitForAudioStopped(page, 5000)
    expect(audioStopped).toBe(true)

    // 6. 再次进入第一关，确保音频可重新启动
    await page.getByTestId('task-card-task-leave-home').click()
    await page.waitForURL('**/play/task-leave-home')
    await page.getByTestId('briefing-start-button').click()
    await expect(page.getByTestId('arena-hud')).toBeVisible()

    const audioRestarted = await waitForAudioActive(page, 5000)
    expect(audioRestarted).toBe(true)

    // 10. 游戏中产生若干状态后返回，再进入第一关
    await callCommand(page, 'saveMemoryByConfigId', 'obj-key')
    await callCommand(page, 'transitionToRoom', 'bedroom')

    // 关闭可能再次出现的对话框
    await closeStartDialog(page)

    // 返回任务列表
    await page.getByTestId('back-to-tasks').click()
    await page.waitForURL('**/tasks')
    await waitForAudioStopped(page, 5000)

    // 再进入第一关
    await page.getByTestId('task-card-task-leave-home').click()
    await page.waitForURL('**/play/task-leave-home')
    await expect(page.getByTestId('briefing-modal')).toBeVisible()

    // 在 briefing 阶段验证状态已初始化（tickElapsed 在非 playing 阶段不执行）
    const stepCountBefore = await readState<number>(page, 'getStepCount')
    expect(stepCountBefore).toBe(0)
    const chaosValueBefore = await readState<number>(page, 'getChaosValue')
    expect(chaosValueBefore).toBe(0)
    const memorySlotsBefore = await readState<unknown[]>(page, 'getMemorySlots')
    const allNullBefore = memorySlotsBefore.every((s) => s === null)
    expect(allNullBefore).toBe(true)

    await page.getByTestId('briefing-start-button').click()
    await expect(page.getByTestId('arena-hud')).toBeVisible()

    // 验证没有实体处于 held 状态（heldEntityId 为空）
    const entities = await readState<
      Array<{ status: string }>
    >(page, 'getEntities')
    const hasHeldEntity = entities.some((e) => e.status === 'held')
    expect(hasHeldEntity).toBe(false)

    expectNoErrors(errors)
  })

  test('浏览器后退时音频停止', async ({ page }) => {
    const errors = createErrorCollector(page)

    // 进入第一关并开始游戏
    await page.goto('/')
    await page.getByTestId('home-primary-cta').click()
    await page.waitForURL('**/tasks')
    await page.getByTestId('task-card-task-leave-home').click()
    await page.waitForURL('**/play/task-leave-home')
    await page.getByTestId('briefing-start-button').click()
    await expect(page.getByTestId('arena-hud')).toBeVisible()

    // 验证 BGM 或环境音在播放（轮询等待）
    const audioStarted = await waitForAudioActive(page, 5000)
    expect(audioStarted).toBe(true)

    // 7. 浏览器 goBack
    await page.goBack()
    await page.waitForURL('**/tasks')

    // 8. 验证全部持续音源停止（轮询等待）
    const audioStopped = await waitForAudioStopped(page, 5000)
    expect(audioStopped).toBe(true)

    expectNoErrors(errors)
  })

  test('无效 taskId 跳回任务列表', async ({ page }) => {
    const errors = createErrorCollector(page)

    // 访问无效 taskId
    await page.goto('/play/invalid-task-id')

    // 应跳回 /tasks
    await page.waitForURL('**/tasks', { timeout: 5_000 })

    expectNoErrors(errors)
  })

  test('结果页刷新时不会永久停留在加载状态', async ({ page }) => {
    const errors = createErrorCollector(page)

    // 直接访问结果页（无 session）
    await page.goto('/result/task-leave-home')

    // 应跳回 /tasks（无 session 时）
    await page.waitForURL('**/tasks', { timeout: 5_000 })

    expectNoErrors(errors)
  })
})
