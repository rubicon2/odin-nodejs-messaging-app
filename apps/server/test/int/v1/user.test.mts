import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../../src/db.mts';
import { server } from '../../../src/server.mjs';
import * as dbHelpers from '../../helpers/db.mjs';
import { dbUserData } from '../../helpers/dbData.mts';
import { userData } from '../../helpers/postData.mjs';

const baseUrl = '/v1/user';

interface TestCaseData {
  testType: string;
  badData: Record<string, unknown>;
  expectedBodyData: {
    errors: string[];
    properties: Record<string, { errors: string[] }>;
  };
  setupPostFn?: () => void;
}

const bodyTestCases: Record<string, TestCaseData> = {
  handleUndefined: {
    testType: 'no handle',
    badData: { ...userData, handle: undefined },
    expectedBodyData: {
      errors: [],
      properties: {
        handle: {
          errors: ['Required field'],
        },
      },
    },
  },
  handleTooShort: {
    testType: 'empty handle',
    badData: { ...userData, handle: '' },
    expectedBodyData: {
      errors: [],
      properties: {
        handle: {
          errors: ['Should be between 1 and 50 characters long'],
        },
      },
    },
  },
  handleTooLong: {
    testType: '51+ character handle',
    badData: {
      ...userData,
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
  handleTaken: {
    testType: 'handle already in use',
    setupPostFn: async () => {
      await db.user.create({
        data: dbUserData,
      });
    },
    badData: userData,
    expectedBodyData: {
      errors: [],
      properties: {
        handle: {
          errors: ['That handle is already in use'],
        },
      },
    },
  },
  displayNameUndefined: {
    testType: 'no displayName',
    badData: { ...userData, displayName: undefined },
    expectedBodyData: {
      errors: [],
      properties: {
        displayName: {
          errors: ['Required field'],
        },
      },
    },
  },
  displayNameTooShort: {
    testType: 'empty displayName',
    badData: { ...userData, displayName: '' },
    expectedBodyData: {
      errors: [],
      properties: {
        displayName: {
          errors: ['Should be between 1 and 50 characters long'],
        },
      },
    },
  },
  displayNameTooLong: {
    testType: '51+ character displayName',
    badData: {
      ...userData,
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
  passwordUndefined: {
    testType: 'no password',
    badData: { ...userData, password: undefined },
    expectedBodyData: {
      errors: [],
      properties: {
        password: {
          errors: ['Required field'],
        },
      },
    },
  },
  passwordTooShort: {
    testType: 'empty password',
    // So passwords match, include passwordConfirm.
    badData: { ...userData, password: 'aA@1', passwordConfirm: 'aA@1' },
    expectedBodyData: {
      errors: [],
      properties: {
        password: {
          errors: [
            'Should be between 8 and 100 characters long',
          ],
        },
      },
    },
  },
  passwordTooLong: {
    testType: '101+ character password',
    badData: {
      ...userData,
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
  passwordConfirmUndefined: {
    testType: 'no passwordConfirm',
    badData: { ...userData, passwordConfirm: undefined },
    expectedBodyData: {
      errors: [],
      properties: {
        passwordConfirm: {
          errors: ['Required field'],
        },
      },
    },
  },
  passwordAndPasswordConfirmNonMatching: {
    testType: 'non-matching password and passwordConfirm',
    badData: { ...userData, passwordConfirm: 'some other rubbish' },
    expectedBodyData: {
      errors: [],
      properties: {
        passwordConfirm: {
          errors: ['Passwords do not match'],
        },
      },
    },
  },
};

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

  describe.each(Object.values(bodyTestCases))(
    'when provided: $testType',
    ({ setupPostFn, badData, expectedBodyData }) => {
      it('returns status code 400', async () => {
        if (setupPostFn) {
          await setupPostFn();
        }
        const response = await request(server).post(baseUrl).send(badData);
        expect(response.status).toStrictEqual(400);
      });

      it('returns appropriate errors', async () => {
        if (setupPostFn) {
          await setupPostFn();
        }
        const response = await request(server).post(baseUrl).send(badData);

        expect(response.body).toStrictEqual({
          status: 'fail-validation',
          data: expectedBodyData,
        });
      });
    },
  );
});
