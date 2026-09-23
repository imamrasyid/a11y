import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        include: ['test/unit/**/*.test.js'],
        setupFiles: ['test/unit/setup.js'],
        restoreMocks: true,
    },
});
