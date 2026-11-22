// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, expect, test } from 'vitest';
import { MeetingEndedDialog } from '../src/renderer/src/meetings/MeetingEndedDialog';
import type { MeetingEndedInfo } from '../src/shared/meeting';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const calls: unknown[][] = [];
const api = new Proxy({}, { get: (_t, name: string) => (...args: unknown[]) => void calls.push([name, ...args]) });
const info: MeetingEndedInfo = { scope: 'space:s1', id: 'm1', title: 'Weekly sync', minutes: 42, language: 'pt-PT', spaceName: 'Acme', defaults: ['summary', 'email'], askAvailable: true };

function render(i: MeetingEndedInfo) {
  const host = document.createElement('div');
  document.body.append(host);
  let closed = false;
  act(() => createRoot(host).render(<MeetingEndedDialog info={i} onClose={() => (closed = true)} />));
  return { host, closed: () => closed };
}
const button = (host: HTMLElement, label: string) => [...host.querySelectorAll('button')].find((b) => b.textContent?.trim() === label)!;

beforeEach(() => {
  calls.length = 0;
  (window as unknown as { missiondesk: unknown }).missiondesk = api;
});

test('the space’s saved choices come ticked, and Run sends what’s ticked', () => {
  const { host, closed } = render(info);
  expect(host.textContent).toContain('Acme · Weekly sync · 42 min');
  const boxes = [...host.querySelectorAll<HTMLInputElement>('input[type=checkbox]')];
  expect(boxes.map((b) => b.checked)).toEqual([true, false, false, true, false, false]);
  act(() => boxes[1].click());
  act(() => button(host, 'Run').dispatchEvent(new MouseEvent('click', { bubbles: true })));
  expect(calls).toEqual([['meetingRun', 'space:s1', 'm1', ['summary', 'myTodos', 'email']]]);
  expect(closed()).toBe(true);
});

test('with no assistant in the space, it offers to set one up instead', () => {
  const { host } = render({ ...info, askAvailable: false });
  expect(host.querySelectorAll('input[type=checkbox]')).toHaveLength(0);
  expect(button(host, 'Run')).toBeUndefined();
  act(() => button(host, 'Set up the assistant').dispatchEvent(new MouseEvent('click', { bubbles: true })));
  expect(calls).toEqual([['openSettings', 'assistant']]);
});

