# Devvit Daily Game Kit — ALL-IN-ONE

> Every kit file concatenated, for agents that accept a single file. Section order: kit guide, agent context, docs 01–08, prompts.
> Regenerated 2026-11-15 after the kit review. Verbatim copies of the official Devpost pages are in `docs/sources/` (not included here).


---

<!-- FILE: KIT-README.md -->

# Devvit Daily Game Kit: how to use this

Everything an AI coding agent (or a new teammate) needs to build our entry for **Reddit's Game of the Day
Hackathon** (deadline Dec 8, 2026, 6 PM PT = Dec 9, 07:30 IST; we submit by Dec 8, 21:00 IST).

## What's inside
```
CLAUDE.md                 ← auto-loaded agent context: mission, hard rules, how to work (AGENTS.md = same file for other agents)
docs/01-HACKATHON-BRIEF   ← rules, prizes, judging, submission, past winners and lessons
docs/02-DEVVIT-PLATFORM   ← Devvit Web reference (entry points, Redis, scheduler, user actions, Journeys, Rules)
docs/03-ARCHITECTURE      ← system design, folders, Redis keys, API, posting pipeline, tests
docs/04-GAME-SPEC         ← THE GAME (Siesta by default) + template + 4 alternative concepts
docs/05-PLAN              ← phases, dates, exit criteria, roles, cut list, risks
docs/06-QUALITY-BAR       ← UX, visual and anti-AI-slop standards
docs/07-SUBMISSION-CHECKLIST
docs/08-TOOLS             ← what to install and use
docs/sources/             ← verbatim copies of the official Devpost pages (overview, rules, resources)
prompts/00-KICKOFF        ← paste this first (verification + the Phase 0 prototype)
prompts/01-PHASE-PROMPTS  ← one prompt per phase
prompts/02-REVIEW-AND-QA  ← fresh-eyes judge review, visual QA, rules audit
prompts/03-WRITING        ← Devpost text, video script, sidebar
.mcp.json                 ← Devvit, Playwright, Context7 MCP servers for Claude Code
.claude/commands/         ← /review, /qa, /status slash commands
DECISIONS.md, PROGRESS.md ← living logs the agents keep updated
ALL-IN-ONE.md             ← every doc in one file, for agents that take a single upload (ChatGPT, Gemini, Cursor chat)
```

## Steps
1. Install Node 24+, Git, Claude Code. Log in to Reddit in a browser.
2. `npm create devvit@latest --template=react` (or `phaser`) → follow the wizard → `cd` into the project.
3. Copy everything from this kit into the project root (keep the template's own README as `README.template.md`;
   the app needs its own README later).
4. `cp CLAUDE.md AGENTS.md` (for non-Claude agents).
5. `git init` and commit right away. The history is our authorship evidence if we win.
6. Open Claude Code in the project root → approve the MCP servers → paste `prompts/00-KICKOFF.md`. It builds the
   Phase 0 prototype and stops so humans can playtest it.
7. After the playtests, paste "Phase 0b" from `prompts/01-PHASE-PROMPTS.md`, then each phase's prompt in turn.
   Run `/status` any time; `/review` at the end of a phase.

## Switching the game
Replace Section A of `docs/04-GAME-SPEC.md` with another concept (Section C) or your own, using the template in
Section B. Log it in `DECISIONS.md`. The architecture, plan and prompts stay the same.

## Running several agents in parallel (optional, faster)
Use git worktrees, one per agent, each on its own branch:
- Agent A: `src/shared/engine` + scripts (generator, solver, bank)
- Agent B: `src/client` screens and components (against a mocked API)
- Agent C: `src/server` routes, Redis, scheduler, Journeys
The lead merges daily. The engine API (`src/shared/engine/types.ts`, `src/shared/api.ts`) is agreed first and changes only by agreement.

---

<!-- FILE: CLAUDE.md -->

# CLAUDE.md — Project context for every agent working on this repo

> This file is loaded automatically by Claude Code (and copied as AGENTS.md for other agents).
> Read it fully before doing anything. Then read the files in `docs/` that your task needs.

## 1. Mission

We are building a **daily puzzle game that runs inside Reddit posts** for **Reddit's Game of the Day
Hackathon** (Devpost, Nov 11 – Dec 8, 2026). Goal: win **Best Daily Game ($15,000)**.

- **Hard deadline:** Tue **Dec 8, 2026, 6:00 PM Pacific** = **Wed Dec 9, 07:30 IST**.
  Our internal deadline is **Dec 8, 21:00 IST** (about 10 hours of buffer).
- **The Devpost submission is locked after the deadline.** The rules don't say whether app bug fixes are
  allowed during judging (we've asked in writing; see PROGRESS.md). Until we get a yes, treat the app as frozen too.
- Judging runs **Dec 9 – Dec 16**. The rules require the game to stay playable and free **until judging ends**.
  Our own safety margin: it keeps posting fresh daily content by itself through **at least Dec 31**.
- Judges are a **Reddit panel** who play our **demo post**: a pinned "Today's town" post that always shows the
  current day, in a small public test subreddit. Each judge plays alone, usually on a phone. The game must
  explain itself with zero outside help.
- **Judges may skip playing** and score only from our Devpost text, images and video (Official Rules §4,
  "Testing"). Treat the video and screenshots as part of the product, not an afterthought.
- Official sources are copied in `docs/sources/` (Devpost overview, rules, resources).

## 2. The four judging criteria (equally weighted). Optimise for these, not for features

1. **Delightful UX:** exciting layouts and themes; easy, fun discovery of features.
2. **Polish:** close to publishable; compliant with the Devvit Rules.
3. **Reddit-y:** community-minded, its own identity, something fresh for the platform.
4. **Daily Content:** recurring content, challenges and intrigue, using fresh content well.

Ties are broken by the first criterion, so **Delightful UX is the score that matters most**.
Reddit-y, in Reddit's own words, means "human-first, embracing community, meritocracy, creativity" and
"the best apps will bring a community together". That's why the Town Builder (player-made towns) is a core feature.

Reddit explicitly does NOT want:
- obvious "AI slop" (AI use is fine, but it must not look AI-made). Their own test: "Fit the UI in the
  viewport, give your app a unique identity, make it accessible";
- on-the-nose Reddit theming (karma, Snoo, upvote jokes);
- common ideas: clones, space shooters, simple platformers, trivia, collaborative storytelling;
- anything not running on Reddit via Devvit.

## 3. Non-negotiable constraints (never break these)

- Built on **Devvit Web** (Reddit Developer Platform) using **Interactive Posts**. HTML/CSS/JS/TS only.
- Comply with the **Devvit Rules** (summary in `docs/02-DEVVIT-PLATFORM.md` §9). In particular:
  - Posting, commenting or subscribing **as the user** only happens on an explicit, clearly
    labelled button press. It is never automatic and never required to play.
  - Score-share comments are posted **as the user** and as a **reply to the app's sticky comment**.
    A top-level comment is only allowed if the user adds their own commentary.
  - No Reddit trademarks or Snoo as characters, no third-party IP, an original name.
  - No off-platform links, no "play the full version elsewhere", no external accounts.
  - Free-text input is minimised (predefined lists, emoji and pickers preferred).
  - Include a way to **report a problem** in the app.
  - No gambling, loot boxes or wagering mechanics.
- **No runtime AI/LLM calls** and **no external HTTP fetch** (empty allowlist). Everything runs
  on Reddit's infrastructure. Assets (fonts, images, audio) are bundled. No CDNs, no Google Fonts links.
- **Mobile-first.** It must work in the Reddit iOS and Android apps and on desktop web.
  Design for 360–430 px wide first. **Every screen fits the viewport with no page scroll** (from 360×640 up),
  inline and expanded.
- **Inline (in-feed) view:** taps and clicks only, no drag or gesture handlers, no internal scrolling (scroll
  traps get apps rejected), first content in under 1 s, Lighthouse mobile score above 80. Drag play lives in expanded mode.
- **Sound** starts only after a tap, has a mute button, and mutes when the page is hidden (`visibilitychange`).
- **localStorage is wiped on every app update.** Settings, tutorial-seen and in-progress boards live in Redis for
  logged-in players. Only logged-out play uses localStorage.
- **All per-user data expires within 30 days** (a rolling TTL that renews when the player plays). Devvit has no
  account-deletion trigger, and the rules require deleted accounts' IDs to disappear.
- Puzzle solutions are **never shipped to the client**. The server validates every submitted result.
- Every daily puzzle is **proven solvable** by our solver before it ships.
- The app must work for **one judge in a subreddit with fewer than 200 members**. Community
  features degrade gracefully when there are only a few players.
- **Never fabricate data** in the UI (fake player counts, fake percentages). Small numbers get
  honest small-N copy ("You're one of the first 5 solvers today").

## 4. Flexible (agents may change these, but log the reason)

Anything not in §3 can be improved: mechanics details, grid sizes, difficulty curve, art direction,
copy, screen flow, tech choices inside Devvit Web (React vs Phaser vs Canvas), file layout,
scoring formulas. **Rule:** when you deviate from a doc, add an entry to `DECISIONS.md`
(date, what, why, alternatives) and update the affected doc in the same change. Push back on the
spec if you find a better design. Explain why and propose a change. Don't silently comply
with a bad idea, and don't silently ignore a good one.

## 5. Source of truth and verification

- **APIs change.** The Devvit snippets in our docs were checked on 2026-11-15 but may be out of date.
  Before using any Devvit API, **verify it with the Devvit MCP server** (`devvit` in `.mcp.json`)
  or the official docs at developers.reddit.com/docs. If the docs and our files disagree,
  the docs win. Fix our file and log it in `DECISIONS.md`.
- Start from an **official Devvit Web template** (`npm create devvit@latest`). Never hand-roll the
  build config if the template already provides it.
- Node **24+** required (the template pins 24.18.0 in `.nvmrc`; this machine runs 26). Also follow Reddit's template rules in `docs/DEVVIT-TEMPLATE-NOTES.md` (use `navigateTo`, `showToast`; no inline scripts in entry HTML; named exports; no type casts).

## 6. Where things are

| File | What it holds |
|---|---|
| `docs/01-HACKATHON-BRIEF.md` | Rules, dates, judging, submission requirements, what won before |
| `docs/02-DEVVIT-PLATFORM.md` | Devvit Web reference: entry points, Redis, scheduler, user actions, Journeys, rules |
| `docs/03-ARCHITECTURE.md` | System design, folders, data model, API, jobs, content pipeline, testing |
| `docs/04-GAME-SPEC.md` | **The selected game** (rules, generator, screens, community layer) and alternatives |
| `docs/05-PLAN.md` | Phases, dates, exit criteria, roles |
| `docs/06-QUALITY-BAR.md` | UX, visual and polish standards; the anti-AI-slop checklist |
| `docs/07-SUBMISSION-CHECKLIST.md` | Everything Devpost needs, plus pre-submit checks |
| `docs/08-TOOLS.md` | Tools, MCP servers, art/audio/video tooling, what not to use |
| `docs/sources/` | Copies of the official Devpost pages (overview, rules, resources). These beat our summaries |
| `prompts/` | Kickoff and per-phase prompts, review prompt, QA prompt |
| `DECISIONS.md` | Running log of design and tech decisions (create it if missing) |
| `PROGRESS.md` | Running status: what's done, what's next, known bugs (create it if missing) |

## 7. How to work (agent operating rules)

1. **Plan before you code.** For any task larger than about 30 minutes, write a short plan in
   `PROGRESS.md` first: steps, files, risks.
2. **Small vertical slices.** Get something running on Reddit (`npm run dev` playtest) early and
   keep it running. Never break the main branch's playtest.
3. **The game engine is pure.** `src/shared/engine` has no DOM, no Devvit and no randomness without a seed.
   Unit-test it heavily with the template's runner (`npm run test:unit`: `node --test` on `src/**/*.test.ts`). The solver and generator live here.
4. **Test what you build:** engine (unit tests), API (route tests with mocked Redis), and UI
   (Playwright screenshots at 375×667, 390×844 and 1280×800). Look at the screenshots yourself.
5. **Commit often** with clear messages. Update `PROGRESS.md` at the end of every session. The git history
   is also our evidence of authorship: Reddit verifies winners' "role in the creation of the submission".
6. **Ask a human** only for decisions that are hard to undo or genuinely subjective (game choice,
   art direction sign-off, anything that publishes or posts publicly). Otherwise decide and log.
7. Do **not** run `devvit publish`. The hackathon says don't submit for publishing. Use `upload`/playtest only.
8. Keep secrets out of the repo. There should be none anyway (no external services).

## 8. Definition of done (for any feature)

- [ ] Works in playtest on Reddit desktop and on a phone (inline and expanded).
- [ ] Fits the viewport with no page scroll at 360×640, 390×844 and 1280×800.
- [ ] Has loading, empty, error, small-N and logged-out states.
- [ ] Tap targets ≥ 44 px, text contrast ≥ 4.5:1, never relies on colour alone, respects reduced motion.
- [ ] Journeys events fire correctly (if relevant).
- [ ] Unit tests pass; no console errors; no TypeScript errors; lint clean.
- [ ] `PROGRESS.md` and, if relevant, `DECISIONS.md` updated.

## 9. Style of the codebase

TypeScript strict. Small modules. Names that read like the game's language (`castShadows`,
`isCatAsleep`), not generic (`process`, `handle`). No dead code, no TODOs without an issue.
UI copy is short, warm and plain. No exclamation-mark spam, no emoji as icons (inline SVG instead).
All player-facing text lives in one file (`src/client/copy.ts`) so a human can write and edit it. Agents may
draft placeholder strings, but a human signs off every string before the feature freeze.

---

<!-- FILE: docs/01-HACKATHON-BRIEF.md -->

# 01 — Hackathon brief

Source pages (re-check them for updates): https://redditgameofday2026.devpost.com/ and `/rules`.
Facts below were collected 2026-11-12 to 2026-11-15 and checked against the official pages on 2026-11-15.
**Verbatim copies are in `docs/sources/`. If this summary and those copies disagree, the copies win.**
The Updates tab had no posts on 2026-11-15. Check it weekly.

## Key facts

| Item | Value |
|---|---|
| Event | **Reddit's Game of the Day Hackathon** (Devpost). Use this exact name in the README and the Devpost text |
| Registrations | 1,231 by Nov 15 (day 4) |
| Submission period | Wed Nov 11, 2026 12:00 PM PT → **Tue Dec 8, 2026 6:00 PM PT** (= Wed Dec 9, 07:30 IST) |
| Judging | Dec 9 00:00 PT → Dec 16 6:00 PM PT |
| Winners | on or around Thu Dec 17, 3:00 PM PT |
| Judges | Reddit panel |
| Prize pool | $35,000 |
| Team size | No limit; one Representative enters for the team and receives any prize |
| Eligibility | Age of majority. Excluded: Brazil, Quebec, Russia, Crimea, Cuba, Iran, North Korea, Syria, OFAC-designated places. **India is eligible.** |
| Multiple entries | Allowed if each is unique and substantially different |
| One prize per project | Yes |

## Prizes

| Prize | Amount | Count |
|---|---|---|
| **Best Daily Game** | $15,000 | 1 |
| Best Ported Daily Game (existing IP/port; you must own it; note it at submission) | $6,000 | 1 |
| Honorable Mentions | $1,000 | 10 |
| Devvit Helper Award (individuals who help others) | $500 | 6 |
| Feedback Award (developer survey) | $200 | 5 |

## The challenge (paraphrased)

Build a daily game on Devvit using Interactive Posts that inspires **collective joy every day**: a
bite-sized daily experience with enough variety and replayability to bring players back. It should be
easy to pick up, have a satisfying daily loop, and be integrated into Reddit. Examples: daily
challenges, puzzles, prompts, maps. **Bonus points** for Devvit Journeys, flair, comments, snoovatars and streaks.
Reference games to study: r/hotandcold, r/colorpuzzlegame, r/syllo, r/pocketgrids.

## What Reddit says makes a game stand out

1. **Intuitive onboarding:** minimal setup screens; contextual hints instead of walls of text.
2. **Visual craft:** clear identity, accessible contrast, legible text, uncluttered controls, responsive feedback.
3. **Calibrated daily content:** fresh, fair, solvable content with a sensible difficulty curve.
4. **Focused gameplay:** the start screen shows the essentials (name, description, date, attribution, stats);
   active play is free of clutter.
5. **Clear end states:** **one** result card with a meaningful next step (stats, streaks, comments,
   subscribe). No chains of end screens.
6. **Journey instrumentation:** Devvit Journeys track game loops (analytics, leaderboards, streak verification).

## What Reddit does NOT want

AI slop · on-the-nose Reddit theming · overdone ideas (space shooters, clones, simple platformers,
collaborative storytelling, trivia) · games not running on Reddit.

Two phrases from the overview page worth designing around:
- AI slop: "it shouldn't be obvious the moment we open your app. **Fit the UI in the viewport**, give your app a
  unique identity, make it accessible, and make sure you're thinking of your human players."
- Reddit-y: "human-first, embracing **community, meritocracy, creativity**… comments/discussion, flair, feeds,
  community". The Resources page also points to past games "that lean on **user creativity**".

## Judging

- **Stage 1 (pass/fail):** fits the theme; reasonably uses the required APIs/SDKs.
- **Stage 2:** four equally weighted criteria: Delightful UX · Polish · Reddit-y · Daily Content.
- **Tie-break:** higher score on the first criterion, then the next, and so on; then a judges' vote.
  So Delightful UX decides close calls.
- "Judging will score your game based on the demo link" (overview). Polish: "Judges should be able to understand
  everything we need to know by interacting with **example posts**" (plural), so the whole demo subreddit is on show.
- **"Judges are not required to test the Project and may choose to judge based solely on the text description,
  images, and video provided in the Submission"** (rules §4, Testing). The video, gallery images and
  write-up can be the whole impression.

## Submission requirements

- A project built on Devvit (Devvit Web + Interactive Posts) that is a **daily game**.
- **Text description** of features and functionality (English).
- **App listing link:** `developers.reddit.com/apps/{app-name}`.
- **Demo post:** links to a) the test subreddit and b) a post running the game. The rules say to use a **public
  subreddit with fewer than 200 members** (or install `dr-admin-approve` so admins can join). The project must
  stay free to test **until the Judging Period ends** (Dec 16, 6 PM PT). There is no Dec 31 requirement; that's our own margin.
- **README.md** in the app root: detailed; describes the game and how to play.
- **Demo video:** optional in name, essential in practice (see Judging). Under 1 minute (judges needn't watch
  past 1:00), showing the game on its target device, public on YouTube, Vimeo, Facebook Video or Youku.
- The project "must function as depicted in the video and/or expressed in the text description". **Never show or
  describe a feature that doesn't work in the demo post.**
- Only materials we own or have licences for, **including in the video** (music, fonts, sounds).
- Optional: public repo; developer feedback survey (needed for the Feedback Award, due by Dec 8).
- **Do not submit the app for publishing.** Keep it private while testing; publish after the hackathon.
- New project, or an existing one significantly updated during the period (explain what changed).
- Projects that won a previous Reddit hackathon are ineligible.
- After the deadline the Devpost submission can't be changed (rules §5). The rules say nothing about app updates
  during judging, and unclear terms must be raised **in writing before the deadline** (rules §11). Email the hackathon manager.

## Payment and legal

- The prize is paid to the Representative after tax forms (W-8BEN for non-US residents) and verification.
  Forms are due within 10 business days; payment comes within about 60 days. Taxes are the winner's responsibility.
- Verification covers the winner's "identity, qualifications and role… in the creation of the Submission".
  Keep the git history from day one.
- Entrants keep their IP (subject to Reddit Developer Terms). Reddit gets a licence to use submissions for the hackathon.

## History: what won before, and the lessons

> The winner lists and lessons below come from team research and haven't been checked against the Devpost
> galleries (Devpost blocks automated access). Treat names as leads to look up, not facts.

Reddit has run roughly eight Devvit hackathons since Nov 2024. The closest match is **Daily Games #1
(Jan–Feb 2026, $40k, 525 projects)**. Its 14 winners included: BridgeDit (3D bridge-building with player
levels), Sneakle (Boggle × Battleship), SerpenTiles (daily hex tiles), Quipit (phrase puzzle), Fully Packed
(packing puzzle), Totalled (number expressions), Spectrum 6 (colour mixing), XO Math Puzzles,
Just Golf It, krawlings (pet care with a level creator), ModDesk 98, Just Meme It, Iso Chess and Monster Dating.

**Games with a Hook (Jun–Jul 2026):** 3,071 registrants and 700+ games (a record). Winners' lessons:
- *Hearthvale:* cut two finished features after playtests, rebuilt the tutorial three times, made the shared
  goal one big visible thing. "Every retention hook worked better shown than explained."
- *Delta-V Racing:* locked tracks with unlock dates build anticipation; a leaderboard per track.
- *Gradient Descent:* a daily level, a level editor, and players posting solution animations, so comparing
  approaches beats comparing speed.
- A first-time developer won $15k with a game he couldn't stop playing himself. The same developer's
  carefully planned second entry won nothing. Fun beats planning.

**Patterns among winners:** crisp, original puzzle mechanics (often mashups); a daily seed; creator tools / UGC;
small scope executed with polish; a visible community layer.

**Expect** 700 or more entries for 12 cash prizes for games (1,231 people had registered by day 4).

Reddit acquired **Syllo** (one of this hackathon's reference games) after featuring it, and its streak code is the
example in Reddit's own docs. It's the best single game to study.

---

<!-- FILE: docs/02-DEVVIT-PLATFORM.md -->

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
    "ensure-daily-post": { "endpoint": "/internal/scheduler/ensure-daily-post", "cron": "5 * * * *" },
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
(`"permissions": { "reddit": { "enable": true, "asUser": [...] } }` ✅).

**Triggers ✅** (all endpoints `/internal/...`): `onAppInstall`, `onAppUpgrade`, `onPostCreate`, `onPostDelete`,
`onPostSubmit`, `onPostUpdate`, `onPostReport`, `onPostFlairUpdate`, `onPostNsfwUpdate`, `onPostSpoilerUpdate`,
`onCommentCreate`, `onCommentDelete`, `onCommentSubmit`, `onCommentUpdate`, `onCommentReport`, `onModAction`,
`onModMail`, `onAutomoderatorFilterPost/Comment`. **There is no account-deletion trigger**, so per-user data must
expire on its own (rolling TTL ≤ 30 days).

## 6. User actions (acting as the player)

- Lets the app submit posts or comments, or subscribe, **as the logged-in user** instead of the app account.
- Declare it in `devvit.json`:

```jsonc
"permissions": { "reddit": { "asUser": ["SUBMIT_COMMENT", "SUBSCRIBE_TO_SUBREDDIT"] } }
```

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

---

<!-- FILE: docs/03-ARCHITECTURE.md -->

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

Internal: `/internal/scheduler/ensure-daily-post` (hourly), `/internal/triggers/app-install` (creates the hub and today's
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
3. **Scheduler `ensure-daily-post`** runs hourly (cron `5 * * * *`): compute today's UTC key. If `post:{d}` is missing:
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

---

<!-- FILE: docs/04-GAME-SPEC.md -->

# 04 — Game spec

> **How to use this file:** Section A is the **selected game**. To switch games, replace Section A with one of the
> concepts in Section C (or a new one) using the template in Section B, and log the switch in DECISIONS.md.
> Agents may refine anything here (see CLAUDE.md §4). Keep this file the single source of truth for the game.

**Current selection: SIESTA** *(v2, 2026-11-15. Confirmed or replaced after the Phase 0 prototype playtests. See PLAN Phase 0)*

---

## A. SIESTA: cats looking for shade

### A1. One-line pitch
Place a few buildings in a sunny little town so every cat is in shade at its nap time, and every flower stays in the sun all day.

### A2. Why it can win (per criterion)
- **Delightful UX:** you drag a building and its shadow slides along with your finger. When you solve it, the day
  plays back and the cats fall asleep one by one.
- **Polish:** a small, tractable scope, so time goes into feel, art and sound.
- **Reddit-y:** an original identity (no Reddit theming). Sunday towns are built by players and credited to them
  (creativity, meritocracy); "where everyone started" is revealed after you solve; streak flair; results shared in the
  daily thread; "challenge a friend" through Reddit's own share sheet.
- **Daily Content:** a new seeded town every day, a Mon→Sun difficulty curve, community towns on Sundays, and a recap
  of yesterday in each day's sticky comment.

### A3. Rules (v2. Tune in the Phase 0 prototype)
- **Board:** square grid. Tiles: ground, **cat** (with a nap-time badge), **flower**, **well**. A well is flat: you
  can't build on it and it casts no shadow. (It replaces v1's "rock", because players expect a rock to cast a shadow.)
- **Tray:** buildings with heights `1..k` (each height used once unless the day says otherwise).
- **Placing:** drag a building from the tray onto an empty ground tile. While you drag, its shadow for the current
  time of day follows your finger. Drop to place. Drag a placed building to move it, or back to the tray to remove it.
  **Tap-to-place also works** (tap a building, then a tile) for accessibility and mouse users.
  Buildings can't go on cats, flowers or wells.
- **Sun and shadows** (three times of day):
  - **Morning:** sun in the east → a building of height *h* shades the *h* tiles to its **west**.
  - **Noon:** sun high in the south → every building shades **1 tile** to its **north**.
    *(Prototype A/B against v1's `ceil(h/2)` tiles. Keep the rule that more fresh players can explain back correctly.)*
  - **Evening:** sun in the west → it shades the *h* tiles to its **east**.
  - Shadows pass over everything (cats, flowers, wells, other buildings). They stop at the board edge.
- **Cats** have a nap time badge (AM / noon / PM) and must be **in shade at that time**.
- **Flowers** must be **in sun at all three times**.
- **Solved** when every building is placed and all conditions hold.
- **Time toggle:** a Morning / Noon / Evening control; the shadows sweep across when you switch. A three-sun strip
  shows ✓/✗ for each time; counters show cats asleep and flowers lit. **The strip and counters update when a building
  is dropped, not during the drag.** The drag preview shows one time of day, so reasoning still matters.

### A4. Daily structure and difficulty curve (targets. The generator enforces them)
| Day | Grid | Buildings | Cats | Flowers | Wells | Solutions |
|---|---|---|---|---|---|---|
| Mon | 5×5 | 2 (h1,h2) | 2 | 2 | 0 | ≤ 3 |
| Tue | 5×5 | 3 | 3 | 2 | 0–1 | ≤ 2 |
| Wed | 6×6 | 3 | 3 | 3 | 1 | unique |
| Thu | 6×6 | 3 | 4 | 4 | 1 | unique |
| Fri | 6×6 | 4 | 4 | 4 | 2 | unique |
| Sat | 7×7 | 4 | 5 | 4 | 2 | unique |
| Sun | **Community town** (approved, from the Town Builder), else a hand-made team town or a 7×7 special | | | | | unique |

Target solve times for an engaged player: Mon under 90 s · Wed about 2–3 min · Sat about 4–6 min.

### A5. Scoring
- **Time is the score.** The clock runs only while the game is visible (it pauses on `visibilitychange`). It isn't shown
  during play (it's a siesta, not a race); it appears on the result card.
- **Hints** (max 2): lock one building onto its correct tile. Each adds 30 s.
- **Clean nap:** a mark for solving with no hints.
- **Leaderboard:** adjusted time (time + hint penalty), lowest first; ties go to whoever solved first.
- **Server checks:** reject a reported time longer than the server-measured time since this player's first progress
  save on this puzzle (plus slack), or faster than 2 s per building.
- Moves are still recorded (for "where everyone started" and stats) but don't affect the score.

*Why not moves, as in v1:* you could only see a shadow by placing a building, so trying ideas cost points, and careful
players all tied at par. Daily logic puzzles that thrive (LinkedIn's Queens, NYT's Pips) let you place freely and score by time.

### A6. Generator and solver (in `src/shared/engine`)
- **Generate:** seeded RNG(date) → pick grid/day params → place wells → place buildings randomly (valid tiles) →
  compute shadow sets AM/Noon/PM → choose cat tiles from shaded tiles with a nap time whose shadow covers them (prefer
  tiles shaded at only that time = more interesting) → choose flower tiles from always-lit tiles (prefer tiles near
  shadow edges = decoys) → strip the buildings → the solver counts solutions → accept if within the day's
  solution limit and difficulty band, else retry (cap attempts; log stats).
- **Solve:** backtracking, tallest building first; prune when a flower becomes shaded; at the end, check every cat.
  Return solution count (stop at limit+1) and search-node count. The same solver validates Town Builder submissions.
- **Difficulty grade:** a function of search nodes, decoy tiles, multi-time cats and the number of plausible first
  moves. Calibrate against prototype and playtest times; log both.
- **Town names:** two curated word lists in `content/town-words.json` (e.g. "Sleepy", "Little", "Upper" +
  "Harbour", "Market", "Steps"), combined by the seed. The Town Builder offers the same lists as a picker. No free text.

### A7. Screens
1. **Splash (inline, taps only, fits the post).** Wordmark, the town name, "No. 14, Monday 14 December", a small static
   drawing of today's town (from the puzzle, no solution), difficulty dots (1–7), my streak, "Town by u/…" on community
   days, and one call to action: "Play today's town". A returning solved player sees "Napped in 1:42. Streak: 7 days." and
   the button becomes "See results". On an **old daily post**: "This was No. 12." with a button "Go to today's town"
   (`navigateTo`) and a quieter "Play No. 12 anyway". With challenge share data: "A friend napped this town in 1:42."
   *(No middle-dot meta strings and no "→" on buttons: both are listed AI-design tells in `.claude/skills/frontend-design`.)*
2. **First-time tutorial (expanded).** Three tiny interactive boards: (1) one cat, one building, morning only
   ("Drag the house so the cat is in its shadow"); (2) the time toggle, with a noon cat; (3) a flower that must stay lit.
   Under 40 seconds, skippable, at most 15 words per step. Never a wall of text.
3. **Play.** Time toggle, board, three-sun strip, tray, counters. Hint, reset (with confirm), mute and "How to play"
   sit behind one small menu button. Everything fits the viewport; nothing else on screen.
4. **The siesta (the signature moment).** On solve, the sun sweeps morning → noon → evening in about 2.4 s. Each cat
   curls up as its shade arrives, the flowers open, then the light warms and the town settles. Then the result card
   slides up. Reduced motion: a 300 ms crossfade to the sleeping town. This is also the first shot of the demo video.
5. **Result (one card).**
   - Headline in the game's voice (e.g. "Little Harbour is asleep."), time, hints, streak.
   - **One** community line, small-N aware: "Most nappers started by the well (34%). You started by the harbour."
     Tapping "See where everyone started" shows the heat overlay on the board.
   - Primary: **"Post my result (as u/you)"**. It shows the exact comment text first, then replies under today's sticky comment.
   - Secondary: **"Challenge a friend"** (Reddit's share sheet).
   - Footer: countdown to the next town · "Join r/‹sub›" · "Yesterday's town".
6. **Archive (light).** A strip of the last 14 towns with my status. Past towns are playable (no streak credit).
7. **Town Builder.** See A8.

### A8. Community layer
- **Where everyone started:** `first:{d}` counts the tile of each player's first building drop. Shown only after
  solving. Under 10 players: "You're one of the first N to nap this town" instead of percentages.
- **Stats:** `stats:{d}` = solves, clean naps, time distribution buckets.
- **Streaks:** Reddit's bitfield pattern (PLATFORM §3), keyed by the puzzle's date. Opt-in flair: "Siesta streak N".
- **Share text** (spoiler-free; emoji are fine inside a comment), two short lines:
  `Siesta No. 14, Little Harbour: asleep in 1:42, no hints. Streak: 7 days.` / `🌅✓ ☀️✓ 🌇✓`
- **Challenge a friend:** `showShareSheet({ text: "I put every cat in Little Harbour to sleep in 1:42. Your turn?",
  data: '{"d":"2026-12-14","t":102}' })`. The recipient's splash reads it with `getShareData()`. Show it only if `d`
  matches the post's date, and never show a name from share data (it can be faked).
- **Daily recap:** each day's sticky comment opens with yesterday's real numbers ("Yesterday 23 nappers put Hilltop
  Market to sleep. Quickest: 0:58.") and invites results below. Small-N wording when few played.
- **Town Builder (creativity and meritocracy, a core feature):**
  - Build on a 6×6 grid: place cats (pick each nap time), flowers, wells and 2–4 buildings. Live shadows help.
  - **"Test it":** the buildings go back to the tray and you must solve your own town.
  - The server proves it has **exactly one** solution with the solver. The name comes from the word picker.
  - Submit → queued for the mods. Mods approve or reject from the subreddit menu ("Review community towns").
  - Approved towns run on Sundays (oldest approved first), credited "Town by u/author" on the splash, the result card and
    the sticky comment. Fallback: a hand-made team town, credited to the team.
  - After solving a community town, a player can tap **"Lovely town"** once. The author sees the count in their builder
    list ("loved by 41 nappers"). Opt-in flair: "Town maker".
  - Authors can delete their own towns at any time. Every community town has "Report this town".
  - **Ship it by Dec 2** so playtesters (r/Devvit Feedback Friday, Dec 4) make real towns before judging.
    Sunday Dec 13 falls inside the judging window.

### A9. Stretch twists (only after core polish; pick at most one)
- **Trees** (fixed buildings you can't move), **awnings** (shade at noon only), a **sleepy dog** (must be in
  sun), a **lantern-lit night** puzzle on Saturdays.
- A custom share image per daily post (`shareImageUrl`), if `media.upload` works with a bundled image.

### A10. Art and audio direction: "print-shop siesta" (a human signs this off in Phase 0–1)
- **Look:** a riso-style print of a whitewashed town at noon: a sun-baked yellow board, white houses and cats drawn in
  one blue ink, pink flowers. Flat shapes, ink outlines, optionally a fine grain (one small tiled texture, not a CSS filter).
- **Shade is hatching.** Shadows are diagonal blue hatching over the yellow ground, not just a darker fill. It reads
  instantly, doesn't depend on colour (colour-blind safe by texture and lightness), and gives the game a look no other
  entry will have. Sunlit tiles stay clean yellow.
- **Palette (candidate, used in the Phase 0 prototype):** whitewash sky `#E9EFF6`, blue ink `#1B2766`, shade blue
  `#2F49A6`, sun yellow `#F3C94F`, deep sun `#E0A91F`, flower pink `#E8378A`, well water `#9CC6EA`, white `#FFFFFF`.
  *v1's sand + terracotta palette was dropped:* "warm cream background, high-contrast serif display, terracotta accent" is
  the first AI-design cliché listed in `.claude/skills/frontend-design`. Don't drift back to it.
- **Type:** one display face with character plus one readable text face, both OFL and bundled. **Not** Fredoka, Nunito,
  Poppins, Inter or Montserrat (the faces AI tools default to), and not a high-contrast editorial serif. A human picks
  from a shortlist of three, seen on the real board.
- **Drawn by a human (SVG):** the cats (awake, curling, asleep), four building heights, the flower (open, wilted), the
  well and the wordmark. If AI helps with sketches, a human redraws them in one consistent hand.
- **Reference board:** 5–10 images in `docs/references/` (prints, posters, picture books), for direction only, never to copy.
- **Motion:** the shadow tracks the drag with no lag; time switch sweep 300 ms ease; cats curl; flowers wilt in shade and
  reopen in sun; the siesta sequence (A7.4). Respect reduced motion.
- **Sound:** a soft wooden "tok" on drop, a paper slide on lift, a purr when a cat falls asleep, a low chime on solve;
  ambient cicadas off by default. Sound starts after the first tap, has a mute button, and mutes when the page is hidden.

### A11. Journeys mapping
`App.Ready` (board interactive) · `Journey.Start` (call `startJourney()` on the player's first committed action in the
game view, i.e. the first drop or first time switch; never on load, and always before any other telemetry call, because
`progress()`/`interaction()` auto-start a journey) · `Journey.Progress` (fraction of conditions satisfied, only on
improvement, at most about 10 per session) · `Journey.Interaction` (`time_toggle` throttled, `hint_used`, `lift`,
`share_clicked`, `challenge_clicked`, `subscribe_clicked`, `tutorial_done`, `town_submitted`) · `Journey.End` (sent by the
**server** from `/api/submit` with the verified score: `complete: true, game: { win: true, score }`).

### A12. Risks and mitigations
- *Not fun* → the Phase 0 prototype and 5 silent playtests come before any infrastructure (go/no-go in PLAN).
- *Too easy with live previews* → previews show one time of day; the strip and counters update on drop; Saturday adds
  cats and wells. Tune in the prototype.
- *Noon rule feels arbitrary* → A/B it in the prototype; show the sun's position on the toggle.
- *Looks generic* → hatching and the print look, a human-drawn tile set, human-picked type, human-written copy.
- *Town Builder empty during judging* → ship by Dec 2, invite playtesters, honest team towns as fallback.
- *User-made content rules* → structured input, picked names, mod approval, author delete, report button. Ask the Devvit
  team whether each town also needs a comment posted as its author.

---

## B. Template for any game (fill this to switch)

```
## A. <NAME>: <subtitle>
A1 Pitch · A2 Why it can win (4 criteria) · A3 Rules · A4 Daily structure/curve table · A5 Scoring
A6 Generator + solver (how solvability and difficulty are proven) · A7 Screens (splash, tutorial, play, solve moment,
result, archive, editor) · A8 Community layer (aggregates, share text, challenge, flair, UGC) · A9 Stretch twists
· A10 Art/audio · A11 Journeys mapping · A12 Risks
```

---

## C. Alternative concepts (condensed. Expand with the template if chosen)

### C1. STILL WATER: ripples that interfere
- **Rules:** an N×N pond; place K stones on open water. Each stone adds **+1** to tiles at Manhattan distance 1 and
  **−1** at distance 2; effects sum. Each lily pad shows a target (e.g. 2, 1, 0, −1); it **blooms** when its water
  level equals the target. Stones can't be placed on pads. Solved when all pads bloom.
- **Generator:** place stones randomly → compute levels → put pads on tiles with interesting sums (prefer
  interference tiles) → the solver confirms a unique solution.
- **Community:** first-stone heatmap; a weekly shared pond that blooms as the community solves; share as a ripple pattern.
- **Risk:** the rule needs a strong interactive tutorial; a depth-number overlay (toggle) helps.

### C2. TIDEPOOL: keep the ecosystem alive
- **Rules:** a rock-pool grid with fixed rocks and algae; place today's creatures. Each species has one adjacency rule
  (crab eats smaller orthogonal neighbours; snail needs algae beside it; anemone stings adjacent fish; starfish must
  touch a rock; glass shrimp must be next to an anemone). Press "Let the tide in" to check; all must survive.
- **Generator:** constraint satisfaction; the solver counts placements; species mix per weekday.
- **Community:** a weekly **species workshop**: players compose a new species from predefined rule parts; votes
  choose the next week's species.
- **Risk:** art volume (6–10 creatures); rule balance.

### C3. HIVEMIND: sort it the way everyone else would (evolved from our Label Hunt)
- **Rules:** a daily prompt with three jars (e.g. Breakfast / Lunch / Dinner) and 12 items. Sort freely; jars hold any
  number. Lock in. **Score = average share of players who agreed with each of your placements.**
- **Fairness:** score against the live distribution at lock time, re-score at day end ("final hive score") and show both.
  Seed day 1 with team plus playtester answers.
- **Community:** the most divisive item; a "you went against the hive" list; comment prompts; player-submitted
  prompts from predefined item packs.
- **Risk:** may read as a Connections clone at a glance. The splash must say "no right answers". Needs crowds; small-N
  copy matters. A lone judge in a small subreddit sees little of what makes it good.

### C4. NIGHT SHIFT: light the ward, one vote per hour
- **Rules:** a 5×5 grid; a light source enters from an edge; mirrors (`/`, `\`) rotate on tap; lamps light when the beam
  passes through them. Light every lamp. **Each hour the community votes which mirror locks**; locked tiles freeze
  for everyone for the rest of the day, so the board evolves.
- **Generator:** design the path → place lamps on it → add decoy mirrors → the solver ensures the puzzle is solvable
  for every plausible lock outcome (or only offer lockable tiles that keep it solvable).
- **Community:** hourly votes (realtime or polling), "lit by X% tonight", Night Owl flair.
- **Risk:** the most complex; the vote loop must still be fun for one judge in a tiny subreddit (a solo fallback: you
  can vote and see your lock apply).

---

<!-- FILE: docs/05-PLAN.md -->

# 05 — Build plan (Nov 15 → Dec 8, 2026)

All dates are IST. **Submit by Tue Dec 8, 21:00 IST** (the real deadline is Wed Dec 9 07:30 IST).
Each phase has **exit criteria**. Don't start the next phase's big work until they're met; if a phase slips,
cut scope (see "Cut list"), not polish time.

**The order matters:** prove the game is fun first (Phase 0), then build infrastructure. Past winners' lesson:
"a game he couldn't stop playing himself" beat a carefully planned one.

## Roles (one person can hold several)

| Role | Owns |
|---|---|
| **Lead / integrator** | repo, devvit.json, server, scheduler, Redis, deploys, final say on scope |
| **Game designer / content** | prototype playtests, rules tuning, generator calibration, difficulty curve, town words, tutorial script, **all player-facing copy** (`copy.ts`) |
| **Art and audio** | reference board (by Nov 18), hatching style test (by Nov 22), final tile set and wordmark (by Nov 30), type choice, SFX |
| **QA and submission** | device matrix, playtests, demo subreddit, video and gallery images, README, Devpost text, checklist |

Agents (Claude Code) do most of the implementation. Humans decide, play, judge feel, draw the art and write the words.

---

## Phase 0: Prove the fun, and set up (Sun Nov 15 – Tue Nov 17)
- **Prototype (an agent, about one day):** `prototype/siesta.html`, a single file with no build and no Devvit. It has the
  board, drag with a live shadow preview, tap-to-place, the time toggle, the three-sun strip and counters, and about
  10 puzzles across the weekday bands (a quick inline generator or hand-made). Shade drawn as hatching (to test
  readability). A switch for the noon rule (1 tile vs `ceil(h/2)`). It logs solve times on screen. Plain shapes, no art.
- **Playtest (humans, about one day):** 5 people who've never seen it, on their own phones, watched silently. Record
  time to the first correct placement, whether they understood noon, whether they solved it without help, and whether
  they wanted another.
- **Go/no-go:** GO if at least 4 of 5 solve a Monday puzzle without help in under 2 minutes, at least 3 of 5 play on or
  ask for another, and at least 4 of 5 can explain the rule in one sentence afterwards. Otherwise spend one day on
  changes and retest. If it's still a no, switch to the strongest alternative in GAME-SPEC §C and redo Phase 0.
- **In parallel:** install Node 24+, the Devvit CLI and Claude Code; create the app from the official template;
  **`git init` and commit on day one** (authorship evidence); create a **dev subreddit** (private) and a **demo
  subreddit** (public, under 200 members, a neutral name tied to the game). Art: start `docs/references/`.
- **Ask now** (Devvit Discord / r/Devvit; email the hackathon manager for #3):
  1. Journeys allowlisting and journey-map approval for our app.
  2. Whether user actions (`runAs: 'USER'`) can be enabled for hackathon apps before publishing.
  3. **In writing:** may we upload bug fixes to the app during judging? (Rules §11: raise unclear terms before the deadline.)
  4. Do Reddit-hosted images (snoovatars) load inside the webview, given the client CSP?
  5. Is a structured, mod-approved community town with an in-app report button enough for the user-content attribution
     rule, or does each town need a comment posted as its author?
- **Exit:** go/no-go and the noon-rule choice recorded in DECISIONS.md; the template runs in playtest on desktop and a
  phone; the repo with this kit is committed.

## Phase 1: Engine and vertical slice (Wed Nov 18 – Sat Nov 21)
- `src/shared/engine`: types, rules, seeded RNG, solver, generator, difficulty, scoring, town validation. Unit tests.
- `scripts/generate-puzzles.ts` + `validate-bank.ts`; generate the bank **Nov 17, 2026 → Dec 31, 2027**.
- Minimal client: the inline splash (taps only) → expanded game with drag and a live shadow preview; `/api/init` and
  `/api/submit` with server re-validation; the hub post (created by the install trigger or menu).
- Check whether snoovatar images load in the webview; record the result.
- **Exit:** anyone on the team can open the hub post on a phone, play today's town and see a solve validated by the
  server. The bank validates for every date.

## Phase 2: Reddit layer (Sun Nov 22 – Thu Nov 26)
- The hourly idempotent `ensure-daily-post` scheduler, the app install trigger, the mod menu items, the sticky comment
  with yesterday's recap, and the pinned hub post.
- Redis services per ARCHITECTURE §3 with TTLs: progress, results, streak bitfields, leaderboard, first moves, stats, settings.
- The result card with real data and small-N states. "Post my result (as u/you)" with a text preview, "Challenge a
  friend" (share sheet + recipient banner), subscribe, opt-in flair, report-a-problem form.
- Journeys through a wrapper that no-ops until allowlisted; the server ends the journey in `/api/submit`.
- **Install the app in the demo subreddit by Nov 26**, so real daily history builds up (each upload updates it).
- **Exit:** 3 consecutive real days have auto-posted in the dev sub with no human action; streaks increment correctly;
  the share comment lands under the sticky comment; every state has screenshots; no screen scrolls.

## Phase 3: Beauty, feel and the Town Builder (Fri Nov 27 – Wed Dec 2)
- **Fri Nov 27:** post the working build to r/Devvit's Feedback Friday for early feedback on feel.
- Apply the art direction (GAME-SPEC §A10): hatching, the print look, the human-drawn tile set, the chosen type and
  palette. A human writes `copy.ts`.
- Motion and sound: drag feel, time sweep, **the siesta moment**, cats and flowers reacting, mute, reduced motion.
- The interactive tutorial (playing is learning), the "How to play" sheet, contextual hints on idle or repeated mistakes.
- **Town Builder** end to end: build → test it → submit → solver check → mod review → Sunday calendar → credit, loves,
  delete, report. **Ship by Dec 2.**
- The archive (light).
- Difficulty calibration: 5+ fresh humans per weekday band; adjust the grade; regenerate the bank.
- **Wed Dec 2:** record a rough phone video of the game to see what reads on screen.
- **Exit:** a first-time player solves Monday's puzzle without help in under 2 minutes; the visuals pass
  `06-QUALITY-BAR.md`; no placeholder art or copy remains; the Town Builder works end to end in the demo sub.

## Phase 4: Playtest, polish, freeze (Thu Dec 3 – Sat Dec 5)
- **Fri Dec 4:** post to r/Devvit's Feedback Friday (and friends), inviting people to build a town for the coming Sundays.
  Watch the Journeys dashboard if it's enabled.
- Fix the top-10 friction points. Performance pass: Lighthouse above 80 on the splash, bundle budgets, a mid-range Android.
- Device matrix: Reddit iOS app, Reddit Android app, mobile web, desktop Chrome/Safari/Firefox. Inline and expanded.
- Approve the first real community towns so Sun Dec 6 and Sun Dec 13 (judging week) run player-made towns.
- **Feature freeze: Fri Dec 4, 23:59 IST.** After this, bug fixes, copy and town approvals only.
- **Exit:** zero known crash bugs; every quality-bar item checked; the bank validated through Dec 31, 2027.

## Phase 5: Ship (Sun Dec 6 – Tue Dec 8)
- Demo subreddit: the final version installed; the hub post pinned; today's post and sticky comment exist; public with
  under 200 members; the sidebar explains the game; real daily posts since about Nov 26; a real community town has run (Dec 6).
- **Sun Dec 6:** record the final video (under 60 s) and 4–6 gallery images from the demo sub on a phone. Captions;
  no music unless we own it. Show only what works.
- README.md (Devvit Rules + hackathon requirements), the Devpost write-up.
- The developer feedback survey (Feedback Award, due Dec 8). Keep helping others on Discord (Helper Award).
- Run `07-SUBMISSION-CHECKLIST.md` end to end, then a **fresh-eyes review** (prompts/02) by a new agent and by a human who
  hasn't seen the game. Include the "judge from the video and text only" pass.
- **Submit Tue Dec 8 by 21:00 IST.** Screenshot the confirmation. Then don't touch the app, unless the organizers
  confirmed in writing that bug fixes are allowed.

---

## Cut list (cut in this order if late)
1. Stretch twists (A9) · 2. Custom share image · 3. Archive (keep "Yesterday's town" only) · 4. Leaderboard view (keep
the one community line) · 5. Flair · 6. "Lovely town" votes (keep build → test → submit → approve → Sunday) ·
7. Ambient audio.

**Never cut:** the tutorial, the siesta moment, polish, server validation, auto-posting, the hub post, small-N states,
the Town Builder core, README, video. If the Town Builder truly isn't working on Dec 2, Sundays run team-made towns,
credited honestly to the team. Never fake a player's credit.

## Risk register
| Risk | Mitigation |
|---|---|
| The core isn't fun | Phase 0 prototype and silent playtests before infrastructure; go/no-go criteria; a switch plan |
| Judges only watch the video and read the text | Treat them as product: rough video Dec 2, final Dec 6, gallery images, show the signature moment first |
| Journeys not approved in time | Request it in Phase 0; the wrapper no-ops; mention it in the README |
| `runAs USER` inactive for judges | Build it properly; the share text includes the result; explain in the README |
| Bug found during judging | Ask the organizers in writing now; until they say yes, ship nothing after the deadline |
| Scheduler timezone/drift | Hourly idempotent job + mod menu + date-keyed content + the hub post |
| Town Builder empty during judging | Ship by Dec 2; invite playtesters Dec 4; honest team towns as fallback |
| User-made content rules | Structured input, picked names, mod approval, author delete, report button; ask the Devvit team |
| Inline rejected (scroll trap, slow) | Taps only inline, no internal scroll, Lighthouse above 80, first content under 1 s |
| Settings lost on app updates | Settings and progress in Redis; localStorage only for logged-out play |
| Devvit outage near the deadline | Submit 10 h early; keep a working uploaded version at all times |
| Scope creep | Feature freeze Dec 4; cut list |
| "Looks AI-made" | Human-owned art direction, human-drawn tiles, human-written copy, no default fonts or gradients |
| Single-judge experience feels empty | Small-N copy; real history from about Nov 26 in the demo sub; a real community town; the puzzle is fun solo |

---

<!-- FILE: docs/06-QUALITY-BAR.md -->

# 06 — Quality bar (the standard every screen must pass)

Judges score **Delightful UX** and **Polish** directly, and Delightful UX breaks ties. They open the post on a phone,
cold. Some will only watch the video. These checks decide prizes.

## First 10 seconds (the splash, inline in the feed)
- [ ] Within 2 seconds you can tell the name, what kind of puzzle it is, today's number/date, and what to tap.
- [ ] One primary call to action. No secondary clutter competing with it.
- [ ] First content in under 1 second; Lighthouse mobile above 80. Skeletons, not blank space or spinners.
- [ ] **Taps only.** No drag, no internal scrolling, no gesture handlers. The feed scrolls past it normally.
- [ ] Returning players see their status (solved today? streak?).
- [ ] An old daily post points to today's town ("Today's town is up →") but can still be played.
- [ ] It looks great in a feed thumbnail-sized crop.

## Onboarding
- [ ] Learn by doing: the first board teaches the rule. Text under 15 words per step.
- [ ] Contextual hints appear where the player is stuck (idle 20 s, or repeated wrong drops).
- [ ] Skippable for returning players; "How to play" is always reachable in one tap.
- [ ] "Tutorial done" is stored in Redis (localStorage is wiped on app updates).

## Play
- [ ] **Every screen fits the viewport with no page scroll** (360×640 and up), inline and expanded.
- [ ] The dragged building's shadow tracks the finger with no visible lag (60 fps on a mid-range Android).
- [ ] Every tap or drop gets feedback within 100 ms (visual + optional sound).
- [ ] Invalid actions explain themselves (a gentle shake + reason), never silent.
- [ ] Moving or removing a building is always possible; no dead ends; Reset is confirmable.
- [ ] Progress is visible (counters, three-sun strip). The win condition is always clear.
- [ ] Nothing on screen during play that isn't needed for play.
- [ ] Closing and reopening resumes exactly where you left off (server-side progress).

## The end state
- [ ] **The signature moment plays** (the siesta: the day sweeps, the cats fall asleep in turn) and it's short (about 2.4 s).
- [ ] ONE result card: outcome, key stats, streak, **one** community line, one primary next step (post my result) and one
      secondary (challenge a friend). Countdown, Join and Yesterday's town sit in a quiet footer.
- [ ] Shares are spoiler-free, look good as a Reddit comment, and the player sees the exact text before posting.
- [ ] Reopening after solving goes straight to the result card.

## Visual craft
- [ ] A coherent, nameable art direction (one palette, one type pairing, one illustration style). For Siesta: the print look with hatched shade.
- [ ] Text contrast ≥ 4.5:1 (3:1 for 24 px+); states differ in **lightness or texture**, not just hue (colour-blind safe).
- [ ] Tap targets ≥ 44×44 px; comfortable thumb reach; works at 360 px wide.
- [ ] Consistent spacing scale (4/8 px), radii and shadows. Pixel-aligned icons (inline SVG).
- [ ] Motion has purpose (explains cause → effect), 150–400 ms, eased; reduced motion respected.
- [ ] Sound is subtle and short, starts only after the first interaction, mutes when the page is hidden, and the mute choice persists.

## Anti-AI-slop checklist (Reddit explicitly penalises this)
Reddit's own words: "it shouldn't be obvious the moment we open your app. **Fit the UI in the viewport**, give your
app a unique identity, make it accessible, and make sure you're thinking of your human players."
- [ ] Fits the viewport on every screen (above). Nothing overflows, nothing needs scrolling.
- [ ] No generic purple-to-blue gradients, glassmorphism cards or "glow" everywhere.
- [ ] No emoji used as UI icons; no stock icon sets mismatched with the art.
- [ ] No default Tailwind/shadcn look left untouched; no Inter-on-white template feel. No Fredoka, Nunito, Poppins,
      Inter or Montserrat as the display face.
- [ ] The art is drawn by a human in one consistent hand. Any AI-assisted sketch has been redrawn.
- [ ] **Every player-facing string was written or approved by a human** (`copy.ts`). No lorem ipsum, no "Welcome to
      the game!", no "Great job!", no exclamation-mark spam.
- [ ] Copy has a voice that fits the theme (Siesta: warm, sleepy, gently funny).
- [ ] Restraint: no feature on screen that a judge would have to be told about. Fewer, better things.
- [ ] None of the template tells listed in `.claude/skills/frontend-design`: cream background + editorial serif +
      terracotta accent; tracked-out ALL-CAPS eyebrow labels; meta strings joined with middle dots ("A · B · C");
      a "→" appended to button text; identical rounded cards with the same soft grey shadow; fade-and-slide-up on every
      element. One orchestrated moment (the siesta) instead of scattered effects.

## Reliability
- [ ] No console errors. Works logged-out (full play, a gentle note that progress isn't saved, login offered after solving).
- [ ] Network failure → retry plus a friendly message; results are never lost.
- [ ] Tested on the Reddit iOS app, the Reddit Android app, mobile web and desktop (Chrome, Safari, Firefox).
- [ ] Mid-range Android: interactive in under 2.5 s on 4G.

## Content
- [ ] Every daily puzzle is solver-verified; the difficulty curve is sane across a week; no repeats.
- [ ] The bank covers through Dec 31, 2027; the fallback generator is tested.
- [ ] Every community town that runs has exactly one solution, an author credit, and a report button.

---

<!-- FILE: docs/07-SUBMISSION-CHECKLIST.md -->

# 07 — Submission checklist (run end to end on Dec 7, again on Dec 8)

Requirements come from `docs/sources/devpost-rules.md` §4. Re-read that file once before submitting.

## The app
- [ ] The latest version is uploaded (`npm run deploy` / `devvit upload`). **Not published.**
- [ ] The app listing link works: `https://developers.reddit.com/apps/<app-name>`.
- [ ] `devvit.json` has `marketingAssets.icon` (1024×1024 PNG, our own art).
- [ ] README.md in the root: what it is, how to play, the daily schedule, community features (Town Builder, shares,
      challenges, streaks), mod tools (menu items), configuration, data and privacy (30-day expiry), known limitations
      (Journeys / user-action approval status), contact/report. ≤ 1,000-word overview. Uses the event's real name:
      "Reddit's Game of the Day Hackathon".
- [ ] No Reddit trademarks, no Snoo, no third-party IP; an original name and icon.
- [ ] No external fetch, no off-platform links, no automated posting as the user; sharing is optional.
- [ ] Report-a-problem works. Community towns can be reported and deleted by their authors.
- [ ] Deletion handling: `onPostDelete` implemented; every key with a user ID has a TTL ≤ 30 days (45 for unrun towns).
- [ ] The inline splash: taps only, no scroll, Lighthouse mobile above 80.

## The demo subreddit
- [ ] Public, **fewer than 200 members** (or private with `dr-admin-approve` installed).
- [ ] **The pinned "Today's town" hub post exists and shows today's town.** This is the demo link.
- [ ] Today's daily post exists with its sticky comment (with yesterday's recap); the sidebar explains the game.
- [ ] Real history from about Nov 26 is visible (several daily posts). At least one real player-made community town has
      run. No fake numbers anywhere.
- [ ] The scheduler is verified to create the next posts (check `post:{d}` keys / the mod menu fallback).
- [ ] An approved community town is queued for Sun Dec 13 (judging week), or a team town is ready and honestly credited.
- [ ] The content bank runs through Dec 31, 2027. The fallback generator is tested.

## Devpost form
- [ ] Project name, tagline, a thumbnail image (it looks great small).
- [ ] **4–6 gallery images**: phone screenshots of the splash in the feed, a drag with the live shadow, the siesta
      moment, the result card, the Town Builder. Judges may score from these alone.
- [ ] Text description: what it is, how to play, why it's a daily game, Reddit-native features (Journeys, flair,
      comments, streaks, user actions, share sheet, scheduler, Town Builder), what's new vs any prior work, the tech stack.
      **Describe only what works in the demo post** (rules: the project must "function as… expressed in the text description").
- [ ] App listing link · **demo post link (the hub post)** · demo subreddit link · team members' Reddit usernames.
- [ ] Demo video **under 60 s**, public on YouTube or Vimeo, showing the phone in the Reddit app. The first 5 seconds show
      the drag with the live shadow, not a title card. Captions. **No music unless we own it or it's licensed.**
      Show only features that work in the demo post.
- [ ] If it's a port of our own IP: tick/note "ported" (for the Best Ported category).
- [ ] Optional: public repo link. The developer survey is submitted (Feedback Award, due Dec 8).
- [ ] English everywhere.

## Final fresh-eyes pass
- [ ] A person who has never seen it opens the demo post on their phone and solves it without help.
- [ ] Someone who hasn't played it watches only the video and reads only the Devpost text, then explains the game back.
      If they can't, fix the video or text.
- [ ] Run prompts/02 with a fresh agent; fix anything rated "blocker".
- [ ] We have a written answer (or none) about bug fixes during judging, and know which applies.
- [ ] Submit **by Dec 8, 21:00 IST**. Screenshot the confirmation. **No changes after submitting** unless the organizers
      confirmed in writing that fixes are allowed.

---

<!-- FILE: docs/08-TOOLS.md -->

# 08 — Tools

## Core (everyone on the team)
| Tool | Why |
|---|---|
| **Claude Code** (terminal; VS Code extension optional) | The main build agent. Run it in the repo root so it loads CLAUDE.md. Use a fresh session for reviews. |
| **Node.js 24+** via nvm (nvm-windows on Windows) | Devvit requirement |
| **Devvit CLI** + an official **Devvit Web template** (`npm create devvit@latest --template=react` or `phaser`) | build, playtest (`npm run dev`), upload (`npm run deploy`) |
| **Git + a private GitHub repo** (+ `gh`) | history, branches, one branch per agent task. Start on day one: the history is our authorship evidence |
| **Reddit accounts** for each teammate, plus the **Reddit app on iOS and Android** | real-device testing is mandatory |
| **Devvit Discord + r/Devvit** | official answers (Journeys approval, user actions), office hours, Helper Award |

## Agent add-ons (`.mcp.json` in this kit)
| MCP server | Why |
|---|---|
| `@devvit/mcp` (Reddit's official) | gives agents current Devvit docs and tools. **The #1 defence against made-up APIs.** |
| `@playwright/mcp` | lets the agent open the game, click through it and screenshot phone sizes |
| `@upstash/context7-mcp` (optional) | up-to-date docs for React, Vite, Phaser and other libraries |

## In the codebase
TypeScript (strict) · Vite (from the template) · **React** for the expanded game (or **Phaser 4** if the game needs
sprite animation) · plain TS (or Preact) for the inline splash to stay under 50 KB · `node --test` (engine tests, set up by the template) · Playwright
(visual tests, including a "page must not scroll" check) · Lighthouse in Chrome DevTools (splash score above 80) · ESLint + Prettier.
Avoid Unity/Godot/GameMaker for this game: bigger bundles and slower first load in the feed, with no benefit for a grid puzzle.
Phase 0's `prototype/siesta.html` is plain HTML + JS with no build step, so anyone can open it on a phone.

## Art, audio, video
| Need | Tool |
|---|---|
| UI and tile design | Figma (free), or our Claude Design concept board as the starting reference |
| Vector art | Inkscape (free) / Affinity Designer; Aseprite if you go pixel art |
| Fonts | OFL fonts downloaded and **bundled** (not linked); subset with `pyftsubset` (fonttools) to woff2. A human picks from a shortlist of three seen on the real board. Avoid the AI defaults (Fredoka, Nunito, Poppins, Inter, Montserrat) |
| Print look | a hatching pattern as an SVG `<pattern>`; one small tiled paper-grain WebP (not a CSS filter, too slow on phones) |
| Image optimisation | SVGO, Squoosh |
| Sound effects | jsfxr / ChipTone (generate), Freesound (CC0 only; keep a licence list), Audacity (trim/normalise) |
| Demo video | the phone's built-in screen recorder → CapCut or DaVinci Resolve; captions; upload public to YouTube. No music unless we own it or it's licensed (the rules cover the video too) |

## Don't use
- AI image generators for final art (it reads as AI slop). Fine for mood boards only.
- Runtime LLMs, external APIs or CDNs (Devvit Rules approval burden and failure risk).
- `devvit publish` before Dec 17.

---

<!-- FILE: prompts/00-KICKOFF.md -->

# Kickoff prompt: paste this into Claude Code (or any coding agent) at the start

Run it from the root of the new Devvit project, after copying this kit into it (CLAUDE.md, AGENTS.md,
docs/, prompts/, .mcp.json, .claude/) and running `git init` + a first commit.

---

You are the lead engineer and game developer on a small team building a daily puzzle game for Reddit's Game of the
Day Hackathon. We want to win **Best Daily Game**. Quality and feel matter more than feature count.

**First, read** `CLAUDE.md`, then every file in `docs/` (01 to 08) and `docs/sources/` (the official Devpost pages).
The selected game is defined in `docs/04-GAME-SPEC.md`, Section A. Treat the docs as a strong starting point, not a
cage: the non-negotiable constraints are in CLAUDE.md §3; everything else you may improve if you log the reason in `DECISIONS.md`.

**Step 1: verify our Devvit assumptions.** Use the `devvit` MCP server (and the official docs) to check every item in
`docs/02-DEVVIT-PLATFORM.md` not marked ✅, especially: the `devvit.json` schema in the template you were given (entry
points and the `inline` flag, permissions, scheduler, triggers, menu items, `marketingAssets`), comment sticky/distinguish,
user flair, `showShareSheet`/`getShareData`, and the template's server framework (Express or Hono). Write findings and
corrections in `DECISIONS.md` and fix the docs.

**Step 2: review the game as a designer.** Read `docs/04-GAME-SPEC.md` §A critically. Is the core loop fun in 60 seconds?
Is the rule readable on a phone? Does the live drag preview make it too easy? Propose concrete changes; adopt the ones that
clearly help (log them). Keep it short.

**Step 3: build the Phase 0 prototype** (`docs/05-PLAN.md`, Phase 0): `prototype/siesta.html`, a single self-contained file
with no build step and no Devvit. It needs:
- a board that fits a phone screen, buildings dragged from a tray with the current time's shadow following the finger,
  and tap-to-place as an alternative;
- the Morning / Noon / Evening toggle, the three-sun strip and the counters (updated on drop);
- shade drawn as diagonal hatching;
- a noon-rule switch (1 tile vs `ceil(h/2)`), shown as a small toggle for the playtest host;
- about 10 puzzles across the weekday bands, each verified solvable by a small inline solver;
- an on-screen log of solve time and number of drops per puzzle.

Plain shapes, no art, no frameworks. It's a throwaway: speed over structure, but it must feel smooth on a phone.

**Then stop** and tell me: how to open the prototype on a phone, what to watch for in the playtests, and your design
review. The humans run the playtests and make the go/no-go call before Phase 1 starts.

**Working rules:** small commits; update `PROGRESS.md` at the end of every work session; never run `devvit publish`;
no external fetch, no runtime AI, no CDNs; never fabricate stats in the UI. When something is subjective or hard to
undo, ask me; otherwise decide, log it and keep going.

---

<!-- FILE: prompts/01-PHASE-PROMPTS.md -->

# Phase prompts: paste one at the start of each phase (after the kickoff)

Each prompt assumes the agent has CLAUDE.md loaded and can read docs/, PROGRESS.md and DECISIONS.md.

---

## Phase 0b: Apply playtest results (after the prototype playtests)

Here are the playtest notes: <paste: player, puzzle, time, drops, understood noon? solved without help? wanted another? quotes>.
Compare them with the go/no-go criteria in `docs/05-PLAN.md` Phase 0. Tell me plainly whether it's a GO. Record the
decision and the noon-rule choice in `DECISIONS.md`, update `docs/04-GAME-SPEC.md` §A to match what we learned, and list
the three biggest feel problems to solve in the real build.

---

## Phase 1: Engine and vertical slice

Read `PROGRESS.md`, `DECISIONS.md`, `docs/03-ARCHITECTURE.md` and `docs/04-GAME-SPEC.md` §A. Write a Phase 1 task list in
`PROGRESS.md` (ordered tasks, files touched, tests, done-check), then build it:
1. A pure engine in `src/shared/engine` with unit tests (`npm run test:unit`): rules (shadows, evaluation), seeded RNG, solver (counts
   solutions, stops at limit+1), generator, difficulty, scoring (time + hints), town validation.
2. `scripts/generate-puzzles.ts` and `scripts/validate-bank.ts`; generate the bank from 2026-11-17 to 2027-12-31 and
   validate every date.
3. The inline splash entry (taps only, tiny bundle) → the expanded game entry with drag and a live shadow preview,
   tap-to-place, the time toggle, the strip and counters.
4. Server: `/api/init` (resolves the date for daily posts and for the hub post; never sends the solution) and
   `/api/submit` (replays placements with the engine, validates, checks time, stores the result).
5. The hub post: created by the install trigger or a mod menu item, `postData: { kind: 'hub' }`.
6. Check whether snoovatar images load inside the webview (client CSP) and record the answer in `DECISIONS.md`.
Keep it running in playtest (`npm run dev`) at every step. Screenshot at 360×640, 390×844 and 1280×800 and look at them.

---

## Phase 2: Reddit layer

Read `PROGRESS.md`, `DECISIONS.md`, `docs/03-ARCHITECTURE.md` §3–§8 and `docs/02-DEVVIT-PLATFORM.md` §3–§9.
Phase 1 is done. Build Phase 2 of `docs/05-PLAN.md`:
1. The hourly idempotent `ensure-daily-post` task (decides `cal:{d}`, creates the post with `postData`, creates,
   distinguishes and stickies the app comment with yesterday's recap, makes sure the hub post exists), the app-install
   trigger, the post-delete trigger and the mod menu items. Test idempotency: run the job twice → one post, one sticky comment.
2. Redis services (all keys and TTLs in `repo/keys.ts`, per the architecture table; no lists or plain sets): progress,
   results, streak bitfields (Reddit's pattern, with its edge-case tests), leaderboard, first moves, stats, settings.
3. The result card wired to real data with **small-N states** (fewer than 10 solvers → "You're one of the first N").
4. "Post my result (as u/you)" with a preview of the exact text (`runAs: 'USER'`, reply to the day's sticky comment),
   "Challenge a friend" (`showShareSheet` + the recipient banner via `getShareData`, validated), subscribe (explicit
   button), opt-in streak flair, and a report-a-problem form (predefined categories).
5. Journeys through a wrapper that no-ops safely; `startJourney()` before any other call; the server ends the journey in
   `/api/submit` with the verified score.
Verify every Devvit API with the MCP server first. Screenshot every new state; fail any screen that scrolls. Update
PROGRESS.md. Exit criteria are in the plan. Tell me what you couldn't verify.

---

## Phase 3: Beauty, feel, onboarding, Town Builder

Read `docs/04-GAME-SPEC.md` §A7, §A8 and §A10 and `docs/06-QUALITY-BAR.md` in full. Use the frontend-design skill if
available. Goal: a game that feels hand-made, not AI-made.
1. Implement the art direction in §A10 (hatched shade, print look, palette) using the team's assets in
   `src/client/assets/` and the type they chose. Where assets are missing, build clean placeholders in the same style
   and list exactly what the artist must replace. Show me one screenshot of the styled board before restyling everything.
2. Motion and sound: the drag feel, the time sweep, **the siesta moment** (§A7.4), cats and flowers reacting, mute,
   reduced motion, mute on `visibilitychange`.
3. The interactive tutorial (§A7.2): learn by doing, under 40 seconds, skippable. Contextual hints on idle or repeated mistakes.
4. The Town Builder end to end (§A8): build, "Test it", submit with a solver uniqueness check, mod review via menu, the
   Sunday calendar, author credit, "Lovely town", author delete, report. Must be done by Dec 2.
5. The light archive.
6. Move every player-facing string into `src/client/copy.ts` and list the strings a human still has to write or approve.
7. Run the quality-bar checklist against screenshots and fix every failure. Report the checklist results.

---

## Phase 3b: Difficulty calibration (any time playtest data arrives)

Here are playtest results: <paste: puzzle date, player, solve time, drops, hints, notes>.
Compare them with the engine's difficulty grades. Adjust the grading and the generator parameters so the weekday bands
match the target (Mon: most players under 90 s; Sat: about 4–6 min for engaged players). Regenerate and validate the
bank through 2027-12-31. Log the change in DECISIONS.md with before/after numbers.

---

## Phase 4: Polish and freeze

Read `docs/06-QUALITY-BAR.md` and PROGRESS.md (the known-bugs list). Do a full polish pass:
1. Performance: measure the splash and game bundle sizes and the splash's Lighthouse mobile score; get them within budget
   (architecture §9). Check drag smoothness on a mid-range Android. Lazy-load anything heavy.
2. Robustness: logged-out play, network failures, double submits, reopen-after-solve, an old daily post, a day with no
   post, the bank fallback, settings surviving an app update.
3. Fix the top friction points from the playtest notes I paste here: <paste notes>.
4. Device matrix: list exactly what a human must test on the iOS and Android Reddit apps, as a checklist with expected results.
After Fri Dec 4 23:59 IST, **bug fixes, copy changes and town approvals only**. Refuse new features and say why.

---

## Phase 5: Ship

1. Write `README.md` for the app per the Devvit Rules and `docs/07-SUBMISSION-CHECKLIST.md` (overview ≤ 1,000 words for
   non-developers; how to play; daily schedule; Town Builder; community features; mod menu tools; configuration; data and
   privacy; known limitations; support/report). Use the event name "Reddit's Game of the Day Hackathon".
2. Draft the Devpost text, the video shot list and the gallery image list (see prompts/03-WRITING.md).
3. Walk through `docs/07-SUBMISSION-CHECKLIST.md` and produce a checklist report: ✓ / ✗ / needs human.
4. Final deploy (`npm run deploy`, NOT publish). Confirm the version number and that the demo subreddit runs it.

---

<!-- FILE: prompts/02-REVIEW-AND-QA.md -->

# Review and QA prompts

Use these with a **fresh agent session** (no prior context) so the work isn't grading itself.

---

## Fresh-eyes review (run at the end of Phases 2, 3 and 5)

You are a Reddit hackathon judge and a senior game UX reviewer. You have never seen this project.
Read `docs/01-HACKATHON-BRIEF.md` (judging criteria) and `docs/06-QUALITY-BAR.md`. Then review the game:
- Run it locally and take Playwright screenshots of every screen and state at 375×667, 390×844 and 1280×800.
  Look at each screenshot carefully.
- Read the client code for the splash, tutorial, play and result screens, and the server routes.
Score it 1–10 on each criterion (Delightful UX, Polish, Reddit-y, Daily Content) with evidence. Then list issues as:
**Blocker** (would lose points or break the rules) · **Major** · **Minor**. For each: where, what, why it matters, and the suggested fix.
Also check against Devvit Rules (CLAUDE.md §3): automated posting, required sharing, branding, external links,
free-text input, report tool, data retention, inline taps-only / no scroll, every screen fitting the viewport.
Finally, name the single thing that most makes it look AI-made, and the single thing a judge will remember.
Be blunt. Do not fix anything; output the report to `REVIEW-<date>.md`.

---

## Judge-from-the-submission review (run at the end of Phase 5)

The rules let judges score "based solely on the text description, images, and video". Act as a judge who will not play
the game. Read only the Devpost text draft, look only at the gallery images, and read the video shot list or watch the
video file. Then answer: What is the game? How do you play? What's Reddit-native about it? What's new each day? What's
memorable? Score the four criteria from this material alone, and list what's missing or unclear. Output to `REVIEW-SUBMISSION-<date>.md`.

---

## Visual QA pass

Take Playwright screenshots at 360×640, 390×844 and 1280×800 of: splash (new player / returning unsolved / returning
solved / old daily post / with a challenge banner), tutorial steps, play (empty / mid-drag with live shadow / one move
from winning / invalid drop feedback), the siesta moment (mid-sequence), result (solved, small-N, many players), Town
Builder (building / testing / submitted), archive, error state, logged-out state, reduced-motion. For each screenshot
check: no page scroll, alignment to the spacing scale, contrast, tap-target size, text overflow at 360 px, consistent
icon style, nothing that looks templated or AI-generated. Fix the issues, re-screenshot, and include before/after paths in PROGRESS.md.

---

## Rules compliance audit (run before submission)

Audit the codebase against `docs/02-DEVVIT-PLATFORM.md` §9 and CLAUDE.md §3. For each rule, cite the file and line
that satisfies it or flag a violation: user actions only on explicit labelled buttons with the text previewed; shares as
a reply to the sticky comment; no mandatory social actions; gameplay never merged with posting or subscribing; no
Reddit/Snoo branding; no external fetch or links; minimal free text (town names from the picker); report tool present
(problems and towns); authors can delete their towns; **every Redis key holding a user ID has a TTL ≤ 30 days** (45 for
unrun towns); `onPostDelete` handling; share data validated; no PII in telemetry; inline splash taps-only with no
scroll; sound muted on `visibilitychange`; README complete.

---

<!-- FILE: prompts/03-WRITING.md -->

# Writing prompts (README, Devpost, video, images, sidebar)

Judges may score from the text, images and video alone (rules §4, "Testing"). These are part of the product.
Describe and show **only what works in the demo post**. Agents draft; a human edits every word before it ships.

## Devpost description
Write the Devpost "About the project" text for our game (read docs/04-GAME-SPEC.md Section A, README.md, PROGRESS.md).
Structure: **Inspiration** (2–3 sentences, human, no hype) · **What it does** (how to play in 4 bullet points; what's new
each day; the Town Builder; the community features) · **How we built it** (Devvit Web, entry points, the pinned
"Today's town" post, the solver-verified daily bank, hourly self-healing scheduler, Redis, Journeys, user actions,
share sheet, flair) · **Challenges** (real ones from DECISIONS.md) · **What we're proud of** · **What's next**.
Plain, specific, under 600 words. No buzzwords, no exclamation-mark spam. Use the event name "Reddit's Game of the Day
Hackathon". If it's a port of our own IP, say what changed.

## Video script (< 60 s)
Write a shot list for a vertical phone recording in the Reddit app. Judges needn't watch past 1:00.
- 0–5 s: a finger drags a building and its hatched shadow slides over a cat (no title card first).
- 5–15 s: the time toggle sweeps morning → noon → evening; the three-sun strip fills in.
- 15–25 s: the last building drops → **the siesta**: the day sweeps and the cats fall asleep one by one.
- 25–35 s: the result card: time, streak, "where everyone started", Post my result, Challenge a friend.
- 35–48 s: the Town Builder: place a few cats, "Test it", submit; then a Sunday post "Town by u/…".
- 48–58 s: the feed with a new daily post and the countdown: "A new town every day."
Captions for each shot (≤ 8 words). No voiceover required. No music unless we own it or it's licensed.

## Gallery images (4–6)
Phone screenshots from the demo subreddit, each with a short caption: the splash in the feed; a mid-drag with the live
shadow; the siesta moment; the result card; the Town Builder; a Sunday community town credit. Same device frame for all.
No mock-ups of features that don't exist.

## Demo subreddit sidebar
Write a ≤ 80-word sidebar: what the game is, when new towns arrive (UTC and a friendly local hint), where to find
today's town (the pinned post), how to share results and build a town, how to report a problem.

## Hub post
Title: "Today's town: a new Siesta puzzle every day" (or similar, ≤ 60 chars). It's pinned; its splash always shows the
current day's town.
