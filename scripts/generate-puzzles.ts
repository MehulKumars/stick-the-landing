// Generates the daily town bank: one solver-verified town per UTC day.
// Run: node --experimental-strip-types scripts/generate-puzzles.ts [--from 2026-11-15] [--to 2027-12-31] [--noon one|half]
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  addDays,
  daysBetween,
  isDayKey,
  weekdayOf,
} from '../src/shared/dates.ts';
import {
  bandFor,
  generateTownReliably,
  townNames,
} from '../src/shared/engine/index.ts';
import type { NoonRule } from '../src/shared/engine/index.ts';
import type { Bank, BankEntry } from '../src/shared/bank.ts';

function option(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  const value = i >= 0 ? process.argv[i + 1] : undefined;
  return value ?? fallback;
}

const from = option('from', '2026-11-15');
const to = option('to', '2027-12-31');
const noon = option('noon', 'one');
if (!isDayKey(from) || !isDayKey(to) || daysBetween(from, to) < 0)
  throw new Error('Bad --from/--to');
if (noon !== 'one' && noon !== 'half')
  throw new Error('--noon must be one or half');
const noonRule: NoonRule = noon;

const names = townNames('siesta-town-names-v1');
const days: Record<string, BankEntry> = {};
const started = Date.now();
const total = daysBetween(from, to) + 1;

for (let i = 0; i < total; i++) {
  const date = addDays(from, i);
  const band = bandFor(weekdayOf(date));
  const town = generateTownReliably(band, `siesta:${date}`, noonRule);
  const title = names[i % names.length] ?? 'Little Town';
  days[date] = {
    date,
    title,
    level: band.level,
    band: band.name,
    puzzle: town.puzzle,
    solution: town.solution,
    solutions: town.solutions,
    nodes: town.nodes,
  };
  if ((i + 1) % 50 === 0 || i === total - 1) {
    console.log(
      `${i + 1}/${total} towns (${((Date.now() - started) / 1000).toFixed(0)} s)`
    );
  }
}

const bank: Bank = { noonRule, from, to, days };
const out = fileURLToPath(
  new URL('../src/server/content/bank.json', import.meta.url)
);
writeFileSync(out, JSON.stringify(bank));
console.log(
  `Wrote ${total} towns (${from} to ${to}, noon rule "${noonRule}") to src/server/content/bank.json`
);
