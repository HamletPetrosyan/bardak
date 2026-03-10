export type HexCellState = 'empty' | 'red' | 'blue';

export type HexPlayerSide = 'red' | 'blue';

export type HexStatus = 'playing' | 'game-over';

export type HexPlayer = {
  accountId: string;
  displayName: string;
  side: HexPlayerSide;
};

export type HexMove = {
  row: number;
  col: number;
  side: HexPlayerSide;
  playedByAccountId: string;
  moveNumber: number;
  playedAt: number;
};

export type HexGameState = {
  boardSize: number;
  board: HexCellState[][];
  status: HexStatus;
  currentTurn: HexPlayerSide;
  winnerSide: HexPlayerSide | null;
  moveHistory: HexMove[];
  roundNumber: number;
};

export type HexRematchVotes = {
  red: boolean;
  blue: boolean;
};

export type HexSessionState = {
  sessionId: string;
  tableId: string;
  gameType: 'hex';
  players: HexPlayer[];
  gameState: HexGameState;
  rematchVotes: HexRematchVotes;
  createdAt: number;
  updatedAt: number;
};

export type HexSocketMessage = {
  type: 'hex_state';
  session: HexSessionState;
};
