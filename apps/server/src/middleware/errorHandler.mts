import type { ErrorRequestHandler } from 'express';
import * as createJSON from '../ext/responseJson.mjs';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  // Log error to console for debugging.
  console.error(error);
  // But do not divulge internal workings to consumers.
  return res.status(500).json(createJSON.error('An internal error occurred'));
};
