// Every player-facing string lives here so a human can write and edit them in one place.
// Status: agent-drafted. A human must review and sign off every line before the feature freeze.
// House style: short, warm, plain. No exclamation marks, no middle-dot lists, no arrows in buttons.
// Text the app posts onto Reddit (titles, comments, shared results) is in src/shared/reddit-copy.ts.
import type { CrowdLine } from '../shared/community.ts';
import type { NoonRule, TimeOfDay } from '../shared/engine/types.ts';
import type { LessonId } from '../shared/lessons.ts';

const when: Record<TimeOfDay, string> = {
  am: 'in the morning',
  noon: 'at noon',
  pm: 'in the evening',
};
const label: Record<TimeOfDay, string> = {
  am: 'Morning',
  noon: 'Noon',
  pm: 'Evening',
};

const plural = (n: number, one: string, many: string): string =>
  n === 1 ? one : many;

export const copy = {
  gameName: 'Siesta',
  tagline: 'Put the town to sleep.',
  playToday: 'Play today’s town',
  seeYourTown: 'See your town',
  loading: 'Waking the town…',
  loadFailed: 'The town didn’t load. Check your connection and try again.',
  tryAgain: 'Try again',

  timeLabel: label,
  townNumber: (n: number, date: string) => `No. ${n}, ${date}`,
  oldTown: (n: number) =>
    `This is town No. ${n}. Today’s town is in the pinned post.`,
  difficulty: (level: number) => `Difficulty ${level} of 7`,
  difficultyWord: (level: number) =>
    level <= 2
      ? 'Gentle'
      : level <= 4
        ? 'Steady'
        : level <= 6
          ? 'Tricky'
          : 'Sunday special',
  nappedIn: (time: string) => `Napped in ${time}`,

  // Taps on the board
  catNaps: {
    am: 'This cat naps in the morning.',
    noon: 'This cat naps at noon.',
    pm: 'This cat naps in the evening.',
  },
  flowerNeedsSun: 'Flowers need sun all day.',
  wellIsFlat: 'A well is flat: no shadow, and no room for a house.',
  spotTakenByCat: 'That spot is taken by a cat.',
  spotIsFlower: 'Houses can’t go on flowers.',
  spotIsWell: 'Houses can’t go on the well.',
  spotHasHouse: 'There’s already a house there.',

  // Controls (labels for screen readers)
  houseInTray: (h: number) => `House, height ${h}`,
  houseOnBoard: (h: number) => `House ${h} is on the board`,
  putAllBack: 'Put all houses back',
  howToPlay: 'How to play',
  sound: 'Sound',
  catsAsleep: 'Cats asleep',
  flowersInSun: 'Flowers in sun',
  timeDone: (name: string, ok: boolean) => `${name} ${ok ? 'done' : 'not yet'}`,

  // Lessons
  skipLessons: 'Skip',
  lessonTitle: (n: number) => `Lesson ${n} of 3`,
  lessonSubtitle: 'How shadows work',
  lessonStep: (id: LessonId, sawNoon: boolean, rule: NoonRule): string => {
    if (id === 'lesson-1')
      return 'The sun rises on the right. Drag the house so the cat naps in its shadow.';
    if (id === 'lesson-2') {
      if (!sawNoon)
        return 'This cat naps at noon. Tap Noon to see where shadows fall.';
      return rule === 'one'
        ? 'At noon every shadow falls one tile up. Put the cat in the shade.'
        : 'At noon shadows fall up, half as long. Put the cat in the shade.';
    }
    return 'Flowers need sun all day. Shade the evening cat, but keep the flower out of every shadow.';
  },
  lessonDone: (id: LessonId, rule: NoonRule): [string, string] => {
    if (id === 'lesson-1')
      return ['That’s the idea.', 'Morning sun throws shadows to the left.'];
    if (id === 'lesson-2') {
      return [
        'Noon shadows fall up.',
        rule === 'one'
          ? 'At noon the sun is high in the south, so every house shades just the tile above it.'
          : 'At noon the sun is high in the south, so shadows fall up and are half as long.',
      ];
    }
    return [
      'You’re ready.',
      'Evening shadows fall to the right. Every town is these three ideas at once.',
    ];
  },
  next: 'Next',
  toTodaysTown: 'Play today’s town',

  // The coach line: always says what to do next
  coachGoal: (cats: number, flowers: number) => {
    const catPart =
      cats === 1 ? 'Put the cat to sleep' : `Put all ${cats} cats to sleep`;
    if (flowers === 0) return `${catPart}.`;
    return `${catPart} and keep ${plural(flowers, 'the flower', `all ${flowers} flowers`)} in the sun.`;
  },
  coachProgress: (asleep: number, total: number, housesLeft: number) =>
    `${asleep} of ${total} ${plural(total, 'cat', 'cats')} asleep. ${housesLeft} more ${plural(housesLeft, 'house', 'houses')} to place.`,
  coachFlowerShaded: (time: TimeOfDay) =>
    `A flower is in shade ${when[time]}. Tap ${label[time]} to see it.`,
  coachFlowerShadedHere: (time: TimeOfDay) =>
    `A flower is in shade ${when[time]}. Move the house that shades it.`,
  coachCatAwake: (time: TimeOfDay) =>
    `A cat that naps ${when[time]} is still awake. Tap ${label[time]} to see why.`,
  coachCatAwakeHere: (time: TimeOfDay) =>
    `A cat that naps ${when[time]} is still awake. Give it some shade.`,
  coachSolved: 'Every cat is asleep. Switch the time to see each nap.',
  coachIdleStart: 'Drag a house from the tray onto empty ground.',
  coachIdleTip:
    'Stuck? Tap a cat to see when it naps, then switch to that time.',

  // How to play
  helpTitle: 'How to play',
  helpCats: 'Each cat needs shade at its nap time. Tap a cat to see when.',
  helpFlowers: 'Flowers need sun at all three times.',
  helpHouses: (rule: NoonRule) =>
    rule === 'one'
      ? 'Morning and evening shadows are as long as the house is tall. At noon every shadow is one tile.'
      : 'Morning and evening shadows are as long as the house is tall. At noon they are half as long.',
  helpDiagram: {
    am: 'Sun on the right, shade to the left',
    noon: 'Sun to the south, shade goes up',
    pm: 'Sun on the left, shade to the right',
  } satisfies Record<TimeOfDay, string>,
  helpBack: 'Back to the town',
  helpReplay: 'Replay the lessons',

  // Result
  asleep: (title: string) => `${title} is asleep.`,
  statTime: 'time',
  statStreak: 'day streak',
  cleanNap: 'No hints',
  nextTown: (hours: number, minutes: number) =>
    hours > 0
      ? `Next town in ${hours} h ${minutes} min`
      : `Next town in ${minutes} min`,
  lookAtTown: 'Look at the town',
  seeYourResult: 'See your result',
  notSavedLoggedOut: 'Log in to Reddit to keep your result and your streak.',
  notSavedYet:
    'Couldn’t save your result yet. It will try again when you’re back online.',
  crowd: (line: CrowdLine, title: string): string => {
    switch (line.kind) {
      case 'alone':
        return `You’re the first napper in ${title}.`;
      case 'early':
        return `You’re one of the first ${line.solvers} nappers here.`;
      case 'sameStart':
        return `${line.solvers} nappers so far. ${line.percent}% started where you did.`;
      case 'count':
        return `${line.solvers} nappers so far.`;
    }
  },
  seeWhereStarted: 'See where everyone started',
  logInToKeep: 'Log in to keep your streak',
  postResult: 'Post my result',
  seeYourComment: 'See your comment',
  challenge: 'Challenge a friend',
  challengeText: (title: string, time: string) =>
    `I put every cat in ${title} to sleep in ${time}. Your turn?`,
  join: (sub: string) => `Join r/${sub}`,
  joined: (sub: string) => `You joined r/${sub}.`,
  yesterdaysTown: 'Yesterday’s town',
  todaysTown: 'Today’s town',

  // Posting a result (always previewed word for word first)
  sharePreviewTitle: 'Post your result',
  sharePreviewBody: (name: string, isToday: boolean) =>
    `This is posted as a comment from u/${name}, under ${isToday ? 'today’s' : 'that day’s'} Siesta post:`,
  postAs: (name: string) => `Post as u/${name}`,
  notNow: 'Not now',
  posting: 'Posting…',
  posted: 'Posted.',
  postedByApp:
    'Posted. While Siesta is new, Reddit posts it from the app’s account, with your name in it.',
  needsPermission: 'Reddit needs your OK before Siesta can post for you.',

  // Where everyone started
  mapTitle: 'Where everyone started',
  mapCaption: 'Darker tiles got more first houses. The ring marks yours.',
  mapCaptionNoMine: 'Darker tiles got more first houses.',
  back: 'Back',

  // Problem reports (fixed categories live in shared/reddit-copy.ts)
  reportProblem: 'Report a problem',
  reportTitle: 'Report a problem',
  reportQuestion: 'What went wrong?',
  reportSend: 'Send to the moderators',
  reportSent: 'Sent to the moderators. Thank you.',

  // Splash extras
  friendChallenge: (time: string) =>
    `A friend napped this town in ${time}. Your turn.`,
  streakSoFar: (days: number) =>
    `Your streak: ${days} ${plural(days, 'day', 'days')}. Keep it going.`,
  nappedWithStreak: (time: string, days: number) =>
    days > 1 ? `Napped in ${time}. Streak: ${days} days.` : `Napped in ${time}.`,
  oldPost: (n: number) => `This was town No. ${n}.`,
  goToToday: 'Go to today’s town',
  playAnyway: (n: number) => `Play No. ${n} anyway`,
} as const;

/** Lungful. Drafted by an agent; a human signs off every line before the feature freeze. */
export const leap = {
  name: 'Stick the Landing',
  nameLines: ['Stick the', 'Landing'],
  tagline: 'Flick the frog. It sticks where it lands. Reach the flower.',
  // What you are trying to do, always on screen.
  goal: 'Reach the flower',
  hopsLabel: 'Hops',
  parLabel: 'Par',
  // The three tiers of levels.
  difficulty: ['Easy', 'Medium', 'Hard'],
  difficultyOf: (n: number) => `Difficulty ${n} of 3`,
  levelLabel: (n: number, name: string) => `${n}. ${name}`,
  levelState: (n: number, name: string, stars: number, locked: boolean) =>
    locked ? `Level ${n}, locked` : `Level ${n}, ${name}, ${stars} of 3 stars`,
  starsTotal: (got: number, of: number) => `${got} of ${of} stars`,
  play: (n: number) => `Play level ${n}`,
  playOn: (n: number) => `Carry on at level ${n}`,
  playAny: 'Pick a level to play again',
  lockedNote: 'Finish the level before it to open this one.',
  // Buttons while playing.
  toLevels: 'Levels',
  restart: 'Start the level again',
  mute: 'Mute',
  unmute: 'Sound on',
  // After a fall.
  fell: 'Splash. Back to your last perch.',
  pricked: 'Thorns. Back to your last perch.',
  lost: 'Lost in the leaves. Back to your last perch.',
  // Reaching the flower.
  wonUnder: 'Under par',
  wonPar: 'You stuck the landing',
  wonOver: 'You made it',
  wonLine: (hops: number, par: number) => (hops === 1 ? `1 hop. Par is ${par}.` : `${hops} hops. Par is ${par}.`),
  wonStars: (n: number) => `${n} of 3 stars`,
  forThree: (par: number) => (par === 1 ? 'Three stars: do it in 1 hop.' : `Three stars: do it in ${par} hops.`),
  next: 'Next level',
  again: 'Try again',
  lastOne: 'That was the last level. More are on the way.',
} as const;
