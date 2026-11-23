// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, expect, test } from 'vitest';
import { CalendarToggles, LooseCalendars } from '../src/renderer/src/settings/CalendarToggles';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const calls: unknown[][] = [];
const api = new Proxy({}, { get: (_t, name: string) => (...args: unknown[]) => void calls.push([name, ...args]) });
const acc = (id: string, name: string, service = 'google', spaceId?: string) => ({ id, name, service, spaceId }) as never;

function render(el: React.JSX.Element) {
  const host = document.createElement('div');
  document.body.append(host);
  act(() => createRoot(host).render(el));
  return host;
}

beforeEach(() => {
  calls.length = 0;
  document.body.innerHTML = '';
  (window as unknown as { missiondesk: unknown }).missiondesk = api;
});

test('a space with one Google account gets one switch, on when it shows in All calendars', () => {
  const host = render(<CalendarToggles accounts={[acc('g1', 'Acme Google'), acc('s1', 'Acme Slack', 'slack')]} hidden={[]} />);
  const boxes = host.querySelectorAll<HTMLInputElement>('input[type=checkbox]');
  expect(boxes).toHaveLength(1);
  expect(boxes[0].checked).toBe(true);
  expect(host.textContent).toContain('Show in All calendars');
  act(() => boxes[0].click());
  expect(calls).toEqual([['setCalendarHidden', 'g1', true]]);
});

test('several Google accounts get a line each', () => {
  const host = render(<CalendarToggles accounts={[acc('g1', 'Acme'), acc('g2', 'Acme Ops')]} hidden={['g2']} />);
  const boxes = [...host.querySelectorAll<HTMLInputElement>('input[type=checkbox]')];
  expect(boxes.map((b) => b.checked)).toEqual([true, false]);
  expect(host.textContent).toContain('Acme Ops');
  act(() => boxes[1].click());
  expect(calls).toEqual([['setCalendarHidden', 'g2', false]]);
});

test('no Google account, no switch', () => {
  const host = render(<CalendarToggles accounts={[acc('s1', 'Slack', 'slack')]} hidden={[]} />);
  expect(host.querySelectorAll('input')).toHaveLength(0);
});

test('Google accounts outside spaces get their own card; none, no card', () => {
  const host = render(<LooseCalendars accounts={[acc('g1', 'Personal'), acc('g2', 'Acme', 'google', 'sp1')]} hidden={[]} />);
  expect(host.textContent).toContain('Apps outside spaces');
  expect(host.textContent).toContain('Personal');
  expect(host.textContent).not.toContain('Acme');
  const none = render(<LooseCalendars accounts={[acc('g2', 'Acme', 'google', 'sp1')]} hidden={[]} />);
  expect(none.textContent).toBe('');
});
