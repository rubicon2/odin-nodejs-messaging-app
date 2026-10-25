import { createClient } from '@repo/db/client';

/**
 * Use same client throughout app. It will connect
 * once and use the same pool of connections which
 * is more efficient than creating a new client
 * whenever we need to do a database query.
 */
export const client = createClient();
