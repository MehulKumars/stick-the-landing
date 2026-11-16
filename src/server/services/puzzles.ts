import { redis } from '@devvit/web/server';
import bankText from '../content/bank.json?raw';
import type { Bank, BankEntry } from '../../shared/bank.ts';
import type { PublicTown } from '../../shared/api.ts';
import { daysBetween, weekdayOf } from '../../shared/dates.ts';
import type { DayKey } from '../../shared/dates.ts';
import {
  bandFor,
  generateTownReliably,
  townNames,
} from '../../shared/engine/index.ts';
import type { NoonRule } from '../../shared/engine/index.ts';
import { expiresIn, keys, ttlSeconds } from '../repo/keys.ts';

const bank: Bank = JSON.parse(bankText);

export const noonRule: NoonRule = bank.noonRule;

const names = townNames('siesta-town-names-v1');

/** The town for a day: from the bank, else generated once with the same seed and cached. */
export async function townFor(date: DayKey): Promise<BankEntry> {
  const banked = bank.days[date];
  if (banked) return banked;

  const cached = await redis.get(keys.generatedTown(date));
  if (cached) {
    const parsed: BankEntry = JSON.parse(cached);
    return parsed;
  }

  const band = bandFor(weekdayOf(date));
  const town = generateTownReliably(band, `siesta:${date}`, noonRule);
  const index =
    ((daysBetween(bank.from, date) % names.length) + names.length) %
    names.length;
  const entry: BankEntry = {
    date,
    title: names[index] ?? 'Little Town',
    level: band.level,
    band: band.name,
    puzzle: town.puzzle,
    solution: town.solution,
    solutions: town.solutions,
    nodes: town.nodes,
  };
  await redis.set(keys.generatedTown(date), JSON.stringify(entry), {
    expiration: expiresIn(ttlSeconds.generatedTown),
  });
  console.warn(
    `Generated a town at runtime for ${date}: the bank doesn't cover it`
  );
  return entry;
}

/** Everything the client may see. The solution never leaves the server. */
export function publicTown(entry: BankEntry, number: number): PublicTown {
  return {
    date: entry.date,
    number,
    title: entry.title,
    level: entry.level,
    band: entry.band,
    puzzle: entry.puzzle,
    noonRule,
  };
}
