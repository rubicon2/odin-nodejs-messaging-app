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

const dbChatParticipantUserData = dbData.dbUserData;
const dbInvitedUserData = dbData.dbUserData2;
const dbChatData = dbData.chatData(dbChatParticipantUserData.id);

beforeEach(dbHelpers.clearDb);

describe('/v1/chat/:chatId/invite', () => {
  const baseUrl = `/v1/chat/${dbChatData.id}/invite`;

  describe('POST', () => {
    describe('given the correct data', () => {
      it('returns status code 200', async () => {
        const accessToken = await createLoggedInUserAndGetBearerHeader(
          dbChatParticipantUserData,
        );

        await dbHelpers.postChat(dbChatData);
        await dbHelpers.addUserToChat(
          dbChatParticipantUserData.id,
          dbChatData.id,
        );
        await dbHelpers.postUser(dbInvitedUserData);

        const response = await request(server)
          .post(baseUrl)
          .set('Authorization', accessToken)
          .send({
            invitedUserId: dbInvitedUserData.id,
          });

        expect(response.status).toStrictEqual(200);
      });

      it('posts a new invite to the database and returns it', async () => {
        const accessToken = await createLoggedInUserAndGetBearerHeader(
          dbChatParticipantUserData,
        );

        await dbHelpers.postChat(dbChatData);
        await dbHelpers.addUserToChat(
          dbChatParticipantUserData.id,
          dbChatData.id,
        );
        await dbHelpers.postUser(dbInvitedUserData);

        const response = await request(server)
          .post(baseUrl)
          .set('Authorization', accessToken)
          .send({
            invitedUserId: dbInvitedUserData.id,
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
                    displayName: dbChatParticipantUserData.displayName,
                    handle: dbChatParticipantUserData.handle,
                    id: dbChatParticipantUserData.id,
                  },
                ],
                title: dbChatData.title,
              },
              chatId: dbChatData.id,
              createdAt: expect.any(String),
              createdBy: {
                displayName: dbChatParticipantUserData.displayName,
                handle: dbChatParticipantUserData.handle,
                id: dbChatParticipantUserData.id,
              },
              createdById: dbData.dbUserData.id,
              id: expect.any(String),
              invitee: {
                displayName: dbInvitedUserData.displayName,
                handle: dbInvitedUserData.handle,
                id: dbInvitedUserData.id,
              },
              inviteeId: dbInvitedUserData.id,
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
            dbChatParticipantUserData,
          );

          await dbHelpers.postChat(dbChatData);
          await dbHelpers.addUserToChat(
            dbChatParticipantUserData.id,
            dbChatData.id,
          );
          await dbHelpers.postUser(dbInvitedUserData);

          const goodData = {
            invitedUserId: dbInvitedUserData.id,
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
        dbChatParticipantUserData,
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
          dbChatParticipantUserData,
        );

        // Since whether invite can be deleted depends on its creator,
        // don't need to bother adding the user to the chat in this test.
        await dbHelpers.postChat(dbChatData);
        // But need another user to satisfy foreign key constraints.
        await dbHelpers.postUser(dbInvitedUserData);

        const dbInviteData = dbData.inviteData(
          dbChatParticipantUserData.id,
          dbInvitedUserData.id,
          dbChatData.id,
        );
        const invite = await dbHelpers.postInvite(dbInviteData);

        // dbHelpers return plain objects with no omissions or includes.
        // Get it with the includes as returned by server for easier comparison.
        const inviteWithIncludes = await db.invite.findUnique({
          ...inviteResourceArgs,
          where: {
            id: invite.id,
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
            // biome-ignore lint: We know this is not going to be null.
            item: convertObjectDatesToStrings(inviteWithIncludes!),
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

describe('/v1/chat/:chatId/invite/:inviteId/accept', () => {
  const baseUrl = `/v1/chat/${dbChatData.id}/invite`;

  describe('POST', () => {
    it("given the invitee's access token, responds with status code 200 and a message", async () => {
      const accessToken =
        await createLoggedInUserAndGetBearerHeader(dbInvitedUserData);

      await dbHelpers.postUser(dbChatParticipantUserData);
      const chat = await dbHelpers.postChat(dbChatData);
      const invite = await dbHelpers.postInvite(
        dbData.inviteData(
          dbChatParticipantUserData.id,
          dbInvitedUserData.id,
          chat.id,
        ),
      );

      const response = await request(server)
        .post(`${baseUrl}/${invite.id}/accept`)
        .set('Authorization', accessToken);

      expect(response.status).toStrictEqual(200);
      expect(response.body).toStrictEqual({
        status: 'success',
        message: 'Successfully accepted invite',
        data: {},
      });
    });

    it('adds the invited user to the chat participants', async () => {
      const accessToken =
        await createLoggedInUserAndGetBearerHeader(dbInvitedUserData);

      await dbHelpers.postUser(dbChatParticipantUserData);
      const chat = await dbHelpers.postChat(dbChatData);
      const invite = await dbHelpers.postInvite(
        dbData.inviteData(
          dbChatParticipantUserData.id,
          dbInvitedUserData.id,
          chat.id,
        ),
      );

      // Check invited user isn't already in chat participants before route is accessed.
      let dbChat = await db.chat.findUnique({
        where: {
          id: chat.id,
        },
        include: {
          participants: true,
        },
      });

      expect(dbChat).not.toBeNull();
      expect(
        dbChat?.participants.map((p) => p.id).includes(dbInvitedUserData.id),
      ).toStrictEqual(false);

      const response = await request(server)
        .post(`${baseUrl}/${invite.id}/accept`)
        .set('Authorization', accessToken);

      // Just to make sure the response was successful before making assertions.
      expect(response.status).toStrictEqual(200);

      dbChat = await db.chat.findUnique({
        where: {
          id: chat.id,
        },
        include: {
          participants: true,
        },
      });

      // Now invite has been accepted, invited user's id should be in participant ids.
      expect(
        dbChat?.participants.map((p) => p.id).includes(dbInvitedUserData.id),
      ).toStrictEqual(true);
    });

    it('deletes all invites to the chat once accepted', async () => {
      const accessToken =
        await createLoggedInUserAndGetBearerHeader(dbInvitedUserData);

      await dbHelpers.postUser(dbChatParticipantUserData);
      const chat = await dbHelpers.postChat(dbChatData);
      const invite = await dbHelpers.postInvite(
        dbData.inviteData(
          dbChatParticipantUserData.id,
          dbInvitedUserData.id,
          chat.id,
        ),
      );

      // Create a second user and invite so we can make sure
      // all invites are deleted, not just the accepted one.
      const otherUser = await dbHelpers.postUser({
        ...dbChatParticipantUserData,
        id: 'other-user-id',
        handle: 'some_other_user_handle',
        displayName: 'mega face',
      });
      await dbHelpers.postInvite(
        dbData.inviteData(otherUser.id, dbInvitedUserData.id, dbChatData.id),
      );

      const response = await request(server)
        .post(`${baseUrl}/${invite.id}/accept`)
        .set('Authorization', accessToken);

      // Just to make sure the response was successful before making assertions.
      expect(response.status).toStrictEqual(200);

      const dbInvites = await db.invite.findMany({
        where: {
          chatId: dbChatData.id,
          inviteeId: dbInvitedUserData.id,
        },
      });

      expect(dbInvites.length).toStrictEqual(0);
    });
  });
});
