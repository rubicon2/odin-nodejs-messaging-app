import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { server } from '../../../src/server.mts';
import { createLoggedInUserAndGetBearerHeader } from '../../helpers/auth.mts';
import * as dbHelpers from '../../helpers/db.mjs';
import * as dbData from '../../helpers/dbData.mjs';

const dbCurrentUserData = dbData.dbUserData;

beforeEach(dbHelpers.clearDb);

describe('/v1/chat', () => {
  const baseUrl = '/v1/chat';

  describe('POST', () => {
    it('given no access token header, returns status code 401', async () => {
      const response = await request(server).post(baseUrl);

      expect(response.status).toStrictEqual(401);
    });

    it('given a valid access token header, allows access', async () => {
      const bearerToken = await createLoggedInUserAndGetBearerHeader(
        dbData.dbUserData,
      );

      const response = await request(server)
        .post(baseUrl)
        .set('Authorization', bearerToken);

      // Since we are not providing the correct data, will be code 400 instead of 200.
      expect(response.status).toStrictEqual(400);
    });
  });

  describe('PATCH', () => {
    it('given no access token header, returns status code 401', async () => {
      const response = await request(server).patch(`${baseUrl}/id`);

      expect(response.status).toStrictEqual(401);
    });

    describe('given a valid access token header', async () => {
      it('allows a user to update a chat they are participating in', async () => {
        const bearerToken =
          await createLoggedInUserAndGetBearerHeader(dbCurrentUserData);

        // Create chat and add user to participants.
        const chat = await dbHelpers.postChat(
          dbData.chatData(dbCurrentUserData.id),
        );
        await dbHelpers.addUserToChat(dbCurrentUserData.id, chat.id);

        const response = await request(server)
          .patch(`${baseUrl}/${chat.id}`)
          .set('Authorization', bearerToken);

        expect(response.status).toStrictEqual(200);
      });

      it('does not allow a user to update a chat they are not part of', async () => {
        const bearerToken =
          await createLoggedInUserAndGetBearerHeader(dbCurrentUserData);

        // Create chat but leave participants empty.
        const chat = await dbHelpers.postChat(
          dbData.chatData(dbCurrentUserData.id),
        );

        const response = await request(server)
          .patch(`${baseUrl}/${chat.id}`)
          .set('Authorization', bearerToken);

        expect(response.status).toStrictEqual(403);
      });
    });
  });

  describe('DELETE', () => {
    it('given no access token header, returns status code 401', async () => {
      const response = await request(server).delete(`${baseUrl}/id`);

      expect(response.status).toStrictEqual(401);
    });

    describe('given a valid access token header', () => {
      it('allows a user to delete a chat they are participating in', async () => {
        const bearerToken =
          await createLoggedInUserAndGetBearerHeader(dbCurrentUserData);

        // Create chat and add user to participants.
        const chat = await dbHelpers.postChat(
          dbData.chatData(dbCurrentUserData.id),
        );
        await dbHelpers.addUserToChat(dbCurrentUserData.id, chat.id);

        const response = await request(server)
          .delete(`${baseUrl}/${chat.id}`)
          .set('Authorization', bearerToken);

        expect(response.status).toStrictEqual(200);
      });

      it('does not allow a user to delete a chat they are not part of', async () => {
        const bearerToken =
          await createLoggedInUserAndGetBearerHeader(dbCurrentUserData);

        // Create chat but leave participants empty.
        const chat = await dbHelpers.postChat(
          dbData.chatData(dbCurrentUserData.id),
        );

        const response = await request(server)
          .delete(`${baseUrl}/${chat.id}`)
          .set('Authorization', bearerToken);

        expect(response.status).toStrictEqual(403);
      });
    });
  });
});

describe('/v1/chat/:chatId/invite', () => {
  const dbInvitedUserData = dbData.dbUserData2;
  const baseUrl = '/v1/chat';

  describe('POST', () => {
    it('given no access token header, returns status code 401', async () => {
      const response = await request(server).post(`${baseUrl}/id/invite`);

      expect(response.status).toStrictEqual(401);
    });

    describe('given a valid access token header', () => {
      it('allows a participant in the chat to create an invite', async () => {
        const bearerToken =
          await createLoggedInUserAndGetBearerHeader(dbCurrentUserData);

        // Post a chat and add user to it so we don't get 404 or 403.
        const chat = await dbHelpers.postChat(
          dbData.chatData(dbCurrentUserData.id),
        );
        await dbHelpers.addUserToChat(dbCurrentUserData.id, chat.id);

        const response = await request(server)
          .post(`${baseUrl}/${chat.id}/invite`)
          .set('Authorization', bearerToken);

        // Since we are not providing the correct data, will be code 400 instead of 200.
        expect(response.status).toStrictEqual(400);
      });

      it('does not allow a user to create an invite for a chat they are not part of', async () => {
        const bearerToken = await createLoggedInUserAndGetBearerHeader(
          dbData.dbUserData,
        );

        // Post a chat but don't add any participants.
        const chat = await dbHelpers.postChat(
          dbData.chatData(dbCurrentUserData.id),
        );

        const response = await request(server)
          .post(`${baseUrl}/${chat.id}/invite`)
          .set('Authorization', bearerToken);

        // Since we are not providing the correct data, will be code 400 instead of 200.
        expect(response.status).toStrictEqual(403);
      });
    });
  });

  describe('DELETE', () => {
    it('given no access token header, returns status code 401', async () => {
      const response = await request(server).delete(
        `${baseUrl}/chat-id/invite/invite-id`,
      );

      expect(response.status).toStrictEqual(401);
    });

    describe('given a valid access token header', () => {
      it('allows a user to delete an invite they created', async () => {
        const bearerToken =
          await createLoggedInUserAndGetBearerHeader(dbCurrentUserData);

        // Post a chat and another user so we can create an invite.
        const chat = await dbHelpers.postChat(
          dbData.chatData(dbCurrentUserData.id),
        );
        await dbHelpers.addUserToChat(dbCurrentUserData.id, chat.id);
        await dbHelpers.postUser(dbInvitedUserData);
        // The currently logged in user, who is part of the chat, invites the other user to join the chat.
        const invite = await dbHelpers.postInvite(
          dbData.inviteData(
            dbCurrentUserData.id,
            dbInvitedUserData.id,
            chat.id,
          ),
        );

        // The currently logged in user tries to delete the invite and is successful.
        const response = await request(server)
          .delete(`${baseUrl}/${invite.chatId}/invite/${invite.id}`)
          .set('Authorization', bearerToken);

        expect(response.status).toStrictEqual(200);
      });

      it("does not allow a user to delete an invite they didn't create", async () => {
        const bearerToken =
          await createLoggedInUserAndGetBearerHeader(dbCurrentUserData);

        // Post another user and create a chat that belongs to them, not the current user.
        const dbOtherUserData = dbData.dbUserData2;
        await dbHelpers.postUser(dbOtherUserData);

        const chat = await dbHelpers.postChat(
          dbData.chatData(dbOtherUserData.id),
        );
        await dbHelpers.addUserToChat(dbOtherUserData.id, chat.id);
        // The other user creates an invite to the currently logged in user.
        const invite = await dbHelpers.postInvite(
          dbData.inviteData(dbOtherUserData.id, dbCurrentUserData.id, chat.id),
        );

        // The current user tries to delete the invite, but they should not be allowed.
        const response = await request(server)
          .delete(`${baseUrl}/${chat.id}/invite/${invite.id}`)
          .set('Authorization', bearerToken);

        expect(response.status).toStrictEqual(403);
      });
    });
  });
});

describe('/v1/chat/:chatId/invite/:inviteId/accept', () => {
  // Aliases for same data to make roles clearer in tests.
  const dbChatParticipantData = dbData.dbUserData;
  const dbInvitedUserData = dbData.dbUserData2;
  const baseUrl = '/v1/chat';

  describe('POST', () => {
    it('given no access token header, returns status code 401', async () => {
      const response = await request(server).post(
        `${baseUrl}/chat-id/invite/invite-id/accept`,
      );

      expect(response.status).toStrictEqual(401);
    });

    describe('given a valid access token header', () => {
      it('allows the user to accept an invite if they are the invitee', async () => {
        const bearerToken =
          await createLoggedInUserAndGetBearerHeader(dbInvitedUserData);

        // Post another user and a chat so we can create an invite to the currently logged in user.
        await dbHelpers.postUser(dbChatParticipantData);
        const chat = await dbHelpers.postChat(
          dbData.chatData(dbChatParticipantData.id),
        );
        await dbHelpers.addUserToChat(dbChatParticipantData.id, chat.id);

        const invite = await dbHelpers.postInvite(
          dbData.inviteData(
            dbChatParticipantData.id,
            dbInvitedUserData.id,
            chat.id,
          ),
        );

        const response = await request(server)
          .post(`${baseUrl}/${chat.id}/invite/${invite.id}/accept`)
          .set('Authorization', bearerToken);

        // No body fields are required, so returns 200.
        expect(response.status).toStrictEqual(200);
      });

      it("doesn't allow a user to accept an invite if they are not the invitee", async () => {
        const bearerToken = await createLoggedInUserAndGetBearerHeader(
          dbChatParticipantData,
        );

        // Post another user and a chat so we can create an invite to the currently logged in user.
        await dbHelpers.postUser(dbInvitedUserData);
        const chat = await dbHelpers.postChat(
          dbData.chatData(dbChatParticipantData.id),
        );
        await dbHelpers.addUserToChat(dbChatParticipantData.id, chat.id);
        const invite = await dbHelpers.postInvite(
          dbData.inviteData(
            dbChatParticipantData.id,
            dbInvitedUserData.id,
            chat.id,
          ),
        );

        const response = await request(server)
          .post(`${baseUrl}/${chat.id}/invite/${invite.id}/accept`)
          .set('Authorization', bearerToken);

        expect(response.status).toStrictEqual(403);
      });
    });
  });
});

describe('/v1/user', () => {
  const dbOtherUserData = dbData.dbUserData2;
  const baseUrl = '/v1/user';

  describe('PATCH', () => {
    it('given no access token header, returns status code 401', async () => {
      const response = await request(server).patch(`${baseUrl}/user-id`);

      expect(response.status).toStrictEqual(401);
    });

    describe('given a valid access token header', () => {
      it('allows a user to update themselves', async () => {
        const accessToken =
          await createLoggedInUserAndGetBearerHeader(dbCurrentUserData);

        const response = await request(server)
          .patch(`${baseUrl}/${dbCurrentUserData.id}`)
          .set('Authorization', accessToken);

        expect(response.status).toStrictEqual(200);
      });

      it("doesn't allow a user to update another user", async () => {
        const accessToken =
          await createLoggedInUserAndGetBearerHeader(dbCurrentUserData);

        await dbHelpers.postUser(dbOtherUserData);

        const response = await request(server)
          .patch(`${baseUrl}/${dbOtherUserData.id}`)
          .set('Authorization', accessToken);

        expect(response.status).toStrictEqual(403);
      });
    });
  });

  describe('DELETE', () => {
    it('given no access token header, returns status code 401', async () => {
      const response = await request(server).delete(`${baseUrl}/user-id`);

      expect(response.status).toStrictEqual(401);
    });

    describe('given a valid access token header', () => {
      it('allows a user to delete themselves', async () => {
        const accessToken =
          await createLoggedInUserAndGetBearerHeader(dbCurrentUserData);

        const response = await request(server)
          .delete(`${baseUrl}/${dbCurrentUserData.id}`)
          .set('Authorization', accessToken);

        expect(response.status).toStrictEqual(200);
      });

      it("doesn't allow a user to delete another user", async () => {
        const accessToken =
          await createLoggedInUserAndGetBearerHeader(dbCurrentUserData);
        await dbHelpers.postUser(dbOtherUserData);

        const response = await request(server)
          .delete(`${baseUrl}/${dbOtherUserData.id}`)
          .set('Authorization', accessToken);

        expect(response.status).toStrictEqual(403);
      });
    });
  });
});
