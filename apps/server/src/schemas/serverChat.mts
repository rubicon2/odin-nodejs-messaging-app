import { chains as coreChains } from '@repo/schemas/chat';
import { refinements } from './id.mjs';

// These chains extend the @repo/schemas with server side checks.

const post = () =>
  coreChains.post
    .refine(
      (data) => {
        return refinements.userId(data.createdByUserId);
      },
      { error: 'User does not exist', path: ['createdByUserId'] },
    )
    .superRefine(async (data, ctx) => {
      const invitedUserIds = data.invitedUserIds;
      for (let i = 0; i < invitedUserIds.length; i++) {
        const userId = invitedUserIds[i];
        if (userId === undefined) {
          ctx.addIssue({
            code: 'custom',
            message: 'undefined is not a valid user id',
            path: ['invitedUserIds', i],
          });
          continue;
        }
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
