import type { GameType, LobbySocketMessage, LobbySnapshot, SessionSummary } from '../lobby/types';
import { getWebSocketBaseUrl } from './runtimeUrls';

const WS_BASE_URL = getWebSocketBaseUrl();

type ConnectLobbySocketOptions = {
  token: string;
  gameType: GameType;
  onSnapshot: (snapshot: LobbySnapshot) => void;
  onSessionStarted: (session: SessionSummary) => void;
  onError: (message: string) => void;
};

export function connectLobbySocket(options: ConnectLobbySocketOptions): () => void {
  const { token, gameType, onSnapshot, onSessionStarted, onError } = options;

  const socketUrl = new URL('/ws/lobby', WS_BASE_URL);
  socketUrl.searchParams.set('token', token);
  socketUrl.searchParams.set('gameType', gameType);

  const socket = new WebSocket(socketUrl.toString());

  socket.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data as string) as LobbySocketMessage;

      if (parsed.type === 'lobby_snapshot') {
        onSnapshot(parsed.snapshot);
        return;
      }

      if (parsed.type === 'session_started') {
        onSessionStarted(parsed.session);
      }
    } catch {
      onError('Received invalid websocket message');
    }
  };

  socket.onerror = () => {
    onError('Websocket connection failed');
  };

  return () => {
    socket.close();
  };
}
