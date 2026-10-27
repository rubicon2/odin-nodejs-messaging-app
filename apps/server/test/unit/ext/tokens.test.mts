import jwt from 'jsonwebtoken';
import { describe, expect, it, vi } from 'vitest';
import type { UserResource } from '../../../src/db/userResource.mts';
import {
  createAccessToken,
  createRefreshToken,
  verifyToken,
} from '../../../src/ext/tokens.mjs';
import { env } from '../../../src/schemas/env.mts';

const user: UserResource = {
  id: '1',
  handle: 'some_handle',
  displayName: 'Ronald Donald',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('createAccessToken', () => {
  it('given a UserResource, returns a string token', () => {
    expect(createAccessToken(user)).toStrictEqual(expect.any(String));
  });

  describe('returned token', () => {
    const currentTime = 0;

    vi.useFakeTimers();
    vi.setSystemTime(currentTime);

    const token = createAccessToken(user);
    const decoded = jwt.decode(token) as jwt.JwtPayload;

    it('has a user id', () => {
      expect(decoded.id).toStrictEqual(user.id);
    });

    it('has a user handle', () => {
      expect(decoded.handle).toStrictEqual(user.handle);
    });

    it('has an exp time based on env.JWT_ACCESS_MAX_AGE', () => {
      expect(decoded.exp).toStrictEqual(
        currentTime + env.JWT_ACCESS_MAX_AGE / 1000,
      );
    });

    it('does not have a user hash', () => {
      expect(decoded.hash).not.toBeDefined();
    });

    vi.useRealTimers();
  });
});

describe('createRefreshToken', () => {
  it('given a UserResource, returns a string token', () => {
    expect(createRefreshToken(user)).toStrictEqual(expect.any(String));
  });

  describe('returned token', () => {
    const currentTime = 0;

    vi.useFakeTimers();
    vi.setSystemTime(currentTime);

    const token = createRefreshToken(user);
    const decoded = jwt.decode(token) as jwt.JwtPayload;

    it('has a user id', () => {
      expect(decoded.id).toStrictEqual(user.id);
    });

    it('has a user handle', () => {
      expect(decoded.handle).toStrictEqual(user.handle);
    });

    it('has an exp time based on env.JWT_ACCESS_MAX_AGE', () => {
      expect(decoded.exp).toStrictEqual(
        currentTime + env.JWT_REFRESH_MAX_AGE / 1000,
      );
    });

    it('does not have a user hash', () => {
      expect(decoded.hash).not.toBeDefined();
    });

    vi.useRealTimers();
  });
});

describe('verifyToken', () => {
  it('given a valid token, returns { success: true, data }', () => {
    const token = createAccessToken(user);

    expect(verifyToken(token)).toStrictEqual({
      success: true,
      data: {
        id: user.id,
        handle: user.handle,
        type: 'ACCESS',
        jti: expect.any(String),
        iat: expect.any(Number),
        exp: expect.any(Number),
      },
    });
  });

  it('given an invalid token, returns { success: false, error }', () => {
    expect(verifyToken('12345')).toStrictEqual({
      success: false,
      error: new jwt.JsonWebTokenError('jwt malformed'),
    });
  });

  it('given an expired token, returns { success: false, error }', () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);

    const token = createAccessToken(user);
    vi.advanceTimersByTime(env.JWT_ACCESS_MAX_AGE);

    const expiredDate = vi.getMockedSystemTime();
    // If we have forgotten to mock the Date, mocked time will be null.
    expect(expiredDate).not.toBeNull();

    expect(verifyToken(token)).toStrictEqual({
      success: false,
      // @ts-expect-error -- We have asserted that expiredDate is not null.
      error: new jwt.TokenExpiredError('jwt expired', expiredDate),
    });

    vi.useRealTimers();
  });
});
