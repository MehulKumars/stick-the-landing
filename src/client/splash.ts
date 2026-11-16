// The inline splash in the feed: taps only, no drag, no scrolling. Static HTML paints first; the town fills in after.
import './theme.css';
import './splash.css';
import {
  getShareData,
  navigateToPost,
  requestExpandedMode,
} from '@devvit/web/client';
import type { T3 } from '@devvit/web/shared';
import type { InitResponse } from '../shared/api.ts';
import { formatClock, longDate } from '../shared/dates.ts';
import { drawSleepingTown, drawTownPreview } from './art.ts';
import { copy } from './copy.ts';
import { fetchInit } from './net.ts';

function byId<T extends Element>(
  id: string,
  kind: { new (): T; prototype: T }
): T {
  const node = document.getElementById(id);
  if (!(node instanceof kind)) throw new Error(`Missing #${id}`);
  return node;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isPostId(value: string | null | undefined): value is T3 {
  return typeof value === 'string' && value.startsWith('t3_');
}

const play = byId('play', HTMLButtonElement);
const goToday = byId('today', HTMLButtonElement);
const status = byId('status', HTMLParagraphElement);
play.textContent = copy.playToday;
status.textContent = copy.tagline;

// Expanded mode must be requested synchronously inside the trusted click.
play.addEventListener('click', (event) => {
  try {
    requestExpandedMode(event, 'game');
  } catch (error) {
    console.error('Could not open the game', error);
  }
});

/**
 * A friend's challenge arrives as share data on the link. It is untrusted: only a date and a time,
 * shown only when the date matches this post's town, and never a name.
 */
function readChallenge(): { d: string; t: number } | null {
  try {
    const raw = getShareData();
    if (!raw || raw.length > 200) return null;
    const value: unknown = JSON.parse(raw);
    if (
      isRecord(value) &&
      typeof value.d === 'string' &&
      typeof value.t === 'number' &&
      value.t >= 2_000 &&
      value.t < 6 * 3_600_000
    )
      return { d: value.d, t: value.t };
  } catch {
    // no share data, or not ours
  }
  return null;
}

function statusLine(init: InitResponse): string {
  if (init.result)
    return copy.nappedWithStreak(formatClock(init.result.timeMs), init.streak);
  if (init.postKind === 'daily' && !init.isToday)
    return copy.oldPost(init.town.number);
  const challenge = readChallenge();
  if (challenge && challenge.d === init.town.date)
    return copy.friendChallenge(formatClock(challenge.t));
  if (init.isToday && init.streak > 0) return copy.streakSoFar(init.streak);
  return copy.tagline;
}

function drawLevel(level: number): void {
  const box = byId('level', HTMLDivElement);
  box.replaceChildren();
  box.setAttribute('aria-label', copy.difficulty(level));
  box.removeAttribute('aria-hidden');
  const dots = document.createElement('span');
  dots.className = 'dots';
  for (let i = 1; i <= 7; i++) {
    const dot = document.createElement('span');
    if (i <= level) dot.className = 'on';
    dots.appendChild(dot);
  }
  const word = document.createElement('span');
  word.className = 'word';
  word.textContent = copy.difficultyWord(level);
  box.append(word, dots);
}

async function fill(): Promise<void> {
  try {
    const init = await fetchInit();
    const { town } = init;
    byId('town-title', HTMLHeadingElement).textContent = town.title;
    byId('town-date', HTMLParagraphElement).textContent = copy.townNumber(
      town.number,
      longDate(town.date)
    );
    const preview = byId('preview', SVGSVGElement);
    if (init.result)
      drawSleepingTown(preview, town.puzzle, init.result.placements);
    else drawTownPreview(preview, town.puzzle);
    drawLevel(town.level);
    status.textContent = statusLine(init);
    if (init.result) play.textContent = copy.seeYourTown;

    // An old daily post points at today's town first; its own town stays playable.
    const todayPost = init.posts.today ?? init.posts.hub;
    if (init.postKind === 'daily' && !init.isToday && isPostId(todayPost)) {
      goToday.textContent = copy.goToToday;
      goToday.hidden = false;
      goToday.addEventListener('click', () => navigateToPost(todayPost));
      play.className = 'secondary';
      if (!init.result) play.textContent = copy.playAnyway(town.number);
    }
  } catch {
    // The button still opens the game, which shows its own error and a retry.
  }
}

void fill();
