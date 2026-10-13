import * as z from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  PORT: z.coerce.number().default(8080),
});

// If parse fails, an error will be thrown.
export const env = envSchema.parse(process.env);
