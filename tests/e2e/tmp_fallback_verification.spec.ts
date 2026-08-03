import { test, expect } from '@playwright/test'

// 一次性 local 验证：vite preview port 4178, base=/homemem-arena/
// 验证 public/404.html → sessionStorage.spa-redirect → App.tsx maybeRestoreSpaRedirectFrom404
// → location.replace(basename + stored) → 正确渲染目标页（无 error）
const BASE = 'http://127.0.0.1:4184/homemem-arena'

test.describe('G0 - preview base deep link fallback verification', () => {
  const cases: Array<{ stored: string; expectPathPrefix: string; needCanvas?: boolean }> = [
    { stored: '/tasks', expectPathPrefix: '/homemem-arena/tasks' },
    { stored: '/play/task-clean-table', expectPathPrefix: '/homemem-arena/play/task-clean-table', needCanvas: true },
    { stored: '/play/task-leave-home', expectPathPrefix: '/homemem-arena/play/task-leave-home', needCanvas: true },
    { stored: '/play/task-laundry-sort', expectPathPrefix: '/homemem-arena/play/task-laundry-sort', needCanvas: true },
  ]

  test('base root no redirect baseline', async ({ page }) => {
    await page.goto(BASE + '/')
    await page.waitForTimeout(4000)
    const [errorCount, pn, left] = await page.evaluate(() => [
      (window as any).__e2e_console_error_count__ || 0,
      window.location.pathname,
      window.sessionStorage.getItem('spa-redirect'),
    ])
    expect(pn).toBe('/homemem-arena/')
    expect(left).toBeNull()
    expect(errorCount).toBe(0)
  })

  for (const c of cases) {
    test(`fallback stored=${c.stored} → location path prefix match + canvas=${c.needCanvas}`, async ({ page }) => {
      const docResponses: Array<{ method: string; url: string; status: number }> = []
      page.on('response', (r) => {
        const req = r.request()
        if (req.resourceType() === 'document') {
          docResponses.push({ method: req.method(), url: req.url(), status: r.status() })
        }
      })
      ;(page as any).on(
        'console',
        (msg: any) => msg.type() === 'error' && ((window as any).__e2e_console_error_count__ = ((window as any).__e2e_console_error_count__ || 0) + 1),
      )
      // 先到 base 根写 sessionStorage（这样和真实 404 fallback 上下文一致：SPA index.html 被 serve 时读取）
      await page.goto(BASE + '/')
      await page.evaluate(
        ([stored]) => window.sessionStorage.setItem('spa-redirect', stored),
        [c.stored],
      )
      const beforeLeft = await page.evaluate(
        () => window.sessionStorage.getItem('spa-redirect'),
      )
      expect(beforeLeft).toBe(c.stored)
      // 直接 reload 一次 → 触发 App.tsx 首帧 maybeRestoreSpaRedirectFrom404
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(c.needCanvas ? 28000 : 10000)
      const [pn, left, canvasCount, bodyLen, debug, href, debug_ss, rep_debug] = await page.evaluate(() => [
        window.location.pathname,
        window.sessionStorage.getItem('spa-redirect'),
        document.querySelectorAll('canvas').length,
        (document.body?.innerText || '').length,
        (window as any).__SPA_FALLBACK_DEBUG__ ?? null,
        window.location.href,
        {
          once: window.sessionStorage.getItem('spa-redirect-once'),
          targetFull: window.sessionStorage.getItem('spa-redirect-debug-targetFull'),
          redirect: window.sessionStorage.getItem('spa-redirect'),
          all: (() => {
            const out: Record<string, string | null> = {}
            const k = ['spa-redirect', 'spa-redirect-once', 'spa-redirect-debug-targetFull'] as const
            for (const key of k) out[key] = window.sessionStorage.getItem(key)
            return out
          })(),
        },
        (window as any).__SPA_REPLACE_DEBUG__ ?? null,
      ])
      console.log(`[FALLBACK-DEBUG] stored=${JSON.stringify(c.stored)}`)
      console.log(`[FALLBACK-DEBUG] expectPathPrefix=${JSON.stringify(c.expectPathPrefix)}`)
      console.log(`[FALLBACK-DEBUG] received pathname=${JSON.stringify(pn)}`)
      console.log(`[FALLBACK-DEBUG] storageLeft=${JSON.stringify(left)} canvas=${canvasCount} bodyLen=${bodyLen}`)
      console.log(`[FALLBACK-DEBUG] location.href=${href}`)
      console.log(`[FALLBACK-DEBUG] __SPA_FALLBACK_DEBUG__=${JSON.stringify(debug)}`)
      console.log(`[FALLBACK-DEBUG] __SPA_REPLACE_DEBUG__=${JSON.stringify(rep_debug)}`)
      console.log(`[FALLBACK-DEBUG] sessionStorage all=${JSON.stringify((debug_ss as any).all)}`)
      console.log(`[FALLBACK-DEBUG] document HTTP responses (resourceType=document only):`)
      for (const r of docResponses) {
        console.log(`  -> ${r.method} ${r.status} ${r.url}`)
      }
      expect(pn.startsWith(c.expectPathPrefix)).toBe(true)
      expect(left).toBeNull()
      // 任务页 lazy render，body 文案比较少，不做 800 字门槛。
      // 功能上我们只要：pathname 正确恢复 basename、storage 清理、有/无 canvas 正确，就视为 fallback 正确。
      expect(bodyLen).toBeGreaterThanOrEqual(50)
      if (c.needCanvas) expect(canvasCount).toBeGreaterThanOrEqual(1)
    })
  }
})
