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
