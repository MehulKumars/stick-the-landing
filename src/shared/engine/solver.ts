import { castShadow, tileMap } from './rules.ts';
import { TIMES } from './types.ts';
import type { NoonRule, Placements, Puzzle, TimeOfDay } from './types.ts';

export type SolveResult = {
  /** Number of solutions found, capped at limit + 1. */
  count: number;
  /** Up to `keep` solutions, as placements. */
  solutions: Placements[];
  /** Search nodes visited: a rough measure of how much a puzzle branches. */
  nodes: number;
};

/**
 * Backtracking over houses in tray order (tallest first works best), pruning any spot that
 * would shade a flower, and checking every cat once all houses stand.
 */
export function solve(
  puzzle: Puzzle,
  noonRule: NoonRule,
  limit = 1,
  keep = 8
): SolveResult {
  const tiles = tileMap(puzzle);
  const ground: number[] = [];
  tiles.forEach((tile, cell) => {
    if (tile === 'ground') ground.push(cell);
  });

  type Option = { cell: number; shade: Record<TimeOfDay, number[]> };
  const options: Option[][] = puzzle.heights.map((height) =>
    ground
      .map((cell) => ({
        cell,
        shade: {
          am: castShadow(puzzle.size, cell, height, 'am', noonRule),
          noon: castShadow(puzzle.size, cell, height, 'noon', noonRule),
          pm: castShadow(puzzle.size, cell, height, 'pm', noonRule),
        },
      }))
      .filter((o) =>
        TIMES.every((t) => o.shade[t].every((s) => tiles[s] !== 'flower'))
      )
  );

  const solutions: Placements[] = [];
  const chosen: Option[] = [];
  const used = new Set<number>();
  let count = 0;
  let nodes = 0;

  const catsAsleep = (): boolean => {
    const shade: Record<TimeOfDay, Set<number>> = {
      am: new Set(),
      noon: new Set(),
      pm: new Set(),
    };
    for (const o of chosen)
      for (const t of TIMES) for (const s of o.shade[t]) shade[t].add(s);
    return puzzle.cats.every((cat) => shade[cat.nap].has(cat.cell));
  };

  const place = (i: number): void => {
    if (count > limit) return;
    const forHouse = options[i];
    if (forHouse === undefined) {
      if (catsAsleep()) {
        count++;
        if (solutions.length < keep) solutions.push(chosen.map((o) => o.cell));
      }
      return;
    }
    for (const option of forHouse) {
      if (used.has(option.cell)) continue;
      nodes++;
      used.add(option.cell);
      chosen.push(option);
      place(i + 1);
      chosen.pop();
      used.delete(option.cell);
      if (count > limit) return;
    }
  };

  place(0);
  return { count, solutions, nodes };
}
