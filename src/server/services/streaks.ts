import { redis } from '@devvit/web/server';
import type { BitfieldCommand } from '@devvit/web/server';
import type { DayKey } from '../../shared/dates.ts';
import {
  STREAK_CHUNKS,
  countsTowardStreak,
  currentStreak,
  dayOfYear,
  solvedDaysFromChunks,
  streakMayContinueIntoLastYear,
  yearOf,
} from '../../shared/streaks.ts';
import { keys, ttlSeconds } from '../repo/keys.ts';

/** Reads a whole year of solved days in one call: twelve `get u32 #k` commands. */
async function solvedDays(userId: string, year: number): Promise<Set<number>> {
  const gets = Array.from(
    { length: STREAK_CHUNKS },
    (_, k): BitfieldCommand => ['get', 'u32', `#${k}`]
  );
  const [a, b, c, ...rest] = gets;
  if (!a || !b || !c) return new Set();
  const chunks = await redis.bitfield(
    keys.streaks(userId, year),
    ...a,
    ...b,
    ...c,
    ...rest.flat()
  );
  return solvedDaysFromChunks(chunks);
}

/** The player's current streak, reading last year's bits only when the streak reaches 1 January. */
export async function streakFor(userId: string, today: DayKey): Promise<number> {
  const year = yearOf(today);
  const thisYear = await solvedDays(userId, year);
  const isSolvedThisYear = (day: DayKey) =>
    yearOf(day) === year && thisYear.has(dayOfYear(day));
  const partial = currentStreak(isSolvedThisYear, today);
  if (!streakMayContinueIntoLastYear(partial, today)) return partial;
  const lastYear = await solvedDays(userId, year - 1);
  return currentStreak(
    (day) =>
      yearOf(day) === year
        ? thisYear.has(dayOfYear(day))
        : yearOf(day) === year - 1 && lastYear.has(dayOfYear(day)),
    today
  );
}

/**
 * Marks today on the player's calendar after a verified first solve and renews the key's lifetime.
 * Old towns don't count, and a bit that is already set is never cleared.
 */
export async function markSolvedDay(
  userId: string,
  date: DayKey,
  today: DayKey
): Promise<void> {
  if (!countsTowardStreak(date, today)) return;
  const key = keys.streaks(userId, yearOf(date));
  await redis.bitfield(key, 'set', 'u1', dayOfYear(date), 1);
  await redis.expire(key, ttlSeconds.streaks);
}

/** Keeps the best streak and the solve count on the player's hash (both expire with it). */
export async function recordPlayerTotals(
  userId: string,
  streak: number
): Promise<void> {
  const key = keys.user(userId);
  const fields = await redis.hGetAll(key);
  const best = Number(fields.bestStreak ?? 0);
  await redis.hIncrBy(key, 'totalSolved', 1);
  if (streak > best) await redis.hSet(key, { bestStreak: String(streak) });
  await redis.expire(key, ttlSeconds.user);
}
