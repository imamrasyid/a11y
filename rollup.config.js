import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

const banner = `/*!
 * a11y-widget v1.0.0
 * Modular accessibility widget — WCAG 2.1 AA
 * (c) ${new Date().getFullYear()} MIT License
 */`;

const input = 'src/index.js';

export default [
    // ESM
    {
        input,
        output: {
            file: 'dist/a11y-widget.esm.js',
            format: 'esm',
            banner,
            sourcemap: true,
        },
        plugins: [resolve()],
    },
    // CJS
    {
        input,
        output: {
            file: 'dist/a11y-widget.cjs.js',
            format: 'cjs',
            exports: 'default',
            banner,
            sourcemap: true,
        },
        plugins: [resolve()],
    },
    // UMD
    {
        input,
        output: {
            file: 'dist/a11y-widget.umd.js',
            format: 'umd',
            name: 'A11yWidget',
            banner,
            sourcemap: true,
        },
        plugins: [resolve()],
    },
    // UMD minified
    {
        input,
        output: {
            file: 'dist/a11y-widget.umd.min.js',
            format: 'umd',
            name: 'A11yWidget',
            banner,
            sourcemap: true,
        },
        plugins: [resolve(), terser({ format: { comments: /^!/ } })],
    },
];
