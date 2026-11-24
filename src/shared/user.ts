/** The user's name (asked in the setup and in Settings → General): what Home greets and the assistant calls them. */
export const MAX_USER_NAME = 60;

/** One line, trimmed; '' clears it; null when it isn't text or is too long. */
export function cleanUserName(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.replace(/\s+/g, ' ').trim();
  return s.length > MAX_USER_NAME ? null : s;
}
