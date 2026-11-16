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
