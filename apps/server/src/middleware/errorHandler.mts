import * as createResponseBody from '@repo/response-json';
import type { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  // Log error to console for debugging.
  console.error(error);
  // But do not divulge internal workings to consumers.
  return res
    .status(500)
    .json(createResponseBody.error('An internal error occurred'));
};
