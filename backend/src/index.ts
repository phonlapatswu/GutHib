import http from 'http';
import app from './app';
import { initSocket } from './socket';

/**
 * SharkTask Backend Entry Point
 * Initializes HTTP Server, Socket.io Engine, and starts listening on PORT.
 */

const PORT = process.env.PORT || 3001;

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
