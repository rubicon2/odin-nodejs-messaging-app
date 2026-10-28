import type { RequestHandler } from 'express';
import type jwt from 'jsonwebtoken';
import { extractAuthHeaderToken } from '../ext/extractAuthHeaderToken.mjs';
import * as tokenUtils from '../ext/tokens.mjs';

declare global {
  namespace Express {
    export interface Request {
      token?: string;
      tokenData?: jwt.JwtPayload;
    }
  }
}

/**
 * Get token from authorization header and put in req.token.
 * These should be access tokens, since they will not be httpOnly
 * and will be manually attached to the request by the client
 * via scripting.
 */
export const getAccessToken: RequestHandler = (req, _res, next) => {
  const jwt = extractAuthHeaderToken(req);
  if (jwt) {
    req.token = jwt;
  }
  return next();
};

/**
 * Get token from cookie and put in req.token. These should
 * be refresh tokens, since they will be passed to the client
 * by way of httpOnly cookies, so scripts cannot access them.
 * Therefore, they must be transmitted back to the server
 * via cookies.
 */
export const getRefreshToken: RequestHandler = (req, _res, next) => {
  const jwt = req.cookies.refresh;
  if (jwt) req.token = jwt;
  return next();
};

export const verifyToken: RequestHandler = (req, _res, next) => {
  try {
    const token = req.token;
    if (token === undefined) return next();

    const verifyResult = tokenUtils.verifyToken(token);
    if (verifyResult.success) {
      req.tokenData = verifyResult.data;
    }

    return next();
  } catch (error) {
    return next(error);
  }
};
