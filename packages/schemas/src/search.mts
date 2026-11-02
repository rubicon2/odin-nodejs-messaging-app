/**
 * These schemas are for making searches at GET endpoints,
 * with url search parameters.
 *
 * Will definitely be used on server side once the search
 * parameters have been parsed into an object, but may or may
 * not be used on client side. Depends on how the search is
 * run, e.g. whether submitting a form (in which case all
 * fields will be of type string names of params with the
 * same name will be in fields like "orderBy[0]", "orderBy[1]")
 * or with JSON (where other values are possible, as well as
 * arrays and nesting).
 */

import * as z from 'zod';
import { intErrorMsg, numberErrorMsg, sortOrderErrorMsg } from './errors.mjs';

const sortOrder = z.coerce
  .string()
  .refine((v) => v === 'asc' || v === 'desc', {
    error: sortOrderErrorMsg(),
    path: ['sortOrder'],
  })
  .transform((v) => v as 'asc' | 'desc');

type SortOrder = z.infer<typeof sortOrder>;

const searchParams = z.object({
  take: z.coerce.number(numberErrorMsg()).int(intErrorMsg()).default(10),
  skip: z.coerce.number(numberErrorMsg()).int(intErrorMsg()).default(0),
  cursor: z.coerce.string().optional(),
  q: z.coerce.string().optional(),
  // By default, sort by id so we have consistent ordering.
  orderBy: z.array(z.coerce.string()).default(['id']),
  sortOrder: z.array(sortOrder).default(['asc']),
});

type SearchParams = z.infer<typeof searchParams>;

export const fields = {
  sortOrder,
};

export const chains = {
  searchParams,
};

export type { SearchParams, SortOrder };
