import { getHexBoardSize } from './config.js';
import { applyMove, createInitialHexGameState, startNewRound } from './engine.js';
import { recordFinishedHexGame } from '../database/hexResultsDatabase.js';
import type {
  HexMoveInput,
  HexPlayer,
  HexPlayerSide,
  HexSession,
  HexSessionCreatedFromLobby,
  PublicHexSessionState
} from './types.js';

type HexSessionChangedListener = (session: PublicHexSessionState) => void;

const hexSessionsById = new Map<string, HexSession>();
const listeners = new Set<HexSessionChangedListener>();

function now(): number {
  return Date.now();
}

function getPlayerForSide(session: HexSession, side: HexPlayerSide): HexPlayer {
  const player = session.players.find((item) => item.side === side);
  if (!player) {
    throw new Error('Session has invalid player setup');
  }

  return player;
}

function toPublicState(session: HexSession): PublicHexSessionState {
  return {
    sessionId: session.sessionId,
    tableId: session.tableId,
    gameType: 'hex',
    players: session.players,
    gameState: session.gameState,
    rematchVotes: session.rematchVotes,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt
  };
}

function emitChanged(session: HexSession): void {
  const publicState = toPublicState(session);
  listeners.forEach((listener) => listener(publicState));
}

function isPlayerInSession(session: HexSession, accountId: string): boolean {
  return session.players.some((player) => player.accountId === accountId);
}

function getSessionOrThrow(sessionId: string): HexSession {
  const session = hexSessionsById.get(sessionId);
  if (!session) {
    throw new Error('Hex session not found');
  }

  return session;
}

export function createHexSessionFromLobby(started: HexSessionCreatedFromLobby): PublicHexSessionState {
  if (started.players.length !== 2) {
    throw new Error('Hex requires exactly 2 players');
  }

  const boardSize = getHexBoardSize();
  const timestamp = now();

  const session: HexSession = {
    sessionId: started.sessionId,
    tableId: started.tableId,
    gameType: 'hex',
    players: [
      {
        accountId: started.players[0].accountId,
        displayName: started.players[0].displayName,
        side: 'red'
      },
      {
        accountId: started.players[1].accountId,
        displayName: started.players[1].displayName,
        side: 'blue'
      }
    ],
    gameState: createInitialHexGameState(boardSize),
    rematchVotes: {
      red: false,
      blue: false
    },
    createdAt: timestamp,
    updatedAt: timestamp
  };

  hexSessionsById.set(session.sessionId, session);
  emitChanged(session);
  return toPublicState(session);
}

export function getHexSessionPublicState(sessionId: string): PublicHexSessionState | null {
  const session = hexSessionsById.get(sessionId);
  if (!session) {
    return null;
  }

  return toPublicState(session);
}

export function playHexMove(sessionId: string, accountId: string, move: HexMoveInput): PublicHexSessionState {
  const session = getSessionOrThrow(sessionId);
  const wasGameOver = session.gameState.status === 'game-over';

  if (!isPlayerInSession(session, accountId)) {
    throw new Error('You are not part of this session');
  }

  const expectedPlayer = getPlayerForSide(session, session.gameState.currentTurn);
  if (expectedPlayer.accountId !== accountId) {
    throw new Error('It is not your turn');
  }

  session.gameState = applyMove(session.gameState, {
    row: move.row,
    col: move.col,
    accountId
  });

  // New move invalidates previous rematch votes.
  session.rematchVotes = {
    red: false,
    blue: false
  };

  session.updatedAt = now();

  if (!wasGameOver && session.gameState.status === 'game-over') {
    recordFinishedHexGame(session);
  }

  emitChanged(session);
  return toPublicState(session);
}

export function voteHexRematch(sessionId: string, accountId: string, wantsRematch: boolean): PublicHexSessionState {
  const session = getSessionOrThrow(sessionId);

  const player = session.players.find((item) => item.accountId === accountId);
  if (!player) {
    throw new Error('You are not part of this session');
  }

  if (session.gameState.status !== 'game-over') {
    throw new Error('Rematch is available only after game over');
  }

  session.rematchVotes[player.side] = wantsRematch;

  if (session.rematchVotes.red && session.rematchVotes.blue) {
    session.gameState = startNewRound(session.gameState);
    session.rematchVotes = { red: false, blue: false };
  }

  session.updatedAt = now();
  emitChanged(session);
  return toPublicState(session);
}

export function subscribeHexSessionChanges(listener: HexSessionChangedListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
