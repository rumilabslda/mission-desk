import type { MeetingProviderId } from '../../shared/meeting';
import { meetingKey } from '../../shared/meeting-detect';
import type { ViewKind } from '../../shared/types';

/** How long a meeting that seems over is kept, so a reload or a quick rejoin continues it. */
export const END_HOLD = 120_000;

interface Started {
  accountId: string;
  kind: ViewKind;
  provider: MeetingProviderId;
  key: string;
  url: string;
}

/**
 * Decides when an account view is in a meeting: it's in a call (the page uses the microphone or
 * camera, tracked by the service preload) and its URL is a meeting's. Ends are held END_HOLD.
 */
export function createDetector(deps: {
  onStart(m: Started): void;
  onEnd(accountId: string, kind: ViewKind, key: string): void;
  setTimer(fn: () => void, ms: number): unknown;
  clearTimer(id: unknown): void;
}) {
  interface View {
    inCall: boolean;
    url: string;
    active: string | null;
    ending: unknown;
  }
  const views = new Map<string, View>();
  const id = (accountId: string, kind: ViewKind): string => `${accountId}|${kind}`;

  function view(accountId: string, kind: ViewKind): View {
    let v = views.get(id(accountId, kind));
    if (!v) {
      v = { inCall: false, url: '', active: null, ending: null };
      views.set(id(accountId, kind), v);
    }
    return v;
  }

  function cancelEnd(v: View): void {
    if (v.ending !== null) deps.clearTimer(v.ending);
    v.ending = null;
  }

  function end(accountId: string, kind: ViewKind, v: View): void {
    cancelEnd(v);
    const key = v.active;
    v.active = null;
    if (key) deps.onEnd(accountId, kind, key);
  }

  function evaluate(accountId: string, kind: ViewKind): void {
    const v = view(accountId, kind);
    const m = v.inCall ? meetingKey(v.url) : null;
    if (v.active && m?.key === v.active) return cancelEnd(v);
    if (v.active && m) end(accountId, kind, v); // another meeting: the first ends now
    if (v.active) {
      if (v.ending === null) v.ending = deps.setTimer(() => end(accountId, kind, v), END_HOLD);
      return;
    }
    if (m) {
      v.active = m.key;
      deps.onStart({ accountId, kind, provider: m.provider, key: m.key, url: v.url });
    }
  }

  return {
    callChanged(accountId: string, kind: ViewKind, inCall: boolean, url: string): void {
      const v = view(accountId, kind);
      v.inCall = inCall;
      if (url) v.url = url;
      evaluate(accountId, kind);
    },
    urlChanged(accountId: string, kind: ViewKind, url: string): void {
      view(accountId, kind).url = url;
      evaluate(accountId, kind);
    },
    viewGone(accountId: string, kind: ViewKind): void {
      const v = view(accountId, kind);
      v.inCall = false;
      v.url = '';
      evaluate(accountId, kind);
    },
  };
}
export type Detector = ReturnType<typeof createDetector>;
