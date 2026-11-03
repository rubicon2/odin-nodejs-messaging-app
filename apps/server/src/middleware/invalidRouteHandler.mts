import * as createResponseBody from '@repo/response-json';
import type { RequestHandler } from 'express';

export const invalidRouteHandler: RequestHandler = (_req, res) => {
  return res.status(404).json(createResponseBody.fail('Not found'));
};
