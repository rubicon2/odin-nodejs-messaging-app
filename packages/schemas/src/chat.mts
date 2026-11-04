import * as z from 'zod';
import { preprocesses as arrayPreprocesses } from './array.mjs';
import * as errors from './errors.mjs';

const titleLength = { min: 1, max: 50 };

const createdByUserId = z.string(errors.requiredErrorMsg());

const invitedUserIds = arrayPreprocesses
  .ensureArray(z.string(errors.requiredErrorMsg()))
  .refine((value) => value.length !== 0, 'Requires at least one user');

const title = z
  .string(errors.requiredErrorMsg())
  .min(titleLength.min, errors.lengthErrorMsg(titleLength.min, titleLength.max))
  .max(
    titleLength.max,
    errors.lengthErrorMsg(titleLength.min, titleLength.max),
  );

const post = z.object({
  createdByUserId,
  invitedUserIds,
  title,
});

type PostData = z.infer<typeof post>;

const updateAll = z.object({
  title,
});

type UpdateAllData = z.infer<typeof updateAll>;

const updatePartial = z
  .object({
    title: title.optional(),
  })
  .default({});

type UpdatePartialData = z.infer<typeof updatePartial>;

export const fields = {
  createdByUserId,
  invitedUserIds,
  title,
};

export const chains = {
  post,
  updateAll,
  updatePartial,
};

export type { PostData, UpdateAllData, UpdatePartialData };
