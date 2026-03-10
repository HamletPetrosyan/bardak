import type { HexSessionState, HexSocketMessage } from '../hex/types';
import { getWebSocketBaseUrl } from './runtimeUrls';

const WS_BASE_URL = getWebSocketBaseUrl();

type ConnectHexSessionSocketOptions = {
  token: string;
  sessionId: string;
  onState: (session: HexSessionState) => void;
  onError: (message: string) => void;
};

export function connectHexSessionSocket(options: ConnectHexSessionSocketOptions): () => void {
  const { token, sessionId, onState, onError } = options;

  const socketUrl = new URL('/ws/hex-session', WS_BASE_URL);
  socketUrl.searchParams.set('token', token);
  socketUrl.searchParams.set('sessionId', sessionId);

  const socket = new WebSocket(socketUrl.toString());

  socket.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data as string) as HexSocketMessage;
      if (payload.type === 'hex_state') {
        onState(payload.session);
      }
    } catch {
      onError('Received invalid hex websocket message');
    }
  };

  socket.onerror = () => {
    onError('Hex websocket connection failed');
  };

  return () => {
    socket.close();
  };
}
