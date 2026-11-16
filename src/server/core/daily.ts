import { reddit, redis } from '@devvit/web/server';
import type { T3 } from '@devvit/web/shared';
import { addDays, isDayKey } from '../../shared/dates.ts';
import type { DayKey } from '../../shared/dates.ts';
import {
  POST_FALLBACK,
  dailyPostTitle,
  stickyCommentText,
} from '../../shared/reddit-copy.ts';
import { expiresIn, keys, ttlSeconds } from '../repo/keys.ts';
import { numberFor } from '../services/calendar.ts';
import { recapFor } from '../services/community.ts';
import { claim, release } from '../services/limits.ts';
import { townFor } from '../services/puzzles.ts';

function asPostId(value: string | undefined | null): T3 | null {
  return value && value.startsWith('t3_') ? `t3_${value.slice(3)}` : null;
}

export async function dailyPostId(date: DayKey): Promise<T3 | null> {
  return asPostId(await redis.get(keys.dailyPost(date)));
}

/** Which date a daily post belongs to (used when a post is deleted). */
export async function dateOfPost(postId: string): Promise<DayKey | null> {
  const date = await redis.get(keys.postDate(postId));
  return isDayKey(date) ? date : null;
}

/**
 * Makes sure the day's post and its sticky comment exist. Safe to call any number of times, from the
 * hourly job, the install trigger, a mod's menu tap or a share: only the first caller creates anything.
 * Returns null while another caller is still creating the post.
 */
export async function ensureDailyPost(
  date: DayKey
): Promise<{ postId: T3; created: boolean } | null> {
  const existing = await dailyPostId(date);
  if (existing) {
    await ensureStickyComment(date, existing);
    return { postId: existing, created: false };
  }
  if (!(await claim(`post:${date}`))) return null;
  try {
    const again = await dailyPostId(date);
    if (again) return { postId: again, created: false };
    const [entry, number] = await Promise.all([townFor(date), numberFor(date)]);
    const post = await reddit.submitCustomPost({
      title: dailyPostTitle(number, entry.title, date),
      entry: 'default',
      postData: { kind: 'daily', date },
      textFallback: { text: POST_FALLBACK },
    });
    await redis.set(keys.dailyPost(date), post.id);
    await redis.set(keys.postDate(post.id), date, {
      expiration: expiresIn(ttlSeconds.postDate),
    });
    console.log(`Posted town No. ${number} for ${date}: ${post.id}`);
    await ensureStickyComment(date, post.id);
    return { postId: post.id, created: true };
  } finally {
    await release(`post:${date}`);
  }
}

/** The app's distinguished, stickied comment: yesterday's recap and an invitation to share results. */
export async function ensureStickyComment(
  date: DayKey,
  postId: T3
): Promise<string | null> {
  const stored = await redis.get(keys.sticky(date));
  if (stored) return stored;
  if (!(await claim(`sticky:${date}`))) return null;
  try {
    const [entry, number] = await Promise.all([townFor(date), numberFor(date)]);
    const yesterday = addDays(date, -1);
    const recap = (await dailyPostId(yesterday))
      ? await recapFor(yesterday, (await townFor(yesterday)).title)
      : null;
    const comment = await reddit.submitComment({
      id: postId,
      text: stickyCommentText(number, entry.title, recap),
      runAs: 'APP',
    });
    try {
      await comment.distinguish(true);
    } catch (error) {
      console.warn('Could not sticky the daily comment', error);
    }
    await redis.set(keys.sticky(date), comment.id, {
      expiration: expiresIn(ttlSeconds.sticky),
    });
    return comment.id;
  } finally {
    await release(`sticky:${date}`);
  }
}

/** Forgets a deleted post so the hourly job can make a fresh one (for today) instead of pointing at nothing. */
export async function forgetPost(rawId: string): Promise<void> {
  const postId = rawId.startsWith('t3_') ? rawId : `t3_${rawId}`;
  const date = await dateOfPost(postId);
  if (date && (await redis.get(keys.dailyPost(date))) === postId) {
    await redis.del(keys.dailyPost(date), keys.sticky(date));
  }
  await redis.del(keys.postDate(postId));
  if ((await redis.get(keys.hubPostId())) === postId)
    await redis.del(keys.hubPostId());
}
