import { CLAUDE_BANNER_HEIGHT, GOOGLE_TABSTRIP_HEIGHT, SIDEBAR_WIDTH } from '../../shared/layout';

/** The floating button's view: a 44 px circle plus 4 px around it for its shadow. */
export const FAB = 52;
const EDGE = 10;
/** By default it sits this far above the bottom, clear of messaging apps' Send buttons. */
const LIFT = 120;
const GAP = 8;
/** The button and the chat never cover the page's top bars (tabs, Claude's "acting" banner). */
const TOP_CLEAR = GOOGLE_TABSTRIP_HEIGHT + CLAUDE_BANNER_HEIGHT + 8;
const DEFAULT_HEIGHT = 680;
const MAX_WIDTH = 1200;
const MIN_WIDTH = 300;
const MIN_HEIGHT = 260;

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface Area {
  width: number;
  height: number;
}
/** Where the user put the button: a side, and a height from 0 (top) to 1 (bottom). */
export interface FabPlace {
  side: 'left' | 'right';
  y: number;
}

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));
const travel = (area: Area): { top: number; bottom: number } => {
  const top = TOP_CLEAR;
  return { top, bottom: Math.max(top, area.height - FAB - EDGE) };
};

export function fabRect(area: Area, place: FabPlace | undefined): Rect {
  const { top, bottom } = travel(area);
  const y = place ? top + clamp(place.y, 0, 1) * (bottom - top) : clamp(area.height - FAB - LIFT, top, bottom);
  const x = (place?.side ?? 'right') === 'left' ? SIDEBAR_WIDTH + EDGE : Math.max(SIDEBAR_WIDTH + EDGE, area.width - FAB - EDGE);
  return { x: Math.round(x), y: Math.round(y), width: FAB, height: FAB };
}

/** Where a dragged button lands, from its centre: the nearer side, at that height. */
export function snapFab(area: Area, centre: { x: number; y: number }): FabPlace {
  const { top, bottom } = travel(area);
  const side = centre.x < (SIDEBAR_WIDTH + area.width) / 2 ? 'left' : 'right';
  const y = bottom > top ? clamp((centre.y - FAB / 2 - top) / (bottom - top), 0, 1) : 1;
  return { side, y: Math.round(y * 1000) / 1000 };
}

/** The chat window next to the button, on its side: above it when there is room, else below. */
export function chatRect(area: Area, fab: Rect, side: 'left' | 'right', wanted: number, wantedHeight = DEFAULT_HEIGHT): Rect {
  const width = Math.max(240, Math.min(wanted, MAX_WIDTH, area.width - SIDEBAR_WIDTH - 2 * EDGE));
  const x = side === 'left' ? fab.x : Math.max(SIDEBAR_WIDTH + EDGE, fab.x + fab.width - width);
  const above = fab.y - GAP - TOP_CLEAR;
  const below = area.height - EDGE - (fab.y + fab.height + GAP);
  if (above >= MIN_HEIGHT || above >= below) {
    const height = Math.max(0, Math.min(wantedHeight, above));
    return { x, y: fab.y - GAP - height, width, height };
  }
  const height = Math.max(0, Math.min(wantedHeight, below));
  return { x, y: fab.y + fab.height + GAP, width, height };
}

/**
 * The chat window while the user drags its edges: each dragged edge follows the pointer, the
 * others stay; never smaller than 300×MIN_HEIGHT, never over the sidebar, the top bars or out of the window.
 */
export function resizeRect(area: Area, start: Rect, edges: { x?: 'left' | 'right'; y?: 'top' | 'bottom' }, d: { dx: number; dy: number }): Rect {
  let { x, y, width, height } = start;
  const right = start.x + start.width;
  const bottom = start.y + start.height;
  if (edges.x === 'left') {
    x = Math.max(SIDEBAR_WIDTH + EDGE, Math.min(right - MIN_WIDTH, start.x + d.dx));
    width = right - x;
  } else if (edges.x === 'right') {
    width = Math.max(MIN_WIDTH, Math.min(area.width - EDGE - start.x, start.width + d.dx));
  }
  if (edges.y === 'top') {
    y = Math.max(TOP_CLEAR, Math.min(bottom - MIN_HEIGHT, start.y + d.dy));
    height = bottom - y;
  } else if (edges.y === 'bottom') {
    height = Math.max(MIN_HEIGHT, Math.min(area.height - EDGE - start.y, start.height + d.dy));
  }
  return { x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) };
}
