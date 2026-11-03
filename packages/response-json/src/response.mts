import type { ValidationErrors } from '@repo/validation/zod';

export interface PagedResponseMeta {
  total: number;
  pageSize: number;
  totalPages: number;
  currentPage: number;
  currentOffset: number;
  atFirstPage: boolean;
  atLastPage: boolean;
}

export function pagedResponseMeta(
  total: number,
  take: number,
  skip: number,
): PagedResponseMeta {
  const pageSize = take;
  const currentOffset = Math.min(skip, total);
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const currentPage = Math.min(
    Math.floor(currentOffset / pageSize + 1),
    totalPages,
  );
  return {
    total,
    pageSize,
    totalPages,
    currentPage,
    currentOffset,
    atFirstPage: total === 0 || currentOffset === 0,
    atLastPage: currentPage === totalPages,
  };
}

export interface SuccessResponseBody {
  status: 'success';
  data: Record<string, unknown>;
  message?: string | undefined;
}

export function success(
  data: Record<string, unknown>,
  message?: string,
): SuccessResponseBody {
  return {
    status: 'success',
    message,
    data,
  };
}

export interface SuccessResponseBodySingle<T> extends SuccessResponseBody {
  data: {
    item: T;
  };
}

export function successSingle<T>(
  item: T,
  message?: string,
): SuccessResponseBodySingle<T> {
  return {
    status: 'success',
    message,
    data: {
      item,
    },
  };
}

export interface SuccessResponseBodyPaged<T> extends SuccessResponseBody {
  data: {
    meta: PagedResponseMeta;
    results: T[];
  };
}

export function successPaged<T>(
  meta: PagedResponseMeta,
  results: T[],
  message?: string,
): SuccessResponseBodyPaged<T> {
  return {
    status: 'success',
    message,
    data: {
      meta,
      results,
    },
  };
}

export interface FailResponseBody {
  status: 'fail';
  message: string;
}

/**
 * A general purpose fail body which
 * can be used for things like 404's.
 */
export function fail(message: string): FailResponseBody {
  return {
    status: 'fail',
    message,
  };
}

/**
 * A fail validation response body should be
 * sent when the user provides invalid input.
 */
export interface FailValidationResponseBody<T> {
  status: 'fail-validation';
  data: ValidationErrors<T>;
  message?: string | undefined;
}

export function failValidation<T>(
  data: ValidationErrors<T>,
  message?: string,
): FailValidationResponseBody<T> {
  return {
    status: 'fail-validation',
    message,
    data,
  };
}

/**
 * An error response body should be sent
 * upon encountering an unexpected error.
 */
export interface ErrorResponseBody {
  status: 'error';
  message: string;
}

export function error(message: string): ErrorResponseBody {
  return {
    status: 'error',
    message,
  };
}
