import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',      // нужен DOM для React testing-library
    globals: true,             // включает глобальные test/describe/expect
    setupFiles: './src/setupTests.ts', // файл для jest-dom и других глоб. настроек
    include: ['src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}', 'src/**/__tests__/**/*.ts?(x)'],
    isolate: true,
  },
});
