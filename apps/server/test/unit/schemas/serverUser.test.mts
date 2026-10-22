import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../../src/db.mjs';
import { chains, refinements } from '../../../src/schemas/serverUser.mjs';
import * as dbHelpers from '../../helpers/db.mjs';

beforeEach(async () => {
  await dbHelpers.clearDb();
});

const validData = {
  handle: 'some_handle',
  displayName: 'Ronald Donald',
  password: '12345678aA@',
  passwordConfirm: '12345678aA@',
};

describe('refinements', () => {
  describe('isHandleAvailable', () => {
    it('returns true if handle does not already exist on the database', async () => {
      const result = await refinements.isHandleAvailable(validData);
      expect(result).toStrictEqual(true);
    });

    it('returns false if handle already exists on the database', async () => {
      await db.user.create({
        data: {
          handle: validData.handle,
          displayName: 'whatever',
          hash: '12345',
        },
      });

      const result = await refinements.isHandleAvailable(validData);
      expect(result).toStrictEqual(false);
    });
  });
});

describe('chains', () => {
  describe.each([
    {
      name: 'signup',
      chain: chains.signup,
    },
    {
      name: 'updateAll',
      chain: chains.updateAll,
    },
    {
      name: 'updatePartial',
      chain: chains.updatePartial,
    },
  ])('$name', ({ chain }) => {
    it('returns parsed data if handle does not already exist on the database', async () => {
      const parsed = await chain.parseAsync(validData);
      expect(parsed).toStrictEqual(validData);
    });

    it('returns error if handle already exists on the database', async () => {
      await db.user.create({
        data: {
          handle: validData.handle,
          displayName: 'whatever',
          hash: '12345',
        },
      });

      await expect(() => chain.parseAsync(validData)).rejects.toThrow(
        'That handle is already in use',
      );
    });
  });
});
