import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { client as db } from '../../../src/db/client.mjs';
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
  setupPostFn?: () => void;
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
});
