import path from 'node:path';
import { intConfig } from '@repo/vitest-config/int';
import dotenv from 'dotenv';

dotenv.config({
  path: path.resolve(process.cwd(), '.env.test'),
});

export default intConfig;
