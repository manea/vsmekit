import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4226',
    headless: true,
    launchOptions: {
      executablePath: '/usr/bin/google-chrome',
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    },
    trace: 'retain-on-failure',
  },
  webServer: {
    command:
      'rm -rf ./test-results/pw-data && HOST=127.0.0.1 PORT=4226 BASE_PATH= VSMEKIT_DATA_DIR=./test-results/pw-data node --no-warnings server/index.mjs',
    url: 'http://127.0.0.1:4226/health',
    reuseExistingServer: false,
    timeout: 60000,
  },
});
