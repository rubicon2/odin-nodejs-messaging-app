import { convertObjectDatesToStrings } from '@repo/all-dates-to-iso-strings';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { chatResourceArgs } from '../../../src/db/chatResource.mts';
import { client as db } from '../../../src/db/client.mjs';
import { server } from '../../../src/server.mjs';
import {
  createBearerHeader,
  createLoggedInUserAndGetBearerHeader,
} from '../../helpers/auth.mjs';
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
  createdByUserIdMissing: {
    testType: 'missing createdByUserId',
    badData: { createdByUserId: undefined },
    expectedBodyData: {
      errors: [],
      properties: {
        createdByUserId: {
          errors: ['Required field'],
        },
      },
    },
  },
  createdByUserIdInvalid: {
    testType: 'invalid createdByUserId',
    badData: { createdByUserId: 'invalid-id' },
    expectedBodyData: {
      errors: [],
      properties: {
        createdByUserId: {
          errors: ['User does not exist'],
        },
      },
    },
  },
  invitedUserIdsMissing: {
    testType: 'missing invitedUserIds array',
    badData: { invitedUserIds: undefined },
    expectedBodyData: {
      errors: [],
      properties: {
        invitedUserIds: {
          errors: [],
          items: [
            {
              // Since undefined gets coerced into [undefined], we end up with this error.
              errors: ['Required field'],
            },
          ],
        },
      },
    },
  },
  invitedUserIdsInvalid: {
    testType: 'invalid ids in invitedUserIds array',
    badData: { invitedUserIds: ['invalid-id', 'another-invalid-id'] },
    expectedBodyData: {
      errors: [],
      properties: {
        invitedUserIds: {
          errors: [],
          items: [
            {
              errors: ['User does not exist'],
            },
            {
              errors: ['User does not exist'],
            },
          ],
        },
      },
    },
  },
  titleMissing: {
    testType: 'missing title',
    badData: { title: undefined },
    expectedBodyData: {
      errors: [],
      properties: {
        title: {
          errors: ['Required field'],
        },
      },
    },
  },
  titleTooShort: {
    testType: 'empty title',
    badData: { title: '' },
    expectedBodyData: {
      errors: [],
      properties: {
        title: {
          errors: ['Should be between 1 and 50 characters long'],
        },
      },
    },
  },
  titleTooLong: {
    testType: '51+ character title',
    badData: { title: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXY' },
    expectedBodyData: {
      errors: [],
      properties: {
        title: {
          errors: ['Should be between 1 and 50 characters long'],
        },
      },
    },
  },
};

/**
 * Not /v1/user/:userId/chat because a user
 * could create a chat and then leave it.
 */
const baseUrl = '/v1/chat';

beforeEach(dbHelpers.clearDb);

describe(baseUrl, () => {
  describe('POST', () => {
    describe('given the correct data', () => {
      it('returns status code 200', async () => {
        const accessToken = await createLoggedInUserAndGetBearerHeader(
          dbData.dbUserData,
        );
        const userToInvite = await db.user.create({
          data: {
            ...dbData.dbUserData,
            id: '2',
            handle: 'other_user',
          },
        });

        const response = await request(server)
          .post(baseUrl)
          .set('Authorization', accessToken)
          .send({
            createdByUserId: dbData.dbUserData.id,
            invitedUserIds: [userToInvite.id],
            title: 'My Amazing Chat',
          });

        expect(response.status).toStrictEqual(200);
      });

      it('posts a new chat to the database and returns it', async () => {
        const userData = dbData.dbUserData;
        const accessToken =
          await createLoggedInUserAndGetBearerHeader(userData);
        const userToInvite = await db.user.create({
          data: {
            ...dbData.dbUserData,
            id: '2',
            handle: 'other_user',
          },
        });

        const response = await request(server)
          .post(baseUrl)
          .set('Authorization', accessToken)
          .send({
            createdByUserId: userData.id,
            invitedUserIds: [userToInvite.id],
            title: 'My Amazing Chat',
          });

        expect(response.body).toStrictEqual({
          status: 'success',
          message: 'Chat successfully created',
          data: {
            item: {
              createdById: userData.id,
              title: 'My Amazing Chat',
              id: expect.any(String),
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
              // Includes of foreign relations.
              createdBy: {
                displayName: userData.displayName,
                handle: userData.handle,
                id: userData.id,
              },
              participants: [
                {
                  displayName: userData.displayName,
                  handle: userData.handle,
                  id: userData.id,
                },
              ],
              invites: [
                {
                  chatId: expect.any(String),
                  createdAt: expect.any(String),
                  createdBy: {
                    displayName: userData.displayName,
                    handle: userData.handle,
                    id: userData.id,
                  },
                  createdById: userData.id,
                  id: expect.any(String),
                  invitee: {
                    displayName: userToInvite.displayName,
                    handle: userToInvite.handle,
                    id: userToInvite.id,
                  },
                  inviteeId: userToInvite.id,
                },
              ],
            },
          },
        });

        const dbChat = await db.chat.findUnique({
          where: {
            id: response.body.data.item.id,
          },
          include: {
            createdBy: {
              omit: {
                hash: true,
              },
            },
            participants: {
              omit: {
                hash: true,
              },
            },
            messages: {
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
        });

        expect(dbChat).toBeDefined();
      });
    });

    describe('given incorrect data', () => {
      it.each(Object.values(validationTestCaseData))(
        'when $testType, returns status code 400 and an error message',
        async ({ badData, expectedBodyData }) => {
          const accessToken = await createLoggedInUserAndGetBearerHeader(
            dbData.dbUserData,
          );

          // Need another user to invite.
          const invitee = await db.user.create({
            data: {
              handle: 'other_user',
              displayName: 'Some Other User',
              hash: '12345',
            },
          });

          const goodData = {
            createdByUserId: dbData.dbUserData.id,
            invitedUserIds: [invitee.id],
            title: 'My Chat Title',
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

  describe('PATCH', () => {
    it('given an invalid chatId param, returns status code 404 and a message', async () => {
      const bearerToken = await createLoggedInUserAndGetBearerHeader(
        dbData.dbUserData,
      );

      const response = await request(server)
        .patch(`${baseUrl}/invalid-id`)
        .set('Authorization', bearerToken);

      expect(response.statusCode).toStrictEqual(404);
      expect(response.body).toStrictEqual({
        status: 'fail',
        message: 'Not found',
      });
    });

    describe('given a valid chatId param', () => {
      describe('given the correct body data', () => {
        it('returns status code 200', async () => {
          const bearerToken = await createLoggedInUserAndGetBearerHeader(
            dbData.dbUserData,
          );

          // Create a chat to patch.
          const chat = await db.chat.create({
            data: {
              participants: {
                connect: [
                  {
                    id: dbData.dbUserData.id,
                  },
                ],
              },
            },
          });

          // On PATCH, all values are optional, so can leave the body empty.
          const response = await request(server)
            .patch(`${baseUrl}/${chat.id}`)
            .set('Authorization', bearerToken);

          expect(response.status).toStrictEqual(200);
        });

        it('returns a success message', async () => {
          const bearerToken = await createLoggedInUserAndGetBearerHeader(
            dbData.dbUserData,
          );

          // Create a chat to patch.
          const chat = await db.chat.create({
            data: {
              participants: {
                connect: [
                  {
                    id: dbData.dbUserData.id,
                  },
                ],
              },
            },
          });

          const response = await request(server)
            .patch(`${baseUrl}/${chat.id}`)
            .set('Authorization', bearerToken)
            .send();

          expect(response.body.message).toStrictEqual(
            'Chat successfully updated',
          );
        });

        it('returns the updated chat and updates the chat on the database', async () => {
          const userData = dbData.dbUserData;
          const bearerToken =
            await createLoggedInUserAndGetBearerHeader(userData);

          // Create a chat to patch.
          const chat = await db.chat.create({
            data: {
              title: 'My Original Chat Title',
              participants: {
                connect: [
                  {
                    id: userData.id,
                  },
                ],
              },
            },
          });

          const patchData = {
            title: 'My Updated Chat Title',
          };

          const response = await request(server)
            .patch(`${baseUrl}/${chat.id}`)
            .set('Authorization', bearerToken)
            .send(patchData);

          const responseChat = response.body.data.item;

          expect(responseChat).toBeDefined();
          expect(responseChat).toStrictEqual({
            id: expect.any(String),
            createdBy: null,
            createdById: null,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            title: patchData.title,
            invites: [],
            participants: [
              {
                displayName: userData.displayName,
                handle: userData.handle,
                id: userData.id,
              },
            ],
          });

          // Check it was updated on the database.
          const dbChat = await db.chat.findUnique({
            ...chatResourceArgs,
            where: {
              id: chat.id,
            },
          });

          expect(dbChat).toStrictEqual({
            ...responseChat,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
            title: patchData.title,
          });
        });
      });

      describe.each([
        validationTestCaseData.titleTooShort,
        validationTestCaseData.titleTooLong,
      ])(
        'when provided: $testType',
        ({ setupFn, badData, expectedBodyData }) => {
          it('returns status code 400', async () => {
            if (setupFn) {
              await setupFn();
            }

            const user = await db.user.create({
              data: dbData.dbUserData,
            });

            const chat = await db.chat.create({
              data: {
                title: 'My Chat Title',
                participants: {
                  connect: {
                    id: user.id,
                  },
                },
              },
            });

            const bearerToken = await createBearerHeader(dbData.dbUserData);

            const response = await request(server)
              .patch(`${baseUrl}/${chat.id}`)
              .set('Authorization', bearerToken)
              .send(badData);

            expect(response.status).toStrictEqual(400);
          });

          it('returns appropriate errors', async () => {
            if (setupFn) {
              await setupFn();
            }

            const user = await db.user.create({
              data: dbData.dbUserData,
            });

            const chat = await db.chat.create({
              data: {
                title: 'My Chat Title',
                participants: {
                  connect: {
                    id: user.id,
                  },
                },
              },
            });

            const bearerToken = await createBearerHeader(dbData.dbUserData);

            const response = await request(server)
              .patch(`${baseUrl}/${chat.id}`)
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
    it('given an invalid chatId param, returns status code 404 and a message', async () => {
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

    describe('given a valid chatId param', () => {
      it('returns the deleted chat and deletes the chat from the database', async () => {
        const bearerToken = await createLoggedInUserAndGetBearerHeader(
          dbData.dbUserData,
        );

        // Create a chat to delete.
        const chat = await db.chat.create({
          ...chatResourceArgs,
          data: {
            title: 'My Chat Title',
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

        expect(response.statusCode).toStrictEqual(200);
        expect(response.body).toStrictEqual({
          status: 'success',
          message: 'Chat successfully deleted',
          data: {
            item: convertObjectDatesToStrings(chat),
          },
        });

        // Check it is gone from the database.
        const deletedChat = await db.chat.findUnique({
          where: {
            id: chat.id,
          },
        });

        expect(deletedChat).toBeNull();
      });
    });
  });
});
