import type {
  InitResponse,
  ProgressRequest,
  ReportRequest,
  SettingsRequest,
  ShareRequest,
  ShareResponse,
  SubmitRequest,
  SubmitResponse,
} from '../shared/api.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isInit(value: unknown): value is InitResponse {
  return isRecord(value) && value.type === 'init' && isRecord(value.town);
}

function isSubmit(value: unknown): value is SubmitResponse {
  return isRecord(value) && value.type === 'submit' && isRecord(value.result);
}

function errorMessage(value: unknown, status: number): string {
  return isRecord(value) && typeof value.message === 'string'
    ? value.message
    : `Request failed (${status})`;
}

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchInit(): Promise<InitResponse> {
  const res = await fetch('/api/init');
  const body = await readJson(res);
  if (!res.ok || !isInit(body)) throw new Error(errorMessage(body, res.status));
  return body;
}

export async function sendProgress(request: ProgressRequest): Promise<void> {
  await fetch('/api/progress', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
  });
}

export class RejectedError extends Error {}

/** Retries network failures with backoff; a server rejection (4xx) is final. */
export async function submitSolve(
  request: SubmitRequest,
  extraHeaders: Record<string, string> = {},
  attempts = 3
): Promise<SubmitResponse> {
  let lastError: unknown = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...extraHeaders },
        body: JSON.stringify(request),
      });
      const body = await readJson(res);
      if (res.ok && isSubmit(body)) return body;
      if (res.status >= 400 && res.status < 500)
        throw new RejectedError(errorMessage(body, res.status));
      lastError = new Error(errorMessage(body, res.status));
    } catch (error) {
      if (error instanceof RejectedError) throw error;
      lastError = error;
    }
    await new Promise((r) => setTimeout(r, 600 * 2 ** i));
  }
  throw lastError instanceof Error
    ? lastError
    : new Error('Could not reach the server');
}

async function postJson(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await readJson(res);
  if (!res.ok) throw new Error(errorMessage(json, res.status));
  return json;
}

function isShare(value: unknown): value is ShareResponse {
  return (
    isRecord(value) &&
    value.type === 'share' &&
    typeof value.permalink === 'string'
  );
}

/** Posts the player's result as their comment. Only called from the "Post as u/…" button. */
export async function shareResult(request: ShareRequest): Promise<ShareResponse> {
  const body = await postJson('/api/share', request);
  if (!isShare(body)) throw new Error('Reddit didn’t take the comment.');
  return body;
}

/** Joins the subreddit. Only called from the "Join" button. */
export async function joinSubreddit(): Promise<void> {
  await postJson('/api/subscribe', {});
}

export async function sendReport(request: ReportRequest): Promise<void> {
  await postJson('/api/report', request);
}

export async function sendSettings(request: SettingsRequest): Promise<void> {
  try {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request),
    });
  } catch {
    // settings are a convenience; the local copy still applies this session
  }
}
