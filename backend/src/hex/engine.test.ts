import assert from 'node:assert/strict';
import test from 'node:test';
import { applyMove, createInitialHexGameState } from './engine.js';

function playSequence(
  boardSize: number,
  moves: Array<{ row: number; col: number; accountId: string }>
): ReturnType<typeof createInitialHexGameState> {
  let state = createInitialHexGameState(boardSize);

  for (const move of moves) {
    state = applyMove(state, move);
  }

  return state;
}

test('cannot play on occupied cell', () => {
  let state = createInitialHexGameState(3);
  state = applyMove(state, { row: 0, col: 0, accountId: 'alice' });

  assert.throws(() => {
    applyMove(state, { row: 0, col: 0, accountId: 'bob' });
  }, /occupied/);
});

test('cannot play after game is over', () => {
  const finished = playSequence(3, [
    { row: 0, col: 0, accountId: 'alice' },
    { row: 0, col: 1, accountId: 'bob' },
    { row: 1, col: 0, accountId: 'alice' },
    { row: 1, col: 1, accountId: 'bob' },
    { row: 2, col: 0, accountId: 'alice' }
  ]);

  assert.equal(finished.status, 'game-over');
  assert.throws(() => {
    applyMove(finished, { row: 2, col: 2, accountId: 'bob' });
  }, /already over/);
});

test('turn alternation works while game is playing', () => {
  let state = createInitialHexGameState(3);
  assert.equal(state.currentTurn, 'red');

  state = applyMove(state, { row: 0, col: 2, accountId: 'alice' });
  assert.equal(state.currentTurn, 'blue');

  state = applyMove(state, { row: 1, col: 2, accountId: 'bob' });
  assert.equal(state.currentTurn, 'red');
});

test('red winner detection works on vertical connection', () => {
  const state = playSequence(3, [
    { row: 0, col: 0, accountId: 'alice' },
    { row: 0, col: 1, accountId: 'bob' },
    { row: 1, col: 0, accountId: 'alice' },
    { row: 1, col: 1, accountId: 'bob' },
    { row: 2, col: 0, accountId: 'alice' }
  ]);

  assert.equal(state.status, 'game-over');
  assert.equal(state.winnerSide, 'red');
});

test('blue winner detection works on left-right connection', () => {
  const state = playSequence(3, [
    { row: 2, col: 2, accountId: 'alice' },
    { row: 0, col: 0, accountId: 'bob' },
    { row: 2, col: 1, accountId: 'alice' },
    { row: 0, col: 1, accountId: 'bob' },
    { row: 1, col: 2, accountId: 'alice' },
    { row: 0, col: 2, accountId: 'bob' }
  ]);

  assert.equal(state.status, 'game-over');
  assert.equal(state.winnerSide, 'blue');
});
