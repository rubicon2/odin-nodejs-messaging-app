import type { Prisma } from '@repo/db/prisma/client';
import type { ChatDefaultArgs } from '@repo/db/prisma/models';
import { basicUserResourceArgs } from './userResource.mjs';

/**
 * This does not include messages. The rationale is,
 * this resource can be used for general chat details
 * like a list of user chats, and in cases like that
 * having all the messages (of which there could be
 * thousands) would be totally unecessary.
 */
export const chatResourceArgs = {
  include: {
    createdBy: basicUserResourceArgs,
    invites: {
      include: {
        createdBy: basicUserResourceArgs,
        invitee: basicUserResourceArgs,
      },
      orderBy: [
        {
          invitee: {
            handle: 'asc',
          },
        },
      ],
    },
    participants: {
      select: basicUserResourceArgs.select,
      orderBy: [
        {
          handle: 'asc',
        },
      ],
    },
  },
} satisfies ChatDefaultArgs;

export type ChatResource = Prisma.ChatGetPayload<typeof chatResourceArgs>;
