module.exports = {
    env: {
        browser: true,
        es2020: true,
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
};
