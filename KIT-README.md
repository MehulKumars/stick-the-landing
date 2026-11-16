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
