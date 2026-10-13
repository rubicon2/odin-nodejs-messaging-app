import { v1 } from './routers/v1.mjs';

import express from 'express';

export const server = express().use('/v1', v1);
