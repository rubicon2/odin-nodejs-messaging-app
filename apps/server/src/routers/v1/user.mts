import { Router } from 'express';
import * as controller from '../../controllers/v1/user.mjs';
import { canUpdateUser } from '../../ext/checkPermissions.mjs';
import { isAuthenticated } from '../../middleware/auth.mjs';
import * as loaders from '../../middleware/loaders.mjs';
import { canDo } from '../../middleware/permissions.mjs';
import * as tokens from '../../middleware/tokens.mjs';

const loadProtectedRouteMiddleware = [
  tokens.getAccessToken,
  tokens.verifyToken,
  isAuthenticated,
  loaders.loadUser,
  loaders.loadResource('userId', loaders.loadUserResource),
];

export const user = Router()
  .post('/', controller.post)
  .get('/', controller.getMany)
  .get(
    '/:userId',
    loaders.loadResource('userId', loaders.loadUserResource),
    controller.getOne,
  )
  .put('/:userId', controller.put)
  .patch(
    '/:userId',
    loadProtectedRouteMiddleware,
    canDo(canUpdateUser),
    controller.patch,
  )
  .delete(
    '/:userId',
    loadProtectedRouteMiddleware,
    canDo(canUpdateUser),
    controller.del,
  );
