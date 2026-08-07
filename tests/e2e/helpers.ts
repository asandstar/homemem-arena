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
 * 精确匹配的 pageerror 良性消息白名单（每条都必须是 Playwright/Vite 关闭/握手阶段
 * 已知、可复现、不影响游戏运行的消息。禁止宽泛 substring，禁止遮蔽真实连接错误）。
 *
 * 注：若未来新增条目，必须在此处附理由 + 能复现的场景。
 */
const BENIGN_PAGEERROR_MESSAGES: ReadonlyArray<string | RegExp> = [
  // dev:e2e:stable 启动/关闭握手阶段 Vite 发送的已知良性 WS 关闭事件
  // （消息文本精确为 'WebSocket closed without opened.'，不包含任何 URL/statusCode）
  /^WebSocket closed without opened\.?$/i,
]

/**
 * 精确匹配的 console.error 良性消息白名单（§二 第 4 条：console.error 分支不复制
 * pageerror 的整条宽泛白名单。仅保留 E2E 实测中精确出现过的、由 Vite 客户端 HMR/WS 握手
 * 失败打印的同一类良性消息。所有条目必须严格锚定首末、不得用宽泛 substring。
 * 其它任何 [vite] / webSocket / hmr 错误（Internal server error / 404 /
 * transform failed / net::ERR_*）一律不得忽略。
 */
const BENIGN_CONSOLE_ERROR_MESSAGES: ReadonlyArray<RegExp> = [
  // Vite 客户端：HMR 端点 (ws://127.0.0.1:4173 或 5173) 握手返回非 101（如 token 过期/重复连接导致 400）
  // 消息形如（token 含 [A-Za-z0-9_-]；实测有下划线、短横线）：
  //   WebSocket connection to 'ws://127.0.0.1:4173/?token=Kv8P5i8ZbR_u' failed: Error during WebSocket handshake: Unexpected response code: 400
  // （Playwright msg.text() 末尾可能附加空格；用 \s* 允许末尾空白）
  /^WebSocket connection to 'ws:\/\/127\.0\.0\.1:(4173|5173)\/\?token=[A-Za-z0-9_-]+' failed: Error during WebSocket handshake: Unexpected response code: 400\s*\.?\s*$/i,
  // Vite 客户端：随后紧接着打印的外层失败摘要
  //   [vite] failed to connect to websocket (Error: WebSocket closed without opened.).
  // （实测 Playwright 输出末尾有一个额外空格）
  /^\[vite\] failed to connect to websocket \(Error: WebSocket closed without opened\.\)\s*\.?\s*$/i,
]

/**
 * 判断 pageerror 是否为已知良性消息（供反向验证测试使用）。
 * @internal
 */
export function _isBenignPageErrorMsg(raw: unknown): boolean {
  const msg = String(raw ?? '')
  for (const pattern of BENIGN_PAGEERROR_MESSAGES) {
    if (typeof pattern === 'string') {
      if (msg === pattern) return true
    } else if (pattern.test(msg)) {
      return true
    }
  }
  return false
}

/**
 * 判断 console.error 是否为已知良性消息（供反向验证测试使用）。
 * @internal
 */
export function _isBenignConsoleErrorMsg(raw: unknown): boolean {
  const msg = String(raw ?? '')
  for (const pattern of BENIGN_CONSOLE_ERROR_MESSAGES) {
    if (pattern.test(msg)) return true
  }
  return false
}

/**
 * 原始（非 WebGL/Three 资产加载）的 pageerror 是否为良性消息。
 * 与 _isBenignPageErrorMsg 分开：WebGL/Three 过滤保留历史逻辑且只在
 * pageerror 分支内生效（§二 第 3 条）。
 */
function isNonRenderBenignPageError(raw: unknown): boolean {
  return _isBenignPageErrorMsg(raw)
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
    const msg = String(error?.message ?? error ?? '')
    // 只在 pageerror 分支过滤：WebGL/Three/gltf/纹理资产加载相关良性警告
    // + 精确匹配的 Vite/Playwright 握手阶段 WS 关闭消息（§二 3）
    if (
      msg.includes('THREE.WebGLRenderer') ||
      msg.includes('WebGL') ||
      msg.includes('Could not create canvas context') ||
      msg.includes('context lost') ||
      msg.includes('GL_INVALID') ||
      msg.includes('Texture') ||
      msg.includes('load model') ||
      msg.includes('glTF') ||
      isNonRenderBenignPageError(msg)
    ) {
      return
    }
    collector.pageErrors.push(error)
  })

  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      // §二 第 4 条：console.error 分支不复制宽泛的 [vite]/hmr/WebSocket 白名单。
      // 仅保留：
      //   A. 历史已接受的、与 Three/WebGL 资产加载直接相关的良性条目；
      //   B. 严格首末锚定的 Vite WS 握手失败良性消息（BENIGN_CONSOLE_ERROR_MESSAGES）。
      const text = msg.text()
      if (
        text.includes('THREE.WebGLRenderer') ||
        text.includes('perf') ||
        text.includes('THREE.GLTFLoader') ||
        text.includes("Couldn't load texture") ||
        _isBenignConsoleErrorMsg(text)
      ) return
      collector.consoleErrors.push(text)
    }
  })

  page.on('requestfailed', (request) => {
    // §二 明确：404 / 500 / ERR_CONNECTION_REFUSED / ERR_FAILED / Failed to fetch
    // 一律不得忽略。这里不做任何过滤，全部记录。
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
  // 仅在确实跨房间时切换。对同一房间重复调用 transitionToRoom 会被游戏
  // 记为“重复搜索/离开未关容器”，从而让测试凭空增加混乱值。
  const currentRoom = await readState<string>(page, 'getCurrentRoom')
  if (currentRoom !== pos.room) {
    await page.evaluate(
      (rid) => (window as any).__testApi__?.transitionToRoom?.(rid),
      pos.room,
    )
    await page.waitForTimeout(80)
  }
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
