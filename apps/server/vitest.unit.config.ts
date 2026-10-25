import { unitConfig } from '@repo/vitest-config/unit';
import { defineConfig, mergeConfig } from 'vitest/config';

/**
 * Some of the unit tests rely on the prisma client/database.
 * Some might say that the database should be mocked out, but
 * I disagree. Some of these tests are for functions whose
 * explicit purpose is to interface with the database, and
 * do it correctly. If you mock out the database client for
 * those tests, then you're not really testing anything.
 */

export default mergeConfig(
  unitConfig,
  defineConfig({
    test: {
      /*
       * Since some of the unit tests rely on a database,
       * fileParallelism needs to be false otherwise we
       * will get weird errors where the database hasn't
       * been cleared for each test properly.
       */
      fileParallelism: false,
    },
  }),
);
