import { chains as coreChains } from '@repo/schemas/chat';
import { refinements } from './id.mjs';

// These chains extend the @repo/schemas with server side checks.

const post = () =>
  coreChains.post.superRefine(async (data, ctx) => {
    const invitedUserIds = data.invitedUserIds;
    for (let i = 0; i < invitedUserIds.length; i++) {
      const userId = invitedUserIds[i];
      /**
       * Since invitedUserIds array needs a string and I chose
       * not to coerce undefined into a string, null or undefined
       * should not reach this super refine function. So just
       * skip over if falsy.
       */
      if (!userId) continue;
      const isUserIdValid = await refinements.userId(userId);
      if (!isUserIdValid) {
        ctx.addIssue({
          code: 'custom',
          message: 'User does not exist',
          path: ['invitedUserIds', i],
        });
      }
    }
  });

/**
 * These are the same since all they change is
 * the title, but re-export for convenience.
 */
const updateAll = () => coreChains.updateAll;
const updatePartial = () => coreChains.updatePartial;

export const chains = {
  post,
  updateAll,
  updatePartial,
};
