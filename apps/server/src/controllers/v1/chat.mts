import * as createResponseBody from '@repo/response-json';
import type { RequestHandler } from 'express';
import type { ChatResource } from '../../db/chatResource.mjs';
import { chatResourceArgs } from '../../db/chatResource.mjs';
import { client as db } from '../../db/client.mjs';
import { sendFailValidationResponse } from '../../ext/sendFailValidationResponse.mjs';
import { chains } from '../../schemas/serverChat.mjs';

export const post: RequestHandler = async (req, res, next) => {
  try {
    const parseResult = await chains.post().safeParseAsync(req.body);
    if (!parseResult.success) {
      return sendFailValidationResponse(req, res, parseResult.error);
    }

    const { createdByUserId, invitedUserIds, title } = parseResult.data;

    const { chat } = await db.$transaction(async (tx) => {
      const chat = await tx.chat.create({
        data: {
          createdBy: {
            connect: {
              id: createdByUserId,
            },
          },
          title,
          participants: {
            connect: {
              // By default, include the user that created the chat.
              id: createdByUserId,
            },
          },
          // Create invites separately once we have the chat id.
        },
      });

      const invites = await tx.invite.createManyAndReturn({
        data: invitedUserIds.map((invitedUserId) => ({
          createdById: createdByUserId,
          inviteeId: invitedUserId,
          chatId: chat.id,
        })),
      });

      return { chat, invites };
    });

    /**
     * Now return chat with ids and everything else we want.
     * Initially this was part of the transaction, but when
     * using chatResourceInclude it would produce a deprecation
     * warning from pg library - "calling client.query()" when
     * the client is already executing a query is deprecated".
     * But it works fine here. I guess it is a bug.
     */
    const chatResource = await db.chat.findUnique({
      // Spread, so if args change, nothing needs to be updated here.
      ...chatResourceArgs,
      where: {
        id: chat.id,
      },
    });

    return res.json(
      createResponseBody.successSingle(
        chatResource,
        'Chat successfully created',
      ),
    );
  } catch (error) {
    return next(error);
  }
};

export const patch: RequestHandler = async (req, res, next) => {
  try {
    const chatResource = req.resource as ChatResource;

    const parseResult = await chains.updatePartial().safeParseAsync(req.body);

    if (!parseResult.success) {
      return sendFailValidationResponse(req, res, parseResult.error);
    }

    const parsedData = parseResult.data;

    const updatedChat: ChatResource = await db.chat.update({
      ...chatResourceArgs,
      where: {
        id: chatResource.id,
      },
      data: {
        title: parsedData.title,
      },
    });

    return res.json(
      createResponseBody.successSingle(
        updatedChat,
        'Chat successfully updated',
      ),
    );
  } catch (error) {
    return next(error);
  }
};

export const del: RequestHandler = async (req, res, next) => {
  try {
    const chatResource = req.resource as ChatResource;

    if (chatResource.participants.length > 1) {
      /**
       * Using status code 400 because a participant does have permission, and
       * if they retry later when other users have left, they will succeed.
       */
      return res
        .status(400)
        .send(
          createResponseBody.fail(
            'Cannot delete a chat with more than one participant',
          ),
        );
    }

    await db.chat.delete({
      where: {
        id: chatResource.id,
      },
    });

    return res.json(
      createResponseBody.successSingle(
        chatResource,
        'Chat successfully deleted',
      ),
    );
  } catch (error) {
    return next(error);
  }
};
