import { createRequest, createResponse } from 'node-mocks-http';
import { describe, expect, it, vi } from 'vitest';
import {
  getAccessToken,
  getRefreshToken,
  verifyToken,
} from '../../../src/middleware/tokens.mjs';

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
