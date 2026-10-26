import { describe, expect, it } from 'vitest';
import { chains } from '../../src/auth.mjs';

const validPassword = '12345aA@';

describe('chains', () => {
  describe('login', () => {
    const goodInput = {
      handle: 'user_handle',
      password: validPassword,
    };

    describe('success', () => {
      it('returns a typed object with the expected fields and types', () => {
        // If something is wrong, zod will throw an error and the test will fail.
        const output = chains.login.parse(goodInput);
        expect(output).toStrictEqual(goodInput);
      });
    });

    describe('fail', () => {
      it.each([
        {
          testType: 'missing handle',
          badInput: { handle: undefined },
        },
        {
          testType: 'missing password',
          badInput: { password: undefined },
        },
      ])('returns an appropriate error when $testType', ({ badInput }) => {
        expect(() => chains.login.parse({ ...goodInput, ...badInput })).toThrow(
          'Required field',
        );
      });
    });
  });
});
