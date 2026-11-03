/**
 * These functions should all be about generating fake data,
 * but not posting to the database. Let the tests handle that.
 * Then we can generate fake data once and re-use it easily.
 */

import { faker } from '@faker-js/faker';
import type { Prisma } from '@repo/db/prisma/client';
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
