# Hex Game Logic Explained

## Files

- [types.ts](/home/erankyun/Hpam/backend/src/hex/types.ts)
- [engine.ts](/home/erankyun/Hpam/backend/src/hex/engine.ts)
- [engine.test.ts](/home/erankyun/Hpam/backend/src/hex/engine.test.ts)

## Board representation

`board[row][col]` values:
- `empty`
- `red`
- `blue`

Default size comes from `HEX_BOARD_SIZE` (fallback 11).

## Side goals

- `red` connects top to bottom.
- `blue` connects left to right.

## Move validation

In `applyMove(...)` backend checks:
- game not over
- row/col are integers
- coordinates inside board
- cell is empty

Then move is applied and turn flips.

## Winner detection algorithm

Implemented with BFS flood-fill:
1. start from one border for current side.
2. traverse same-color connected neighbors.
3. if traversal reaches opposite border, that side wins.

Hex neighbor set is 6-directional:
- up, up-right, left, right, down-left, down

## Tests included

- cannot play on occupied cell
- cannot play after game over
- turn alternation works
- red win detection example
- blue win detection example
