import crypto from 'crypto';
import {
  getRequiredPlayers,
  TABLE_CREATION_LIMIT,
  TABLE_CREATION_WINDOW_MS,
  TABLE_EMPTY_TTL_MS
} from './gameConfig.js';
import type { GameType, LobbySnapshot, SessionSummary, Table, TableSeat } from './types.js';

type PlayerIdentity = {
  accountId: string;
  displayName: string;
};

type LobbyChangedListener = (gameType: GameType, snapshot: LobbySnapshot) => void;
type SessionStartedListener = (gameType: GameType, session: SessionSummary) => void;

const tablesByGame: Record<GameType, Map<string, Table>> = {
  hex: new Map(),
  belote: new Map()
};

const sessionsByGame: Record<GameType, Map<string, SessionSummary>> = {
  hex: new Map(),
  belote: new Map()
};
const tableCreationHistoryByGame = {
  hex: new Map<string, number[]>(),
  belote: new Map<string, number[]>()
};

const lobbyChangedListeners = new Set<LobbyChangedListener>();
const sessionStartedListeners = new Set<SessionStartedListener>();

function generateTableId(): string {
  return crypto.randomBytes(5).toString('hex');
}

function generateSessionId(): string {
  return crypto.randomBytes(8).toString('hex');
}

function now(): number {
  return Date.now();
}

function countOccupiedSeats(seats: TableSeat[]): number {
  return seats.filter((seat) => seat !== null).length;
}

function findUserSeatIndex(table: Table, accountId: string): number {
  return table.seats.findIndex((seat) => seat?.accountId === accountId);
}

function isTableStartable(table: Table): boolean {
  const occupiedCount = countOccupiedSeats(table.seats);
  if (occupiedCount !== table.seats.length) {
    return false;
  }

  return table.seats.every((seat) => seat !== null && seat.isReady);
}

function updateTableStatus(table: Table): void {
  table.status = isTableStartable(table) ? 'ready-to-start' : 'waiting';
}

function resetReadinessForSeatedPlayers(table: Table): void {
  table.seats.forEach((seat) => {
    if (seat) {
      seat.isReady = false;
    }
  });
}

function markUpdated(table: Table): void {
  table.updatedAt = now();
}

function tableBecameEmpty(table: Table): boolean {
  return countOccupiedSeats(table.seats) === 0;
}

function syncEmptySince(table: Table): void {
  if (tableBecameEmpty(table)) {
    if (table.emptySince === null) {
      table.emptySince = now();
    }
  } else {
    table.emptySince = null;
  }
}

function createSnapshot(gameType: GameType): LobbySnapshot {
  const tables = Array.from(tablesByGame[gameType].values()).sort((a, b) => a.createdAt - b.createdAt);

  return {
    gameType,
    requiredPlayers: getRequiredPlayers(gameType),
    tables
  };
}

function emitLobbyChanged(gameType: GameType): void {
  const snapshot = createSnapshot(gameType);
  lobbyChangedListeners.forEach((listener) => listener(gameType, snapshot));
}

function emitSessionStarted(gameType: GameType, session: SessionSummary): void {
  sessionStartedListeners.forEach((listener) => listener(gameType, session));
}

function findSeatInGame(gameType: GameType, accountId: string): { tableId: string; seatIndex: number } | null {
  const tables = tablesByGame[gameType];

  for (const table of tables.values()) {
    const seatIndex = findUserSeatIndex(table, accountId);
    if (seatIndex >= 0) {
      return { tableId: table.tableId, seatIndex };
    }
  }

  return null;
}

function getTableOrThrow(gameType: GameType, tableId: string): Table {
  const table = tablesByGame[gameType].get(tableId);
  if (!table) {
    throw new Error('Table not found');
  }

  return table;
}

function startTableInternal(gameType: GameType, table: Table): SessionSummary {
  if (!isTableStartable(table)) {
    throw new Error('Table is not ready to start');
  }

  table.status = 'in-game';

  const session: SessionSummary = {
    sessionId: generateSessionId(),
    tableId: table.tableId,
    gameType,
    players: table.seats
      .filter((seat): seat is NonNullable<TableSeat> => seat !== null)
      .map((seat) => ({
        accountId: seat.accountId,
        displayName: seat.displayName
      })),
    createdAt: now()
  };

  sessionsByGame[gameType].set(session.sessionId, session);

  // Once a session starts, remove the table from lobby so users can create/join fresh tables.
  tablesByGame[gameType].delete(table.tableId);

  emitLobbyChanged(gameType);
  emitSessionStarted(gameType, session);
  return session;
}

export function subscribeLobbyChanges(listener: LobbyChangedListener): () => void {
  lobbyChangedListeners.add(listener);
  return () => {
    lobbyChangedListeners.delete(listener);
  };
}

export function subscribeSessionStarts(listener: SessionStartedListener): () => void {
  sessionStartedListeners.add(listener);
  return () => {
    sessionStartedListeners.delete(listener);
  };
}

export function getLobbySnapshot(gameType: GameType): LobbySnapshot {
  return createSnapshot(gameType);
}

export function getSessionSummary(gameType: GameType, sessionId: string): SessionSummary | null {
  return sessionsByGame[gameType].get(sessionId) ?? null;
}

function consumeTableCreationQuota(gameType: GameType, accountId: string): void {
  const historyMap = tableCreationHistoryByGame[gameType];
  const currentTime = now();
  const currentHistory = historyMap.get(accountId) ?? [];
  const recentHistory = currentHistory.filter((time) => currentTime - time < TABLE_CREATION_WINDOW_MS);

  if (recentHistory.length >= TABLE_CREATION_LIMIT) {
    throw new Error(`Table creation limit reached: max ${TABLE_CREATION_LIMIT} per 10 minutes`);
  }

  recentHistory.push(currentTime);
  historyMap.set(accountId, recentHistory);
}

export function createTable(gameType: GameType, accountId: string): Table {
  consumeTableCreationQuota(gameType, accountId);

  const requiredPlayers = getRequiredPlayers(gameType);
  const timestamp = now();

  const table: Table = {
    tableId: generateTableId(),
    gameType,
    status: 'waiting',
    seats: Array.from({ length: requiredPlayers }, () => null),
    createdAt: timestamp,
    updatedAt: timestamp,
    emptySince: timestamp
  };

  tablesByGame[gameType].set(table.tableId, table);
  emitLobbyChanged(gameType);
  return table;
}

export function joinSeat(gameType: GameType, tableId: string, seatIndex: number, player: PlayerIdentity): void {
  const table = getTableOrThrow(gameType, tableId);

  if (table.status === 'in-game') {
    throw new Error('This table is already in game');
  }

  if (!Number.isInteger(seatIndex) || seatIndex < 0 || seatIndex >= table.seats.length) {
    throw new Error('Seat index is invalid');
  }

  const existingSeatInGame = findSeatInGame(gameType, player.accountId);
  if (existingSeatInGame) {
    throw new Error('You can only occupy one seat per game lobby');
  }

  if (table.seats[seatIndex] !== null) {
    throw new Error('Seat is already occupied');
  }

  table.seats[seatIndex] = {
    accountId: player.accountId,
    displayName: player.displayName,
    isReady: false
  };

  // Composition changed: reset readiness for all seated players.
  resetReadinessForSeatedPlayers(table);
  syncEmptySince(table);
  updateTableStatus(table);
  markUpdated(table);
  emitLobbyChanged(gameType);
}

export function leaveSeat(gameType: GameType, tableId: string, accountId: string): void {
  const table = getTableOrThrow(gameType, tableId);

  if (table.status === 'in-game') {
    throw new Error('Cannot leave: table already started');
  }

  const seatIndex = findUserSeatIndex(table, accountId);
  if (seatIndex < 0) {
    throw new Error('You are not seated at this table');
  }

  table.seats[seatIndex] = null;

  // Composition changed: reset readiness for remaining seated players.
  resetReadinessForSeatedPlayers(table);
  syncEmptySince(table);
  updateTableStatus(table);
  markUpdated(table);
  emitLobbyChanged(gameType);
}

export function setReadyState(
  gameType: GameType,
  tableId: string,
  accountId: string,
  isReady: boolean
): SessionSummary | null {
  const table = getTableOrThrow(gameType, tableId);

  if (table.status === 'in-game') {
    throw new Error('Table already started');
  }

  const seatIndex = findUserSeatIndex(table, accountId);
  if (seatIndex < 0) {
    throw new Error('Only seated players can change ready state');
  }

  const seat = table.seats[seatIndex];
  if (!seat) {
    throw new Error('Seat is empty');
  }

  seat.isReady = isReady;

  syncEmptySince(table);
  updateTableStatus(table);
  markUpdated(table);

  if (isTableStartable(table)) {
    return startTableInternal(gameType, table);
  }

  emitLobbyChanged(gameType);
  return null;
}

export function startTableManually(gameType: GameType, tableId: string, accountId: string): SessionSummary {
  const table = getTableOrThrow(gameType, tableId);

  if (table.status === 'in-game') {
    throw new Error('Table already started');
  }

  const seatIndex = findUserSeatIndex(table, accountId);
  if (seatIndex < 0) {
    throw new Error('Only seated players can start the game');
  }

  return startTableInternal(gameType, table);
}

export function runEmptyTableCleanup(currentTime: number = now()): { removedCount: number } {
  let removedCount = 0;

  (Object.keys(tablesByGame) as GameType[]).forEach((gameType) => {
    const tables = tablesByGame[gameType];
    let changed = false;

    tables.forEach((table) => {
      if (table.emptySince === null) {
        return;
      }

      const ageMs = currentTime - table.emptySince;
      if (ageMs >= TABLE_EMPTY_TTL_MS) {
        tables.delete(table.tableId);
        removedCount += 1;
        changed = true;
      }
    });

    if (changed) {
      emitLobbyChanged(gameType);
    }
  });

  return { removedCount };
}
