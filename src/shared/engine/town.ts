import { TIMES } from './types.ts';
import type { Puzzle } from './types.ts';

export const TOWN_LIMITS = {
  minSize: 4,
  maxSize: 7,
  maxHouses: 4,
  maxHeight: 4,
  maxCats: 6,
  maxFlowers: 10,
  maxWells: 4,
} as const;

/**
 * Structural checks for any town, ours or a player's: sizes, counts and cells in range, no tile used
 * twice, distinct house heights. Returns a list of problems (empty when the town is well formed).
 * Solvability is checked separately with the solver.
 */
export function townProblems(puzzle: Puzzle): string[] {
  const problems: string[] = [];
  const { size, heights, cats, flowers, wells } = puzzle;
  if (
    !Number.isInteger(size) ||
    size < TOWN_LIMITS.minSize ||
    size > TOWN_LIMITS.maxSize
  ) {
    problems.push(`size must be ${TOWN_LIMITS.minSize}–${TOWN_LIMITS.maxSize}`);
    return problems;
  }
  if (heights.length < 1 || heights.length > TOWN_LIMITS.maxHouses)
    problems.push('needs 1–4 houses');
  if (
    heights.some(
      (h) => !Number.isInteger(h) || h < 1 || h > TOWN_LIMITS.maxHeight
    )
  )
    problems.push('heights must be 1–4');
  if (new Set(heights).size !== heights.length)
    problems.push('house heights must differ');
  if (heights.some((h, i) => i > 0 && h > (heights[i - 1] ?? 0)))
    problems.push('houses must be listed tallest first');
  if (cats.length < 1 || cats.length > TOWN_LIMITS.maxCats)
    problems.push('needs 1–6 cats');
  if (flowers.length > TOWN_LIMITS.maxFlowers)
    problems.push('too many flowers');
  if (wells.length > TOWN_LIMITS.maxWells) problems.push('too many wells');
  if (cats.some((c) => !TIMES.includes(c.nap)))
    problems.push('every cat needs a nap time');
  const cells = [...cats.map((c) => c.cell), ...flowers, ...wells];
  if (cells.some((c) => !Number.isInteger(c) || c < 0 || c >= size * size))
    problems.push('a tile is off the board');
  if (new Set(cells).size !== cells.length)
    problems.push('two things share a tile');
  return problems;
}
