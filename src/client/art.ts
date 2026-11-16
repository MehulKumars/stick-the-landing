// Drawings for the board, the tray and the splash. Plain SVG in a 100×100 cell.
// Placeholder art in the house style (blue ink, white, sun yellow, pink); the artist replaces these.
import type { Puzzle, TimeOfDay } from '../shared/engine/types.ts';

const SVGNS = 'http://www.w3.org/2000/svg';
export const CELL = 100;

export function svgEl<K extends keyof SVGElementTagNameMap>(
  name: K,
  attrs: Record<string, string | number> = {},
  parent?: Element
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVGNS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  if (parent) parent.appendChild(node);
  return node;
}

export function cellOrigin(
  size: number,
  cell: number
): { x: number; y: number } {
  return { x: (cell % size) * CELL, y: Math.floor(cell / size) * CELL };
}

/** A small square "board" with the sun on the edge it shines from: right in the morning, bottom at noon, left in the evening. */
export function sunBadge(
  parent: Element,
  time: TimeOfDay,
  x: number,
  y: number,
  w: number,
  h: number
): SVGGElement {
  const g = svgEl('g', { transform: `translate(${x} ${y})` }, parent);
  svgEl(
    'rect',
    {
      width: w,
      height: h,
      rx: 6,
      fill: '#fff',
      stroke: 'var(--ink)',
      'stroke-width': 3,
    },
    g
  );
  const pos = { am: [w - 7, h / 2], noon: [w / 2, h - 7], pm: [7, h / 2] }[
    time
  ];
  svgEl(
    'circle',
    {
      cx: pos[0] ?? 0,
      cy: pos[1] ?? 0,
      r: 5,
      fill: 'var(--sun-deep)',
      stroke: 'var(--ink)',
      'stroke-width': 2,
    },
    g
  );
  return g;
}

export function sunIconSvg(time: TimeOfDay, size = 20): string {
  const pos = { am: [17, 10], noon: [10, 17], pm: [3, 10] }[time];
  return `<svg viewBox="0 0 20 20" width="${size}" height="${size}" aria-hidden="true"><rect x="2.5" y="2.5" width="15" height="15" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="${pos[0]}" cy="${pos[1]}" r="3.6" fill="#e0a91f" stroke="currentColor" stroke-width="1.6"/></svg>`;
}

export function drawHouse(parent: Element, height: number): SVGGElement {
  const g = svgEl('g', { class: 'house' }, parent);
  svgEl(
    'polygon',
    {
      points: '12,38 50,12 88,38',
      fill: 'var(--shade)',
      stroke: 'var(--ink)',
      'stroke-width': 5,
      'stroke-linejoin': 'round',
    },
    g
  );
  svgEl(
    'rect',
    {
      class: 'body',
      x: 18,
      y: 34,
      width: 64,
      height: 54,
      rx: 7,
      fill: '#fff',
      stroke: 'var(--ink)',
      'stroke-width': 5,
    },
    g
  );
  const label = svgEl(
    'text',
    {
      x: 50,
      y: 75,
      'text-anchor': 'middle',
      'font-size': 34,
      'font-weight': 800,
      fill: 'var(--ink)',
    },
    g
  );
  label.textContent = String(height);
  return g;
}

export function houseSvg(height: number): string {
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><polygon points="12,38 50,12 88,38" fill="#2f49a6" stroke="#1b2766" stroke-width="5" stroke-linejoin="round"/><rect x="18" y="34" width="64" height="54" rx="7" fill="#fff" stroke="#1b2766" stroke-width="5"/><text x="50" y="75" text-anchor="middle" font-size="34" font-weight="800" fill="#1b2766">${height}</text></svg>`;
}

export function drawCat(
  parent: Element,
  size: number,
  cell: number,
  nap: TimeOfDay,
  withBadge = true
): SVGGElement {
  const { x, y } = cellOrigin(size, cell);
  const g = svgEl(
    'g',
    { class: 'cat', transform: `translate(${x} ${y})` },
    parent
  );
  svgEl('circle', { class: 'ring', cx: 50, cy: 52, r: 44 }, g);
  const line = {
    stroke: 'var(--ink)',
    'stroke-width': 5,
    'stroke-linejoin': 'round',
  };
  svgEl('polygon', { points: '28,44 31,18 47,33', fill: '#fff', ...line }, g);
  svgEl('polygon', { points: '72,44 69,18 53,33', fill: '#fff', ...line }, g);
  svgEl(
    'ellipse',
    { cx: 50, cy: 52, rx: 27, ry: 24, fill: '#fff', ...line },
    g
  );
  const open = svgEl('g', { class: 'eyes-open' }, g);
  svgEl('circle', { cx: 40, cy: 50, r: 4, fill: 'var(--ink)' }, open);
  svgEl('circle', { cx: 60, cy: 50, r: 4, fill: 'var(--ink)' }, open);
  const closed = svgEl(
    'g',
    {
      class: 'eyes-closed',
      fill: 'none',
      stroke: 'var(--ink)',
      'stroke-width': 4,
      'stroke-linecap': 'round',
    },
    g
  );
  svgEl('path', { d: 'M34 50 q6 5 12 0' }, closed);
  svgEl('path', { d: 'M54 50 q6 5 12 0' }, closed);
  svgEl('path', { d: 'M46 59 h8 l-4 4 z', fill: 'var(--pink)' }, g);
  const z = svgEl(
    'text',
    {
      class: 'zzz',
      x: 80,
      y: 28,
      'font-size': 24,
      'font-weight': 800,
      fill: 'var(--ink)',
    },
    g
  );
  z.textContent = 'z';
  if (withBadge) sunBadge(g, nap, 58, 70, 34, 24);
  return g;
}

export function drawFlower(
  parent: Element,
  size: number,
  cell: number
): SVGGElement {
  const { x, y } = cellOrigin(size, cell);
  const g = svgEl(
    'g',
    { class: 'flower', transform: `translate(${x} ${y})` },
    parent
  );
  svgEl('circle', { class: 'ring', cx: 50, cy: 50, r: 44 }, g);
  const petals = svgEl('g', { class: 'petals' }, g);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    svgEl(
      'circle',
      {
        cx: 50 + Math.cos(a) * 17,
        cy: 50 + Math.sin(a) * 17,
        r: 12,
        fill: 'var(--pink)',
        stroke: 'var(--ink)',
        'stroke-width': 3.5,
      },
      petals
    );
  }
  svgEl(
    'circle',
    {
      cx: 50,
      cy: 50,
      r: 9,
      fill: 'var(--sun-deep)',
      stroke: 'var(--ink)',
      'stroke-width': 3.5,
    },
    g
  );
  svgEl(
    'path',
    {
      class: 'droop',
      d: 'M30 82 q20 -10 40 0',
      fill: 'none',
      stroke: 'var(--ink)',
      'stroke-width': 4,
      'stroke-linecap': 'round',
    },
    g
  );
  return g;
}

export function drawWell(
  parent: Element,
  size: number,
  cell: number
): SVGGElement {
  const { x, y } = cellOrigin(size, cell);
  const g = svgEl('g', { transform: `translate(${x} ${y})` }, parent);
  svgEl(
    'circle',
    {
      cx: 50,
      cy: 50,
      r: 31,
      fill: '#fff',
      stroke: 'var(--ink)',
      'stroke-width': 5,
    },
    g
  );
  svgEl(
    'circle',
    {
      cx: 50,
      cy: 50,
      r: 20,
      fill: 'var(--water)',
      stroke: 'var(--ink)',
      'stroke-width': 3,
    },
    g
  );
  return g;
}

export function drawGround(parent: Element, size: number): void {
  const span = size * CELL;
  svgEl(
    'rect',
    { class: 'ground', x: 0, y: 0, width: span, height: span, rx: 4 },
    parent
  );
  for (let i = 1; i < size; i++) {
    svgEl(
      'line',
      { class: 'grid-line', x1: i * CELL, y1: 0, x2: i * CELL, y2: span },
      parent
    );
    svgEl(
      'line',
      { class: 'grid-line', x1: 0, y1: i * CELL, x2: span, y2: i * CELL },
      parent
    );
  }
}

/** A still drawing of a town with no houses: used on the splash. Reveals nothing about the solution. */
export function drawTownPreview(svg: SVGSVGElement, puzzle: Puzzle): void {
  const span = puzzle.size * CELL;
  svg.replaceChildren();
  svg.setAttribute('viewBox', `-6 -6 ${span + 12} ${span + 12}`);
  drawGround(svg, puzzle.size);
  for (const cell of puzzle.wells) drawWell(svg, puzzle.size, cell);
  for (const cell of puzzle.flowers) drawFlower(svg, puzzle.size, cell);
  for (const cat of puzzle.cats)
    drawCat(svg, puzzle.size, cat.cell, cat.nap, false);
  svgEl(
    'rect',
    { class: 'frame', x: 0, y: 0, width: span, height: span, rx: 4 },
    svg
  );
}

export const catIconSvg =
  '<svg viewBox="0 0 100 100" aria-hidden="true"><polygon points="28,44 31,18 47,33" fill="#fff" stroke="#1b2766" stroke-width="8"/><polygon points="72,44 69,18 53,33" fill="#fff" stroke="#1b2766" stroke-width="8"/><ellipse cx="50" cy="54" rx="30" ry="27" fill="#fff" stroke="#1b2766" stroke-width="8"/></svg>';

export const flowerIconSvg =
  '<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="28" r="16" fill="#e8378a" stroke="#1b2766" stroke-width="6"/><circle cx="72" cy="46" r="16" fill="#e8378a" stroke="#1b2766" stroke-width="6"/><circle cx="62" cy="72" r="16" fill="#e8378a" stroke="#1b2766" stroke-width="6"/><circle cx="38" cy="72" r="16" fill="#e8378a" stroke="#1b2766" stroke-width="6"/><circle cx="28" cy="46" r="16" fill="#e8378a" stroke="#1b2766" stroke-width="6"/><circle cx="50" cy="52" r="12" fill="#e0a91f" stroke="#1b2766" stroke-width="6"/></svg>';

/**
 * A 3×3 teaching diagram for one time of day: a height-2 house in the middle, its shadow, and the sun
 * on the edge it shines from. Used on the How to play sheet.
 */
export function drawShadowDiagram(
  svg: SVGSVGElement,
  time: TimeOfDay,
  shaded: number[]
): void {
  const size = 3;
  const span = size * CELL;
  const m = 46;
  svg.replaceChildren();
  svg.setAttribute('viewBox', `${-m} ${-m} ${span + m * 2} ${span + m * 2}`);
  drawGround(svg, size);
  for (const cell of shaded) {
    const { x, y } = cellOrigin(size, cell);
    svgEl(
      'rect',
      { class: 'diagram-shade', x, y, width: CELL, height: CELL },
      svg
    );
  }
  const { x, y } = cellOrigin(size, 4);
  drawHouse(svgEl('g', { transform: `translate(${x} ${y})` }, svg), 2);
  svgEl(
    'rect',
    { class: 'frame', x: 0, y: 0, width: span, height: span, rx: 4 },
    svg
  );
  const edge = m / 2 + 4;
  const pos = {
    am: [span + edge, span / 2],
    noon: [span / 2, span + edge],
    pm: [-edge, span / 2],
  }[time];
  const sun = svgEl(
    'g',
    { transform: `translate(${pos[0] ?? 0} ${pos[1] ?? 0})` },
    svg
  );
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    svgEl(
      'line',
      {
        x1: Math.cos(a) * 16,
        y1: Math.sin(a) * 16,
        x2: Math.cos(a) * 23,
        y2: Math.sin(a) * 23,
        stroke: 'var(--ink)',
        'stroke-width': 4,
        'stroke-linecap': 'round',
      },
      sun
    );
  }
  svgEl(
    'circle',
    { r: 12, fill: 'var(--sun-deep)', stroke: 'var(--ink)', 'stroke-width': 4 },
    sun
  );
}

/** A still drawing of a solved town: houses placed and every cat asleep. Only ever shown to its solver. */
export function drawSleepingTown(
  svg: SVGSVGElement,
  puzzle: Puzzle,
  placements: number[]
): void {
  drawTownPreview(svg, puzzle);
  svg.querySelectorAll('.cat').forEach((cat) => cat.classList.add('asleep'));
  placements.forEach((cell, i) => {
    const height = puzzle.heights[i];
    if (cell < 0 || height === undefined) return;
    const { x, y } = cellOrigin(puzzle.size, cell);
    drawHouse(svgEl('g', { transform: `translate(${x} ${y})` }, svg), height);
  });
}
