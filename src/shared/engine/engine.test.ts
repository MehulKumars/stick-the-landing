import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BANDS,
  IN_TRAY,
  adjustedTimeMs,
  castShadow,
  evaluate,
  generateTown,
  isLegalPlacement,
  seededRandom,
  solve,
  townNames,
  townProblems,
} from './index.ts';
import type { Puzzle } from './index.ts';

// 4×4 board, cells numbered row by row:
//  0  1  2  3
//  4  5  6  7
//  8  9 10 11
// 12 13 14 15

test('morning shadows fall west and stop at the edge', () => {
  assert.deepEqual(castShadow(4, 6, 2, 'am', 'one'), [5, 4]);
  assert.deepEqual(castShadow(4, 5, 3, 'am', 'one'), [4]);
});

test('evening shadows fall east and stop at the edge', () => {
  assert.deepEqual(castShadow(4, 5, 2, 'pm', 'one'), [6, 7]);
  assert.deepEqual(castShadow(4, 7, 2, 'pm', 'one'), []);
});

test('noon shadows fall north: one tile, or half the height rounded up', () => {
  assert.deepEqual(castShadow(4, 13, 4, 'noon', 'one'), [9]);
  assert.deepEqual(castShadow(4, 13, 4, 'noon', 'half'), [9, 5]);
  assert.deepEqual(castShadow(4, 13, 3, 'noon', 'half'), [9, 5]);
  assert.deepEqual(castShadow(4, 1, 2, 'noon', 'half'), []);
});

const lesson3: Puzzle = {
  size: 4,
  heights: [2],
  cats: [{ cell: 7, nap: 'pm' }],
  flowers: [1],
  wells: [],
};

test('evaluate: a cat sleeps only in shade at its nap time; a flower needs sun all day', () => {
  const good = evaluate(lesson3, [6], 'one');
  assert.equal(good.solved, true);
  assert.deepEqual(good.timeOk, { am: true, noon: true, pm: true });

  const shadedFlower = evaluate(lesson3, [5], 'one'); // noon shade lands on the flower at cell 1
  assert.equal(shadedFlower.cats[0]?.asleep, true);
  assert.equal(shadedFlower.flowers[0]?.lit, false);
  assert.equal(shadedFlower.timeOk.noon, false);
  assert.equal(shadedFlower.solved, false);

  const inTray = evaluate(lesson3, [IN_TRAY], 'one');
  assert.equal(inTray.allPlaced, false);
  assert.equal(inTray.solved, false);
});

test('houses may only stand on empty ground, one per tile', () => {
  assert.equal(isLegalPlacement(lesson3, [6]), true);
  assert.equal(isLegalPlacement(lesson3, [7]), false); // the cat
  assert.equal(isLegalPlacement(lesson3, [1]), false); // the flower
  assert.equal(isLegalPlacement(lesson3, [99]), false);
  assert.equal(isLegalPlacement(lesson3, [6, 5]), false); // wrong number of houses
  const two: Puzzle = { ...lesson3, heights: [2, 1] };
  assert.equal(isLegalPlacement(two, [6, 6]), false);
});

test('the solver finds the unique answer and counts alternatives', () => {
  const result = solve(lesson3, 'one', 3);
  assert.equal(result.count, 1);
  assert.deepEqual(result.solutions[0], [6]);

  const open: Puzzle = {
    size: 4,
    heights: [1],
    cats: [{ cell: 5, nap: 'am' }],
    flowers: [],
    wells: [],
  };
  assert.deepEqual(solve(open, 'one', 3).solutions, [[6]]);

  const twoWays: Puzzle = {
    size: 4,
    heights: [2],
    cats: [{ cell: 4, nap: 'am' }],
    flowers: [],
    wells: [],
  };
  assert.equal(solve(twoWays, 'one', 3).count, 2); // house at 5 or 6
});

test('every solution the solver returns really solves the puzzle', () => {
  for (let i = 0; i < 20; i++) {
    const band = BANDS[(i % 6) + 1];
    assert.ok(band);
    const town = generateTown(band, `prop-${i}`, 'one');
    const result = solve(town.puzzle, 'one', band.limit, 10);
    for (const s of result.solutions)
      assert.equal(evaluate(town.puzzle, s, 'one').solved, true);
  }
});

test('generated towns meet their band and are deterministic', () => {
  for (const band of BANDS) {
    for (const rule of ['one', 'half'] as const) {
      const a = generateTown(band, `band-${band.name}`, rule);
      const b = generateTown(band, `band-${band.name}`, rule);
      assert.deepEqual(a, b, `${band.name} ${rule} should be deterministic`);
      assert.deepEqual(townProblems(a.puzzle), []);
      assert.equal(a.puzzle.size, band.size);
      assert.equal(a.puzzle.cats.length, band.cats);
      assert.equal(a.puzzle.wells.length, band.wells);
      assert.ok(
        a.puzzle.flowers.length >= band.flowers[0] &&
          a.puzzle.flowers.length <= band.flowers[1]
      );
      assert.equal(evaluate(a.puzzle, a.solution, rule).solved, true);
      const count = solve(a.puzzle, rule, band.limit).count;
      assert.ok(
        count >= 1 && count <= band.limit,
        `${band.name} ${rule}: ${count} solutions`
      );
    }
  }
});

test('town validation catches malformed towns', () => {
  assert.deepEqual(townProblems(lesson3), []);
  assert.ok(townProblems({ ...lesson3, size: 9 }).length > 0);
  assert.ok(townProblems({ ...lesson3, flowers: [7] }).length > 0); // shares the cat's tile
  assert.ok(townProblems({ ...lesson3, heights: [2, 2] }).length > 0);
  assert.ok(townProblems({ ...lesson3, heights: [1, 2] }).length > 0);
  assert.ok(townProblems({ ...lesson3, cats: [] }).length > 0);
});

test('seeded randomness repeats for the same seed and differs between seeds', () => {
  const a = seededRandom('x');
  const b = seededRandom('x');
  const c = seededRandom('y');
  const seqA = [a(), a(), a()];
  assert.deepEqual(seqA, [b(), b(), b()]);
  assert.notDeepEqual(seqA, [c(), c(), c()]);
  assert.ok(seqA.every((v) => v >= 0 && v < 1));
});

test('town names: every pairing once, in a seeded order', () => {
  const names = townNames('test');
  assert.equal(new Set(names).size, names.length);
  assert.ok(names.length >= 400);
  assert.deepEqual(names, townNames('test'));
});

test('hints add thirty seconds each', () => {
  assert.equal(adjustedTimeMs(61_400, 0), 61_400);
  assert.equal(adjustedTimeMs(61_400, 2), 121_400);
});
