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

type TestCaseData = { method: AllMethods; url: string; setupFn?: () => void };

const routeTestCases: Record<string, TestCaseData> = {
  patchUser: {
    method: 'patch',
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
  describe.each([routeTestCases.patchUser])(
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
