// Pure helpers for the community layer: leaderboard order, stats buckets and what the result card may say.
import { dateOfDayKey } from './dates.ts';
import type { DayKey } from './dates.ts';

const DAY_MS = 86_400_000;

/** Below this many solvers we never show percentages: "You're one of the first 7…" instead. */
export const SMALL_CROWD = 10;

/** "Where everyone started" only appears once a few people have played, so it isn't just your own tile. */
export const MIN_CROWD_FOR_MAP = 3;

/**
 * Sorted-set score: lower adjusted time first; equal times go to whoever solved first. The tie-break
 * is a fraction below 1 ms, so it never reorders different times. Old towns stay playable for a year.
 */
export function leaderboardScore(
  adjustedMs: number,
  solvedAt: number,
  date: DayKey
): number {
  const since = Math.max(0, solvedAt - dateOfDayKey(date).getTime());
  return Math.round(adjustedMs) + Math.min(0.999, since / (400 * DAY_MS));
}

/** Time buckets for the daily stats hash (no user ids are stored there). */
const BUCKET_LIMITS_S = [60, 120, 180, 300, 600] as const;

export function timeBucket(ms: number): string {
  const seconds = ms / 1000;
  const index = BUCKET_LIMITS_S.findIndex((limit) => seconds < limit);
  return `t${index === -1 ? BUCKET_LIMITS_S.length : index}`;
}

/** Turns the `first:{d}` hash (tile → count) into one count per tile; junk fields are ignored. */
export function firstsFromHash(
  hash: Record<string, string>,
  tiles: number
): number[] {
  const counts = new Array<number>(tiles).fill(0);
  for (const [field, value] of Object.entries(hash)) {
    const tile = Number(field);
    const count = Number(value);
    if (Number.isInteger(tile) && tile >= 0 && tile < tiles && count > 0)
      counts[tile] = Math.floor(count);
  }
  return counts;
}

export type CrowdLine =
  | { kind: 'alone' }
  | { kind: 'early'; solvers: number }
  | { kind: 'sameStart'; solvers: number; percent: number }
  | { kind: 'count'; solvers: number };

/**
 * The one community line on the result card. Honest at every size: never a percentage of a handful.
 * Logged-out players aren't counted, so a crowd of 0 still reads as "alone".
 */
export function crowdLine(
  solvers: number,
  sameStart: number | null
): CrowdLine {
  if (solvers <= 1) return { kind: 'alone' };
  if (solvers < SMALL_CROWD) return { kind: 'early', solvers };
  if (sameStart !== null && sameStart > 0)
    return {
      kind: 'sameStart',
      solvers,
      percent: Math.max(1, Math.round((sameStart / solvers) * 100)),
    };
  return { kind: 'count', solvers };
}
