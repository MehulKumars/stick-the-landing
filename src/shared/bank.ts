import type { DayKey } from './dates.ts';
import type { NoonRule, Placements, Puzzle } from './engine/types.ts';

/** One day's town in the pre-generated bank. Server-only: it contains the solution. */
export type BankEntry = {
  date: DayKey;
  title: string;
  /** Difficulty dots, 1–7. */
  level: number;
  band: string;
  puzzle: Puzzle;
  solution: Placements;
  solutions: number;
  nodes: number;
};

export type Bank = {
  noonRule: NoonRule;
  from: DayKey;
  to: DayKey;
  days: Record<DayKey, BankEntry>;
};
