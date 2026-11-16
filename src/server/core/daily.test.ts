// The daily post must appear exactly once however many times the job (or a mod, or a share) asks for it.
// Redis and the Reddit API are replaced with small in-memory fakes (no lists or sets, like Devvit's Redis).
import { mock, test } from 'node:test';
import assert from 'node:assert/strict';

type ZMember = { member: string; score: number };

const strings = new Map<string, string>();
const zsets = new Map<string, ZMember[]>();
const posts: { id: string; title: string; postData: unknown }[] = [];
const comments: { id: string; parent: string; text: string; sticky: boolean }[] = [];

const fakeRedis = {
  async get(key: string) {
    return strings.get(key);
  },
  async set(key: string, value: string, options?: { nx?: boolean }) {
    if (options?.nx && strings.has(key)) return '';
    strings.set(key, value);
    return 'OK';
  },
  async del(...keys: string[]) {
    for (const k of keys) {
      strings.delete(k);
      zsets.delete(k);
    }
  },
  async incrBy(key: string, value: number) {
    const next = Number(strings.get(key) ?? 0) + value;
    strings.set(key, String(next));
    return next;
  },
  async expire() {},
  async zCard(key: string) {
    return zsets.get(key)?.length ?? 0;
  },
  async zRange(key: string, start: number, stop: number) {
    const sorted = [...(zsets.get(key) ?? [])].sort((a, b) => a.score - b.score);
    return sorted.slice(start, stop + 1);
  },
  async hGetAll() {
    return {};
  },
};

const fakeReddit = {
  async submitCustomPost(options: { title: string; postData: unknown }) {
    const post = { id: `t3_p${posts.length + 1}`, ...options };
    posts.push(post);
    return post;
  },
  async submitComment(options: { id: string; text: string }) {
    const comment = {
      id: `t1_c${comments.length + 1}`,
      parent: options.id,
      text: options.text,
      sticky: false,
    };
    comments.push(comment);
    return {
      id: comment.id,
      async distinguish(sticky?: boolean) {
        comment.sticky = Boolean(sticky);
      },
    };
  },
};

mock.module('@devvit/web/server', {
  namedExports: { redis: fakeRedis, reddit: fakeReddit },
});
mock.module('../services/puzzles.ts', {
  namedExports: {
    townFor: async (date: string) => ({
      date,
      title: date === '2026-12-13' ? 'Hilltop Market' : 'Little Harbour',
    }),
  },
});
mock.module('../services/calendar.ts', {
  namedExports: {
    numberFor: async (date: string) => (date === '2026-12-13' ? 13 : 14),
    today: () => '2026-12-14',
  },
});

const { ensureDailyPost, forgetPost } = await import('./daily.ts');

test('the daily post and its sticky comment are made once, however often the job runs', async () => {
  // Yesterday had a post and two solvers, so today's comment opens with a real recap.
  strings.set('post:2026-12-13', 't3_old');
  zsets.set('lb:2026-12-13', [
    { member: 't2_a', score: 95_000.1 },
    { member: 't2_b', score: 58_000.2 },
  ]);

  const runs = await Promise.all([
    ensureDailyPost('2026-12-14'),
    ensureDailyPost('2026-12-14'),
  ]);
  await ensureDailyPost('2026-12-14');
  await ensureDailyPost('2026-12-14');

  assert.equal(posts.length, 1);
  assert.equal(posts[0]?.title, 'Siesta No. 14: Little Harbour (Monday)');
  assert.deepEqual(posts[0]?.postData, { kind: 'daily', date: '2026-12-14' });
  assert.equal(comments.length, 1);
  assert.equal(comments[0]?.parent, 't3_p1');
  assert.equal(comments[0]?.sticky, true);
  assert.ok(
    comments[0]?.text.startsWith(
      'Yesterday 2 nappers put Hilltop Market to sleep. Quickest: 0:58.'
    )
  );
  assert.equal(strings.get('post:2026-12-14'), 't3_p1');
  assert.equal(strings.get('sticky:2026-12-14'), 't1_c1');
  // One caller made it; the one that lost the race either waited it out or reported it in progress.
  assert.equal(runs.filter((r) => r?.created).length, 1);
});

test('a missing sticky comment is put back on the next run', async () => {
  strings.delete('sticky:2026-12-14');
  const run = await ensureDailyPost('2026-12-14');
  assert.equal(run?.created, false);
  assert.equal(posts.length, 1);
  assert.equal(comments.length, 2);
  assert.equal(strings.get('sticky:2026-12-14'), 't1_c2');
});

test('a deleted daily post is forgotten, so the next run makes a new one', async () => {
  await forgetPost('p1'); // trigger payloads may omit the t3_ prefix
  assert.equal(strings.get('post:2026-12-14'), undefined);
  assert.equal(strings.get('sticky:2026-12-14'), undefined);
  const run = await ensureDailyPost('2026-12-14');
  assert.equal(run?.created, true);
  assert.equal(posts.length, 2);
});
