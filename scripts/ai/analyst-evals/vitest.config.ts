import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('../../../src', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    include: ['scripts/ai/analyst-evals/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
  },
});
