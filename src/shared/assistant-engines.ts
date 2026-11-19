import { type AssistantEffort, type AssistantModel, isAssistantEffort, isAssistantModel } from './assistant';

/** What answers in a space's assistant. */
export type AssistantEngine = 'claude' | 'codex' | 'openrouter' | 'off';

/** The integrations an assistant can run on (Settings → Integrations). `ready`: usable today. */
export const ENGINES: { id: Exclude<AssistantEngine, 'off'>; name: string }[] = [
  { id: 'claude', name: 'Claude' },
  { id: 'codex', name: 'OpenAI Codex' },
  { id: 'openrouter', name: 'OpenRouter' },
];

/** OpenRouter model ids look like "vendor/model" (or "vendor/model:variant"). */
export const isOpenRouterModel = (v: unknown): v is string => typeof v === 'string' && /^[\w.-]+\/[\w.:-]+$/.test(v) && v.length <= 100;
/** Codex model names (empty: Codex's own default). */
export const isCodexModel = (v: unknown): v is string => typeof v === 'string' && /^([A-Za-z0-9][\w.:-]{0,59})?$/.test(v);

export const isEngine = (v: unknown): v is AssistantEngine => v === 'off' || ENGINES.some((e) => e.id === v);

export interface ScopeConfig {
  engine: AssistantEngine;
  /** Claude's model. */
  model: AssistantModel;
  effort: AssistantEffort;
  /** OpenRouter's model ("openrouter/auto" lets OpenRouter pick). */
  openrouterModel: string;
  /** Codex's model ('' = Codex's default). */
  codexModel: string;
}

type Prefs =
  | {
      model?: string;
      effort?: string;
      /** The assistant spaces use unless they chose one (set by the first-run setup). */
      defaultEngine?: string;
      scopes?: Record<string, { engine?: string; model?: string; effort?: string; openrouterModel?: string; codexModel?: string }>;
    }
  | undefined;

/** A scope's assistant: its own choices, else the defaults (Claude, the last model and effort used). */
export function scopeConfig(prefs: Prefs, scope: string): ScopeConfig {
  const own = prefs?.scopes?.[scope] ?? {};
  const model = isAssistantModel(own.model) ? own.model : isAssistantModel(prefs?.model) ? prefs.model : 'default';
  const effort = isAssistantEffort(own.effort) ? own.effort : isAssistantEffort(prefs?.effort) ? prefs.effort : 'medium';
  const engine = isEngine(own.engine) ? own.engine : isEngine(prefs?.defaultEngine) ? prefs.defaultEngine : 'claude';
  const openrouterModel = isOpenRouterModel(own.openrouterModel) ? own.openrouterModel : 'openrouter/auto';
  const codexModel = isCodexModel(own.codexModel) ? own.codexModel : '';
  return { engine, model, effort, openrouterModel, codexModel };
}
