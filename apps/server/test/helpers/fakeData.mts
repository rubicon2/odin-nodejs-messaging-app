import { faker } from '@faker-js/faker';
import type { Prisma } from '@repo/db/prisma/client';
import { client as db } from '../../src/db/client.mts';
import type { UserResource } from '../../src/db/userResource.mjs';
import { userResourceOmit } from '../../src/db/userResource.mjs';
import * as password from '../../src/ext/password.mjs';

export function createFakeUserData(): Prisma.UserModel {
  const firstName = faker.person.firstName();
  return {
    id: faker.string.uuid(),
    createdAt: faker.date.past({ years: { min: 1, max: 10 } }),
    updatedAt: faker.date.recent(),
    handle: faker.internet.username({ firstName }),
    displayName: faker.internet.displayName({ firstName }),
    hash: password.hash('12345678aA@'),
  };
}

export function createFakeUserDataMultiple(count: number): Prisma.UserModel[] {
  const userData: Prisma.UserModel[] = [];

  for (let i = 0; i < count; i++) {
    userData.push(createFakeUserData());
  }

  return userData;
}

/**
 * Post fake users and mimic includes and omits
 * that happen on the real server, so it is easy
 * to compare the users returned by this and
 * users returned by api routes.
 */
export async function createFakeUsers(count: number): Promise<UserResource[]> {
  const users: UserResource[] = [];

  for (let i = 0; i < count; i++) {
    const user = await db.user.create({
      data: createFakeUserData(),
      omit: userResourceOmit,
    });
    users.push(user);
  }

  return users;
}
