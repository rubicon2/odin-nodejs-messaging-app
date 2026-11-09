import type { Request } from 'express';
import type { ChatResource } from '../db/chatResource.mjs';
import type { InviteResource } from '../db/inviteResource.mjs';
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

/**
 * Any participant in a chat can edit it.
 */
export const canUpdateChat: CheckPermissionsFunction = (req) => {
  const { user, resource } = getUserAndResource<ChatResource>(req);
  return resource.participants
    .map((participant) => participant.id)
    .includes(user.id);
};

/**
 * The last remaining participant in a chat can delete it,
 * but we will only check if the user is ALLOWED to delete it
 * here. The check for being the last participant will happen
 * on the controller request handler.
 *
 * The reason being, if the user can't delete the chat because
 * there is more than one participant, we want to be able to
 * send a special message, not just "You are not authorized".
 * Something like "Cannot delete a chat with more than one user".
 */
export const canDeleteChat: CheckPermissionsFunction = (req) => {
  const { user, resource } = getUserAndResource<ChatResource>(req);
  return resource.participants
    .map((participant) => participant.id)
    .includes(user.id);
};

/**
 * User can create an invite to a chat if they are a participant.
 */
export const canPostInvite: CheckPermissionsFunction = (req) => {
  const { user, resource } = getUserAndResource<ChatResource>(req);
  return resource.participants
    .map((participant) => participant.id)
    .includes(user.id);
};

/**
 * User can delete an invite to a chat if they created it.
 */
export const canDeleteInvite: CheckPermissionsFunction = (req) => {
  const { user, resource } = getUserAndResource<InviteResource>(req);
  return resource.createdById === user.id;
};

export const canRespondToInvite: CheckPermissionsFunction = (req) => {
  const { user, resource } = getUserAndResource<InviteResource>(req);
  return resource.inviteeId === user.id;
};
