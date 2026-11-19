export type ViewPolicy = 'always-on' | 'idle';

interface Entry {
  policy: ViewPolicy;
  visible: boolean;
  inCall: boolean;
  timer: ReturnType<typeof setTimeout> | null;
}

export interface HibernationScheduler {
  /** Starts tracking a view. New views count as hidden. */
  register(key: string, policy: ViewPolicy): void;
  unregister(key: string): void;
  setVisible(key: string, visible: boolean): void;
  setInCall(key: string, inCall: boolean): void;
}

export function createHibernationScheduler(opts: {
  idleMs: number;
  onHibernate: (key: string) => void;
}): HibernationScheduler {
  const entries = new Map<string, Entry>();

  function clear(entry: Entry): void {
    if (entry.timer) clearTimeout(entry.timer);
    entry.timer = null;
  }

  function reschedule(key: string): void {
    const entry = entries.get(key);
    if (!entry) return;
    clear(entry);
    if (entry.policy !== 'idle' || entry.visible || entry.inCall) return;
    entry.timer = setTimeout(() => {
      entry.timer = null;
      entries.delete(key);
      opts.onHibernate(key);
    }, opts.idleMs);
  }

  return {
    register(key, policy) {
      const old = entries.get(key);
      if (old) clear(old);
      entries.set(key, { policy, visible: old?.visible ?? false, inCall: old?.inCall ?? false, timer: null });
      reschedule(key);
    },
    unregister(key) {
      const entry = entries.get(key);
      if (entry) clear(entry);
      entries.delete(key);
    },
    setVisible(key, visible) {
      const entry = entries.get(key);
      if (!entry || entry.visible === visible) return;
      entry.visible = visible;
      reschedule(key);
    },
    setInCall(key, inCall) {
      const entry = entries.get(key);
      if (!entry || entry.inCall === inCall) return;
      entry.inCall = inCall;
      reschedule(key);
    },
  };
}
