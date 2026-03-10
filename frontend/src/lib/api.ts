import type { LoginResponse, PublicUser } from '../types';
import type { GameType, LobbySnapshot, SessionSummary, Table } from '../lobby/types';
import type { HexSessionState } from '../hex/types';
import { getApiBaseUrl } from './runtimeUrls';

const API_BASE_URL = getApiBaseUrl();

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {})
    }
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(errorBody?.message ?? 'Request failed');
  }

  return (await response.json()) as T;
}

function authHeader(token: string): { Authorization: string } {
  return {
    Authorization: `Bearer ${token}`
  };
}

export async function loginWithAccountKey(accountKey: string): Promise<LoginResponse> {
  return request<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ accountKey })
  });
}

export async function getCurrentSession(token: string): Promise<{ user: PublicUser }> {
  return request<{ user: PublicUser }>('/api/auth/session', {
    method: 'GET',
    headers: authHeader(token)
  });
}

export async function updateDisplayName(token: string, displayName: string): Promise<{ user: PublicUser }> {
  return request<{ user: PublicUser }>('/api/user/display-name', {
    method: 'PATCH',
    headers: authHeader(token),
    body: JSON.stringify({ displayName })
  });
}

export async function logoutSession(token: string): Promise<void> {
  await request<{ success: true }>('/api/auth/logout', {
    method: 'POST',
    headers: authHeader(token)
  });
}

export async function getLobbySnapshot(token: string, gameType: GameType): Promise<LobbySnapshot> {
  const response = await request<{ snapshot: LobbySnapshot }>(`/api/games/${gameType}/lobby`, {
    method: 'GET',
    headers: authHeader(token)
  });

  return response.snapshot;
}

export async function createTable(token: string, gameType: GameType): Promise<Table> {
  const response = await request<{ table: Table }>(`/api/games/${gameType}/tables`, {
    method: 'POST',
    headers: authHeader(token)
  });

  return response.table;
}

export async function joinSeat(token: string, gameType: GameType, tableId: string, seatIndex: number): Promise<void> {
  await request<{ success: true }>(`/api/games/${gameType}/tables/${tableId}/seats/${seatIndex}/join`, {
    method: 'POST',
    headers: authHeader(token)
  });
}

export async function leaveSeat(token: string, gameType: GameType, tableId: string): Promise<void> {
  await request<{ success: true }>(`/api/games/${gameType}/tables/${tableId}/leave`, {
    method: 'POST',
    headers: authHeader(token)
  });
}

export async function setReady(token: string, gameType: GameType, tableId: string, isReady: boolean): Promise<void> {
  await request<{ success: true }>(`/api/games/${gameType}/tables/${tableId}/ready`, {
    method: 'POST',
    headers: authHeader(token),
    body: JSON.stringify({ isReady })
  });
}

export async function startTable(token: string, gameType: GameType, tableId: string): Promise<SessionSummary> {
  const response = await request<{ session: SessionSummary }>(`/api/games/${gameType}/tables/${tableId}/start`, {
    method: 'POST',
    headers: authHeader(token)
  });

  return response.session;
}

export async function getSessionSummary(
  token: string,
  gameType: GameType,
  sessionId: string
): Promise<SessionSummary> {
  const response = await request<{ session: SessionSummary }>(`/api/games/${gameType}/sessions/${sessionId}`, {
    method: 'GET',
    headers: authHeader(token)
  });

  return response.session;
}

export async function getHexSessionState(token: string, sessionId: string): Promise<HexSessionState> {
  const response = await request<{ session: HexSessionState }>(`/api/hex/sessions/${sessionId}`, {
    method: 'GET',
    headers: authHeader(token)
  });

  return response.session;
}

export async function playHexMove(token: string, sessionId: string, row: number, col: number): Promise<HexSessionState> {
  const response = await request<{ session: HexSessionState }>(`/api/hex/sessions/${sessionId}/moves`, {
    method: 'POST',
    headers: authHeader(token),
    body: JSON.stringify({ row, col })
  });

  return response.session;
}

export async function voteHexRematch(
  token: string,
  sessionId: string,
  wantsRematch: boolean
): Promise<HexSessionState> {
  const response = await request<{ session: HexSessionState }>(`/api/hex/sessions/${sessionId}/rematch-vote`, {
    method: 'POST',
    headers: authHeader(token),
    body: JSON.stringify({ wantsRematch })
  });

  return response.session;
}
