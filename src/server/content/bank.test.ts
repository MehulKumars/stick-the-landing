import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { Bank } from '../../shared/bank.ts';
import { addDays, daysBetween, weekdayOf } from '../../shared/dates.ts';
import {
  bandFor,
  evaluate,
  solve,
  townProblems,
} from '../../shared/engine/index.ts';

const bank: Bank = JSON.parse(
  readFileSync(new URL('./bank.json', import.meta.url), 'utf8')
);

test('the bank covers every day from launch to the end of 2027', () => {
  assert.ok(bank.from <= '2026-11-17', `starts ${bank.from}`);
  assert.ok(bank.to >= '2027-12-31', `ends ${bank.to}`);
  const total = daysBetween(bank.from, bank.to) + 1;
  for (let i = 0; i < total; i++) {
    const date = addDays(bank.from, i);
    assert.ok(bank.days[date], `missing ${date}`);
  }
  assert.equal(Object.keys(bank.days).length, total);
});

test('every banked town is well formed, solved by its stored answer, and within its band', () => {
  for (const entry of Object.values(bank.days)) {
    const band = bandFor(weekdayOf(entry.date));
    assert.deepEqual(townProblems(entry.puzzle), [], entry.date);
    assert.equal(entry.band, band.name, entry.date);
    assert.equal(entry.level, band.level, entry.date);
    assert.equal(entry.puzzle.size, band.size, entry.date);
    assert.equal(
      evaluate(entry.puzzle, entry.solution, bank.noonRule).solved,
      true,
      `${entry.date} stored solution`
    );
    const count = solve(entry.puzzle, bank.noonRule, band.limit).count;
    assert.ok(
      count >= 1 && count <= band.limit,
      `${entry.date}: ${count} solutions (limit ${band.limit})`
    );
  }
});

test('no two days share a layout, and names never repeat within the bank', () => {
  const layouts = new Set<string>();
  const titles = new Set<string>();
  for (const entry of Object.values(bank.days)) {
    const key = JSON.stringify(entry.puzzle);
    assert.ok(!layouts.has(key), `${entry.date} repeats a layout`);
    layouts.add(key);
    assert.ok(
      !titles.has(entry.title),
      `${entry.date} repeats the name ${entry.title}`
    );
    titles.add(entry.title);
  }
});
