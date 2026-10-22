export interface PagedResponseMeta {
  total: number;
  pageSize: number;
  totalPages: number;
  currentPage: number;
  currentOffset: number;
  atFirstPage: boolean;
  atLastPage: boolean;
}

export interface SuccessResponseBody {
  status: 'success';
  data: Record<string, unknown>;
  message?: string | undefined;
}

export interface SuccessResponseBodySingle<T> extends SuccessResponseBody {
  data: {
    item: T;
  };
}

export interface SuccessResponseBodyPaged<T> extends SuccessResponseBody {
  data: {
    meta: PagedResponseMeta;
    results: T[];
  };
}

export interface FailResponseBody {
  status: 'fail';
  data: Record<string, unknown>;
  message?: string | undefined;
}

export interface ErrorResponseBody {
  status: 'error';
  message: string;
}
