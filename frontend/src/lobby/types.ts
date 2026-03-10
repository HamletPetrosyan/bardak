export type GameType = 'hex' | 'belote';

export type TableStatus = 'waiting' | 'ready-to-start' | 'in-game';

export type TableSeat = {
  accountId: string;
  displayName: string;
  isReady: boolean;
} | null;

export type Table = {
  tableId: string;
  gameType: GameType;
  status: TableStatus;
  seats: TableSeat[];
  createdAt: number;
  updatedAt: number;
  emptySince: number | null;
};

export type LobbySnapshot = {
  gameType: GameType;
  requiredPlayers: number;
  tables: Table[];
};

export type SessionSummary = {
  sessionId: string;
  tableId: string;
  gameType: GameType;
  players: {
    accountId: string;
    displayName: string;
  }[];
  createdAt: number;
};

export type LobbySocketMessage =
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

export function isGameType(value: string): value is GameType {
  return value === 'hex' || value === 'belote';
}

export function gameTitle(gameType: GameType): string {
  return gameType === 'hex' ? 'հեքս' : 'բլոտ';
}
