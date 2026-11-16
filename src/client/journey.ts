// Devvit Journeys (docs/04-GAME-SPEC.md A11), behind a wrapper that never throws and stays silent until
// the player's first committed action. Reddit drops these events until the app is allowlisted; that's fine.
import { telemetry } from '@devvit/analytics/client/reddit';

const MAX_PROGRESS_EVENTS = 10;
const THROTTLE_MS: Record<string, number> = { time_toggle: 10_000 };

let started: Promise<void> | null = null;
let bestProgress = 0;
let progressEvents = 0;
const lastSent = new Map<string, number>();

function quietly(send: () => Promise<unknown>): void {
  void send().catch(() => {
    // analytics must never get in the way of the game
  });
}

/** Board is drawn and interactive. Not a page view: called once the player can act. */
export function appReady(): void {
  quietly(() => telemetry.appReady());
}

/**
 * Starts the journey on the first real action (a drop or a time switch). Every other event waits for
 * this, because progress() and interaction() would otherwise start a journey on their own.
 */
export function startJourney(): void {
  if (started) return;
  started = telemetry
    .startJourney()
    .then(() => undefined)
    .catch(() => undefined);
}

function afterStart(send: () => Promise<unknown>): void {
  if (!started) return;
  void started.then(() => quietly(send));
}

/** Fraction of cats asleep and flowers lit; sent only when it improves, at most ten times a session. */
export function progress(fraction: number): void {
  if (fraction <= bestProgress || progressEvents >= MAX_PROGRESS_EVENTS) return;
  bestProgress = fraction;
  progressEvents++;
  afterStart(() => telemetry.progress({ progress: Math.min(1, fraction) }));
}

export function interaction(action: string, actionDetails?: string): void {
  const wait = THROTTLE_MS[action] ?? 0;
  const now = Date.now();
  if (wait && now - (lastSent.get(action) ?? 0) < wait) return;
  lastSent.set(action, now);
  afterStart(() =>
    telemetry.interaction(actionDetails ? { action, actionDetails } : { action })
  );
}

/** Sent with /api/submit so the server can end the journey with the verified score. */
export function journeyHeaders(): Record<string, string> {
  try {
    const id = telemetry.getActiveJourneyId();
    return id ? { 'x-devvit-journey-id': id } : {};
  } catch {
    return {};
  }
}
