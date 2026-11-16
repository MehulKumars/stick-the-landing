import { Hono } from 'hono';
import type { UiResponse } from '@devvit/web/shared';
import { context } from '@devvit/web/server';
import { ensureDailyPost } from '../core/daily.ts';
import { createHubPost } from '../core/post.ts';
import { today } from '../services/calendar.ts';

export const menu = new Hono();

const postUrl = (postId: string) =>
  `https://reddit.com/r/${context.subredditName}/comments/${postId.replace(/^t3_/, '')}`;

menu.post('/create-hub', async (c) => {
  try {
    const post = await createHubPost();
    return c.json<UiResponse>({ navigateTo: postUrl(post.id) }, 200);
  } catch (error) {
    console.error('Could not create the hub post', error);
    return c.json<UiResponse>({ showToast: 'Could not create the post' }, 400);
  }
});

/** The same idempotent function the scheduler runs: makes today's post if it's missing, then opens it. */
menu.post('/post-today', async (c) => {
  try {
    const post = await ensureDailyPost(today());
    if (!post)
      return c.json<UiResponse>({ showToast: 'Today’s post is being made. Try again in a minute.' }, 200);
    return c.json<UiResponse>({ navigateTo: postUrl(post.postId) }, 200);
  } catch (error) {
    console.error('Could not make today’s post', error);
    return c.json<UiResponse>({ showToast: 'Could not make today’s post' }, 400);
  }
});
