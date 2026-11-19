import { checkOpenRouterKey, toolModels } from '../src/main/assistant/openrouter-account';

test('a key is checked with OpenRouter (accepted, refused, unreachable)', async () => {
  const ok = await checkOpenRouterKey((async () => new Response(JSON.stringify({ data: { label: 'sk-or-v1-abc...' } }), { status: 200 })) as typeof fetch, 'k');
  expect(ok).toEqual({ ok: true, label: 'sk-or-v1-abc...' });
  expect((await checkOpenRouterKey((async () => new Response('{}', { status: 401 })) as typeof fetch, 'k')).ok).toBe(false);
  expect(await checkOpenRouterKey((async () => { throw new Error('offline'); }) as typeof fetch, 'k')).toEqual({ ok: false, message: "Couldn't reach OpenRouter. Check the connection." });
});

test('only models that can use tools are offered', () => {
  expect(
    toolModels({
      data: [
        { id: 'openai/gpt-5-mini', name: 'OpenAI: GPT-5 Mini', supported_parameters: ['tools', 'temperature'] },
        { id: 'some/text-only', name: 'Text only', supported_parameters: ['temperature'] },
        { id: 'google/gemini-2.5-pro', name: 'Google: Gemini 2.5 Pro', supported_parameters: ['tools'] },
      ],
    }),
  ).toEqual([
    { id: 'google/gemini-2.5-pro', name: 'Google: Gemini 2.5 Pro' },
    { id: 'openai/gpt-5-mini', name: 'OpenAI: GPT-5 Mini' },
  ]);
  expect(toolModels(null)).toEqual([]);
});
