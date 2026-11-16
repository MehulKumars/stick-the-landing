// Text the app writes onto Reddit itself: post titles, the daily sticky comment, shared results and
// problem reports. It lives in shared code because both the server (which posts it) and the client (which
// previews it word for word before the player agrees) need it.
// Status: agent-drafted. A human must review and sign off every line before the feature freeze, with copy.ts.
import { formatClock, WEEKDAY_NAMES, weekdayOf } from './dates.ts';
import type { DayKey } from './dates.ts';

const plural = (n: number, one: string, many: string): string =>
  n === 1 ? one : many;

export const HUB_TITLE = 'Siesta: a new town to put to sleep every day';

export function dailyPostTitle(
  number: number,
  title: string,
  date: DayKey
): string {
  return `Siesta No. ${number}: ${title} (${WEEKDAY_NAMES[weekdayOf(date)]})`;
}

/** What old.reddit.com and other clients without web views show instead of the game. */
export const POST_FALLBACK =
  'Siesta is a daily puzzle: place the houses so every cat naps in the shade and every flower stays in the sun. Open this post in the Reddit app or on new Reddit to play.';

/** Yesterday's real numbers, for the top of today's sticky comment. `null` when there was no yesterday here. */
export type Recap = {
  title: string;
  solvers: number;
  fastestMs: number | null;
};

export function recapLine(recap: Recap): string {
  const { title, solvers, fastestMs } = recap;
  if (solvers === 0)
    return `Nobody put yesterday’s town, ${title}, to sleep. It’s still waiting in yesterday’s post.`;
  if (solvers === 1)
    return fastestMs === null
      ? `Yesterday one napper put ${title} to sleep.`
      : `Yesterday one napper put ${title} to sleep, in ${formatClock(fastestMs)}.`;
  const quickest =
    fastestMs === null ? '' : ` Quickest: ${formatClock(fastestMs)}.`;
  return `Yesterday ${solvers} nappers put ${title} to sleep.${quickest}`;
}

export function stickyCommentText(
  number: number,
  title: string,
  recap: Recap | null
): string {
  const parts = [
    `**Today’s town: No. ${number}, ${title}.**`,
    'Post your result as a reply to this comment (there’s a button for it after you solve), or just say how it went.',
  ];
  if (recap) parts.unshift(recapLine(recap));
  return parts.join('\n\n');
}

/** Everything a shared result may say. No placements: the comment must never spoil the town. */
export type ShareFacts = {
  number: number;
  title: string;
  cats: number;
  timeMs: number;
  hints: number;
  streak: number;
};

function shareTail(facts: ShareFacts): string {
  const hints =
    facts.hints === 0
      ? ''
      : ` with ${facts.hints} ${plural(facts.hints, 'hint', 'hints')}`;
  const streak =
    facts.streak > 1 ? ` Streak: ${facts.streak} days.` : '';
  return `in ${formatClock(facts.timeMs)}${hints}.${streak}`;
}

/** The comment exactly as it is posted from the player's own account. The preview shows this text. */
export function shareText(facts: ShareFacts): string {
  const cats =
    facts.cats === 1 ? 'the cat' : `all ${facts.cats} cats`;
  return `Siesta No. ${facts.number}, ${facts.title}: ${cats} asleep ${shareTail(facts)}`;
}

/**
 * Until Reddit approves the app, comments "as the user" arrive from the app account for everyone but the
 * developer. Then the server rewrites the comment so it still says whose result it is.
 */
export function shareTextFromApp(facts: ShareFacts, username: string): string {
  return `u/${username} put ${facts.title} (Siesta No. ${facts.number}) to sleep ${shareTail(facts)}`;
}

/** Fixed report categories: no free text, so nothing needs moderating in the report itself. */
export const REPORT_CATEGORIES = [
  { value: 'unsolvable', label: 'This town can’t be solved' },
  { value: 'broken', label: 'Something looks broken' },
  { value: 'slow', label: 'The game is slow or won’t load' },
  { value: 'other', label: 'Something else' },
] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number]['value'];

export function isReportCategory(value: unknown): value is ReportCategory {
  return REPORT_CATEGORIES.some((c) => c.value === value);
}

/** The modmail notification mods receive. The reporter stays anonymous. */
export function reportModmail(
  category: ReportCategory,
  town: { number: number; title: string; date: DayKey },
  postId: string | null,
  appVersion: string
): { subject: string; body: string } {
  const label =
    REPORT_CATEGORIES.find((c) => c.value === category)?.label ?? category;
  const lines = [
    `A player used “Report a problem” in Siesta.`,
    `**Problem:** ${label}`,
    `**Town:** No. ${town.number}, ${town.title} (${town.date})`,
  ];
  if (postId) lines.push(`**Post:** https://www.reddit.com/comments/${postId.replace(/^t3_/, '')}`);
  lines.push(`**App version:** ${appVersion}`);
  return { subject: `Siesta problem report: ${label}`, body: lines.join('\n\n') };
}
