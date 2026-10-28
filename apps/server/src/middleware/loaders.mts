import * as createResponseBody from '@repo/response-json';
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

/**
 * A resource loader just tries to get something
 * from the database and returns it with the
 * correct includes and omissions.
 */
type ResourceLoader = (resourceId: string) => unknown;

export const loadUserResource: ResourceLoader = async (resourceId: string) => {
  const user = await db.user.findUnique({
    where: {
      id: resourceId,
    },
    omit: userResourceOmit,
  });

  return user;
};

export const loadResource =
  (paramName: string, loader: ResourceLoader): RequestHandler =>
  async (req, res, next) => {
    try {
      const paramValue = req.params[paramName];

      if (paramValue === undefined) {
        throw new Error(`req.params.${paramName} is undefined`);
      }

      if (Array.isArray(paramValue)) {
        throw new Error(
          `req.params.${paramName} is an array. There should only be one instance of ${paramName} in the URL`,
        );
      }

      // This will try to load the resource with the callback for the specific resource type.
      const resource = await loader(paramValue);

      // If the resource is not present, then the id is not valid.
      if (!resource) {
        res.status(404).json(createResponseBody.fail('Not found'));
      }

      // Otherwise, call the next middleware with the loaded resource.
      req.resource = resource;
      return next();
    } catch (error) {
      return next(error);
    }
  };
