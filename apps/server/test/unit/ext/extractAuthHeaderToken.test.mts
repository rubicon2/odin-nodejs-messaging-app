import { describe, expect, it } from 'vitest';
import { extractAuthHeaderToken } from '../../../src/ext/extractAuthHeaderToken.mjs';

describe('extractAuthHeaderToken', () => {
  it('extracts the bearer token from an authorization header', () => {
    expect(
      extractAuthHeaderToken({
        headers: {
          authorization: 'Bearer 12345',
        },
      }),
    ).toStrictEqual('12345');
  });

  it('returns null if there is no authorization header', () => {
    expect(
      extractAuthHeaderToken({
        headers: {},
      }),
    ).toStrictEqual(null);
  });

  it.each(['', 'blarg 999', '12345'])(
    'returns null if the bearer token is malformed',
    (malformedBearerToken) => {
      expect(
        extractAuthHeaderToken({
          headers: {
            authorization: malformedBearerToken,
          },
        }),
      ).toStrictEqual(null);
    },
  );
});
