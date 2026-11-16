import './game.css';
import { leap as copy } from './copy.ts';
import { isMuted, setMuted, sound, unlockAudio } from './sound.ts';
import { Stage } from './stage.ts';
import { LEVELS, TIERS } from '../shared/leap/levels.ts';
import { aim, beginRun, foresee, hop, starsFor, tick } from '../shared/leap/sim.ts';
import { MAX_SPEED, SPEED_UNIT, STEP } from '../shared/leap/types.ts';
import type { Happening, Level, Point, Run } from '../shared/leap/types.ts';

function need<T extends Element>(id: string, kind: new () => T): T {
  const found = document.getElementById(id);
  if (!(found instanceof kind)) throw new Error(`Missing #${id}`);
  return found;
}

const app = need('app', HTMLDivElement);
const canvas = need('stage', HTMLCanvasElement);
const hud = need('hud', HTMLDivElement);
const mapBtn = need('map-btn', HTMLButtonElement);
const retryBtn = need('retry-btn', HTMLButtonElement);
const muteBtn = need('mute-btn', HTMLButtonElement);
const levelName = need('level-name', HTMLElement);
const tierLabel = need('tier', HTMLSpanElement);
const goalText = need('goal-text', HTMLSpanElement);
const hopsLabel = need('hops-label', HTMLSpanElement);
const parLabel = need('par-label', HTMLSpanElement);
const hopsCount = need('hops', HTMLElement);
const parCount = need('par', HTMLElement);
const toast = need('toast', HTMLParagraphElement);
const hint = need('hint', HTMLParagraphElement);
const demo = need('demo', HTMLDivElement);
const map = need('map', HTMLElement);
const card = need('card', HTMLElement);

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const stage = new Stage(canvas, reducedMotion);

/** A full pull is this many tiles of drag. */
const FULL_PULL = 3.1;
/** Anything shorter than this (in tiles) is a tap, not a pull. */
const SHORTEST_PULL = 0.35;
/** How much of the hop the dotted line shows once the first lessons are over (physics steps). */
const SHORT_LINE = 44;

// ---------- What the player has done so far ----------

type Progress = { stars: Record<string, number>; best: Record<string, number> };
const SAVE_KEY = 'sticky:progress';

function loadProgress(): Progress {
  const fresh: Progress = { stars: {}, best: {} };
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null');
    if (typeof saved !== 'object' || saved === null) return fresh;
    for (const level of LEVELS) {
      const stars = 'stars' in saved && typeof saved.stars === 'object' && saved.stars !== null ? Reflect.get(saved.stars, level.id) : 0;
      const best = 'best' in saved && typeof saved.best === 'object' && saved.best !== null ? Reflect.get(saved.best, level.id) : 0;
      if (typeof stars === 'number' && stars >= 1 && stars <= 3) fresh.stars[level.id] = Math.floor(stars);
      if (typeof best === 'number' && best >= 1) fresh.best[level.id] = Math.floor(best);
    }
  } catch {
    // Nothing saved, or storage is off: start from the first level.
  }
  return fresh;
}

const progress = loadProgress();

function saveProgress(): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(progress));
  } catch {
    // Private browsing: progress lasts until the page closes.
  }
}

function starsOf(level: Level): number {
  return progress.stars[level.id] ?? 0;
}

function isOpen(index: number): boolean {
  const before = LEVELS[index - 1];
  return index === 0 || (before !== undefined && starsOf(before) > 0);
}

/** The first level not yet finished, or -1 when they all are. */
function nextUp(): number {
  return LEVELS.findIndex((level) => starsOf(level) === 0);
}

// ---------- The level in play ----------

type Screen = 'map' | 'play' | 'won';
let screen: Screen = 'map';
let index = Math.max(0, nextUp());
let run: Run = beginRun(LEVELS[index] ?? LEVELS[0] ?? missingLevels());
let pull: { x: number; y: number } | null = null;
let aimed: { vx: number; vy: number } | null = null;
let owed = 0;
let last = 0;
let toastTimer = 0;
let cardTimer = 0;

function missingLevels(): never {
  throw new Error('There are no levels');
}

function tierOf(level: Level): { name: string; difficulty: number } {
  const tier = TIERS.find((each) => each.levels.includes(level));
  return { name: tier?.name ?? '', difficulty: tier?.difficulty ?? 1 };
}

const STAR =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.700 5.900 6.400.700-4.800 4.300 1.400 6.300L12 16.600l-5.700 3.200 1.400-6.300-4.800-4.300 6.400-.700z" fill="currentColor" stroke-linejoin="round"/></svg>';
const LOCK =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V8a5 5 0 0 1 10 0v2h1.500v10h-13V10zm2.500 0h5V8a2.500 2.500 0 0 0-5 0z" fill="currentColor"/></svg>';

function starRow(won: number, className: string): HTMLSpanElement {
  const row = document.createElement('span');
  row.className = className;
  row.innerHTML = [0, 1, 2].map((i) => (i < won ? STAR.replace('<svg', '<svg class="won"') : STAR)).join('');
  return row;
}

function pips(difficulty: number): HTMLSpanElement {
  const row = document.createElement('span');
  row.className = 'pips';
  row.setAttribute('role', 'img');
  row.setAttribute('aria-label', copy.difficultyOf(difficulty));
  for (let i = 1; i <= 3; i++) {
    const leaf = document.createElement('i');
    if (i <= difficulty) leaf.className = 'on';
    row.append(leaf);
  }
  return row;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function button(className: string, text: string, onClick: () => void): HTMLButtonElement {
  const node = el('button', className, text);
  node.type = 'button';
  node.addEventListener('click', () => {
    unlockAudio();
    sound.tap();
    onClick();
  });
  return node;
}

function show(next: Screen): void {
  screen = next;
  stage.showCloseUp(next === 'map');
  app.dataset.screen = next;
  map.hidden = next !== 'map';
  if (next !== 'won') card.hidden = true;
}

function say(text: string): void {
  toast.textContent = text;
  toast.classList.add('on');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('on'), 2200);
}

function updateHud(): void {
  const level = run.level;
  const tier = tierOf(level);
  levelName.textContent = copy.levelLabel(index + 1, level.name);
  tierLabel.replaceChildren(copy.difficulty[tier.difficulty - 1] ?? '', pips(tier.difficulty));
  goalText.textContent = copy.goal;
  hopsLabel.textContent = copy.hopsLabel;
  parLabel.textContent = copy.parLabel;
  hopsCount.textContent = String(run.hops);
  parCount.textContent = String(level.par);
  mapBtn.setAttribute('aria-label', copy.toLevels);
  retryBtn.setAttribute('aria-label', copy.restart);
  muteBtn.setAttribute('aria-label', isMuted() ? copy.unmute : copy.mute);
}

function enter(which: number): void {
  const level = LEVELS[which];
  if (!level) return;
  index = which;
  run = beginRun(level);
  pull = null;
  aimed = null;
  owed = 0;
  window.clearTimeout(cardTimer);
  stage.load(level);
  layout();
  hint.textContent = level.hint;
  demo.hidden = which !== 0;
  toast.classList.remove('on');
  updateHud();
  show('play');
}

// ---------- The map of levels ----------

function showMap(): void {
  window.clearTimeout(cardTimer);
  map.replaceChildren();
  const title = el('h1', 'wordmark');
  for (const line of copy.nameLines) title.append(el('span', '', line));
  const tiers = el('div', 'tiers');
  const upNext = nextUp();
  let number = 0;
  for (const tier of TIERS) {
    const block = el('div', 'tier-block');
    const head = el('div', 'tier-head');
    const hard = el('span', 'how-hard', copy.difficulty[tier.difficulty - 1] ?? '');
    hard.append(pips(tier.difficulty));
    const got = tier.levels.reduce((sum, level) => sum + starsOf(level), 0);
    head.append(el('h2', '', tier.name), hard, el('span', 'got', copy.starsTotal(got, tier.levels.length * 3)));
    const nodes = el('div', 'nodes');
    for (const level of tier.levels) {
      const which = number;
      number += 1;
      const open = isOpen(which);
      const stars = starsOf(level);
      const node = el('button', 'node');
      node.type = 'button';
      node.dataset.state = !open ? 'locked' : which === upNext ? 'next' : stars > 0 ? 'done' : 'open';
      node.setAttribute('aria-label', copy.levelState(which + 1, level.name, stars, !open));
      const disc = el('span', 'disc');
      if (open) disc.textContent = String(which + 1);
      else disc.innerHTML = LOCK;
      node.append(disc, starRow(stars, 'stars'));
      node.addEventListener('click', () => {
        unlockAudio();
        if (!open) {
          say(copy.lockedNote);
          return;
        }
        sound.tap();
        enter(which);
      });
      nodes.append(node);
    }
    block.append(head, nodes);
    tiers.append(block);
  }
  const top = el('div', 'hero');
  top.append(title, el('p', 'lede', copy.tagline));
  const shelf = el('div', 'shelf');
  shelf.append(tiers);
  if (upNext >= 0) {
    const started = LEVELS.some((level) => starsOf(level) > 0);
    shelf.append(button('cta', started ? copy.playOn(upNext + 1) : copy.play(1), () => enter(upNext)));
  } else {
    shelf.append(el('p', 'lede', copy.playAny));
  }
  map.append(top, shelf);
  // The scene behind the map is the level that comes next, with the frog waiting at its start.
  const waiting = LEVELS[Math.max(0, upNext)];
  if (waiting && (waiting !== run.level || run.hops > 0 || run.won)) {
    index = Math.max(0, upNext);
    run = beginRun(waiting);
    stage.load(waiting);
    layout();
  }
  show('map');
}

// ---------- Aiming and hopping ----------

/** Turns a pull on the screen into a hop: back and down means up and forward, like a catapult. */
function aimFrom(event: PointerEvent): void {
  if (!pull) return;
  const scale = stage.pixelsPerTile();
  const dx = (event.clientX - pull.x) / scale;
  const dy = (event.clientY - pull.y) / scale;
  const length = Math.sqrt(dx * dx + dy * dy);
  aimed = length < SHORTEST_PULL ? null : aim(run.frog, (-dx / FULL_PULL) * MAX_SPEED, (-dy / FULL_PULL) * MAX_SPEED);
  if (!aimed) {
    stage.aimAt(null, null);
    return;
  }
  const seen = foresee(run, aimed.vx, aimed.vy, run.level.guide ? 360 : SHORT_LINE, 4);
  const ending = seen.ends?.type;
  const lands: Point | null =
    run.level.guide && (ending === 'stick' || ending === 'settle' || ending === 'web' || ending === 'win')
      ? (seen.points[seen.points.length - 1] ?? null)
      : null;
  const vx = aimed.vx * SPEED_UNIT;
  const vy = aimed.vy * SPEED_UNIT;
  stage.aimAt(seen.points, lands, { x: vx, y: -vy, power: Math.sqrt(vx * vx + vy * vy) / MAX_SPEED });
}

canvas.addEventListener('pointerdown', (event) => {
  unlockAudio();
  if (screen !== 'play' || !run.frog.perched || run.won) return;
  pull = { x: event.clientX, y: event.clientY };
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener('pointermove', (event) => aimFrom(event));

function letGo(): void {
  const shot = aimed;
  pull = null;
  aimed = null;
  stage.aimAt(null, null);
  if (!shot || screen !== 'play') return;
  const from = { ...run.frog };
  if (!hop(run, shot.vx, shot.vy)) return;
  const vx = shot.vx * SPEED_UNIT;
  const vy = shot.vy * SPEED_UNIT;
  stage.kick(from, vx, vy);
  sound.hop(Math.sqrt(vx * vx + vy * vy) / MAX_SPEED);
  hint.textContent = '';
  demo.hidden = true;
  hopsCount.textContent = String(run.hops);
  hopsCount.classList.remove('tick');
  void hopsCount.offsetWidth;
  hopsCount.classList.add('tick');
}

canvas.addEventListener('pointerup', letGo);
canvas.addEventListener('pointercancel', () => {
  pull = null;
  aimed = null;
  stage.aimAt(null, null);
});

function answer(event: Happening): void {
  stage.react(event);
  switch (event.type) {
    case 'stick':
      sound.stick(Math.min(1, event.speed / 20));
      break;
    case 'bounce':
      sound.bounce();
      break;
    case 'boing':
      sound.boing();
      break;
    case 'web':
      sound.web();
      break;
    case 'ouch':
      sound.ouch();
      say(copy.pricked);
      break;
    case 'splash':
      sound.splash();
      say(copy.fell);
      break;
    case 'lost':
      say(copy.lost);
      break;
    case 'win':
      reachFlower();
      break;
    default:
      break;
  }
}

function reachFlower(): void {
  const level = run.level;
  const stars = starsFor(level, run.hops);
  progress.stars[level.id] = Math.max(starsOf(level), stars);
  progress.best[level.id] = Math.min(progress.best[level.id] ?? run.hops, run.hops);
  saveProgress();
  sound.win();
  show('won');
  cardTimer = window.setTimeout(() => showCard(stars), reducedMotion ? 300 : 1100);
}

function showCard(stars: number): void {
  const level = run.level;
  card.replaceChildren();
  const title = run.hops < level.par ? copy.wonUnder : run.hops === level.par ? copy.wonPar : copy.wonOver;
  const big = starRow(stars, 'big-stars');
  big.setAttribute('role', 'img');
  big.setAttribute('aria-label', copy.wonStars(stars));
  card.append(big, el('h2', '', title), el('p', '', copy.wonLine(run.hops, level.par)));
  if (stars < 3) card.append(el('p', '', copy.forThree(level.par)));
  const actions = el('div', 'actions');
  const hasNext = index + 1 < LEVELS.length;
  if (!hasNext) card.append(el('p', '', copy.lastOne));
  const go = hasNext ? button('cta', copy.next, () => enter(index + 1)) : button('cta', copy.toLevels, showMap);
  actions.append(button('quiet', copy.again, () => enter(index)), go);
  card.append(actions);
  card.hidden = false;
  go.focus({ preventScroll: true });
  for (let i = 0; i < stars; i++) window.setTimeout(() => sound.star(i), 250 + i * 250);
}

mapBtn.addEventListener('click', () => {
  sound.tap();
  showMap();
});
retryBtn.addEventListener('click', () => {
  sound.tap();
  enter(index);
});
muteBtn.addEventListener('click', () => {
  unlockAudio();
  setMuted(!isMuted());
  muteBtn.setAttribute('aria-pressed', String(isMuted()));
  muteBtn.setAttribute('aria-label', isMuted() ? copy.unmute : copy.mute);
});

// ---------- Layout and the loop ----------

function layout(): void {
  const box = app.getBoundingClientRect();
  const top = hud.getBoundingClientRect().bottom - box.top;
  stage.resize(box.width, box.height, Math.max(96, top - 26), 14);
}

function frame(ms: number): void {
  const now = ms / 1000;
  const dt = Math.min(0.05, now - last);
  last = now;
  if (screen === 'play') {
    owed += dt;
    for (let steps = 0; owed >= STEP && steps < 12; steps++) {
      owed -= STEP;
      const event = tick(run);
      if (event) answer(event);
      if (run.frog.perched || run.won) owed = 0;
    }
  }
  if (!demo.hidden) {
    const at = stage.screenOf(run.frog.x, run.frog.y);
    demo.style.transform = `translate(${at.x}px, ${at.y}px)`;
  }
  stage.update(dt, run.frog, run.won);
  requestAnimationFrame(frame);
}

window.addEventListener('resize', layout);

stage.load(run.level);
updateHud();
layout();
// A brand-new player goes straight into the first level; everyone else sees the map.
if (LEVELS.some((level) => starsOf(level) > 0)) showMap();
else enter(0);
requestAnimationFrame(frame);

// A hook for automated play-throughs; harmless in production.
Object.assign(window, {
  sticky: {
    state: () => ({
      screen,
      level: run.level.id,
      index,
      hops: run.hops,
      won: run.won,
      perched: run.frog.perched,
      x: run.frog.x,
      y: run.frog.y,
    }),
    /** The drag, in pixels, that makes a hop of the given speed (in speed units). */
    pullFor: (vx: number, vy: number) => {
      const scale = (stage.pixelsPerTile() * FULL_PULL * SPEED_UNIT) / MAX_SPEED;
      return { dx: -vx * scale, dy: -vy * scale };
    },
    showMap,
  },
});
