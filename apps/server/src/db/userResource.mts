import type { Prisma } from '@repo/db/prisma/client';
import type { UserOmit } from '@repo/db/prisma/models';

/**
 * Include this on prisma queries to ensure
 * consistency on returned resources.
 */
export const userResourceOmit = {
  hash: true,
} satisfies UserOmit;

/**
 * The type that should be returned to client.
 */
export type UserResource = Prisma.UserGetPayload<{
  omit: typeof userResourceOmit;
}>;
