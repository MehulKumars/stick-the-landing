import { context, reddit, redis } from '@devvit/web/server';
import type { T1 } from '@devvit/web/shared';
import type { ShareResponse } from '../../shared/api.ts';
import type { DayKey } from '../../shared/dates.ts';
import {
  isReportCategory,
  reportModmail,
  shareText,
  shareTextFromApp,
} from '../../shared/reddit-copy.ts';
import type { ReportCategory, ShareFacts } from '../../shared/reddit-copy.ts';
import { dailyPostId, ensureDailyPost, ensureStickyComment } from '../core/daily.ts';
import { expiresIn, keys, ttlSeconds } from '../repo/keys.ts';
import { numberFor, today } from './calendar.ts';
import { withinLimit } from './limits.ts';
import { townFor } from './puzzles.ts';
import { getResult } from './results.ts';
import { streakFor } from './streaks.ts';

/** A request the player made that we turn down with a message they can read. */
export class Refused extends Error {}

function asCommentId(value: string | null | undefined): T1 | null {
  return value && value.startsWith('t1_') ? `t1_${value.slice(3)}` : null;
}

/** The facts a shared result may mention. The streak only shows on the day itself. */
export async function shareFacts(
  date: DayKey,
  userId: string
): Promise<ShareFacts | null> {
  const result = await getResult(date, userId);
  if (!result) return null;
  const isToday = date === today();
  const [entry, number, streak] = await Promise.all([
    townFor(date),
    numberFor(date),
    isToday ? streakFor(userId, date) : Promise.resolve(0),
  ]);
  return {
    number,
    title: entry.title,
    cats: entry.puzzle.cats.length,
    timeMs: result.timeMs,
    hints: result.hints,
    streak,
  };
}

/** The day's sticky comment, creating today's post and comment if the hourly job hasn't yet. */
async function stickyFor(date: DayKey): Promise<T1 | null> {
  const stored = asCommentId(await redis.get(keys.sticky(date)));
  if (stored) return stored;
  if (date === today()) {
    const post = await ensureDailyPost(date);
    if (!post) return null;
    return asCommentId(await redis.get(keys.sticky(date)));
  }
  const postId = await dailyPostId(date);
  return postId ? asCommentId(await ensureStickyComment(date, postId)) : null;
}

/**
 * Posts the player's result as a reply to the day's sticky comment, from their own account. Only ever
 * called from an explicit "Post my result" press. One share per player and town.
 */
export async function shareResult(
  date: DayKey,
  userId: string,
  username: string
): Promise<ShareResponse> {
  const done = await redis.get(keys.shared(date, userId));
  if (done) return { type: 'share', permalink: done, postedByApp: false };
  const facts = await shareFacts(date, userId);
  if (!facts) throw new Refused('Solve the town first.');
  if (!(await withinLimit('share', userId, 5)))
    throw new Refused('That’s a lot of posting. Try again in a while.');
  const sticky = await stickyFor(date);
  if (!sticky)
    throw new Refused('That day’s comments aren’t open. Try again in a minute.');
  const comment = await reddit.submitComment({
    id: sticky,
    text: shareText(facts),
    runAs: 'USER',
  });
  // Until Reddit approves the app, "as the user" comes from the app account for everyone but the developer.
  const postedByApp =
    comment.authorName.toLowerCase() !== username.toLowerCase();
  if (postedByApp) {
    try {
      await comment.edit({ text: shareTextFromApp(facts, username) });
    } catch (error) {
      console.warn('Could not add the player’s name to an app-posted result', error);
    }
  }
  const permalink = `https://www.reddit.com${comment.permalink}`;
  await redis.set(keys.shared(date, userId), permalink, {
    expiration: expiresIn(ttlSeconds.shared),
  });
  return { type: 'share', permalink, postedByApp };
}

/** Subscribes the player to this subreddit (an explicit "Join" press) and remembers the press. */
export async function joinSubreddit(userId: string): Promise<void> {
  await reddit.subscribeToCurrentSubreddit();
  const key = keys.user(userId);
  await redis.hSet(key, { joined: '1' });
  await redis.expire(key, ttlSeconds.user);
}

/** Sends a problem report to the subreddit's modmail. The reporter stays anonymous; categories are fixed. */
export async function reportProblem(
  category: ReportCategory,
  date: DayKey,
  who: string
): Promise<void> {
  if (!isReportCategory(category)) throw new Refused('Pick a problem from the list.');
  if (!(await withinLimit('report', who, 5)))
    throw new Refused('Thanks, we already have your reports.');
  const [entry, number] = await Promise.all([townFor(date), numberFor(date)]);
  const mail = reportModmail(
    category,
    { number, title: entry.title, date },
    context.postId ?? null,
    context.appVersion
  );
  await reddit.modMail.createModNotification({
    subject: mail.subject,
    bodyMarkdown: mail.body,
    subredditId: context.subredditId,
  });
}
