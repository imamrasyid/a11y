import { defineConfig } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
    testDir: 'test/e2e',
    fullyParallel: false,
    // Each axe scan injects ~500 KB of JS into the page; sharing one browser
    // worker keeps those scans from starving each other on a CI runner.
    workers: 1,
    retries: process.env.CI ? 2 : 0,
    reporter: 'list',
    use: {
        baseURL: `http://127.0.0.1:${PORT}`,
        headless: true,
    },
    projects: [
        { name: 'chromium', use: { browserName: 'chromium' } },
    ],
    webServer: {
        command: `node test/server.js ${PORT}`,
        port: PORT,
        reuseExistingServer: !process.env.CI,
        timeout: 30000,
    },
});
