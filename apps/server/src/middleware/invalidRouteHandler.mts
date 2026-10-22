import type { RequestHandler } from 'express';
import * as createJSON from '../ext/responseJson.mjs';

export const invalidRouteHandler: RequestHandler = (_req, res) => {
  return res.status(404).json(createJSON.fail({}, 'Not found'));
};
