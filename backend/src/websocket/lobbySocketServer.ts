import { WebSocket, WebSocketServer } from 'ws';
import { getAccountIdFromSession } from '../sessionStore.js';
import { isGameType } from '../lobby/gameConfig.js';
import { getLobbySnapshot, subscribeLobbyChanges, subscribeSessionStarts } from '../lobby/lobbyStore.js';
import type { GameType, LobbySnapshot, SessionSummary } from '../lobby/types.js';

type ClientMessage =
  | {
      type: 'lobby_snapshot';
      gameType: GameType;
      snapshot: LobbySnapshot;
    }
  | {
      type: 'session_started';
      gameType: GameType;
      session: SessionSummary;
    };

const clientsByGame: Record<GameType, Set<WebSocket>> = {
  hex: new Set(),
  belote: new Set()
};

function safeSend(socket: WebSocket, message: ClientMessage): void {
  if (socket.readyState !== WebSocket.OPEN) {
    return;
  }

  socket.send(JSON.stringify(message));
}

function broadcastToGame(gameType: GameType, message: ClientMessage): void {
  clientsByGame[gameType].forEach((client) => {
    safeSend(client, message);
  });
}

export function createLobbySocketServer(): WebSocketServer {
  const socketServer = new WebSocketServer({
    noServer: true
  });

  subscribeLobbyChanges((gameType, snapshot) => {
    broadcastToGame(gameType, {
      type: 'lobby_snapshot',
      gameType,
      snapshot
    });
  });

  subscribeSessionStarts((gameType, session) => {
    broadcastToGame(gameType, {
      type: 'session_started',
      gameType,
      session
    });
  });

  socketServer.on('connection', (socket, request) => {
    const requestUrl = new URL(request.url ?? '', 'http://localhost');

    const token = requestUrl.searchParams.get('token');
    const gameTypeRaw = requestUrl.searchParams.get('gameType');

    if (!token || !gameTypeRaw || !isGameType(gameTypeRaw)) {
      socket.close(1008, 'Missing token or invalid gameType');
      return;
    }

    const accountId = getAccountIdFromSession(token);
    if (!accountId) {
      socket.close(1008, 'Invalid session');
      return;
    }

    const gameType = gameTypeRaw;
    clientsByGame[gameType].add(socket);

    safeSend(socket, {
      type: 'lobby_snapshot',
      gameType,
      snapshot: getLobbySnapshot(gameType)
    });

    socket.on('close', () => {
      clientsByGame[gameType].delete(socket);
    });
  });

  return socketServer;
}
