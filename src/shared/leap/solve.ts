// Finds a way through a level in the fewest hops, by trying a fan of hops from every perch the frog can
// reach. This is how a level's par is set and how every level is proven finishable before it ships.
import { beginRun, canHop, playHop } from './sim.ts';
import { SPEED_UNIT } from './types.ts';
import type { Frog, Level, Run } from './types.ts';

export type Route = (readonly [number, number])[];

/** The hops the solver tries from each perch: every 5 degrees, at seven strengths. In whole speed units. */
const FAN: (readonly [number, number])[] = [];
for (const speed of [5, 7, 9, 11, 13, 15, 17]) {
  for (let step = 0; step < 72; step++) {
    const angle = (step * Math.PI) / 36;
    FAN.push([
      Math.trunc((Math.cos(angle) * speed) / SPEED_UNIT),
      Math.trunc((Math.sin(angle) * speed) / SPEED_UNIT),
    ]);
  }
}

/** Perches a quarter of a tile apart, facing the same way, count as the same place. */
function placeOf(frog: Frog): string {
  return `${Math.round(frog.x * 4)},${Math.round(frog.y * 4)},${Math.round(frog.nx * 2)},${Math.round(frog.ny * 2)},${frog.web}`;
}

/** The shortest route the fan of hops can find, or null if there is none within `most` hops. */
export function solve(level: Level, most = 12): Route | null {
  const first = beginRun(level).frog;
  const seen = new Set<string>([placeOf(first)]);
  let frontier: { frog: Frog; route: Route }[] = [{ frog: first, route: [] }];
  for (let hops = 1; hops <= most && frontier.length > 0; hops++) {
    const next: { frog: Frog; route: Route }[] = [];
    for (const from of frontier) {
      for (const [vx, vy] of FAN) {
        const run: Run = { level, frog: { ...from.frog }, home: { ...from.frog }, hops: 0, won: false, ticks: 0 };
        if (!canHop(run, vx, vy)) continue;
        const end = playHop(run, vx, vy);
        if (run.won) return [...from.route, [vx, vy]];
        if (!end || end.type === 'ouch' || end.type === 'splash' || end.type === 'lost') continue;
        const place = placeOf(run.frog);
        if (seen.has(place)) continue;
        seen.add(place);
        next.push({ frog: { ...run.frog }, route: [...from.route, [vx, vy]] });
      }
    }
    frontier = next;
  }
  return null;
}
