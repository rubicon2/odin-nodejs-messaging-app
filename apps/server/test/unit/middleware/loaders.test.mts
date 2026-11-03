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

  it('given a request with req.tokenData containing an invalid handle, returns status code 401 and a message', async () => {
    const req = createRequest({
      tokenData: {
        handle: 'invalid_handle',
      },
    });
    const res = createResponse();
    const next = vi.fn();

    await loaders.loadUser(req, res, next);

    expect(res.statusCode).toStrictEqual(401);
    expect(res._getJSONData()).toStrictEqual({
      status: 'fail',
      message: 'User does not exist',
    });
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

describe('loadResource', () => {
  it('given a paramName and loader function, calls the loader function with the param value and puts the result in req.resource, then calls next function', async () => {
    const paramName = 'myParam';
    const paramValue = 'abc';
    const resource = '123';

    const req = createRequest({
      url: '/resource/1',
      params: {
        [paramName]: paramValue,
      },
    });
    const res = createResponse();
    const next = vi.fn();

    const mockLoader = vi.fn().mockImplementation(() => {
      return resource;
    });

    const loaderMiddleware = loaders.loadResource(paramName, mockLoader);

    await loaderMiddleware(req, res, next);

    expect(mockLoader).toHaveBeenCalled();
    expect(mockLoader).toHaveBeenCalledWith(paramValue);
    expect(req.resource).toStrictEqual(resource);
    expect(next).toHaveBeenCalled();
  });

  it('given a paramName that corresponds to no params, calls next function with an error', async () => {
    const paramName = 'myParam';

    const req = createRequest();
    const res = createResponse();
    const next = vi.fn();
    const mockLoader = vi.fn();

    const loaderMiddleware = loaders.loadResource(paramName, mockLoader);

    await loaderMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      new Error(`req.params.${paramName} is undefined`),
    );
    expect(mockLoader).not.toHaveBeenCalled();
  });

  it('given a paramName that occurs multiple times, calls next function with an error', async () => {
    const paramName = 'myParam';

    const req = createRequest({
      params: {
        [paramName]: ['1', '2', '3'],
      },
    });
    const res = createResponse();
    const next = vi.fn();
    const mockLoader = vi.fn();

    const loaderMiddleware = loaders.loadResource(paramName, mockLoader);

    await loaderMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      new Error(
        `req.params.${paramName} is an array. There should only be one instance of ${paramName} in the URL`,
      ),
    );
    expect(mockLoader).not.toHaveBeenCalled();
  });

  it.each([null, undefined])(
    'given a loader that returns $0, returns status code 404 and a message',
    async (loaderReturnValue) => {
      const paramName = 'myParam';

      const req = createRequest({
        params: {
          [paramName]: '12345',
        },
      });
      const res = createResponse();
      const next = vi.fn();
      const mockLoader = vi.fn().mockImplementation(() => loaderReturnValue);

      const loaderMiddleware = loaders.loadResource(paramName, mockLoader);

      await loaderMiddleware(req, res, next);

      expect(res.statusCode).toStrictEqual(404);
      expect(res._getJSONData()).toStrictEqual({
        status: 'fail',
        message: 'Not found',
      });
    },
  );
});

describe('loadUserResource', () => {
  it('given a valid user id, returns the user with the expected fields', async () => {
    await db.user.create({
      data: dbUserData,
    });

    const user = await loaders.loadUserResource(dbUserData.id);

    expect(user).toStrictEqual({
      // Password hash should not be included.
      id: dbUserData.id,
      handle: dbUserData.handle,
      displayName: dbUserData.displayName,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });

  it('given an invalid user id, returns null', async () => {
    const user = await loaders.loadUserResource('invalid-id');
    expect(user).toBeNull();
  });
});
