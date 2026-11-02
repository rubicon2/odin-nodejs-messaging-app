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
});

describe('chains', () => {
  // So the defaults don't have to be typed manually over and over.
  const defaultOutput = {
    take: 10,
    skip: 0,
    orderBy: ['id'],
    sortOrder: ['asc'],
  };

  describe('searchParams', () => {
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

      describe('default values', () =>{
        const output = chains.searchParams.parse({})

        it('has a take of 10', () => {
          expect(output.take).toStrictEqual(10);
        })

        it('has a skip of 0', () => {
          expect(output.skip).toStrictEqual(0);
        })

        it('orders by ascending id', () => {
          expect(output.orderBy).toStrictEqual(['id']);
          expect(output.sortOrder).toStrictEqual(['asc']);
        })
      })

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
});
