import { redis } from '@devvit/web/server';
import type { Community, SolveRecord } from '../../shared/api.ts';
import {
  crowdLine,
  firstsFromHash,
  leaderboardScore,
  timeBucket,
} from '../../shared/community.ts';
import type { DayKey } from '../../shared/dates.ts';
import type { Recap } from '../../shared/reddit-copy.ts';
import { keys, ttlSeconds } from '../repo/keys.ts';

/**
 * Counts a verified first solve: the leaderboard (user ids, 30 days), first drops and stats
 * (counts only, no user ids). Called once per player and town.
 */
export async function recordSolve(
  date: DayKey,
  userId: string,
  record: SolveRecord
): Promise<void> {
  const board = keys.leaderboard(date);
  const firsts = keys.firstDrops(date);
  const stats = keys.stats(date);
  await redis.zAdd(board, {
    member: userId,
    score: leaderboardScore(record.adjustedMs, record.solvedAt, date),
  });
  if (record.firstTile !== null)
    await redis.hIncrBy(firsts, String(record.firstTile), 1);
  await redis.hIncrBy(stats, 'solves', 1);
  if (record.hints === 0) await redis.hIncrBy(stats, 'cleanNaps', 1);
  await redis.hIncrBy(stats, timeBucket(record.adjustedMs), 1);
  await Promise.all([
    redis.expire(board, ttlSeconds.leaderboard),
    redis.expire(firsts, ttlSeconds.firstDrops),
    redis.expire(stats, ttlSeconds.stats),
  ]);
}

/** What the community did with this town. Only call this for a player who has solved it. */
export async function communityFor(
  date: DayKey,
  userId: string | null,
  tiles: number,
  myFirstTile: number | null
): Promise<Community> {
  const board = keys.leaderboard(date);
  const [solvers, rank, firstHash] = await Promise.all([
    redis.zCard(board),
    userId ? redis.zRank(board, userId) : Promise.resolve(undefined),
    redis.hGetAll(keys.firstDrops(date)),
  ]);
  const firsts = firstsFromHash(firstHash, tiles);
  const sameStart = myFirstTile === null ? null : (firsts[myFirstTile] ?? 0);
  return {
    solvers,
    rank: rank === undefined ? null : rank + 1,
    firsts,
    line: crowdLine(solvers, sameStart),
  };
}

/** Yesterday's real numbers for the sticky comment. */
export async function recapFor(date: DayKey, title: string): Promise<Recap> {
  const board = keys.leaderboard(date);
  const [solvers, fastest] = await Promise.all([
    redis.zCard(board),
    redis.zRange(board, 0, 0, { by: 'rank' }),
  ]);
  const top = fastest[0];
  return {
    title,
    solvers,
    fastestMs: top ? Math.floor(top.score) : null,
  };
}
