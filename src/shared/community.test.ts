import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDays } from './dates.ts';
import type { DayKey } from './dates.ts';
import {
  crowdLine,
  firstsFromHash,
  leaderboardScore,
  timeBucket,
} from './community.ts';
import {
  countsTowardStreak,
  currentStreak,
  dayOfYear,
  solvedDaysFromChunks,
  streakMayContinueIntoLastYear,
  STREAK_CHUNKS,
  yearOf,
} from './streaks.ts';
import {
  dailyPostTitle,
  recapLine,
  reportModmail,
  shareText,
  shareTextFromApp,
  stickyCommentText,
} from './reddit-copy.ts';

/** Builds what `get u32 #k` would return for a set of solved day-of-year bits. */
function chunksFor(days: number[]): number[] {
  const chunks = new Array<number>(STREAK_CHUNKS).fill(0);
  for (const d of days) {
    const k = Math.floor(d / 32);
    chunks[k] = (chunks[k] ?? 0) + 2 ** (31 - (d % 32));
  }
  return chunks;
}

const solvedSet = (days: DayKey[]) => {
  const set = new Set(days);
  return (day: DayKey) => set.has(day);
};

test('day-of-year bits and years', () => {
  assert.equal(dayOfYear('2026-01-01'), 0);
  assert.equal(dayOfYear('2026-12-31'), 364);
  assert.equal(dayOfYear('2028-12-31'), 365); // leap year
  assert.equal(yearOf('2027-01-01'), 2027);
});

test('bitfield chunks decode back to the same days, including the top bit', () => {
  const days = [0, 1, 31, 32, 63, 200, 364, 365];
  assert.deepEqual([...solvedDaysFromChunks(chunksFor(days))].sort((a, b) => a - b), days);
  assert.equal(solvedDaysFromChunks(new Array(12).fill(0)).size, 0);
});

test('no play means no streak', () => {
  assert.equal(currentStreak(() => false, '2026-12-14'), 0);
});

test('a streak counts back from today, or from yesterday while today is unsolved', () => {
  const today = '2026-12-14';
  const days = [0, 1, 2, 3].map((n) => addDays(today, -n));
  assert.equal(currentStreak(solvedSet(days), today), 4);
  const untilYesterday = [1, 2, 3].map((n) => addDays(today, -n));
  assert.equal(currentStreak(solvedSet(untilYesterday), today), 3);
  const gap = [0, 2, 3].map((n) => addDays(today, -n));
  assert.equal(currentStreak(solvedSet(gap), today), 1);
});

test('streaks cross the new year', () => {
  const today = '2027-01-02';
  const days = ['2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02'];
  assert.equal(currentStreak(solvedSet(days), today), 4);
  // Counting this year's bits alone reaches 1 January, so last year must be read.
  const thisYearOnly = days.filter((d) => d.startsWith('2027'));
  const partial = currentStreak(solvedSet(thisYearOnly), today);
  assert.equal(partial, 2);
  assert.equal(streakMayContinueIntoLastYear(partial, today), true);
  assert.equal(streakMayContinueIntoLastYear(0, '2027-01-01'), true);
  assert.equal(streakMayContinueIntoLastYear(3, '2027-06-01'), false);
});

test('old towns never mark the streak calendar', () => {
  assert.equal(countsTowardStreak('2026-12-14', '2026-12-14'), true);
  assert.equal(countsTowardStreak('2026-12-13', '2026-12-14'), false);
});

test('leaderboard: lower time first, then earlier solve, never reordering times', () => {
  const date = '2026-12-14';
  const t0 = Date.parse('2026-12-14T08:00:00Z');
  const fastLate = leaderboardScore(60_000, t0 + 3_600_000, date);
  const slowEarly = leaderboardScore(60_001, t0, date);
  assert.ok(fastLate < slowEarly);
  const early = leaderboardScore(60_000, t0, date);
  assert.ok(early < fastLate);
  // A year later the tie-break still stays under one millisecond.
  assert.ok(leaderboardScore(60_000, t0 + 365 * 86_400_000, date) < 60_001);
});

test('time buckets', () => {
  assert.equal(timeBucket(10_000), 't0');
  assert.equal(timeBucket(60_000), 't1');
  assert.equal(timeBucket(299_999), 't3');
  assert.equal(timeBucket(3_600_000), 't5');
});

test('first-drop counts ignore junk fields', () => {
  assert.deepEqual(
    firstsFromHash({ '0': '3', '4': '1', '99': '5', x: '2', '2': '-1' }, 5),
    [3, 0, 0, 0, 1]
  );
});

test('the crowd line never shows a percentage of a handful', () => {
  assert.deepEqual(crowdLine(0, null), { kind: 'alone' });
  assert.deepEqual(crowdLine(1, 1), { kind: 'alone' });
  assert.deepEqual(crowdLine(7, 3), { kind: 'early', solvers: 7 });
  assert.deepEqual(crowdLine(40, 10), {
    kind: 'sameStart',
    solvers: 40,
    percent: 25,
  });
  assert.deepEqual(crowdLine(40, null), { kind: 'count', solvers: 40 });
  assert.equal(crowdLine(1000, 1).kind, 'sameStart');
});

test('Reddit text: titles, recap and sticky comment', () => {
  assert.equal(
    dailyPostTitle(14, 'Little Harbour', '2026-12-14'),
    'Siesta No. 14: Little Harbour (Monday)'
  );
  assert.match(recapLine({ title: 'Hilltop Market', solvers: 0, fastestMs: null }), /Nobody/);
  assert.equal(
    recapLine({ title: 'Hilltop Market', solvers: 1, fastestMs: 61_000 }),
    'Yesterday one napper put Hilltop Market to sleep, in 1:01.'
  );
  assert.equal(
    recapLine({ title: 'Hilltop Market', solvers: 23, fastestMs: 58_000 }),
    'Yesterday 23 nappers put Hilltop Market to sleep. Quickest: 0:58.'
  );
  const first = stickyCommentText(1, 'Little Harbour', null);
  assert.ok(first.startsWith('**Today’s town: No. 1, Little Harbour.**'));
  assert.ok(
    stickyCommentText(2, 'Upper Steps', { title: 'Little Harbour', solvers: 2, fastestMs: 90_000 }).startsWith(
      'Yesterday 2 nappers'
    )
  );
});

test('shared results are spoiler-free and name the player when posted by the app', () => {
  const facts = { number: 14, title: 'Little Harbour', cats: 4, timeMs: 102_000, hints: 0, streak: 7 };
  assert.equal(
    shareText(facts),
    'Siesta No. 14, Little Harbour: all 4 cats asleep in 1:42. Streak: 7 days.'
  );
  assert.equal(
    shareText({ ...facts, cats: 1, streak: 1, hints: 1 }),
    'Siesta No. 14, Little Harbour: the cat asleep in 1:42 with 1 hint.'
  );
  assert.equal(
    shareTextFromApp(facts, 'napper'),
    'u/napper put Little Harbour (Siesta No. 14) to sleep in 1:42. Streak: 7 days.'
  );
});

test('problem reports name the town but not the reporter', () => {
  const mail = reportModmail(
    'unsolvable',
    { number: 3, title: 'Upper Steps', date: '2026-11-17' },
    't3_abc',
    '0.0.2'
  );
  assert.match(mail.subject, /can’t be solved/);
  assert.match(mail.body, /No\. 3, Upper Steps/);
  assert.match(mail.body, /comments\/abc/);
});
