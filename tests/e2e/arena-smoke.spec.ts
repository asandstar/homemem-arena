import { test, expect } from '@playwright/test'
import { createErrorCollector, expectNoErrors, readState, saveScreenshot } from './helpers'

/**
 * 真实浏览器 Smoke Test
 *
 * @real-browser
 * - 包含真实键盘输入验证（WASD / V），依赖完整 WebGL 渲染栈和鼠标/键盘焦点
 * - headless 环境下即使使用 --use-angle=metal 也存在 Context Lost → camera.getWorldDirection()=0 → position not updated 的已知限制
 * - 仅在 `real-browser` 项目（headed）下执行，用于发布前人工/本地验证
 * - 不删除测试，不把 headless 失败写成通过；headless CI 不纳入此测试门禁
 */
test.describe('Arena 真实浏览器 Smoke @real-browser', () => {
  test('首页加载、导航、键盘输入、面板切换，全程无 console error', async ({ page }) => {
    const errors = createErrorCollector(page)

    // 1. 首页正常加载
    await page.goto('/')
    await expect(page).toHaveTitle(/HomeMem Arena|记忆/i)

    // 截图：首页
    await saveScreenshot(page, 'home')

    // 2. 点击首页主入口进入任务选择
    await page.getByTestId('home-primary-cta').click()
    await page.waitForURL('**/tasks')

    // 截图：任务选择
    await saveScreenshot(page, 'task-select')

    // 3. 点击第一关卡片进入
    await page.getByTestId('task-start-task-clean-table').click()
    await page.waitForURL('**/play/task-clean-table')

    // 5. Briefing 可见
    await expect(page.getByTestId('briefing-modal')).toBeVisible()

    // 截图：briefing
    await saveScreenshot(page, 'level-1-briefing')

    // 6. Briefing 期间：phase 为 briefing，elapsedMs 不增长，chaosValue 不增长
    const phaseBefore = await readState<string>(page, 'getPhase')
    expect(phaseBefore).toBe('briefing')
    const elapsedBefore = await readState<number>(page, 'getElapsedMs')
    const chaosBefore = await readState<number>(page, 'getChaosValue')
    // 等待 500ms 确认不增长
    await page.waitForTimeout(500)
    const elapsedAfter = await readState<number>(page, 'getElapsedMs')
    const chaosAfter = await readState<number>(page, 'getChaosValue')
    expect(elapsedAfter).toBe(elapsedBefore)
    expect(chaosAfter).toBe(chaosBefore)

    // 7. 点击开始任务
    await page.getByTestId('briefing-start-button').click()

    // 8. HUD、记忆槽、混乱值、小地图、任务面板可见
    await expect(page.getByTestId('arena-hud')).toBeVisible()
    await expect(page.getByTestId('memory-slots')).toBeVisible()
    await expect(page.getByTestId('chaos-meter')).toBeVisible()
    await expect(page.getByTestId('minimap')).toBeVisible()
    await expect(page.getByTestId('task-panel')).toBeVisible()

    // 验证 phase 为 playing
    const phasePlaying = await readState<string>(page, 'getPhase')
    expect(phasePlaying).toBe('playing')

    // 截图：HUD 1280x720
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.waitForTimeout(300)
    await saveScreenshot(page, 'level-1-hud-1280x720')

    // 截图：HUD 1440x900
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.waitForTimeout(300)
    await saveScreenshot(page, 'level-1-hud-1440x900')

    // 关闭开场对话框（DialogBox 的 backdrop 覆盖全屏）
    const dialogBackdrop = page.locator('div.fixed.inset-0.z-50 div.absolute.inset-0.bg-black\\/40')
    await dialogBackdrop.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})
    if (await dialogBackdrop.isVisible()) {
      const closeButton = page.locator('div.fixed.inset-0.z-50 button svg').first()
      await closeButton.click({ force: true })
      await dialogBackdrop.waitFor({ state: 'hidden', timeout: 5000 })
      await page.waitForTimeout(500)
    }

    // 确保 phase 是 playing
    const phaseBeforeMove = await readState<string>(page, 'getPhase')
    expect(phaseBeforeMove).toBe('playing')

    // 9. 确保页面有焦点，然后按键
    await page.bringToFront()

    // 聚焦到 canvas
    const canvas = page.locator('#arena-canvas')
    await canvas.waitFor()
    await canvas.focus()
    await page.waitForTimeout(500)

    // 记录按 W 前的位置
    const posBefore = await readState<{ x: number; y: number; z: number }>(page, 'getRobotPosition')

    // 按住 W 键足够长时间让 useFrame 多次更新位置
    await page.keyboard.down('w')
    await page.waitForTimeout(2000)
    await page.keyboard.up('w')
    await page.waitForTimeout(500)

    // 10. 通过只读 Test API 验证 robotPosition 发生变化
    const posAfter = await readState<{ x: number; y: number; z: number }>(page, 'getRobotPosition')

    const moved = Math.abs(posAfter.x - posBefore.x) + Math.abs(posAfter.z - posBefore.z)
    expect(moved).toBeGreaterThan(0.01)

    // 11. 按 V
    const viewBefore = await readState<string>(page, 'getViewMode')
    await page.keyboard.press('KeyV')
    await page.waitForTimeout(300)

    // 12. 验证 viewMode 发生变化
    const viewAfter = await readState<string>(page, 'getViewMode')
    expect(viewAfter).not.toBe(viewBefore)

    // 13. 按 Tab、R、H，验证无报错
    await page.keyboard.press('Tab')
    await page.waitForTimeout(200)
    await page.keyboard.press('KeyR')
    await page.waitForTimeout(200)
    await page.keyboard.press('KeyH')
    await page.waitForTimeout(200)
    // 按 Escape 恢复 HUD（KeyH 会隐藏 HUD）
    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)

    // 14. 返回任务选择页
    await page.getByTestId('back-to-tasks').click()
    await page.waitForURL('**/tasks')

    // 15. 最终断言：无 pageerror、无 console.error、无失败请求
    expectNoErrors(errors)
  })
})
