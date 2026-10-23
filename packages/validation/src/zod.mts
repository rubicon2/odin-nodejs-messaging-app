import type { ZodError } from 'zod';
import * as z from 'zod';
import type { $ZodErrorTree } from 'zod/v4/core';

export type ValidationErrors<T> = $ZodErrorTree<T>;

export function createValidationErrors<T>(
  error: ZodError<T>,
): $ZodErrorTree<T> {
  return z.treeifyError(error);
}
