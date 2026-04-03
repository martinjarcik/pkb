import { defineConfig, devices } from '@playwright/test'

const port = process.env.PLAYWRIGHT_PORT ?? '3000'
const baseURL = `http://localhost:${port}`
const e2eConfigPath = 'data/e2e-app-config.yaml'
const webServerCommand = process.env.CI
  ? `sh -c 'rm -f ${e2eConfigPath} && PKB_APP_CONFIG_PATH=${e2eConfigPath} npm run build && PKB_APP_CONFIG_PATH=${e2eConfigPath} npm run preview -- --port ${port}'`
  : `sh -c 'rm -f ${e2eConfigPath} && PKB_APP_CONFIG_PATH=${e2eConfigPath} npm run dev -- --port ${port}'`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: webServerCommand,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
})
