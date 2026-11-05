import type { Prisma } from '@repo/db/prisma/client';
import type { UserDefaultArgs, UserOmit } from '@repo/db/prisma/models';

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

/**
 * For when only basic user details are required. For example,
 * users will be included many times on a chat (i.e. created
 * by, and on each included message), so this is a pared down
 * user with only fields necessary to display the handle/name
 * of a message's sender, or the names of users on the invite
 * list.
 */
export const basicUserResourceArgs = {
  select: {
    id: true,
    handle: true,
    displayName: true,
  },
} satisfies UserDefaultArgs;

export type BasicUserResource = Prisma.UserGetPayload<
  typeof basicUserResourceArgs
>;
