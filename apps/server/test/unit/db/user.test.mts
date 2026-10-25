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
  });

  it('given incorrect data, throws an error', async () => {
    // @ts-expect-error -- Testing bad arguments.
    await expect(() => userResource.create({})).rejects.toThrow();
  });
});

describe('update', () => {
  it('given an id and the correct data, updates a user on the database and returns it', async () => {
    // Post a user to update.
    const existingDbUser = await db.user.create({
      data: userData,
    });

    const updateData = {
      handle: 'updated_handle',
      displayName: 'Updated Name',
      hash: 'abcdef',
    };

    const updatedUser = await userResource.update(
      existingDbUser.id,
      updateData,
    );
    expect(updatedUser).toStrictEqual({
      id: existingDbUser.id,
      createdAt: existingDbUser.createdAt,
      updatedAt: expect.any(Date),
      handle: updateData.handle,
      displayName: updateData.displayName,
    });

    const updatedDbUser = await db.user.findUnique({
      where: {
        id: updatedUser.id,
      },
    });
    expect(updatedDbUser).toStrictEqual({
      ...updatedUser,
      hash: updateData.hash,
    });
  });

  it('works with an empty data object, i.e. all fields are optional', async () => {
    const existingDbUser = await db.user.create({
      data: userData,
    });

    const updatedUser = await userResource.update(existingDbUser.id, {});
    expect(updatedUser).toStrictEqual({
      id: existingDbUser.id,
      createdAt: existingDbUser.createdAt,
      updatedAt: expect.any(Date),
      handle: existingDbUser.handle,
      displayName: existingDbUser.displayName,
    });

    const updatedDbUser = await db.user.findUnique({
      where: {
        id: updatedUser.id,
      },
    });
    expect(updatedDbUser).toStrictEqual(existingDbUser);
  });

  it('returned user does not contain password hash', async () => {
    const existingDbUser = await db.user.create({
      data: userData,
    });

    const user = await userResource.update(existingDbUser.id, {});
    // @ts-expect-error -- Testing something doesn't exist.
    expect(user.hash).not.toBeDefined();
  });

  it('given an invalid id, throws an error', async () => {
    await expect(() => userResource.update('invalid-id', {})).rejects.toThrow();
  });

  it('given incorrect data, throws an error', async () => {
    const existingDbUser = await db.user.create({
      data: userData,
    });

    await expect(() =>
      userResource.update(existingDbUser.id, {
        // @ts-expect-error -- Testing bad arguments.
        handle: 12345,
        // @ts-expect-error
        displayName: new Date(),
      }),
    ).rejects.toThrow();
  });
});

describe('del', () => {
  it('given an id, deletes a user on the database and returns it', async () => {
    // Post a user to delete.
    const existingDbUser = await db.user.create({
      data: userData,
    });

    const deletedUser = await userResource.del(existingDbUser.id);
    expect(deletedUser).toStrictEqual({
      id: existingDbUser.id,
      createdAt: existingDbUser.createdAt,
      updatedAt: expect.any(Date),
      handle: existingDbUser.handle,
      displayName: existingDbUser.displayName,
    });

    const deletedDbUser = await db.user.findUnique({
      where: {
        id: deletedUser?.id,
      },
    });
    expect(deletedDbUser).toBeNull();
  });

  it('returned user does not contain password hash', async () => {
    const existingDbUser = await db.user.create({
      data: userData,
    });

    const user = await userResource.del(existingDbUser.id);
    // @ts-expect-error -- Testing something doesn't exist.
    expect(user.hash).not.toBeDefined();
  });

  it('given an invalid id, throws an error', async () => {
    await expect(() => userResource.del('invalid-id')).rejects.toThrow();
  });
});

describe('getUnique', () => {
  it('given a valid id, returns the corresponding user', async () => {
    const userToFind = await db.user.create({
      data: userData,
      omit: {
        hash: true,
      },
    });

    const user = await userResource.getUnique({ id: userToFind.id });
    expect(user).toStrictEqual(userToFind);
  });

  it('given a valid handle, returns the corresponding user', async () => {
    const userToFind = await db.user.create({
      data: userData,
      omit: {
        hash: true,
      },
    });

    const user = await userResource.getUnique({ handle: userToFind.handle });
    expect(user).toStrictEqual(userToFind);
  });

  it('returned user does not contain password hash', async () => {
    const existingDbUser = await db.user.create({
      data: userData,
    });

    const user = await userResource.getUnique({ id: existingDbUser.id });
    // @ts-expect-error -- Testing something doesn't exist.
    expect(user.hash).not.toBeDefined();
  });

  it('given an invalid id, returns null', async () => {
    const user = await userResource.getUnique({ id: 'invalid-id' });
    expect(user).toBeNull();
  });

  it('given an invalid handle, returns null', async () => {
    const user = await userResource.getUnique({ handle: 'invalid-handle' });
    expect(user).toBeNull();
  });
});
