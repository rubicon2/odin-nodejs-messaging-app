import type {
  UserOrderByWithRelationInput,
  UserWhereInput,
} from '@repo/db/prisma/models';
import * as createResponseBody from '@repo/response-json';
import { chains as searchChains } from '@repo/schemas/search';
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

export const del: RequestHandler = async (req, res, next) => {
  try {
    const userResource = req.resource as UserResource;

    const deletedUser = await db.user.delete({
      where: {
        id: userResource.id,
      },
      omit: userResourceOmit,
    });

    return res.json(
      createResponseBody.successSingle(
        deletedUser,
        'User successfully deleted',
      ),
    );
  } catch (error) {
    return next(error);
  }
};

export const getOne: RequestHandler = (req, res, next) => {
  try {
    const userResource = req.resource as UserResource;
    return res.json(createResponseBody.successSingle(userResource));
  } catch (error) {
    return next(error);
  }
};

export const getMany: RequestHandler = async (req, res, next) => {
  try {
    const parseResult = searchChains.searchUserParams.safeParse(req.query);
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

    // Create where object so can re-use in findMany and total queries.
    let where: UserWhereInput | undefined;
    if (parsedData.q) {
      where = {
        OR: [
          {
            handle: {
              contains: parsedData.q,
              mode: 'insensitive',
            },
          },
          {
            displayName: {
              contains: parsedData.q,
              mode: 'insensitive',
            },
          },
        ],
      };
    }

    const orderBy: UserOrderByWithRelationInput[] = parsedData.orderBy.map(
      (columnName, index) => ({
        // If there is not a sortOrder at the same position, default to 'asc'.
        [columnName]: parsedData.sortOrder?.[index] ?? 'asc',
      }),
    );

    const cursor =
      parsedData.cursor === undefined ? undefined : { id: parsedData.cursor };

    const users = await db.user.findMany({
      take: parsedData.take,
      skip: parsedData.skip,
      cursor,
      where,
      orderBy,
      omit: userResourceOmit,
    });

    const total = await db.user.count({
      where,
      orderBy,
    });

    const meta = createResponseBody.pagedResponseMeta(
      total,
      parsedData.take,
      parsedData.skip,
    );
    return res.json(createResponseBody.successPaged(meta, users));
  } catch (error) {
    return next(error);
  }
};
