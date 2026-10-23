import * as createResponseBody from '@repo/response-json';
import { createValidationErrors } from '@repo/validation/zod';
import * as bcryptjs from 'bcryptjs';
import type { RequestHandler } from 'express';
import { db } from '../../db.mjs';
import { chains } from '../../schemas/serverUser.mjs';

export const post: RequestHandler = async (req, res, next) => {
  try {
    const parseResult = await chains.signup.safeParseAsync(req.body);
    if (!parseResult.success) {
      return res
        .status(400)
        .send(
          createResponseBody.failValidation(
            createValidationErrors(parseResult.error),
          ),
        );
    }

    const validatedData = parseResult.data;
    const hash = await bcryptjs.hash(validatedData.password, 10);

    await db.user.create({
      data: {
        handle: validatedData.handle,
        displayName: validatedData.displayName,
        hash,
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
