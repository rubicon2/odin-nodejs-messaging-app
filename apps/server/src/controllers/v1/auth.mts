import * as createResponseBody from '@repo/response-json';
import type { RequestHandler } from 'express';
import { client as db } from '../../db/client.mjs';
import { sendFailValidationResponse } from '../../ext/sendFailValidationResponse.mjs';
import { createAccessToken, createRefreshToken } from '../../ext/tokens.mjs';
import { env } from '../../schemas/env.mjs';
import { chains } from '../../schemas/serverAuth.mjs';

export const access: RequestHandler = async (req, res, next) => {
  try {
    /**
     * If we reach this function, the refresh token should
     * already have been verified by existing middleware
     * and user loaded into req.user.
     */
    if (req.user === undefined) {
      throw new Error(
        'req.user is undefined, did you forget to use loadUser middleware?',
      );
    }

    /**
     * If we are going to add refresh token rotation, a new model
     * will be required on prisma, called "RevokedToken", which
     * will store the jit of the token. Also keep track of the
     * expiration date, so we can periodically clear expired
     * tokens from the table, since expired tokens would fail
     * to verify anyway.
     *
     * Without token rotation, all this handler does
     * return a fresh access token for the req.user.
     */

    const accessToken = createAccessToken(req.user);
    return res.json(createResponseBody.successSingle(accessToken));
  } catch (error) {
    return next(error);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const parseResult = await chains.login().safeParseAsync(req.body);
    if (!parseResult.success) {
      return sendFailValidationResponse(req, res, parseResult.error);
    }

    // Since login chain checks if handle and password match, ok.
    const user = await db.user.findUnique({
      where: {
        handle: parseResult.data.handle,
      },
    });

    if (!user) {
      // This shouldn't happen, since login chain should check
      // if user exists and if handle and password match on db.
      throw new Error(
        'Validation chains passed but user not found on database',
      );
    }

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    res.cookie('refresh', refreshToken, {
      // Very important, do not want refresh tokens to be accessible to scripts.
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      domain: env.COOKIE_DOMAIN,
      expires: new Date(Date.now() + env.JWT_REFRESH_MAX_AGE),
    });

    // Return access token in response body. Since it is shorter lived, less risky.
    return res.json(
      createResponseBody.successSingle(accessToken, 'Successfully logged in'),
    );
  } catch (error) {
    return next(error);
  }
};

export const logout: RequestHandler = async (_req, res, next) => {
  try {
    /**
     * Since tokens are not stored on the server, we cannot invalidate.
     * We can remove the refresh token by clearing the cookie, but it
     * is up to the client to delete their access token. This means if a
     * user somehow keeps a copy of the access token, they will be able
     * to continue using it until it expires, but given that access
     * tokens should be short-lived, and they would have had to login
     * successfully, or have access to a valid refresh token to get an
     * access token anyway. To sum up: not a huge deal.
     *
     * But keeping track of the tokens associated with a user does have
     * benefits, like being able to keep track of active refresh tokens, and
     * invalidate a bunch of tokens for a user (i.e. log out a user from
     * all devices), or trigger a two-factor authentication check if a
     * token is requested by an unusual ip address. That would also
     * require keeping track of the ips that tokens are issued to.
     *
     * But that kind of stuff is not required for this project.
     */
    res.clearCookie('refresh');
    return res.json(createResponseBody.success({}, 'Successfully logged out'));
  } catch (error) {
    return next(error);
  }
};
