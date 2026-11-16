# 03 — Architecture

Game-agnostic. Every concept in `04-GAME-SPEC.md` fits this shape: a small grid-or-board puzzle, one puzzle
per UTC day, server-validated results, and a community layer. Where names are Siesta-specific, swap them for the
selected game's.

## 1. Guiding principles

1. **Content is keyed by date, not by post.** Puzzle `2026-12-10` exists whether or not a post was made.
   A daily post stores only `{ kind: 'daily', date }` in its post data. If the scheduler hiccups, the game still serves
   the right puzzle, and a mod (or the next hourly run) can create the missing post.
2. **A pinned "Today's town" post (the hub).** One permanent post with `{ kind: 'hub' }` always resolves to today's UTC
   date. **This is the demo link we submit.** Judges open it any day from Dec 9 to Dec 16 and always get that day's town,
   with streaks working. Daily posts still exist for the feed, the archive and each day's comment thread.
3. **Pure, shared engine.** The rules, solver, generator, scoring and seeded RNG live in `src/shared/engine`
   with no DOM, Devvit or I/O. The client uses it for instant feedback and live drag previews; the server uses it to
   **re-validate** every submission and every community town. One implementation means no drift.
4. **Pre-generated, verified content bank.** Puzzles are generated **offline** by a script, proven solvable
   (and unique where the curve says so) by the solver, graded for difficulty, and committed as JSON. Solutions stay
   server-side. Runtime generation is only a fallback.
5. **Survive the freeze.** After Dec 8 we assume nothing can change. The bank covers **Nov 17, 2026 → Dec 31, 2027**
   (it costs nothing), the scheduler is idempotent and self-healing, and nothing depends on a human.
6. **Fast inline, rich expanded.** The splash is tiny (target ≤ 50 KB gzipped JS+CSS, no framework if possible, first
   content under 1 s, Lighthouse mobile above 80). The game bundle loads on tap.
7. **Honest community data.** Every number shown comes from real Redis counters. Each one has a small-N state.
8. **Data expires.** Every key holding a user ID has a TTL of 30 days or less (rolling where noted). There is no
   account-deletion trigger, so expiry is how deleted accounts disappear.

## 2. Folder layout (adapt to the template; keep the separation)

```
.
├── devvit.json                  # app config: entry points, permissions, scheduler, triggers, menu, marketingAssets.icon
├── README.md                    # player- and mod-facing README (Devvit Rules + hackathon requirement)
├── CLAUDE.md / AGENTS.md        # agent context (this kit)
├── DECISIONS.md  PROGRESS.md
├── docs/                        # this kit's docs; docs/sources = official Devpost copies; docs/references = art refs
├── prototype/                   # Phase 0 throwaway: one HTML file, no build, no Devvit. Never imported by src/
├── scripts/
│   ├── generate-puzzles.ts      # offline: generate → solve → grade → write content bank
│   ├── validate-bank.ts         # CI check: every puzzle solvable, difficulty curve sane, no dupes, dates complete
│   └── preview-puzzle.ts        # print a puzzle as ASCII for quick eyeballing
├── src/
│   ├── shared/
│   │   ├── engine/              # PURE game logic (no DOM, no Devvit)
│   │   │   ├── types.ts         # Puzzle, Placement, BoardState, Result, Town
│   │   │   ├── rules.ts         # castShadows, evaluate, isSolved
│   │   │   ├── solver.ts        # find solutions / count them (stop at limit+1)
│   │   │   ├── generator.ts     # seeded generation for a target difficulty
│   │   │   ├── difficulty.ts    # grade a puzzle
│   │   │   ├── scoring.ts       # adjusted time from time + hints
│   │   │   ├── town.ts          # validate a community town's structure (sizes, counts, legal tiles)
│   │   │   └── rng.ts           # seeded PRNG (e.g. mulberry32) from a date string
│   │   ├── api.ts               # request/response types shared by client and server
│   │   └── dates.ts             # UTC day keys, puzzle numbering (#1 = launch day)
│   ├── server/
│   │   ├── index.ts             # server app; mounts routes
│   │   ├── routes/              # /api/* (client) and /internal/* (scheduler, triggers, menu, forms)
│   │   ├── services/            # puzzles, calendar, results, streaks, leaderboard, firstMoves, towns, reports, recap
│   │   ├── repo/keys.ts         # every Redis key and TTL defined in ONE place
│   │   └── content/             # bank.json (puzzles WITH solutions, server only), town-words.json, team-towns.json
│   └── client/
│       ├── splash.html / splash.ts   # inline entry: tiny, fast, taps only, no engine import
│       ├── game.html / game.tsx      # expanded entry: the game
│       ├── screens/             # Play, Tutorial, Result, HowTo, Archive, Builder
│       ├── components/          # board, tiles, tray, time toggle, sun strip, sheets
│       ├── state/               # game state store; progress sync to the server
│       ├── copy.ts              # ALL player-facing text (a human owns this file)
│       ├── telemetry.ts         # Journeys wrapper (no-ops safely if not allowlisted)
│       ├── audio.ts             # tiny SFX; starts after the first tap; mutes on visibilitychange
│       └── assets/              # bundled fonts (woff2, subset), SVG, one paper texture, SFX
└── tests/                       # engine unit tests, API tests, Playwright visual tests
```

## 3. Data model (Redis)

All keys and TTLs live in `repo/keys.ts`. `{d}` = `YYYY-MM-DD` (UTC). `{u}` = Reddit user id (t2_…).
Supported types: strings, numbers, hashes, sorted sets, bitfields. **No lists, no plain sets, no pipelining.**

| Key | Type | Content | TTL |
|---|---|---|---|
| `cfg:launchDate` | string | day #1 for numbering | none |
| `cfg:hubPostId` | string | the pinned "Today's town" post | none |
| `post:{d}` | string | daily postId for that date (idempotency guard) | none (no user data) |
| `sticky:{d}` | string | the app's sticky comment id in that day's post | 40 days |
| `cal:{d}` | string | what runs on date d: `bank` or `town:{id}` (fixed when the post is made) | 60 days |
| `progress:{d}:{u}` | JSON | in-progress board + server `firstSeenAt` | 3 days |
| `result:{d}:{u}` | JSON | `{ solved, timeMs, hints, adjustedMs, moves, firstTile, solvedAt }` | 30 days |
| `streaks:{u}:{yyyy}` | bitfield | one bit per UTC day solved (Reddit's pattern) | 30 days, renewed on each solve |
| `user:{u}` | hash | `bestStreak, totalSolved, flairOn, muted, tutorialDone` | 30 days, renewed on each visit |
| `lb:{d}` | sorted set | userId → adjusted time ms (lower is better; ties by solvedAt) | 30 days |
| `first:{d}` | hash | tile index → count of first drops (no user ids) | 60 days |
| `stats:{d}` | hash | `solves`, `cleanNaps`, time buckets (no user ids) | 60 days |
| `town:{id}` | JSON | grid, name words, author id + name, status, loves count | 45 days (a town not run by then expires) |
| `towns:pending` / `towns:approved` | sorted set | town id → submitted/approved time | none (ids only) |
| `towns:by:{u}` | sorted set | the author's town ids | 45 days |
| `loves:{id}` | sorted set | userId → time (one love per player) | 45 days |
| `report:{id}` | JSON | category from a fixed list, target (date or town), reporter id | 30 days |
| `rl:{action}:{u}` | number | rate-limit counter (submit, share, towns, report) | 1 hour |

Compliance notes: rolling TTLs mean an inactive or deleted account's data is gone within 30 days (45 for an unrun town).
On `onPostDelete`, clear `post:{d}` / `cfg:hubPostId` if they point at the deleted post. We never store comment text.

## 4. API (client ↔ server)

All JSON. Requests carry `x-devvit-journey-id` when a journey is active.

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/init` | Resolve the date (daily post → its date; hub → today UTC). Return `{ date, number, isToday, todayPostId, puzzle (no solution), credit?, myResult?, myProgress?, user: { streak, … }, settings }` |
| POST | `/api/progress` | Save in-progress state (debounced). The first save sets `firstSeenAt` |
| POST | `/api/submit` | `{ placements[], timeMs, hints }` → replay with the engine, validate, check time, write result, streak bit, leaderboard, `first`, `stats`; end the journey server-side; return the result card data |
| GET | `/api/aggregate?date=` | "Where everyone started" + time distribution, **only after this player solved** |
| GET | `/api/leaderboard?date=` | Top 10 + my rank (small-N aware) |
| POST | `/api/share` | Explicit button → `submitComment({ runAs: 'USER' })` replying to `sticky:{date}`; returns the permalink |
| POST | `/api/subscribe` | Explicit button → subscribe the user |
| POST | `/api/flair` | Opt-in: streak flair or "Town maker" |
| POST | `/api/settings` | `muted`, `tutorialDone` (Redis, because localStorage is wiped on app updates) |
| GET | `/api/archive` | Last 14 days with my status |
| POST | `/api/towns` | Builder submit: validate structure, solver proves exactly one solution, rate-limit 3/day |
| GET | `/api/towns/mine` | My towns with status and loves |
| DELETE | `/api/towns/:id` | The author deletes their own town |
| POST | `/api/towns/:id/love` | One "Lovely town" per player, only after solving it |
| POST | `/api/report` | Problem or town report (categories from a fixed list) |

"Challenge a friend" uses `showShareSheet()` on the client; no server route.

Internal: `/internal/scheduler/ensure-daily-post` (every 15 minutes), `/internal/triggers/app-install` (creates the hub and today's
post, sets `cfg:launchDate`), `/internal/triggers/post-delete`, `/internal/menu/post-today`, `/internal/menu/create-hub`,
`/internal/menu/review-towns`, `/internal/forms/review-town`.

## 5. Client flow

```
Feed → [splash, inline, taps only]  name · #n · date · town drawing · difficulty · my streak · one CTA
          │  hub post → today's town         old daily post → "Today's town is up →" (navigateTo) or play it anyway
          │  tap CTA → requestExpandedMode('game')   (synchronously, inside the click handler)
          ▼
       [game] first time? → 3-step interactive tutorial (playing IS the tutorial)
          │  play: drag with a live shadow preview; engine checks on drop; progress synced to the server
          ▼  solved
       [the siesta]  ~2.4 s day sweep; cats fall asleep in turn
          ▼
       [one result card] time · hints · streak · one community line · Post my result (as you) · Challenge a friend
                         footer: countdown · Join · Yesterday's town
```

Reopening a solved day shows the result card directly. The splash shows "Napped in 1:42 · streak 7" for returning players.

## 6. Daily content pipeline and self-healing posting

1. `scripts/generate-puzzles.ts --from 2026-11-17 --to 2027-12-31` generates candidates per date with a seeded RNG and
   a weekday difficulty target (Mon easiest → Sat hardest; Sunday = community town or special). The solver verifies them
   (solvable, solution count). They're graded, and the best candidate per day is kept. Output: `src/server/content/bank.json`.
2. `scripts/validate-bank.ts` runs in tests: every date present, solvable, difficulty within its band, no duplicates.
3. **Scheduler `ensure-daily-post`** runs every 15 minutes (cron `1,16,31,46 * * * *`; each run is one Redis read when the post exists): compute today's UTC key. If `post:{d}` is missing:
   decide `cal:{d}` (on Sunday, the oldest approved town, else a team town or the bank's special), create the post
   (`submitCustomPost`, entry `default`, `postData: { kind: 'daily', date }`, title from the template), set `post:{d}`,
   then create, distinguish and sticky the app's comment (yesterday's recap + "Share your result here"), and set
   `sticky:{d}`. Also make sure the hub post exists. Idempotent and safe to run any number of times.
4. **App install trigger** creates the hub post and today's post immediately and records `cfg:launchDate` if unset.
5. **Mod menu:** "Post today's town now" (same function), "Create the Today's town post", "Review community towns".
6. **Fallback:** if the bank has no entry for a date, generate at runtime with the seeded generator (time-boxed
   under 10 s) and cache it in Redis.
7. Puzzle numbering: `#n = days since launchDate + 1`.

## 7. Community layer (pattern; the game spec picks specifics)

- **Streaks:** consecutive UTC days solved (bitfield per year, Reddit's pattern); shown on the splash and result;
  optional opt-in **flair**.
- **Daily leaderboard:** top 10 + my rank; ties broken by solve time. Kept off the main result card (one community line only).
- **Reveal after solving:** "where everyone started" (first drops). Spoiler-safe: only after you solve.
- **Share:** a spoiler-free text summary, posted as the user, as a reply to the day's sticky comment.
- **Challenge:** Reddit's share sheet with untrusted share data (date + time only).
- **Daily recap:** yesterday's real numbers at the top of each day's sticky comment.
- **Town Builder:** structured input only; the server proves exactly one solution; mods approve via the menu; Sundays run
  approved towns credited to their authors; authors can delete; every town can be reported.
- **Snoovatars:** only if Reddit-hosted avatar images load inside the webview (the client CSP may block them). Test in Phase 1.
- **Small-N copy:** below 10 solvers, "You're one of the first N…" instead of percentages.

## 8. Journeys event map (generic)

| Event | When |
|---|---|
| `App.Ready` | the game's interactive UI is ready (not on page view) |
| `Journey.Start` | `startJourney()` on the player's first committed action in the game view, before any other telemetry call |
| `Journey.Progress` | meaningful milestones, `progress` = fraction of goals satisfied (throttle: max ~10 per session) |
| `Journey.Interaction` | `hint_used`, `lift`, `time_toggle` (throttled), `share_clicked`, `challenge_clicked`, `subscribe_clicked`, `tutorial_done`, `town_submitted` |
| `Journey.End` | sent by the server in `/api/submit`: `{ complete: true, game: { win: true, score } }`. Leaving mid-puzzle → end with `complete: false` if appropriate |

The telemetry wrapper must no-op safely if Journeys is not yet allowlisted.

## 9. Performance and robustness

- **Splash:** ≤ 50 KB gz JS+CSS, first content under 1 s, Lighthouse mobile above 80, no layout shift, taps only.
- **Game:** ≤ 250 KB gz excluding audio. Fonts subset to woff2 (aim ≤ 40 KB each). Art as SVG; one small tiled paper texture.
- **Drag preview at 60 fps:** shadows come from the pure engine (cheap set maths) and render with CSS transforms or
  SVG updates. No re-layout per frame. Test on a mid-range Android inside the Reddit app, not just desktop Chrome.
- **Fits the viewport:** board size is computed from the available height and width. No page scroll on any screen.
- Optimistic UI: the client checks the solution locally and starts the siesta immediately; the server confirms in the
  background; retry on failure; never lose a result.
- Handle: logged-out players (play fully, result kept in localStorage per post, offer login after solving, migrate on
  login), the app opened on a day with no post, network errors, double submits, an old cached client.
- Time: show the countdown in the player's local time; the logic stays in UTC.

## 10. Testing strategy

- **Engine:** unit and property tests with `node --test` (the template's `npm run test:unit`) (random boards: the solver's solutions always validate; the generator hits its
  difficulty bands; town validation rejects illegal grids).
- **Server:** route tests with an in-memory Redis fake (no lists or sets in the fake either, to match Devvit); the
  scheduler's idempotency test (run twice → one post, one sticky comment); streak tests from Reddit's list (no play → 0,
  counting back from today or yesterday, Jan 1 rollover, old-puzzle completions ignored).
- **Client:** Playwright against the local dev build at 360×640, 390×844 and 1280×800; screenshots per screen and state
  (fresh, mid-game, solved, small-N, logged-out, error). **Fail the test if the page scrolls.** Agents must look at the screenshots.
- **Lighthouse** on the inline splash before each milestone.
- **On Reddit:** playtest on desktop web + iOS app + Android app, inline and expanded, before each milestone.
- **Human playtests:** at least 5 people who've never seen it, watched silently. Note where they hesitate.

## 11. Security and fairness

- The server replays submitted placements; the client's "solved" claim is never trusted.
- Time sanity check against the server's `firstSeenAt`; implausibly fast solves are rejected.
- Rate-limit submit, share, town submissions and reports per user (Redis counters).
- Share data and community towns are untrusted input: validate structure, cap sizes, predefined vocabulary only.
- No PII in Journeys or logs.
