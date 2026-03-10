import type { HexCellState, HexGameState, HexMove, HexPlayerSide } from './types.js';

function oppositeSide(side: HexPlayerSide): HexPlayerSide {
  return side === 'red' ? 'blue' : 'red';
}

function getNeighborCoordinates(row: number, col: number): Array<{ row: number; col: number }> {
  // Hex grid has 6 neighbors for each cell.
  return [
    { row: row - 1, col },
    { row: row - 1, col: col + 1 },
    { row, col: col - 1 },
    { row, col: col + 1 },
    { row: row + 1, col: col - 1 },
    { row: row + 1, col }
  ];
}

function isInsideBoard(boardSize: number, row: number, col: number): boolean {
  return row >= 0 && row < boardSize && col >= 0 && col < boardSize;
}

function hasConnectingPath(board: HexCellState[][], side: HexPlayerSide): boolean {
  const boardSize = board.length;
  const visited = new Set<string>();
  const queue: Array<{ row: number; col: number }> = [];

  if (side === 'red') {
    // Red wins by connecting top to bottom.
    for (let col = 0; col < boardSize; col += 1) {
      if (board[0][col] === 'red') {
        queue.push({ row: 0, col });
        visited.add(`0:${col}`);
      }
    }
  } else {
    // Blue wins by connecting left to right.
    for (let row = 0; row < boardSize; row += 1) {
      if (board[row][0] === 'blue') {
        queue.push({ row, col: 0 });
        visited.add(`${row}:0`);
      }
    }
  }

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (side === 'red' && current.row === boardSize - 1) {
      return true;
    }

    if (side === 'blue' && current.col === boardSize - 1) {
      return true;
    }

    const neighbors = getNeighborCoordinates(current.row, current.col);
    for (const neighbor of neighbors) {
      if (!isInsideBoard(boardSize, neighbor.row, neighbor.col)) {
        continue;
      }

      if (board[neighbor.row][neighbor.col] !== side) {
        continue;
      }

      const visitKey = `${neighbor.row}:${neighbor.col}`;
      if (visited.has(visitKey)) {
        continue;
      }

      visited.add(visitKey);
      queue.push(neighbor);
    }
  }

  return false;
}

function createEmptyBoard(boardSize: number): HexCellState[][] {
  return Array.from({ length: boardSize }, () => Array.from({ length: boardSize }, () => 'empty' as const));
}

export function createInitialHexGameState(boardSize: number): HexGameState {
  return {
    boardSize,
    board: createEmptyBoard(boardSize),
    status: 'playing',
    currentTurn: 'red',
    winnerSide: null,
    moveHistory: [],
    roundNumber: 1
  };
}

export function applyMove(gameState: HexGameState, input: { row: number; col: number; accountId: string }): HexGameState {
  const { row, col, accountId } = input;

  if (gameState.status === 'game-over') {
    throw new Error('Game is already over');
  }

  if (!Number.isInteger(row) || !Number.isInteger(col)) {
    throw new Error('Move coordinates must be integers');
  }

  if (!isInsideBoard(gameState.boardSize, row, col)) {
    throw new Error('Move is outside the board');
  }

  if (gameState.board[row][col] !== 'empty') {
    throw new Error('Cell is already occupied');
  }

  const playedSide = gameState.currentTurn;

  const nextBoard = gameState.board.map((boardRow) => [...boardRow]);
  nextBoard[row][col] = playedSide;

  const nextMove: HexMove = {
    row,
    col,
    side: playedSide,
    playedByAccountId: accountId,
    moveNumber: gameState.moveHistory.length + 1,
    playedAt: Date.now()
  };

  const winnerDetected = hasConnectingPath(nextBoard, playedSide);

  return {
    ...gameState,
    board: nextBoard,
    moveHistory: [...gameState.moveHistory, nextMove],
    status: winnerDetected ? 'game-over' : 'playing',
    winnerSide: winnerDetected ? playedSide : null,
    currentTurn: winnerDetected ? gameState.currentTurn : oppositeSide(gameState.currentTurn)
  };
}

export function startNewRound(previous: HexGameState): HexGameState {
  const nextRound = previous.roundNumber + 1;

  return {
    boardSize: previous.boardSize,
    board: createEmptyBoard(previous.boardSize),
    status: 'playing',
    // Alternate who starts each round.
    currentTurn: nextRound % 2 === 1 ? 'red' : 'blue',
    winnerSide: null,
    moveHistory: [],
    roundNumber: nextRound
  };
}
