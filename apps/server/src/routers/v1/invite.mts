import { Router } from 'express';
import * as controller from '../../controllers/v1/invite.mjs';
import {
  canDeleteInvite,
  canPostInvite,
  canRespondToInvite,
} from '../../ext/checkPermissions.mjs';
import * as loaders from '../../middleware/loaders.mjs';
import { canDo } from '../../middleware/permissions.mjs';

export const invite = Router({ mergeParams: true })
  .post(
    '/',
    loaders.loadResource('chatId', loaders.loadChatResource),
    canDo(canPostInvite),
    controller.post,
  )
  .post(
    '/:inviteId/accept',
    loaders.loadResource('inviteId', loaders.loadInviteResource),
    canDo(canRespondToInvite),
    controller.accept,
  )
  .post(
    '/:inviteId/reject',
    loaders.loadResource('inviteId', loaders.loadInviteResource),
    canDo(canRespondToInvite),
    controller.reject,
  )
  .delete(
    '/:inviteId',
    loaders.loadResource('inviteId', loaders.loadInviteResource),
    canDo(canDeleteInvite),
    controller.del,
  );
