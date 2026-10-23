import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../../src/db.mts';
import { server } from '../../../src/server.mjs';
import * as dbHelpers from '../../helpers/db.mjs';
import { userData } from '../../helpers/postData.mjs';

const baseUrl = '/v1/user';

beforeEach(dbHelpers.clearDb);

describe('POST', () => {
  describe('when provided the correct data', () => {
    it('returns status code 200', async () => {
      const response = await request(server).post(baseUrl).send(userData);
      expect(response.status).toStrictEqual(200);
    });

    it('returns a success message', async () => {
      const response = await request(server).post(baseUrl).send(userData);
      expect(response.body).toStrictEqual({
        status: 'success',
        message: 'User successfully created',
        data: {},
      });
    });

    it('creates a user on the database with the relevant details', async () => {
      await request(server).post(baseUrl).send(userData);

      const dbUser = await db.user.findUnique({
        where: {
          handle: userData.handle,
          displayName: userData.displayName,
        },
      });

      expect(dbUser).not.toBeNull();
      expect(dbUser?.handle).toStrictEqual(userData.handle);
      expect(dbUser?.displayName).toStrictEqual(userData.displayName);
    });

    it('does not store the password in plaintext', async () => {
      await request(server).post(baseUrl).send(userData);

      const dbUser = await db.user.findUnique({
        where: {
          handle: userData.handle,
          displayName: userData.displayName,
        },
      });

      expect(dbUser).not.toBeNull();
      expect(dbUser?.hash).not.toStrictEqual(userData.password);
    });
  });

  describe.each([
    {
      testType: 'no handle',
      badData: { handle: undefined },
      expectedBodyData: {
        errors: [],
        properties: {
          handle: {
            errors: ['Required field'],
          },
        },
      },
    },
    {
      testType: 'empty handle',
      badData: { handle: '' },
      expectedBodyData: {
        errors: [],
        properties: {
          handle: {
            errors: ['Should be between 1 and 50 characters long'],
          },
        },
      },
    },
    {
      testType: '51+ character handle',
      badData: {
        handle: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
      },
      expectedBodyData: {
        errors: [],
        properties: {
          handle: {
            errors: ['Should be between 1 and 50 characters long'],
          },
        },
      },
    },
    {
      testType: 'no displayName',
      badData: { displayName: undefined },
      expectedBodyData: {
        errors: [],
        properties: {
          displayName: {
            errors: ['Required field'],
          },
        },
      },
    },
    {
      testType: 'empty displayName',
      badData: { displayName: '' },
      expectedBodyData: {
        errors: [],
        properties: {
          displayName: {
            errors: ['Should be between 1 and 50 characters long'],
          },
        },
      },
    },
    {
      testType: '51+ character displayName',
      badData: {
        displayName: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
      },
      expectedBodyData: {
        errors: [],
        properties: {
          displayName: {
            errors: ['Should be between 1 and 50 characters long'],
          },
        },
      },
    },
    {
      testType: 'no password',
      badData: { password: undefined },
      expectedBodyData: {
        errors: [],
        properties: {
          password: {
            errors: ['Required field'],
          },
        },
      },
    },
    {
      testType: 'empty password',
      // So passwords match, include passwordConfirm.
      badData: { password: '', passwordConfirm: '' },
      expectedBodyData: {
        errors: [],
        properties: {
          password: {
            errors: [
              'Should be between 8 and 100 characters long',
              'Should use at least one uppercase character',
              'Should use at least one lowercase character',
              'Should use at least one number',
              'Should use at least one special character',
            ],
          },
        },
      },
    },
    {
      testType: '101+ character password',
      badData: {
        password:
          'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0@',
        passwordConfirm:
          'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0@',
      },
      expectedBodyData: {
        errors: [],
        properties: {
          password: {
            errors: ['Should be between 8 and 100 characters long'],
          },
        },
      },
    },
    {
      testType: 'no passwordConfirm',
      badData: {
        passwordConfirm: undefined,
      },
      expectedBodyData: {
        errors: [],
        properties: {
          passwordConfirm: {
            errors: ['Required field'],
          },
        },
      },
    },
    {
      testType: 'non-matching password and passwordConfirm',
      badData: {
        passwordConfirm: 'some other rubbish',
      },
      expectedBodyData: {
        errors: [],
        properties: {
          passwordConfirm: {
            errors: ['Passwords do not match'],
          },
        },
      },
    },
  ])('when provided: $testType', async ({ badData, expectedBodyData }) => {
    const response = await request(server)
      .post(baseUrl)
      .send({
        ...userData,
        ...badData,
      });

    it('returns status code 400', () => {
      expect(response.status).toStrictEqual(400);
    });

    it('returns appropriate errors', () => {
      expect(response.body).toStrictEqual({
        status: 'fail',
        data: expectedBodyData,
      });
    });
  });
});
