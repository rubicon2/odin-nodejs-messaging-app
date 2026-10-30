import { faker } from '@faker-js/faker';
import type { Prisma } from '@repo/db/prisma/client';
import { client as db } from '../../src/db/client.mts';
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

export async function createFakeUsers(
  count: number,
): Promise<Prisma.UserModel[]> {
  const users: Prisma.UserModel[] = [];

  for (let i = 0; i < count; i++) {
    const user = await db.user.create({
      data: createFakeUserData(),
    });
    users.push(user);
  }

  return users;
}
