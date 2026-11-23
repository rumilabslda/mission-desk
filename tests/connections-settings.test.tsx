// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, expect, test } from 'vitest';
import { ConnectionsSettings, uniqueName } from '../src/renderer/src/settings/ConnectionsSettings';
import type { ConnectionInfo } from '../src/shared/connections';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const infos: ConnectionInfo[] = [
  { id: 'mac-claude', kind: 'claude', name: '', addedAt: '', builtin: true, state: 'ready', email: 'me@home.com' },
  { id: 'abcdefabcdef', kind: 'claude', name: 'Claude Acme', addedAt: '', state: 'signed-out' },
  { id: 'openrouter', kind: 'openrouter', name: '', addedAt: '', builtin: true, state: 'ready' },
];
const calls: unknown[][] = [];
let replies: Record<string, unknown> = {};
const api = new Proxy(
  {},
  {
    get: (_t, name: string) =>
      (...args: unknown[]) => {
        calls.push([name, ...args]);
        return name in replies ? replies[name] : Promise.resolve(name === 'connectionsInfo' ? infos : { ok: true, id: 'x' });
      },
  },
);

async function render() {
  const host = document.createElement('div');
  document.body.append(host);
  await act(async () => createRoot(host).render(<ConnectionsSettings connections={[]} />));
  return host;
}
const button = (host: HTMLElement, label: string) =>
  [...host.querySelectorAll('button')].find((b) => b.textContent?.trim() === label || b.getAttribute('aria-label') === label);
const type = (el: HTMLInputElement, value: string) => {
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  act(() => {
    set.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
};
const click = async (el: HTMLElement | undefined) => {
  if (!el) throw new Error('no such button');
  await act(async () => el.click());
};
const made = () => calls.filter((c) => c[0] !== 'connectionsInfo');

beforeEach(() => {
  calls.length = 0;
  replies = {};
  document.body.innerHTML = '';
  (window as unknown as { missiondesk: unknown }).missiondesk = api;
});

test('each connection shows its name, type and state', async () => {
  const host = await render();
  expect(host.textContent).toContain('Claude Code (this Mac)');
  expect(host.textContent).toContain('me@home.com');
  expect(host.textContent).toContain('Claude Acme');
  expect(host.textContent).toContain('Not signed in');
  expect(button(host, 'Sign in again')).toBeTruthy();
});

test('rename in place; remove only added connections', async () => {
  const host = await render();
  await click(button(host, 'Rename: Claude Acme'));
  const input = host.querySelector<HTMLInputElement>('.cn-rename')!;
  type(input, 'Claude Rumi');
  await act(async () => input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
  expect(made()).toEqual([['connectionRename', 'abcdefabcdef', 'Claude Rumi']]);
  expect(button(host, 'Remove: Claude Code (this Mac)')).toBeUndefined();
  await click(button(host, 'Remove: Claude Acme'));
  expect(made()).toContainEqual(['connectionRemove', 'abcdefabcdef']);
});

test('the wizard: type, then a name already filled in, then the browser sign-in', async () => {
  const host = await render();
  await click(button(host, '+ New connection'));
  await click(host.querySelector<HTMLButtonElement>('[data-kind=claude]')!);
  const name = host.querySelector<HTMLInputElement>('.cn-name')!;
  expect(name.value).toBe('Claude 2');
  await click(button(host, 'Next'));
  await click(button(host, 'Sign in in the browser'));
  expect(made()).toEqual([['connectionCreate', 'claude', 'Claude 2']]);
  expect(host.querySelector('.cn-wizard')).toBeNull(); // done: back to the list
});

test('OpenRouter asks for its key; a refused key keeps the wizard open with the error', async () => {
  replies.connectionCreate = Promise.resolve({ ok: false, error: 'Key refused' });
  const host = await render();
  await click(button(host, '+ New connection'));
  await click(host.querySelector<HTMLButtonElement>('[data-kind=openrouter]')!);
  expect(host.querySelector<HTMLInputElement>('.cn-name')!.value).toBe('OpenRouter 2');
  await click(button(host, 'Next'));
  type(host.querySelector<HTMLInputElement>('.cn-wizard input[type=password]')!, 'sk-or-1');
  await click(button(host, 'Connect'));
  expect(made()).toEqual([['connectionCreate', 'openrouter', 'OpenRouter 2', 'sk-or-1']]);
  expect(host.textContent).toContain('Key refused');
  expect(host.querySelector('.cn-wizard input[type=password]')).toBeTruthy();
});

test('a taken name is refused before connecting; Cancel stops a sign-in that is waiting', async () => {
  replies.connectionCreate = new Promise(() => undefined);
  const host = await render();
  await click(button(host, '+ New connection'));
  await click(host.querySelector<HTMLButtonElement>('[data-kind=claude]')!);
  type(host.querySelector<HTMLInputElement>('.cn-name')!, 'claude acme');
  await click(button(host, 'Next'));
  expect(host.textContent).toContain('Another connection already has that name.');
  type(host.querySelector<HTMLInputElement>('.cn-name')!, 'Claude Rumi');
  await click(button(host, 'Next'));
  await click(button(host, 'Sign in in the browser'));
  await click(button(host, 'Cancel'));
  expect(made()).toEqual([['connectionCreate', 'claude', 'Claude Rumi'], ['connectionCancel']]);
});

test('unique names count every connection, built-ins included', () => {
  expect(uniqueName('claude', ['Claude 2', 'Claude Acme'])).toBe('Claude 3');
  expect(uniqueName('codex', [])).toBe('Codex 2');
});
