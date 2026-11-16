import { Hono } from 'hono';
import { ensureDailyPost } from '../core/daily.ts';
import { ensureHubPost } from '../core/post.ts';
import { today } from '../services/calendar.ts';

export const scheduler = new Hono();

/**
 * Runs every 15 minutes. Today's (UTC) post and sticky comment are made by whichever run comes first
 * after midnight; every other run finds them and does nothing. The cron timezone doesn't matter.
 */
scheduler.post('/ensure-daily-post', async (c) => {
  try {
    const hub = await ensureHubPost();
    const post = await ensureDailyPost(today());
    // One line per run (96 a day) so a missing post is easy to spot in `devvit logs`.
    console.log(
      `ensure-daily-post ${today()}: ${post ? `${post.postId} ${post.created ? 'created' : 'kept'}` : 'another run is creating it'}; hub ${hub.id} ${hub.created ? 'created' : 'kept'}`
    );
  } catch (error) {
    console.error('ensure-daily-post failed', error);
  }
  return c.json({});
});
