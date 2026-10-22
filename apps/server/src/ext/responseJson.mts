import type * as ResponseTypes from '@repo/types/response';

export default function pagedResponseMeta(
  total: number,
  take: number,
  skip: number,
): ResponseTypes.PagedResponseMeta {
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

export function success(
  data: Record<string, unknown>,
  message?: string,
): ResponseTypes.SuccessResponseBody {
  return {
    status: 'success',
    message,
    data,
  };
}

export function successSingle<T>(
  item: T,
  message?: string,
): ResponseTypes.SuccessResponseBodySingle<T> {
  return {
    status: 'success',
    message,
    data: {
      item,
    },
  };
}

export function successPaged<T>(
  meta: ResponseTypes.PagedResponseMeta,
  results: T[],
  message?: string,
): ResponseTypes.SuccessResponseBodyPaged<T> {
  return {
    status: 'success',
    message,
    data: {
      meta,
      results,
    },
  };
}

export function fail(
  data: Record<string, unknown>,
  message?: string,
): ResponseTypes.FailResponseBody {
  return {
    status: 'fail',
    message,
    data,
  };
}

export function error(message: string): ResponseTypes.ErrorResponseBody {
  return {
    status: 'error',
    message,
  };
}
