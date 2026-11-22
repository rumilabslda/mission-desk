import type { ChildLike } from '../assistant/engine';
import type { EngineId } from '../../shared/meeting';

/** Talks to md-transcriber (native/transcriber): JSON lines on stdio. */

type Ch = 'me' | 'call';
export interface Capabilities {
  engines: { id: string; available: boolean; reason: string | null }[];
  apple: { supported: string[]; installed: string[] };
}
export interface StartOptions {
  engine: EngineId;
  locale: string;
  modelDir: string | null;
}

const RATE = 16; // samples per ms (16 kHz)
const MAX_BUFFER = 5 * 16_000; // samples per channel kept while the helper starts
const MAX_RESTARTS = 3;
const RESTART_WINDOW = 60_000;

export function createTranscriber(io: { spawn(): ChildLike; now(): number }) {
  let child: ChildLike | null = null;
  let options: StartOptions | null = null; // set while a meeting runs (the helper is restarted if it dies)
  let ready = false;
  let pending = '';
  const buffered: Record<Ch, Int16Array[]> = { me: [], call: [] };
  /** Samples sent to the current process, per channel. */
  const sent: Record<Ch, number> = { me: 0, call: 0 };
  /** Where the current process's timeline starts, in meeting ms, per channel. */
  const offset: Record<Ch, number> = { me: 0, call: 0 };
  let lastEnd = 0;
  let restarts: number[] = [];

  const segmentCbs = new Set<(ch: Ch, s: { start: number; end: number; text: string }) => void>();
  const gapCbs = new Set<(g: { start: number; end: number }) => void>();
  const errorCbs = new Set<(code: string, message: string) => void>();
  /** One-shot waiters for a message type ("ready", "finished", "capabilities"…); errors go to the first waiter. */
  let waiters: { type: string; resolve(m: Record<string, unknown>): void; reject(e: Error & { code?: string }): void; progress?: (m: Record<string, unknown>) => void }[] = [];

  const fail = (code: string, message: string): Error & { code: string } => Object.assign(new Error(message), { code });

  function write(o: unknown): void {
    child?.stdin?.write(`${JSON.stringify(o)}\n`);
  }

  function onLine(line: string): void {
    let m: Record<string, unknown>;
    try {
      m = JSON.parse(line) as Record<string, unknown>;
    } catch {
      return;
    }
    switch (m.type) {
      case 'segment': {
        const ch = m.ch === 'me' || m.ch === 'call' ? m.ch : null;
        if (!ch || typeof m.text !== 'string' || typeof m.start !== 'number' || typeof m.end !== 'number') return;
        const s = { start: m.start + offset[ch], end: m.end + offset[ch], text: m.text };
        lastEnd = Math.max(lastEnd, s.end);
        segmentCbs.forEach((cb) => cb(ch, s));
        return;
      }
      case 'localeProgress':
        waiters.find((w) => w.type === 'localeInstalled')?.progress?.(m);
        return;
      case 'error': {
        const w = waiters.shift();
        if (w) w.reject(fail(String(m.code), String(m.message)));
        else errorCbs.forEach((cb) => cb(String(m.code), String(m.message)));
        return;
      }
      default: {
        if (m.type === 'ready') {
          ready = true;
          for (const ch of ['me', 'call'] as const) for (const b of buffered[ch].splice(0)) send(ch, b);
        }
        const i = waiters.findIndex((w) => w.type === m.type);
        if (i >= 0) waiters.splice(i, 1)[0].resolve(m);
      }
    }
  }

  function ensure(): ChildLike {
    if (child) return child;
    const c = io.spawn();
    child = c;
    pending = '';
    ready = false;
    sent.me = 0;
    sent.call = 0;
    c.stdout?.on('data', (b: Buffer) => {
      pending += b.toString('utf8');
      let nl: number;
      while ((nl = pending.indexOf('\n')) >= 0) {
        const line = pending.slice(0, nl);
        pending = pending.slice(nl + 1);
        if (line.trim()) onLine(line);
      }
    });
    // Read and drop its logs (Core ML warnings and the like): an unread pipe would block the helper once full.
    c.stderr?.on('data', () => undefined);
    c.on('error', () => exited(c));
    c.on('exit', () => exited(c));
    return c;
  }

  function exited(c: ChildLike): void {
    if (child !== c) return;
    child = null;
    ready = false;
    const err = fail('internal', 'The transcription helper stopped.');
    for (const w of waiters.splice(0)) w.reject(err);
    if (!options) return; // idle: started again on the next call
    // Mid-meeting: what the dead process hadn't finalised is lost; the new one continues the timeline.
    const crashAt = Math.max(offset.me + sent.me / RATE, offset.call + sent.call / RATE);
    offset.me += sent.me / RATE;
    offset.call += sent.call / RATE;
    const t = io.now();
    restarts = restarts.filter((r) => t - r < RESTART_WINDOW);
    if (restarts.length >= MAX_RESTARTS) {
      options = null;
      errorCbs.forEach((cb) => cb('internal', 'The transcription helper keeps stopping.'));
      return;
    }
    restarts.push(t);
    if (crashAt > lastEnd) gapCbs.forEach((cb) => cb({ start: lastEnd, end: crashAt }));
    lastEnd = crashAt;
    const o = options;
    ensure();
    write({ type: 'start', engine: o.engine, locale: o.locale, modelDir: o.modelDir });
  }

  function request(o: Record<string, unknown>, type: string, progress?: (m: Record<string, unknown>) => void): Promise<Record<string, unknown>> {
    ensure();
    return new Promise((resolve, reject) => {
      waiters.push({ type, resolve, reject, progress });
      write(o);
    });
  }

  function send(ch: Ch, pcm: Int16Array): void {
    sent[ch] += pcm.length;
    write({ type: 'audio', ch, pcm: Buffer.from(pcm.buffer, pcm.byteOffset, pcm.byteLength).toString('base64') });
  }

  return {
    async capabilities(): Promise<Capabilities> {
      const m = await request({ type: 'capabilities' }, 'capabilities');
      return { engines: m.engines as Capabilities['engines'], apple: m.apple as Capabilities['apple'] };
    },
    /** Starts (or restarts, e.g. a new language) the engines; the meeting's timeline goes on. */
    async start(o: StartOptions): Promise<void> {
      if (options) {
        offset.me += sent.me / RATE;
        offset.call += sent.call / RATE;
        sent.me = 0;
        sent.call = 0;
      } else {
        offset.me = offset.call = lastEnd = 0;
        restarts = [];
      }
      options = o;
      ready = false;
      await request({ type: 'start', engine: o.engine, locale: o.locale, modelDir: o.modelDir }, 'ready');
    },
    feed(ch: Ch, pcm: Int16Array): void {
      if (!options) return;
      if (ready && child) return send(ch, pcm);
      const b = buffered[ch];
      b.push(pcm);
      let total = b.reduce((n, x) => n + x.length, 0);
      while (total > MAX_BUFFER && b.length) total -= b.shift()!.length;
    },
    async finish(): Promise<void> {
      if (!options) return;
      options = null;
      buffered.me = [];
      buffered.call = [];
      if (child) await request({ type: 'finish' }, 'finished').catch(() => undefined);
    },
    installLocale(locale: string, onProgress: (f: number) => void): Promise<void> {
      return request({ type: 'installLocale', locale }, 'localeInstalled', (m) => onProgress(Number(m.fraction) || 0)).then(() => undefined);
    },
    async releaseLocale(locale: string): Promise<void> {
      ensure();
      write({ type: 'releaseLocale', locale });
    },
    onSegment(cb: (ch: Ch, s: { start: number; end: number; text: string }) => void): () => void {
      segmentCbs.add(cb);
      return () => segmentCbs.delete(cb);
    },
    onGap(cb: (g: { start: number; end: number }) => void): () => void {
      gapCbs.add(cb);
      return () => gapCbs.delete(cb);
    },
    onError(cb: (code: string, message: string) => void): () => void {
      errorCbs.add(cb);
      return () => errorCbs.delete(cb);
    },
    close(): void {
      options = null;
      const c = child;
      child = null;
      c?.stdin?.end();
      c?.kill();
    },
  };
}
export type Transcriber = ReturnType<typeof createTranscriber>;
