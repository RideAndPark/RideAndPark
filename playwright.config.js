import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5173'

export default defineConfig({
  testDir: './tests/e2e/specs',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    launchOptions: {
      slowMo: Number(process.env.PLAYWRIGHT_SLOW_MO || 0),
      args:
        process.env.PLAYWRIGHT_DEMO_MODE === 'true'
          ? [
              `--window-size=${process.env.PLAYWRIGHT_WINDOW_WIDTH || 1720},${process.env.PLAYWRIGHT_WINDOW_HEIGHT || 980}`,
              '--start-maximized',
            ]
          : [],
    },
  },
  webServer: {
    command: 'npm exec vite -- --host 127.0.0.1',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport:
          process.env.PLAYWRIGHT_DEMO_MODE === 'true'
            ? {
                width: Number(process.env.PLAYWRIGHT_VIEWPORT_WIDTH || 1600),
                height: Number(process.env.PLAYWRIGHT_VIEWPORT_HEIGHT || 940),
              }
            : { width: 1440, height: 960 },
      },
    },
  ],
})
