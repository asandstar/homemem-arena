// @ts-nocheck — R2A.1 一次性验证脚本，访问浏览器全局无需类型声明
import { chromium } from 'playwright'
import { resolve } from 'path'

const BASE = 'http://127.0.0.1:4175/homemem-arena'

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })

  const consoleErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  console.log('Loading /play/task-clean-table...')
  await page.goto(`${BASE}/play/task-clean-table`, { waitUntil: 'networkidle' })
  await sleep(3000)

  // Click start
  const startBtn = await page.$('[data-testid="briefing-start"], button:has-text("开始"), button:has-text("Start"), button:has-text("进入")')
  if (startBtn) {
    await startBtn.click()
    await sleep(5000)
  } else {
    await page.keyboard.press('Enter')
    await sleep(5000)
  }

  // Read entity positions from the game store
  const freeState = await page.evaluate(() => {
    const state = window.__gameStore?.getState?.() || window.useGameStore?.getState?.()
    if (!state) return { error: 'no store found' }

    const entities = state.entities || []
    const mug = entities.find((e) => e.configId === 'obj-dirty-cup')
    const fork = entities.find((e) => e.configId === 'obj-fork')
    const table = state.task?.containers?.find((c) => c.id === 'cnt-dining-table')
    const dishwasher = state.task?.containers?.find((c) => c.id === 'cnt-dishwasher')
    const rack = state.task?.containers?.find((c) => c.id === 'cnt-utensil-rack')

    return {
      mug: mug ? { id: mug.id, configId: mug.configId, status: mug.status, position: mug.position, modelAssetId: mug.modelAssetId, placedIn: mug.placedIn } : null,
      fork: fork ? { id: fork.id, configId: fork.configId, status: fork.status, position: fork.position, modelAssetId: fork.modelAssetId, placedIn: fork.placedIn } : null,
      tableSurface: table?.surfaceHeight,
      dishwasherSurface: dishwasher?.surfaceHeight,
      rackSurface: rack?.surfaceHeight,
      phase: state.phase,
    }
  })
  console.log('FREE state:', JSON.stringify(freeState, null, 2))

  // Try E then F to pick up mug
  await page.keyboard.press('e')
  await sleep(1000)
  await page.keyboard.press('f')
  await sleep(2000)

  const heldState = await page.evaluate(() => {
    const state = window.__gameStore?.getState?.() || window.useGameStore?.getState?.()
    if (!state) return { error: 'no store found' }
    const entities = state.entities || []
    const mug = entities.find((e) => e.configId === 'obj-dirty-cup')
    return {
      mug: mug ? { status: mug.status, position: mug.position, placedIn: mug.placedIn } : null,
      heldEntityId: state.heldEntityId,
      phase: state.phase,
    }
  })
  console.log('HELD state:', JSON.stringify(heldState, null, 2))

  // Try to place: walk forward and press F
  for (let i = 0; i < 10; i++) {
    await page.keyboard.down('w')
    await sleep(200)
    await page.keyboard.up('w')
  }
  await sleep(500)
  await page.keyboard.press('f')
  await sleep(2000)

  const placedState = await page.evaluate(() => {
    const state = window.__gameStore?.getState?.() || window.useGameStore?.getState?.()
    if (!state) return { error: 'no store found' }
    const entities = state.entities || []
    const mug = entities.find((e) => e.configId === 'obj-dirty-cup')
    return {
      mug: mug ? { status: mug.status, position: mug.position, placedIn: mug.placedIn } : null,
      heldEntityId: state.heldEntityId,
      phase: state.phase,
    }
  })
  console.log('PLACED state:', JSON.stringify(placedState, null, 2))

  console.log('\nConsole errors:', consoleErrors.length)
  consoleErrors.forEach((e) => console.log('  ERROR:', e))

  await browser.close()
}

main().catch((err) => {
  console.error('Failed:', err)
  process.exit(1)
})
