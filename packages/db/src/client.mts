import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';
import 'dotenv/config';

/**
 * Was considering passing a connection string as a parameter
 * as demonstrated in some prisma examples, but isn't this
 * entire package tied to the database url in its own env
 * file since it is used in the prisma config?
 */
export function createClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}
