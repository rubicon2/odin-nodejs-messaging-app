import { beforeEach, describe, expect, it } from 'vitest';
import * as z from 'zod';
import { client as db } from '../../../src/db/client.mjs';
import { chains } from '../../../src/schemas/serverChat.mjs';
import * as dbHelpers from '../../helpers/db.mjs';
import { dbUserData } from '../../helpers/dbData.mjs';

beforeEach(dbHelpers.clearDb);

describe('chains', () => {
  describe('post', () => {
    it('is a function', () => {
      expect(typeof chains.post).toStrictEqual('function');
    });

    describe('returned chain', () => {
      it('given valid data, parses and returns it', async () => {
        const userToInvite = await db.user.create({
          data: {
            ...dbUserData,
            id: undefined,
            handle: 'other_person',
          },
        });

        const parsed = await chains.post().parseAsync({
          invitedUserIds: [userToInvite.id],
          title: 'My Amazing Chat',
        });

        expect(parsed).toStrictEqual({
          invitedUserIds: [userToInvite.id],
          title: 'My Amazing Chat',
        });
      });

      it('given a invitedUserIds array that contains invalid ids, returns appropriate errors for each', async () => {
        /**
         * Test shape of errors by using z.treeifyError, otherwise
         * it seems to be impossible to figure out the actual shape.
         */
        const result = await chains.post().safeParseAsync({
          invitedUserIds: ['invalid-id', 'another-invalid-id'],
          title: 'My Amazing Chat',
        });

        expect(result.success).toStrictEqual(false);
        // biome-ignore lint: If result.success is true, then result.error must exist.
        expect(z.treeifyError(result.error!)).toStrictEqual({
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
        });
      });
    });
  });
});
