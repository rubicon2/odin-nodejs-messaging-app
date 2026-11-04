import { describe, expect, it } from 'vitest';
import { chains, fields } from '../../src/chat.mjs';

const overlongTitle = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

const chainValidationTestCaseData = {
  missingTitle: {
    testType: 'missing title',
    badInput: { title: undefined },
    expectedErrorMsg: 'Required field',
  },
  shortTitle: {
    testType: 'empty title',
    badInput: { title: '' },
    expectedErrorMsg: 'Should be between 1 and 50 characters long',
  },
  longTitle: {
    testType: 'overlong title',
    badInput: { title: overlongTitle },
    expectedErrorMsg: 'Should be between 1 and 50 characters long',
  },
  missingCreatedByUserId: {
    testType: 'missing createdByUserId',
    badInput: { createdByUserId: undefined },
    expectedErrorMsg: 'Required field',
  },
  missingInvitedUserIds: {
    testType: 'missing invitedUserIds array',
    badInput: { invitedUserIds: undefined },
    // Because undefined gets coerced into [undefined], we
    // get this error instead of e.g. "should be an array".
    expectedErrorMsg: 'Required field',
  },
  emptyInvitedUserIds: {
    testType: 'empty invitedUserIds array',
    badInput: { invitedUserIds: [] },
    expectedErrorMsg: 'Requires at least one user',
  },
};

describe('fields', () => {
  describe('title', () => {
    describe('success', () => {
      it('returns a string', () => {
        const input = 'My Successful Input';
        expect(fields.title.parse(input)).toStrictEqual(input);
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
          badInput: overlongTitle,
          expectedMessage: 'Should be between 1 and 50 characters long',
        },
      ])(
        `returns an appropriate error when $testType`,
        ({ badInput, expectedMessage }) => {
          expect(() => fields.title.parse(badInput)).toThrow(expectedMessage);
        },
      );
    });
  });

  describe('createdByUserId', () => {
    describe('success', () => {
      it('returns the parsed user id', () => {
        const input = crypto.randomUUID();
        expect(fields.createdByUserId.parse(input)).toStrictEqual(input);
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
          expect(() => fields.createdByUserId.parse(badInput)).toThrow(
            expectedMessage,
          );
        },
      );
    });
  });

  describe('invitedUserIds', () => {
    describe('success', () => {
      it('returns the array of user ids', () => {
        const input = [crypto.randomUUID(), crypto.randomUUID()];
        expect(fields.invitedUserIds.parse(input)).toStrictEqual(input);
      });

      it('coerces a single createdByUserIds parameter into an array', () => {
        const input = crypto.randomUUID();
        expect(fields.invitedUserIds.parse(input)).toStrictEqual([input]);
      });
    });

    describe('fail', () => {
      it.each([
        {
          testType: 'array element is undefined',
          badInput: [undefined],
          expectedMessage: 'Required field',
        },
      ])(
        `returns an appropriate error when $testType`,
        ({ badInput, expectedMessage }) => {
          expect(() => fields.invitedUserIds.parse(badInput)).toThrow(
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
      title: 'My New Chat',
      createdByUserId: crypto.randomUUID(),
      invitedUserIds: [crypto.randomUUID(), crypto.randomUUID()],
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

  describe('updateAll', () => {
    const goodInput = {
      // Can't update createdByUserId or invites after initial POST.
      title: 'My New Chat',
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
        // Can only update title after POST, so only test those inputs.
        chainValidationTestCaseData.missingTitle,
        chainValidationTestCaseData.shortTitle,
        chainValidationTestCaseData.longTitle,
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
    const goodInput = {
      // Can't update createdByUserId or invites after initial POST.
      title: 'My New Chat',
    };

    describe('success', () => {
      it('given undefined input, defaults to an empty object', () => {
        const output = chains.updatePartial.parse(undefined);
        expect(output).toStrictEqual({});
      });

      it.each([
        {
          testType: 'only a title',
          input: {
            title: 'Some Updated Title',
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
        chainValidationTestCaseData.shortTitle,
        chainValidationTestCaseData.longTitle,
      ])(
        'returns an appropriate error when $testType',
        ({ badInput, expectedErrorMsg }) => {
          expect(() =>
            chains.updatePartial.parse({ ...goodInput, ...badInput }),
          ).toThrow(expectedErrorMsg);
        },
      );
    });
  });
});
