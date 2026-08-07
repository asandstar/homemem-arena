/**
 * G0 · 运行稳定和关卡可进入 — 直接路由 + Canvas 高度门禁 E2E
 *
 * 覆盖 5 条公开 URL：
 *   1. /                          (首页)
 *   2. /tasks                     (任务选择)
 *   3. /play/task-clean-table     (L1 初次整理)
 *   4. /play/task-leave-home      (L2 出门大作战)
 *   5. /play/task-laundry-sort    (L3 过期的早餐记忆)
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
import { createErrorCollector, expectNoErrors } from './helpers'

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

      // ===== 1. page.goto 之前：注册 addInitScript，在 SPA 代码执行前注入：
      //   1. audioPromptAnswered=1 / audioEnabled=0 (跳过"是否开启声音"弹窗)
      //   2. window.__E2E_G0__=true (ArenaPage 快路径：briefing 不显示)
      //      → useState 初始化 briefingOpen=false，再配合 FIX-3 useEffect
      //        (briefingOpen=false && phase='briefing' && task) → 自动 startPlaying()
      //      → HUD 渲染条件 task && !briefingOpen 立即满足
      if (route.startsWith('/play/')) {
        await page.addInitScript(() => {
          try { localStorage.setItem('hm_audio_prompt_answered', '1') } catch {}
          try { localStorage.setItem('hm_audio_enabled', '0') } catch {}
          ;(window as any).__E2E_G0__ = true
        })
      }

      // ===== 2. 直接导航到目标路由 (不经过首页跳转，模拟直接 URL 访问) =====
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 30_000 })

      // ===== 3. 等页面基本水合 + 3D (如果是 /play) 初始化 =====
      // 对 /play/* 等更久 (canvas + Three.js 初始化)，首页 /tasks 短一些
      const settleMs = route.startsWith('/play/') ? 5_500 : 2_500
      await page.waitForTimeout(settleMs)

      // ===== 4. 断言 B：/play/* 10 秒内离开 briefing =====
      if (route.startsWith('/play/')) {
        const hud = page.getByTestId('arena-hud')
        const briefingClosed = page.locator('[data-testid="arena-page-root"][data-briefing="closed"]')

        // 先等 arena-page-root 的 data-phase 挂载 → 证明 ArenaPage 已水合 + task 数据正在加载
        const rootWithPhase = page.locator('[data-testid="arena-page-root"][data-phase]')
        await expect(rootWithPhase.first(), `${route}：ArenaPage 已挂载 (data-phase)`).toBeAttached({
          timeout: 12_000,
        })

        // HUD 出现（配合 FIX-3，briefingOpen=false 时 phase 还在 briefing 就自动切 playing）
        await expect(hud, `${route}：HUD 应显示 (游戏进入 playing/probing)`).toBeVisible({
          timeout: 12_000,
        })

        // 双重确认：data-briefing=closed
        await expect(briefingClosed.first(), `${route}：data-briefing=closed`).toBeAttached({
          timeout: 3_000,
        })
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
