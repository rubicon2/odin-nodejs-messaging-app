import { chains as coreChains } from '@repo/schemas/user';
import { db } from '../db.mjs';

// These chains extend the @repo/schemas with server side checks.

// Need to be able to pass an array of exceptions to this, so
// it can ignore them, so we can ignore a conflicting handle
// if we are updating one handle just to its existing value
// (e.g. in PUT and PATCH, we want to check against other
// user's handles, not the handle of the user we are updating).
const isHandleAvailable =
  (ignoreIds: string[] = []) =>
  async (data: { handle?: string }) => {
    if (data.handle === undefined) return false;

    const existingHandle = await db.user.findFirst({
      where: {
        id: {
          notIn: ignoreIds,
        },
        handle: data.handle,
      },
    });

    if (existingHandle) return false;
    return true;
  };

const handleTakenError = {
  error: 'That handle is already in use',
  path: ['handle'],
};
const signup = coreChains.signup.refine(isHandleAvailable(), handleTakenError);
const updateAll = coreChains.updateAll.refine(
  isHandleAvailable(),
  handleTakenError,
);
const updatePartial = coreChains.updatePartial.refine(
  isHandleAvailable(),
  handleTakenError,
);

export const refinements = {
  isHandleAvailable,
};

export const chains = {
  signup,
  updateAll,
  updatePartial,
};
