import express from 'express';
import 'dotenv/config';

const app = express();

app.use('/', (_req, res) => {
  return res.send('Hello, world');
});

app.listen(process.env.PORT, () =>
  console.log(`Listening on port ${process.env.PORT}`),
);
