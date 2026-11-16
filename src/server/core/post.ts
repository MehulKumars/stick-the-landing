import { reddit, redis } from '@devvit/web/server';
import { HUB_TITLE, POST_FALLBACK } from '../../shared/reddit-copy.ts';
import { keys } from '../repo/keys.ts';

/**
 * The pinned "Today's town" post. Its post data has no date, so it always shows the current day:
 * this is the link judges open (docs/03-ARCHITECTURE.md §1.2).
 */
export async function createHubPost() {
  const post = await reddit.submitCustomPost({
    title: HUB_TITLE,
    entry: 'default',
    postData: { kind: 'hub' },
    textFallback: { text: POST_FALLBACK },
  });
  await redis.set(keys.hubPostId(), post.id);
  try {
    await post.sticky(1);
  } catch (error) {
    console.warn('Could not pin the hub post', error);
  }
  return post;
}

/** Creates the hub post unless one already exists. Safe to call on every install and upgrade. */
export async function ensureHubPost(): Promise<{
  id: string;
  created: boolean;
}> {
  const storedId = await redis.get(keys.hubPostId());
  if (storedId && storedId.startsWith('t3_')) {
    try {
      const existing = await reddit.getPostById(`t3_${storedId.slice(3)}`);
      if (!existing.removed) return { id: existing.id, created: false };
    } catch {
      // the stored post is gone: make a new one
    }
  }
  const post = await createHubPost();
  return { id: post.id, created: true };
}
