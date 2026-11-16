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
