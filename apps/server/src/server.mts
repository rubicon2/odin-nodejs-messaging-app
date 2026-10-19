import express from 'express';
import { v1 } from './routers/v1.mjs';

export const server = express()
  .use(express.urlencoded({ extended: true }))
  .use(express.json())
  .use('/v1', v1);
