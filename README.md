# Siesta

A daily puzzle game that lives in a Reddit post. Every day there's a new little town in the sun. Place a few
houses so that every cat naps in the shade at its favourite time of day, while every flower stays in the sun.

Built for **Reddit's Game of the Day Hackathon** on the Reddit Developer Platform (Devvit Web).

> Status: in development. This README is a working draft and will be finished before submission.

## How to play

1. Open today's town from the pinned post. In the feed, tap **Play today's town**.
2. Drag a house from the tray onto empty ground. While you drag, you see its shadow.
3. Shadows fall away from the sun: **left in the morning, up at noon, right in the evening**. Morning and evening
   shadows are as long as the house is tall. At noon every shadow is one tile.
4. Each cat has a badge showing when it naps (morning, noon or evening). It needs shade at that time. Tap a cat to see
   when it naps. Switch the time of day at the top to check each time.
5. **Flowers need sun all day.** Keep them out of every shadow.
6. When every house is placed, every cat is asleep and every flower is in the sun, the town falls asleep.

Your score is your time. Towns get harder through the week: Monday is a small warm-up and Saturday is a big town.
First-time players get three tiny interactive lessons (about 40 seconds, skippable, replayable from How to play).

## After you solve

- **Your result card:** your time, your streak (days in a row you solved the day's town) and one line about the
  community: how many people have napped this town and, once enough have, how many started where you did.
  "See where everyone started" shows a map of everyone's first house, only after you've solved it.
- **Post my result** shows the exact comment first, then posts it from your account as a reply to the day's pinned
  comment, only when you press **Post as u/you**. It never spoils the answer. While the app is waiting for Reddit's
  approval, Reddit posts these comments from the app account instead; the comment then names you.
- **Challenge a friend** opens Reddit's share sheet. Your friend sees "A friend napped this town in 1:42" on the post.
- **Join** subscribes you to the subreddit, only when you press it.

## Daily schedule

- One new town per day, at midnight UTC. Every town was generated in advance and checked by a solver, so it always has
  an answer (from Wednesday on, exactly one).
- The pinned "Today's town" post always shows the current day.
- Shortly after midnight UTC the app also makes that day's own post ("Siesta No. 14: Little Harbour (Monday)") with a
  pinned comment that opens with yesterday's real numbers and collects shared results. Old daily posts stay playable
  and point you to today's town.

## For moderators

- **Install:** the app records today as town No. 1, creates the pinned "Today's town" post and today's daily post.
- **Every day:** a job checks every 15 minutes and makes the day's post and its pinned comment if they're missing.
  Nothing needs doing by hand. If you delete a daily post, the app forgets it (today's is made again).
- **Menu (subreddit, moderators only):**
  - "Post today's town now" makes today's post if it's missing and opens it.
  - "Create the Today's town post" makes a new pinned hub post if you ever need one.
- **Problem reports** arrive in your modmail (Notifications) with the town and the post. Reporters are anonymous and
  choose from a fixed list, so there's no free text to moderate.
- **No setup needed.** There are no settings, no outside services and nothing to configure.

## Data and privacy

- The app stores, per player: when they first opened a town and their in-progress board (3 days), their result, their
  place on that day's leaderboard, the days they solved (for the streak), their settings (tutorial seen, sound) and
  whether they shared or joined (30 days). Everything that holds a user id expires within 30 days of their last visit.
- Daily totals (number of solves, time ranges, which tile people started on) are counts with no user ids.
- No personal data beyond your Reddit user id is stored. Nothing is sent outside Reddit. No AI is used at runtime.
- Posting, commenting and joining as you only ever happen when you press a clearly labelled button, and are never
  needed to play.
- Anonymous gameplay analytics use Reddit's own Journeys system (no personal data).

## Known limitations (development build)

- Coming next: the Town Builder for player-made Sunday towns, and opt-in streak flair.
- Sounds and art are placeholders in the final style.

## Reporting a problem

Open **How to play** (the ? button) and tap **Report a problem**. Pick what went wrong; it goes to the subreddit's
moderators with the town attached.

## For developers

```
npm install
npm run test:unit      # engine, dates and bank checks (node --test)
npm run test:types     # TypeScript
npm run lint
npm run dev            # playtest on Reddit (needs `npm run login`)
node --experimental-strip-types scripts/generate-puzzles.ts   # regenerate the town bank
```

Project docs live in `docs/`; start with `CLAUDE.md`.
