import { describe, expect, it } from 'vitest';
import { chains, fields } from '../../src/user.mjs';

const validPassword = '12345aA@';

describe('fields', () => {
  describe('handle', () => {
    describe('success', () => {
      it('returns a string', () => {
        const input = 'my_successful_input';
        expect(fields.handle.parse(input)).toStrictEqual(input);
      });
    });

    describe('fail', () => {
      it.each([
        {
          testType: 'input is undefined',
          badInput: undefined,
          expectedMessage: 'Required field',
        },
        {
          testType: 'input is zero characters',
          badInput: '',
          expectedMessage: 'Should be between 1 and 50 characters long',
        },
        {
          testType: 'input is over 50 characters',
          badInput: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
          expectedMessage: 'Should be between 1 and 50 characters long',
        },
        {
          testType: 'input contains a space',
          badInput: 'spaced out',
          expectedMessage:
            'Should only contain alphanumeric characters and underscores',
        },
        {
          testType: 'input contains a tab',
          badInput: 'spaced out',
          expectedMessage:
            'Should only contain alphanumeric characters and underscores',
        },
        {
          testType: 'input contains special characters',
          badInput: '&',
          expectedMessage:
            'Should only contain alphanumeric characters and underscores',
        },
      ])(
        `returns an appropriate error when $testType`,
        ({ badInput, expectedMessage }) => {
          expect(() => fields.handle.parse(badInput)).toThrow(expectedMessage);
        },
      );
    });
  });

  describe('displayName', () => {
    describe('success', () => {
      it('returns a string', () => {
        const input = 'my_successful_input';
        expect(fields.displayName.parse(input)).toStrictEqual(input);
      });
    });

    describe('fail', () => {
      it.each([
        {
          testType: 'input is undefined',
          badInput: undefined,
          expectedMessage: 'Required field',
        },
        {
          testType: 'input is zero characters',
          badInput: '',
          expectedMessage: 'Should be between 1 and 50 characters long',
        },
        {
          testType: 'input is over 50 characters',
          badInput: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
          expectedMessage: 'Should be between 1 and 50 characters long',
        },
      ])(
        `returns an appropriate error when $testType`,
        ({ badInput, expectedMessage }) => {
          expect(() => fields.displayName.parse(badInput)).toThrow(
            expectedMessage,
          );
        },
      );
    });
  });

  describe('password', () => {
    describe('success', () => {
      it('returns a string', () => {
        expect(fields.password.parse(validPassword)).toStrictEqual(
          validPassword,
        );
      });
    });

    describe('fail', () => {
      it.each([
        {
          testType: 'input is undefined',
          badInput: undefined,
          expectedMessage: 'Required field',
        },
        {
          testType: 'input is zero characters',
          badInput: '',
          expectedMessage: 'Should be between 8 and 100 characters long',
        },
        {
          testType: 'input is over 100 characters',
          badInput:
            'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
          expectedMessage: 'Should be between 8 and 100 characters long',
        },
        {
          testType: 'input does not include a lowercase letter',
          badInput: 'ABCDEFGHIJK1@',
          expectedMessage: 'Should use at least one lowercase character',
        },
        {
          testType: 'input does not include an uppercase letter',
          badInput: 'abcdefhijk1@',
          expectedMessage: 'Should use at least one uppercase character',
        },
        {
          testType: 'input does not include a number',
          badInput: 'abdABCD@',
          expectedMessage: 'Should use at least one number',
        },
        {
          testType: 'input does not include a special character',
          badInput: 'abdABCD@',
          expectedMessage: 'Should use at least one number',
        },
      ])(
        `returns an appropriate error when $testType`,
        ({ badInput, expectedMessage }) => {
          expect(() => fields.password.parse(badInput)).toThrow(
            expectedMessage,
          );
        },
      );
    });
  });

  describe('passwordConfirm', () => {
    describe('success', () => {
      it('returns a string', () => {
        expect(fields.passwordConfirm.parse(validPassword)).toStrictEqual(
          validPassword,
        );
      });
    });

    describe('fail', () => {
      it.each([
        {
          testType: 'input is undefined',
          badInput: undefined,
          expectedMessage: 'Required field',
        },
      ])(
        `returns an appropriate error when $testType`,
        ({ badInput, expectedMessage }) => {
          expect(() => fields.passwordConfirm.parse(badInput)).toThrow(
            expectedMessage,
          );
        },
      );
    });
  });
});

describe('chains', () => {
  describe('signup', () => {
    const goodInput = {
      handle: 'user_handle',
      displayName: 'user_display_name',
      password: validPassword,
      passwordConfirm: validPassword,
    };

    describe('success', () => {
      it('returns a typed object with the expected fields and types', () => {
        // If something is wrong, zod will throw an error and the test will fail.
        const output = chains.signup.parse(goodInput);
        expect(output).toStrictEqual(goodInput);
      });
    });

    describe('fail', () => {
      it.each([
        {
          testType: 'missing handle',
          badInput: { handle: undefined },
          expectedErrorMsg: 'Required field',
        },
        {
          testType: 'missing displayName',
          badInput: { displayName: undefined },
          expectedErrorMsg: 'Required field',
        },
        {
          testType: 'missing password',
          badInput: { password: undefined },
          expectedErrorMsg: 'Required field',
        },
        {
          testType: 'missing passwordConfirm',
          badInput: { passwordConfirm: undefined },
          expectedErrorMsg: 'Required field',
        },
        {
          testType: 'non-matching password and passwordConfirm',
          badInput: { passwordConfirm: 'some other stuff' },
          expectedErrorMsg: 'Passwords do not match',
        },
      ])(
        'returns an appropriate error when $testType',
        ({ badInput, expectedErrorMsg }) => {
          expect(() =>
            chains.signup.parse({ ...goodInput, ...badInput }),
          ).toThrow(expectedErrorMsg);
        },
      );
    });
  });

  describe('updateAll', () => {
    const goodInput = {
      handle: 'user_handle',
      displayName: 'user_display_name',
      password: validPassword,
      passwordConfirm: validPassword,
    };

    describe('success', () => {
      it('returns a typed object with the expected fields and types', () => {
        // If something is wrong, zod will throw an error and the test will fail.
        const output = chains.updateAll.parse(goodInput);
        expect(output).toStrictEqual(goodInput);
      });
    });

    describe('fail', () => {
      it.each([
        {
          testType: 'missing handle',
          badInput: { handle: undefined },
          expectedErrorMsg: 'Required field',
        },
        {
          testType: 'missing displayName',
          badInput: { displayName: undefined },
          expectedErrorMsg: 'Required field',
        },
        {
          testType: 'missing password',
          badInput: { password: undefined },
          expectedErrorMsg: 'Required field',
        },
        {
          testType: 'missing passwordConfirm',
          badInput: { passwordConfirm: undefined },
          expectedErrorMsg: 'Required field',
        },
        {
          testType: 'password and passwordConfirm do not match',
          badInput: { passwordConfirm: 'some other stuff' },
          expectedErrorMsg: 'Passwords do not match',
        },
      ])(
        'returns an appropriate error when $testType',
        ({ badInput, expectedErrorMsg }) => {
          expect(() =>
            chains.updateAll.parse({ ...goodInput, ...badInput }),
          ).toThrow(expectedErrorMsg);
        },
      );
    });
  });

  describe('updatePartial', () => {
    describe('success', () => {
      it.each([
        {
          testType: 'only a handle',
          input: {
            handle: 'some_valid_handle',
          },
        },
        {
          testType: 'only a displayName',
          input: {
            displayName: 'Adam Smith',
          },
        },
        {
          testType: 'only a valid password and passwordConfirm',
          input: {
            password: validPassword,
            passwordConfirm: validPassword,
          },
        },
      ])(
        'returns a typed object with the expected fields and types when given $testType',
        ({ input }) => {
          // If something is wrong, zod will throw an error and the test will fail.
          const output = chains.updatePartial.parse(input);
          expect(output).toStrictEqual(input);
        },
      );
    });

    describe('fail', () => {
      it.each([
        {
          testType: 'password is present but confirmPassword is missing',
          input: { password: validPassword, passwordConfirm: undefined },
          expectedErrorMsg: 'Passwords do not match',
        },
        {
          testType: 'confirmPassword is present but password is missing',
          input: { password: undefined, passwordConfirm: validPassword },
          expectedErrorMsg: 'Passwords do not match',
        },
        {
          testType: 'password and passwordConfirm do not match',
          input: {
            password: validPassword,
            passwordConfirm: 'some other stuff',
          },
          expectedErrorMsg: 'Passwords do not match',
        },
      ])(
        'returns an appropriate error when $testType',
        ({ input, expectedErrorMsg }) => {
          expect(() => chains.updatePartial.parse(input)).toThrow(
            expectedErrorMsg,
          );
        },
      );
    });
  });
});
