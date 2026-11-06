import type { Prisma } from '@repo/db/prisma/client';
import type { InviteDefaultArgs } from '@repo/db/prisma/models';
import { basicUserResourceArgs } from './userResource.mjs';

/**
 * Includes all relevant details so that when a user
 * views a list of their invites, we can easily create
 * an interface that shows the name of the chat and
 * the people that are in it.
 */
export const inviteResourceArgs = {
  include: {
    chat: {
      select: {
        id: true,
        title: true,
        participants: {
          ...basicUserResourceArgs,
          orderBy: [
            {
              handle: 'asc',
            },
          ],
        },
      },
    },
    createdBy: basicUserResourceArgs,
    invitee: basicUserResourceArgs,
  },
} satisfies InviteDefaultArgs;

export type InviteResource = Prisma.InviteGetPayload<typeof inviteResourceArgs>;

/**
 * A pared down resource that we can include on
 * other resources, like the chat itself.
 */
export const basicInviteResourceArgs = {
  select: {
    chat: {
      select: {
        id: true,
        title: true,
      },
    },
    createdAt: true,
    createdBy: basicUserResourceArgs,
    invitee: basicUserResourceArgs,
  },
} satisfies InviteDefaultArgs;

export type BasicInviteResource = Prisma.InviteGetPayload<
  typeof basicInviteResourceArgs
>;
