import { Router } from 'express';
import * as controller from '../../controllers/v1/chat.mjs';
import { isAuthenticated } from '../../middleware/auth.mjs';
import * as loaders from '../../middleware/loaders.mjs';
import * as tokens from '../../middleware/tokens.mjs';

const loadProtectedRouteMiddleware = [
  tokens.getAccessToken,
  tokens.verifyToken,
  isAuthenticated,
  loaders.loadUser,
];

export const chat = Router().post(
  '/',
  loadProtectedRouteMiddleware,
  controller.post,
);
