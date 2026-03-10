import { WebSocket, WebSocketServer } from 'ws';
import { getAccountIdFromSession } from '../sessionStore.js';
import { getHexSessionPublicState, subscribeHexSessionChanges } from '../hex/sessionStore.js';
import type { PublicHexSessionState } from '../hex/types.js';

type HexServerMessage = {
  type: 'hex_state';
  session: PublicHexSessionState;
};

const clientsBySessionId = new Map<string, Set<WebSocket>>();

function safeSend(socket: WebSocket, message: HexServerMessage): void {
  if (socket.readyState !== WebSocket.OPEN) {
    return;
  }

  socket.send(JSON.stringify(message));
}

function getSessionClients(sessionId: string): Set<WebSocket> {
  let clients = clientsBySessionId.get(sessionId);

  if (!clients) {
    clients = new Set();
    clientsBySessionId.set(sessionId, clients);
  }

  return clients;
}

function broadcastHexState(session: PublicHexSessionState): void {
  const clients = clientsBySessionId.get(session.sessionId);
  if (!clients) {
    return;
  }

  const message: HexServerMessage = {
    type: 'hex_state',
    session
  };

  clients.forEach((client) => {
    safeSend(client, message);
  });
}

export function createHexSocketServer(): WebSocketServer {
  const wsServer = new WebSocketServer({
    noServer: true
  });

  subscribeHexSessionChanges((session) => {
    broadcastHexState(session);
  });

  wsServer.on('connection', (socket, request) => {
    const requestUrl = new URL(request.url ?? '', 'http://localhost');

    const token = requestUrl.searchParams.get('token');
    const sessionId = requestUrl.searchParams.get('sessionId');

    if (!token || !sessionId) {
      socket.close(1008, 'Missing token or sessionId');
      return;
    }

    const accountId = getAccountIdFromSession(token);
    if (!accountId) {
      socket.close(1008, 'Invalid session token');
      return;
    }

    const session = getHexSessionPublicState(sessionId);
    if (!session) {
      socket.close(1008, 'Hex session not found');
      return;
    }

    const belongsToSession = session.players.some((player) => player.accountId === accountId);
    if (!belongsToSession) {
      socket.close(1008, 'User is not part of this Hex session');
      return;
    }

    const clients = getSessionClients(sessionId);
    clients.add(socket);

    safeSend(socket, {
      type: 'hex_state',
      session
    });

    socket.on('close', () => {
      clients.delete(socket);

      if (clients.size === 0) {
        clientsBySessionId.delete(sessionId);
      }
    });
  });

  return wsServer;
}
