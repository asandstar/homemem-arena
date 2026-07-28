/**
 * 一次性 HUD / Minimap 审计截图脚本
 * 运行方式（在已启动 dev:e2e 即 127.0.0.1:4173 后）：
 *   node scripts/_audit_hud_screenshots.mjs
 * 产物 12 张 PNG → docs/assets/leave-home-ui/
 *
 * 约束：
 *  - 不修改任何生产源码
 *  - 不 commit、不 push
 *  - 仅使用 __testApi__ 中已有的公开命令或 setRobotPositionInRoom 移动相机定位 +
 *    saveMemoryByConfigId 写记忆槽 + manualSetKeyMemoryFreshAndFinalize 推进阶段，
 *    最终画面 100% 来自真实 Scene3D 渲染，不伪造 overlay。
 */
import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'docs', 'assets', 'leave-home-ui')
fs.mkdirSync(OUT_DIR, { recursive: true })

const RESOLUTIONS = [
  { label: '1440x900', w: 1440, h: 900 },
  { label: '1920x1080', w: 1920, h: 1080 },
]

const TASK_URL = 'http://127.0.0.1:4173/play/leave-home'
const WAIT_FRAMES_MS = 1200

async function apiEval(page, expr) {
  return page.evaluate(`(() => {
    const api = window.__testApi__
    if (!api) throw new Error('__testApi__ not mounted; mode != e2e')
    return (${expr})
  })()`)
}

async function waitSceneSettled(page, ms = WAIT_FRAMES_MS) {
  await page.waitForTimeout(ms)
}

async function startTask(page) {
  await page.goto('http://127.0.0.1:4173/tasks', { waitUntil: 'networkidle' })
  await waitSceneSettled(page, 1600)
  const candidates = [
    page.locator('[data-testid="task-start-task-leave-home"]').first(),
    page.locator('[data-testid^="task-start"]').filter({ hasText: /leave-home|出门大作战|开始挑战|继续挑战/i }).first(),
    page.getByRole('button', { name: /leave.?home|出门大作战|开始挑战|继续挑战|leave/i }),
    page.getByRole('link', { name: /leave.?home|出门大作战|leave/i }),
    page.locator('a[href*="leave-home"]').first(),
    page.locator('[data-task-id*="leave-home"]').first(),
    page.locator('button, a, [role="button"]').filter({ hasText: /leave.?home|出门大作战|开始挑战|继续挑战/i }).first(),
  ]
  let clicked = false
  for (const c of candidates) {
    try {
      const cnt = await c.count()
      if (cnt === 0) continue
      await c.first().click({ timeout: 2500 })
      clicked = true
      break
    } catch { continue }
  }
  if (!clicked) {
    await page.goto('http://127.0.0.1:4173/play/task-leave-home', { waitUntil: 'networkidle' })
  }
  await waitSceneSettled(page, 3000)
  const startBtn = page.getByRole('button', { name: /(开始任务|开始|出发|Start|开始游戏|进入任务)/i })
  try {
    if ((await startBtn.count()) > 0) {
      await startBtn.first().click({ timeout: 3000 })
      await waitSceneSettled(page, 900)
    }
  } catch { /* ignore */ }
  try {
    await apiEval(page, `(async () => {
      const r1 = typeof api.forceSetPhasePlaying === 'function' ? api.forceSetPhasePlaying() : null
      const r2 = typeof api.startPlaying === 'function' ? api.startPlaying() : null
      return { r1, r2, taskLoaded: !!api.getEntities().length }
    })()`)
  } catch (e) {
    console.warn('phase playing set failed:', String(e).slice(0, 220))
  }
  await waitSceneSettled(page, 1800)
}

const STAGES = [
  {
    slug: 'leave-home-stage-1-entry',
    desc: '刚进入 Stage-1（初始钥匙在茶几上），spawn 正常位置 0,-1.5 朝向 +z',
    async run(page) {
      // 回 spawn，不做任何交互
      await apiEval(page, `api.setRobotPositionInRoom({ x: 0, z: -1.5 })`)
      await waitSceneSettled(page)
    },
  },
  {
    slug: 'leave-home-near-initial-key',
    desc: '靠近茶几上初始钥匙 obj-key，交互出现',
    async run(page) {
      // 钥匙初始在 living coffee table 上：room local (0, 0.3) surface 点附近
      // 从茶几南侧靠近 0.6m，z=-0.3，x=+0.2 偏移站立，保证正对钥匙
      await apiEval(page, `api.setRobotPositionInRoom({ x: 0.2, z: -0.3 })`)
      await waitSceneSettled(page)
    },
  },
  {
    slug: 'leave-home-key-memory-saved',
    desc: '已保存钥匙记忆 (E 键)，记忆槽显示钥匙，事件 Toast 已触发',
    async run(page) {
      // 先确保附近有钥匙
      await apiEval(page, `api.setRobotPositionInRoom({ x: 0.2, z: -0.3 })`)
      await waitSceneSettled(page, 600)
      // 执行 saveMemoryByConfigId('obj-key') 真实写槽（非 fake）
      const saveR = await apiEval(page, `api.saveMemoryByConfigId('obj-key')`)
      console.log('  saveMemoryByConfigId(obj-key) =>', JSON.stringify(saveR))
      // 真实 evaluateStageTransitions 让 UI 更新
      await apiEval(page, `api.forceEvaluateStageTransitions(3)`)
      await waitSceneSettled(page)
    },
  },
  {
    slug: 'leave-home-key-memory-outdated',
    desc: '猫事件后钥匙位置变动，原记忆槽标记为 outdated',
    async run(page) {
      // 先回到 spawn，再手动触发一次脚本事件（包括 se-cat-pushes-key）
      await apiEval(page, `api.setRobotPositionInRoom({ x: 0, z: -1.5 })`)
      await waitSceneSettled(page, 600)
      // forceEvaluateStageTransitions 内部会 triggerScriptedEvents；
      // 为了稳定触发 cat 事件：这里再 force triggerScriptedEvents 3 次
      await apiEval(page, `(() => {
        for (let i=0;i<3;i++){
          api.forceEvaluateStageTransitions(5)
        }
        return { triggered: api.getTriggeredEvents(), memoryStats: api.getMemoryStats(), slots: api.getMemorySlots().map(s => s && { entityConfigId:s.entityConfigId, outdated:s.outdated, confidence:s.confidence }) }
      })()`)
      await waitSceneSettled(page, 900)
      // 确保 outdated 记忆被标记（若脚本事件触发导致钥匙位置变了，saveSystem 会判定槽位过期）
      // 我们再保存一次新记忆槽，第 0 位保留新鲜，其他位置让引擎处理
      await apiEval(page, `api.saveMemoryByConfigId('obj-key')`)
      await waitSceneSettled(page)
    },
  },
  {
    slug: 'leave-home-key-rediscovered',
    desc: '重新接近钥匙新位置（猫推下后在 living-local -1.0,-2.0 地面），E/F 提示显示',
    async run(page) {
      // 到 B2 MovedKey 位置 living local (-1.0, z=-2.0) 的南侧 +0.3 处站立
      await apiEval(page, `api.setRobotPositionInRoom({ x: -0.9, z: -2.5 })`)
      await waitSceneSettled(page, 600)
      await apiEval(page, `api.forceEvaluateStageTransitions(3)`)
      await waitSceneSettled(page)
    },
  },
  {
    slug: 'leave-home-finalize',
    desc: '进入 stage-finalize 阶段：放钥匙 + 手机 + 雨伞 到 玄关托盘',
    async run(page) {
      // 用 E2E 诊断 API 直接切到 finalize（仅测试环境允许，生产无此窗口）
      const fin = await apiEval(page, `api.manualSetKeyMemoryFreshAndFinalize()`)
      console.log('  manualSetKeyMemoryFreshAndFinalize =>', JSON.stringify(fin))
      // 再站到 entrance 门口，保证看到玄关托盘 + HUD finalize
      await apiEval(page, `api.setRobotPositionInRoom({ x: 0, z: 3.4 })`)
      await apiEval(page, `api.forceEvaluateStageTransitions(3)`)
      await waitSceneSettled(page)
    },
  },
]

;(async () => {
  const isMac = process.platform === 'darwin'
  const args = [
    ...(isMac ? ['--use-angle=metal', '--ignore-gpu-blocklist'] : []),
    '--enable-unsafe-swiftshader',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-web-security',
  ]
  const browser = await chromium.launch({ headless: true, args })
  console.log('chromium launched')

  for (const res of RESOLUTIONS) {
    console.log(`\n=== Resolution ${res.label} ===`)
    const ctx = await browser.newContext({ viewport: { width: res.w, height: res.h }, deviceScaleFactor: 1 })
    await ctx.addInitScript(() => {
      const key = 'homemem-level-progress'
      const cur = {}
      const order = ['task-clean-table', 'task-leave-home', 'task-laundry-sort', 'task-breakfast', 'task-night-patrol']
      const leaveHomeIndex = order.indexOf('task-leave-home')
      order.forEach((t, i) => {
        cur[t] = {
          taskId: t,
          unlocked: true,
          completed: i < leaveHomeIndex,
          rank: null,
          bestScore: 0,
          completionTime: null,
          attempts: 0,
        }
      })
      localStorage.setItem(key, JSON.stringify(cur))
    })
    const page = await ctx.newPage()
    console.log('start task leave-home ...')
    await startTask(page)
    const phase = await apiEval(page, `api.getPhase()`)
    const stage0 = await apiEval(page, `api.getCurrentStageId()`)
    const entsCount = await apiEval(page, `api.getEntities().length`)
    console.log('  phase:', phase, 'stage:', stage0, 'entsCount:', entsCount)

    for (const st of STAGES) {
      console.log(`  stage: ${st.slug} — ${st.desc.slice(0, 60)}`)
      try {
        await st.run(page)
      } catch (e) {
        console.warn('   ! stage run error:', String(e).slice(0, 200))
      }
      const outPath = path.join(OUT_DIR, `${st.slug}__${res.label}.png`)
      await page.screenshot({ path: outPath, fullPage: false })
      console.log('   ->', path.relative(ROOT, outPath), fs.statSync(outPath).size, 'bytes')
      // 顺便额外写一个 copy 不带分辨率后缀给标注图使用（用 1920×1080 作为 primary）
      if (res.label === '1920x1080') {
        const primary = path.join(OUT_DIR, `${st.slug}.png`)
        fs.copyFileSync(outPath, primary)
      }
    }
    await ctx.close()
  }
  await browser.close()
  console.log('\nDONE. All PNGs in', path.relative(ROOT, OUT_DIR))
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
