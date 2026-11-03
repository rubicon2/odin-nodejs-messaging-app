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
import { preprocesses as arrayPreprocesses } from './array.mjs';
import { sortOrderErrorMsg } from './errors.mjs';
import { fields as numberFields } from './number.mjs';

const sortOrder = z.coerce
  .string()
  .refine((v) => v === 'asc' || v === 'desc', {
    error: sortOrderErrorMsg(),
    path: ['sortOrder'],
  })
  .transform((v) => v as 'asc' | 'desc');

type SortOrder = z.infer<typeof sortOrder>;

const searchParams = z.object({
  take: numberFields.positiveInt.default(10),
  skip: numberFields.positiveInt.default(0),
  cursor: z.coerce.string().optional(),
  q: z.coerce.string().optional(),
  // By default, sort by id so we have consistent ordering.
  orderBy: arrayPreprocesses.ensureArray(z.coerce.string()).default(['id']),
  sortOrder: arrayPreprocesses.ensureArray(sortOrder).default(['asc']),
});

type SearchParams = z.infer<typeof searchParams>;

type SearchUserSortColumn =
  | 'id'
  | 'handle'
  | 'displayName'
  | 'createdAt'
  | 'updatedAt';

/**
 * Just so we can use to check if user-provided column
 * name is correct and easily create a list for the error.
 */
const searchUserSortColumns: SearchUserSortColumn[] = [
  'id',
  'handle',
  'displayName',
  'createdAt',
  'updatedAt',
];

const searchUserSortColumn = z.coerce
  .string()
  .refine((v) => searchUserSortColumns.includes(v as SearchUserSortColumn), {
    error: `Can only order by: ${searchUserSortColumns.join(', ')}`,
    path: ['orderBy'],
  })
  .transform((v) => v as SearchUserSortColumn);

/**
 * Same as regular searchParams, but different
 * default orderBy and sortOrder parameters.
 */
const searchUserParams = searchParams.extend({
  orderBy: arrayPreprocesses
    .ensureArray(searchUserSortColumn)
    .default(['handle']),
  sortOrder: arrayPreprocesses.ensureArray(sortOrder).default(['asc']),
});

type SearchUserParams = z.infer<typeof searchUserParams>;

export const fields = {
  sortOrder,
  searchUserSortColumn,
};

export const chains = {
  searchParams,
  searchUserParams,
};

export type { SearchParams, SearchUserParams, SortOrder };
