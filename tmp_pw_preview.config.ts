import { defineConfig, devices } from '@playwright/test'
const isMac = process.platform === 'darwin'
const macOnlyArgs = isMac ? ['--use-angle=metal', '--ignore-gpu-blocklist'] : []
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /tmp_fallback_verification\.spec\.ts$/,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  timeout: 360_000,
  use: {
    baseURL: 'http://127.0.0.1:4184',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            ...macOnlyArgs,
            '--enable-unsafe-swiftshader',
            '--no-sandbox',
            '--disable-setuid-sandbox',
          ],
        },
      },
    },
  ],
})
