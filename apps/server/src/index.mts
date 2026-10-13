import { env } from './schemas/env.mjs';

import express from 'express';

const app = express();

app.use('/', (_req, res) => {
  return res.send('Hello, world');
});

app.listen(env.PORT, () => console.log(`Listening on port ${env.PORT}`));
