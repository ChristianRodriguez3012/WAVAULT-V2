import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  use: {
    baseURL: 'https://reimagined-meme-xg7pqwjrp5r2vr6q-3000.app.github.dev',
  },

  projects: [
    {
      name: 'Chrome-LambdaTest',
      use: {
        browserName: 'chromium',
        connectOptions: {
          wsEndpoint: `wss://cdp.lambdatest.com/playwright?capabilities=${encodeURIComponent(JSON.stringify({
            browserName: 'Chrome',
            browserVersion: 'latest',
            snapshot: true,
            video: true,
            visual: true,
            platform: 'Windows 11',
            resolution: '1920x1080',
            network: true,
            consoleLogs: 'info',
            selenium_version: '4.0.0',
            name: 'Prueba Playwright en LambdaTest',
            build: 'WAVAULT BUILD',
            user: process.env.LT_USERNAME,
            accessKey: process.env.LT_ACCESS_KEY
          }))}`
        }
      }
    }
  ]
});
