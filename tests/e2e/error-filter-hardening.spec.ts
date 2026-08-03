/**
 * G0 FINAL FILTER REGRESSION TEST
 *
 * 永久回归测试：tests/e2e/helpers.ts 的 createErrorCollector 良性消息过滤
 * 必须：
 *   - 精确忽略那 3 条 Playwright/Vite HMR/WS 握手阶段的已知良性消息；
 *   - 绝不能忽略任何 §二 明确列举的真实错误（Maximum update depth / SyntaxError /
 *     ERR_CONNECTION_REFUSED / ERR_ABORTED / Failed to fetch /
 *     [vite] Internal server error / Transform failed / HMR update failed /
 *     非白名单 host 的 WS 失败 / 404 / 500 等）。
 *
 * 本 spec 不需要浏览器 canvas/WebGL 渲染；只是跑纯函数断言。
 * 若未来 helpers.ts 的 BENIGN_*_MESSAGES 被不小心放宽到宽泛 substring，
 * 本 spec 的 12 条真实错误 case 会立刻 fail，阻止 regression。
 */

import { test, expect } from '@playwright/test'
import {
  _isBenignPageErrorMsg,
  _isBenignConsoleErrorMsg,
} from './helpers'

// ============================================================================
// BENIGN = TRUE：这 3 条是可精确证明的、Playwright/Vite 关闭阶段产生的良性消息
// ============================================================================
test.describe('§良性消息：必须 _返回 true_（不能误报成错误）', () => {
  test('[pageerror] WebSocket closed without opened. （句号）', () => {
    expect(_isBenignPageErrorMsg('WebSocket closed without opened.')).toBe(true)
  })

  test('[pageerror] WebSocket closed without opened （无句号 也接受）', () => {
    expect(_isBenignPageErrorMsg('WebSocket closed without opened')).toBe(true)
  })

  test('[console.error] [vite] failed to connect to websocket (...) 外层摘要（允许末尾空格，Playwright 实测附加）', () => {
    // 实测 Raw 文本：末尾多一个空格（length 81 不是 80）
    const raw =
      '[vite] failed to connect to websocket (Error: WebSocket closed without opened.). '
    expect(_isBenignConsoleErrorMsg(raw)).toBe(true)
    // 标准无多余空格版本也应通过
    expect(
      _isBenignConsoleErrorMsg(
        '[vite] failed to connect to websocket (Error: WebSocket closed without opened.).',
      ),
    ).toBe(true)
  })

  test('[console.error] 127.0.0.1:4173 HMR 握手 400（端口 4173，token 含字母数字）', () => {
    const raw =
      "WebSocket connection to 'ws://127.0.0.1:4173/?token=abc123XYZ' failed: Error during WebSocket handshake: Unexpected response code: 400"
    expect(_isBenignConsoleErrorMsg(raw)).toBe(true)
  })

  test('[console.error] 127.0.0.1:5173 HMR 握手 400（端口 5173，token 带下划线/短横线）', () => {
    // HARDENING 阶段真实 Playwright 打印过的 token：Kv8P5i8ZbR_u / G5Ji6OOVTQv_
    const raw =
      "WebSocket connection to 'ws://127.0.0.1:5173/?token=Kv8P5i8ZbR_u' failed: Error during WebSocket handshake: Unexpected response code: 400"
    expect(_isBenignConsoleErrorMsg(raw)).toBe(true)
  })
})

// ============================================================================
// REAL ERROR = FALSE：这 12 条是 §二 明确列举的真实错误，不得被误判 benign
// 任何一条 fail = helpers.ts 过滤规则被放宽到有回归风险
// ============================================================================
test.describe('§真实错误：必须 _返回 false_（不能被误忽略）', () => {
  test('[pe/ce] Maximum update depth exceeded (React 死循环)', () => {
    expect(_isBenignPageErrorMsg('Maximum update depth exceeded')).toBe(false)
    expect(_isBenignConsoleErrorMsg('Maximum update depth exceeded')).toBe(false)
  })

  test('[pe/ce] SyntaxError: Unexpected identifier as（React runtime/编译错误）', () => {
    expect(_isBenignPageErrorMsg('SyntaxError: Unexpected identifier as')).toBe(false)
    expect(_isBenignConsoleErrorMsg('SyntaxError: Unexpected identifier as')).toBe(false)
  })

  test('[pe/ce] ERR_CONNECTION_REFUSED（任何真实连接失败）', () => {
    const m = 'net::ERR_CONNECTION_REFUSED http://127.0.0.1:4173/some-route'
    expect(_isBenignPageErrorMsg(m)).toBe(false)
    expect(_isBenignConsoleErrorMsg(m)).toBe(false)
  })

  test('[pe/ce] ERR_ABORTED（路由/资源加载中断）', () => {
    const m = 'ERR_ABORTED /play/task-clean-table'
    expect(_isBenignPageErrorMsg(m)).toBe(false)
    expect(_isBenignConsoleErrorMsg(m)).toBe(false)
  })

  test('[pe/ce] ERR_FAILED（真实网络失败）', () => {
    const m =
      'WebSocket connection to "ws://some-external/" failed: net::ERR_FAILED'
    expect(_isBenignPageErrorMsg(m)).toBe(false)
    expect(_isBenignConsoleErrorMsg(m)).toBe(false)
  })

  test('[pe/ce] Failed to fetch（任何 fetch/XHR 失败）', () => {
    const m = 'Failed to fetch /assets/Scene3D-bigchunk.js'
    expect(_isBenignPageErrorMsg(m)).toBe(false)
    expect(_isBenignConsoleErrorMsg(m)).toBe(false)
  })

  test('[console.error] [vite] Internal server error（Vite 编译失败）', () => {
    const m =
      '[vite] Internal server error: Transform failed with 1 error: Unexpected token'
    expect(_isBenignConsoleErrorMsg(m)).toBe(false)
    // pageerror 分支虽然不常出现 [vite] 前缀，但也不能误判为 benign
    expect(_isBenignPageErrorMsg(m)).toBe(false)
  })

  test('[console.error] [vite] Transform failed（代码 transform 崩溃）', () => {
    const m = '[vite] Transform failed for src/pages/BadPage.tsx'
    expect(_isBenignConsoleErrorMsg(m)).toBe(false)
    expect(_isBenignPageErrorMsg(m)).toBe(false)
  })

  test('[pe/ce] HMR update failed（真实 HMR 模块加载失败，非握手关闭）', () => {
    const m = 'HMR update failed: module not found ./missing'
    expect(_isBenignPageErrorMsg(m)).toBe(false)
    expect(_isBenignConsoleErrorMsg(m)).toBe(false)
  })

  test('[console.error] ws://bad-host（非 127.0.0.1:4173/5173 的 WS 失败，一律不忽略）', () => {
    const m1 =
      "WebSocket connection to 'ws://bad-host/' failed: net::ERR_FAILED"
    expect(_isBenignConsoleErrorMsg(m1)).toBe(false)
    // 同一条消息但 host 换成了 127.0.0.1:9000（非白名单端口）也必须 fail
    const m2 =
      "WebSocket connection to 'ws://127.0.0.1:9000/?token=abc' failed: Error during WebSocket handshake: Unexpected response code: 400"
    expect(_isBenignConsoleErrorMsg(m2)).toBe(false)
    // host 是 127.0.0.1:4173 但 code 是 500（非 400）也必须 fail
    const m3 =
      "WebSocket connection to 'ws://127.0.0.1:4173/?token=abc' failed: Error during WebSocket handshake: Unexpected response code: 500"
    expect(_isBenignConsoleErrorMsg(m3)).toBe(false)
  })

  test('[pe/ce] 404 资源错误（任何 404 都不能忽略）', () => {
    const m = '404 Not Found for /assets/missing-model.glb'
    expect(_isBenignPageErrorMsg(m)).toBe(false)
    expect(_isBenignConsoleErrorMsg(m)).toBe(false)
  })

  test('[pe/ce] 500 资源错误（任何 500 都不能忽略）', () => {
    const m = '500 Internal Server Error for /api/session/upload'
    expect(_isBenignPageErrorMsg(m)).toBe(false)
    expect(_isBenignConsoleErrorMsg(m)).toBe(false)
  })
})
