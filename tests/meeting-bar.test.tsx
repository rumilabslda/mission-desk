// @vitest-environment happy-dom
import { act } from 'react';
import { beforeEach, expect, test } from 'vitest';
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
  expect(meetingBarBounds({ x: 0, y: 0, width: 1000, height: 700 })).toEqual({ x: 220, y: 8, width: 560, height: 36 });
  expect(meetingBarBounds({ x: 72, y: 40, width: 400, height: 700 }, 2)).toEqual({ x: 80, y: 48, width: 384, height: 60 });
});
