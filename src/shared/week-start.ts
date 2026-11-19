/**
 * The Mac's "First day of week" (AppleFirstWeekday, 1 = Sunday, 2 = Monday…).
 * Monday unless it says Sunday: other first days are rare and fall back to Monday.
 */
export function weekStartFrom(appleFirstWeekday: unknown): 0 | 1 {
  const g =
    typeof appleFirstWeekday === 'object' && appleFirstWeekday !== null
      ? (appleFirstWeekday as Record<string, unknown>).gregorian
      : undefined;
  return g === 1 ? 0 : 1;
}

/** The user's choice in Settings, else the Mac's. */
export function effectiveWeekStart(setting: 0 | 1 | undefined, mac: 0 | 1): 0 | 1 {
  return setting ?? mac;
}
