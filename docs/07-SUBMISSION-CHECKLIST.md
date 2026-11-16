# 07 — Submission checklist (run end to end on Dec 7, again on Dec 8)

Requirements come from `docs/sources/devpost-rules.md` §4. Re-read that file once before submitting.

## The app
- [ ] The latest version is uploaded (`npm run deploy` / `devvit upload`). **Not published.**
- [ ] The app listing link works: `https://developers.reddit.com/apps/<app-name>`.
- [ ] `devvit.json` has `marketingAssets.icon` (1024×1024 PNG, our own art).
- [ ] README.md in the root: what it is, how to play, the daily schedule, community features (Town Builder, shares,
      challenges, streaks), mod tools (menu items), configuration, data and privacy (30-day expiry), known limitations
      (Journeys / user-action approval status), contact/report. ≤ 1,000-word overview. Uses the event's real name:
      "Reddit's Game of the Day Hackathon".
- [ ] No Reddit trademarks, no Snoo, no third-party IP; an original name and icon.
- [ ] No external fetch, no off-platform links, no automated posting as the user; sharing is optional.
- [ ] Report-a-problem works. Community towns can be reported and deleted by their authors.
- [ ] Deletion handling: `onPostDelete` implemented; every key with a user ID has a TTL ≤ 30 days (45 for unrun towns).
- [ ] The inline splash: taps only, no scroll, Lighthouse mobile above 80.

## The demo subreddit
- [ ] Public, **fewer than 200 members** (or private with `dr-admin-approve` installed).
- [ ] **The pinned "Today's town" hub post exists and shows today's town.** This is the demo link.
- [ ] Today's daily post exists with its sticky comment (with yesterday's recap); the sidebar explains the game.
- [ ] Real history from about Nov 26 is visible (several daily posts). At least one real player-made community town has
      run. No fake numbers anywhere.
- [ ] The scheduler is verified to create the next posts (check `post:{d}` keys / the mod menu fallback).
- [ ] An approved community town is queued for Sun Dec 13 (judging week), or a team town is ready and honestly credited.
- [ ] The content bank runs through Dec 31, 2027. The fallback generator is tested.

## Devpost form
- [ ] Project name, tagline, a thumbnail image (it looks great small).
- [ ] **4–6 gallery images**: phone screenshots of the splash in the feed, a drag with the live shadow, the siesta
      moment, the result card, the Town Builder. Judges may score from these alone.
- [ ] Text description: what it is, how to play, why it's a daily game, Reddit-native features (Journeys, flair,
      comments, streaks, user actions, share sheet, scheduler, Town Builder), what's new vs any prior work, the tech stack.
      **Describe only what works in the demo post** (rules: the project must "function as… expressed in the text description").
- [ ] App listing link · **demo post link (the hub post)** · demo subreddit link · team members' Reddit usernames.
- [ ] Demo video **under 60 s**, public on YouTube or Vimeo, showing the phone in the Reddit app. The first 5 seconds show
      the drag with the live shadow, not a title card. Captions. **No music unless we own it or it's licensed.**
      Show only features that work in the demo post.
- [ ] If it's a port of our own IP: tick/note "ported" (for the Best Ported category).
- [ ] Optional: public repo link. The developer survey is submitted (Feedback Award, due Dec 8).
- [ ] English everywhere.

## Final fresh-eyes pass
- [ ] A person who has never seen it opens the demo post on their phone and solves it without help.
- [ ] Someone who hasn't played it watches only the video and reads only the Devpost text, then explains the game back.
      If they can't, fix the video or text.
- [ ] Run prompts/02 with a fresh agent; fix anything rated "blocker".
- [ ] We have a written answer (or none) about bug fixes during judging, and know which applies.
- [ ] Submit **by Dec 8, 21:00 IST**. Screenshot the confirmation. **No changes after submitting** unless the organizers
      confirmed in writing that fixes are allowed.
