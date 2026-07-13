import { test, expect } from '@playwright/test'
import {
  createErrorCollector,
  expectNoErrors,
  navigateToFirstLevelAndStart,
  closeStartDialog,
  waitForAudioActive,
  waitForAudioStopped,
} from './helpers'

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
  test('返回任务列表后音频停止', async ({ page }) => {
    const errors = createErrorCollector(page)

    await navigateToFirstLevelAndStart(page)
    await page.waitForTimeout(2000)

    const audioStarted = await waitForAudioActive(page, 8000)
    expect(audioStarted).toBe(true)

    await callCommand(page, 'saveMemoryByConfigId', 'obj-key')
    await callCommand(page, 'transitionToRoom', 'bedroom')

    await closeStartDialog(page)

    await page.getByTestId('back-to-tasks').click()
    await page.waitForURL('**/tasks')
    await page.waitForTimeout(1000)

    const audioStopped = await waitForAudioStopped(page, 5000)
    expect(audioStopped).toBe(true)

    expectNoErrors(errors)
  })

  test('浏览器后退时音频停止', async ({ page }) => {
    const errors = createErrorCollector(page)

    await navigateToFirstLevelAndStart(page)
    await page.waitForTimeout(2000)

    const audioStarted = await waitForAudioActive(page, 8000)
    expect(audioStarted).toBe(true)

    await page.goBack()
    await page.waitForURL('**/tasks')

    const audioStopped = await waitForAudioStopped(page, 5000)
    expect(audioStopped).toBe(true)

    expectNoErrors(errors)
  })

  test('无效 taskId 跳回任务列表', async ({ page }) => {
    const errors = createErrorCollector(page)

    await page.goto('/play/invalid-task-id')
    await page.waitForURL('**/tasks', { timeout: 5_000 })

    expectNoErrors(errors)
  })

  test('结果页刷新时不会永久停留在加载状态', async ({ page }) => {
    const errors = createErrorCollector(page)

    await page.goto('/result/task-leave-home')
    await page.waitForURL('**/tasks', { timeout: 5_000 })

    expectNoErrors(errors)
  })
})
