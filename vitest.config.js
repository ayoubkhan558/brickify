import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './tests/setup.js',
        include: ['tests/**/*.test.js', 'src/__tests__/**/*.test.js'],
        coverage: {
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'tests/',
                '**/*.config.js'
            ]
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@src': path.resolve(__dirname, './src'),
            '@config': path.resolve(__dirname, './src/config'),
            '@utils': path.resolve(__dirname, './src/lib'),
            '@lib': path.resolve(__dirname, './src/lib'),
            '@components': path.resolve(__dirname, './src/components'),
            '@contexts': path.resolve(__dirname, './src/contexts'),
            '@services': path.resolve(__dirname, './src/services'),
            '@generator': path.resolve(__dirname, './src/Generator'),
            '@assets': path.resolve(__dirname, './src/assets')
        }
    }
});
