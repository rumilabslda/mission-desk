// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, expect, test } from 'vitest';
import { AssistantSettings } from '../src/renderer/src/settings/AssistantSettings';
import type { ConnectionInfo } from '../src/shared/connections';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const infos: ConnectionInfo[] = [
  { id: 'mac-claude', kind: 'claude', name: '', addedAt: '', builtin: true, state: 'ready' },
  { id: 'abcdefabcdef', kind: 'claude', name: 'Claude Acme', addedAt: '', state: 'ready', email: 'me@acme.com' },
  { id: 'openrouter', kind: 'openrouter', name: '', addedAt: '', builtin: true, state: 'ready' },
];
const calls: unknown[][] = [];
const api = new Proxy(
  {},
  {
    get: (_t, name: string) =>
      (...args: unknown[]) => {
        calls.push([name, ...args]);
        return name === 'connectionsInfo' ? Promise.resolve(infos) : name === 'openRouterModels' ? Promise.resolve([]) : undefined;
      },
  },
);
const snapFor = (connection: string) =>
  ({
    accounts: [],
    assistant: {
      mode: 'space',
      button: true,
      scopes: [{ key: 'space:s1', name: 'Acme' }],
      configs: { 'space:s1': { engine: 'claude', model: 'default', effort: 'medium', openrouterModel: 'openrouter/auto', codexModel: '', connection } },
      memory: {},
      connections: [{ id: 'abcdefabcdef', kind: 'claude', name: 'Claude Acme', addedAt: '' }],
    },
  }) as never;

async function render(connection = '') {
  const host = document.createElement('div');
  document.body.append(host);
  await act(async () => createRoot(host).render(<AssistantSettings snap={snapFor(connection)} />));
  return host;
}

beforeEach(() => {
  calls.length = 0;
  document.body.innerHTML = '';
  (window as unknown as { missiondesk: unknown }).missiondesk = api;
});

test('the space’s Assistant select lists the connections by name, grouped by type, then Off', async () => {
  const host = await render();
  const select = host.querySelector<HTMLSelectElement>('.asg-head select')!;
  expect([...select.querySelectorAll('optgroup')].map((g) => g.label)).toEqual(['Claude Code', 'OpenRouter']);
  expect([...select.options].map((o) => o.textContent)).toEqual(['Claude Code (this Mac)', 'Claude Acme · me@acme.com', 'OpenRouter', 'Off']);
  expect(select.value).toBe('claude|mac-claude');
});

test('choosing a connection sets the space’s type and connection', async () => {
  const host = await render();
  const select = host.querySelector<HTMLSelectElement>('.asg-head select')!;
  await act(async () => {
    select.value = 'claude|abcdefabcdef';
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  expect(calls).toContainEqual(['setAssistantScopeConfig', 'space:s1', { engine: 'claude', connection: 'abcdefabcdef' }]);
  await act(async () => {
    select.value = 'openrouter|openrouter';
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  expect(calls).toContainEqual(['setAssistantScopeConfig', 'space:s1', { engine: 'openrouter', connection: '' }]);
});

test('a removed connection says so', async () => {
  const host = await render('zzzzzzzzzzzz');
  expect(host.textContent).toContain('The connection this space used was removed: choose one.');
});
