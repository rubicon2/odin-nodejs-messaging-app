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

