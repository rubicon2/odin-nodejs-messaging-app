import { describe, expect, it } from 'vitest';
import * as z from 'zod';
import { preprocesses } from '../../src/array.mjs';

describe('preprocesses', () => {
  describe('ensureArray', () => {
    describe('returned schema', () => {
      it('given a single non-array value, puts it into an array', () => {
        expect(preprocesses.ensureArray(z.any()).parse(1)).toStrictEqual([1]);
      });

      it('given an array, returns it with parsed elements', () => {
        expect(
          preprocesses.ensureArray(z.any()).parse([1, 2, 3]),
        ).toStrictEqual([1, 2, 3]);
      });

      it('uses the elementSchema parameter to parse the array elements', () => {
        expect(
          preprocesses.ensureArray(z.coerce.string()).parse([1, 2, 3]),
        ).toStrictEqual(['1', '2', '3']);
      });

      it('given invalid elements, returns errors in the expected format', () => {
        const parseResult = preprocesses
          .ensureArray(z.coerce.number('Not a number'))
          .safeParse(['1', 'invalid', 'also-invalid']);
        expect(parseResult.success).toStrictEqual(false);

        // biome-ignore lint: If parseResult.success is true, parseResult error must be present. If not, that's a zod bug.
        const errors = z.treeifyError(parseResult.error!);
        expect(errors).toEqual({
          errors: [],
          items: [
            // undefined array element seems to mess with toStrictEqual - it says "no visual difference"
            // but fails the test anyway. So for this test only, making the assertion with toEqual instead.
            undefined,
            {
              errors: ['Not a number'],
            },
            {
              errors: ['Not a number'],
            },
          ],
        });
      });
    });
  });
});
