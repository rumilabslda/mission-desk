/**
 * Hosts where Mission Desk must not alter the page (no notification or call shims).
 * Google's sign-in detects a modified `Notification`/`getDisplayMedia` and
 * rejects the browser as insecure.
 */
const UNTOUCHED_HOSTS = new Set([
  'accounts.google.com',
  'accounts.youtube.com',
  'login.microsoftonline.com',
  'login.live.com',
  'login.microsoft.com',
  'appleid.apple.com',
]);

export function shouldPatchPage(hostname: string): boolean {
  return !UNTOUCHED_HOSTS.has(hostname);
}
