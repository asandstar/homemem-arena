// @ts-nocheck — R2A.1 一次性截图脚本，访问浏览器全局无需类型声明
import { chromium } from 'playwright'
import { mkdirSync } from 'fs'
import { resolve } from 'path'

const OUT_DIR = resolve('docs/reports')
mkdirSync(OUT_DIR, { recursive: true })

const BASE = 'http://127.0.0.1:4175/homemem-arena'

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })

  // === FREE state: mug and fork on dining table ===
  console.log('Loading /play/task-clean-table...')
  await page.goto(`${BASE}/play/task-clean-table`, { waitUntil: 'networkidle' })
  await sleep(3000)

  // Click briefing start button if present
  const startBtn = await page.$('[data-testid="briefing-start"], button:has-text("开始"), button:has-text("Start"), button:has-text("进入")')
  if (startBtn) {
    console.log('Clicking start button...')
    await startBtn.click()
    await sleep(5000)
  } else {
    // Try pressing Enter or Space
    await page.keyboard.press('Enter')
    await sleep(5000)
  }

  await page.screenshot({ path: resolve(OUT_DIR, 'r2a1-mug-free.png') })
  console.log('Saved: r2a1-mug-free.png')

  // Try to pick up mug: press E to save memory, then F to pick up
  console.log('Attempting HELD state: press E then F...')
  await page.keyboard.press('e')
  await sleep(1000)
  await page.keyboard.press('f')
  await sleep(2000)
  await page.screenshot({ path: resolve(OUT_DIR, 'r2a1-mug-held.png') })
  console.log('Saved: r2a1-mug-held.png')

  // Try to place mug: walk forward and press F near dishwasher
  console.log('Attempting PLACED state: walk to dishwasher...')
  for (let i = 0; i < 8; i++) {
    await page.keyboard.down('w')
    await sleep(200)
    await page.keyboard.up('w')
  }
  await sleep(500)
  // Turn right
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('d')
    await sleep(100)
  }
  await sleep(500)
  for (let i = 0; i < 5; i++) {
    await page.keyboard.down('w')
    await sleep(200)
    await page.keyboard.up('w')
  }
  await sleep(1000)
  await page.keyboard.press('f')
  await sleep(2000)
  await page.screenshot({ path: resolve(OUT_DIR, 'r2a1-mug-placed.png') })
  console.log('Saved: r2a1-mug-placed.png')

  // Reload for fork screenshots
  console.log('Reloading for fork states...')
  await page.goto(`${BASE}/play/task-clean-table`, { waitUntil: 'networkidle' })
  await sleep(3000)
  const startBtn2 = await page.$('[data-testid="briefing-start"], button:has-text("开始"), button:has-text("Start"), button:has-text("进入")')
  if (startBtn2) {
    await startBtn2.click()
    await sleep(5000)
  } else {
    await page.keyboard.press('Enter')
    await sleep(5000)
  }
  await page.screenshot({ path: resolve(OUT_DIR, 'r2a1-fork-free.png') })
  console.log('Saved: r2a1-fork-free.png')

  // Pick up fork: turn to fork, press E then F
  console.log('Attempting fork HELD state...')
  await page.keyboard.press('e')
  await sleep(1000)
  // Turn left to face fork
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('a')
    await sleep(100)
  }
  await page.keyboard.press('f')
  await sleep(2000)
  await page.screenshot({ path: resolve(OUT_DIR, 'r2a1-fork-held.png') })
  console.log('Saved: r2a1-fork-held.png')

  // Place fork at utensil rack
  console.log('Attempting fork PLACED state...')
  for (let i = 0; i < 6; i++) {
    await page.keyboard.down('w')
    await sleep(200)
    await page.keyboard.up('w')
  }
  await sleep(500)
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('a')
    await sleep(100)
  }
  await sleep(1000)
  await page.keyboard.press('f')
  await sleep(2000)
  await page.screenshot({ path: resolve(OUT_DIR, 'r2a1-fork-placed.png') })
  console.log('Saved: r2a1-fork-placed.png')

  // Also take Laundry room screenshots
  console.log('Loading laundry-sort...')
  await page.goto(`${BASE}/play/task-laundry-sort`, { waitUntil: 'networkidle' })
  await sleep(3000)
  const startBtn3 = await page.$('[data-testid="briefing-start"], button:has-text("开始"), button:has-text("Start"), button:has-text("进入")')
  if (startBtn3) {
    await startBtn3.click()
    await sleep(5000)
  } else {
    await page.keyboard.press('Enter')
    await sleep(5000)
  }
  await page.screenshot({ path: resolve(OUT_DIR, 'r2a1-laundry-firstview.png') })
  console.log('Saved: r2a1-laundry-firstview.png')

  await browser.close()
  console.log('Done.')
}

main().catch((err) => {
  console.error('Screenshot script failed:', err)
  process.exit(1)
})
