// Devvit Journeys, bridged to Hono. The official router is for Express; this mirrors its five endpoints
// (the client library posts to /api/telemetry/journey/*). Until Reddit allowlists the app, the plugin
// drops events, so every handler answers 200 and never lets analytics break the game.
import { Hono } from 'hono';
import type { Context } from 'hono';
import { telemetry } from '@devvit/analytics/server/reddit';

export const telemetryRoutes = new Hono();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
const text = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.slice(0, 100) : undefined;

const notRecorded = { receipt: { status: 'JOURNEY_RECEIPT_UNSPECIFIED' } };

async function safely(c: Context, send: () => Promise<unknown>) {
  try {
    return c.json(await send());
  } catch (error) {
    console.warn('Journey event not recorded', error);
    return c.json(notRecorded);
  }
}

telemetryRoutes.post('/journey/start', (c) =>
  safely(c, () => telemetry.startJourney())
);

telemetryRoutes.post('/journey/app-ready', (c) =>
  safely(c, () => telemetry.appReady())
);

telemetryRoutes.post('/journey/progress', async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  if (!isRecord(body)) return c.json(notRecorded);
  const journeyId = text(body.journeyId);
  const progress = body.progress;
  if (!journeyId || typeof progress !== 'number' || progress < 0 || progress > 1)
    return c.json(notRecorded);
  return safely(c, () =>
    telemetry.journeyProgress({
      journeyId,
      progress,
      action: text(body.action),
      actionDetails: text(body.actionDetails),
    })
  );
});

telemetryRoutes.post('/journey/interaction', async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  if (!isRecord(body)) return c.json(notRecorded);
  const action = text(body.action);
  if (!action) return c.json(notRecorded);
  return safely(c, () =>
    telemetry.journeyInteraction({
      journeyId: text(body.journeyId) ?? '',
      action,
      actionDetails: text(body.actionDetails) ?? '',
    })
  );
});

/** The client may end a journey it abandons; a solve is ended by the server in /api/submit instead. */
telemetryRoutes.post('/journey/end', async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  if (!isRecord(body)) return c.json(notRecorded);
  const journeyId = text(body.journeyId);
  if (!journeyId) return c.json(notRecorded);
  return safely(c, () =>
    telemetry.endJourney({ journeyId, complete: body.complete === true })
  );
});

/** Ends the player's journey with the server-verified result, so the recorded score can't be faked. */
export async function endJourneyWithSolve(
  journeyId: string | undefined,
  adjustedMs: number
): Promise<void> {
  if (!journeyId) return;
  try {
    await telemetry.endJourney({
      journeyId: journeyId.slice(0, 100),
      complete: true,
      game: { win: true, score: Math.round(adjustedMs / 1000) },
    });
  } catch (error) {
    console.warn('Journey end not recorded', error);
  }
}
