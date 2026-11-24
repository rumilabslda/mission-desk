import { randomUUID } from 'node:crypto';
import type { LiveInsights, MeetingInsight, Segment } from '../../../shared/meeting';
import { transcriptText } from '../followup';
import type { Ask } from '../one-shot';
import { askInsights, buildInsightPrompt, checkInsights, MAX_PER_MEETING } from './insights';
import type { Retriever, SourceItem } from './retrieve';

const NEW_SPEECH_MS = 90_000;
const BETWEEN_CHECKS_MS = 120_000;
const WINDOW_MS = 5 * 60_000;
const ITEMS = 30;
const CARD_EVERY_MS = 180_000;
const SOURCES_EVERY_MS = 10 * 60_000;
const TIMEOUT_MS = 60_000;
const FAILURES_TO_PAUSE = 2;

export interface InsightRunnerDeps {
  /** Epoch ms. */
  now(): number;
  meeting: { scope: string; id: string; title: string; language: string; startedAt: number };
  /** The scope's tool-less request; null: the space has no assistant. */
  ask(): Ask | null;
  /** Why the space's connection can't be used now (shown on the bar), or null. */
  unavailable(): string | null;
  /** The space's knowledge; rebuilt every 10 minutes. */
  sources(): SourceItem[];
  retriever: Retriever;
  myName: string;
  save(i: MeetingInsight): void;
  changed(): void;
  timeoutMs?: number;
}

/**
 * Paces the checks for the live meeting: one when there are 90 s of new speech and 2 minutes have
 * passed, never two at once, stopped by a pause, two failures in a row, the cap or the end.
 */
export function createInsightRunner(d: InsightRunnerDeps) {
  const timeoutMs = d.timeoutMs ?? TIMEOUT_MS;
  const heard: Segment[] = [];
  const list: MeetingInsight[] = [];
  let latest: MeetingInsight | undefined;
  let lastCardAt = -Infinity;
  let newSpeech = 0;
  let lastCheck = d.now();
  let paused = false;
  let reason: string | undefined;
  let unavailable = d.ask() ? d.unavailable() : '';
  let failures = 0;
  let running: AbortController | null = null;
  let stopped = false;
  let sources: SourceItem[] = [];
  let sourcesAt = -Infinity;

  function due(): boolean {
    return !stopped && !paused && !running && list.length < MAX_PER_MEETING && newSpeech >= NEW_SPEECH_MS && d.now() - lastCheck >= BETWEEN_CHECKS_MS;
  }

  function check(): void {
    const now = d.now();
    newSpeech = 0;
    lastCheck = now;
    const ask = d.ask();
    const why = ask ? d.unavailable() : '';
    if (!ask || why !== null) {
      if (unavailable !== why) {
        unavailable = why;
        d.changed();
      }
      return;
    }
    if (unavailable !== null) {
      unavailable = null;
      d.changed();
    }
    if (now - sourcesAt >= SOURCES_EVERY_MS) {
      sources = d.sources();
      sourcesAt = now;
    }
    const lastEnd = heard.at(-1)?.end ?? 0;
    const window = heard.filter((s) => s.end >= lastEnd - WINDOW_MS);
    const windowText = transcriptText(window, d.myName);
    const items = d.retriever.top(windowText, sources, ITEMS);
    if (items.length === 0) return;
    const ctrl = new AbortController();
    running = ctrl;
    const prompt = buildInsightPrompt({ title: d.meeting.title, language: d.meeting.language, myName: d.myName, window, items });
    askInsights(ask, prompt, AbortSignal.any([ctrl.signal, AbortSignal.timeout(timeoutMs)])).then(
      (raw) => {
        if (running !== ctrl || stopped) return;
        running = null;
        failures = 0;
        const at = d.now();
        const kept = checkInsights(raw, {
          sent: items,
          windowText,
          meetingStart: d.meeting.startedAt,
          previous: list,
          at: at - d.meeting.startedAt,
          newId: () => randomUUID().replace(/-/g, '').slice(0, 12),
        });
        for (const i of kept) {
          d.save(i);
          list.unshift(i);
          if (at - lastCardAt >= CARD_EVERY_MS) {
            latest = i;
            lastCardAt = at;
          }
        }
        if (kept.length) d.changed();
      },
      (err: Error) => {
        if (running !== ctrl || stopped) return; // stopped or paused by us: not a failure
        running = null;
        failures += 1;
        if (failures >= FAILURES_TO_PAUSE) {
          paused = true;
          reason = err?.message || 'error';
        }
        d.changed();
      },
    );
  }

  return {
    /** The meeting's new lines, as they arrive. */
    segments(segs: Segment[]): void {
      if (stopped) return;
      heard.push(...segs);
      if (!paused) for (const s of segs) newSpeech += Math.max(0, s.end - s.start);
      if (due()) check();
    },
    /** "Pause insights": no checks, and a running one is dropped. */
    pause(why?: string): void {
      paused = true;
      reason = why;
      running?.abort();
      running = null;
      d.changed();
    },
    resume(): void {
      if (stopped) return;
      paused = false;
      reason = undefined;
      failures = 0;
      newSpeech = 0;
      lastCheck = d.now();
      d.changed();
    },
    /** The meeting ended: a running request is aborted and its answer never used. */
    stop(): void {
      stopped = true;
      running?.abort();
      running = null;
    },
    state(): LiveInsights {
      const state: LiveInsights['state'] = paused ? 'paused' : unavailable !== null ? 'unavailable' : 'on';
      const why = paused ? reason : unavailable || undefined;
      return { state, ...(why ? { reason: why } : {}), count: list.length, ...(latest ? { latest } : {}), list: [...list] };
    },
  };
}
export type InsightRunner = ReturnType<typeof createInsightRunner>;
