import * as z from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  COOKIE_DOMAIN: z.url(),
  COOKIE_SAME_SITE: z
    .string()
    .refine((v) => {
      // Check we have a valid value for the same site attribute.
      switch (v.toLowerCase()) {
        case 'none':
        case 'lax':
        case 'strict':
          return true;
        default:
          return false;
      }
    }, 'Should be "none", "lax", or "strict"')
    // Now transform so we get the type information.
    .transform((v) => v as 'none' | 'lax' | 'strict'),
  COOKIE_SECURE: z.coerce.boolean(),
  JWT_ACCESS_MAX_AGE: z.coerce.number(),
  JWT_REFRESH_MAX_AGE: z.coerce.number(),
  JWT_SECRET: z.string(),
  PORT: z.coerce.number().default(8080),
});

// If parse fails, an error will be thrown.
export const env = envSchema.parse(process.env);
