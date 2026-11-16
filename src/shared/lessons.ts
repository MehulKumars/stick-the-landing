import type { Placements, Puzzle, TimeOfDay } from './engine/types.ts';

export type LessonId = 'lesson-1' | 'lesson-2' | 'lesson-3';

/** Three tiny boards that teach the rules by playing (docs/04-GAME-SPEC.md A7.2). */
export type Lesson = {
  id: LessonId;
  puzzle: Puzzle;
  /** Lesson 1 stays in the morning so the first idea lands on its own. */
  lockTime: TimeOfDay | null;
  /** The only answer, used to point the first drag hint at the right tile. */
  solution: Placements;
};

// 4×4 boards, cells numbered row by row from the top-left.
export const LESSONS: readonly Lesson[] = [
  {
    id: 'lesson-1',
    puzzle: {
      size: 4,
      heights: [1],
      cats: [{ cell: 4, nap: 'am' }],
      flowers: [],
      wells: [],
    },
    lockTime: 'am',
    solution: [5],
  },
  {
    id: 'lesson-2',
    puzzle: {
      size: 4,
      heights: [1],
      cats: [{ cell: 1, nap: 'noon' }],
      flowers: [],
      wells: [],
    },
    lockTime: null,
    solution: [5],
  },
  {
    id: 'lesson-3',
    puzzle: {
      size: 4,
      heights: [2],
      cats: [{ cell: 7, nap: 'pm' }],
      flowers: [1],
      wells: [],
    },
    lockTime: null,
    solution: [6],
  },
];
