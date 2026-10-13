import { auth } from './v1/auth.mjs';
import { chat } from './v1/chat.mjs';
import { user } from './v1/user.mjs';

import { Router } from 'express';

export const v1 = Router()
  .use('/auth', auth)
  .use('/chat', chat)
  .use('/user', user);
