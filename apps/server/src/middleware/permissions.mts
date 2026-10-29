import * as createResponseBody from '@repo/response-json';
import type { Request, RequestHandler } from 'express';

/**
 * Use any properties on the request to check
 * whether the user should be able to take the
 * requested action or not, and return a boolean.
 *
 * Can be an async function, in case further
 * database queries are required or something.
 *
 * E.g.
 * - Check the user and resource to see if they own it
 * - Check the body properties to check what resource fields the user is trying to edit
 */
export type CheckPermissionsFunction = (
  req: Request,
) => Promise<boolean> | boolean;

export function canDo(hasPermission: CheckPermissionsFunction): RequestHandler {
  const handler: RequestHandler = async (req, res, next) => {
    try {
      /**
       * hasPermission function will check if user or resource
       * exists, if it needs to. Not all permission functions
       * will need a resource loaded (e.g. POSTing anything).
       * I assume all will need a user, but since we are
       * providing a req anyway, no need to provide req
       * and req.user as separate arguments.
       */
      if (await hasPermission(req)) {
        return next();
      } else {
        return res
          .status(403)
          .json(
            createResponseBody.fail(
              'You are not authorized to take this action',
            ),
          );
      }
    } catch (error) {
      return next(error);
    }
  };

  return handler;
}
