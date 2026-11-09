import { Router } from 'express';
import * as controller from '../../controllers/v1/chat.mjs';
import { canDeleteChat, canUpdateChat } from '../../ext/checkPermissions.mjs';
import { isAuthenticated } from '../../middleware/auth.mjs';
import * as loaders from '../../middleware/loaders.mjs';
import { canDo } from '../../middleware/permissions.mjs';
import * as tokens from '../../middleware/tokens.mjs';
import { invite } from './invite.mjs';

const loadProtectedRouteMiddleware = [
  tokens.getAccessToken,
  tokens.verifyToken,
  isAuthenticated,
  loaders.loadUser,
];

export const chat = Router()
  .use('/:chatId/invite', loadProtectedRouteMiddleware, invite)
  .post('/', loadProtectedRouteMiddleware, controller.post)
  .post(
    '/:chatId/leave',
    loadProtectedRouteMiddleware,
    loaders.loadResource('chatId', loaders.loadChatResource),
    /**
     * Should the code for trying to leave a chat when not a
     * participant be 400 or 403? Both are pretty valid. Since
     * it is easier to just use the canDo middleware rather
     * than add custom logic to the controller, will do that.
     */
    canDo(canUpdateChat),
    controller.leave,
  )
  .patch(
    '/:chatId',
    loadProtectedRouteMiddleware,
    loaders.loadResource('chatId', loaders.loadChatResource),
    canDo(canUpdateChat),
    controller.patch,
  )
  .delete(
    '/:chatId',
    loadProtectedRouteMiddleware,
    loaders.loadResource('chatId', loaders.loadChatResource),
    canDo(canDeleteChat),
    controller.del,
  );
