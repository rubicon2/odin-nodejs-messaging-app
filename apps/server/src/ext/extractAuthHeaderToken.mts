import type { Request } from 'express';

export function extractAuthHeaderToken(
  req: Pick<Request, 'headers'>,
): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    // Remove "Bearer " so we are left with just the token.
    return authHeader.match(/(?<=Bearer ).*/)?.[0] ?? null;
  }
  return null;
}
