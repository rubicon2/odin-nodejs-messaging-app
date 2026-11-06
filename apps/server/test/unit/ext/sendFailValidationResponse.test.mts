import { createRequest, createResponse } from 'node-mocks-http';
import { describe, expect, it } from 'vitest';
import * as z from 'zod';
import { sendFailValidationResponse } from '../../../src/ext/sendFailValidationResponse.mts';

describe('sendFailValidationResponse', () => {
  it('returns status code 400', () => {
    const req = createRequest();
    const res = createResponse();
    const parseResult = z.number('Not a number').safeParse('invalid value');
    // Just to make sure we are getting the error object as expected.
    expect(parseResult.success).toStrictEqual(false);
    // biome-ignore lint: since parseResult.success must be false, error must be there.
    sendFailValidationResponse(req, res, parseResult.error!);

    expect(res.statusCode).toStrictEqual(400);
  });

  it('returns error details in the response body', () => {
    const req = createRequest();
    const res = createResponse();
    const parseResult = z.number('Not a number').safeParse('invalid value');
    // Just to make sure we are getting the error object as expected.
    expect(parseResult.success).toStrictEqual(false);
    // biome-ignore lint: since parseResult.success must be false, error must be there.
    sendFailValidationResponse(req, res, parseResult.error!);

    expect(res._getJSONData()).toStrictEqual({
      status: 'fail-validation',
      data: {
        errors: ['Not a number'],
      },
    });
  });
});
