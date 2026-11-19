// Connecting OpenRouter: checking a key, and the models that can use tools.

export interface OpenRouterModel {
  id: string;
  name: string;
}

/** Whether a key works (OpenRouter answers for it), with its label when it gives one. */
export async function checkOpenRouterKey(fetcher: typeof fetch, key: string): Promise<{ ok: true; label?: string } | { ok: false; message: string }> {
  try {
    const res = await fetcher('https://openrouter.ai/api/v1/key', { headers: { Authorization: `Bearer ${key}` } });
    if (res.status === 401 || res.status === 403) return { ok: false, message: 'OpenRouter did not accept this key.' };
    if (!res.ok) return { ok: false, message: `OpenRouter answered ${res.status}. Try again.` };
    const body = (await res.json().catch(() => ({}))) as { data?: { label?: string } };
    return { ok: true, ...(body.data?.label ? { label: body.data.label } : {}) };
  } catch {
    return { ok: false, message: "Couldn't reach OpenRouter. Check the connection." };
  }
}

/** The models that support tool calling (the assistant needs them), by name. */
export function toolModels(body: unknown): OpenRouterModel[] {
  const data = (body as { data?: { id?: unknown; name?: unknown; supported_parameters?: unknown }[] })?.data;
  if (!Array.isArray(data)) return [];
  return data
    .filter((m) => typeof m.id === 'string' && Array.isArray(m.supported_parameters) && m.supported_parameters.includes('tools'))
    .map((m) => ({ id: m.id as string, name: typeof m.name === 'string' ? m.name : (m.id as string) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
