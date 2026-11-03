import type { Request } from 'express';
import type { UserResource } from '../db/userResource.mjs';
import type { CheckPermissionsFunction } from '../middleware/permissions.mjs';

/**
 * Just a convenience function so we don't
 * have to write this code over and over in
 * each permission function.
 */
function getUser(req: Request) {
  if (req.user === undefined) {
    throw new Error('req.user is undefined');
  }

  return req.user;
}

/**
 * Just a convenience function so we can pass just
 * a request to each CheckPermissionsFunction instead
 * of having to check their existence and casting the
 * resource to its correct type before calling the
 * CheckPermissionsFunction.
 *
 * Not all permission functions will require a resource
 * to be loaded, so this is its own separate function and
 * can be called when needed.
 */
function getResource<T>(req: Request) {
  if (req.resource === undefined) {
    throw new Error('req.resource is undefined');
  }

  return req.resource as T;
}

/**
 * Yet another convenient convenience function
 * basically because I like the destructuring
 * syntax in the check permission functions.
 * It just looks so succinct.
 */
function getUserAndResource<T>(req: Request) {
  const user = getUser(req);
  const resource = getResource<T>(req);
  return { user, resource };
}

/**
 * User is only allowed to update themselves.
 */
export const canUpdateUser: CheckPermissionsFunction = (req) => {
  const { user, resource } = getUserAndResource<UserResource>(req);
  return user.id === resource.id;
};
