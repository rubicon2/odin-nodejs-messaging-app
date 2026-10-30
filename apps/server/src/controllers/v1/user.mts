import * as createResponseBody from '@repo/response-json';
import { createValidationErrors } from '@repo/validation/zod';
import type { RequestHandler } from 'express';
import { client as db } from '../../db/client.mjs';
import type { UserResource } from '../../db/userResource.mjs';
import { userResourceOmit } from '../../db/userResource.mjs';
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

    const user: UserResource = await db.user.create({
      data: {
        handle,
        displayName,
        hash: hash(password),
      },
      omit: userResourceOmit,
    });

    return res.send(
      createResponseBody.successSingle(user, 'User successfully created'),
    );
  } catch (error) {
    return next(error);
  }
};

export const put: RequestHandler = (req, res, next) => {
  return res.send('put user');
};

export const patch: RequestHandler = async (req, res, next) => {
  try {
    const userResource = req.resource as UserResource;

    const parseResult = await chains
      .updatePartial([userResource.id])
      .safeParseAsync(req.body);

    if (!parseResult.success) {
      return res
        .status(400)
        .send(
          createResponseBody.failValidation(
            createValidationErrors(parseResult.error),
          ),
        );
    }

    const parsedData = parseResult.data;

    let updatedHash: string | undefined;
    if (parsedData.password && parsedData.passwordConfirm) {
      updatedHash = hash(parsedData.password);
    }

    const updatedUser: UserResource = await db.user.update({
      where: {
        id: userResource.id,
      },
      data: {
        handle: parsedData.handle,
        displayName: parsedData.displayName,
        hash: updatedHash,
      },
      omit: userResourceOmit,
    });

    return res.send(
      createResponseBody.successSingle(
        updatedUser,
        'User successfully updated',
      ),
    );
  } catch (error) {
    return next(error);
  }
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
