# 02 — Devvit platform reference (Devvit Web)

> ⚠️ Collected from developers.reddit.com/docs on 2026-11-15. **APIs change.** Verify every call with the
> Devvit MCP server or the live docs before relying on it. Where this file is wrong, fix it and log it in DECISIONS.md.
>
> **Checked against the live docs on 2026-11-15:** Devvit Web overview, devvit.json configuration, view modes and
> entry points, launch screen customization, post data, navigation, Redis, scheduler, Devvit Journeys, adding
> streaks, notifications, logged-out players, scroll traps, feature guide and Devvit Rules. Items marked ✅ were
> confirmed there; anything else is still "verify before use".

## 1. What Devvit Web is

A normal web app with three parts, hosted entirely by Reddit:

- **Client** (`src/client`): HTML/CSS/JS in a webview inside the post. Client SDK: `@devvit/web/client`
  (toasts, forms, navigation, `requestExpandedMode`).
- **Server** (`src/server`): a Node server (the templates ship Express or Hono) exposing `/api/*` for
  the client and `/internal/*` for platform callbacks (scheduler, triggers, menu items, forms). Server SDK:
  `@devvit/web/server` (`redis`, `reddit`, `context`, `scheduler`, …).
- **Config:** `devvit.json` holds the app name, permissions, post entry points, scheduler tasks,
  triggers and menu items. The schema is self-documenting: https://developers.reddit.com/schema/config-file.v1.json

**Limits ✅:** server call max **30 s**; request payload max **4 MB**; response max **10 MB**; HTML/CSS/JS only.
- The server is **serverless**: it runs per request. No websockets, no streaming or chunked responses, no `fs`,
  no native packages. Long-polling only if it finishes inside 30 s.
- **The client can't make external requests.** A CSP locks everything to the webview's own domain, so bundle all
  fonts, images and sounds. **Images hosted elsewhere (including snoovatar URLs) may be blocked. Test before designing around them.**
- **localStorage is wiped on every app version** (the iframe URL changes per version). Use Redis for anything that must survive an update.
- Client-callable endpoints start with `/api/`. Platform callbacks (scheduler, triggers, menu, forms) use `/internal/`.

**Setup:** Node 24+ (template engines field) → `npm create devvit@latest --template=<react|phaser|threejs>` (or pick a template at
developers.reddit.com/new) → follow the wizard (Reddit login) → `npm run dev` starts a **playtest** on a
test subreddit (backend calls only work in playtest, not purely locally) → `npm run deploy` uploads a version.
**Never `devvit publish` during the hackathon.**

## 2. Interactive posts, view modes, entry points

- **Inline mode:** the app's webview loads directly in the post unit (feed or post page). It must load fast,
  respond only to taps/clicks, and respect the post's bounds. This is our **launch/start screen**.
- **Expanded mode:** a larger, full-screen view for immersive play. This is our **game screen**.
- **Entry points** = one HTML file per context, declared in `devvit.json`. Typical:

```jsonc
// devvit.json (excerpt). VERIFY the current shape against the schema.
{
  "post": {
    "dir": "dist/client",
    "entrypoints": {
      "default": { "entry": "splash.html", "height": "regular" },
      "game":    { "entry": "game.html",   "height": "tall" }
    }
  }
}
```

```ts
// client: go from the inline splash to the expanded game ✅
// Must be called SYNCHRONOUSLY inside a trusted click handler (no await before it).
import { requestExpandedMode, getWebViewMode, exitExpandedMode } from '@devvit/web/client';
requestExpandedMode(event.nativeEvent, 'game');
// Devvit 0.15: optional title, and it can switch entries while already expanded:
requestExpandedMode(event.nativeEvent, 'builder', { title: 'Town Builder' });
getWebViewMode(); // 'inline' | 'expanded'. Listen to window 'focus' to notice a return to inline.
```

**Inline-mode requirements for approval and featuring ✅** (view modes page):
- Initial content in **under 1 second**; **Lighthouse mobile score above 80** (open the webview element in its own
  tab and run Lighthouse there).
- **Only tap or click input.** No scroll traps, no scroll hijacking, no zoom or pan interference. Users must be able to
  scroll past the post. "Scrolling within inline webviews is prohibited" (feature guide).
- Expanded mode is **user-initiated only**: no auto-launch or auto-close.
- Sound: no audio before a user interaction, a mute button, and mute on `visibilitychange` when the user scrolls away.
- With the Devvit Vite plugin (`@devvit/start/vite`), `entry` values point at the source HTML (e.g.
  `src/client/splash.html`) and the plugin builds them into `dist/client`. The template sets this up.

```ts
// server: create an interactive post that opens on the default entry
import { reddit, context } from '@devvit/web/server';
await reddit.submitCustomPost({ subredditName: context.subredditName!, title: 'Siesta #14: Little Harbour', entry: 'default' });
```

Notes: the old `splash` parameter on `submitCustomPost` was removed. Use a splash HTML entry point. We believed
the `inline` flag on entry points was deprecated, but the current docs example still shows `"inline": true` on the
default entry. Check the schema.

**Post data ✅:** `submitCustomPost({ ..., postData: {...} })`, **max 2 KB**, JSON only, readable on the client as
`context.postData` (so never put solutions there). `post.setPostData()` replaces the whole object, so merge first.
We store `{ kind: 'daily', date }` or `{ kind: 'hub' }` and resolve content server-side.

## 3. Redis (storage)

Reddit-hosted, scoped per installation (per subreddit), a **subset** of the Redis API. It is the only
persistence: no filesystem, no external DB.

**Supported ✅:** strings, numbers, hashes, sorted sets, **bitfields**, transactions (`watch`/`multi`/`exec`), `expire`.
**Not supported ✅:** plain **sets** and **lists** (use a sorted set with score 0 for a set, or a timestamp
score for a queue), and **pipelining**. `hMGet` "may be disabled for your app", so prefer `hGetAll`.
**Storage:** **100 MB per installation while unpublished** (5 GB when published). Transactions: about 20 concurrent, 5 s timeout.

**Streaks, Reddit's recommended pattern ✅** (the "Adding Streaks" page, taken from Syllo): one bitfield per user per
year (`streaks:{userId}:{year}`), bit index = day of year (UTC), set on a server-verified completion. The current
streak counts backward from today (or yesterday if today isn't done yet), continuing into the previous year when needed.
Ignore completions of old puzzles, and never clear a bit that's already set.

Set expiries on per-day and per-user data. The Devvit Rules recommend deleting stored user data within 30 days.

## 4. Scheduler (daily content without humans)

```jsonc
// devvit.json
"scheduler": {
  "tasks": {
    "ensure-daily-post": { "endpoint": "/internal/scheduler/ensure-daily-post", "cron": "1,16,31,46 * * * *" },
    "one-off":           { "endpoint": "/internal/scheduler/one-off" }
  }
}
```

```ts
// server (Hono style; Express is similar)
import type { TaskRequest, TaskResponse } from '@devvit/web/server';
app.post('/internal/scheduler/ensure-daily-post', async (c) => { /* idempotent: create today's post if missing */ return c.json({}); });
// one-off at runtime
// scheduler.runJob({ name: 'one-off', data: {...}, runAt: new Date(...) }) → jobId; scheduler.listJobs(); scheduler.cancelJob(id)
```

- Limits per installation: up to **10 live recurring** tasks; `runJob()` up to **60/min**; delivery up to 60/min.
  Runs about once a minute at most by default. Timing may drift.
- **The docs don't state the cron timezone** (still true on 2026-11-15). Our design does not depend on it: an
  **hourly idempotent job** creates today's (UTC) post if it doesn't exist yet. See ARCHITECTURE §6.
- ✅ Endpoints must match `/internal/.+`. Cron tasks in `devvit.json` are rescheduled on install and upgrade.
  Since 0.14.6, jobs created in code with `scheduler.runJob({ cron })` survive deploys. Removing the last cron task
  from devvit.json doesn't cancel old jobs (0.14.8), so cancel them explicitly.

## 5. Reddit API (server)

`reddit.getCurrentUser()`, `reddit.getCurrentSubreddit()`, `reddit.submitCustomPost(...)`,
`reddit.submitComment({ id, text, runAs? })`, `reddit.getPostById(id)`, user flair setting (method name to verify,
e.g. `setUserFlair`), comment distinguish/sticky (verify). The Reddit API plugin is on by default
(`"permissions": { "reddit": { "enable": true, "scope": "user" } }` ✅; checked in the 0.15.3 config schema on 2026-11-15).

**Triggers ✅** (all endpoints `/internal/...`): `onAppInstall`, `onAppUpgrade`, `onPostCreate`, `onPostDelete`,
`onPostSubmit`, `onPostUpdate`, `onPostReport`, `onPostFlairUpdate`, `onPostNsfwUpdate`, `onPostSpoilerUpdate`,
`onCommentCreate`, `onCommentDelete`, `onCommentSubmit`, `onCommentUpdate`, `onCommentReport`, `onModAction`,
`onModMail`, `onAutomoderatorFilterPost/Comment`. **There is no account-deletion trigger**, so per-user data must
expire on its own (rolling TTL ≤ 30 days).

## 6. User actions (acting as the player)

- Lets the app submit posts or comments, or subscribe, **as the logged-in user** instead of the app account.
- Declare it in `devvit.json`:

```jsonc
"permissions": { "redis": true, "reddit": { "enable": true, "scope": "user" } }
```

- ✅ **Changed (0.15.3 schema, checked 2026-11-15):** `asUser` is "not currently in use"; the schema says to set
  `scope: "user"` (the default) to post or comment as the user. On the client, `canRunAsUser(event)` (experimental,
  `@devvit/web/client`) checks, and if needed asks for, the player's consent; it must get the trusted click event.
  Siesta calls it inside the "Post as u/…" and "Join" taps before calling the server.

- Call with `runAs: 'USER'` (e.g. `submitComment`). `subscribeToCurrentSubreddit()` subscribes as the user by default.
- ⚠️ **Until the app is published and approved, `runAs: 'USER'` acts from the app account for everyone except
  the app owner.** During judging (the app is unpublished) a judge's "share" may come from the app account.
  Build it correctly anyway, and make the share text include the player's name/result so it still makes
  sense. Mention this in the README. Ask in the Devvit Discord whether hackathon apps get user actions enabled.
- Devvit Rules ✅: an explicit button press only, labelled clearly ("Post as u/you"), never automatic,
  never required. Score shares reply to the app's sticky comment. The Rules confirm: "Until your app is approved by
  Reddit, new content from your app will be posted from your Devvit app account."
- Also in the Rules ✅: make clear what will appear on Reddit and when the username is shown; set
  `userGeneratedContent` correctly on posts made for the user; **don't merge gameplay actions with posting,
  commenting or subscribing** (each is its own choice); never require or encourage them as a condition of progress.

## 7. Devvit Journeys (analytics; judges ask for it)

- Enable: `"permissions": { "journeys": true }`. Client: `import { telemetry } from '@devvit/analytics/client/reddit'`.
  Server: `@devvit/analytics/server/reddit` (`telemetry.endJourney(...)`, `createTelemetryRouter()`).
- Events: `App.Ready` · `Journey.Start` · `Journey.Progress { progress 0..1, action?, actionDetails? }` ·
  `Journey.Interaction { action, actionDetails? }` · `Journey.End { complete?, game?: { win, score } }`.
- Client methods: `startJourney()`, `progress()`, `interaction()`, `end()/endJourney()`, `getActiveJourneyId()`.
  The ID is kept in sessionStorage. Pass it to the server in the header **`x-devvit-journey-id`**.
- Rules: fire only after **committed** user actions (mouseUp/touchEnd); never use `Journey.Start` for page
  views; no PII in action fields; anomalous patterns get flagged.
- ✅ `Journey.Start` "must represent an explicit user action (like pressing 'Play')".
- ✅ **Auto-start:** calling `progress()` or `interaction()` before a journey exists starts one automatically.
  Call `startJourney()` first, deliberately, so no stray interaction (e.g. a time-of-day toggle) starts it early.
- ✅ The server can end the journey itself: read `x-devvit-journey-id` in `/api/submit` and call
  `telemetry.endJourney({ journeyId, complete: true, game: { win: true, score } })` from
  `@devvit/analytics/server/reddit`. Then the reported score is the server-verified one.
  `telemetry.setJourneyId()` exists on the client for IDs returned by the server.
- ⚠️ **Journey maps must be reviewed and approved, and the app must be on a server-side allowlist, or events
  are dropped.** Request this in **week 1** (Devvit Discord / r/Devvit) and get it confirmed.
- Dashboard (App Details → Analytics): start rate, completion rate, sessions per user, median session duration.

## 8. Other capabilities we may use

- **Forms** (`showForm`): structured input, e.g. "report a problem" categories or a level-editor publish.
- **Menu actions:** three-dot menu items for mods: "Post today's puzzle now", "Review community levels".
- **Triggers:** respond to events (app install/upgrade, comments, deletions). Use `onAppInstall` to bootstrap.
- **Settings & secrets:** per-subreddit config (e.g. daily post hour). No secrets needed.
- **Realtime:** live, event-driven updates. Only if the game needs live shared state.
- **Media uploads / blob storage:** apps can only display media hosted on Reddit. Bundle static art instead.
- **HTTP fetch:** allow-listed domains only. **We don't use it.**
- **Payments:** not for the hackathon.
- **Native share sheet ✅** (logged-out players guide): `showShareSheet({ title?, text?, data? })` from
  `@devvit/web/client` opens Reddit's own share flow for the current post. `data` (≤ 1,024 chars) travels with the link,
  and the recipient's app reads it with `getShareData()`. **Treat share data as untrusted** (users can edit links):
  validate it and never use it for identity. This is how we build "Challenge a friend". It doesn't post as the user,
  so the user-action rules don't apply.
- **Custom share image ✅:** `submitCustomPost({ ..., shareImageUrl })` or `post.setShareImageUrl(url)` sets the
  thumbnail in compact feeds and link unfurls. The image must first be uploaded with `media.upload({ url, type: 'image' })`.
  How to upload a bundled image without an external URL is **unverified**, so it's a stretch goal.
- **Navigation ✅:** `navigateTo(urlOrPostOrComment)` from a user action. External URLs show a confirmation and we
  don't use them; Reddit URLs and objects are fine. Use it for "Today's town is up →" on old posts.
- **Push notifications:** a **gated beta for established games with traction**. Not available to us; don't plan around it.
- **App icon ✅:** `devvit.json` → `"marketingAssets": { "icon": "assets/icon.png" }`, a **1024×1024 PNG** (required).
- **Logged-out players ✅:** `context.userId` is set only when logged in. Let logged-out players play fully, keep their
  result in localStorage keyed by post, offer login at a natural break (after the solve), and move the result to
  Redis when they log in.

## 9. Devvit Rules: the ones that bite games

- **README.md** in the root: not vague or default; overview ≤ 1,000 words for non-developers, plus how to
  configure and use it.
- Explicit consent before acting for a user; collect minimal data; never request credentials; no profiling;
  don't use Reddit data to train AI; keep data under 30 days where possible (Redis expiry);
  delete content when its post or comment is deleted; remove user IDs when an account is deleted.
  With no account-deletion trigger, **every key holding a user ID gets a TTL of 30 days or less.**
- ✅ **User-made content** (our Town Builder): "If users enter text or imagery that appears in your app, publish that
  content with reportable, actionable attribution". Limit expression to predefined, safe choices; let authors **delete
  their own content**; make it reportable. Ask the Devvit team whether structured towns, a picked name, mod approval
  and an in-app report button are enough, or whether each town also needs a comment posted as its author.
- User actions: a manual, clearly labelled button; never automated; never required for progress.
  **Score-share comments must be posted as the user**; generic score comments reply to a **sticky comment**;
  top-level only if the user adds their own commentary.
- Prefer emoji, symbols and predefined lists over free text.
- **No Reddit trademarks or Snoo** (not even as a character); original name; no clones; no third-party IP.
- No off-platform links or "demo elsewhere"; no external profiles.
- Provide a way for users to **report issues**, and act on reports.
- No gambling or loot-box mechanics. Don't target under-13s.
- LLMs: only Gemini or OpenAI via fetch, with approval. **We use none.**
- Common rejection causes: a bad README; automated or mandatory posting; branding misuse; off-platform links;
  ignoring deletions; no reporting tool.

## 10. Help

- Devvit MCP server (in `.mcp.json`): docs and tools for agents.
- r/Devvit and the Devvit Discord: office hours; admins answer hackathon questions. Helping others there counts
  toward the $500 Helper Award.
- Template library: https://developers.reddit.com/docs/examples/template-library
- **Feature guide** (developers.reddit.com/docs/guides/launch/feature-guide): what Reddit staff look for when
  featuring games. It's effectively a second rubric: a custom first screen, works cleanly on mobile and desktop,
  self-explanatory, no inline scrolling, cohesive visuals, features that encourage posts, comments and user content,
  fresh mechanics, plus CTR, day-1 and day-3 retention and dwell time.
