import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, TIERS } from './levels.ts';
import { aim, beginRun, canHop, foresee, hop, playHop, readLevel, replay, starsFor, tick } from './sim.ts';
import { solve } from './solve.ts';
import { FROG_R, MAX_SPEED, SPEED_UNIT } from './types.ts';
import type { LevelPlan } from './types.ts';

function plan(rows: string[]): LevelPlan {
  return { id: 'test', name: 'Test', hint: '', par: 1, rows };
}

const OPEN = Array.from({ length: 10 }, () => '........');

test('every level can be finished, and its par is the fewest hops the solver finds', () => {
  for (const level of LEVELS) {
    const route = solve(level);
    assert.ok(route, `${level.id} has no route`);
    assert.equal(route.length, level.par, `${level.id}: par is ${level.par}, solver needs ${route.length}`);
    const run = replay(level, route);
    assert.equal(run.won, true, `${level.id}: the route does not replay`);
    assert.equal(run.hops, route.length);
  }
});

test('levels get harder by tier, and every level has a name and a hint', () => {
  assert.deepEqual(TIERS.map((tier) => tier.difficulty), [1, 2, 3]);
  assert.equal(new Set(LEVELS.map((level) => level.id)).size, LEVELS.length);
  for (const level of LEVELS) {
    assert.ok(level.name.length > 0);
    assert.ok(level.hint.length > 0, `${level.id} has no hint`);
  }
});

test('a hop plays out the same every time', () => {
  const level = LEVELS[2];
  assert.ok(level);
  const a = replay(level, [[-31, -115], [46, -127]]);
  const b = replay(level, [[-31, -115], [46, -127]]);
  assert.deepEqual(a.frog, b.frog);
  assert.equal(a.hops, 2);
});

test('the frog sticks to bark where it lands, facing out of the wall', () => {
  const level = readLevel(plan(['.......F', ...OPEN.slice(1), '.S....#.', '########', '########']));
  const run = beginRun(level);
  // A flat, hard hop to the right runs into the block at x = 6.
  const end = playHop(run, 120, -50);
  assert.equal(end?.type, 'stick');
  assert.equal(run.frog.perched, true);
  assert.ok(Math.abs(run.frog.x - (6 - FROG_R)) < 1e-9, `stuck at x = ${run.frog.x}`);
  assert.equal(run.frog.nx, -1);
  assert.equal(run.frog.ny, 0);
  // From a wall that faces left, a hop to the right goes into the wall: not allowed.
  assert.equal(canHop(run, 60, -60), false);
  assert.equal(canHop(run, -60, -60), true);
});

test('water and thorns send the frog back to its last perch, and the hop still counts', () => {
  const level = readLevel(plan([...OPEN, '.S......', '##^^^^^F', '~~~~~~~~']));
  const run = beginRun(level);
  const home = { ...run.frog };
  const end = playHop(run, 40, -60);
  assert.equal(end?.type, 'ouch');
  assert.deepEqual(run.frog, home);
  assert.equal(run.hops, 1);
});

test('wet stone cannot be held: the frog slides to a stop on top of it', () => {
  const level = readLevel(plan([...OPEN, '.S......', '#ooooooo', '#######F']));
  const run = beginRun(level);
  const end = playHop(run, 40, -50);
  assert.equal(end?.type, 'settle');
  assert.equal(run.frog.ny, -1);
  assert.ok(run.frog.x > 3, 'it should have slid on after landing');
});

test('a mushroom throws the frog higher than it can hop', () => {
  const level = readLevel(plan([...OPEN, '.S.M....', '########', '#######F']));
  const run = beginRun(level);
  assert.equal(hop(run, 28, -90), true);
  let top = run.frog.y;
  let bounced = false;
  for (let i = 0; i < 400 && !run.frog.perched; i++) {
    if (tick(run)?.type === 'boing') bounced = true;
    top = Math.min(top, run.frog.y);
  }
  assert.equal(bounced, true);
  const best = (MAX_SPEED * MAX_SPEED) / (2 * 34);
  assert.ok(level.start.y - top > best + 1.5, `rose ${level.start.y - top}, a hop reaches ${best}`);
});

test('a mushroom throws straight up from the middle of its cap, whatever way the frog came', () => {
  const level = readLevel(plan(['.......F', ...OPEN.slice(1), '.S.M....', '########', '########']));
  for (const [vx, vy] of [[28, -90], [40, -70], [20, -100]] as const) {
    const run = beginRun(level);
    assert.equal(hop(run, vx, vy), true);
    let thrown = false;
    for (let i = 0; i < 300 && !thrown; i++) thrown = tick(run)?.type === 'boing';
    assert.equal(thrown, true, `hop ${vx}, ${vy} never reached the mushroom`);
    assert.equal(run.frog.vx, 0);
    assert.equal(run.frog.vy, -22);
    assert.equal(run.frog.x, 3.5);
    assert.equal(run.frog.y, 10 - FROG_R);
  }
});

test('a mushroom throws once a hop: coming back down on it, the frog sits on top', () => {
  const level = readLevel(plan(['.......F', ...OPEN.slice(1), '.S.M....', '########', '########']));
  const run = beginRun(level);
  const end = playHop(run, 28, -90);
  assert.equal(end?.type, 'stick');
  assert.equal(run.frog.x, 3.5);
  assert.equal(run.frog.y, 10 - FROG_R);
  assert.equal(run.frog.ny, -1);
  assert.equal(run.hops, 1);
});

test('a mushroom on a wall throws sideways', () => {
  const level = readLevel(plan(['.......F', ...OPEN.slice(1, 6), '#M......', ...OPEN.slice(7), '.S......', '########', '########']));
  const run = beginRun(level);
  assert.equal(hop(run, 0, -136), true);
  let thrown = null;
  for (let i = 0; i < 300 && !thrown; i++) {
    const event = tick(run);
    if (event?.type === 'boing') thrown = event;
  }
  assert.ok(thrown);
  assert.equal(run.frog.vx, 22);
  assert.equal(run.frog.vy, 0);
});

test('a frog that comes to rest touching the ring round the flower has reached it', () => {
  // The flower stands on the ledge; the frog lands on the same ledge, one tile to its left.
  const level = readLevel(plan([...OPEN.slice(0, 8), '.....F..', '....###.', '.S......', '########', '########']));
  const run = beginRun(level);
  playHop(run, 41, -112);
  assert.equal(run.won, true);
  // A full tile and a half away is not close enough.
  const far = readLevel(plan([...OPEN.slice(0, 8), '......F.', '....###.', '.S......', '########', '########']));
  const other = beginRun(far);
  other.frog.x = 4.4;
  other.frog.y = 9 - FROG_R;
  assert.equal(hop(other, 0, -40), true);
  let last = null;
  while (!other.frog.perched && !other.won) last = tick(other) ?? last;
  assert.equal(other.won, false);
  assert.equal(last?.type, 'stick');
});

test('catching the corner of a block, the frog shuffles onto a flat face', () => {
  const level = readLevel(plan(['.......F', ...OPEN.slice(1), '.S..#...', '########', '########']));
  for (let vy = -60; vy >= -110; vy -= 2) {
    for (let vx = 30; vx <= 90; vx += 4) {
      const run = beginRun(level);
      const end = playHop(run, vx, vy);
      if (end?.type !== 'stick') continue;
      const flat = (run.frog.nx === 0 && Math.abs(run.frog.ny) === 1) || (run.frog.ny === 0 && Math.abs(run.frog.nx) === 1);
      assert.equal(flat, true, `hop ${vx}, ${vy} left the frog on a corner (${run.frog.nx}, ${run.frog.ny})`);
    }
  }
});

test('a web holds the frog in mid-air, and lets it hop any way', () => {
  const level = readLevel(plan([...OPEN.slice(0, 7), '.W......', '........', '........', '.S......', '########', '#######F']));
  const run = beginRun(level);
  const end = playHop(run, 0, -110);
  assert.equal(end?.type, 'web');
  assert.equal(run.frog.x, 1.5);
  assert.equal(run.frog.y, 7.5);
  assert.equal(canHop(run, 0, 60), true);
  assert.equal(canHop(run, 0, -60), true);
});

test('aiming never asks for more than the frog can do, and never into its perch', () => {
  const frog = beginRun(readLevel(plan([...OPEN, '.S......', '########', '#######F']))).frog;
  const hard = aim(frog, 300, -300);
  assert.ok(hard);
  assert.ok(Math.hypot(hard.vx, hard.vy) * SPEED_UNIT <= MAX_SPEED + 1e-9);
  // Pulled straight down into the ground: the hop is turned to leave the ground.
  const down = aim(frog, 0, 12);
  assert.ok(down);
  assert.ok(down.vy < 0);
  assert.equal(aim(frog, 0.5, -0.5), null);
});

test('the dotted line is the start of the real hop', () => {
  const level = LEVELS[0];
  assert.ok(level);
  const run = beginRun(level);
  const seen = foresee(run, 50, -108, 400, 4);
  assert.equal(seen.ends?.type, 'win');
  assert.equal(run.hops, 0, 'looking ahead must not use up a hop');
  playHop(run, 50, -108);
  assert.equal(run.won, true);
});

test('stars: three at par or better, two within two hops, one for finishing', () => {
  const level = LEVELS[2];
  assert.ok(level);
  assert.equal(starsFor(level, level.par - 1), 3);
  assert.equal(starsFor(level, level.par), 3);
  assert.equal(starsFor(level, level.par + 2), 2);
  assert.equal(starsFor(level, level.par + 3), 1);
});
