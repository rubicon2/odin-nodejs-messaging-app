import express from 'express';
import { errorHandler } from './middleware/errorHandler.mjs';
import { invalidRouteHandler } from './middleware/invalidRouteHandler.mjs';
import { v1 } from './routers/v1.mjs';

export const server = express()
  .use(express.urlencoded({ extended: true }))
  .use(express.json())
  .use('/v1', v1)
  .use(invalidRouteHandler)
  .use(errorHandler);
