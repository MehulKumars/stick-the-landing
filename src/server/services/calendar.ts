import { redis } from '@devvit/web/server';
import { dayKeyOf, isDayKey, puzzleNumber } from '../../shared/dates.ts';
import type { DayKey } from '../../shared/dates.ts';
import { keys } from '../repo/keys.ts';

export function today(now: Date = new Date()): DayKey {
  return dayKeyOf(now);
}

/** Day No. 1 for this subreddit: the first day the app ran here. Set once, never moved. */
export async function launchDate(): Promise<DayKey> {
  const stored = await redis.get(keys.launchDate());
  if (isDayKey(stored)) return stored;
  await redis.set(keys.launchDate(), today(), { nx: true });
  const settled = await redis.get(keys.launchDate());
  return isDayKey(settled) ? settled : today();
}

export async function numberFor(date: DayKey): Promise<number> {
  return Math.max(1, puzzleNumber(date, await launchDate()));
}
