import { createRequest, createResponse } from 'node-mocks-http';
import { describe, expect, it, vi } from 'vitest';
import { canDo } from '../../../src/middleware/permissions.mjs';

describe('canDo', () => {
  it('takes a CheckPermissionsFunction and returns a RequestHandler middleware function', () => {
    const checkPermissions = vi.fn();
    const middleware = canDo(checkPermissions);

    // Not sure if there is a way to check the actual type of function.
    expect(typeof middleware).toStrictEqual('function');
  });

  describe('returned RequestHandler function', () => {
    it('invokes the provided checkPermissions function with the request as an argument', async () => {
      const checkPermissions = vi.fn();
      const middleware = canDo(checkPermissions);
      const req = createRequest();
      const res = createResponse();
      const next = vi.fn();

      middleware(req, res, next);

      expect(checkPermissions).toHaveBeenCalled();
      expect(checkPermissions).toHaveBeenCalledWith(req);
    });

    it('created with a CheckPermissionsFunction that evaluates to true, calls next middleware', async () => {
      const checkPermissions = vi.fn(() => true);
      const middleware = canDo(checkPermissions);
      const req = createRequest();
      const res = createResponse();
      const next = vi.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('created with an async CheckPermissionsFunction that resolves to true, calls next middleware', async () => {
      const checkPermissions = vi.fn(async () => true);
      const middleware = canDo(checkPermissions);
      const req = createRequest();
      const res = createResponse();
      const next = vi.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('created with a CheckPermissionsFunction that evaluates to false, returns status code 403 and a message', async () => {
      const checkPermissions = vi.fn(() => false);
      const middleware = canDo(checkPermissions);
      const req = createRequest();
      const res = createResponse();
      const next = vi.fn();

      await middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toStrictEqual(403);
      expect(res._getJSONData()).toStrictEqual({
        status: 'fail',
        message: 'You are not authorized to take this action',
      });
    });

    it('created with an async CheckPermissionsFunction that resolves to false, returns status code 403 and a message', async () => {
      const checkPermissions = vi.fn(async () => false);
      const middleware = canDo(checkPermissions);
      const req = createRequest();
      const res = createResponse();
      const next = vi.fn();

      await middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toStrictEqual(403);
      expect(res._getJSONData()).toStrictEqual({
        status: 'fail',
        message: 'You are not authorized to take this action',
      });
    });
  });
});
