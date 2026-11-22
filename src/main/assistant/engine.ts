import { StringDecoder } from 'node:string_decoder';
import type { AssistantEffort, AssistantEvent } from '../../shared/assistant';
import { t } from '../../shared/i18n';
import { buildArgs, classifyError, explainModelError, parseEvent } from './claude-code';

/** What the session needs from a child process (node's ChildProcess fits). */
export interface ChildLike {
  stdin: { write(s: string): boolean; end(): void; on?(ev: 'error', cb: (err: Error) => void): unknown } | null;
  stdout: { on(ev: 'data', cb: (b: Buffer) => void): unknown } | null;
  stderr: { on(ev: 'data', cb: (b: Buffer) => void): unknown } | null;
  on(ev: 'exit', cb: (code: number | null) => void): unknown;
  on(ev: 'error', cb: (err: Error) => void): unknown;
  kill(): void;
}

export interface SessionIO {
  spawn(cmd: string, args: string[], opts: { cwd: string; env: Record<string, string> }): ChildLike;
  /** The user's Claude Code, or null when it isn't installed. */
  claudePath(): Promise<string | null>;
  env: Record<string, string>;
  cwd: string;
  /** Built fresh for every start (the socket may move). */
  mcpConfig(): string;
  /** Built for every start, so "today" is always today. */
  systemPrompt(): string;
}

export interface AssistantSession {
  send(text: string): Promise<void>;
  /** Ends the current answer (the conversation continues on the next message). */
  stop(): void;
  setModel(model: string, effort: AssistantEffort): void;
  /** Ends the conversation (New chat). */
  close(): void;
  /** Ends the process quietly but keeps the conversation (it resumes on the next message). */
  release(): void;
  /** Claude Code's session id, to resume this conversation later. */
  sessionId(): string | null;
  onEvent(cb: (e: AssistantEvent) => void): () => void;
  busy(): boolean;
}

const STDERR_KEEP = 2000;
/** Claude Code's answer to `--resume` of a session it no longer has (it cleans them up after 30 days). */
const STALE_SESSION = /no conversation found|session[^\n]{0,40}(not found|does not exist|no longer)/i;

/** One assistant conversation on the user's own Claude Code (one long-lived process). */
export function createClaudeCodeSession(io: SessionIO, initial: { model: string; effort: AssistantEffort; resume?: string }): AssistantSession {
  let model = initial.model;
  let effort = initial.effort;
  let child: ChildLike | null = null;
  let sessionId: string | null = initial.resume ?? null;
  let working = false;
  let starting: Promise<ChildLike | null> | null = null;
  let generation = 0; // bumped by stop/close/setModel: a start still in flight is abandoned
  let lastText = ''; // the message being answered (sent again if its resume fails)
  const listeners = new Set<(e: AssistantEvent) => void>();
  const emit = (e: AssistantEvent): void => listeners.forEach((l) => l(e));

  function end(c: ChildLike | null): void {
    if (!c) return;
    try {
      c.stdin?.end();
    } catch {
      // already closed
    }
    c.kill();
  }

  function ensure(): Promise<ChildLike | null> {
    if (child) return Promise.resolve(child);
    starting ??= start().finally(() => (starting = null));
    return starting;
  }

  async function start(): Promise<ChildLike | null> {
    const gen = generation;
    const cmd = await io.claudePath();
    if (gen !== generation) return null; // stopped while looking for Claude Code
    if (!cmd) {
      emit({ type: 'error', kind: 'not-found', message: t('assistant.error.claudeNotInstalled') });
      return null;
    }
    const args = buildArgs({ model, effort, mcpConfig: io.mcpConfig(), systemPrompt: io.systemPrompt(), ...(sessionId ? { resume: sessionId } : {}) });
    const c = io.spawn(cmd, args, { cwd: io.cwd, env: io.env });
    child = c;
    const resumed = sessionId !== null;
    let started = false; // Claude Code said anything (a resumed session that fails says nothing first)
    let carry = '';
    let stderr = '';
    /** The saved session is gone: forget it and answer the same message in a fresh one. */
    const startFresh = (why: string): boolean => {
      if (!resumed || started || !STALE_SESSION.test(why) || child !== c) return false;
      child = null;
      sessionId = null;
      working = false;
      emit({ type: 'text', delta: `${t('assistant.startedFresh')}\n\n` });
      void api.send(lastText);
      return true;
    };
    const out = new StringDecoder('utf8'); // multi-byte characters split across chunks stay whole
    const err = new StringDecoder('utf8');
    c.stdin?.on?.('error', () => undefined); // writing to a process that already exited
    c.stdout?.on('data', (b: Buffer) => {
      const text = carry + out.write(b);
      const lines = text.split('\n');
      carry = lines.pop() ?? '';
      for (const line of lines) {
        for (const e of parseEvent(line)) {
          if (e.type === 'done' && e.isError && startFresh(e.text ?? '')) return;
          started = true;
          if (e.type === 'init' && e.sessionId) sessionId = e.sessionId;
          if (e.type === 'done') {
            working = false;
            if (e.sessionId) sessionId = e.sessionId;
          }
          if (child === c) emit(e);
          if (e.type === 'done' && e.isError && child === c) {
            const message = e.text ?? t('assistant.error.claudeReported');
            emit({ type: 'error', kind: classifyError(message), message: explainModelError(message, model) });
          }
        }
      }
    });
    c.stderr?.on('data', (b: Buffer) => {
      stderr = (stderr + err.write(b)).slice(-STDERR_KEEP);
    });
    c.on('error', (err) => {
      if (child !== c) return;
      child = null;
      working = false;
      emit({ type: 'error', kind: /ENOENT/.test(err.message) ? 'not-found' : 'failed', message: err.message });
    });
    c.on('exit', () => {
      if (child !== c) return; // stopped or replaced on purpose
      if (working && startFresh(stderr)) return;
      child = null;
      if (working) {
        working = false;
        const message = stderr.trim() || t('assistant.error.claudeStopped');
        emit({ type: 'error', kind: classifyError(message), message: explainModelError(message, model) });
      }
    });
    return c;
  }

  const api: AssistantSession = {
    async send(text) {
      lastText = text;
      working = true;
      const c = await ensure();
      if (!c) {
        working = false;
        return;
      }
      c.stdin?.write(`${JSON.stringify({ type: 'user', message: { role: 'user', content: [{ type: 'text', text }] } })}\n`);
    },
    stop() {
      generation++;
      const c = child;
      child = null;
      working = false;
      end(c);
      emit({ type: 'done', isError: false }); // the panel always leaves "working"
    },
    setModel(m, e) {
      if (m === model && e === effort) return;
      model = m;
      effort = e;
      generation++;
      const c = child;
      child = null; // the next message starts again with the new model, same conversation
      const was = working;
      working = false;
      end(c);
      if (was) emit({ type: 'done', isError: false });
    },
    close() {
      generation++;
      const c = child;
      child = null;
      working = false;
      sessionId = null;
      end(c);
    },
    release() {
      generation++;
      const c = child;
      child = null;
      working = false;
      end(c);
    },
    sessionId: () => sessionId,
    onEvent(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    busy: () => working,
  };
  return api;
}
