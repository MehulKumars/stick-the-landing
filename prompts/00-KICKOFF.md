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
