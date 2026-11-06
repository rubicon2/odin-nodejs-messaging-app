import { convertObjectDatesToStrings } from '@repo/all-dates-to-iso-strings';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { client as db } from '../../../src/db/client.mjs';
import { inviteResourceArgs } from '../../../src/db/inviteResource.mts';
import { server } from '../../../src/server.mjs';
import { createLoggedInUserAndGetBearerHeader } from '../../helpers/auth.mjs';
import * as dbHelpers from '../../helpers/db.mjs';
import * as dbData from '../../helpers/dbData.mjs';

interface ValidationTestCaseData {
  testType: string;
  badData: Record<string, unknown>;
  expectedBodyData: {
    errors: string[];
    properties: Record<
      string,
      { errors: string[]; items?: { errors: string[] }[] }
    >;
  };
  setupFn?: () => void;
}

const validationTestCaseData: Record<string, ValidationTestCaseData> = {
  invitedUserIdMissing: {
    testType: 'missing invitedUserId',
    badData: { invitedUserId: undefined },
    expectedBodyData: {
      errors: [],
      properties: {
        invitedUserId: {
          errors: ['Required field'],
        },
      },
    },
  },
};

const dbChatData = {
  id: 'chat-id',
  title: 'My Amazing Chat',
};

const dbUserToInviteData = {
  id: '2',
  handle: 'invited_user',
  displayName: 'Invited User',
  hash: '12345',
};

async function addUserToChat(chatId: string, userId: string) {
  await db.chat.update({
    where: {
      id: chatId,
    },
    data: {
      participants: {
        connect: {
          id: userId,
        },
      },
    },
  });
}

async function createChatAndUserToInvite() {
  await db.user.create({
    data: dbUserToInviteData,
  });
  await db.chat.create({
    data: dbChatData,
  });
}

/**
 * Need to call createChatAndUserToInvite
 * function, otherwise this will return a 404.
 */
const baseUrl = `/v1/chat/${dbChatData.id}/invite`;

beforeEach(dbHelpers.clearDb);

describe(baseUrl, () => {
  describe('POST', () => {
    describe('given the correct data', () => {
      it('returns status code 200', async () => {
        const accessToken = await createLoggedInUserAndGetBearerHeader(
          dbData.dbUserData,
        );

        await createChatAndUserToInvite();
        await addUserToChat(dbChatData.id, dbData.dbUserData.id);

        const response = await request(server)
          .post(baseUrl)
          .set('Authorization', accessToken)
          .send({
            invitedUserId: dbUserToInviteData.id,
          });

        expect(response.status).toStrictEqual(200);
      });

      it('posts a new invite to the database and returns it', async () => {
        const accessToken = await createLoggedInUserAndGetBearerHeader();

        await createChatAndUserToInvite();
        await addUserToChat(dbChatData.id, dbData.dbUserData.id);

        const response = await request(server)
          .post(baseUrl)
          .set('Authorization', accessToken)
          .send({
            invitedUserId: dbUserToInviteData.id,
          });

        expect(response.body).toStrictEqual({
          status: 'success',
          message: 'Invite successfully created',
          data: {
            item: {
              chat: {
                id: dbChatData.id,
                participants: [
                  {
                    displayName: dbData.dbUserData.displayName,
                    handle: dbData.dbUserData.handle,
                    id: dbData.dbUserData.id,
                  },
                ],
                title: dbChatData.title,
              },
              chatId: dbChatData.id,
              createdAt: expect.any(String),
              createdBy: {
                displayName: dbData.dbUserData.displayName,
                handle: dbData.dbUserData.handle,
                id: dbData.dbUserData.id,
              },
              createdById: dbData.dbUserData.id,
              id: expect.any(String),
              invitee: {
                displayName: dbUserToInviteData.displayName,
                handle: dbUserToInviteData.handle,
                id: dbUserToInviteData.id,
              },
              inviteeId: dbUserToInviteData.id,
            },
          },
        });

        const dbInvite = await db.invite.findUnique({
          where: {
            id: response.body.data.item.id,
          },
        });

        expect(dbInvite).not.toBeNull();
      });
    });

    describe('given incorrect data', () => {
      it.each(Object.values(validationTestCaseData))(
        'when $testType, returns status code 400 and an error message',
        async ({ badData, expectedBodyData }) => {
          const accessToken = await createLoggedInUserAndGetBearerHeader(
            dbData.dbUserData,
          );

          await createChatAndUserToInvite();
          await addUserToChat(dbChatData.id, dbData.dbUserData.id);

          const goodData = {
            invitedUserId: dbUserToInviteData.id,
          };

          const response = await request(server)
            .post(baseUrl)
            .set('Authorization', accessToken)
            .send({
              ...goodData,
              ...badData,
            });

          expect(response.status).toStrictEqual(400);
          expect(response.body).toStrictEqual({
            status: 'fail-validation',
            data: expectedBodyData,
          });
        },
      );
    });
  });

  describe('DELETE', () => {
    it('given an invalid inviteId param, returns status code 404 and a message', async () => {
      const bearerToken = await createLoggedInUserAndGetBearerHeader(
        dbData.dbUserData,
      );

      const response = await request(server)
        .delete(`${baseUrl}/invalid-id`)
        .set('Authorization', bearerToken);

      expect(response.statusCode).toStrictEqual(404);
      expect(response.body).toStrictEqual({
        status: 'fail',
        message: 'Not found',
      });
    });

    describe('given a valid inviteId param', () => {
      it('deletes the invite from the database and returns it', async () => {
        const bearerToken = await createLoggedInUserAndGetBearerHeader(
          dbData.dbUserData,
        );

        // Since whether invite can be deleted depends on its creator,
        // don't need to add user to the chat in this test.
        await createChatAndUserToInvite();

        // Create an invite to delete.
        const invite = await db.invite.create({
          ...inviteResourceArgs,
          data: {
            chat: {
              connect: {
                id: dbChatData.id,
              },
            },
            createdBy: {
              connect: {
                id: dbData.dbUserData.id,
              },
            },
            invitee: {
              connect: {
                id: dbUserToInviteData.id,
              },
            },
          },
        });

        const response = await request(server)
          .delete(`${baseUrl}/${invite.id}`)
          .set('Authorization', bearerToken);

        expect(response.statusCode).toStrictEqual(200);
        expect(response.body).toStrictEqual({
          status: 'success',
          message: 'Invite successfully deleted',
          data: {
            item: convertObjectDatesToStrings(invite),
          },
        });

        // Check it is gone from the database.
        const deletedInvite = await db.invite.findUnique({
          where: {
            id: invite.id,
          },
        });

        expect(deletedInvite).toBeNull();
      });
    });
  });
});
