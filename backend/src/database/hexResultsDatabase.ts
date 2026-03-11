import type { HexSession } from '../hex/types.js';
import { getSql } from './supabaseDatabase.js';

export async function initializeHexResultsDatabase(): Promise<void> {
  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS hex_game_results (
      id BIGSERIAL PRIMARY KEY,
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
      finished_at BIGINT NOT NULL,
      UNIQUE (session_id, round_number)
    )
  `;
}

export async function recordFinishedHexGame(session: HexSession): Promise<void> {
  if (session.gameState.status !== 'game-over' || !session.gameState.winnerSide) {
    return;
  }

  const winner = session.players.find((player) => player.side === session.gameState.winnerSide);
  const loser = session.players.find((player) => player.side !== session.gameState.winnerSide);

  if (!winner || !loser) {
    throw new Error('Cannot record Hex result without exactly two players');
  }

  const sql = getSql();

  await sql`
    INSERT INTO hex_game_results (
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
    VALUES (
      ${session.sessionId},
      ${session.tableId},
      ${session.gameState.roundNumber},
      ${session.gameState.boardSize},
      ${session.gameState.winnerSide},
      ${winner.accountId},
      ${winner.displayName},
      ${loser.accountId},
      ${loser.displayName},
      ${session.gameState.moveHistory.length},
      ${Date.now()}
    )
    ON CONFLICT (session_id, round_number) DO NOTHING
  `;
}
