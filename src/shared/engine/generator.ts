import { castShadow } from './rules.ts';
import { pick, seededRandom, shuffle } from './rng.ts';
import { solve } from './solver.ts';
import { TIMES } from './types.ts';
import type {
  Cat,
  NoonRule,
  Placements,
  Puzzle,
  Tile,
  TimeOfDay,
} from './types.ts';

/** A difficulty band. Targets come from docs/04-GAME-SPEC.md A4. */
export type Band = {
  name: string;
  /** Difficulty dots shown to players, 1–7. */
  level: number;
  size: number;
  heights: number[];
  cats: number;
  /** Flowers to start with, and the most the generator may add to make the solution unique. */
  flowers: [number, number];
  wells: number;
  /** Most solutions allowed. */
  limit: number;
};

/** Indexed by weekday: 0 = Sunday … 6 = Saturday. Sunday is a 7×7 special until community towns take over. */
export const BANDS: readonly Band[] = [
  {
    name: 'Sunday special',
    level: 7,
    size: 7,
    heights: [4, 3, 2, 1],
    cats: 5,
    flowers: [5, 9],
    wells: 3,
    limit: 1,
  },
  {
    name: 'Monday',
    level: 1,
    size: 5,
    heights: [2, 1],
    cats: 2,
    flowers: [2, 4],
    wells: 0,
    limit: 3,
  },
  {
    name: 'Tuesday',
    level: 2,
    size: 5,
    heights: [3, 2, 1],
    cats: 3,
    flowers: [2, 5],
    wells: 1,
    limit: 2,
  },
  {
    name: 'Wednesday',
    level: 3,
    size: 6,
    heights: [3, 2, 1],
    cats: 3,
    flowers: [3, 6],
    wells: 1,
    limit: 1,
  },
  {
    name: 'Thursday',
    level: 4,
    size: 6,
    heights: [3, 2, 1],
    cats: 4,
    flowers: [4, 7],
    wells: 1,
    limit: 1,
  },
  {
    name: 'Friday',
    level: 5,
    size: 6,
    heights: [4, 3, 2, 1],
    cats: 4,
    flowers: [4, 8],
    wells: 2,
    limit: 1,
  },
  {
    name: 'Saturday',
    level: 6,
    size: 7,
    heights: [4, 3, 2, 1],
    cats: 5,
    flowers: [4, 8],
    wells: 2,
    limit: 1,
  },
];

export function bandFor(weekday: number): Band {
  const band = BANDS[weekday];
  if (!band) throw new Error(`No band for weekday ${weekday}`);
  return band;
}

export type GeneratedTown = {
  puzzle: Puzzle;
  solution: Placements;
  solutions: number;
  nodes: number;
  attempts: number;
};

function neighbours(size: number, cell: number): number[] {
  const row = Math.floor(cell / size);
  const col = cell % size;
  const out: number[] = [];
  if (row > 0) out.push(cell - size);
  if (row < size - 1) out.push(cell + size);
  if (col > 0) out.push(cell - 1);
  if (col < size - 1) out.push(cell + 1);
  return out;
}

function toPuzzle(
  size: number,
  heights: number[],
  tiles: Tile[],
  naps: Map<number, TimeOfDay>
): Puzzle {
  const cats: Cat[] = [];
  const flowers: number[] = [];
  const wells: number[] = [];
  tiles.forEach((tile, cell) => {
    const nap = naps.get(cell);
    if (tile === 'cat' && nap) cats.push({ cell, nap });
    if (tile === 'flower') flowers.push(cell);
    if (tile === 'well') wells.push(cell);
  });
  return { size, heights: [...heights], cats, flowers, wells };
}

/**
 * Builds a town backwards from a hidden solution: place the houses, put cats in their shade and
 * flowers in full sun, then keep adding flowers that rule out other solutions until the band's
 * solution limit is met. Deterministic for a given seed.
 */
export function generateTown(
  band: Band,
  seed: string,
  noonRule: NoonRule,
  maxAttempts = 800
): GeneratedTown {
  const random = seededRandom(seed);
  const { size, heights } = band;
  const n = size * size;
  const allCells = [...Array(n).keys()];

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const tiles: Tile[] = new Array<Tile>(n).fill('ground');
    const naps = new Map<number, TimeOfDay>();
    const order = shuffle(random, allCells);
    let next = 0;
    const take = (): number => {
      const cell = order[next++];
      if (cell === undefined) throw new Error('Ran out of cells');
      return cell;
    };
    for (let w = 0; w < band.wells; w++) tiles[take()] = 'well';
    const solution = heights.map(() => take());

    const shadeAt: Record<TimeOfDay, Set<number>> = {
      am: new Set(),
      noon: new Set(),
      pm: new Set(),
    };
    solution.forEach((cell, i) => {
      const height = heights[i] ?? 0;
      for (const t of TIMES)
        castShadow(size, cell, height, t, noonRule).forEach((s) =>
          shadeAt[t].add(s)
        );
    });
    const occupied = new Set(solution);
    const isFree = (cell: number): boolean =>
      tiles[cell] === 'ground' && !occupied.has(cell);

    // Cats sit in shade, preferring tiles shaded at exactly one time of day.
    const catSpots = allCells
      .filter(isFree)
      .map((cell) => ({
        cell,
        times: TIMES.filter((t) => shadeAt[t].has(cell)),
      }))
      .filter((spot) => spot.times.length > 0);
    const preferred = [
      ...shuffle(
        random,
        catSpots.filter((s) => s.times.length === 1)
      ),
      ...shuffle(
        random,
        catSpots.filter((s) => s.times.length > 1)
      ),
    ].slice(0, band.cats);
    if (preferred.length < band.cats) continue;
    for (const spot of preferred) {
      tiles[spot.cell] = 'cat';
      naps.set(spot.cell, pick(random, spot.times));
    }

    // Flowers sit in full sun, preferring tiles next to a shadow (they make good decoys).
    const sunny = allCells.filter(
      (cell) => isFree(cell) && TIMES.every((t) => !shadeAt[t].has(cell))
    );
    if (sunny.length < band.flowers[0]) continue;
    const nearShade = (cell: number): boolean =>
      neighbours(size, cell).some((x) => TIMES.some((t) => shadeAt[t].has(x)));
    const flowerPool = [
      ...shuffle(random, sunny.filter(nearShade)),
      ...shuffle(
        random,
        sunny.filter((c) => !nearShade(c))
      ),
    ];
    let flowers = 0;
    for (const cell of flowerPool.slice(0, band.flowers[0])) {
      tiles[cell] = 'flower';
      flowers++;
    }

    for (;;) {
      const puzzle = toPuzzle(size, heights, tiles, naps);
      const result = solve(puzzle, noonRule, band.limit, 12);
      if (result.count >= 1 && result.count <= band.limit) {
        return {
          puzzle,
          solution,
          solutions: result.count,
          nodes: result.nodes,
          attempts: attempt + 1,
        };
      }
      if (result.count === 0 || flowers >= band.flowers[1]) break;
      // A flower on any tile an alternative solution builds on or shades rules that alternative out.
      const breakers = new Set<number>();
      for (const alt of result.solutions) {
        if (alt.every((cell, i) => cell === solution[i])) continue;
        alt.forEach((cell, i) => {
          breakers.add(cell);
          const height = heights[i] ?? 0;
          for (const t of TIMES)
            castShadow(size, cell, height, t, noonRule).forEach((s) =>
              breakers.add(s)
            );
        });
      }
      const candidates = sunny.filter(
        (cell) => tiles[cell] === 'ground' && breakers.has(cell)
      );
      if (candidates.length === 0) break;
      tiles[pick(random, candidates)] = 'flower';
      flowers++;
    }
  }
  throw new Error(`Could not generate a ${band.name} town for seed "${seed}"`);
}

/** Tries `seed`, then `seed:2`, `seed:3`… so every day still gets a town, deterministically. */
export function generateTownReliably(
  band: Band,
  seed: string,
  noonRule: NoonRule,
  tries = 6
): GeneratedTown {
  for (let t = 1; t <= tries; t++) {
    try {
      return generateTown(band, t === 1 ? seed : `${seed}:${t}`, noonRule);
    } catch {
      // try the next seed
    }
  }
  throw new Error(
    `Could not generate a ${band.name} town for seed "${seed}" after ${tries} seeds`
  );
}

// Town names: agent-drafted word lists, to be reviewed by a human (copy is human-owned).
export const TOWN_ADJECTIVES: readonly string[] = [
  'Sleepy',
  'Little',
  'Upper',
  'Lower',
  'Old',
  'Quiet',
  'Lazy',
  'Hilltop',
  'Seaside',
  'Dusty',
  'Sunny',
  'Drowsy',
  'Golden',
  'Hidden',
  'Windy',
  'Shady',
  'Narrow',
  'Crooked',
  'Faraway',
  'Mossy',
  'Salty',
  'Painted',
  'Humble',
  'Gentle',
];
export const TOWN_PLACES: readonly string[] = [
  'Harbour',
  'Market',
  'Steps',
  'Lanes',
  'Square',
  'Orchard',
  'Terrace',
  'Cove',
  'Quarter',
  'Gardens',
  'Bridge',
  'Hill',
  'Corner',
  'Well',
  'Bay',
  'Mill',
  'Court',
  'Row',
  'Arches',
  'Passage',
  'Fountain',
  'Walls',
  'Landing',
  'Vineyard',
];

/** Every adjective/place pairing in a seeded order, so consecutive days never share a name. */
export function townNames(seed: string): string[] {
  const random = seededRandom(seed);
  const pairs: string[] = [];
  for (const a of TOWN_ADJECTIVES)
    for (const p of TOWN_PLACES) pairs.push(`${a} ${p}`);
  return shuffle(random, pairs);
}
