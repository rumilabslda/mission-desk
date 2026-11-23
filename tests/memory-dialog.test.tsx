// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, expect, test } from 'vitest';
import { MemoryDialog } from '../src/renderer/src/memory/MemoryDialog';
import type { MemoryNote } from '../src/shared/assistant';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const calls: unknown[][] = [];
const api = new Proxy({}, { get: (_t, name: string) => (...args: unknown[]) => void calls.push([name, ...args]) });
const notes: MemoryNote[] = [
  { id: 'n1', text: 'Ana is Acme’s CFO', createdAt: '2026-11-20T10:00:00Z' },
  { id: 'n2', text: 'Reply in Portuguese', createdAt: '2026-11-21T10:00:00Z' },
];

function render(props: Partial<Parameters<typeof MemoryDialog>[0]> = {}) {
  const host = document.createElement('div');
  document.body.append(host);
  let closed = false;
  act(() => createRoot(host).render(<MemoryDialog scope="space:s1" name="Acme" notes={notes} max={40} onClose={() => (closed = true)} {...props} />));
  return { host, closed: () => closed };
}
const button = (host: HTMLElement, label: string) => [...host.querySelectorAll('button')].find((b) => b.textContent?.trim() === label || b.getAttribute('aria-label') === label);
const type = (el: HTMLInputElement, value: string) => {
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  act(() => {
    set.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
};
const key = (el: HTMLElement, k: string) => act(() => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })));

beforeEach(() => {
  calls.length = 0;
  document.body.innerHTML = '';
  (window as unknown as { missiondesk: unknown }).missiondesk = api;
});

test('shows the space’s notes and how full the memory is', () => {
  const { host } = render();
  expect(host.textContent).toContain('Acme');
  expect(host.textContent).toContain('2 of 40');
  expect(host.textContent).toContain('Ana is Acme’s CFO');
  expect(host.textContent).toContain('Reply in Portuguese');
});

test('search filters the notes as you type', () => {
  const { host } = render();
  type(host.querySelector<HTMLInputElement>('input[type=search]')!, 'cfo');
  expect(host.textContent).toContain('Ana is Acme’s CFO');
  expect(host.textContent).not.toContain('Reply in Portuguese');
});

test('a note is edited in place: Enter saves it in its own space', () => {
  const { host } = render();
  act(() => button(host, 'Ana is Acme’s CFO')!.click());
  const input = host.querySelector<HTMLInputElement>('.mem-edit')!;
  type(input, 'Ana is Acme’s CFO since 2025');
  key(input, 'Enter');
  expect(calls).toContainEqual(['assistantMemoryUpdate', 'space:s1', 'n1', 'Ana is Acme’s CFO since 2025']);
});

test('Escape leaves a note as it was', () => {
  const { host } = render();
  act(() => button(host, 'Reply in Portuguese')!.click());
  const input = host.querySelector<HTMLInputElement>('.mem-edit')!;
  type(input, 'changed');
  key(input, 'Escape');
  expect(calls).toEqual([]);
});

test('delete asks first, on the same line', () => {
  const { host } = render();
  act(() => button(host, 'Delete: Reply in Portuguese')!.click());
  expect(calls).toEqual([]);
  act(() => button(host, 'No')!.click());
  expect(calls).toEqual([]);
  act(() => button(host, 'Delete: Reply in Portuguese')!.click());
  act(() => button(host, 'Yes')!.click());
  expect(calls).toEqual([['assistantMemoryRemove', 'space:s1', 'n2']]);
});

test('a new note is added to this space; a full memory takes no more', () => {
  const { host } = render();
  const add = host.querySelector<HTMLInputElement>('.mem-add input')!;
  type(add, '  Weekly sync on Tuesdays  ');
  key(add, 'Enter');
  expect(calls).toEqual([['assistantMemoryAdd', 'space:s1', 'Weekly sync on Tuesdays']]);
  const full = render({ max: 2 });
  expect(full.host.querySelector<HTMLInputElement>('.mem-add input')!.disabled).toBe(true);
});
