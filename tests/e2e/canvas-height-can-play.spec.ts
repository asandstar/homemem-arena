/**
 * G0 · 运行稳定和关卡可进入 — 直接路由 + Canvas 高度门禁 E2E
 *
 * 覆盖 5 条公开 URL：
 *   1. /                          (首页)
 *   2. /tasks                     (任务选择)
 *   3. /play/task-clean-table     (L1 初次整理)
 *   4. /play/task-leave-home      (L2 出门大作战)
 *   5. /play/task-laundry-sort    (L3 洗衣幽灵)
 *
 * 每条 URL 断言 3 条：
 *   A. 对 /play/* 页面，canvas.getBoundingClientRect().height / vpH > 0.6
 *      (canvas 高度至少占视口 60% — 对应 3D 不被压扁成顶部细线)
 *   B. 进入 /play/* 页面后 5 秒内，游戏 phase 已经不是 'briefing'
 *      (若简报 Modal 开着则兜底点击「开始任务」按钮，再等 2 秒后检查)
 *   C. 全程 console 没有 error 级消息 (WebGL/Three 已知良性警告已忽略)
 *
 * 不依赖任何 Debug API (forcePick / teleport / setRobotPosition)。
 * 不修改 src 逻辑 (如需 data-testid 则 ArenaPage 已有 briefing-modal /
 * briefing-start-button / #arena-canvas 等现成钩子)。
 */

import { test, expect } from '@playwright/test'
import { createErrorCollector, expectNoErrors, readState } from './helpers'

const PLAY_ROUTES = [
  '/',
  '/tasks',
  '/play/task-clean-table',
  '/play/task-leave-home',
  '/play/task-laundry-sort',
] as const

test.describe('G0 直接路由稳定性门禁', () => {
  for (const route of PLAY_ROUTES) {
    test(`直接路由 ${route}：无 console error + Canvas 正常`, async ({ page }) => {
      test.setTimeout(60_000)
      const errors = createErrorCollector(page)

      // ===== 1. 直接导航到目标路由 (不经过首页跳转，模拟直接 URL 访问) =====
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 30_000 })

      // ===== 2. 等页面基本水合 + 3D (如果是 /play) 初始化 =====
      // 对 /play/* 等更久 (canvas + Three.js 初始化)，首页 /tasks 短一些
      const settleMs = route.startsWith('/play/') ? 5_500 : 2_500
      await page.waitForTimeout(settleMs)

      // ===== 3. 断言 B：/play/* 5 秒内 phase 不是 briefing =====
      if (route.startsWith('/play/')) {
        // 读当前 phase；仍在 briefing 就兜底点击「开始任务」按钮再等 2 秒
        let phase = await readState<string>(page, 'getPhase').catch(() => 'briefing')

        if (phase === 'briefing') {
          const startBtn = page.getByTestId('briefing-start-button')
          if (await startBtn.isVisible().catch(() => false)) {
            await startBtn.click({ force: true, timeout: 5_000 }).catch(() => {})
            // 等 2 秒 (ArenaPage 有 FIX-3 兜底 useEffect：简报关且 phase=briefing 时补 startPlaying)
            await page.waitForTimeout(2_500)
            phase = await readState<string>(page, 'getPhase').catch(() => phase)
          }
        }

        // 接受 'playing' / 'probing' / 'analyzing' / 'result' 都行；
        // 核心保证：5+2 秒后绝不仍卡在 'briefing'
        expect(phase, `${route}：5s 内游戏 phase 不应仍停在 briefing`).not.toBe('briefing')
      }

      // ===== 4. 断言 A：/play/* canvas 高度 > 视口 60% (防止被压成顶部一条) =====
      if (route.startsWith('/play/')) {
        const canvas = page.locator('#arena-canvas')
        await expect(canvas, `${route}：3D canvas (#arena-canvas) 必须存在`).toBeAttached()

        const metrics = await page.evaluate(() => {
          const c = document.querySelector<HTMLCanvasElement>('#arena-canvas')
          const vp = { w: window.innerWidth, h: window.innerHeight }
          if (!c) return { canvasH: -1, vpH: vp.h, ratio: -1, canvasRect: null }
          const rect = c.getBoundingClientRect()
          return {
            canvasH: rect.height,
            vpH: vp.h,
            ratio: rect.height / Math.max(1, vp.h),
            canvasRect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
          }
        })

        expect(metrics.ratio, `${route}：canvas 高度 / 视口 > 0.6 (避免顶部压扁)；实际=${metrics.ratio.toFixed(3)}，canvasH=${metrics.canvasH}px，vpH=${metrics.vpH}px`).toBeGreaterThan(0.6)
      }

      // ===== 5. 断言 C：全程 0 console error / pageerror (WebGL 已知警告已过滤) =====
      expectNoErrors(errors)
    })
  }
})
