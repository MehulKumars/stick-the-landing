import { Hono } from 'hono';
import { context, reddit, redis } from '@devvit/web/server';
import {
  isProgressRequest,
  isReportRequest,
  isSettingsRequest,
  isShareRequest,
  isSubmitRequest,
} from '../../shared/api.ts';
import type {
  Community,
  ErrorResponse,
  InitResponse,
  OkResponse,
  PostKind,
  PostLinks,
  SavedProgress,
  ShareResponse,
  SolveRecord,
  SubmitResponse,
} from '../../shared/api.ts';
import { addDays, isDayKey, msUntilNextDay } from '../../shared/dates.ts';
import type { DayKey } from '../../shared/dates.ts';
import { dailyPostId } from '../core/daily.ts';
import { keys } from '../repo/keys.ts';
import { numberFor, today } from '../services/calendar.ts';
import { communityFor, recordSolve } from '../services/community.ts';
import { publicTown, townFor } from '../services/puzzles.ts';
import {
  firstSeenAt,
  getProgress,
  getResult,
  judgeSolve,
  markFirstSeen,
  saveProgress,
  saveResult,
} from '../services/results.ts';
import { defaultSettings, getPlayer, saveSettings } from '../services/settings.ts';
import type { Player } from '../services/settings.ts';
import { Refused, joinSubreddit, reportProblem, shareResult } from '../services/share.ts';
import { markSolvedDay, recordPlayerTotals, streakFor } from '../services/streaks.ts';
import { endJourneyWithSolve } from './telemetry.ts';

export const api = new Hono();

/** Daily posts carry their date; the pinned hub post (or a post without data) always shows today. */
function postTarget(): { kind: PostKind; date: DayKey } {
  const data = context.postData;
  const date = data?.date;
  if (data?.kind === 'daily' && isDayKey(date)) return { kind: 'daily', date };
  return { kind: 'hub', date: today() };
}

const fail = (message: string): ErrorResponse => ({ type: 'error', message });

async function postLinks(kind: PostKind, date: DayKey): Promise<PostLinks> {
  const now = today();
  const [todayPost, yesterdayPost, thisTown, hub] = await Promise.all([
    dailyPostId(now),
    dailyPostId(addDays(now, -1)),
    kind === 'daily' && context.postId ? Promise.resolve(context.postId) : dailyPostId(date),
    redis.get(keys.hubPostId()),
  ]);
  return { today: todayPost, yesterday: yesterdayPost, thisTown, hub: hub ?? null };
}

api.get('/init', async (c) => {
  try {
    const { kind, date } = postTarget();
    const userId = context.userId;
    const [entry, number, username, posts] = await Promise.all([
      townFor(date),
      numberFor(date),
      reddit.getCurrentUsername(),
      postLinks(kind, date),
    ]);
    let progress: SavedProgress | null = null;
    let result: SolveRecord | null = null;
    let player: Player = { settings: defaultSettings, joined: false };
    let streak = 0;
    let sharedPermalink: string | null = null;
    if (userId) {
      [progress, result, player, streak, sharedPermalink] = await Promise.all([
        getProgress(date, userId),
        getResult(date, userId),
        getPlayer(userId),
        streakFor(userId, today()),
        redis.get(keys.shared(date, userId)).then((v) => v ?? null),
      ]);
      if (!result) await markFirstSeen(date, userId);
    }
    const tiles = entry.puzzle.size * entry.puzzle.size;
    const community: Community | null = result
      ? await communityFor(date, userId ?? null, tiles, result.firstTile)
      : null;
    return c.json<InitResponse>({
      type: 'init',
      town: publicTown(entry, number),
      postKind: kind,
      isToday: date === today(),
      today: today(),
      msUntilNext: msUntilNextDay(new Date()),
      user: { loggedIn: Boolean(userId), username: username ?? null },
      settings: player.settings,
      progress,
      result,
      streak,
      community,
      posts,
      subredditName: context.subredditName,
      joined: player.joined,
      sharedPermalink,
    });
  } catch (error) {
    console.error('init failed', error);
    return c.json(fail('Could not load the town.'), 500);
  }
});

api.post('/progress', async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  if (!isProgressRequest(body) || !isDayKey(body.date))
    return c.json(fail('Bad progress.'), 400);
  const userId = context.userId;
  if (!userId) return c.json<OkResponse>({ type: 'ok' });
  const entry = await townFor(body.date);
  const saved = await saveProgress(
    body.date,
    userId,
    entry.puzzle,
    body.placements,
    body.timeMs,
    body.firstTile
  );
  return saved
    ? c.json<OkResponse>({ type: 'ok' })
    : c.json(fail('Those houses don’t fit there.'), 400);
});

api.post('/submit', async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  if (!isSubmitRequest(body) || !isDayKey(body.date))
    return c.json(fail('Bad submission.'), 400);
  try {
    const date = body.date;
    const entry = await townFor(date);
    const tiles = entry.puzzle.size * entry.puzzle.size;
    const userId = context.userId;
    const [seen, progress] = userId
      ? await Promise.all([firstSeenAt(date, userId), getProgress(date, userId)])
      : [null, null];
    const verdict = await judgeSolve(
      entry.puzzle,
      body,
      seen,
      progress?.firstTile ?? null
    );
    if (!verdict.ok) return c.json(fail(verdict.message), 400);
    await endJourneyWithSolve(c.req.header('x-devvit-journey-id'), verdict.record.adjustedMs);
    if (!userId) {
      return c.json<SubmitResponse>({
        type: 'submit',
        result: verdict.record,
        saved: false,
        streak: 0,
        community: await communityFor(date, null, tiles, verdict.record.firstTile),
      });
    }
    const now = today();
    const { record, isNew } = await saveResult(date, userId, verdict.record);
    if (isNew) {
      await markSolvedDay(userId, date, now);
      await recordSolve(date, userId, record);
    }
    const streak = await streakFor(userId, now);
    if (isNew) await recordPlayerTotals(userId, streak);
    return c.json<SubmitResponse>({
      type: 'submit',
      result: record,
      saved: true,
      streak,
      community: await communityFor(date, userId, tiles, record.firstTile),
    });
  } catch (error) {
    console.error('submit failed', error);
    return c.json(fail('Could not save your result. Try again in a moment.'), 500);
  }
});

api.post('/settings', async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  if (!isSettingsRequest(body)) return c.json(fail('Bad settings.'), 400);
  const userId = context.userId;
  if (userId) await saveSettings(userId, body);
  return c.json<OkResponse>({ type: 'ok' });
});

/** "Post my result": only ever from the player's explicit button press. */
api.post('/share', async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  if (!isShareRequest(body) || !isDayKey(body.date))
    return c.json(fail('Bad request.'), 400);
  const userId = context.userId;
  const username = await reddit.getCurrentUsername();
  if (!userId || !username) return c.json(fail('Log in to post your result.'), 401);
  try {
    return c.json<ShareResponse>(await shareResult(body.date, userId, username));
  } catch (error) {
    if (error instanceof Refused) return c.json(fail(error.message), 400);
    console.error('share failed', error);
    return c.json(fail('Reddit didn’t take the comment. Try again in a moment.'), 500);
  }
});

/** "Join": only ever from the player's explicit button press. */
api.post('/subscribe', async (c) => {
  const userId = context.userId;
  if (!userId) return c.json(fail('Log in to join.'), 401);
  try {
    await joinSubreddit(userId);
    return c.json<OkResponse>({ type: 'ok' });
  } catch (error) {
    console.error('subscribe failed', error);
    return c.json(fail('Couldn’t join right now. Try again in a moment.'), 500);
  }
});

api.post('/report', async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  if (!isReportRequest(body) || !isDayKey(body.date))
    return c.json(fail('Bad report.'), 400);
  const who = context.userId ?? context.loid ?? 'someone';
  try {
    await reportProblem(body.category, body.date, who);
    return c.json<OkResponse>({ type: 'ok' });
  } catch (error) {
    if (error instanceof Refused) return c.json(fail(error.message), 400);
    console.error('report failed', error);
    return c.json(fail('Couldn’t send the report. Try again in a moment.'), 500);
  }
});
