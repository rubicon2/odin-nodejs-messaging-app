import type { Prisma } from '@repo/db/prisma/client';
import * as password from '../../src/ext/password.mjs';
import * as postData from './postData.mjs';

export const dbUserData: Prisma.UserModel = {
  id: '1',
  createdAt: new Date(Date.now()),
  updatedAt: new Date(Date.now()),
  handle: postData.userData.handle,
  displayName: postData.userData.displayName,
  hash: password.hash(postData.userData.password),
};
