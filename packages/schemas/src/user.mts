import * as errors from './errors.mjs';

import * as z from 'zod';

const handleLength = { min: 1, max: 50 };
const displayNameLength = { min: 1, max: 50 };
const passwordLength = { min: 8, max: 100 };

const handle = z
  .string(errors.requiredErrorMsg())
  .min(
    handleLength.min,
    errors.lengthErrorMsg(handleLength.min, handleLength.max),
  )
  .max(
    handleLength.max,
    errors.lengthErrorMsg(handleLength.min, handleLength.max),
  )
  .regex(/^[a-zA-Z0-9_]+$/, errors.alphanumericErrorMsg());

const displayName = z
  .string(errors.requiredErrorMsg())
  .min(
    displayNameLength.min,
    errors.lengthErrorMsg(displayNameLength.min, displayNameLength.max),
  )
  .max(
    displayNameLength.max,
    errors.lengthErrorMsg(displayNameLength.min, displayNameLength.max),
  );

const password = z
  .string(errors.requiredErrorMsg())
  .min(
    passwordLength.min,
    errors.lengthErrorMsg(passwordLength.min, passwordLength.max),
  )
  .max(
    passwordLength.max,
    errors.lengthErrorMsg(passwordLength.min, passwordLength.max),
  )
  // Split checks into separate regexes so only relevant errors are shown.
  // This way, it will be more obvious to the user what they need to do.
  .regex(/(?=.*[A-Z]+)/, 'Should use at least one uppercase character')
  .regex(/(?=.*[a-z]+)/, 'Should use at least one lowercase character')
  .regex(/(?=.*[0-9])/, 'Should use at least one number')
  .regex(/(?=.*[@$!%*?&])/, 'Should use at least one special character');

const login = z.object({
  // When logging in, don't need to check against
  // requirements, just make sure they are there.
  handle: z.string(errors.requiredErrorMsg()),
  password: z.string(errors.requiredErrorMsg()),
});

const signup = z
  .object({
    handle,
    displayName,
    password,
    passwordConfirm: password,
  })
  .refine((data) => data.password === data.passwordConfirm, {
    error: 'Passwords do not match',
    path: ['passwordConfirm'],
  });

const updateAll = signup;

const updatePartial = z
  .object({
    handle: handle.optional(),
    displayName: displayName.optional(),
    password: password.optional(),
    passwordConfirm: password.optional(),
  })
  // So if both passwords are undefined, no error as not trying to update.
  .refine((data) => data.password === data.passwordConfirm, {
    error: 'Passwords do not match',
    path: ['passwordConfirm'],
  });

export const fields = {
  handle,
  displayName,
  password,
};

export const chains = {
  login,
  signup,
  updateAll,
  updatePartial,
};
