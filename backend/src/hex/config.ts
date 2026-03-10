export const DEFAULT_HEX_BOARD_SIZE = 11;

export function getHexBoardSize(): number {
  const value = process.env.HEX_BOARD_SIZE;

  if (!value) {
    return DEFAULT_HEX_BOARD_SIZE;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 3 || parsed > 19) {
    return DEFAULT_HEX_BOARD_SIZE;
  }

  return parsed;
}
