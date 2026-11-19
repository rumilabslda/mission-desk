import { StringDecoder } from 'node:string_decoder';
import type { AssistantEffort, AssistantEvent } from '../../shared/assistant';
import { buildCodexArgs, forbiddenItem, parseCodexEvent } from './codex';
import type { AssistantSession, ChildLike } from './engine';

export interface CodexIO {
  spawn(cmd: string, args: string[], opts: { cwd: string; env: Record<string, string> }): ChildLike;
  /** The user's Codex CLI, or null when it isn't installed. */
  codexPath(): Promise<string | null>;
  env: Record<string, string>;
  cwd: string;
  /** Mission Desk's MCP server for this scope (built for every run: the socket may move). */
  mcp(): { command: string; args: string[]; env: Record<string, string> };
  instructions(): string;
}

const SIGNED_OUT = /not logged in|please log in|log in again|codex login|unauthori[sz]ed|\b401\b/i;
/** Codex's answer to `resume` of a thread it no longer has. */
const STALE_THREAD = /(thread|session|conversation|rollout)[^\n]{0,60}(not found|does not exist|no longer)|no (such )?(thread|session|rollout)/i;

/** One assistant conversation on the user's own Codex CLI: one run per message, resuming the thread. */
export function createCodexSession(io: CodexIO, initial: { model: string; effort: AssistantEffort; resume?: string }): AssistantSession {
  let model = initial.model;
  let effort = initial.effort;
  let thread: string | null = initial.resume ?? null;
  let child: ChildLike | null = null;
  let working = false;
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

  async function run(text: string): Promise<void> {
    const cmd = await io.codexPath();
    if (!working) return; // stopped while looking for Codex
    if (!cmd) {
      working = false;
      emit({ type: 'error', kind: 'not-found', message: 'OpenAI Codex is not installed.' });
      return;
    }
    const resumed = thread !== null;
    let started = false;
    const args = buildCodexArgs({ cwd: io.cwd, mcp: io.mcp(), instructions: io.instructions(), model, effort, ...(thread ? { resume: thread } : {}) });
    const c = io.spawn(cmd, args, { cwd: io.cwd, env: io.env });
    child = c;
    let carry = '';
    let stderr = '';
    let texts = 0;
    let finished = false;
    let lastError = ''; // Codex reports retries as errors too: only a run that fails shows one
    const out = new StringDecoder('utf8');
    const err = new StringDecoder('utf8');
    c.stdin?.on?.('error', () => undefined);
    c.stdout?.on('data', (b: Buffer) => {
      const lines = (carry + out.write(b)).split('\n');
      carry = lines.pop() ?? '';
      for (const line of lines) {
        const forbidden = forbiddenItem(line);
        if (forbidden && child === c) {
          // Fail closed: only Mission Desk's tools may run.
          child = null;
          working = false;
          end(c);
          emit({ type: 'error', kind: 'failed', message: `Codex tried to use ${forbidden}, which Mission Desk doesn't allow, so the answer was stopped.` });
          return;
        }
        for (const e of parseCodexEvent(line)) {
          if (child !== c) return;
          started = true;
          if (e.type === 'init') thread = e.sessionId;
          if (e.type === 'text') {
            if (texts++ > 0) emit({ type: 'text', delta: '\n\n' }); // separate Codex's messages
          }
          if (e.type === 'done') {
            finished = true;
            working = false;
          }
          if (e.type === 'error' && !finished) {
            lastError = e.message;
            continue;
          }
          emit(e);
        }
      }
    });
    c.stderr?.on('data', (b: Buffer) => {
      stderr = (stderr + err.write(b)).slice(-2000);
    });
    c.on('error', (e) => {
      if (child !== c) return;
      child = null;
      working = false;
      emit({ type: 'error', kind: /ENOENT/.test(e.message) ? 'not-found' : 'failed', message: e.message });
    });
    c.on('exit', () => {
      if (child !== c) return;
      child = null;
      if (!finished && working && resumed && !started && STALE_THREAD.test(stderr)) {
        // The saved thread is gone: answer the same message in a new one.
        thread = null;
        emit({ type: 'text', delta: '(The earlier context of this conversation was no longer available, so I started fresh.)\n\n' });
        void run(text);
        return;
      }
      if (!finished && working) {
        working = false;
        const message = lastError || stderr.trim() || 'Codex stopped unexpectedly.';
        emit({ type: 'error', kind: SIGNED_OUT.test(message) ? 'signed-out' : 'failed', message });
      }
    });
    c.stdin?.write(text);
    c.stdin?.end();
  }

  return {
    async send(text) {
      if (working) return;
      working = true;
      await run(text);
    },
    stop() {
      const c = child;
      child = null;
      working = false;
      end(c);
      emit({ type: 'done', isError: false });
    },
    setModel(m, e) {
      model = m;
      effort = e;
    },
    close() {
      const c = child;
      child = null;
      working = false;
      thread = null;
      end(c);
    },
    release() {
      const c = child;
      child = null;
      working = false;
      end(c);
    },
    sessionId: () => thread,
    onEvent(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    busy: () => working,
  };
}
