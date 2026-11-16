import type { Puzzle } from './types.ts';

export const HINT_PENALTY_MS = 30_000;
export const MAX_HINTS = 2;

/** Leaderboard time: play time plus 30 seconds per hint. Lower is better. */
export function adjustedTimeMs(timeMs: number, hints: number): number {
  return Math.round(timeMs) + hints * HINT_PENALTY_MS;
}

/** Faster than this is not a human solve: about two seconds per house. */
export function minPlausibleMs(puzzle: Puzzle): number {
  return puzzle.heights.length * 2_000;
}
