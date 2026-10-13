import { env } from './schemas/env.mjs';
import { server } from './server.mjs';

server.listen(env.PORT, () => console.log(`Listening on port ${env.PORT}`));
