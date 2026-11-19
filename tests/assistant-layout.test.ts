import { chatRect, fabRect, FAB, resizeRect, snapFab } from '../src/main/views/assistant-layout';

const area = { width: 1400, height: 900 }; // the window's content; the sidebar is 72 px

describe('the floating button', () => {
  test('by default: on the right, raised above the bottom (clear of Send buttons)', () => {
    const r = fabRect(area, undefined);
    expect(r.x + r.width).toBe(1400 - 10);
    expect(r.y + r.height).toBe(900 - 120);
  });

  test('on the left it stays clear of the sidebar', () => {
    expect(fabRect(area, { side: 'left', y: 0.5 }).x).toBe(72 + 10);
  });

  test('up and down: 0 is just under the top bars, 1 is the bottom', () => {
    expect(fabRect(area, { side: 'right', y: 0 }).y).toBe(76);
    expect(fabRect(area, { side: 'right', y: 1 }).y).toBe(900 - FAB - 10);
    expect(fabRect(area, { side: 'right', y: 7 }).y).toBe(900 - FAB - 10); // clamped
  });

  test('dropped after a drag: it sticks to the nearer side, at that height', () => {
    expect(snapFab(area, { x: 300, y: 76 + FAB / 2 })).toEqual({ side: 'left', y: 0 });
    expect(snapFab(area, { x: 1200, y: 900 })).toEqual({ side: 'right', y: 1 });
    const mid = snapFab(area, { x: 1000, y: 450 });
    expect(mid.side).toBe('right');
    expect(fabRect(area, mid).y + FAB / 2).toBeCloseTo(450, 0);
  });
});

describe('the chat window opens next to the button', () => {
  test('above it, on its side, when there is room', () => {
    const fab = fabRect(area, undefined);
    const c = chatRect(area, fab, 'right', 400);
    expect(c.x + c.width).toBe(fab.x + fab.width);
    expect(c.y + c.height).toBeLessThanOrEqual(fab.y);
  });

  test('below it when the button is near the top', () => {
    const fab = fabRect(area, { side: 'left', y: 0 });
    const c = chatRect(area, fab, 'left', 400);
    expect(c.x).toBe(fab.x);
    expect(c.y).toBeGreaterThanOrEqual(fab.y + fab.height);
    expect(c.y + c.height).toBeLessThanOrEqual(900);
  });

  test('never above the top bars, never wider than the window', () => {
    const small = { width: 500, height: 420 };
    const fab = fabRect(small, undefined);
    const c = chatRect(small, fab, 'right', 460);
    expect(c.y).toBeGreaterThanOrEqual(76);
    expect(c.x).toBeGreaterThanOrEqual(72);
  });
});

describe('resizing the chat window', () => {
  const fab = fabRect(area, undefined);

  test('a wider and taller window, as far as the window allows', () => {
    const c = chatRect(area, fab, 'right', 700, 500);
    expect(c.width).toBe(700);
    expect(c.height).toBe(500);
    const huge = chatRect(area, fab, 'right', 5000, 5000);
    expect(huge.x).toBeGreaterThanOrEqual(72);
    expect(huge.y).toBeGreaterThanOrEqual(76);
  });

  test('dragging an edge moves only that edge; sizes stay within limits', () => {
    const start = { x: 900, y: 100, width: 400, height: 500 };
    expect(resizeRect(area, start, { x: 'left' }, { dx: -100, dy: 0 })).toEqual({ x: 800, y: 100, width: 500, height: 500 });
    expect(resizeRect(area, start, { y: 'top' }, { dx: 0, dy: -20 })).toEqual({ x: 900, y: 80, width: 400, height: 520 });
    expect(resizeRect(area, start, { x: 'right', y: 'bottom' }, { dx: 50, dy: 30 })).toEqual({ x: 900, y: 100, width: 450, height: 530 });
    expect(resizeRect(area, start, { x: 'left' }, { dx: 300, dy: 0 }).width).toBe(300); // not smaller than 300
    expect(resizeRect(area, start, { x: 'left' }, { dx: -2000, dy: 0 }).x).toBeGreaterThanOrEqual(72); // not over the sidebar
    expect(resizeRect(area, start, { y: 'top' }, { dx: 0, dy: -2000 }).y).toBeGreaterThanOrEqual(76); // not over the top bars
  });
});
