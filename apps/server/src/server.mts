import express from 'express';
import { v1 } from './routers/v1.mjs';

export const server = express().use('/v1', v1);
