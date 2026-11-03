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
    });
  });
});
