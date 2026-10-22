import { chains as coreChains } from '@repo/schemas/user';
import { db } from '../db.mjs';

// These chains extend the @repo/schemas with server side checks.

const isHandleAvailable = async (data: { handle?: string }) => {
  if (data.handle === undefined) return false;

  const existingHandle = await db.user.findFirst({
    where: {
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
const signup = coreChains.signup.refine(isHandleAvailable, handleTakenError);
const updateAll = coreChains.updateAll.refine(
  isHandleAvailable,
  handleTakenError,
);
const updatePartial = coreChains.updatePartial.refine(
  isHandleAvailable,
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
