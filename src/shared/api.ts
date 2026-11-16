import type { CrowdLine } from './community.ts';
import type { DayKey } from './dates.ts';
import type { ReportCategory } from './reddit-copy.ts';
import type { NoonRule, Placements, Puzzle } from './engine/types.ts';

/** What the client may know about a town: everything except the solution. */
export type PublicTown = {
  date: DayKey;
  /** Town No. n, counted from the day the app was installed in this subreddit. */
  number: number;
  title: string;
  level: number;
  band: string;
  puzzle: Puzzle;
  noonRule: NoonRule;
};

export type PostKind = 'hub' | 'daily';

/** `firstTile` is where the player dropped their first house: it feeds "where everyone started". */
export type SavedProgress = {
  placements: Placements;
  timeMs: number;
  firstTile: number | null;
};

export type SolveRecord = {
  placements: Placements;
  timeMs: number;
  hints: number;
  adjustedMs: number;
  moves: number;
  solvedAt: number;
  firstTile: number | null;
};

/** What the community did with a town. Only ever sent to players who have solved it (no spoilers). */
export type Community = {
  /** Logged-in players who solved this town. */
  solvers: number;
  /** 1-based place by adjusted time, or null when the player isn't on the board (logged out). */
  rank: number | null;
  /** First-drop counts per tile, for the "where everyone started" map. */
  firsts: number[];
  line: CrowdLine;
};

/** Posts the result card links to. Null when that post doesn't exist (yet). */
export type PostLinks = {
  today: string | null;
  yesterday: string | null;
  /** The daily post for the town on screen (the stable link a challenge shares). */
  thisTown: string | null;
  /** The pinned "Today's town" post. */
  hub: string | null;
};

/** Per-player settings. Kept in Redis because localStorage is wiped on every app update. */
export type Settings = { tutorialDone: boolean; muted: boolean };

export type SettingsRequest = { tutorialDone?: boolean; muted?: boolean };

export type InitResponse = {
  type: 'init';
  town: PublicTown;
  postKind: PostKind;
  isToday: boolean;
  today: DayKey;
  msUntilNext: number;
  user: { loggedIn: boolean; username: string | null };
  settings: Settings;
  progress: SavedProgress | null;
  result: SolveRecord | null;
  /** Current streak in days (0 when logged out). */
  streak: number;
  /** Only present once this player has solved the town. */
  community: Community | null;
  posts: PostLinks;
  subredditName: string;
  /** The player pressed "Join" before (we can't ask Reddit cheaply, so we remember the press). */
  joined: boolean;
  /** Permalink of the player's shared result for this town, if they already posted it. */
  sharedPermalink: string | null;
};

export type ProgressRequest = {
  date: DayKey;
  placements: Placements;
  timeMs: number;
  firstTile?: number | null;
};

export type SubmitRequest = {
  date: DayKey;
  placements: Placements;
  timeMs: number;
  hints: number;
  moves: number;
  /** Optional so an old cached client can still submit. */
  firstTile?: number | null;
};

export type SubmitResponse = {
  type: 'submit';
  result: SolveRecord;
  saved: boolean;
  streak: number;
  community: Community | null;
};

export type ShareRequest = { date: DayKey };

export type ShareResponse = {
  type: 'share';
  permalink: string;
  /** True when Reddit posted it from the app account (the app isn't approved for user actions yet). */
  postedByApp: boolean;
};

export type ReportRequest = { category: ReportCategory; date: DayKey };

export type OkResponse = { type: 'ok' };

export type ErrorResponse = { type: 'error'; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPlacements(value: unknown): value is Placements {
  return (
    Array.isArray(value) &&
    value.length <= 8 &&
    value.every((c) => Number.isInteger(c))
  );
}

function isOptionalTile(value: unknown): boolean {
  return value === undefined || value === null || Number.isInteger(value);
}

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

export function isProgressRequest(value: unknown): value is ProgressRequest {
  return (
    isRecord(value) &&
    typeof value.date === 'string' &&
    isPlacements(value.placements) &&
    isFiniteNonNegative(value.timeMs) &&
    isOptionalTile(value.firstTile)
  );
}

export function isSubmitRequest(value: unknown): value is SubmitRequest {
  return (
    isRecord(value) &&
    typeof value.date === 'string' &&
    isPlacements(value.placements) &&
    isFiniteNonNegative(value.timeMs) &&
    Number.isInteger(value.hints) &&
    Number.isInteger(value.moves) &&
    isOptionalTile(value.firstTile)
  );
}

export function isShareRequest(value: unknown): value is ShareRequest {
  return isRecord(value) && typeof value.date === 'string';
}

export function isReportRequest(value: unknown): value is ReportRequest {
  return (
    isRecord(value) &&
    typeof value.date === 'string' &&
    typeof value.category === 'string'
  );
}

export function isSettingsRequest(value: unknown): value is SettingsRequest {
  if (!isRecord(value)) return false;
  const { tutorialDone, muted } = value;
  return (
    (tutorialDone === undefined || typeof tutorialDone === 'boolean') &&
    (muted === undefined || typeof muted === 'boolean')
  );
}
