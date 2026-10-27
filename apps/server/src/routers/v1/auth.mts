import { Router } from 'express';
import * as controller from '../../controllers/v1/auth.mjs';

export const auth = Router().post('/login', controller.login);
