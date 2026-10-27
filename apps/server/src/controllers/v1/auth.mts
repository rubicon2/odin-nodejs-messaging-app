import * as createResponseBody from '@repo/response-json';
import { createValidationErrors } from '@repo/validation/zod';
import type { RequestHandler } from 'express';
import { client as db } from '../../db/client.mjs';
import { createAccessToken, createRefreshToken } from '../../ext/tokens.mjs';
import { env } from '../../schemas/env.mjs';
import { chains } from '../../schemas/serverAuth.mjs';

export const login: RequestHandler = async (req, res, next) => {
  try {
    const parseResult = await chains.login().safeParseAsync(req.body);
    if (!parseResult.success) {
      return res
        .status(400)
        .send(
          createResponseBody.failValidation(
            createValidationErrors(parseResult.error),
          ),
        );
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
