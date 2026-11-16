import { IN_TRAY, TIMES } from './types.ts';
import type { NoonRule, Placements, Puzzle, Tile, TimeOfDay } from './types.ts';

/**
 * The cells a house of the given height shades at one time of day.
 * Morning sun in the east throws shadows west; evening sun in the west throws them east;
 * noon sun high in the south throws them north. Shadows stop at the board edge.
 */
export function castShadow(
  size: number,
  cell: number,
  height: number,
  time: TimeOfDay,
  noonRule: NoonRule
): number[] {
  const row = Math.floor(cell / size);
  const col = cell % size;
  const shaded: number[] = [];
  if (time === 'am') {
    for (let k = 1; k <= height && col - k >= 0; k++)
      shaded.push(row * size + col - k);
  } else if (time === 'pm') {
    for (let k = 1; k <= height && col + k < size; k++)
      shaded.push(row * size + col + k);
  } else {
    const reach = noonRule === 'half' ? Math.ceil(height / 2) : 1;
    for (let k = 1; k <= reach && row - k >= 0; k++)
      shaded.push((row - k) * size + col);
  }
  return shaded;
}

export function tileMap(puzzle: Puzzle): Tile[] {
  const tiles: Tile[] = new Array<Tile>(puzzle.size * puzzle.size).fill(
    'ground'
  );
  for (const cat of puzzle.cats) tiles[cat.cell] = 'cat';
  for (const cell of puzzle.flowers) tiles[cell] = 'flower';
  for (const cell of puzzle.wells) tiles[cell] = 'well';
  return tiles;
}

/** Placements are legal when every house is in the tray or on its own empty ground tile. */
export function isLegalPlacement(
  puzzle: Puzzle,
  placements: Placements
): boolean {
  if (placements.length !== puzzle.heights.length) return false;
  const tiles = tileMap(puzzle);
  const used = new Set<number>();
  for (const cell of placements) {
    if (cell === IN_TRAY) continue;
    if (!Number.isInteger(cell) || cell < 0 || cell >= tiles.length)
      return false;
    if (tiles[cell] !== 'ground' || used.has(cell)) return false;
    used.add(cell);
  }
  return true;
}

export type ShadeByTime = Record<TimeOfDay, Set<number>>;

export function shadeByTime(
  puzzle: Puzzle,
  placements: Placements,
  noonRule: NoonRule
): ShadeByTime {
  const shade: ShadeByTime = { am: new Set(), noon: new Set(), pm: new Set() };
  placements.forEach((cell, i) => {
    const height = puzzle.heights[i];
    if (cell === IN_TRAY || height === undefined) return;
    for (const time of TIMES) {
      for (const s of castShadow(puzzle.size, cell, height, time, noonRule))
        shade[time].add(s);
    }
  });
  return shade;
}

export type CatState = { cell: number; nap: TimeOfDay; asleep: boolean };
export type FlowerState = { cell: number; lit: boolean };

export type Evaluation = {
  cats: CatState[];
  flowers: FlowerState[];
  /** A time of day is done when its cats are asleep and no flower is shaded then. */
  timeOk: Record<TimeOfDay, boolean>;
  allPlaced: boolean;
  asleepCount: number;
  litCount: number;
  solved: boolean;
};

export function evaluate(
  puzzle: Puzzle,
  placements: Placements,
  noonRule: NoonRule
): Evaluation {
  const shade = shadeByTime(puzzle, placements, noonRule);
  const timeOk: Record<TimeOfDay, boolean> = { am: true, noon: true, pm: true };
  const cats = puzzle.cats.map(({ cell, nap }) => {
    const asleep = shade[nap].has(cell);
    if (!asleep) timeOk[nap] = false;
    return { cell, nap, asleep };
  });
  const flowers = puzzle.flowers.map((cell) => {
    let lit = true;
    for (const time of TIMES) {
      if (shade[time].has(cell)) {
        lit = false;
        timeOk[time] = false;
      }
    }
    return { cell, lit };
  });
  const allPlaced =
    placements.length === puzzle.heights.length &&
    placements.every((c) => c !== IN_TRAY);
  const asleepCount = cats.filter((c) => c.asleep).length;
  const litCount = flowers.filter((f) => f.lit).length;
  const solved =
    allPlaced &&
    isLegalPlacement(puzzle, placements) &&
    asleepCount === cats.length &&
    litCount === flowers.length;
  return { cats, flowers, timeOk, allPlaced, asleepCount, litCount, solved };
}
