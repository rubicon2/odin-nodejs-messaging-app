import type { Prisma } from "@repo/db/prisma/client";

export const dbUserData: Prisma.UserModel = {
  id: '1',
  createdAt: new Date(Date.now()),
  updatedAt: new Date(Date.now()),
  handle: 'some_handle',
  displayName: 'Ronald Donald',
  hash: '12345',
}
