import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/game/__tests__/**/*.ts'],
  },
});
