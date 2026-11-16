import { Hono } from 'hono';
import type {
  OnAppInstallRequest,
  OnAppUpgradeRequest,
  OnPostDeleteRequest,
  TriggerResponse,
} from '@devvit/web/shared';
import { context } from '@devvit/web/server';
import { ensureDailyPost, forgetPost } from '../core/daily.ts';
import { ensureHubPost } from '../core/post.ts';
import { launchDate, today } from '../services/calendar.ts';

export const triggers = new Hono();

/** Install and upgrade both make sure day No. 1 is recorded and the hub and today's posts exist. */
type SetupResult = TriggerResponse & { ok: boolean; message: string };

async function setUp(trigger: string): Promise<SetupResult> {
  try {
    const launch = await launchDate();
    const hub = await ensureHubPost();
    const daily = await ensureDailyPost(today());
    return {
      ok: true,
      message: `${trigger}: hub ${hub.id} ${hub.created ? 'created' : 'kept'}, today's post ${daily?.postId ?? 'in progress'} in r/${context.subredditName}; town No. 1 is ${launch}`,
    };
  } catch (error) {
    console.error(`${trigger} setup failed`, error);
    return { ok: false, message: 'Failed to set up the app' };
  }
}

triggers.post('/on-app-install', async (c) => {
  const input = await c.req.json<OnAppInstallRequest>();
  const result = await setUp(input.type ?? 'install');
  return c.json<TriggerResponse>(result, result.ok ? 200 : 400);
});

triggers.post('/on-app-upgrade', async (c) => {
  const input = await c.req.json<OnAppUpgradeRequest>();
  const result = await setUp(input.type ?? 'upgrade');
  return c.json<TriggerResponse>(result, result.ok ? 200 : 400);
});

/** A deleted hub or daily post is forgotten, so the hourly job replaces today's instead of linking to nothing. */
triggers.post('/on-post-delete', async (c) => {
  try {
    const input = await c.req.json<OnPostDeleteRequest>();
    if (input.postId) await forgetPost(input.postId);
  } catch (error) {
    console.error('post-delete cleanup failed', error);
  }
  return c.json<TriggerResponse>({}, 200);
});
