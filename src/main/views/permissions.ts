const ALWAYS_ALLOWED = new Set(['notifications', 'clipboard-sanitized-write', 'fullscreen']);
const CALL_PERMISSIONS = new Set(['media', 'display-capture']);
const CALL_HOSTS = new Set([
  'meet.google.com',
  'app.slack.com',
  'web.whatsapp.com',
  'teams.microsoft.com',
  'teams.live.com',
  'teams.cloud.microsoft',
  'discord.com',
  'ptb.discord.com',
  'canary.discord.com',
  'web.telegram.org',
]);

export function isPermissionAllowed(permission: string, requestingUrl: string): boolean {
  if (ALWAYS_ALLOWED.has(permission)) return true;
  if (!CALL_PERMISSIONS.has(permission)) return false;
  try {
    return CALL_HOSTS.has(new URL(requestingUrl).hostname);
  } catch {
    return false;
  }
}
