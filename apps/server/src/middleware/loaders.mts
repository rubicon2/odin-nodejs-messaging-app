import type { RequestHandler } from 'express';
import { client as db } from '../db/client.mjs';
import { type UserResource, userResourceOmit } from '../db/userResource.mjs';

declare global {
  namespace Express {
    export interface Request {
      user?: UserResource;
      // Cast to type in request handler.
      resource?: unknown;
    }
  }
}

export const loadUser: RequestHandler = async (req, _res, next) => {
  try {
    if (req.tokenData === undefined) {
      throw new Error('req.tokenData is undefined');
    }

    const user = await db.user.findUnique({
      where: {
        handle: req.tokenData.handle,
      },
      omit: userResourceOmit,
    });

    if (!user) {
      throw new Error('User does not exist');
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
};
