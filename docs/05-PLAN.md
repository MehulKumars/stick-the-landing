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
