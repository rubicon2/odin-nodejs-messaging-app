import type { Prisma } from '@repo/db/prisma/client';
import type { UserOmit } from '@repo/db/prisma/models';
import { client } from './client.mjs';

/**
 * The prisma client should only be used in db folder,
 * so if it ever gets ripped out and replaced we won't
 * have to go through the entire codebase. So no need
 * to export this.
 */
const userResourceOmit = {
  hash: true,
} satisfies UserOmit;

export type UserResource = Prisma.UserGetPayload<{
  omit: typeof userResourceOmit;
}>;

export interface UserData {
  handle: string;
  displayName: string;
  hash: string;
}

export async function create({
  handle,
  displayName,
  hash,
}: UserData): Promise<UserResource> {
  const user = await client.user.create({
    data: {
      handle,
      displayName,
      hash,
    },
    omit: userResourceOmit,
  });
  return user;
}

export async function update(
  userId: string,
  { handle, displayName, hash }: Partial<UserData>,
): Promise<UserResource> {
  const user = await client.user.update({
    where: {
      id: userId,
    },
    data: {
      handle,
      displayName,
      hash,
    },
    omit: userResourceOmit,
  });
  return user;
}

export async function del(userId: string): Promise<UserResource> {
  /**
   * We may run into an issue where a client sends two requests to
   * delete a user within a few milliseconds, and between loading
   * the user or checking it exists, and then deleting it, one
   * request will have been fulfilled, and the second will try to
   * delete something that doesn't exist, resulting in an error.
   * Prisma's deleteMany method provides a userful way to do that
   * without throwing any errors, but we can't get the deleted user
   * with that method. For now, just do this in the simplest and
   * most obvious way until it becomes a problem.
   */
  const user = await client.user.delete({
    where: {
      id: userId,
    },
    omit: userResourceOmit,
  });

  return user;
}

