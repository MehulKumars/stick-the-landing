// Streaks follow Reddit's recommended pattern: one bitfield per player per year, one bit per UTC day solved.
import { addDays, dateOfDayKey } from './dates.ts';
import type { DayKey } from './dates.ts';

const DAY_MS = 86_400_000;

/** A year's bitfield is read back as 12 unsigned 32-bit chunks: 384 bits cover 366 days. */
export const STREAK_CHUNKS = 12;
const CHUNK_BITS = 32;

export function yearOf(key: DayKey): number {
  return dateOfDayKey(key).getUTCFullYear();
}

/** The bit for a day within its year: 1 January is bit 0. */
export function dayOfYear(key: DayKey): number {
  const date = dateOfDayKey(key);
  return Math.round(
    (date.getTime() - Date.UTC(date.getUTCFullYear(), 0, 1)) / DAY_MS
  );
}

/**
 * Turns the answers to `get u32 #0 … get u32 #11` back into solved day-of-year indexes.
 * Redis numbers bits from the most significant end, so bit 0 is the top bit of chunk 0.
 */
export function solvedDaysFromChunks(chunks: readonly number[]): Set<number> {
  const days = new Set<number>();
  chunks.forEach((chunk, k) => {
    for (let bit = 0; bit < CHUNK_BITS; bit++) {
      if (Math.floor(chunk / 2 ** (CHUNK_BITS - 1 - bit)) % 2 === 1)
        days.add(k * CHUNK_BITS + bit);
    }
  });
  return days;
}

/** Only solving the current day's town marks the calendar. Old towns are playable but earn no streak. */
export function countsTowardStreak(date: DayKey, today: DayKey): boolean {
  return date === today;
}

/**
 * Consecutive solved days ending today, or ending yesterday while today's town is still unsolved
 * (a streak shouldn't look broken at breakfast).
 */
export function currentStreak(
  isSolved: (day: DayKey) => boolean,
  today: DayKey,
  limit = 1_000
): number {
  let day = isSolved(today) ? today : addDays(today, -1);
  let count = 0;
  while (count < limit && isSolved(day)) {
    count++;
    day = addDays(day, -1);
  }
  return count;
}

/**
 * True when a streak counted from this year's bits alone may continue into last year (it reached
 * 1 January, or today is 1 January), so last year's bitfield has to be read as well.
 */
export function streakMayContinueIntoLastYear(
  streak: number,
  today: DayKey
): boolean {
  return streak >= dayOfYear(today);
}
