import { createRequest, createResponse } from 'node-mocks-http';
import { describe, expect, it, vi } from 'vitest';
import { isAuthenticated } from '../../../src/middleware/auth.mjs';

describe('isAuthenticated', () => {
  it('given a request with req.tokenData, calls the next function', () => {
    const req = createRequest({
      tokenData: '12345',
    });
    const res = createResponse();
    const next = vi.fn();

    isAuthenticated(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  describe('given a request with no req.tokenData', () => {
    const req = createRequest();
    const res = createResponse();
    const next = vi.fn();

    isAuthenticated(req, res, next);

    it('does not call the next function', () => {
      expect(next).not.toHaveBeenCalled();
    });

    it('returns a 401 status code', () => {
      expect(res.statusCode).toStrictEqual(401);
    });

    it('returns a generic logged out message', () => {
      expect(res._getJSONData()).toStrictEqual({
        status: 'fail',
        message: 'You are not logged in',
      });
    });
  });
});
