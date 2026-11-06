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
