import { defineConfig } from 'vitest/config';

export const intConfig = defineConfig({
  test: {
    include: ['./**/int/**/*.spec.*', './**/int/**/*.test.*'],
    fileParallelism: false,
  },
});
