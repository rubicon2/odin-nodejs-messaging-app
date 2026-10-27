import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';
import 'dotenv/config';

/**
 * Prisma doesn't bake in env variables when
 * building the client, so can pass a connection
 * string from the consuming package.
 */
export function createClient(connectionString?: string): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: connectionString ?? process.env.DATABASE_URL,
  });
  return new PrismaClient({ adapter });
}
