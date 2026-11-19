export const CONSENT_MS = 30 * 60 * 1000;

/** Per-account permission for Claude to act, granted live by the user. In memory only. */
export function createConsent(now: () => number) {
  const until = new Map<string, number>();
  const has = (id: string): boolean => (until.get(id) ?? 0) > now();
  return {
    has,
    grant: (id: string) => void until.set(id, now() + CONSENT_MS),
    revoke: (id: string) => void until.delete(id),
    revokeAll: () => until.clear(),
    active: (): string[] => [...until.keys()].filter(has),
  };
}
export type Consent = ReturnType<typeof createConsent>;
