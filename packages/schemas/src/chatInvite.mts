import * as z from 'zod';
import * as errors from './errors.mjs';

const invitedUserId = z.string(errors.requiredErrorMsg());

const post = z.object({
  invitedUserId,
});

type PostData = z.infer<typeof post>;

export const fields = {
  invitedUserId,
};

export const chains = {
  post,
};

export type { PostData };
