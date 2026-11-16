import { redis } from '@devvit/web/server';
import type {
  SavedProgress,
  SolveRecord,
  SubmitRequest,
} from '../../shared/api.ts';
import type { DayKey } from '../../shared/dates.ts';
import {
  MAX_HINTS,
  adjustedTimeMs,
  evaluate,
  isLegalPlacement,
  minPlausibleMs,
  tileMap,
} from '../../shared/engine/index.ts';
import type { Placements, Puzzle } from '../../shared/engine/index.ts';
import { expiresIn, keys, ttlSeconds } from '../repo/keys.ts';
import { noonRule } from './puzzles.ts';

/** Remember when this player first opened this town; the server's clock caps their reported time. */
export async function markFirstSeen(
  date: DayKey,
  userId: string
): Promise<void> {
  await redis.set(keys.firstSeen(date, userId), String(Date.now()), {
    nx: true,
    expiration: expiresIn(ttlSeconds.firstSeen),
  });
}

export async function getProgress(
  date: DayKey,
  userId: string
): Promise<SavedProgress | null> {
  const raw = await redis.get(keys.progress(date, userId));
  if (!raw) return null;
  const parsed: SavedProgress = JSON.parse(raw);
  return { ...parsed, firstTile: parsed.firstTile ?? null };
}

/** A first drop must be a tile a house can stand on; anything else is ignored rather than trusted. */
export function cleanFirstTile(
  puzzle: Puzzle,
  tile: number | null | undefined
): number | null {
  if (tile === null || tile === undefined || !Number.isInteger(tile))
    return null;
  return tileMap(puzzle)[tile] === 'ground' ? tile : null;
}

export async function saveProgress(
  date: DayKey,
  userId: string,
  puzzle: Puzzle,
  placements: Placements,
  timeMs: number,
  firstTile: number | null | undefined
): Promise<boolean> {
  if (!isLegalPlacement(puzzle, placements)) return false;
  // The first drop never changes once recorded, even if the house is moved later.
  const earlier = await getProgress(date, userId);
  const progress: SavedProgress = {
    placements,
    timeMs: Math.round(timeMs),
    firstTile: earlier?.firstTile ?? cleanFirstTile(puzzle, firstTile),
  };
  await redis.set(keys.progress(date, userId), JSON.stringify(progress), {
    expiration: expiresIn(ttlSeconds.progress),
  });
  return true;
}

export async function getResult(
  date: DayKey,
  userId: string
): Promise<SolveRecord | null> {
  const raw = await redis.get(keys.result(date, userId));
  if (!raw) return null;
  const parsed: SolveRecord = JSON.parse(raw);
  return { ...parsed, firstTile: parsed.firstTile ?? null };
}

export type Verdict =
  { ok: true; record: SolveRecord } | { ok: false; message: string };

/**
 * Replays the player's placements with the engine. The client's claim that it solved the town is
 * never trusted. Times are clamped to what the server saw, and implausibly fast solves are refused.
 */
export async function judgeSolve(
  puzzle: Puzzle,
  request: SubmitRequest,
  firstSeenAt: number | null,
  savedFirstTile: number | null
): Promise<Verdict> {
  if (!evaluate(puzzle, request.placements, noonRule).solved) {
    return { ok: false, message: 'That town is not asleep yet.' };
  }
  if (request.hints < 0 || request.hints > MAX_HINTS)
    return { ok: false, message: 'Too many hints.' };
  let timeMs = Math.round(request.timeMs);
  if (firstSeenAt !== null) {
    const serverElapsed = Date.now() - firstSeenAt + 5_000;
    timeMs = Math.min(timeMs, serverElapsed);
  }
  if (timeMs < minPlausibleMs(puzzle))
    return { ok: false, message: 'That was faster than possible.' };
  return {
    ok: true,
    record: {
      placements: request.placements,
      timeMs,
      hints: request.hints,
      adjustedMs: adjustedTimeMs(timeMs, request.hints),
      moves: Math.max(0, request.moves),
      solvedAt: Date.now(),
      firstTile: savedFirstTile ?? cleanFirstTile(puzzle, request.firstTile),
    },
  };
}

export async function firstSeenAt(
  date: DayKey,
  userId: string
): Promise<number | null> {
  const raw = await redis.get(keys.firstSeen(date, userId));
  const value = raw ? Number(raw) : NaN;
  return Number.isFinite(value) ? value : null;
}

/**
 * Stores the first solve only; later solves of the same town don't overwrite it. `isNew` is true for
 * exactly one call per player and town, so streaks and stats are counted once.
 */
export async function saveResult(
  date: DayKey,
  userId: string,
  record: SolveRecord
): Promise<{ record: SolveRecord; isNew: boolean }> {
  const existing = await getResult(date, userId);
  if (existing) return { record: existing, isNew: false };
  const claim = await redis.incrBy(keys.lock(`solve:${date}:${userId}`), 1);
  await redis.expire(keys.lock(`solve:${date}:${userId}`), ttlSeconds.lock);
  if (claim !== 1) {
    // A double submit is already saving this solve: report the stored one when it lands.
    const stored = await getResult(date, userId);
    return { record: stored ?? record, isNew: false };
  }
  await redis.set(keys.result(date, userId), JSON.stringify(record), {
    expiration: expiresIn(ttlSeconds.result),
  });
  await redis.del(keys.progress(date, userId));
  return { record, isNew: true };
}
