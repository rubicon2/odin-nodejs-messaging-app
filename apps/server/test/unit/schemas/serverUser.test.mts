import { beforeEach, describe, expect, it } from 'vitest';
import { client as db } from '../../../src/db/client.mjs';
import { chains, refinements } from '../../../src/schemas/serverUser.mjs';
import * as dbHelpers from '../../helpers/db.mjs';
import { userData } from '../../helpers/postData.mts';

beforeEach(async () => {
  await dbHelpers.clearDb();
});

describe('refinements', () => {
  describe('isHandleAvailable', () => {
    it('is a function', () => {
      expect(typeof refinements.isHandleAvailable).toStrictEqual('function');
    });

    it('returns a refinement function', () => {
      // Not sure how to check it is a refinement and not just a function.
      expect(typeof refinements.isHandleAvailable()).toStrictEqual('function');
    });

    describe('returned refinement', () => {
      it('returns true if handle does not already exist on the database', async () => {
        const result = await refinements.isHandleAvailable()(userData);
        expect(result).toStrictEqual(true);
      });

      it('returns true if handle exists, but its associated id was in the ignoreIds array', async () => {
        const user = await db.user.create({
          data: {
            handle: userData.handle,
            displayName: 'whatever',
            hash: '12345',
          },
        });

        const result = await refinements.isHandleAvailable([user.id])(userData);
        expect(result).toStrictEqual(true);
      });

      it('returns false if handle already exists on the database and not in ignoreIds array', async () => {
        await db.user.create({
          data: {
            handle: userData.handle,
            displayName: 'whatever',
            hash: '12345',
          },
        });

        const result = await refinements.isHandleAvailable()(userData);
        expect(result).toStrictEqual(false);
      });
    });
  });
});

describe('chains', () => {
  describe('signup', () => {
    it('is a function', () => {
      expect(typeof chains.signup).toStrictEqual('function');
    });

    describe('returned chain', () => {
      it('returns parsed data if handle does not already exist on the database', async () => {
        const parsed = await chains.signup().parseAsync(userData);
        expect(parsed).toStrictEqual(userData);
      });

      it('returns error if handle already exists on the database', async () => {
        await db.user.create({
          data: {
            handle: userData.handle,
            displayName: 'whatever',
            hash: '12345',
          },
        });

        await expect(() =>
          chains.signup().parseAsync(userData),
        ).rejects.toThrow('That handle is already in use');
      });
    });
  });

  describe('updateAll', () => {
    it('is a function', () => {
      expect(typeof chains.updateAll).toStrictEqual('function');
    });

    describe('returned chain', () => {
      it('returns parsed data if handle does not already exist on the database', async () => {
        const parsed = await chains.updateAll().parseAsync(userData);
        expect(parsed).toStrictEqual(userData);
      });

      it('returns parsed data if handle exists, but its associated id was in the ignoreIds array', async () => {
        const user = await db.user.create({
          data: {
            handle: userData.handle,
            displayName: 'whatever',
            hash: '12345',
          },
        });

        const parsed = await chains.updateAll([user.id]).parseAsync(userData);
        expect(parsed).toStrictEqual(userData);
      });

      it('returns error if handle already exists on the database', async () => {
        await db.user.create({
          data: {
            handle: userData.handle,
            displayName: 'whatever',
            hash: '12345',
          },
        });

        await expect(() =>
          chains.updateAll().parseAsync(userData),
        ).rejects.toThrow('That handle is already in use');
      });
    });
  });

  describe('updatePartial', () => {
    it('is a function', () => {
      expect(typeof chains.updatePartial).toStrictEqual('function');
    });

    describe('returned chain', () => {
      it('returns parsed data if handle does not already exist on the database', async () => {
        const parsed = await chains.updatePartial().parseAsync(userData);
        expect(parsed).toStrictEqual(userData);
      });

      it('returns parsed data if handle exists, but its associated id was in the ignoreIds array', async () => {
        const user = await db.user.create({
          data: {
            handle: userData.handle,
            displayName: 'whatever',
            hash: '12345',
          },
        });

        const parsed = await chains
          .updatePartial([user.id])
          .parseAsync(userData);
        expect(parsed).toStrictEqual(userData);
      });

      it('returns error if handle already exists on the database', async () => {
        await db.user.create({
          data: {
            handle: userData.handle,
            displayName: 'whatever',
            hash: '12345',
          },
        });

        await expect(() =>
          chains.updatePartial().parseAsync(userData),
        ).rejects.toThrow('That handle is already in use');
      });
    });
  });
});
