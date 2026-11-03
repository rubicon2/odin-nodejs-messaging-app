import * as z from 'zod';

export type ValidationErrors<T> = z.core.$ZodErrorTree<T>;

export function createValidationErrors<T>(
  error: z.core.$ZodError<T>,
): z.core.$ZodErrorTree<T> {
  return z.treeifyError(error);
}
