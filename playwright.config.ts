import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright 配置
 * - 项目：
 *   - chromium（headless CI，不包含 real-browser 标签）
 *   - real-browser（headed，仅限本地/手动验证，包含 arena-smoke 等真实浏览器验证）
 * - baseURL: http://127.0.0.1:4173
 * - webServer: vite --mode e2e
 * - trace/screenshot/video: retain-on-failure
 * - 超时: 60s（单测试）/ 10s（全局 expect）
 * - retries: CI=1, 本地=0
 * - --use-angle=metal 仅在 process.platform === 'darwin' 时启用（Linux CI 不支持 Metal）
 */

const isMac = process.platform === 'darwin'

const macOnlyArgs = isMac
  ? [
      // macOS: force native Metal backend（OpenGL 已废弃，会导致 WebGL Context Lost）
      '--use-angle=metal',
      '--ignore-gpu-blocklist',
    ]
  : []

const sharedLaunchArgs = [
  ...macOnlyArgs,
  '--enable-unsafe-swiftshader',
  '--no-sandbox',
  '--disable-setuid-sandbox',
]

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
  },
  projects: [
    {
      name: 'chromium',
      grepInvert: /@real-browser/,
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: sharedLaunchArgs,
        },
      },
    },
    {
      name: 'real-browser',
      grep: /@real-browser/,
      use: {
        ...devices['Desktop Chrome'],
        headless: false,
        launchOptions: {
          args: sharedLaunchArgs,
        },
      },
    },
  ],
  webServer: {
    command: 'npm run dev:e2e -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
