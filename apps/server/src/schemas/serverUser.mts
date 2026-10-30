import { chains as coreChains } from '@repo/schemas/user';
import { client as db } from '../db/client.mjs';

// These chains extend the @repo/schemas with server side checks.

// Need to be able to pass an array of exceptions to this, so
// it can ignore them, so we can ignore a conflicting handle
// if we are updating one handle just to its existing value
// (e.g. in PUT and PATCH, we want to check against other
// user's handles, not the handle of the user we are updating).
const isHandleAvailable =
  (ignoreIds: string[] = []) =>
  async (data: { handle: string }) => {
    const existingHandle = await db.user.findFirst({
      where: {
        id: {
          notIn: ignoreIds,
        },
        handle: {
          equals: data.handle,
          mode: 'insensitive',
        },
      },
    });

    if (existingHandle) return false;
    return true;
  };

const handleTakenError = {
  error: 'That handle is already in use',
  path: ['handle'],
};

// Signup doesn't need to be a function, but just for consistency.
const signup = () =>
  coreChains.signup.refine(isHandleAvailable(), handleTakenError);
const updateAll = (ignoreIds: string[] = []) =>
  coreChains.updateAll.refine(isHandleAvailable(ignoreIds), handleTakenError);
const updatePartial = (ignoreIds: string[] = []) =>
  coreChains.updatePartial.refine((data) => {
    /**
     * Unpacking handle so after undefined check, type is string.
     * Type inference doesn't work on data object and giving it
     * straight to isHandleAvailable refinement gives a type error.
     */
    const handle = data.handle;
    // If undefined, then skip isHandleAvailable check since we are not updating it.
    if (handle === undefined) return true;
    else return isHandleAvailable(ignoreIds)({ handle });
  }, handleTakenError);

export const refinements = {
  isHandleAvailable,
};

export const chains = {
  signup,
  updateAll,
  updatePartial,
};
