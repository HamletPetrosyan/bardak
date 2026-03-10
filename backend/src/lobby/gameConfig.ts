import type { GameType } from './types.js';

export const REQUIRED_PLAYERS_BY_GAME: Record<GameType, number> = {
  hex: 2,
  belote: 4
};

export const TABLE_EMPTY_TTL_MS = 10 * 60 * 1000;
export const TABLE_CLEANUP_INTERVAL_MS = 60 * 1000;
export const TABLE_CREATION_LIMIT = 5;
export const TABLE_CREATION_WINDOW_MS = 10 * 60 * 1000;

export function isGameType(value: string): value is GameType {
  return value === 'hex' || value === 'belote';
}

export function getRequiredPlayers(gameType: GameType): number {
  return REQUIRED_PLAYERS_BY_GAME[gameType];
}
