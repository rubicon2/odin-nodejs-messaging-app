import * as z from 'zod';
import * as errors from './errors.mjs';

const login = z.object({
  // When logging in, don't need to check against
  // requirements, just make sure they are there.
  handle: z.string(errors.requiredErrorMsg()),
  password: z.string(errors.requiredErrorMsg()),
});

type LoginData = z.infer<typeof login>;

export const chains = {
  login,
};

export type { LoginData };
