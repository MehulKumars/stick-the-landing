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
