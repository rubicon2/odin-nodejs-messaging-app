import * as z from 'zod';
import { intErrorMsg, numberErrorMsg, positiveNumberMsg } from './errors.mjs';

const positiveInt = z.coerce
  .number(numberErrorMsg())
  .int(intErrorMsg())
  .min(0, positiveNumberMsg());

type PositiveInt = z.infer<typeof positiveInt>;

export const fields = {
  positiveInt,
};

export type { PositiveInt };
