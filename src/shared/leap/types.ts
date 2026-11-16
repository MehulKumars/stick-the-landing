// The world is measured in tiles. x grows to the right, y grows downwards; (0, 0) is the board's top-left corner.

export const BOARD_W = 8;
export const BOARD_H = 13;
/** The frog is a circle this many tiles across the middle. */
export const FROG_R = 0.34;
/** Tiles per second, per second. */
export const GRAVITY = 34;
/** The hardest and the gentlest hop, in tiles per second. */
export const MAX_SPEED = 17;
export const MIN_SPEED = 4;
/** The physics runs in steps of this many seconds, always, so a hop plays out the same everywhere. */
export const STEP = 1 / 120;
/** Hop speeds are whole numbers of this fraction of a tile per second, so a hop can be written down and replayed. */
export const SPEED_UNIT = 1 / 8;
/** A hop must leave its surface at least this steeply (as a share of its speed). */
export const LEAST_LIFT = 0.1;

/**
 * What a cell holds:
 * '.' air · '#' bark (the frog sticks to it) · 'o' wet stone (too slick to stick to) ·
 * 'M' mushroom (bouncy) · '^' thorns · 'W' spider web (catches the frog in mid-air) · '~' water.
 */
export type Tile = '.' | '#' | 'o' | 'M' | '^' | 'W' | '~';

export type Point = { x: number; y: number };

/** A level as it is written down: ten characters a row, 'S' where the frog starts, 'F' for the flower. */
export type LevelPlan = {
  id: string;
  name: string;
  /** Shown under the board the first time the level is played. */
  hint: string;
  rows: readonly string[];
  /** The number of hops a careful player needs. */
  par: number;
  /** Draw the whole arc while aiming, not just its first part. Only the first lessons do. */
  guide?: boolean;
};

export type Level = {
  id: string;
  name: string;
  hint: string;
  par: number;
  guide: boolean;
  w: number;
  h: number;
  /** One Tile per cell, row by row. */
  tiles: readonly Tile[];
  /** Where the frog begins: standing on the tile under the 'S'. */
  start: Point;
  /** The middle of the flower. */
  flower: Point;
};

/** The frog. While perched it can hop; (nx, ny) points out of whatever it holds on to, or is (0, 0) in a web. */
export type Frog = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  perched: boolean;
  nx: number;
  ny: number;
  /** The web cell the frog hangs in, or is still leaving; -1 otherwise. */
  web: number;
};

export type Run = {
  level: Level;
  frog: Frog;
  /** The last place the frog held on: where it goes back to after a fall. */
  home: Frog;
  hops: number;
  won: boolean;
  /** Physics steps since the last hop began. */
  ticks: number;
};

/** Something worth a sound or a splash of particles, at most one per physics step. */
export type Happening = {
  type: 'stick' | 'bounce' | 'boing' | 'settle' | 'web' | 'ouch' | 'splash' | 'lost' | 'win';
  x: number;
  y: number;
  /** The way out of the surface that was hit, where there was one. */
  nx: number;
  ny: number;
  /** How hard the hit was, in tiles per second. */
  speed: number;
  /** The cell that was hit, or -1. */
  cell: number;
};

export function isTile(value: string): value is Tile {
  return value === '.' || value === '#' || value === 'o' || value === 'M' || value === '^' || value === 'W' || value === '~';
}
