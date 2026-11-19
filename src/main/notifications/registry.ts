/** A page closing its own notification sooner than this, while the user isn't looking, is a toast timeout. */
export const AUTO_CLOSE_GRACE_MS = 30_000;

/**
 * Notifications currently on screen, per page: so the page can close one
 * (read elsewhere) and a new one with the same tag replaces the old one.
 */
export function createShownNotifications<N extends { close(): void }>(limit = 200, now: () => number = Date.now) {
  const byId = new Map<string, { n: N; at: number }>(); // "sender|id" → notification
  const byTag = new Map<string, string>(); // "sender|tag" → "sender|id"
  const key = (sender: number, x: number | string): string => `${sender}|${x}`;

  function remove(idKey: string): N | undefined {
    const e = byId.get(idKey);
    byId.delete(idKey);
    for (const [t, k] of byTag) if (k === idKey) byTag.delete(t);
    return e?.n;
  }

  return {
    add(sender: number, id: number, tag: string, n: N): void {
      if (tag) {
        const previous = byTag.get(key(sender, tag));
        if (previous) remove(previous)?.close();
        byTag.set(key(sender, tag), key(sender, id));
      }
      byId.set(key(sender, id), { n, at: now() });
      while (byId.size > limit) remove(byId.keys().next().value as string); // keep references bounded
    },
    /**
     * The page closed it (e.g. the message was read on another device). Many web apps also
     * close their notifications after a few seconds: while the account isn't on screen, such
     * an early close is ignored so the notification stays in Notification Center.
     * Returns whether it really closed (then the message counts as read).
     */
    close(sender: number, id: number, onScreen = true): boolean {
      const k = key(sender, id);
      const e = byId.get(k);
      if (!e) return false;
      if (!onScreen && now() - e.at < AUTO_CLOSE_GRACE_MS) return false;
      remove(k)?.close();
      return true;
    },
    /** The user dismissed or clicked it. */
    forget(n: N): void {
      for (const [k, v] of byId) if (v.n === n) remove(k);
    },
    /** The page reloaded: its ids start again, so its old notifications are no longer its to close. */
    forgetSender(sender: number): void {
      const prefix = `${sender}|`;
      for (const k of [...byId.keys()]) if (k.startsWith(prefix)) remove(k);
    },
    size: (): number => byId.size,
  };
}
