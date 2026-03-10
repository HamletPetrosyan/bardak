import { Router } from 'express';
import { findAccountById } from '../data/accounts.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { isGameType } from '../lobby/gameConfig.js';
import {
  createTable,
  getLobbySnapshot,
  getSessionSummary,
  joinSeat,
  leaveSeat,
  setReadyState,
  startTableManually
} from '../lobby/lobbyStore.js';
import type { GameType } from '../lobby/types.js';

export const gameRoutes = Router();

gameRoutes.use(authMiddleware);

function parseGameType(gameTypeRaw: string): GameType {
  if (!isGameType(gameTypeRaw)) {
    throw new Error('Game type is invalid');
  }

  return gameTypeRaw;
}

gameRoutes.get('/:gameType/lobby', (request, response) => {
  try {
    const gameType = parseGameType(request.params.gameType);
    response.json({ snapshot: getLobbySnapshot(gameType) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load lobby';
    response.status(400).json({ message });
  }
});

gameRoutes.post('/:gameType/tables', (request, response) => {
  try {
    const gameType = parseGameType(request.params.gameType);
    const table = createTable(gameType, request.authAccountId!);
    response.status(201).json({ table });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not create table';
    response.status(400).json({ message });
  }
});

gameRoutes.post('/:gameType/tables/:tableId/seats/:seatIndex/join', (request, response) => {
  try {
    const gameType = parseGameType(request.params.gameType);
    const seatIndex = Number(request.params.seatIndex);
    const account = findAccountById(request.authAccountId!);

    if (!account) {
      response.status(404).json({ message: 'Account not found' });
      return;
    }

    joinSeat(gameType, request.params.tableId, seatIndex, {
      accountId: account.accountId,
      displayName: account.displayName
    });

    response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not join seat';
    response.status(400).json({ message });
  }
});

gameRoutes.post('/:gameType/tables/:tableId/leave', (request, response) => {
  try {
    const gameType = parseGameType(request.params.gameType);
    leaveSeat(gameType, request.params.tableId, request.authAccountId!);
    response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not leave seat';
    response.status(400).json({ message });
  }
});

gameRoutes.post('/:gameType/tables/:tableId/ready', (request, response) => {
  try {
    const gameType = parseGameType(request.params.gameType);
    if (typeof request.body.isReady !== 'boolean') {
      response.status(400).json({ message: 'isReady must be boolean' });
      return;
    }

    const isReady = request.body.isReady;

    const startedSession = setReadyState(gameType, request.params.tableId, request.authAccountId!, isReady);
    response.json({ success: true, startedSession });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update ready state';
    response.status(400).json({ message });
  }
});

gameRoutes.post('/:gameType/tables/:tableId/start', (request, response) => {
  try {
    const gameType = parseGameType(request.params.gameType);
    const session = startTableManually(gameType, request.params.tableId, request.authAccountId!);
    response.json({ session });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not start table';
    response.status(400).json({ message });
  }
});

gameRoutes.get('/:gameType/sessions/:sessionId', (request, response) => {
  try {
    const gameType = parseGameType(request.params.gameType);
    const session = getSessionSummary(gameType, request.params.sessionId);

    if (!session) {
      response.status(404).json({ message: 'Session not found' });
      return;
    }

    response.json({ session });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load session';
    response.status(400).json({ message });
  }
});
