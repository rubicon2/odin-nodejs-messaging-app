import { beforeEach, describe, expect, it } from 'vitest';
import { client as db } from '../../../src/db/client.mjs';
import * as password from '../../../src/ext/password.mjs';
import { chains, refinements } from '../../../src/schemas/serverAuth.mjs';
import * as dbHelpers from '../../helpers/db.mjs';
import { userData } from '../../helpers/postData.mts';

const loginData = {
  handle: userData.handle,
  password: userData.password,
};

beforeEach(async () => {
  await dbHelpers.clearDb();
});

describe('refinements', () => {
  describe('doHandleAndPasswordMatch', () => {
    it('is a function', () => {
      expect(typeof refinements.doHandleAndPasswordMatch).toStrictEqual(
        'function',
      );
    });

    it('returns a refinement function', () => {
      // Not sure how to check it is a refinement and not just a function.
      expect(typeof refinements.doHandleAndPasswordMatch()).toStrictEqual(
        'function',
      );
    });

    describe('returned refinement', () => {
      it('returns true if handle and hash of password match those on database', async () => {
        await db.user.create({
          data: {
            handle: userData.handle,
            displayName: userData.displayName,
            hash: password.hash(userData.password),
          },
        });

        const result = await refinements.doHandleAndPasswordMatch()(loginData);
        expect(result).toStrictEqual(true);
      });

      it('returns false if handle exists, but hash of password does not match', async () => {
        await db.user.create({
          data: {
            handle: userData.handle,
            displayName: userData.displayName,
            hash: password.hash('correct password'),
          },
        });

        const result = await refinements.doHandleAndPasswordMatch()({
          handle: userData.handle,
          password: 'incorrect password',
        });
        expect(result).toStrictEqual(false);
      });

      it('returns false if handle does not exist', async () => {
        const result = await refinements.doHandleAndPasswordMatch()(userData);
        expect(result).toStrictEqual(false);
      });
    });
  });
});

describe('chains', () => {
  describe('login', () => {
    it('is a function', () => {
      expect(typeof chains.login).toStrictEqual('function');
    });

    describe('returned chain', () => {
      it('returns parsed data if handle and password match', async () => {
        await db.user.create({
          data: {
            handle: userData.handle,
            displayName: userData.displayName,
            hash: password.hash(userData.password),
          },
        });

        const parsed = await chains.login().parseAsync(loginData);
        expect(parsed).toStrictEqual(loginData);
      });

      it('returns error if handle and password do not match', async () => {
        await db.user.create({
          data: {
            handle: userData.handle,
            displayName: 'whatever',
            hash: password.hash('correct password'),
          },
        });

        await expect(() =>
          chains.login().parseAsync({
            handle: userData.handle,
            password: 'incorrect password',
          }),
        ).rejects.toThrow('Handle and password do not match');
      });

      it('returns error if handle does not exist', async () => {
        await expect(() =>
          chains.login().parseAsync(loginData),
        ).rejects.toThrow('Handle and password do not match');
      });
    });
  });
});
