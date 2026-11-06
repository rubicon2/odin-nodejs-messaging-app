import * as createResponseBody from '@repo/response-json';
import type { RequestHandler } from 'express';
import { client as db } from '../../db/client.mjs';
import {
  type InviteResource,
  inviteResourceArgs,
} from '../../db/inviteResource.mjs';
import type { UserResource } from '../../db/userResource.mjs';
import { sendFailValidationResponse } from '../../ext/sendFailValidationResponse.mjs';
import { chains } from '../../schemas/serverInvite.mjs';

export const post: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user as UserResource;
    if (!user) throw new Error('No user in req.user');

    const chatId = req.params.chatId as string;

    const parseResult = await chains.post().safeParseAsync(req.body);
    if (!parseResult.success) {
      return sendFailValidationResponse(req, res, parseResult.error);
    }

    const { invitedUserId } = parseResult.data;
    const createdByUserId = user.id;

    const inviteResource = await db.invite.create({
      ...inviteResourceArgs,
      data: {
        chat: {
          connect: {
            id: chatId,
          },
        },
        createdBy: {
          connect: {
            id: createdByUserId,
          },
        },
        invitee: {
          connect: {
            id: invitedUserId,
          },
        },
      },
    });

    return res.json(
      createResponseBody.successSingle(
        inviteResource,
        'Invite successfully created',
      ),
    );
  } catch (error) {
    return next(error);
  }
};

export const del: RequestHandler = async (req, res, next) => {
  try {
    const inviteResource = req.resource as InviteResource;

    await db.invite.delete({
      where: {
        id: inviteResource.id,
      },
    });

    return res.json(
      createResponseBody.successSingle(
        inviteResource,
        'Invite successfully deleted',
      ),
    );
  } catch (error) {
    return next(error);
  }
};
