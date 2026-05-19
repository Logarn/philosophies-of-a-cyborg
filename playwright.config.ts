import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './output/playwright/test-results',
  reporter: [['list'], ['html', { outputFolder: './output/playwright/report', open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4337',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: [
      'mkdir -p output/playwright/admin-fixture/src/content/essays output/playwright/admin-fixture/src/lib',
      'ADMIN_USERNAME=ositu ADMIN_PASSWORD_SHA256=5298122aefa24faac72d4d89c9ca3f716ad1004dc0a3d89ab652ff894ba29fa5 POC_REPO_ROOT="$PWD/output/playwright/admin-fixture" npm run dev -- --host 127.0.0.1 --port 4337'
    ].join(' && '),
    url: 'http://127.0.0.1:4337',
    reuseExistingServer: false,
    timeout: 120_000
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } }
    },
    {
      name: 'mobile',
      use: {
        ...devices['Desktop Chrome'],
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        hasTouch: true,
        isMobile: true
      }
    }
  ]
});
