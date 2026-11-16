// Every Redis key and its lifetime, in one place (docs/03-ARCHITECTURE.md §3).
// Any key that holds a user id expires within 30 days: Devvit has no account-deletion trigger.
import type { DayKey } from '../../shared/dates.ts';

const DAY_SECONDS = 86_400;

export const keys = {
  launchDate: () => 'cfg:launchDate',
  hubPostId: () => 'cfg:hubPostId',
  generatedTown: (date: DayKey) => `gen:${date}`,
  /** The daily post for a date (the idempotency guard for the scheduler). */
  dailyPost: (date: DayKey) => `post:${date}`,
  /** Reverse lookup so a deleted post can be forgotten. */
  postDate: (postId: string) => `postdate:${postId}`,
  /** The app's sticky comment in that day's post; shared results reply to it. */
  sticky: (date: DayKey) => `sticky:${date}`,
  /** Short-lived counters used as locks: the first caller to increment one wins. */
  lock: (name: string) => `lock:${name}`,
  firstSeen: (date: DayKey, userId: string) => `seen:${date}:${userId}`,
  progress: (date: DayKey, userId: string) => `progress:${date}:${userId}`,
  result: (date: DayKey, userId: string) => `result:${date}:${userId}`,
  user: (userId: string) => `user:${userId}`,
  streaks: (userId: string, year: number) => `streaks:${userId}:${year}`,
  /** userId → adjusted time; lowest first. */
  leaderboard: (date: DayKey) => `lb:${date}`,
  /** tile → count of first drops. No user ids. */
  firstDrops: (date: DayKey) => `first:${date}`,
  /** solves and time buckets. No user ids. */
  stats: (date: DayKey) => `stats:${date}`,
  /** The permalink of this player's shared result for the day (one share per town). */
  shared: (date: DayKey, userId: string) => `shared:${date}:${userId}`,
  rateLimit: (action: string, who: string) => `rl:${action}:${who}`,
} as const;

export const ttlSeconds = {
  generatedTown: 60 * DAY_SECONDS,
  postDate: 400 * DAY_SECONDS,
  sticky: 40 * DAY_SECONDS,
  lock: 120,
  firstSeen: 3 * DAY_SECONDS,
  progress: 3 * DAY_SECONDS,
  result: 30 * DAY_SECONDS,
  /** Rolling: renewed whenever the player opens the game. */
  user: 30 * DAY_SECONDS,
  /** Rolling: renewed on every solve. */
  streaks: 30 * DAY_SECONDS,
  leaderboard: 30 * DAY_SECONDS,
  firstDrops: 60 * DAY_SECONDS,
  stats: 60 * DAY_SECONDS,
  shared: 30 * DAY_SECONDS,
  rateLimit: 3_600,
} as const;

export function expiresIn(seconds: number): Date {
  return new Date(Date.now() + seconds * 1000);
}
