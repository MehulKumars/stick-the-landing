import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, solve, townProblems } from './engine/index.ts';
import { LESSONS } from './lessons.ts';

test('every lesson has exactly one answer under both noon rules', () => {
  for (const lesson of LESSONS) {
    assert.deepEqual(townProblems(lesson.puzzle), [], lesson.id);
    for (const rule of ['one', 'half'] as const) {
      const result = solve(lesson.puzzle, rule, 3, 3);
      assert.equal(result.count, 1, `${lesson.id} under ${rule}`);
      assert.deepEqual(
        result.solutions[0],
        lesson.solution,
        `${lesson.id} under ${rule}`
      );
      assert.equal(evaluate(lesson.puzzle, lesson.solution, rule).solved, true);
    }
  }
});

test('lesson 1 can be solved in the morning alone', () => {
  const first = LESSONS[0];
  assert.ok(first);
  assert.equal(first.lockTime, 'am');
  assert.ok(first.puzzle.cats.every((c) => c.nap === 'am'));
});
