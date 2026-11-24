// @vitest-environment happy-dom
import { act } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { meetingBarBounds } from '../src/main/views/meeting-bar-bounds';
import { MeetingBarView } from '../src/renderer/src/meetings/MeetingBar';
import type { LiveMeeting } from '../src/shared/meeting';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const calls: unknown[][] = [];
const api = new Proxy({}, { get: (_t, name: string) => (...args: unknown[]) => void calls.push([name, ...args]) });

function render(props: Parameters<typeof MeetingBarView>[0]) {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  act(() => root.render(<MeetingBarView {...props} />));
  return host;
}
const click = (host: HTMLElement, label: string) => {
  const b = [...host.querySelectorAll('button')].find((x) => x.textContent?.trim() === label);
  if (!b) throw new Error(`no button ${label}: ${host.textContent}`);
  act(() => b.dispatchEvent(new MouseEvent('click', { bubbles: true })));
};

const live: LiveMeeting = { id: 'm1', scope: 'space:s1', accountId: 'g1', paused: false, language: 'pt-PT', engine: 'apple' };

beforeEach(() => {
  calls.length = 0;
  (window as unknown as { missiondesk: unknown }).missiondesk = api;
});

test('live: shows the space and stops on Stop', () => {
  const host = render({ live, asking: null, spaceName: 'Acme', localeInstall: null });
  expect(host.textContent).toContain('Transcribing');
  expect(host.textContent).toContain('Acme');
  click(host, 'Stop');
  expect(calls).toContainEqual(['meetingStop']);
  click(host, 'Pause');
  expect(calls).toContainEqual(['meetingPause']);
  click(host, 'Copy notice');
  expect(calls).toContainEqual(['meetingCopyNotice']);
});

test('paused offers Resume', () => {
  const host = render({ live: { ...live, paused: true }, asking: null, spaceName: 'Acme', localeInstall: null });
  click(host, 'Resume');
  expect(calls).toContainEqual(['meetingResume']);
});

test('asking: Yes, No and Never in this space', () => {
  const host = render({ live: null, asking: { title: 'Weekly sync', switchTo: false }, spaceName: 'Acme', localeInstall: null });
  expect(host.textContent).toContain('Transcribe this meeting?');
  click(host, 'Never in this space');
  expect(calls).toContainEqual(['meetingAnswer', false, true]);
  click(host, 'Yes');
  expect(calls).toContainEqual(['meetingAnswer', true, false]);
});

test('a second call asks to switch, without "never"', () => {
  const host = render({ live, asking: { title: 'Other', switchTo: true }, spaceName: 'Acme', localeInstall: null });
  expect(host.textContent).toContain('Transcribe this one instead?');
  expect(host.textContent).not.toContain('Never in this space');
});

test('a missing language offers its download', () => {
  const host = render({ live: { ...live, notice: { code: 'localeMissing', text: 'Português isn’t downloaded', locale: 'pt-PT' } }, asking: null, spaceName: 'Acme', localeInstall: null });
  expect(host.textContent).toContain('Português isn’t downloaded');
  const b = [...host.querySelectorAll('button')].find((x) => x.textContent?.startsWith('Download'))!;
  act(() => b.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  expect(calls).toContainEqual(['meetingInstallLocale', 'pt-PT']);
});

test('the bar sits top-centre over the meeting', () => {
  expect(meetingBarBounds({ x: 0, y: 0, width: 1000, height: 700 }, 36)).toEqual({ x: 220, y: 8, width: 560, height: 36 });
  expect(meetingBarBounds({ x: 72, y: 40, width: 400, height: 700 }, 60)).toEqual({ x: 80, y: 48, width: 384, height: 60 });
});

test('the overlay grows with the card or list, up to 400 px and 60% of the meeting', () => {
  expect(meetingBarBounds({ x: 0, y: 0, width: 800, height: 1000 }, 500).height).toBe(400);
  expect(meetingBarBounds({ x: 0, y: 0, width: 800, height: 300 }, 500).height).toBe(180);
  expect(meetingBarBounds({ x: 0, y: 0, width: 800, height: 1000 }, 10).height).toBe(36);
});

import { barTarget } from '../src/main/views/meeting-bar-bounds';

test('I1: with a second call asking, the ask bar sits over that call and the live controls stay on the first', () => {
  const live = { accountId: 'g1', kind: 'meet' as const };
  const asking = { accountId: 'n1', kind: 'meet' as const, switchTo: true };
  const visible = (on: string) => (a: string) => a === on;
  expect(barTarget(live, asking, visible('n1'))).toEqual({ accountId: 'n1', kind: 'meet', mode: 'ask' });
  expect(barTarget(live, asking, visible('g1'))).toEqual({ accountId: 'g1', kind: 'meet', mode: 'live' });
  expect(barTarget(live, null, visible('n1'))).toBeNull();
  expect(barTarget(null, { ...asking, switchTo: false }, visible('n1'))).toEqual({ accountId: 'n1', kind: 'meet', mode: 'ask' });
});

test('I1: the bar draws what it was placed for', () => {
  const host = render({ live, asking: { title: 'Other', switchTo: true }, spaceName: 'Acme', localeInstall: null, mode: 'live' });
  expect(host.textContent).toContain('Transcribing');
  expect(host.textContent).not.toContain('instead');
});

describe('live insights on the bar', () => {
  const ins = (id: string, over: Partial<import('../src/shared/meeting').MeetingInsight> = {}): import('../src/shared/meeting').MeetingInsight => ({
    id,
    at: 1000,
    kind: 'past',
    text: `Insight ${id}`,
    said: 'o atraso',
    sources: [{ label: 'Meeting of 12/11 · Decision', text: 'Rever a faturação em dezembro', open: { kind: 'meeting', scope: 'space:s1', id: 'm0' } }],
    ...over,
  });
  const withInsights = (over: Partial<import('../src/shared/meeting').LiveInsights> = {}): LiveMeeting => ({
    ...live,
    insights: { state: 'on', count: 1, latest: ins('abc123def456', { ask: 'Já há data?' }), list: [ins('abc123def456', { ask: 'Já há data?' })], ...over },
  });

  test('the bar shows ✦ with the count', () => {
    const host = render({ live: withInsights({ count: 3 }), asking: null, spaceName: 'Acme', localeInstall: null });
    expect(host.textContent).toContain('✦ 3');
  });

  test("a new latest insight shows a card with the kind, the text, the source's text and the ask", () => {
    const host = render({ live: withInsights(), asking: null, spaceName: 'Acme', localeInstall: null });
    const card = host.querySelector('.mb-card')!;
    expect(card.getAttribute('role')).toBe('status');
    expect(card.textContent).toContain('Link to the past');
    expect(card.textContent).toContain('Insight abc123def456');
    expect(card.textContent).toContain('Meeting of 12/11 · Decision');
    expect(card.textContent).toContain('Rever a faturação em dezembro');
    expect(card.textContent).toContain('Ask: “Já há data?”');
  });

  test('the card hides after 20 s, not while hovered', () => {
    vi.useFakeTimers();
    try {
      const host = render({ live: withInsights(), asking: null, spaceName: 'Acme', localeInstall: null });
      const card = host.querySelector('.mb-card')!;
      act(() => card.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })));
      act(() => vi.advanceTimersByTime(25_000));
      expect(host.querySelector('.mb-card')).not.toBeNull();
      act(() => card.dispatchEvent(new MouseEvent('mouseout', { bubbles: true })));
      expect(host.querySelector('.mb-card')).toBeNull();
      const again = render({ live: withInsights(), asking: null, spaceName: 'Acme', localeInstall: null });
      act(() => vi.advanceTimersByTime(20_000));
      expect(again.querySelector('.mb-card')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  test('Not useful and Open source call the IPC with the insight id (and source index)', () => {
    const host = render({ live: withInsights(), asking: null, spaceName: 'Acme', localeInstall: null });
    click(host, 'Open source');
    expect(calls).toContainEqual(['meetingInsightOpen', 'abc123def456', 0]);
    click(host, 'Not useful');
    expect(calls).toContainEqual(['meetingInsightNotUseful', 'abc123def456']);
    expect(host.querySelector('.mb-card')).toBeNull();
  });

  test('✦ opens the list, newest first, with Pause insights', () => {
    const host = render({ live: withInsights({ count: 2, list: [ins('newer1'), ins('older1')] }), asking: null, spaceName: 'Acme', localeInstall: null });
    click(host, '✦ 2');
    const items = [...host.querySelectorAll('.mb-list li')].map((li) => li.textContent);
    expect(items[0]).toContain('Insight newer1');
    expect(items[1]).toContain('Insight older1');
    click(host, 'Pause insights');
    expect(calls).toContainEqual(['meetingInsightsPause']);
  });

  test('unavailable shows — and the reason as the title', () => {
    const host = render({ live: withInsights({ state: 'unavailable', reason: 'Not connected', count: 0, latest: undefined, list: [] }), asking: null, spaceName: 'Acme', localeInstall: null });
    const b = [...host.querySelectorAll('button')].find((x) => x.textContent?.startsWith('✦'))!;
    expect(b.textContent).toBe('✦ —');
    expect(b.getAttribute('title')).toBe('Not connected');
  });

  test('model text is rendered as text, never HTML', () => {
    const host = render({ live: withInsights({ latest: ins('abc123def456', { text: '<b>x</b>' }) }), asking: null, spaceName: 'Acme', localeInstall: null });
    expect(host.querySelector('.mb-card b')).toBeNull();
    expect(host.querySelector('.mb-card')!.textContent).toContain('<b>x</b>');
  });

  test('the page reports its height', () => {
    const observed: (() => void)[] = [];
    const RO = globalThis.ResizeObserver;
    (globalThis as { ResizeObserver: unknown }).ResizeObserver = class {
      constructor(cb: () => void) {
        observed.push(cb);
      }
      observe() {}
      disconnect() {}
    };
    try {
      const host = render({ live: withInsights(), asking: null, spaceName: 'Acme', localeInstall: null });
      Object.defineProperty(host.querySelector('.mb-page')!, 'offsetHeight', { configurable: true, value: 150 });
      act(() => observed.forEach((cb) => cb()));
      expect(calls).toContainEqual(['meetingBarHeight', 150]);
    } finally {
      (globalThis as { ResizeObserver: unknown }).ResizeObserver = RO;
    }
  });
});
