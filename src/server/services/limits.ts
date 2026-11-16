import { redis } from '@devvit/web/server';
import { keys, ttlSeconds } from '../repo/keys.ts';

/**
 * A short lock built on an atomic counter: the first caller gets 1 and wins. Used so two scheduler runs
 * (or a run and a mod's menu tap) can't create the same post twice. Released early by `release`.
 */
export async function claim(name: string): Promise<boolean> {
  const key = keys.lock(name);
  const count = await redis.incrBy(key, 1);
  await redis.expire(key, ttlSeconds.lock);
  return count === 1;
}

export async function release(name: string): Promise<void> {
  await redis.del(keys.lock(name));
}

/** Allows `perHour` uses of an action per person per hour. */
export async function withinLimit(
  action: string,
  who: string,
  perHour: number
): Promise<boolean> {
  const key = keys.rateLimit(action, who);
  const count = await redis.incrBy(key, 1);
  if (count === 1) await redis.expire(key, ttlSeconds.rateLimit);
  return count <= perHour;
}
