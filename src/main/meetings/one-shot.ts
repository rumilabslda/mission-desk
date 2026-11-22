import type { AssistantSession } from '../assistant/engine';

/** One request and its whole answer as text. */
export type Ask = (system: string, user: string, signal: AbortSignal) => Promise<string>;

const TIMEOUT_MS = 10 * 60_000;

/**
 * Runs one request through a fresh assistant session (made by `make`, with no tools) and closes it.
 * Rejects on an error, an answer that ends in error, an abort, or after 10 minutes.
 */
export function createOneShot(
  make: (system: () => string) => Promise<Pick<AssistantSession, 'send' | 'stop' | 'close' | 'onEvent'> & Partial<Pick<AssistantSession, 'sessionId'>>>,
  /** Removes what the engine kept of the session (e.g. Codex's rollout file), once it's closed. */
  cleanup?: (sessionId: string | null) => void,
): Ask {
  return async (system, user, signal) => {
    const session = await make(() => system);
    let text = '';
    try {
      return await new Promise<string>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('The assistant took too long.')), TIMEOUT_MS);
        const onAbort = (): void => {
          session.stop();
          reject(new Error('Stopped.'));
        };
        signal.addEventListener('abort', onAbort, { once: true });
        const settle = (): void => {
          clearTimeout(timer);
          signal.removeEventListener('abort', onAbort);
        };
        session.onEvent((e) => {
          if (e.type === 'text') text += e.delta;
          else if (e.type === 'error') {
            settle();
            reject(new Error(e.message));
          } else if (e.type === 'done') {
            settle();
            if (e.isError) reject(new Error(e.text || 'The assistant couldn’t answer.'));
            else resolve(text || e.text || '');
          }
        });
        if (signal.aborted) return onAbort();
        session.send(user).catch((err: Error) => {
          settle();
          reject(err);
        });
      });
    } finally {
      session.close();
      cleanup?.(session.sessionId?.() ?? null);
    }
  };
}
