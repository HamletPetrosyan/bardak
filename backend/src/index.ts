import http from 'http';
import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { authRoutes } from './routes/authRoutes.js';
import { userRoutes } from './routes/userRoutes.js';
import { gameRoutes } from './routes/gameRoutes.js';
import { hexRoutes } from './routes/hexRoutes.js';
import { TABLE_CLEANUP_INTERVAL_MS } from './lobby/gameConfig.js';
import { runEmptyTableCleanup } from './lobby/lobbyStore.js';
import { createLobbySocketServer } from './websocket/lobbySocketServer.js';
import { createHexSocketServer } from './websocket/hexSocketServer.js';
import { initializeHexSessionBridge } from './hex/index.js';
import { initializeAccountsDatabase } from './database/accountsDatabase.js';
import { initializeHexResultsDatabase } from './database/hexResultsDatabase.js';

const app = express();
initializeAccountsDatabase();
initializeHexResultsDatabase();

app.use(
  cors({
    origin: config.frontendOrigin,
    credentials: false
  })
);
app.use(express.json());

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/hex', hexRoutes);

const server = http.createServer(app);
initializeHexSessionBridge();

const lobbySocketServer = createLobbySocketServer();
const hexSocketServer = createHexSocketServer();

server.on('upgrade', (request, socket, head) => {
  const requestUrl = new URL(request.url ?? '/', 'http://localhost');

  if (requestUrl.pathname === '/ws/lobby') {
    lobbySocketServer.handleUpgrade(request, socket, head, (websocket) => {
      lobbySocketServer.emit('connection', websocket, request);
    });
    return;
  }

  if (requestUrl.pathname === '/ws/hex-session') {
    hexSocketServer.handleUpgrade(request, socket, head, (websocket) => {
      hexSocketServer.emit('connection', websocket, request);
    });
    return;
  }

  socket.destroy();
});

setInterval(() => {
  runEmptyTableCleanup();
}, TABLE_CLEANUP_INTERVAL_MS);

server.listen(config.port, () => {
  console.log(`Backend listening on http://localhost:${config.port}`);
});
