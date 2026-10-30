import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { client as db } from '../../../src/db/client.mts';
import { server } from '../../../src/server.mjs';
import { createLoggedInUserAndGetBearerHeader } from '../../helpers/auth.mts';
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
          errors: ['Should be between 8 and 100 characters long'],
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

const patchTestCases: Record<string, TestCaseData> = {
  // We want to omit all "undefined" test cases, since everything is optional on PATCH.
  displayNameTooShort: bodyTestCases.displayNameTooShort,
  displayNameTooLong: bodyTestCases.displayNameTooLong,
  handleTooShort: bodyTestCases.handleTooShort,
  handleTooLong: bodyTestCases.handleTooLong,
  passwordTooShort: bodyTestCases.passwordTooShort,
  passwordTooLong: bodyTestCases.passwordTooLong,
  passwordAndPasswordConfirmNonMatching:
    bodyTestCases.passwordAndPasswordConfirmNonMatching,
  // Custom test cases for patch tests, where setup needs to be different, etc.
  handleTaken: {
    testType: 'handle already in use',
    setupPostFn: async () => {
      /**
       * Since user has to log in to update with patch, dbUserData is used for that.
       * So create a different user with a new handle that the logged in user can
       * conflict with when they try to update their handle.
       */
      await db.user.create({
        data: {
          ...dbUserData,
          id: 'other-user',
          handle: 'other_handle',
        },
      });
    },
    badData: {
      handle: 'other_handle',
    },
    expectedBodyData: {
      errors: [],
      properties: {
        handle: {
          errors: ['That handle is already in use'],
        },
      },
    },
  },
};

beforeEach(dbHelpers.clearDb);

describe(baseUrl, () => {
  describe('POST', () => {
    describe('when provided the correct data', () => {
      it('returns status code 200', async () => {
        const response = await request(server).post(baseUrl).send(userData);
        expect(response.status).toStrictEqual(200);
      });

      it('returns a success message and the created user, sans hash', async () => {
        const response = await request(server).post(baseUrl).send(userData);
        expect(response.body).toStrictEqual({
          status: 'success',
          message: 'User successfully created',
          data: {
            item: {
              handle: userData.handle,
              displayName: userData.displayName,
              id: expect.any(String),
              /**
               * Dates are returned in response, but in string format.
               * This means the resource types in /src/db are wrong
               * for the client. The data will leave the server
               * as a Date, but reach the client as a string.
               */
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
            },
          },
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
});

describe(`${baseUrl}/:userId`, () => {
  describe('PATCH', () => {
    const loggedInUserData = dbUserData;
    const url = `${baseUrl}/${loggedInUserData.id}`;

    it('given an invalid userId param, returns status code 404 and a message', async () => {
      const bearerToken =
        await createLoggedInUserAndGetBearerHeader(loggedInUserData);

      const response = await request(server)
        .patch(`${baseUrl}/invalid-id`)
        .set('Authorization', bearerToken);

      expect(response.statusCode).toStrictEqual(404);
      expect(response.body).toStrictEqual({
        status: 'fail',
        message: 'Not found',
      });
    });

    describe('given a valid userId param', () => {
      describe('given the correct body data', () => {
        it('returns status code 200', async () => {
          const bearerToken =
            await createLoggedInUserAndGetBearerHeader(loggedInUserData);

          // On PATCH, all values are optional, so can leave the body empty.
          const response = await request(server)
            .patch(url)
            .set('Authorization', bearerToken);

          expect(response.status).toStrictEqual(200);
        });

        it('returns a success message', async () => {
          const bearerToken =
            await createLoggedInUserAndGetBearerHeader(loggedInUserData);

          const response = await request(server)
            .patch(url)
            .set('Authorization', bearerToken)
            .send();

          expect(response.body.message).toStrictEqual(
            'User successfully updated',
          );
        });

        it('returns the updated user (sans hash) and updates the user on the database', async () => {
          const bearerToken =
            await createLoggedInUserAndGetBearerHeader(loggedInUserData);

          const patchData = {
            handle: 'donald_ronald',
            displayName: 'Donron',
          };

          const response = await request(server)
            .patch(url)
            .set('Authorization', bearerToken)
            .send(patchData);

          const responseUser = response.body.data.item;

          expect(responseUser).toBeDefined();
          expect(response.body.data.item).toStrictEqual({
            id: loggedInUserData.id,
            createdAt: loggedInUserData.createdAt.toISOString(),
            updatedAt: expect.any(String),
            handle: patchData.handle,
            displayName: patchData.displayName,
          });

          const dbUser = await db.user.findUnique({
            where: {
              id: loggedInUserData.id,
            },
          });

          expect(dbUser).toStrictEqual({
            ...responseUser,
            createdAt: loggedInUserData.createdAt,
            updatedAt: expect.any(Date),
            hash: expect.any(String),
          });
        });
      });

      describe.each(Object.values(patchTestCases))(
        'when provided: $testType',
        ({ setupPostFn, badData, expectedBodyData }) => {
          it('returns status code 400', async () => {
            if (setupPostFn) {
              await setupPostFn();
            }

            const bearerToken =
              await createLoggedInUserAndGetBearerHeader(loggedInUserData);

            const response = await request(server)
              .patch(url)
              .set('Authorization', bearerToken)
              .send(badData);

            expect(response.status).toStrictEqual(400);
          });

          it('returns appropriate errors', async () => {
            if (setupPostFn) {
              await setupPostFn();
            }

            const bearerToken =
              await createLoggedInUserAndGetBearerHeader(loggedInUserData);

            const response = await request(server)
              .patch(url)
              .set('Authorization', bearerToken)
              .send(badData);

            expect(response.body).toStrictEqual({
              status: 'fail-validation',
              data: expectedBodyData,
            });
          });
        },
      );
    });
  });

  describe('DELETE', () => {
    const loggedInUserData = dbUserData;
    const url = `${baseUrl}/${loggedInUserData.id}`;

    it('given an invalid userId param, returns status code 404 and a message', async () => {
      const bearerToken =
        await createLoggedInUserAndGetBearerHeader(loggedInUserData);

      const response = await request(server)
        .delete(`${baseUrl}/invalid-id`)
        .set('Authorization', bearerToken);

      expect(response.statusCode).toStrictEqual(404);
      expect(response.body).toStrictEqual({
        status: 'fail',
        message: 'Not found',
      });
    });

    describe('given a valid userId param', () => {
      it('returns status code 200', async () => {
        const bearerToken =
          await createLoggedInUserAndGetBearerHeader(loggedInUserData);

        const response = await request(server)
          .delete(url)
          .set('Authorization', bearerToken);

        expect(response.status).toStrictEqual(200);
      });

      it('returns a success message', async () => {
        const bearerToken =
          await createLoggedInUserAndGetBearerHeader(loggedInUserData);

        const response = await request(server)
          .delete(url)
          .set('Authorization', bearerToken);

        expect(response.body.message).toStrictEqual(
          'User successfully deleted',
        );
      });

      it('returns the deleted user (sans hash) and deletes the user from the database', async () => {
        const bearerToken =
          await createLoggedInUserAndGetBearerHeader(loggedInUserData);

        const response = await request(server)
          .delete(url)
          .set('Authorization', bearerToken);

        const responseUser = response.body.data.item;

        expect(responseUser).toBeDefined();
        expect(response.body.data.item).toStrictEqual({
          id: loggedInUserData.id,
          handle: loggedInUserData.handle,
          displayName: loggedInUserData.displayName,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        });

        const dbUser = await db.user.findUnique({
          where: {
            id: loggedInUserData.id,
          },
        });

        expect(dbUser).toBeNull();
      });
    });
  });

  describe('GET', () => {
    it('given a valid userId param, returns status code 200 and the user', async () => {
      const user = await db.user.create({
        data: dbUserData,
      });

      const response = await request(server).get(`${baseUrl}/${user.id}`);

      expect(response.status).toStrictEqual(200);
      expect(response.body).toStrictEqual({
        status: 'success',
        data: {
          item: {
            id: user.id,
            handle: user.handle,
            displayName: user.displayName,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
          },
        },
      });
    });

    it('given an invalid userId param, returns status code 404 and a message', async () => {
      const response = await request(server).get(`${baseUrl}/invalid-id`);

      expect(response.status).toStrictEqual(404);
      expect(response.body).toStrictEqual({
        status: 'fail',
        message: 'Not found',
      });
    });
  });
});
