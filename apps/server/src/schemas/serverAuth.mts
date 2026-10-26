import type { LoginData } from '@repo/schemas/auth';
import { chains as coreChains } from '@repo/schemas/auth';
import { client as db } from '../db/client.mjs';
import * as password from '../ext/password.mjs';

// These chains extend the @repo/schemas with server side checks.

const handleOrPasswordWrongError = {
  error: 'Handle and password do not match',
  path: ['handle'],
};

const doHandleAndPasswordMatch = () => async (data: LoginData) => {
  const existingUser = await db.user.findUnique({
    where: {
      handle: data.handle,
    },
  });

  if (!existingUser) return false;
  return password.compare(data.password, existingUser.hash);
};

/**
 * Login doesn't need to be a function but just
 * for consistency, make it so. The advantage of
 * checking the handle and password via schema is
 * that we can send the same format errors back to
 * the client.
 */
const login = () =>
  coreChains.login.refine(
    doHandleAndPasswordMatch(),
    handleOrPasswordWrongError,
  );

export const refinements = {
  doHandleAndPasswordMatch,
};

export const chains = {
  login,
};
