/**
 * HUD & Minimap Implementation 验证截图脚本
 * 产出：
 *   - 每个分辨率 4 张关键截图（共 12 张）
 *   - 代表性输出：minimap-after-1920.png / minimap-after-1440.png / minimap-after-1280.png
 *
 * 运行：
 *   先启动 E2E dev server： npm run dev:e2e -- --host 127.0.0.1 --port 4173
 *   再本脚本：node scripts/_hud_minimap_impl_screenshots.mjs
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

const DEV_PORT = 4174
const TASK_ROOT = `http://127.0.0.1:${DEV_PORT}`
const WAIT_FRAMES_MS = 1200

const RESOLUTIONS = [
  { label: '1920x1080', w: 1920, h: 1080 },
  { label: '1440x900',  w: 1440, h: 900  },
  { label: '1280x720',  w: 1280, h: 720  },
]

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
  await page.goto(`${TASK_ROOT}/tasks`, { waitUntil: 'networkidle' })
  await waitSceneSettled(page, 1600)
  const candidates = [
    page.locator('[data-testid="task-start-task-leave-home"]').first(),
    page.locator('[data-testid^="task-start"]').filter({ hasText: /leave-home|出门大作战|开始挑战|继续挑战/i }).first(),
    page.getByRole('button', { name: /(leave.?home|出门大作战|开始挑战|继续挑战|leave)/i }),
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
    await page.goto(`${TASK_ROOT}/play/task-leave-home`, { waitUntil: 'networkidle' })
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

/** 用户要求的 4 个状态 */
const STAGES = [
  {
    id: 'stage-1-entry',
    desc: 'Stage-1 初始状态：spawn 位置，钥匙在茶几上',
    async run(page) {
      await apiEval(page, `api.setRobotPositionInRoom({ x: 0, z: -1.5 })`)
      await waitSceneSettled(page)
    },
  },
  {
    id: 'key-memory-saved',
    desc: '钥匙记忆保存后：记忆槽显示 obj-key 新鲜记忆',
    async run(page) {
      await apiEval(page, `api.setRobotPositionInRoom({ x: 0.2, z: -0.3 })`)
      await waitSceneSettled(page, 600)
      const saveR = await apiEval(page, `api.saveMemoryByConfigId('obj-key')`)
      console.log('   saveMemoryByConfigId(obj-key) =>', JSON.stringify(saveR))
      await apiEval(page, `api.forceEvaluateStageTransitions(3)`)
      await waitSceneSettled(page)
    },
  },
  {
    id: 'key-memory-outdated',
    desc: '钥匙记忆过期后：猫推钥匙事件后，旧记忆标记 outdated，minimap 显示旧位置灰红虚线圆 + ×',
    async run(page) {
      await apiEval(page, `api.setRobotPositionInRoom({ x: 0, z: -1.5 })`)
      await waitSceneSettled(page, 600)
      await apiEval(page, `(() => {
        for (let i=0;i<3;i++){
          api.forceEvaluateStageTransitions(5)
        }
        return { triggered: api.getTriggeredEvents(), slots: api.getMemorySlots().map(s => s && { entityConfigId:s.entityConfigId, outdated:s.outdated, confidence:s.confidence, position: s && s.position }) }
      })()`)
      await waitSceneSettled(page, 900)
    },
  },
  {
    id: 'switch-to-bedroom',
    desc: '从 living 切换到 bedroom 后：minimap 重新 fit 卧室大小，门洞显示客厅方向',
    async run(page) {
      // 先回到 spawn
      await apiEval(page, `api.setRobotPositionInRoom({ x: 0, z: -1.5 })`)
      await waitSceneSettled(page, 500)
      const r = await apiEval(page, `api.transitionToRoom('bedroom')`)
      console.log('   transitionToRoom(bedroom) =>', JSON.stringify(r))
      await waitSceneSettled(page, 600)
      // 在 bedroom center 南侧站立，保证能看到门框
      await apiEval(page, `api.setRobotPositionInRoom({ x: 0, z: -1.5 })`)
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
  console.log('chromium launched, connecting to', TASK_ROOT)

  const primaryShotPerRes = {}

  for (const res of RESOLUTIONS) {
    console.log(`\n=== Resolution ${res.label} (${res.w}x${res.h}) ===`)
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
    console.log('   phase:', phase, 'stage:', stage0, 'entsCount:', entsCount)

    for (let i = 0; i < STAGES.length; i++) {
      const st = STAGES[i]
      console.log(`   [${i + 1}/${STAGES.length}] ${st.id} — ${st.desc.slice(0, 72)}`)
      try {
        await st.run(page)
      } catch (e) {
        console.warn('   ! stage run error:', String(e).slice(0, 200))
      }
      const outPath = path.join(OUT_DIR, `minimap-${st.id}__${res.label}.png`)
      await page.screenshot({ path: outPath, fullPage: false })
      const stat = fs.statSync(outPath)
      console.log('      ->', path.relative(ROOT, outPath), stat.size, 'bytes')
      // 代表性截图：用 key-memory-outdated 状态（因为该状态能同时看到过期标记、玩家、门洞、物品标记）
      if (st.id === 'key-memory-outdated') {
        primaryShotPerRes[res.label] = outPath
      }
    }
    await ctx.close()
  }

  // 输出代表性的 3 张 minimap-after-*.png
  for (const res of RESOLUTIONS) {
    const src = primaryShotPerRes[res.label]
    if (src) {
      const dst = path.join(OUT_DIR, `minimap-after-${res.label.split('x')[0]}.png`)
      fs.copyFileSync(src, dst)
      console.log('\n   -> primary shot', path.relative(ROOT, dst), fs.statSync(dst).size, 'bytes')
    }
  }

  await browser.close()
  console.log('\nDONE. All PNGs in', path.relative(ROOT, OUT_DIR))
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
