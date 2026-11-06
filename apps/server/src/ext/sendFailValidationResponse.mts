import * as createResponseBody from '@repo/response-json';
import { createValidationErrors } from '@repo/validation/zod';
import type { Request, Response } from 'express';
import type { ZodError } from 'zod';

export function sendFailValidationResponse(
  /**
   * Currently unused, but including in function parameters
   * just in case we need it for something later, in which
   * case, no calls to this function will need to be changed.
   */
  _req: Request,
  res: Response,
  error: ZodError,
) {
  return res
    .status(400)
    .json(createResponseBody.failValidation(createValidationErrors(error)));
}
