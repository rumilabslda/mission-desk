// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, expect, test } from 'vitest';
import { MeetingsSettings, meetingsAvailable } from '../src/renderer/src/settings/MeetingsSettings';
import type { UiSnapshot } from '../src/shared/ipc';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const calls: unknown[][] = [];
const api = new Proxy(
  {},
  {
    get: (_t, name: string) =>
      name === 'meetingCapabilities'
        ? async () => ({ apple: { supported: ['pt-PT', 'en-US'], installed: ['en-US'] } })
        : (...args: unknown[]) => void calls.push([name, ...args]),
  },
);

const snap = {
  spaces: [{ id: 's1', name: 'Acme' }],
  meetings: {
    list: [],
    live: null,
    asking: null,
    localeInstall: null,
    settings: { engine: 'apple' },
    spaces: { 'space:s1': { mode: 'ask', language: 'pt-PT' }, nospace: { mode: 'ask' } },
    engines: [
      { id: 'apple', state: 'ready', bytes: 0 },
      { id: 'whisper', state: 'notDownloaded', bytes: 1_640_000_000 },
      { id: 'parakeet', state: 'ready', bytes: 480_000_000 },
    ],
  },
} as unknown as UiSnapshot;

async function render() {
  const host = document.createElement('div');
  document.body.append(host);
  await act(async () => createRoot(host).render(<MeetingsSettings snap={snap} />));
  return host;
}
const buttonsIn = (el: Element, label: string) => [...el.querySelectorAll('button')].filter((b) => b.textContent?.trim() === label);

beforeEach(() => {
  calls.length = 0;
  document.body.innerHTML = '';
  (window as unknown as { missiondesk: unknown }).missiondesk = api;
});

test('only on macOS', () => {
  expect(meetingsAvailable('darwin')).toBe(true);
  expect(meetingsAvailable('win32')).toBe(false);
  expect(meetingsAvailable('linux')).toBe(false);
});

test('a space’s mode is changed for that space only', async () => {
  const host = await render();
  const row = host.querySelector('[data-scope="space:s1"]')!;
  await act(async () => buttonsIn(row, 'Always')[0].click());
  expect(calls).toContainEqual(['setSpaceMeetings', 'space:s1', { mode: 'always', language: 'pt-PT' }]);
});

test('an engine can be used only once downloaded; delete goes to main', async () => {
  const host = await render();
  const whisper = host.querySelector('[data-engine="whisper"]')!;
  expect(buttonsIn(whisper, 'Use')[0].disabled).toBe(true);
  await act(async () => buttonsIn(whisper, 'Download')[0].click());
  expect(calls).toContainEqual(['modelDownload', 'whisper']);
  const parakeet = host.querySelector('[data-engine="parakeet"]')!;
  await act(async () => buttonsIn(parakeet, 'Use')[0].click());
  expect(calls).toContainEqual(['setMeetingGlobal', { engine: 'parakeet' }]);
  await act(async () => buttonsIn(parakeet, 'Delete')[0].click());
  expect(calls).toContainEqual(['modelDelete', 'parakeet']);
});

test('Apple’s missing languages can be downloaded', async () => {
  const host = await render();
  const apple = host.querySelector('[data-engine="apple"]')!;
  const download = [...apple.querySelectorAll('button')].find((b) => b.textContent?.startsWith('Download'))!;
  await act(async () => download.click());
  expect(calls).toContainEqual(['meetingInstallLocale', 'pt-PT']);
});

test('retention and the notice are saved', async () => {
  const host = await render();
  const select = host.querySelector<HTMLSelectElement>('select[data-retention]')!;
  await act(async () => {
    select.value = '30';
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  expect(calls).toContainEqual(['setMeetingGlobal', { retentionDays: 30 }]);
});
