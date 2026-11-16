// Runs the solver over every built-in level and prints the fewest hops it finds next to the par on file:
//   node --experimental-strip-types scripts/check-levels.ts
import { LEVELS } from '../src/shared/leap/levels.ts';
import { replay } from '../src/shared/leap/sim.ts';
import { solve } from '../src/shared/leap/solve.ts';

for (const level of LEVELS) {
  const t0 = performance.now();
  const route = solve(level);
  const ms = Math.round(performance.now() - t0);
  if (!route) {
    console.log(`${level.id.padEnd(16)} NO ROUTE (${ms} ms)`);
    continue;
  }
  const check = replay(level, route);
  const note = route.length === level.par ? '' : `  <-- par on file is ${level.par}`;
  console.log(
    `${level.id.padEnd(16)} ${route.length} hops, replay ${check.won ? 'wins' : 'FAILS'} (${ms} ms) ${JSON.stringify(route)}${note}`
  );
}
