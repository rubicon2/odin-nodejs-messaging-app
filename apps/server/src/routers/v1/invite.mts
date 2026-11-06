import { Router } from 'express';
import * as controller from '../../controllers/v1/invite.mjs';
import { canDeleteInvite, canPostInvite } from '../../ext/checkPermissions.mjs';
import * as loaders from '../../middleware/loaders.mjs';
import { canDo } from '../../middleware/permissions.mjs';

export const invite = Router({ mergeParams: true })
  .post(
    '/',
    loaders.loadResource('chatId', loaders.loadChatResource),
    canDo(canPostInvite),
    controller.post,
  )
  .delete(
    '/:inviteId',
    loaders.loadResource('inviteId', loaders.loadInviteResource),
    canDo(canDeleteInvite),
    controller.del,
  );
