export type TimeOfDay = 'am' | 'noon' | 'pm';

export const TIMES: readonly TimeOfDay[] = ['am', 'noon', 'pm'];

/** How far noon shadows reach: 1 tile for every house, or half the house's height rounded up. */
export type NoonRule = 'one' | 'half';

export type Cat = { cell: number; nap: TimeOfDay };

/** A town. Cells are numbered row by row from the top-left: cell = row * size + column. */
export type Puzzle = {
  size: number;
  /** Houses waiting in the tray, tallest first. */
  heights: number[];
  cats: Cat[];
  flowers: number[];
  wells: number[];
};

/** Where each house stands, in the same order as `heights`. IN_TRAY means not placed yet. */
export type Placements = number[];

export const IN_TRAY = -1;

export type Tile = 'ground' | 'cat' | 'flower' | 'well';
