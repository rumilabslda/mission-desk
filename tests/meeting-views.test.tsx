// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, expect, test } from 'vitest';
import { splitWaiting } from '../src/renderer/src/home/waiting';
import { RecentMeetings } from '../src/renderer/src/home/RecentMeetings';
import { MeetingSection } from '../src/renderer/src/meetings/MeetingSection';
import { TranscriptView } from '../src/renderer/src/meetings/TranscriptView';
import type { Meeting, MeetingListItem } from '../src/shared/meeting';
import type { Todo } from '../src/shared/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const calls: unknown[][] = [];
let stored: Meeting | null = null;
const api = new Proxy(
  {},
  {
    get: (_t, name: string) =>
      name === 'meetingGet'
        ? async (...args: unknown[]) => (calls.push([name, ...args]), stored)
        : (...args: unknown[]) => void calls.push([name, ...args]),
  },
);

const meeting: Meeting = {
  id: 'm1',
  scope: 'space:s1',
  accountId: 'g1',
  provider: 'meet',
  url: 'u',
  title: 'Weekly sync',
  startedAt: '2026-11-22T10:00:00.000Z',
  endedAt: '2026-11-22T10:42:00.000Z',
  language: 'pt-PT',
  engine: 'apple',
  segments: [
    { start: 0, end: 2000, speaker: 'me', text: 'Bom dia.' },
    { start: 65_000, end: 67_000, speaker: 'Maria Silva', text: 'Olá.' },
  ],
  gaps: [{ start: 30_000, end: 45_000 }],
  result: { summary: { decisions: ['Budget approved'], points: [], nextSteps: ['Send the proposal'] }, myTodos: ['Send the proposal'], memoryNotes: ['Maria leads finance'] },
  applied: ['summary', 'myTodos'],
};
const item: MeetingListItem = { id: 'm1', scope: 'space:s1', title: 'Weekly sync', startedAt: meeting.startedAt, minutes: 42, state: 'ready' };

async function render(el: React.JSX.Element) {
  const host = document.createElement('div');
  document.body.append(host);
  await act(async () => createRoot(host).render(el));
  return host;
}
const button = (host: HTMLElement, label: string) => [...host.querySelectorAll('button')].find((b) => b.textContent?.trim() === label);

beforeEach(() => {
  calls.length = 0;
  stored = meeting;
  document.body.innerHTML = '';
  (window as unknown as { missiondesk: unknown }).missiondesk = api;
});

test('a meeting shows its summary, its to-dos and the proposals', async () => {
  const todos = [{ id: 't1', text: 'Send the proposal', done: false, createdAt: '', day: '2026-11-22', meetingId: 'm1' }] as Todo[];
  const host = await render(<MeetingSection item={item} todos={todos} spaceName="Acme" defaults={['summary', 'myTodos', 'waitingOn', 'email']} />);
  expect(calls[0]).toEqual(['meetingGet', 'space:s1', 'm1']);
  expect(host.textContent).toContain('Budget approved');
  expect(host.textContent).toContain('Send the proposal');
  expect(host.textContent).toContain('Maria leads finance');
  await act(async () => button(host, 'Save note')!.click());
  expect(calls).toContainEqual(['meetingSaveNote', 'space:s1', 'm1', 0]);
  await act(async () => button(host, 'Copy summary')!.click());
  expect(calls).toContainEqual(['meetingCopySummary', 'space:s1', 'm1']);
});

test('Run actions offers only what hasn’t run yet', async () => {
  const host = await render(<MeetingSection item={item} todos={[]} spaceName="Acme" defaults={['summary', 'myTodos', 'waitingOn', 'email']} />);
  await act(async () => button(host, 'Run actions')!.click());
  const boxes = [...document.querySelectorAll<HTMLInputElement>('.me-dialog input[type=checkbox]')];
  expect(boxes.map((b) => b.checked)).toEqual([false, false, true, true, false, false]);
});

test('a failed run shows why, with Try again', async () => {
  const host = await render(<MeetingSection item={{ ...item, state: 'failed', error: 'Rate limited' }} todos={[]} spaceName="Acme" defaults={['summary']} />);
  expect(host.textContent).toContain('Rate limited');
  expect(button(host, 'Try again')).toBeDefined();
});

test('Home lists today’s meetings with their state', async () => {
  const items: MeetingListItem[] = [
    { ...item, id: 'a', title: 'Standup', startedAt: new Date().toISOString(), state: 'transcribing' },
    { ...item, id: 'b', title: 'Old', startedAt: '2020-01-01T10:00:00.000Z', state: 'ready' },
  ];
  const host = await render(<RecentMeetings items={items} />);
  expect(host.textContent).toContain('Standup');
  expect(host.textContent).toContain('Transcribing');
  expect(host.textContent).not.toContain('Old');
  await act(async () => button(host, 'See all')!.click());
  expect(calls).toContainEqual(['openMeetings']);
});

test('waiting-on to-dos are grouped apart', () => {
  const todos = [
    { id: '1', text: 'Mine', waitingOn: undefined },
    { id: '2', text: 'Theirs', waitingOn: 'Maria' },
  ] as Todo[];
  const g = splitWaiting(todos);
  expect(g.mine.map((x) => x.id)).toEqual(['1']);
  expect(g.waiting.map((x) => x.id)).toEqual(['2']);
});

test('the transcript shows speakers, gaps and a pruned note', async () => {
  const host = await render(<TranscriptView meeting={meeting} onClose={() => {}} />);
  expect(host.textContent).toContain('[00:00] Me: Bom dia.');
  expect(host.textContent).toContain('[01:05] Maria Silva: Olá.');
  expect(host.textContent).toContain('Transcription interrupted 00:30–00:45');
  const pruned = await render(<TranscriptView meeting={{ ...meeting, segments: [], transcriptPruned: true }} onClose={() => {}} />);
  expect(pruned.textContent).toContain('deleted');
});
