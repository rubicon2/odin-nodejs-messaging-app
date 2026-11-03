import { defineConfig } from 'vitest/config';

export const unitConfig = defineConfig({
  test: {
    include: ['./**/unit/**/*.spec.*', './**/unit/**/*.test.*'],
  },
});
