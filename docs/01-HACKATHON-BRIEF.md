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
