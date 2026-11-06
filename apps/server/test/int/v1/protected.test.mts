import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { client as db } from '../../../src/db/client.mjs';
import { server } from '../../../src/server.mts';
import {
  createBearerHeader,
  createLoggedInUserAndGetBearerHeader,
} from '../../helpers/auth.mts';
import * as dbHelpers from '../../helpers/db.mjs';
import * as dbData from '../../helpers/dbData.mjs';

/**
 * There are other http methods but these are
 * the ones we are going to be testing.
 */
type AllMethods = 'delete' | 'get' | 'patch' | 'post' | 'put';

/**
 * setupFn is for when we need to post an existing resource
 * so we can PUT, PATCH or DELETE it in the test. It is good
 * to have it together in the test data since the url depends
 * on the id of the created resource.
 */
type TestCaseData = { method: AllMethods; url: string; setupFn?: () => void };

const routeTestCases: Record<string, TestCaseData> = {
  postChat: {
    method: 'post',
    url: `/v1/chat`,
  },
  postInvite: {
    method: 'post',
    url: '/v1/chat/my-chat/invite',
    setupFn: async () => {
      // User needs to be part of chat to make an invite.
      await db.chat.create({
        data: {
          id: 'my-chat',
        },
      });
    },
  },
  patchChat: {
    method: 'patch',
    url: `/v1/chat/my-chat`,
    setupFn: async () => {
      // Post user so we can make them a chat participant, then create access token in test.
      await db.user.create({
        data: dbData.dbUserData,
      });

      await db.chat.create({
        data: {
          id: 'my-chat',
          title: 'My Chat Title',
          participants: {
            connect: {
              id: dbData.dbUserData.id,
            },
          },
        },
      });
    },
  },
  deleteChat: {
    method: 'delete',
    url: `/v1/chat/my-chat`,
    setupFn: async () => {
      // Post user so we can make them a chat participant, then create access token in test.
      await db.user.create({
        data: dbData.dbUserData,
      });

      await db.chat.create({
        data: {
          id: 'my-chat',
          title: 'My Chat Title',
          participants: {
            connect: {
              id: dbData.dbUserData.id,
            },
          },
        },
      });
    },
  },
  deleteInvite: {
    method: 'post',
    url: '/v1/chat/my-chat/invite/my-invite',
    setupFn: async () => {
      await db.chat.create({
        data: {
          id: 'my-chat',
        },
      });
    },
  },
  patchUser: {
    method: 'patch',
    url: `/v1/user/${dbData.dbUserData.id}`,
    setupFn: async () => {
      await db.user.create({
        data: dbData.dbUserData,
      });
    },
  },
  deleteUser: {
    method: 'delete',
    url: `/v1/user/${dbData.dbUserData.id}`,
    setupFn: async () => {
      await db.user.create({
        data: dbData.dbUserData,
      });
    },
  },
};

beforeEach(dbHelpers.clearDb);

describe('given no access token, returns status code 401 and a message', () => {
  it.each(Object.values(routeTestCases))(
    '$method $url',
    async ({ method, url, setupFn }) => {
      if (setupFn) {
        await setupFn();
      }

      const response = await request(server)[method](url);

      expect(response.status).toStrictEqual(401);
      expect(response.body).toStrictEqual({
        status: 'fail',
        message: 'You are not logged in',
      });
    },
  );
});

describe('given a valid access token', () => {
  describe('POST', () => {
    describe('/v1/chat', () => {
      it('allows a user to post a new resource', async () => {
        const bearerToken = await createLoggedInUserAndGetBearerHeader(
          dbData.dbUserData,
        );

        const response = await request(server)
          .post('/v1/chat')
          .set('Authorization', bearerToken);

        // Since we are not providing the correct data, will be code 400 instead of 200.
        expect(response.status).toStrictEqual(400);
      });
    });

    describe('/v1/chat/:chatId/invite', () => {
      it('allows a user to post a new resource', async () => {
        const bearerToken = await createLoggedInUserAndGetBearerHeader(
          dbData.dbUserData,
        );

        // Post a chat and add user to it so we don't get 404 or 403.
        const chat = await db.chat.create({
          data: {
            title: 'My Amazing Chat',
            participants: {
              connect: {
                id: dbData.dbUserData.id,
              },
            },
          },
        });

        const response = await request(server)
          .post(`/v1/chat/${chat.id}/invite`)
          .set('Authorization', bearerToken);

        // Since we are not providing the correct data, will be code 400 instead of 200.
        expect(response.status).toStrictEqual(400);
      });
    });
  });

  describe.each([routeTestCases.patchChat, routeTestCases.deleteChat])(
    '$method $url',
    ({ method, url, setupFn }) => {
      it('allows a user to update a chat they are participating in', async () => {
        if (setupFn) {
          await setupFn();
        }

        // User created on db in setupFn, for these tests.
        const bearerToken = createBearerHeader(dbData.dbUserData);

        const response = await request(server)
          [method](url)
          .set('Authorization', bearerToken);

        expect(response.status).toStrictEqual(200);
      });

      it('does not allow a user to update a chat they are not part of', async () => {
        if (setupFn) {
          await setupFn();
        }

        const bearerToken = await createLoggedInUserAndGetBearerHeader({
          ...dbData.dbUserData,
          id: 'some-other-user-id',
          handle: 'some_other_handle',
        });

        const response = await request(server)
          [method](url)
          .set('Authorization', bearerToken);

        expect(response.status).toStrictEqual(403);
      });
    },
  );

  describe.each([routeTestCases.patchUser, routeTestCases.deleteUser])(
    '$method $url',
    ({ method, url, setupFn }) => {
      it('allows a user to update themselves', async () => {
        if (setupFn) {
          await setupFn();
        }

        const bearerToken = createBearerHeader(dbData.dbUserData);

        const response = await request(server)
          [method](url)
          .set('Authorization', bearerToken);

        expect(response.status).toStrictEqual(200);
      });

      it('does not allow a user to update another user', async () => {
        if (setupFn) {
          await setupFn();
        }

        // Log in as a different user from that which we are trying to update.
        const bearerToken = await createLoggedInUserAndGetBearerHeader({
          ...dbData.dbUserData,
          id: 'other-user-id',
          handle: 'other_user',
        });

        const response = await request(server)
          [method](url)
          .set('Authorization', bearerToken);

        expect(response.status).toStrictEqual(403);
      });
    },
  );
});
