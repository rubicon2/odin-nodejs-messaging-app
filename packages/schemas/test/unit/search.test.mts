import { describe, expect, it } from 'vitest';
import { chains, fields } from '../../src/search.mjs';

describe('fields', () => {
  describe('sortOrder', () => {
    describe('success', () => {
      it('accepts "asc"', () => {
        expect(fields.sortOrder.parse('asc')).toStrictEqual('asc');
      });

      it('accepts "desc"', () => {
        expect(fields.sortOrder.parse('desc')).toStrictEqual('desc');
      });
    });

    describe('fail', () => {
      it('rejects all other text', () => {
        expect(() => fields.sortOrder.parse('whatever')).toThrow(
          'Should be asc or desc',
        );
      });
    });
  });

  describe('searchUserSortColumn', () => {
    describe('success', () => {
      it.each(['id', 'handle', 'displayName', 'createdAt', 'updatedAt'])(
        'accepts $0',
        (columnName) => {
          expect(fields.searchUserSortColumn.parse(columnName)).toStrictEqual(
            columnName,
          );
        },
      );
    });

    describe('fail', () => {
      it('rejects all other text', () => {
        expect(() => fields.searchUserSortColumn.parse('whatever')).toThrow(
          'Can only order by: id, handle, displayName, createdAt, updatedAt',
        );
      });
    });
  });
});

describe('chains', () => {
  describe('searchParams', () => {
    // So the defaults don't have to be typed manually over and over.
    const defaultOutput = {
      take: 10,
      skip: 0,
      orderBy: ['id'],
      sortOrder: ['asc'],
    };

    const goodInput = {
      take: '10',
      skip: '50',
      orderBy: ['name', 'createdAt'],
      sortOrder: ['asc', 'desc'],
      q: 'my query text',
    };

    describe('success', () => {
      it('returns a typed object with the expected fields and types', () => {
        // If something is wrong, zod will throw an error and the test will fail.
        const output = chains.searchParams.parse(goodInput);
        expect(output).toStrictEqual({
          ...goodInput,
          // These get coerced into numbers.
          take: parseInt(goodInput.take, 10),
          skip: parseInt(goodInput.skip, 10),
        });
      });

      describe('default values', () => {
        const output = chains.searchParams.parse({});

        it('has a take of 10', () => {
          expect(output.take).toStrictEqual(10);
        });

        it('has a skip of 0', () => {
          expect(output.skip).toStrictEqual(0);
        });

        it('orders by ascending id', () => {
          expect(output.orderBy).toStrictEqual(['id']);
          expect(output.sortOrder).toStrictEqual(['asc']);
        });
      });

      it('coerces a non-string q parameter into a string', () => {
        const output = chains.searchParams.parse({ q: 97 });
        expect(output).toStrictEqual({
          ...defaultOutput,
          q: '97',
        });
      });

      it('coerces a non-string cursor parameter into a string', () => {
        const output = chains.searchParams.parse({ cursor: 97 });
        expect(output).toStrictEqual({
          ...defaultOutput,
          cursor: '97',
        });
      });

      it('coerces a single orderBy parameter into an array', () => {
        const output = chains.searchParams.parse({ orderBy: 'id' });
        expect(output).toStrictEqual({
          ...defaultOutput,
          orderBy: ['id'],
        });
      });

      it('coerces a single sortOrder parameter into an array', () => {
        const output = chains.searchParams.parse({ sortOrder: 'desc' });
        expect(output).toStrictEqual({
          ...defaultOutput,
          sortOrder: ['desc'],
        });
      });

      it('coerces a non-string orderBy parameter into a string', () => {
        const output = chains.searchParams.parse({ orderBy: 97 });
        expect(output).toStrictEqual({
          ...defaultOutput,
          orderBy: ['97'],
        });
      });
    });

    describe('fail', () => {
      it.each([
        {
          testType: 'non-number take',
          badInput: { take: 'a string' },
          expectedErrorMsg: 'Should be a number',
        },
        {
          testType: 'non-integer take',
          badInput: { take: '3.14' },
          expectedErrorMsg: 'Should be a whole number',
        },
        {
          testType: 'non-number skip',
          badInput: { skip: 'a string' },
          expectedErrorMsg: 'Should be a number',
        },
        {
          testType: 'non-integer skip',
          badInput: { skip: '3.14' },
          expectedErrorMsg: 'Should be a whole number',
        },
        {
          testType: 'sortOrder that is not "asc" or "desc"',
          badInput: { sortOrder: '3.14' },
          expectedErrorMsg: 'Should be asc or desc',
        },
      ])(
        'returns an appropriate error when $testType',
        ({ badInput, expectedErrorMsg }) => {
          expect(() =>
            chains.searchParams.parse({ ...goodInput, ...badInput }),
          ).toThrow(expectedErrorMsg);
        },
      );
    });
  });

  describe('searchUserParams', () => {
    // So the defaults don't have to be typed manually over and over.
    const defaultOutput = {
      take: 10,
      skip: 0,
      orderBy: ['handle'],
      sortOrder: ['asc'],
    };

    const goodInput = {
      take: '10',
      skip: '50',
      cursor: 'some-id-cursor',
      orderBy: ['id', 'handle', 'displayName', 'createdAt', 'updatedAt'],
      sortOrder: ['asc'],
    };

    describe('success', () => {
      it('returns a typed object with the expected fields and types', () => {
        // If something is wrong, zod will throw an error and the test will fail.
        const output = chains.searchUserParams.parse(goodInput);
        expect(output).toStrictEqual({
          ...goodInput,
          // These get coerced into numbers.
          take: 10,
          skip: 50,
        });
      });

      describe('default values', () => {
        const output = chains.searchUserParams.parse({});

        it('has a take of 10', () => {
          expect(output.take).toStrictEqual(10);
        });

        it('has a skip of 0', () => {
          expect(output.skip).toStrictEqual(0);
        });

        it('orders by ascending user handle', () => {
          expect(output.orderBy).toStrictEqual(['handle']);
          expect(output.sortOrder).toStrictEqual(['asc']);
        });
      });

      it('coerces a single orderBy parameter into an array', () => {
        const output = chains.searchUserParams.parse({
          orderBy: 'displayName',
        });
        expect(output).toStrictEqual({
          ...defaultOutput,
          orderBy: ['displayName'],
        });
      });

      it('coerces a single sortOrder parameter into an array', () => {
        const output = chains.searchUserParams.parse({ sortOrder: 'desc' });
        expect(output).toStrictEqual({
          ...defaultOutput,
          sortOrder: ['desc'],
        });
      });
    });

    describe('fail', () => {
      it.each([
        {
          testType: 'non-number take',
          badInput: { take: 'a string' },
          expectedErrorMsg: 'Should be a number',
        },
        {
          testType: 'non-integer take',
          badInput: { take: '3.14' },
          expectedErrorMsg: 'Should be a whole number',
        },
        {
          testType: 'non-number skip',
          badInput: { skip: 'a string' },
          expectedErrorMsg: 'Should be a number',
        },
        {
          testType: 'non-integer skip',
          badInput: { skip: '3.14' },
          expectedErrorMsg: 'Should be a whole number',
        },
        {
          testType: 'bad orderBy column name',
          badInput: { orderBy: '3.14' },
          expectedErrorMsg:
            'Can only order by: id, handle, displayName, createdAt, updatedAt',
        },
      ])(
        'returns an appropriate error when $testType',
        ({ badInput, expectedErrorMsg }) => {
          expect(() =>
            chains.searchUserParams.parse({ ...goodInput, ...badInput }),
          ).toThrow(expectedErrorMsg);
        },
      );
    });
  });
});
