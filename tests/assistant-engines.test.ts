import { ENGINES, isEngine, scopeConfig } from '../src/shared/assistant-engines';

test('each space uses Claude by default, with the global model and effort', () => {
  expect(scopeConfig({ model: 'opus', effort: 'high' }, 'space:A')).toEqual({ engine: 'claude', model: 'opus', effort: 'high', openrouterModel: 'openrouter/auto', codexModel: '' });
  expect(scopeConfig(undefined, 'all')).toEqual({ engine: 'claude', model: 'default', effort: 'medium', openrouterModel: 'openrouter/auto', codexModel: '' });
});

test("a space's own choice wins; bad stored values fall back", () => {
  const prefs = { model: 'opus', effort: 'high', scopes: { 'space:A': { engine: 'off' as const }, 'space:B': { model: 'haiku', effort: 'low' }, 'space:C': { engine: 'nope', model: 'x', effort: 'y' } } };
  expect(scopeConfig(prefs, 'space:A').engine).toBe('off');
  expect(scopeConfig(prefs, 'space:B')).toMatchObject({ engine: 'claude', model: 'haiku', effort: 'low' });
  expect(scopeConfig(prefs as never, 'space:C')).toMatchObject({ engine: 'claude', model: 'opus', effort: 'high' });
  expect(scopeConfig({ scopes: { s: { engine: 'openrouter', openrouterModel: 'google/gemini-2.5-pro' } } }, 's')).toMatchObject({ engine: 'openrouter', openrouterModel: 'google/gemini-2.5-pro' });
  expect(scopeConfig({ scopes: { s: { openrouterModel: 'bad model id!' } } }, 's').openrouterModel).toBe('openrouter/auto');
});

test('the engines on offer: Claude now; Codex and OpenRouter come next', () => {
  expect(ENGINES.map((e) => e.id)).toEqual(['claude', 'codex', 'openrouter']);
  expect(isEngine('off')).toBe(true);
  expect(isEngine('codex')).toBe(true);
  expect(isEngine('gpt')).toBe(false);
});
