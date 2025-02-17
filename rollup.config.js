import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import polyfillNode from 'rollup-plugin-polyfill-node';
import inject from '@rollup/plugin-inject';

// Common plugins shared across all builds.
const commonPlugins = [
    polyfillNode(),
    inject({
        // When Rollup encounters `Buffer`, import it from the "buffer" package.
        Buffer: ['buffer', 'Buffer']
    }),
    resolve({ preferBuiltins: false }),
    commonjs()
];

export default [
    // 1. IIFE build for browsers (non-minified)
    {
        input: './index.js',
        output: {
            file: './dist/bundle.js',
            format: 'iife',
            name: 'sializer',
            sourcemap: true
        },
        plugins: commonPlugins
    },
    // 2. IIFE build for browsers (minified)
    {
        input: './index.js',
        output: {
            file: './dist/bundle.min.js',
            format: 'iife',
            name: 'sializer',
            sourcemap: true
        },
        plugins: [
            ...commonPlugins,
            terser() // Apply terser for minification.
        ]
    },
    // 3. CommonJS build for Node
    {
        input: './index.js',
        output: {
            file: './dist/bundle.cjs.js',
            format: 'cjs',
            sourcemap: true
        },
        plugins: commonPlugins
    },
    // 4. ES module build for bundlers
    {
        input: './index.js',
        output: {
            file: './dist/bundle.esm.js',
            format: 'esm',
            sourcemap: true
        },
        plugins: commonPlugins
    }
];
