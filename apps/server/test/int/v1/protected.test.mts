import type { User } from '@repo/db/prisma/client';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { client as db } from '../../../src/db/client.mjs';
import { server } from '../../../src/server.mts';
import { createLoggedInUserAndGetBearerHeader } from '../../helpers/auth.mts';
import * as dbHelpers from '../../helpers/db.mjs';
import * as dbData from '../../helpers/dbData.mjs';

async function createOtherUser(): Promise<User> {
  const user = await db.user.create({
    data: {
      id: 'other-user-id',
      handle: 'other_user',
      displayName: 'Other User Name',
      hash: '12345',
    },
  });

  return user;
}

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
        const bearerToken = await createLoggedInUserAndGetBearerHeader(
          dbData.dbUserData,
        );

        // Create chat and add user to participants.
        const chat = await db.chat.create({
          data: {
            participants: {
              connect: {
                id: dbData.dbUserData.id,
              },
            },
          },
        });

        const response = await request(server)
          .patch(`${baseUrl}/${chat.id}`)
          .set('Authorization', bearerToken);

        expect(response.status).toStrictEqual(200);
      });

      it('does not allow a user to update a chat they are not part of', async () => {
        const bearerToken = await createLoggedInUserAndGetBearerHeader(
          dbData.dbUserData,
        );

        // Create chat but leave participants empty.
        const chat = await db.chat.create({
          data: {},
        });

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
        const bearerToken = await createLoggedInUserAndGetBearerHeader(
          dbData.dbUserData,
        );

        // Create chat and add user to participants.
        const chat = await db.chat.create({
          data: {
            participants: {
              connect: {
                id: dbData.dbUserData.id,
              },
            },
          },
        });

        const response = await request(server)
          .delete(`${baseUrl}/${chat.id}`)
          .set('Authorization', bearerToken);

        expect(response.status).toStrictEqual(200);
      });

      it('does not allow a user to delete a chat they are not part of', async () => {
        const bearerToken = await createLoggedInUserAndGetBearerHeader(
          dbData.dbUserData,
        );

        // Create chat but leave participants empty.
        const chat = await db.chat.create({
          data: {},
        });

        const response = await request(server)
          .delete(`${baseUrl}/${chat.id}`)
          .set('Authorization', bearerToken);

        expect(response.status).toStrictEqual(403);
      });
    });
  });
});

describe('/v1/chat/:chatId/invite', () => {
  const baseUrl = '/v1/chat';

  describe('POST', () => {
    it('given no access token header, returns status code 401', async () => {
      const response = await request(server).post(`${baseUrl}/id/invite`);

      expect(response.status).toStrictEqual(401);
    });

    describe('given a valid access token header', () => {
      it('allows a participant in the chat to create an invite', async () => {
        const bearerToken = await createLoggedInUserAndGetBearerHeader(
          dbData.dbUserData,
        );

        // Post a chat and add user to it so we don't get 404 or 403.
        const chat = await db.chat.create({
          data: {
            participants: {
              connect: {
                id: dbData.dbUserData.id,
              },
            },
          },
        });

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
        const chat = await db.chat.create({
          data: {},
        });

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
        const bearerToken = await createLoggedInUserAndGetBearerHeader(
          dbData.dbUserData,
        );

        // Post another user and a chat so we can create an invite.
        const userToInvite = await createOtherUser();

        const chat = await db.chat.create({
          data: {
            participants: {
              connect: {
                id: dbData.dbUserData.id,
              },
            },
          },
        });

        const invite = await db.invite.create({
          data: {
            chat: {
              connect: {
                id: chat.id,
              },
            },
            createdBy: {
              connect: {
                id: dbData.dbUserData.id,
              },
            },
            invitee: {
              connect: {
                id: userToInvite.id,
              },
            },
          },
        });

        const response = await request(server)
          .delete(`${baseUrl}/${chat.id}/invite/${invite.id}`)
          .set('Authorization', bearerToken);

        expect(response.status).toStrictEqual(200);
      });

      it("does not allow a user to delete an invite they didn't create", async () => {
        const bearerToken = await createLoggedInUserAndGetBearerHeader(
          dbData.dbUserData,
        );

        // Post another user and a chat so we can create an invite.
        const userToCreateInvite = await createOtherUser();

        const chat = await db.chat.create({
          data: {
            participants: {
              connect: {
                id: dbData.dbUserData.id,
              },
            },
          },
        });

        const invite = await db.invite.create({
          data: {
            chat: {
              connect: {
                id: chat.id,
              },
            },
            createdBy: {
              connect: {
                id: userToCreateInvite.id,
              },
            },
            invitee: {
              connect: {
                id: dbData.dbUserData.id,
              },
            },
          },
        });

        const response = await request(server)
          .delete(`${baseUrl}/${chat.id}/invite/${invite.id}`)
          .set('Authorization', bearerToken);

        expect(response.status).toStrictEqual(403);
      });
    });
  });
});

describe('/v1/user', () => {
  const baseUrl = '/v1/user';

  describe('PATCH', () => {
    it('given no access token header, returns status code 401', async () => {
      const response = await request(server).patch(`${baseUrl}/user-id`);

      expect(response.status).toStrictEqual(401);
    });

    describe('given a valid access token header', () => {
      it('allows a user to update themselves', async () => {
        const accessToken = await createLoggedInUserAndGetBearerHeader(
          dbData.dbUserData,
        );

        const response = await request(server)
          .patch(`${baseUrl}/${dbData.dbUserData.id}`)
          .set('Authorization', accessToken);

        expect(response.status).toStrictEqual(200);
      });

      it("doesn't allow a user to update another user", async () => {
        const accessToken = await createLoggedInUserAndGetBearerHeader(
          dbData.dbUserData,
        );
        const otherUser = await createOtherUser();

        const response = await request(server)
          .patch(`${baseUrl}/${otherUser.id}`)
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
        const accessToken = await createLoggedInUserAndGetBearerHeader(
          dbData.dbUserData,
        );

        const response = await request(server)
          .delete(`${baseUrl}/${dbData.dbUserData.id}`)
          .set('Authorization', accessToken);

        expect(response.status).toStrictEqual(200);
      });

      it("doesn't allow a user to delete another user", async () => {
        const accessToken = await createLoggedInUserAndGetBearerHeader(
          dbData.dbUserData,
        );
        const otherUser = await createOtherUser();

        const response = await request(server)
          .delete(`${baseUrl}/${otherUser.id}`)
          .set('Authorization', accessToken);

        expect(response.status).toStrictEqual(403);
      });
    });
  });
});
