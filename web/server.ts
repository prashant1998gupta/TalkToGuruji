// Custom server: Next.js + Socket.io on one port.
import { createServer } from 'node:http';
import next from 'next';
import { Server } from 'socket.io';
import { attachRealtime } from './src/server/realtime';

const dev = !process.argv.includes('--prod');
if (!dev) (process.env as Record<string, string>).NODE_ENV = 'production';
const port = Number(process.env.PORT) || 3000;
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => handle(req, res));
  const io = new Server(server, { path: '/socket.io', cors: { origin: false } });
  attachRealtime(io);
  server.listen(port, () => console.log(`> Talk to Guruji ready on http://localhost:${port}`));
});
