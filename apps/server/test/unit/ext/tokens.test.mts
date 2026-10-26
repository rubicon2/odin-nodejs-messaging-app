import jwt from 'jsonwebtoken';
import { describe, expect, it, vi } from 'vitest';
import type { UserResource } from '../../../src/db/userResource.mts';
import {
  createAccessToken,
  createRefreshToken,
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

// Don't bother testing verifyToken, since all it does is
// pass a secret to the jwt.verifyToken function. Effectively,
// we would just be testing the jwt.verifyToken function.
