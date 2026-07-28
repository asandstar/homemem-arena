import type { Page, ConsoleMessage, Request } from '@playwright/test'

/**
 * E2E 测试辅助工具
 */

export interface ErrorCollector {
  pageErrors: Error[]
  consoleErrors: string[]
  failedRequests: Request[]
}

/**
 * 创建错误收集器，监听 pageerror、console.error 和失败请求
 */
export function createErrorCollector(page: Page): ErrorCollector {
  const collector: ErrorCollector = {
    pageErrors: [],
    consoleErrors: [],
    failedRequests: [],
  }

  page.on('pageerror', (error) => {
    collector.pageErrors.push(error)
  })

  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      // 忽略已知的良性警告（WebGL context、THREE.js 纹理/模型加载等）
      const text = msg.text()
      if (
        text.includes('THREE.WebGLRenderer') ||
        text.includes('perf') ||
        text.includes('THREE.GLTFLoader') ||
        text.includes("Couldn't load texture")
      ) return
      collector.consoleErrors.push(text)
    }
  })

  page.on('requestfailed', (request) => {
    collector.failedRequests.push(request)
  })

  return collector
}

/**
 * 断言错误收集器为空
 */
export function expectNoErrors(collector: ErrorCollector): void {
  if (collector.pageErrors.length > 0) {
    throw new Error(
      `Expected no pageerrors, but got ${collector.pageErrors.length}:\n` +
        collector.pageErrors.map((e) => `  - ${e.message}`).join('\n'),
    )
  }
  if (collector.consoleErrors.length > 0) {
    throw new Error(
      `Expected no console.error, but got ${collector.consoleErrors.length}:\n` +
        collector.consoleErrors.map((e) => `  - ${e}`).join('\n'),
    )
  }
  if (collector.failedRequests.length > 0) {
    throw new Error(
      `Expected no failed requests, but got ${collector.failedRequests.length}:\n` +
        collector.failedRequests.map((r) => `  - ${r.url()} (${r.failure()?.errorText})`).join('\n'),
    )
  }
}

/**
 * 获取 window.__testApi__（仅在 E2E 环境下可用）
 */
export async function getTestApi(page: Page) {
  return page.evaluate(() => {
    if (!window.__testApi__) {
      throw new Error('window.__testApi__ is not available. Ensure running under `vite --mode e2e` (MODE === e2e) or VITE_E2E=true.')
    }
    return true
  })
}

/**
 * 通过 test API 读取只读状态
 */
export async function readState<T>(page: Page, method: string): Promise<T> {
  return page.evaluate((m) => {
    if (!window.__testApi__) throw new Error('testApi not available')
    const api = window.__testApi__ as Record<string, () => unknown>
    return api[m]() as T
  }, method)
}

/**
 * 从首页导航到第一关并开始任务
 */
export async function navigateToFirstLevelAndStart(page: Page): Promise<void> {
  await page.goto('/')
  await page.getByTestId('home-primary-cta').click()
  await page.waitForURL('**/tasks')
  await page.getByTestId('task-start-task-clean-table').click()
  await page.waitForURL('**/play/task-clean-table')
  // 等待 briefing 出现
  await page.getByTestId('briefing-modal').waitFor({ state: 'visible' })
  // 点击开始任务
  await page.getByTestId('briefing-start-button').click()
  // 等待 HUD 出现
  await page.getByTestId('arena-hud').waitFor({ state: 'visible' })
}

/**
 * 关闭开场对话框（DialogBox 的 z-50 pointer-events-auto 会拦截点击）
 */
export async function closeStartDialog(page: Page): Promise<void> {
  try {
    const dialogOverlay = page.locator('div.z-50.pointer-events-auto')
    await dialogOverlay.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})
    if (await dialogOverlay.isVisible()) {
      await dialogOverlay.locator('button').first().click({ force: true })
      await dialogOverlay.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {})
    }
  } catch {
    // ignore errors when page is closed or dialog not found
  }
}

/**
 * 截图保存到 qa-artifacts/e2e/
 */
export async function saveScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({
    path: `qa-artifacts/e2e/${name}.png`,
    fullPage: false,
  })
}

/**
 * 轮询等待音频进入活动状态（BGM 或环境音）。
 * 最多等待 timeoutMs，每 intervalMs 检查一次。
 */
export async function waitForAudioActive(
  page: Page,
  timeoutMs = 5000,
  intervalMs = 200,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const bgm = await readState<boolean>(page, 'isBgmPlaying')
    const ambient = await readState<boolean>(page, 'hasActiveRoomAmbient')
    if (bgm || ambient) return true
    await page.waitForTimeout(intervalMs)
  }
  return false
}

/**
 * 轮询等待音频完全停止。
 * 最多等待 timeoutMs，每 intervalMs 检查一次。
 */
export async function waitForAudioStopped(
  page: Page,
  timeoutMs = 5000,
  intervalMs = 200,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs
  let lastBgm = null
  let lastAmbient = null
  let lastSfxCount = null
  while (Date.now() < deadline) {
    const bgm = await readState<boolean>(page, 'isBgmPlaying')
    const ambient = await readState<boolean>(page, 'hasActiveRoomAmbient')
    const sfxCount = await readState<number>(page, 'getActiveContinuousSfxCount')
    
    if (bgm !== lastBgm || ambient !== lastAmbient || sfxCount !== lastSfxCount) {
      console.log(`Audio state changed: bgm=${bgm}, ambient=${ambient}, sfxCount=${sfxCount}, time=${Date.now()}`)
      lastBgm = bgm
      lastAmbient = ambient
      lastSfxCount = sfxCount
    }
    
    if (!bgm && !ambient && sfxCount === 0) return true
    if (Date.now() > deadline - 1000) {
      console.log(`Audio still active at deadline: bgm=${bgm}, ambient=${ambient}, sfxCount=${sfxCount}`)
    }
    await page.waitForTimeout(intervalMs)
  }
  return false
}

/**
 * 通过 Test API 调用任意 Command-backed 方法
 * 自动处理 "先开始任务" 错误：内部调用 startPlaying 重置 phase 后重试一次
 */
export async function callCommand(
  page: Page,
  method: string,
  ...args: unknown[]
): Promise<{ success: boolean; reason?: string }> {
  const first = await page.evaluate(
    ({ method, args }) => {
      if (!window.__testApi__) throw new Error('testApi not available')
      const api = window.__testApi__ as unknown as Record<string, (...a: unknown[]) => unknown>
      return api[method](...args) as { success: boolean; reason?: string }
    },
    { method, args },
  )
  const reasonStr = String(first?.reason ?? '')
  if (!first?.success && /先开始任务/.test(reasonStr)) {
    await page.evaluate(() => {
      const api = (window as any).__testApi__
      if (api && typeof api.startPlaying === 'function') return api.startPlaying()
      return null
    })
    await page.waitForTimeout(120)
    return page.evaluate(
      ({ method, args }) => {
        if (!window.__testApi__) throw new Error('testApi not available')
        const api = window.__testApi__ as unknown as Record<string, (...a: unknown[]) => unknown>
        return api[method](...args) as { success: boolean; reason?: string }
      },
      { method, args },
    )
  }
  return first
}

/**
 * 需要"实体附近判定"的命令：saveMemoryByConfigId / pickByConfigId
 * 流程：readState 读实体 position → setRobotPositionInRoom → 重试最多 4 次（每次 advanceStage + 150ms）
 */
export async function callNearbyEntityCommand(
  page: Page,
  command: 'saveMemoryByConfigId' | 'pickByConfigId',
  configId: string,
  roomFilter?: string,
): Promise<{ success: boolean; reason?: string }> {
  const entities = await readState<
    Array<{ configId?: string; currentRoom?: string; status?: string; position?: { x: number; y: number; z: number } }>
  >(page, 'getEntities')
  const ent = entities.find((e) => {
    if (e.configId !== configId) return false
    if (roomFilter && e.currentRoom !== roomFilter) return false
    return true
  }) ?? entities.find((e) => e.configId === configId)
  if (ent?.position) {
    await page.evaluate(
      (p) => {
        const api = (window as any).__testApi__
        return api?.setRobotPositionInRoom?.({ x: p.x, z: p.z })
      },
      { x: ent.position.x, z: ent.position.z },
    )
  }
  let lastResult: { success: boolean; reason?: string } = { success: false, reason: 'not attempted' }
  for (let i = 0; i < 4; i += 1) {
    await page.evaluate(() => (window as any).__testApi__?.forceEvaluateStageTransitions?.(1))
    await page.waitForTimeout(150)
    lastResult = await callCommand(page, command, configId)
    if (lastResult.success) break
  }
  return lastResult
}

/**
 * 连续调用 evaluateStageTransitions（调用期间刷新 _moving 标记）
 */
export async function advanceStageTransitions(page: Page, iterations = 3): Promise<void> {
  for (let i = 0; i < iterations; i += 1) {
    // forceEvaluateStageTransitions 内部已含真实 loop tick：
    //   triggerScriptedEvents → checkLevelCompletion → evaluateStageTransitions
    await page.evaluate(() => (window as any).__testApi__?.forceEvaluateStageTransitions?.(1))
    await page.waitForTimeout(120)
  }
}

/**
 * 从首页导航到指定任务 ID 并开始任务（通用版）
 */
export async function navigateToTaskAndStart(page: Page, taskId: string): Promise<void> {
  await page.goto('/')
  await page.getByTestId('home-primary-cta').click()
  await page.waitForURL('**/tasks')
  await page.getByTestId(`task-start-${taskId}`).click()
  await page.waitForURL(`**/play/${taskId}`)
  await page.getByTestId('briefing-modal').waitFor({ state: 'visible' })
  await page.getByTestId('briefing-start-button').click()
  await page.getByTestId('arena-hud').waitFor({ state: 'visible' })
}

export async function teleportToContainer(page: Page, containerId: string): Promise<void> {
  // 先用只读 API 直接拿到容器的真实世界坐标（room center + container.position）
  const pos = await page.evaluate((cid) => {
    return (window as any).__testApi__?.getContainerWorldPosition?.(cid) ?? null
  }, containerId)
  if (!pos) return
  // 先切房间（确保 currentRoom 一致，distance check 能生效）
  await page.evaluate(
    (rid) => (window as any).__testApi__?.transitionToRoom?.(rid),
    pos.room,
  )
  await page.waitForTimeout(80)
  // 传送到容器世界坐标点（距离判定 2.5 内）
  await page.evaluate(
    (p) => (window as any).__testApi__?.setRobotPositionInRoom?.(p),
    { x: pos.x, z: pos.z },
  )
  await page.waitForTimeout(80)
}

export async function placeIntoContainerStable(
  page: Page,
  containerId: string,
): Promise<{ success: boolean; reason?: string }> {
  await teleportToContainer(page, containerId)
  await advanceStageTransitions(page, 1)
  let r = await callCommand(page, 'placeIntoContainer', containerId)
  if (!r.success) {
    await teleportToContainer(page, containerId)
    void (await callCommand(page, 'releaseHeldEntity'))
    await advanceStageTransitions(page, 2)
    r = await callCommand(page, 'placeIntoContainer', containerId)
  }
  return r
}
