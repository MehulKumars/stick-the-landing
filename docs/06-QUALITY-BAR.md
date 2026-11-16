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
