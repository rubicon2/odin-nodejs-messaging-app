import { beforeEach, describe, expect, it } from 'vitest';
import { client as db } from '../../../src/db/client.mts';
import * as userResource from '../../../src/db/user.mjs';
import * as dbHelpers from '../../helpers/db.mjs';

const userData = {
  handle: 'some_handle',
  displayName: 'Some Name',
  hash: '12345',
};

beforeEach(dbHelpers.clearDb);

describe('create', () => {
  it('given the correct data, creates a user on the database and returns it', async () => {
    const user = await userResource.create(userData);
    expect(user).toStrictEqual({
      id: expect.any(String),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
      handle: userData.handle,
      displayName: userData.displayName,
    });

    const dbUser = await db.user.findUnique({
      where: {
        id: user.id,
      },
    });
    expect(dbUser).toStrictEqual({
      ...user,
      hash: userData.hash,
    });
  });

  it('returned user does not contain password hash', async () => {
    const user = await userResource.create(userData);
    // @ts-expect-error -- Testing something doesn't exist.
    expect(user.hash).not.toBeDefined();
  })

  it('given incorrect data, throws an error', async () => {
    // @ts-expect-error -- Testing bad arguments.
    await expect(() => userResource.create({})).rejects.toThrow();
  })
});
