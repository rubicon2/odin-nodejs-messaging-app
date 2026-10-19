import { Router } from 'express';
import * as controller from '../../controllers/v1/user.mjs';

export const user = Router()
  .post('/', controller.post)
  .get('/', controller.getMany)
  .get('/:userId', controller.getOne)
  .put('/:userId', controller.put)
  .patch('/:userId', controller.patch)
  .delete('/:userId', controller.del);
