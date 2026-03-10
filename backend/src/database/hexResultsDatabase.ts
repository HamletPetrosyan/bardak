import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import type { HexSession } from '../hex/types.js';

const storageDirectoryPath = path.join(process.cwd(), 'storage');
const resultsDatabasePath = path.join(storageDirectoryPath, 'hex-results.sqlite');

type SqliteDatabase = InstanceType<typeof Database>;

let database: SqliteDatabase | null = null;

function ensureStorageDirectory(): void {
  if (!existsSync(storageDirectoryPath)) {
    mkdirSync(storageDirectoryPath, { recursive: true });
  }
}

function getDatabase(): SqliteDatabase {
  if (!database) {
    initializeHexResultsDatabase();
  }

  return database!;
}

export function initializeHexResultsDatabase(): void {
  if (database) {
    return;
  }

  ensureStorageDirectory();
  database = new Database(resultsDatabasePath);
  database.pragma('journal_mode = WAL');

  database.exec(`
    CREATE TABLE IF NOT EXISTS hex_game_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      table_id TEXT NOT NULL,
      round_number INTEGER NOT NULL,
      board_size INTEGER NOT NULL,
      winner_side TEXT NOT NULL,
      winner_account_id TEXT NOT NULL,
      winner_display_name TEXT NOT NULL,
      loser_account_id TEXT NOT NULL,
      loser_display_name TEXT NOT NULL,
      move_count INTEGER NOT NULL,
      finished_at INTEGER NOT NULL,
      UNIQUE(session_id, round_number)
    );
  `);
}

export function recordFinishedHexGame(session: HexSession): void {
  if (session.gameState.status !== 'game-over' || !session.gameState.winnerSide) {
    return;
  }

  const winner = session.players.find((player) => player.side === session.gameState.winnerSide);
  const loser = session.players.find((player) => player.side !== session.gameState.winnerSide);

  if (!winner || !loser) {
    throw new Error('Cannot record Hex result without exactly two players');
  }

  const currentDatabase = getDatabase();
  currentDatabase
    .prepare(`
      INSERT OR IGNORE INTO hex_game_results (
        session_id,
        table_id,
        round_number,
        board_size,
        winner_side,
        winner_account_id,
        winner_display_name,
        loser_account_id,
        loser_display_name,
        move_count,
        finished_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      session.sessionId,
      session.tableId,
      session.gameState.roundNumber,
      session.gameState.boardSize,
      session.gameState.winnerSide,
      winner.accountId,
      winner.displayName,
      loser.accountId,
      loser.displayName,
      session.gameState.moveHistory.length,
      Date.now()
    );
}
