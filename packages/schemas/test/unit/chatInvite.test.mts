import { describe, expect, it } from 'vitest';
import { chains, fields } from '../../src/chatInvite.mjs';

const chainValidationTestCaseData = {
  missingInvitedUserId: {
    testType: 'missing invitedUserId',
    badInput: { invitedUserId: undefined },
    expectedErrorMsg: 'Required field',
  },
};

describe('fields', () => {
  describe('invitedUserId', () => {
    describe('success', () => {
      it('returns a string', () => {
        const input = 'My Successful Input';
        expect(fields.invitedUserId.parse(input)).toStrictEqual(input);
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
          expect(() => fields.invitedUserId.parse(badInput)).toThrow(
            expectedMessage,
          );
        },
      );
    });
  });
});

describe('chains', () => {
  describe('post', () => {
    const goodInput = {
      invitedUserId: crypto.randomUUID(),
    };

    describe('success', () => {
      it('returns a typed object with the expected fields and types', () => {
        // If something is wrong, zod will throw an error and the test will fail.
        const output = chains.post.parse(goodInput);
        expect(output).toStrictEqual(goodInput);
      });
    });

    describe('fail', () => {
      it.each(Object.values(chainValidationTestCaseData))(
        'returns an appropriate error when $testType',
        ({ badInput, expectedErrorMsg }) => {
          expect(() =>
            chains.post.parse({ ...goodInput, ...badInput }),
          ).toThrow(expectedErrorMsg);
        },
      );
    });
  });
});
