import { createServer } from 'http';
import next from 'next';
import { getIO } from './socket';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => handle(req, res));
  getIO(server);
  const port = process.env.PORT ? Number(process.env.PORT) : 8080;
  server.listen(port, () => console.log(`Next+Socket.IO listening on ${port}`));
});


