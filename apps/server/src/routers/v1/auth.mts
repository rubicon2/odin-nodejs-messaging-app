import { Router } from 'express';
import * as controller from '../../controllers/v1/auth.mjs';
import { isAuthenticated } from '../../middleware/auth.mjs';
import { loadUser } from '../../middleware/loaders.mjs';
import { getRefreshToken, verifyToken } from '../../middleware/tokens.mjs';

export const auth = Router()
  .post(
    '/access',
    getRefreshToken,
    verifyToken,
    isAuthenticated,
    loadUser,
    controller.access,
  )
  .post('/login', controller.login)
  .post('/logout', controller.logout);
