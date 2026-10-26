import * as z from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  JWT_ACCESS_MAX_AGE: z.coerce.number(),
  JWT_REFRESH_MAX_AGE: z.coerce.number(),
  JWT_SECRET: z.string(),
  PORT: z.coerce.number().default(8080),
});

// If parse fails, an error will be thrown.
export const env = envSchema.parse(process.env);
