import * as z from 'zod';

/**
 * Pass schema for that is required for the array elements.
 * So ensureArray(z.coerce.string) will return an array of
 * coerced strings, or a preprocess or refinement, or anything
 * zod can be passed to it and it works as expected.
 */
function ensureArray<T extends z.ZodType>(elementSchema: T) {
  return z.preprocess(
    (value) => (Array.isArray(value) ? value : [value]),
    z.array(elementSchema),
  );
}

export const preprocesses = {
  ensureArray,
};
