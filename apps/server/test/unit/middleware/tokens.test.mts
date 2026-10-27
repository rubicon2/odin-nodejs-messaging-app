import jwt from 'jsonwebtoken';
import { createRequest, createResponse } from 'node-mocks-http';
import { describe, expect, it, vi } from 'vitest';
import type { UserResource } from '../../../src/db/userResource.mts';
import { createAccessToken } from '../../../src/ext/tokens.mjs';
import {
  getAccessToken,
  getRefreshToken,
  verifyToken,
} from '../../../src/middleware/tokens.mjs';
import { env } from '../../../src/schemas/env.mts';

const user: UserResource = {
  id: '1',
  handle: 'some_handle',
  displayName: 'Ronald Donald',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('getAccessToken', () => {
  it('given a request with a valid auth bearer header, puts the token onto req.token', async () => {
    const token = '12345';

    const req = createRequest({
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    const res = createResponse();
    const next = vi.fn();

    getAccessToken(req, res, next);

    expect(req.token).toStrictEqual(token);
  });

  it.each(['Bearer12345', '', undefined])(
    'given a request with an auth header of: $0, does nothing',
    (badToken) => {
      const req = createRequest({
        headers: {
          authorization: badToken,
        },
      });
      const res = createResponse();
      const next = vi.fn();

      getAccessToken(req, res, next);

      expect(req.token).toBeUndefined();
    },
  );
});

describe('getRefreshToken', () => {
  it('given a request with a valid refresh cookie token, puts it onto req.token', async () => {
    const token = '12345';

    const req = createRequest({
      cookies: {
        refresh: token,
      },
    });
    const res = createResponse();
    const next = vi.fn();

    getRefreshToken(req, res, next);

    expect(req.token).toStrictEqual(token);
  });

  it('given a request with an empty refresh cookie, does nothing', () => {
    const req = createRequest({
      cookies: {
        refresh: '',
      },
    });
    const res = createResponse();
    const next = vi.fn();

    getRefreshToken(req, res, next);

    expect(req.token).toBeUndefined();
  });

  it('given a request with no refresh cookie, does nothing', () => {
    const req = createRequest();
    const res = createResponse();
    const next = vi.fn();

    getRefreshToken(req, res, next);

    expect(req.token).toBeUndefined();
  });
});

describe('verifyToken', () => {
  describe('returned middleware function', () => {
    it('given a request with a valid req.token, puts decoded data onto req.tokenData', async () => {
      const token = createAccessToken(user);
      const req = createRequest({
        token,
      });
      const res = createResponse();
      const next = vi.fn();

      verifyToken(req, res, next);

      expect(req.tokenData).toStrictEqual(jwt.decode(token));
    });

    it('given a request with an invalid req.token, does nothing', async () => {
      const req = createRequest({
        token: '12345',
      });
      const res = createResponse();
      const next = vi.fn();

      verifyToken(req, res, next);
      expect(req.tokenData).toBeUndefined();
    });

    it('given a request with an expired req.token, does nothing', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(0);

      const token = createAccessToken(user);
      vi.advanceTimersByTime(env.JWT_ACCESS_MAX_AGE);

      const expiredDate = vi.getMockedSystemTime();
      expect(expiredDate).not.toBeNull();

      const req = createRequest({
        token,
      });
      const res = createResponse();
      const next = vi.fn();

      verifyToken(req, res, next);
      expect(req.tokenData).toBeUndefined();

      vi.useRealTimers();
    });

    it('given a request with no req.token, does nothing', async () => {
      const req = createRequest();
      const res = createResponse();
      const next = vi.fn();

      verifyToken(req, res, next);
      expect(req.tokenData).toBeUndefined();
    });
  });
});
