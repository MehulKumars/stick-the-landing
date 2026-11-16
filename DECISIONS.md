# DECISIONS.md: design and tech decision log

Format: `YYYY-MM-DD · decision · why · alternatives considered · who`

- 2026-11-15 · Default game = Siesta (pending team confirmation after prototypes) · best balance of readability, originality and scope · Still Water, Tidepool, Hivemind, Night Shift · team
- 2026-11-15 · Content keyed by UTC date; hourly idempotent posting job · no dependency on the cron timezone; survives the post-deadline freeze · a single daily cron · kit
- 2026-11-15 · No runtime AI and no external fetch · Devvit Rules approval burden; "AI slop" penalty; reliability · Gemini/OpenAI via fetch · kit

### Kit review, 2026-11-15 (checked against the official Devpost pages in docs/sources/ and the live Devvit docs)
- 2026-11-15 · Event name corrected to "Reddit's Game of the Day Hackathon" · that's the official title · — · review
- 2026-11-15 · Dec 31 posting is our safety margin, not a rule · the rules only require availability until judging ends (Dec 16, 6 PM PT) · — · review
- 2026-11-15 · Video, gallery images and text treated as core deliverables (rough video Dec 2, final Dec 6) · rules §4: judges may score from text, images and video alone · leave to the last days · review
- 2026-11-15 · Ask the organizers in writing whether app bug fixes are allowed during judging; freeze until answered · rules lock the Devpost submission but are silent on app updates; §11 requires written clarification requests · assume either way · review
- 2026-11-15 · Pinned "Today's town" hub post (always today's date) is the demo link · "Judging will score your game based on the demo link"; a fixed daily post would be stale for judges on Dec 9–16 and give no streak credit · submit a daily post · review
- 2026-11-15 · New Phase 0: throwaway prototype + 5 silent playtests + go/no-go before any infrastructure · fun was first tested around Nov 26 in v1 of the plan · build the engine first · review
- 2026-11-15 · Drag with a live shadow preview (plus tap-to-place); strip and counters update on drop · exploring is the fun part; the preview shows one time of day so reasoning still matters · tap-only placement · review
- 2026-11-15 · Score by time (+30 s per hint), not moves · moves punished exploration and caused mass ties at par · moves vs par · review
- 2026-11-15 · Noon rule A/B in the prototype; default "1 tile north" · one formula per time of day was the readability risk in v1 · ceil(h/2) · review
- 2026-11-15 · "Rock" renamed "well" (flat, no shadow) · players expect rocks to cast shadows · keep rocks · review
- 2026-11-15 · Heatmap = "where everyone started" (first drops), not final positions · with unique solutions every final position is identical, so v1's heatmap showed one hot tile · final positions · review
- 2026-11-15 · Signature solve moment, "the siesta" (2.4 s day sweep, cats fall asleep in turn) · memorable, explains the solution, opens the video · a chime · review
- 2026-11-15 · Art direction "print-shop siesta": hatched shade, 2–3 inks on paper, human-drawn SVG set, human-picked type (not Fredoka/Nunito/etc.) · distinctive, colour-blind safe by texture, cheap; avoids the default AI look · flat pastel + Fredoka/Nunito · review
- 2026-11-15 · All player-facing copy in `copy.ts`, written or approved by a human · generic copy is the fastest AI giveaway · agent-written copy · review
- 2026-11-15 · Town Builder promoted from "second cut" to core; ship by Dec 2 · rules text stresses community, meritocracy, creativity and "user creativity"; Sunday Dec 13 is in judging week · cut early · review
- 2026-11-15 · Added "Challenge a friend" (showShareSheet + getShareData) and a daily recap in the sticky comment · native, cheap, Reddit-y; share sheet doesn't post as the user · — · review
- 2026-11-15 · Result card: one community line, one primary (post my result), one secondary (challenge), quiet footer · v1 listed ~7 elements, contradicting the quality bar · — · review
- 2026-11-15 · Every screen fits the viewport; inline is taps only, < 1 s, Lighthouse > 80; sound mutes on visibilitychange · Reddit's AI-slop wording and the inline requirements for approval/featuring · — · review
- 2026-11-15 · Settings/tutorial/progress in Redis, not localStorage · localStorage is wiped on every app version · localStorage · review
- 2026-11-15 · Every user-ID key has a TTL ≤ 30 days (rolling); streaks use Reddit's bitfield pattern · no account-deletion trigger exists; rules require deleted accounts' IDs to go · permanent user records · review
- 2026-11-15 · UGC queues use sorted sets · Devvit Redis has no lists or plain sets · lists · review
- 2026-11-15 · Journey.Start via an explicit startJourney() before any other call; the server ends the journey with the verified score · interaction()/progress() auto-start journeys · start on first placement implicitly · review
- 2026-11-15 · Content bank Nov 17, 2026 → Dec 31, 2027 · v1 started Dec 1, so late-November dev testing would hit the fallback; a year costs nothing · Dec 1 → Jan 15 · review
- 2026-11-15 · Bundle budgets: splash ≤ 50 KB gz, game ≤ 250 KB gz · 600 KB was loose for a grid puzzle in a feed · v1 budgets · review

### Project setup, 2026-11-15
- 2026-11-15 · Project created by cloning reddit/devvit-template-react (the same template `npm create devvit` uses) instead of running the interactive wizard · the wizard needs an interactive Reddit login; the clone gives the identical official structure · wizard · agent
- 2026-11-15 · App name `siesta-town` (placeholder; checked for availability at first `devvit upload`) · the template ships `<% name %>` placeholders · — · agent
- 2026-11-15 · Removed the template's `public/snoo.png` · Devvit Rules: no Snoo or Reddit trademarks · keep until art arrives · agent
- 2026-11-15 · Node 24+ (template `engines` and `.nvmrc` 24.18.0), not 22.2+ as the kit said · the template's requirement wins · — · agent
- 2026-11-15 · Unit tests use the template's `node --test` runner (`npm run test:unit`), not Vitest · already configured in the template and CI; one less dependency · Vitest · agent
- 2026-11-15 · Server framework is Hono (from the template) · template default · Express · agent
- 2026-11-15 · Installed Anthropic's `frontend-design` skill in `.claude/skills/`; skipped `webapp-testing` (needs Python, not installed) and use Node Playwright directly · design quality is a judging criterion · — · agent
- 2026-11-15 · Palette changed from sand + terracotta to whitewash, blue ink, sun yellow and pink · frontend-design lists cream + serif + terracotta as the #1 AI-design cliché · keep v1 palette · agent
- 2026-11-15 · No middle-dot meta strings or "→" in UI copy · both are listed AI-design tells · — · agent
- 2026-11-15 · Prototype: selecting a time fades the cats that don't nap then; tapping a cat says when it naps · the nap badges alone were cryptic in screenshots · text labels on every cat · agent

### Phase 1 build and UX pass, 2026-11-15
- 2026-11-15 · Client written in plain TypeScript, no React · the prototype's imperative drag code ports straight over; splash ~8 KB gz, game ~15 KB gz · React from the template · agent
- 2026-11-15 · Bank starts 2026-11-15 (not 11-17) · the dev subreddit's day No. 1 is today · — · agent
- 2026-11-15 · onAppUpgrade also ensures the hub post exists · existing installs get the pinned post without reinstalling · install only · agent
- 2026-11-15 · First-time players get three interactive lessons (skippable, replayable from help); "tutorial done" and mute live in Redis (`user:{id}`, rolling 30-day TTL) · learn by doing; localStorage is wiped on app updates · text tutorial; localStorage · agent
- 2026-11-15 · A coach line under the title always says what to do next; once every house is placed it names the failing time/cat/flower · players otherwise can't tell why a full board isn't solved · status icons only · agent
- 2026-11-15 · Problem rings only at the selected time · ringing every problem at once was noisy, and this teaches switching times · ring everything · agent
- 2026-11-15 · How to play is three shadow diagrams plus three one-line rules · visual beats a wall of text · text sheet · agent
- 2026-11-15 · The sun moves along a dotted arc around the board (east, south, west) · shows where the sun is and why shadows point the other way · straight jump · agent
- 2026-11-15 · Two-column layout for landscape phones and short windows; tuned spacing for short and tall portrait screens · Reddit's expanded view can be any shape · one layout · agent
- 2026-11-15 · Provisional font: Shantell Sans (OFL), bundled from @fontsource (latin 400/700/800) · most distinctive and hand-made of three candidates (Shantell Sans, Young Serif headings, Baloo 2); comparison screenshots in docs/screens/2026-11-15-ux/font-options · **awaiting human sign-off** · agent
- 2026-11-15 · Code pushed to a private GitHub repo, MehulKumars/siesta-town · backup and authorship history; can go public at submission (optional on Devpost) · public now · user
- 2026-11-15 · CI runs typecheck, lint, unit tests and build in sequence (the template used a parallel-steps syntax GitHub rejected); Dependabot config removed · CI must actually run; automatic dependency bumps mid-hackathon are risky · keep Dependabot · agent

### Phase 2: the Reddit layer, 2026-11-15
- 2026-11-15 · The daily-post job runs every 15 minutes (`1,16,31,46 * * * *`), not hourly · today's post appears within ~15 min of UTC midnight; a run that finds the post is one Redis read · hourly · agent
- 2026-11-15 · Locks and rate limits use atomic `incrBy` counters with a short expiry · `set` with `nx` doesn't clearly report whether it won in the 0.15.3 client · `set nx` · agent
- 2026-11-15 · Text the app writes onto Reddit (post titles, the sticky comment, shared results, report modmail) lives in `src/shared/reddit-copy.ts`, not `copy.ts` · the server posts it and the client previews it word for word, so both need it; a human signs it off with `copy.ts` · duplicate the strings · agent
- 2026-11-15 · "Post as the user" uses `reddit.scope: "user"` plus the client's `canRunAsUser(event)` inside the tap, not the `asUser` list · the 0.15.3 config schema marks `asUser` as not in use · `asUser` · agent
- 2026-11-15 · If Reddit posts a shared result from the app account (app not yet approved), the server edits it to name the player ("u/name put … to sleep") · otherwise the comment wouldn't say whose result it is · leave it · agent
- 2026-11-15 · One shared result per player and town; the card then offers "See your comment" · prevents spam in the daily thread · allow repeats · agent
- 2026-11-15 · Shares from the hub post reply under that day's daily post's sticky comment (made on demand if the job hasn't run yet) · score shares must reply to a sticky comment; the hub is permanent and would pile up comments across days · a sticky on the hub · agent
- 2026-11-15 · "Report a problem" is a Reddit form with four fixed categories, sent to the subreddit's modmail with `createModNotification`; the reporter stays anonymous · mods act where they already work; no free text to moderate · a Redis queue with a mod menu · agent
- 2026-11-15 · The result card is a "postcard": while it's open, the controls step aside and the board shrinks to fit above the card (beside it in landscape) · the sleeping town is the reward and the first card covered it entirely · a full-screen card · agent
- 2026-11-15 · Community line copy is short and honest at every size ("You're one of the first 4 nappers here", "40 nappers so far. 25% started where you did"); the start map appears from 3 solvers · percentages of a handful mislead; a map of one tile is pointless · — · agent
- 2026-11-15 · Only solving the current day's town marks the streak; the shared text mentions the streak only on that day · Reddit's streak guidance; an old town shouldn't extend today's streak · count any solve · agent
- 2026-11-15 · Journeys: the official server router is Express, so `src/server/routes/telemetry.ts` mirrors its five endpoints in Hono; the server ends the journey in `/api/submit` with the verified adjusted time in seconds as the score · we use Hono; scores must come from the server · skip Journeys until allowlisted · agent
- 2026-11-15 · Opt-in streak flair postponed (cut-list item 5) · needs mod rights for the app account and adds a setting; everything else in Phase 2 matters more · build now · agent

### New game: Lungful, 2026-11-16
- 2026-11-16 · Selected game changed from Siesta to Lungful (one-breath reef diving, three dives a day), built in a separate folder `lungful/` copied from Siesta's project · the user asked for a game with more depth than Siesta; past winners lean on a strong physical hook, ghosts/traces of other players and visible stakes · Still Water, Tidepool, Hivemind, Night Shift; a physics marble run; a stone-skipping arcade game · user + agent
- 2026-11-16 · Turn-based on a grid, not real-time swimming · deterministic, so the server can verify a haul by replaying actions; no reflex or frame-rate problems on phones · real-time · agent
- 2026-11-16 · Three dives per day; a blackout drops the haul in place for a later dive · one dive felt too punishing for a first-time player; the dropped haul gives the next dive a goal · one dive, lose everything · agent
- 2026-11-16 · The breath meter carries a "way up" mark (cheapest charted route to the surface at current weight) · makes the push-your-luck decision readable without text · no aid · agent
- 2026-11-16 · Reefs are generated from the date at runtime (no bank), and the full map goes to the client · generation takes 60–600 ms and is proven by the solver; hiding the map would need a server round trip per stroke · server-revealed map · agent
- 2026-11-16 · Canvas rendering; provisional font Bricolage Grotesque (OFL) · the scene scrolls and animates every frame · DOM/SVG · agent
- 2026-11-16 · Working name "Lungful" · not checked for conflicts yet; **needs human sign-off** · — · agent

### Lungful: making it explain itself, 2026-11-16 (after the first human play)
- 2026-11-16 · First human play: "not clear what to do, where to tap, how far, or what the meter means; too hard; UI basic" · the first build assumed the rules were obvious · — · user
- 2026-11-16 · A practice dive on a small hand-made reef (`practice.ts`) runs before the first daily reef: fetch a pearl, then a heavy kettle. Skippable, and reachable again from "How to play" · teaches by doing in under a minute · a text how-to card · agent
- 2026-11-16 · The reef shows where you can go: a white dot on water you can reach and still surface from, a coral ring where you could not get back (`reach.ts`). A tap swims the whole route; a one-way cell needs a second tap · answers "where can I tap and how far" on the board itself · numbers only · agent
- 2026-11-16 · `reach.ts` follows the rules exactly, jellyfish timetables and air pockets included; routes hold still when that is cheaper than a sting · the first version ignored jellyfish and a "safe" cell could end in a blackout, which breaks the one promise the dots make. Tested: a diver who stays on dots never blacks out over 14 days of reefs · approximate reach · agent
- 2026-11-16 · Breath meter redrawn: one notch per breath, the count in words ("27 breaths left"), and a striped yellow part labelled "N to get back up"; a route under the finger blinks the breaths it would spend · the old bar with a small marker was not understood · — · agent
- 2026-11-16 · A "Swim up" button swims the cheapest way to the surface; it turns yellow when three or fewer breaths are spare · the most common question mid-dive is "how do I get out" · tap the surface only · agent
- 2026-11-16 · Surfacing anywhere on the top row banks the haul (already the rule; now stated in the copy as "the surface", not "the boat") · simpler to explain · boat cell only · agent
- 2026-11-16 · Reefs are smaller and lungs more generous: 13 rows on Monday to 22 on Saturday, 7–10 spare breaths, lungs capped at 48; Monday has no jellyfish or currents · the first reefs were too hard and too long · keep 20–32 rows · agent
- 2026-11-16 · **Solver bug fixed** (`solve.ts`): after an air-pocket refill the search carried the refilled breath over to the state's other moves, so it could call a find fetchable when it was not. Reefs made before this fix may have been unfetchable · found while testing `reach.ts` against real reefs · — · agent
- 2026-11-16 · Tapping yourself no longer holds still, swipes are gone, and "Wait" only appears when a jellyfish is in sight · accidental taps cost breaths; press-and-slide now previews a route instead · keep both · agent
- 2026-11-16 · Day result shows 1–3 starfish for a fifth, a half and four fifths of the reef's total · gives a first-day player something to reach short of clearing the reef · score only · agent
- 2026-11-16 · "Practice seen" is kept in localStorage for now · the server is not ported yet; it must move to Redis for logged-in players (CLAUDE.md §3) · — · agent

### Third game: Stick the Landing, 2026-11-16 (this folder, `sticky/`)
- 2026-11-16 · Lungful dropped · the owner played it and said it had no clear win condition, looked cheap, had no animation or VFX, and was worse than Siesta · — · user
- 2026-11-16 · The owner's brief for the next game: a clear win condition per level, 2.5D, real animation and VFX, a visible ladder from easy to hard, likeable from the first seconds, multiplayer as an option · — · user
- 2026-11-16 · New game: flick a tree frog that sticks where it lands; reach the flower in as few hops as possible (see docs/04-GAME-SPEC.md) · one sentence explains it, the goal is binary and always on screen, and it is physical rather than a planning puzzle · isometric mini golf (a daily ball puzzle is already in the hackathon), a tilt-and-slide ice puzzle, a step-by-step lily-pad puzzle · agent
- 2026-11-16 · Rendered with Three.js as a 3D diorama, played on a flat plane ("2.5D") · the owner asked for 2.5D and visible production values; real lights and shadows do that more cheaply than faking depth on a 2D canvas · canvas 2D with drawn depth · agent
- 2026-11-16 · Levels are hand-made for now, 15 in three tiers named Easy, Medium, Hard; par comes from the solver and a unit test keeps them in step · the owner asked for a clear hierarchy of difficulty; hand-made levels teach one thing at a time · generated levels from day one · agent
- 2026-11-16 · Board is 8 by 13 tiles, not the first 10 by 16 · on a phone the frog was about 20 px across; now it is about 35 · — · agent
- 2026-11-16 · The dotted aim line shows the whole arc on the first three levels and only its first third after that · full arcs make later levels a matter of pointing; a short line keeps some skill in it · always full, never shown · agent
- 2026-11-16 · Physics uses fixed 1/120 s steps and only arithmetic and square roots; hops are whole 1/8-tile speeds · so the server can replay a run exactly on a different machine · floating free-form input · agent
- 2026-11-16 · Fonts: DynaPuff for names and numbers, Figtree for text (both OFL, bundled) · a soft, squashy display face suits the frog; provisional until a human signs off · Bricolage Grotesque · agent
- 2026-11-16 · Working name "Stick the Landing" · not checked for conflicts; **needs human sign-off** · — · agent

### Stick the Landing: fixes from the owner's first play, 2026-11-16
- 2026-11-16 · Owner's report after playing to level 8: the frog sometimes ends up at an odd angle; the flower sometimes does not count when the frog looks as if it is on it, and it is unclear how close is close enough; mushrooms throw the frog off to one side even when it lands on top, so a first-try three stars is luck. He likes the mushroom and the par of 1 · — · user
- 2026-11-16 · Mushrooms now throw the frog straight out from the middle of the cap, at a fixed speed, whatever way it arrived, once per hop (after that the frog can sit on it) · the old bounce kept the frog's sideways speed, which no player can judge from a short aim line; a fixed throw can be learned in one go · keep the physical bounce and draw a longer aim line · agent
- 2026-11-16 · The flower has a dotted ring (0.85 tiles) and the level is won when any part of the frog touches it, in the air or at rest · the old rule was 0.62 tiles between centres, checked only in flight, with nothing on screen to show it. A browser run reproduced the owner's case exactly (frog at rest 1.05 tiles away, not counted) · a bigger invisible radius · agent
- 2026-11-16 · Landing on the corner of a block, the frog shuffles onto the nearest flat face · corner landings left it tilted at 45 degrees, which read as a glitch · leave corners as they are · agent
- 2026-11-16 · The frog now knows how its hop will end (the physics is deterministic, so the client plays it ahead) and turns its feet to the surface in the last quarter second; on the flower it hops on top, sits upright and bounces · at the flower it used to freeze in whatever pose it was flying in · — · agent
- 2026-11-16 · "Brambles" replaced with a shorter level (par 3, was 5) and "Double bounce" rebuilt round a wall mushroom · the first medium level was the longest in the game; the old double bounce relied on sideways drift · — · agent
