import * as createResponseBody from '@repo/response-json';
import type { RequestHandler } from 'express';

export const isAuth: RequestHandler = (req, res, next) => {
  try {
    if (req.tokenData === undefined) {
      return res
        .status(401)
        .json(createResponseBody.fail('You are not logged in'));
    }

    // If user is authorized, we are ok to access the next middleware.
    return next();
  } catch (error) {
    return next(error);
  }
};
