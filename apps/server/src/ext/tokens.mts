import type { TokenType } from '@repo/db/prisma/client';
import jwt from 'jsonwebtoken';
import type { UserResource } from '../db/userResource.mjs';
import { env } from '../schemas/env.mjs';

/**
 * Merge declarations with those of jsonwebtoken,
 * so these show up on the types when accessed
 * on jwt.JwtPayload.
 */
declare module 'jsonwebtoken' {
  export interface JwtPayload {
    // Id or handle can be used to identify user.
    id: string;
    handle: string;
    // So only refresh tokens can be used to get access tokens.
    type: TokenType;
  }
}

export function createAccessToken(user: UserResource): string {
  const payload: jwt.JwtPayload = {
    jti: crypto.randomUUID(),
    type: 'ACCESS',
    id: user.id,
    handle: user.handle,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    // If a number is given to expiresIn, it treats it as SECONDS,
    // not MILLISECONDS, but if you give the same number as a string,
    // it treats it as MILLISECONDS. Make it make sense.
    expiresIn: `${env.JWT_ACCESS_MAX_AGE}`,
  });
}

export function createRefreshToken(user: UserResource): string {
  const payload: jwt.JwtPayload = {
    jti: crypto.randomUUID(),
    type: 'REFRESH',
    id: user.id,
    handle: user.handle,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    // If a number is given to expiresIn, it treats it as SECONDS,
    // not MILLISECONDS, but if you give the same number as a string,
    // it treats it as MILLISECONDS. Make it make sense.
    expiresIn: `${env.JWT_REFRESH_MAX_AGE}`,
  });
}

/**
 * If the jsonwebtoken library fails to verify the token
 * (e.g., expired or been tampered with), this will throw
 * an error.
 */
export function verifyToken(token: string): jwt.JwtPayload {
  const verified = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
  return verified;
}
