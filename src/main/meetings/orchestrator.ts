import type { WebContents } from 'electron';
import { t } from '../../shared/i18n';
import type { EngineId, LiveMeeting, Meeting, MeetingProviderId, SpaceMeetingSettings } from '../../shared/meeting';
import { assignSpeakers, mutedAt, type ProbeSample } from '../../shared/meeting-speakers';
import type { ProbeResult } from '../../shared/meeting-probes';
import type { ViewKind } from '../../shared/types';
import type { CaptureState } from './capture-host';
import type { MeetingStore } from './store';
import type { Transcriber } from './transcriber';

/** A meeting shorter than this, or with no text, is dropped without asking anything. */
export const MIN_MEETING_MS = 60_000;
/** How far back speaker readings are kept (segments arrive a few seconds after the speech). */
const SAMPLES_KEPT_MS = 15 * 60_000;

interface Detected {
  accountId: string;
  kind: ViewKind;
  provider: MeetingProviderId;
  key: string;
  url: string;
}

interface Live {
  meeting: Meeting;
  accountId: string;
  kind: ViewKind;
  provider: MeetingProviderId;
  key: string;
  startMs: number;
  paused: boolean;
  pausedAt: number;
  engine: EngineId;
  modelDir: string | null;
  notice?: LiveMeeting['notice'];
}

export interface OrchestratorDeps {
  store: MeetingStore;
  transcriber(): Pick<Transcriber, 'start' | 'feed' | 'finish' | 'onSegment' | 'onGap' | 'onError'>;
  capture: { start(source: WebContents): Promise<void>; stop(): void };
  onCapture(pcm: (ch: 'me' | 'call', d: Int16Array) => void, state: (s: CaptureState) => void): () => void;
  settingsFor(scope: string): SpaceMeetingSettings;
  setSpaceMeetings(scope: string, s: SpaceMeetingSettings): void;
  /** The chosen engine, or Apple with the reason when the chosen one can't run. */
  engineFor(): { engine: EngineId; modelDir: string | null; fellBack?: string };
  /** An installed engine other than Apple, for when Apple lacks the meeting's language. */
  alternateEngine(): { engine: EngineId; modelDir: string | null } | null;
  defaultLanguage(): string;
  /** The account's scope, or null when the account is gone. */
  scopeOf(accountId: string): string | null;
  /** Every scope with a folder of meetings (for recover()). */
  scopes(): string[];
  /** The calendar event this meeting belongs to (same link, around its time), with its title. */
  matchEvent(accountId: string, url: string, at: number): Promise<{ event: NonNullable<Meeting['event']>; title: string } | undefined>;
  /** A title when there's no event ("Google Meet · Acme"). */
  titleFor(provider: MeetingProviderId, accountId: string): string;
  webContentsOf(accountId: string, kind: ViewKind): WebContents | null;
  /** Starts (provider) or stops (null) the page's speaker and mute readings. */
  probe(accountId: string, kind: ViewKind, provider: MeetingProviderId | null): void;
  probeReliable(provider: MeetingProviderId): boolean;
  push(): void;
  /** A real meeting ended: show "Meeting ended". */
  ended(m: Meeting): void;
  now(): number;
}

/**
 * Runs a meeting's transcription from detection to the end: the space's mode (Always / Ask / Off),
 * one live meeting at a time, the engine and its language, the recorder, speakers and mute, pause,
 * and the stored text. Audio is only passed through, never kept.
 */
export function createOrchestrator(deps: OrchestratorDeps) {
  let live: Live | null = null;
  /** The meeting whose last segments are still arriving after it ended. */
  let writing: { scope: string; id: string } | null = null;
  let asking: (Detected & { switchTo: boolean; title: string }) | null = null;
  let samples: ProbeSample[] = [];
  let subscribed = false;

  const elapsed = (): number => (live ? deps.now() - live.startMs : 0);

  function subscribe(): void {
    if (subscribed) return;
    subscribed = true;
    const tr = deps.transcriber();
    tr.onSegment((ch, s) => {
      const target = live ? { scope: live.meeting.scope, id: live.meeting.id } : writing;
      if (target) deps.store.append(target.scope, target.id, [assignSpeakers(ch, s, samples)]);
    });
    tr.onGap((g) => {
      if (live) deps.store.gap(live.meeting.scope, live.meeting.id, g);
    });
    tr.onError((_code, message) => setNotice({ code: 'fellBack', text: t('meetings.notice.failed', { reason: message }) }));
    deps.onCapture(
      (ch, data) => {
        if (!live) return;
        const silent = live.paused || (ch === 'me' && mutedAt(samples, elapsed()));
        deps.transcriber().feed(ch, silent ? new Int16Array(data.length) : data);
      },
      (s) => {
        if (!live) return;
        if (!s.me) setNotice({ code: 'missingSide', text: t('meetings.notice.missingMe') });
        else if (!s.call) setNotice({ code: 'missingSide', text: t('meetings.notice.missingCall') });
      },
    );
  }

  function setNotice(n: LiveMeeting['notice']): void {
    if (!live) return;
    live.notice = n;
    deps.push();
  }

  async function startEngine(l: Live): Promise<void> {
    const tr = deps.transcriber();
    try {
      await tr.start({ engine: l.engine, locale: l.meeting.language, modelDir: l.modelDir });
    } catch (e) {
      if ((e as { code?: string }).code !== 'localeMissing') {
        l.notice = { code: 'fellBack', text: t('meetings.notice.failed', { reason: (e as Error).message }) };
        return;
      }
      l.notice = { code: 'localeMissing', text: t('meetings.notice.localeMissing', { language: l.meeting.language }), locale: l.meeting.language };
      const alt = deps.alternateEngine();
      if (!alt) return;
      l.engine = alt.engine;
      l.modelDir = alt.modelDir;
      await tr.start({ engine: alt.engine, locale: l.meeting.language, modelDir: alt.modelDir }).catch(() => undefined);
      deps.store.update(l.meeting.scope, l.meeting.id, { engine: alt.engine });
    }
  }

  async function begin(d: Detected): Promise<void> {
    const scope = deps.scopeOf(d.accountId);
    if (!scope) return;
    subscribe();
    const now = deps.now();
    const e = deps.engineFor();
    const matched = await deps.matchEvent(d.accountId, d.url, now);
    const language = deps.settingsFor(scope).language ?? deps.defaultLanguage();
    const meeting = deps.store.create({
      scope,
      accountId: d.accountId,
      provider: d.provider,
      url: d.url,
      title: matched?.title ?? deps.titleFor(d.provider, d.accountId),
      startedAt: new Date(now).toISOString(),
      language,
      engine: e.engine,
      ...(matched ? { event: matched.event } : {}),
    });
    samples = [];
    const l: Live = { meeting, accountId: d.accountId, kind: d.kind, provider: d.provider, key: d.key, startMs: now, paused: false, pausedAt: 0, engine: e.engine, modelDir: e.modelDir };
    if (e.fellBack) l.notice = { code: 'fellBack', text: e.fellBack };
    else if (!deps.probeReliable(d.provider)) l.notice = { code: 'probeUnreliable', text: t('meetings.notice.probeUnreliable') };
    live = l;
    await startEngine(l);
    const wc = deps.webContentsOf(d.accountId, d.kind);
    if (wc) await deps.capture.start(wc);
    deps.probe(d.accountId, d.kind, d.provider);
    deps.push();
  }

  async function finishLive(): Promise<void> {
    const l = live;
    if (!l) return;
    live = null;
    writing = { scope: l.meeting.scope, id: l.meeting.id };
    deps.capture.stop();
    deps.probe(l.accountId, l.kind, null);
    deps.push();
    await deps.transcriber().finish();
    writing = null;
    const endMs = deps.now();
    const m = deps.store.update(l.meeting.scope, l.meeting.id, { endedAt: new Date(endMs).toISOString() });
    if (!m || endMs - l.startMs < MIN_MEETING_MS || m.segments.length === 0) {
      deps.store.remove(l.meeting.scope, l.meeting.id);
      deps.push();
      return;
    }
    deps.push();
    deps.ended(m);
  }

  return {
    /** The detector saw a meeting start in an account view. */
    async start(d: Detected): Promise<void> {
      if (live && live.accountId === d.accountId && live.kind === d.kind && live.key === d.key) return;
      const scope = deps.scopeOf(d.accountId);
      if (!scope) return;
      const mode = deps.settingsFor(scope).mode;
      if (mode === 'off') return;
      const title = (await deps.matchEvent(d.accountId, d.url, deps.now()))?.title ?? deps.titleFor(d.provider, d.accountId);
      if (live) {
        asking = { ...d, switchTo: true, title };
        return deps.push();
      }
      if (mode === 'ask') {
        asking = { ...d, switchTo: false, title };
        return deps.push();
      }
      await begin(d);
    },
    /** The detector saw a meeting end (after its hold). */
    async end(accountId: string, kind: ViewKind, key: string): Promise<void> {
      if (asking && asking.accountId === accountId && asking.kind === kind && asking.key === key) {
        asking = null;
        deps.push();
      }
      if (live && live.accountId === accountId && live.kind === kind && live.key === key) await finishLive();
    },
    /** The Ask bar's answer. `never`: this space stops asking (Off). */
    async answer(yes: boolean, never: boolean): Promise<void> {
      const a = asking;
      asking = null;
      if (!a) return deps.push();
      const scope = deps.scopeOf(a.accountId);
      if (never && scope) deps.setSpaceMeetings(scope, { ...deps.settingsFor(scope), mode: 'off' });
      if (!yes) return deps.push();
      if (a.switchTo) await finishLive();
      await begin(a);
    },
    pause(): void {
      if (!live || live.paused) return;
      live.paused = true;
      live.pausedAt = elapsed();
      deps.push();
    },
    resume(): void {
      if (!live || !live.paused) return;
      deps.store.gap(live.meeting.scope, live.meeting.id, { start: live.pausedAt, end: elapsed() });
      live.paused = false;
      deps.push();
    },
    stop: (): Promise<void> => finishLive(),
    async setLanguage(locale: string): Promise<void> {
      if (!live) return;
      live.meeting = deps.store.update(live.meeting.scope, live.meeting.id, { language: locale }) ?? live.meeting;
      live.notice = undefined;
      await startEngine(live);
      deps.push();
    },
    /** A reading from the meeting page (who's speaking, mute). */
    onProbe(accountId: string, kind: ViewKind, r: ProbeResult): void {
      if (!live || live.accountId !== accountId || live.kind !== kind) return;
      const at = elapsed();
      samples.push({ at, speaking: r.speaking, muted: r.muted });
      if (samples.length > 1 && samples[0].at < at - SAMPLES_KEPT_MS) samples = samples.filter((s) => s.at >= at - SAMPLES_KEPT_MS);
    },
    /** Closes meetings left open by a quit or a crash: they keep their text and wait to be run. */
    recover(): void {
      for (const scope of deps.scopes()) {
        for (const item of deps.store.list(scope)) {
          const m = deps.store.get(scope, item.id);
          if (!m || m.endedAt) continue;
          const last = m.segments.at(-1);
          if (!last) {
            deps.store.remove(scope, m.id);
            continue;
          }
          deps.store.update(scope, m.id, { endedAt: new Date(Date.parse(m.startedAt) + last.end).toISOString() });
        }
      }
    },
    live(): LiveMeeting | null {
      if (!live) return null;
      return {
        id: live.meeting.id,
        scope: live.meeting.scope,
        accountId: live.accountId,
        paused: live.paused,
        language: live.meeting.language,
        engine: live.engine,
        ...(live.notice ? { notice: live.notice } : {}),
      };
    },
    /** Where the live meeting runs (for the bar). */
    liveView: (): { accountId: string; kind: ViewKind } | null => (live ? { accountId: live.accountId, kind: live.kind } : null),
    asking: (): { accountId: string; kind: ViewKind; title: string; switchTo: boolean } | null =>
      asking ? { accountId: asking.accountId, kind: asking.kind, title: asking.title, switchTo: asking.switchTo } : null,
  };
}
export type Orchestrator = ReturnType<typeof createOrchestrator>;
