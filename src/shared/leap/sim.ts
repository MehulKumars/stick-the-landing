// The rules of a hop. Pure and deterministic: only +, -, *, / and square roots, in fixed steps, so the
// server can replay a player's hops and land the frog in exactly the same place.
import {
  BOARD_H,
  BOARD_W,
  FROG_R,
  GRAVITY,
  LEAST_LIFT,
  MAX_SPEED,
  MIN_SPEED,
  SPEED_UNIT,
  STEP,
  isTile,
} from './types.ts';
import type { Frog, Happening, Level, LevelPlan, Point, Run, Tile } from './types.ts';

/** How much speed wet stone gives back on a bounce. */
const STONE_BOUNCE = 0.35;
/** Below this speed a landing on stone is a slide, not a bounce. */
const SETTLE_SPEED = 1.6;
/** How quickly a slide on stone slows, in tiles per second, per second. */
const STONE_GRIP = 16;
/** A mushroom always throws the frog off at this speed, however it arrived: about seven tiles high. */
const SPRING = 22;
/** How near the middle of a web or the flower the frog's middle has to come. */
const WEB_REACH = 0.45;
const FLOWER_REACH = 0.62;
/** A hop that is still in the air after this many steps (ten seconds) is called off. */
const LONGEST_HOP = 1200;

export function readLevel(plan: LevelPlan): Level {
  const h = plan.rows.length;
  const w = plan.rows[0]?.length ?? 0;
  if (w !== BOARD_W || h !== BOARD_H) throw new Error(`${plan.id}: a level is ${BOARD_W} by ${BOARD_H}`);
  const tiles: Tile[] = [];
  let start: Point | null = null;
  let flower: Point | null = null;
  plan.rows.forEach((row, y) => {
    if (row.length !== w) throw new Error(`${plan.id}: row ${y} is ${row.length} wide`);
    for (let x = 0; x < w; x++) {
      const mark = row[x] ?? '.';
      if (mark === 'S') start = { x: x + 0.5, y: y + 1 - FROG_R };
      else if (mark === 'F') flower = { x: x + 0.5, y: y + 0.5 };
      else if (!isTile(mark)) throw new Error(`${plan.id}: unknown mark "${mark}"`);
      tiles.push(isTile(mark) ? mark : '.');
    }
  });
  if (!start || !flower) throw new Error(`${plan.id}: needs an S and an F`);
  return { id: plan.id, name: plan.name, hint: plan.hint, par: plan.par, guide: plan.guide === true, w, h, tiles, start, flower };
}

/** What is in a cell. Past the sides is slick bamboo; above the top is open air; below the bottom is a long fall. */
export function tileAt(level: Level, cx: number, cy: number): Tile {
  if (cx < 0 || cx >= level.w) return 'o';
  if (cy < 0 || cy >= level.h) return '.';
  return level.tiles[cy * level.w + cx] ?? '.';
}

function isSolid(tile: Tile): boolean {
  return tile === '#' || tile === 'o' || tile === 'M' || tile === '^';
}

export function beginRun(level: Level): Run {
  const frog: Frog = { x: level.start.x, y: level.start.y, vx: 0, vy: 0, perched: true, nx: 0, ny: -1, web: -1 };
  return { level, frog, home: { ...frog }, hops: 0, won: false, ticks: 0 };
}

/**
 * Turns a wished-for hop (tiles per second, any size) into one the frog can make from where it is:
 * no harder than its legs allow, leaving its perch rather than going into it, and rounded to whole
 * speed units. Returns null when the pull is too weak to be a hop.
 */
export function aim(frog: Frog, wantX: number, wantY: number): { vx: number; vy: number } | null {
  let vx = wantX;
  let vy = wantY;
  let speed = Math.sqrt(vx * vx + vy * vy);
  if (speed < MIN_SPEED) return null;
  if (speed > MAX_SPEED) {
    vx *= MAX_SPEED / speed;
    vy *= MAX_SPEED / speed;
    speed = MAX_SPEED;
  }
  if (frog.nx !== 0 || frog.ny !== 0) {
    // Split the hop into the part that leaves the surface and the part that runs along it.
    const lift = vx * frog.nx + vy * frog.ny;
    const least = speed * (LEAST_LIFT + 0.08);
    if (lift < least) {
      const alongX = vx - lift * frog.nx;
      const alongY = vy - lift * frog.ny;
      const along = Math.sqrt(alongX * alongX + alongY * alongY);
      const keep = Math.sqrt(speed * speed - least * least);
      // Pulled straight into the surface: hop straight out instead.
      const scale = along > 1e-6 ? keep / along : 0;
      const out = along > 1e-6 ? least : speed;
      vx = alongX * scale + frog.nx * out;
      vy = alongY * scale + frog.ny * out;
    }
  }
  // Rounding towards zero never makes a hop harder than allowed.
  return { vx: Math.trunc(vx / SPEED_UNIT), vy: Math.trunc(vy / SPEED_UNIT) };
}

/** Whether a hop (in speed units) is one the frog may make right now. */
export function canHop(run: Run, vx: number, vy: number): boolean {
  const { frog } = run;
  if (run.won || !frog.perched || !Number.isInteger(vx) || !Number.isInteger(vy)) return false;
  const sx = vx * SPEED_UNIT;
  const sy = vy * SPEED_UNIT;
  const speed = Math.sqrt(sx * sx + sy * sy);
  if (speed > MAX_SPEED + 1e-9 || speed < MIN_SPEED - 2 * SPEED_UNIT) return false;
  if (frog.nx === 0 && frog.ny === 0) return true;
  return sx * frog.nx + sy * frog.ny >= speed * LEAST_LIFT;
}

/** Starts a hop. `vx` and `vy` are whole speed units (see `aim`). */
export function hop(run: Run, vx: number, vy: number): boolean {
  if (!canHop(run, vx, vy)) return false;
  run.frog.vx = vx * SPEED_UNIT;
  run.frog.vy = vy * SPEED_UNIT;
  run.frog.perched = false;
  run.hops += 1;
  run.ticks = 0;
  return true;
}

function happening(type: Happening['type'], frog: Frog, nx = 0, ny = 0, speed = 0, cell = -1): Happening {
  return { type, x: frog.x, y: frog.y, nx, ny, speed, cell };
}

function holdOn(run: Run, nx: number, ny: number): void {
  const { frog } = run;
  frog.vx = 0;
  frog.vy = 0;
  frog.perched = true;
  frog.nx = nx;
  frog.ny = ny;
  run.home = { ...frog };
}

/** The frog fell, was pricked or got lost: it goes back to where it last held on. The hop still counts. */
function fall(run: Run, type: 'ouch' | 'splash' | 'lost'): Happening {
  const where = happening(type, run.frog);
  run.frog = { ...run.home };
  return where;
}

/** Moves the hop on by one step. Returns what happened, if anything did. */
export function tick(run: Run): Happening | null {
  const { level, frog } = run;
  if (frog.perched || run.won) return null;
  run.ticks += 1;
  frog.vy += GRAVITY * STEP;
  frog.x += frog.vx * STEP;
  frog.y += frog.vy * STEP;

  const toFlowerX = frog.x - level.flower.x;
  const toFlowerY = frog.y - level.flower.y;
  if (toFlowerX * toFlowerX + toFlowerY * toFlowerY < FLOWER_REACH * FLOWER_REACH) {
    run.won = true;
    frog.vx = 0;
    frog.vy = 0;
    return happening('win', frog);
  }

  if (frog.y > level.h + 1) return fall(run, 'splash');
  if (run.ticks > LONGEST_HOP) return fall(run, 'lost');
  const cx = Math.floor(frog.x);
  const cy = Math.floor(frog.y);
  const here = tileAt(level, cx, cy);
  if (here === '~') return fall(run, 'splash');

  // A web holds the frog where it is. The one it has just left can't catch it again until it is clear.
  if (frog.web >= 0) {
    const wx = (frog.web % level.w) + 0.5 - frog.x;
    const wy = Math.floor(frog.web / level.w) + 0.5 - frog.y;
    if (wx * wx + wy * wy > 0.8 * 0.8) frog.web = -1;
  }
  if (here === 'W') {
    const cell = cy * level.w + cx;
    const wx = cx + 0.5 - frog.x;
    const wy = cy + 0.5 - frog.y;
    if (cell !== frog.web && wx * wx + wy * wy < WEB_REACH * WEB_REACH) {
      frog.x = cx + 0.5;
      frog.y = cy + 0.5;
      frog.web = cell;
      holdOn(run, 0, 0);
      return happening('web', frog, 0, 0, 0, cell);
    }
  }

  // Of everything solid the frog overlaps, deal with whatever it is deepest into. On a flat run of
  // tiles that is always the flat face, never the corner of a neighbour.
  let deepest = 0;
  let hit: Tile = '.';
  let hitCell = -1;
  let nx = 0;
  let ny = 0;
  for (let ty = Math.floor(frog.y - FROG_R); ty <= Math.floor(frog.y + FROG_R); ty++) {
    for (let tx = Math.floor(frog.x - FROG_R); tx <= Math.floor(frog.x + FROG_R); tx++) {
      const tile = tileAt(level, tx, ty);
      if (!isSolid(tile)) continue;
      const nearX = frog.x < tx ? tx : frog.x > tx + 1 ? tx + 1 : frog.x;
      const nearY = frog.y < ty ? ty : frog.y > ty + 1 ? ty + 1 : frog.y;
      const dx = frog.x - nearX;
      const dy = frog.y - nearY;
      const gap2 = dx * dx + dy * dy;
      if (gap2 >= FROG_R * FROG_R) continue;
      let depth: number;
      let outX = 0;
      let outY = 0;
      if (gap2 > 1e-12) {
        const gap = Math.sqrt(gap2);
        depth = FROG_R - gap;
        outX = dx / gap;
        outY = dy / gap;
      } else {
        // The frog's middle is inside the tile: leave by the nearest face.
        const left = frog.x - tx;
        const right = tx + 1 - frog.x;
        const top = frog.y - ty;
        const bottom = ty + 1 - frog.y;
        const least = Math.min(left, right, top, bottom);
        depth = FROG_R + least;
        if (least === top) outY = -1;
        else if (least === bottom) outY = 1;
        else if (least === left) outX = -1;
        else outX = 1;
      }
      if (depth > deepest) {
        deepest = depth;
        hit = tile;
        hitCell = ty >= 0 && ty < level.h && tx >= 0 && tx < level.w ? ty * level.w + tx : -1;
        nx = outX;
        ny = outY;
      }
    }
  }
  if (deepest === 0) return null;

  if (hit === '^') return fall(run, 'ouch');
  frog.x += nx * deepest;
  frog.y += ny * deepest;
  const into = frog.vx * nx + frog.vy * ny;
  // Moving away from the surface already: nothing more to do than to be pushed clear of it.
  if (into >= 0) return null;

  if (hit === '#') {
    holdOn(run, nx, ny);
    return happening('stick', frog, nx, ny, -into, hitCell);
  }
  if (hit === 'M') {
    frog.vx += (SPRING - into) * nx;
    frog.vy += (SPRING - into) * ny;
    return happening('boing', frog, nx, ny, -into, hitCell);
  }
  // Wet stone. A slow landing on top of it becomes a slide that grinds to a halt; anything else bounces.
  if (ny < -0.7 && -into < SETTLE_SPEED) {
    frog.vx -= into * nx;
    frog.vy -= into * ny;
    const slow = STONE_GRIP * STEP;
    if (frog.vx > slow) frog.vx -= slow;
    else if (frog.vx < -slow) frog.vx += slow;
    else {
      holdOn(run, 0, -1);
      return happening('settle', frog, 0, -1, 0, hitCell);
    }
    return null;
  }
  frog.vx -= (1 + STONE_BOUNCE) * into * nx;
  frog.vy -= (1 + STONE_BOUNCE) * into * ny;
  return happening('bounce', frog, nx, ny, -into, hitCell);
}

/** Plays a hop to its end without drawing it. Returns the last thing that happened. */
export function playHop(run: Run, vx: number, vy: number): Happening | null {
  if (!hop(run, vx, vy)) return null;
  let last: Happening | null = null;
  while (!run.frog.perched && !run.won) {
    const event = tick(run);
    if (event) last = event;
  }
  return last;
}

/**
 * Where a hop would go, without making it: a point every `every` steps for up to `steps` steps,
 * stopping at the first thing the frog would hit. `ends` says what that was, if the arc got that far.
 */
export function foresee(
  run: Run,
  vx: number,
  vy: number,
  steps: number,
  every: number
): { points: Point[]; ends: Happening | null } {
  const ghost: Run = { level: run.level, frog: { ...run.frog }, home: { ...run.home }, hops: 0, won: false, ticks: 0 };
  const points: Point[] = [];
  if (!hop(ghost, vx, vy)) return { points, ends: null };
  for (let i = 1; i <= steps; i++) {
    const before = { x: ghost.frog.x, y: ghost.frog.y };
    const event = tick(ghost);
    if (event) {
      // After a fall the ghost is back home; the arc ends where it fell.
      points.push(event.type === 'ouch' || event.type === 'splash' || event.type === 'lost' ? before : { x: event.x, y: event.y });
      return { points, ends: event };
    }
    if (i % every === 0) points.push({ x: ghost.frog.x, y: ghost.frog.y });
  }
  return { points, ends: null };
}

/** Replays a list of hops on a fresh run (what the server does with a submitted result). */
export function replay(level: Level, hops: readonly (readonly [number, number])[]): Run {
  const run = beginRun(level);
  for (const [vx, vy] of hops) {
    if (run.won) break;
    playHop(run, vx, vy);
  }
  return run;
}

/** Three stars at par or better, two within two hops of it, one for getting there at all. */
export function starsFor(level: Level, hops: number): number {
  if (hops <= level.par) return 3;
  if (hops <= level.par + 2) return 2;
  return 1;
}
