import * as createResponseBody from '@repo/response-json';
import { createValidationErrors } from '@repo/validation/zod';
import type { RequestHandler } from 'express';
import { client as db } from '../../db/client.mjs';
import { hash } from '../../ext/password.mjs';
import { chains } from '../../schemas/serverUser.mjs';

export const post: RequestHandler = async (req, res, next) => {
  try {
    const parseResult = await chains.signup().safeParseAsync(req.body);
    if (!parseResult.success) {
      return res
        .status(400)
        .send(
          createResponseBody.failValidation(
            createValidationErrors(parseResult.error),
          ),
        );
    }

    const { handle, displayName, password } = parseResult.data;

    await db.user.create({
      data: {
        handle,
        displayName,
        hash: hash(password),
      },
    });

    return res.send(
      createResponseBody.success({}, 'User successfully created'),
    );
  } catch (error) {
    return next(error);
  }
};

export const put: RequestHandler = (req, res, next) => {
  return res.send('put user');
};

export const patch: RequestHandler = (req, res, next) => {
  return res.send('patch user');
};

export const del: RequestHandler = (req, res, next) => {
  return res.send('delete user');
};

export const getOne: RequestHandler = (req, res, next) => {
  return res.send('get user');
};

export const getMany: RequestHandler = (req, res, next) => {
  return res.send('get many users');
};
