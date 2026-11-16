import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addDays,
  dayKeyOf,
  daysBetween,
  isDayKey,
  longDate,
  msUntilNextDay,
  puzzleNumber,
  weekdayOf,
} from './dates.ts';

test('day keys are UTC dates', () => {
  assert.equal(dayKeyOf(new Date('2026-12-14T23:59:59Z')), '2026-12-14');
  assert.equal(dayKeyOf(new Date('2026-12-15T00:00:00Z')), '2026-12-15');
});

test('day arithmetic crosses months and years', () => {
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  assert.equal(daysBetween('2026-11-17', '2027-01-01'), 45);
});

test('weekdays and puzzle numbers', () => {
  assert.equal(weekdayOf('2026-12-14'), 1); // Monday
  assert.equal(weekdayOf('2026-12-13'), 0); // Sunday
  assert.equal(puzzleNumber('2026-11-17', '2026-11-17'), 1);
  assert.equal(puzzleNumber('2026-12-09', '2026-11-17'), 23);
  assert.equal(longDate('2026-12-14'), 'Monday 14 December');
});

test('isDayKey rejects malformed and impossible dates', () => {
  assert.equal(isDayKey('2026-12-14'), true);
  assert.equal(isDayKey('2026-02-30'), false);
  assert.equal(isDayKey('2026-1-4'), false);
  assert.equal(isDayKey(20261214), false);
});

test('time until the next town', () => {
  assert.equal(msUntilNextDay(new Date('2026-12-14T23:00:00Z')), 3_600_000);
});
