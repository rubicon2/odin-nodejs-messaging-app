import type {
  ErrorResponseBody,
  FailResponseBody,
  PagedResponseMeta,
  SuccessResponseBody,
  SuccessResponseBodyPaged,
  SuccessResponseBodySingle,
} from '@repo/response-json';

export default function pagedResponseMeta(
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

export function fail(
  data: Record<string, unknown>,
  message?: string,
): FailResponseBody {
  return {
    status: 'fail',
    message,
    data,
  };
}

export function error(message: string): ErrorResponseBody {
  return {
    status: 'error',
    message,
  };
}
