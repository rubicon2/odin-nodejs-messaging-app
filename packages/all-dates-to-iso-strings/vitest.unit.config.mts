import { unitConfig } from '@repo/vitest-config/unit';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  unitConfig,
  defineConfig({
    test: {
      include: ['src/**/*.test.mts'],
    },
  }),
);
