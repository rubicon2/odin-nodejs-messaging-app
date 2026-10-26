import { describe, expect, it } from 'vitest';
import { extractAuthHeaderToken } from '../../../src/ext/extractAuthHeaderToken.mjs';

describe('extractAuthHeaderToken', () => {
  it('given a request with a valid authorization header bearer token, extracts and returns it', () => {
    expect(
      extractAuthHeaderToken({
        headers: {
          authorization: 'Bearer 12345',
        },
      }),
    ).toStrictEqual('12345');
  });

  it('given a request with no authorization header, returns null', () => {
    expect(
      extractAuthHeaderToken({
        headers: {},
      }),
    ).toStrictEqual(null);
  });

  it.each(['', 'blarg 999', '12345'])(
    'given a request with an authorization header of: "$0" (i.e. malformed), returns null',
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
