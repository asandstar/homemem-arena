import { test, expect } from '@playwright/test'
import { createErrorCollector, expectNoErrors, readState, saveScreenshot } from './helpers'

/**
 * Command-backed 第一关流程集成测试
 *
 * 验证：command → store → scripted event → memory invalidation → goal completion → Probe → Result
 *
 * 注意：这是 Command-backed 浏览器集成测试。
 * 它验证 command→store→UI 流程。
 * 它不等于真实空间寻路、门洞和碰撞 E2E。
 * 真实空间交互由人工 Golden Path 清单覆盖。
 */

// 通过 test API 调用 command-backed 方法
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

test.describe('第一关 Command-backed 流程', () => {
  test('完整通关：保存记忆 → 猫事件 → 拾取 → 放置 → Probe → Result → 重玩', async ({ page }) => {
    const errors = createErrorCollector(page)

    // 1. 从首页进入第一关
    await page.goto('/')
    await page.getByTestId('home-primary-cta').click()
    await page.waitForURL('**/tasks')
    await page.getByTestId('task-card-task-leave-home').click()
    await page.waitForURL('**/play/task-leave-home')
    await expect(page.getByTestId('briefing-modal')).toBeVisible()

    // 2. 点击开始任务
    await page.getByTestId('briefing-start-button').click()
    await expect(page.getByTestId('arena-hud')).toBeVisible()

    // 验证 phase 为 playing
    const phase = await readState<string>(page, 'getPhase')
    expect(phase).toBe('playing')

    // 3. 通过 saveMemoryByConfigId 保存钥匙记忆
    const saveResult = await callCommand(page, 'saveMemoryByConfigId', 'obj-key')
    expect(saveResult.success).toBe(true)

    // 4. 验证记忆槽中存在钥匙记录
    const slots = await readState<unknown[]>(page, 'getMemorySlots')
    expect(slots.length).toBeGreaterThan(0)
    const hasKeyMemory = slots.some((s) => {
      const slot = s as { entityConfigId?: string } | null
      return slot !== null && slot.entityConfigId === 'obj-key'
    })
    expect(hasKeyMemory).toBe(true)

    // 5. 执行足够的合法交互使钥匙猫事件自然触发
    // 猫事件触发条件：step > 4 && key is free in living
    // 当前 step=1（saveMemory），需要 4 更多步骤
    // 步骤 2: 切换到卧室
    await callCommand(page, 'transitionToRoom', 'bedroom')
    // 步骤 3: 打开床头柜抽屉
    await callCommand(page, 'toggleContainer', 'cnt-bedside-drawer')
    // 步骤 4: 拾取手机
    await callCommand(page, 'pickByConfigId', 'obj-phone')
    // 步骤 5: 切换到玄关（此时 step=5 > 4，猫事件应触发）

    // 在切换到玄关前，先验证钥匙仍在客厅且 free
    const entitiesBeforeCat = await readState<
      Array<{ configId: string; currentRoom: string; status: string; position?: { x: number; z: number } }>
    >(page, 'getEntities')
    const keyBeforeCat = entitiesBeforeCat.find((e) => e.configId === 'obj-key')
    expect(keyBeforeCat?.currentRoom).toBe('living')
    expect(keyBeforeCat?.status).toBe('free')

    // 执行第 5 步：切换到玄关
    await callCommand(page, 'transitionToRoom', 'entrance')

    // 7. 验证钥匙位置发生变化（猫事件触发）
    const entitiesAfterCat = await readState<
      Array<{ configId: string; currentRoom: string; status: string; position?: { x: number; z: number } }>
    >(page, 'getEntities')
    const keyAfterCat = entitiesAfterCat.find((e) => e.configId === 'obj-key')
    // 钥匙应该被猫移动了（位置变化）
    expect(keyAfterCat).toBeDefined()
    // 钥匙应该仍在客厅（第一次猫事件只移动到客厅角落）
    expect(keyAfterCat?.currentRoom).toBe('living')

    // 验证对应记忆变为 outdated
    const slotsAfterCat = await readState<
      Array<{ entityConfigId?: string; outdated?: boolean } | null>
    >(page, 'getMemorySlots')
    const keyMemory = slotsAfterCat.find((s) => {
      return s !== null && s.entityConfigId === 'obj-key'
    })
    expect(keyMemory).toBeDefined()
    // 记忆应被标记为过期（markMemoryOutdated: 'obj-key'）
    expect((keyMemory as { outdated?: boolean })?.outdated).toBe(true)

    // 8. 放置手机到玄关托盘
    const placePhoneResult = await callCommand(page, 'placeIntoContainer', 'cnt-entrance-tray')
    expect(placePhoneResult.success).toBe(true)

    // 9. 拾取钥匙（需要先回到客厅）
    await callCommand(page, 'transitionToRoom', 'living')
    const pickKeyResult = await callCommand(page, 'pickByConfigId', 'obj-key')
    expect(pickKeyResult.success).toBe(true)

    // 10. 带钥匙到玄关，放置到托盘
    await callCommand(page, 'transitionToRoom', 'entrance')
    const placeKeyResult = await callCommand(page, 'placeIntoContainer', 'cnt-entrance-tray')
    expect(placeKeyResult.success).toBe(true)

    // 11. 拾取雨伞（在玄关）
    const pickUmbrellaResult = await callCommand(page, 'pickByConfigId', 'obj-umbrella')
    expect(pickUmbrellaResult.success).toBe(true)

    // 12. 放置雨伞到玄关托盘
    const placeUmbrellaResult = await callCommand(page, 'placeIntoContainer', 'cnt-entrance-tray')
    expect(placeUmbrellaResult.success).toBe(true)

    // 12. 验证 phase 进入 probing，页面跳转到 Probe
    await page.waitForURL('**/probe/task-leave-home', { timeout: 10_000 })
    await expect(page.getByTestId('probe-page')).toBeVisible()

    // 13. 通过真实 UI 完成 Probe（使用演示按钮自动填入正确答案）
    await page.getByText('[演示] 自动填入正确答案').click()
    // 等待完成界面出现
    await expect(page.getByText('测试完成')).toBeVisible({ timeout: 5_000 })

    // 进入 Result
    await page.getByText('查看结果分析').click()
    await page.waitForURL('**/result/task-leave-home')

    // 截图：结果页
    await saveScreenshot(page, 'level-1-result')

    // 15. 验证结果页、评级区域、重玩按钮
    await expect(page.getByTestId('result-page')).toBeVisible()
    await expect(page.getByTestId('replay-button')).toBeVisible()

    // 16. 点击重新游玩
    await page.getByTestId('replay-button').click()
    await page.waitForURL('**/play/task-leave-home')

    // 17. 验证重新进入正确第一关，状态初始化
    await expect(page.getByTestId('briefing-modal')).toBeVisible()

    // 在 briefing 阶段验证状态已初始化（tickElapsed 在非 playing 阶段不执行）
    const stepCountBefore = await readState<number>(page, 'getStepCount')
    expect(stepCountBefore).toBe(0)
    const chaosValueBefore = await readState<number>(page, 'getChaosValue')
    expect(chaosValueBefore).toBe(0)

    await page.getByTestId('briefing-start-button').click()
    await expect(page.getByTestId('arena-hud')).toBeVisible()

    // 开始后 stepCount 仍应为 0（尚未执行任何 command）
    const stepCount = await readState<number>(page, 'getStepCount')
    expect(stepCount).toBe(0)
    // chaosValue 可能因 tickElapsed 略微增长，但应接近 0
    const chaosValue = await readState<number>(page, 'getChaosValue')
    expect(chaosValue).toBeLessThan(1)

    // 最终断言
    expectNoErrors(errors)
  })
})
