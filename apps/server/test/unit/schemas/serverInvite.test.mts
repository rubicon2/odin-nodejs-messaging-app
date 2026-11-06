import { beforeEach, describe, expect, it } from 'vitest';
import * as z from 'zod';
import { client as db } from '../../../src/db/client.mjs';
import { chains, fields } from '../../../src/schemas/serverInvite.mjs';
import * as dbHelpers from '../../helpers/db.mjs';
import { dbUserData } from '../../helpers/dbData.mjs';

beforeEach(dbHelpers.clearDb);

describe('fields', () => {
  describe('serverUser', () => {
    it('given a valid user id, returns it', async () => {
      const user = await db.user.create({
        data: dbUserData,
      });

      const parseResult = await fields.serverUser.parseAsync(user.id);
      expect(parseResult).toStrictEqual(user.id);
    });

    it('given an invalid user id, throws an error', async () => {
      await expect(() =>
        fields.serverUser.parseAsync('invalid-id'),
      ).rejects.toThrow('User does not exist');
    });
  });
});

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
            // So a legit id is created.
            id: undefined,
            handle: 'other_person',
          },
        });

        const parsed = await chains.post().parseAsync({
          invitedUserId: userToInvite.id,
        });

        expect(parsed).toStrictEqual({
          invitedUserId: userToInvite.id,
        });
      });

      it('given an invalid invitedUserId, returns an appropriate error', async () => {
        /**
         * Test shape of errors by using z.treeifyError, otherwise
         * it seems to be impossible to figure out the actual shape.
         */
        const result = await chains.post().safeParseAsync({
          invitedUserId: 'invalid-id',
        });

        expect(result.success).toStrictEqual(false);
        // biome-ignore lint: If result.success is true, then result.error must exist.
        expect(z.treeifyError(result.error!)).toStrictEqual({
          errors: [],
          properties: {
            invitedUserId: {
              errors: ['User does not exist'],
            },
          },
        });
      });
    });
  });
});
