import { createRequest, createResponse } from 'node-mocks-http';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { client as db } from '../../../src/db/client.mjs';
import * as loaders from '../../../src/middleware/loaders.mjs';
import * as dbHelpers from '../../helpers/db.mjs';
import { dbUserData } from '../../helpers/dbData.mts';

beforeEach(async () => {
  await dbHelpers.clearDb();
});

describe('loadUser', () => {
  it('given a request with req.tokenData containing a valid handle, loads user into req.user and calls next function', async () => {
    await db.user.create({
      data: dbUserData,
    });

    const req = createRequest({
      tokenData: {
        handle: dbUserData.handle,
      },
    });
    const res = createResponse();
    const next = vi.fn();

    await loaders.loadUser(req, res, next);

    expect(req.user).toStrictEqual({
      id: dbUserData.id,
      handle: dbUserData.handle,
      displayName: dbUserData.displayName,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });

    expect(next).toHaveBeenCalled();
  });

  it('given a request with req.tokenData containing an invalid handle, calls next with an error', async () => {
    const req = createRequest({
      tokenData: {
        handle: 'invalid_handle',
      },
    });
    const res = createResponse();
    const next = vi.fn();

    await loaders.loadUser(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(new Error('User does not exist'));
  });

  it('given a request with no req.tokenData, calls next with an error', async () => {
    const req = createRequest();
    const res = createResponse();
    const next = vi.fn();

    await loaders.loadUser(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(new Error('req.tokenData is undefined'));
  });
});
