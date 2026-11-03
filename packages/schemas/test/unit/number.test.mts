import { describe, expect, it } from 'vitest';
import * as z from 'zod';
import { fields } from '../../src/number.mjs';

describe('fields', () => {
  describe('positiveInt', () => {
    it('given a positive int, parses successfully', () => {
      expect(fields.positiveInt.parse(7)).toStrictEqual(7);
    });

    it('given a string that cannot be coerced into a number, returns an error about requiring a number', () => {
      const parseResult = fields.positiveInt.safeParse('invalid');

      expect(parseResult.success).toStrictEqual(false);
      // biome-ignore lint: If parseResult.success is true, parseResult error must be present. If not, that's a zod bug.
      const errors = z.treeifyError(parseResult.error!);
      expect(errors).toEqual({
        errors: ['Should be a number'],
      });
    });

    it('given a decimal number, returns an error about requiring a whole number', () => {
      const parseResult = fields.positiveInt.safeParse(3.14);

      expect(parseResult.success).toStrictEqual(false);
      // biome-ignore lint: If parseResult.success is true, parseResult error must be present. If not, that's a zod bug.
      const errors = z.treeifyError(parseResult.error!);
      expect(errors).toEqual({
        errors: ['Should be a whole number'],
      });
    });

    it('given a negative number, returns an error about requiring a positive number', () => {
      const parseResult = fields.positiveInt.safeParse(-1);

      expect(parseResult.success).toStrictEqual(false);
      // biome-ignore lint: If parseResult.success is true, parseResult error must be present. If not, that's a zod bug.
      const errors = z.treeifyError(parseResult.error!);
      expect(errors).toEqual({
        errors: ['Should be a positive number'],
      });
    });
  });
});
