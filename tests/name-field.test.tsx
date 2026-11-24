// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, test } from 'vitest';
import { NameField } from '../src/renderer/src/settings/NameField';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function type(input: HTMLInputElement, value: string) {
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  set.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

test('the name is saved trimmed when the field is left, and only when it changed', () => {
  const saved: string[] = [];
  const host = document.createElement('div');
  document.body.append(host);
  act(() => createRoot(host).render(<NameField value="Armando" onSave={(n) => saved.push(n)} />));
  const input = host.querySelector('input')!;
  expect(input.value).toBe('Armando');
  act(() => input.dispatchEvent(new FocusEvent('focusout', { bubbles: true })));
  expect(saved).toEqual([]);
  act(() => type(input, '  Armando   Rodrigues '));
  act(() => input.dispatchEvent(new FocusEvent('focusout', { bubbles: true })));
  expect(saved).toEqual(['Armando Rodrigues']);
  expect(input.maxLength).toBe(60);
});
