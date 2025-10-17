import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: { timeout: 5000 },
  retries: 0,
  use: {
    trace: 'on-first-retry',
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8081',
  },
  webServer: [
    {
      command: 'npm run web',
      port: 8081,
      reuseExistingServer: !process.env.CI,
      cwd: '.',
      timeout: 120_000
    }
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
