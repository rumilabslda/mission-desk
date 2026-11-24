import { cleanUserName } from '../src/shared/user';
import { greeting } from '../src/shared/today';
import { assistantPrompt } from '../src/main/assistant/prompt';
import { parseSetupPlan } from '../src/main/ipc-validation';

test('a name is trimmed to one line; empty clears it; too long or not text is refused', () => {
  expect(cleanUserName('  Armando \n Rodrigues ')).toBe('Armando Rodrigues');
  expect(cleanUserName('   ')).toBe('');
  expect(cleanUserName('x'.repeat(61))).toBeNull();
  expect(cleanUserName(42)).toBeNull();
});

test('Home greets by name when there is one', () => {
  expect(greeting(new Date(2026, 10, 18, 12), 'Armando')).toBe('Good afternoon, Armando');
  expect(greeting(new Date(2026, 10, 18, 12), '')).toBe('Good afternoon');
  expect(greeting(new Date(2026, 10, 18, 12))).toBe('Good afternoon');
});

test("the assistant knows the user's name", () => {
  expect(assistantPrompt(new Date(2026, 10, 22), 'pt-PT', undefined, [], [], 'Armando')).toContain('The user’s name is Armando.');
  expect(assistantPrompt(new Date(2026, 10, 22), 'pt-PT')).not.toContain('The user’s name is');
});

test('the setup plan may carry the name, cleaned', () => {
  const ok = { engine: 'claude', connection: '', assistantReads: true, spaces: [], apps: [] };
  expect(parseSetupPlan({ ...ok, userName: '  Armando ' })?.userName).toBe('Armando');
  expect(parseSetupPlan({ ...ok, userName: 'x'.repeat(61) })).toBeNull();
  expect(parseSetupPlan(ok)?.userName).toBeUndefined();
});
