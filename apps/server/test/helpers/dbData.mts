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

export const dbUserData2: Prisma.UserModel = {
  id: '2',
  createdAt: new Date(Date.now()),
  updatedAt: new Date(Date.now()),
  handle: postData.userData2.handle,
  displayName: postData.userData2.displayName,
  hash: password.hash(postData.userData2.password),
};

export const chatData = (createdById?: string): Prisma.ChatModel => ({
  id: crypto.randomUUID(),
  createdById: createdById ?? null,
  createdAt: new Date(Date.now()),
  updatedAt: new Date(Date.now()),
  title: 'My Amazing Chat',
});

export const inviteData = (
  createdById: string,
  inviteeId: string,
  chatId: string,
): Prisma.InviteModel => ({
  id: crypto.randomUUID(),
  chatId,
  createdById,
  inviteeId,
  createdAt: new Date(Date.now()),
});
