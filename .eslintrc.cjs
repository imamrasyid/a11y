module.exports = {
    extends: 'eslint:recommended',
    env: {
        browser: true,
        es2020: true,
    },
    globals: {
        // The CSS Highlights constructor is newer than the browser globals this
        // ESLint version ships with. The branch reaching it is guarded on
        // `CSS.highlights`, so it only runs where the global exists.
        Highlight: 'readonly',
    },
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
    },
    rules: {
        'no-unused-vars': 'warn',
        'no-console': 'warn',
        'eqeqeq': 'error',
        'curly': 'error',
    },
    overrides: [
        {
            // Harness code runs in Node; the widget never does.
            files: ['test/**/*.js'],
            env: { node: true },
        },
    ],
};
