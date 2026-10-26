import type { Request } from 'express';
import { describe, expect, it, vi } from 'vitest';
import {
  getAccessToken,
  getRefreshToken,
} from '../../../src/middleware/tokens.mjs';

describe('getAccessToken', () => {
  it('given a request with a valid auth bearer header, puts the token onto req.token', async () => {
    const token = '12345';

    // @ts-expect-error -- Middleware only uses this header.
    const req: Request = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };
    const res = {};
    const next = vi.fn();

    // @ts-expect-error -- Middleware does not use response object.
    getAccessToken(req, res, next);

    expect(req.token).toStrictEqual(token);
  });

  it.each(['Bearer12345', '', undefined])(
    'given a request with an auth header of: $0, does nothing',
    (badToken) => {
      // @ts-expect-error -- Middleware only uses this header.
      const req: Request = {
        headers: {
          authorization: badToken,
        },
      };
      const res = {};
      const next = vi.fn();

      // @ts-expect-error -- Middleware does not use response object.
      getAccessToken(req, res, next);

      expect(req.token).toBeUndefined();
    },
  );
});

describe('getRefreshToken', () => {
  it('given a request with a valid refresh cookie token, puts it onto req.token', async () => {
    const token = '12345';

    // @ts-expect-error -- Middleware only uses this header.
    const req: Request = {
      cookies: {
        refresh: token,
      },
    };
    const res = {};
    const next = vi.fn();

    // @ts-expect-error -- Middleware does not use response object.
    getRefreshToken(req, res, next);

    expect(req.token).toStrictEqual(token);
  });

  it.each(['', undefined])(
    'given a request with an auth header of: $0, does nothing',
    (badToken) => {
      // @ts-expect-error -- Middleware only uses this header.
      const req: Request = {
        cookies: {
          refresh: badToken,
        },
      };
      const res = {};
      const next = vi.fn();

      // @ts-expect-error -- Middleware does not use response object.
      getRefreshToken(req, res, next);

      expect(req.token).toBeUndefined();
    },
  );
});
