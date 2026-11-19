import type { ServiceId } from '../../shared/types';

/**
 * Turns Electron's default user agent into a plain Chrome one.
 * Google blocks sign-in for user agents that advertise Electron.
 */
export function chromeUserAgent(electronUserAgent: string): string {
  return electronUserAgent.replace(/ (Electron|Mission ?Desk)\/\S+/gi, '');
}

/**
 * The user agent each service's session presents.
 * Google rejects sign-in when the UA claims to be Chrome but the client hints
 * say Chromium, so Google accounts keep Electron's own, consistent UA.
 */
export function userAgentFor(service: ServiceId, electronUserAgent: string): string {
  return service === 'google' ? electronUserAgent : chromeUserAgent(electronUserAgent);
}

/**
 * Google's sign-in inside another app's session ("Sign in with Google" in Slack, LinkedIn or a
 * website): the Electron user agent, which Google accepts (the Chrome-shaped one it rejects).
 * Null when the request keeps the session's user agent.
 */
export function googleSignInUserAgent(service: ServiceId, url: string, electronUserAgent: string): string | null {
  if (service === 'google') return null;
  try {
    return new URL(url).hostname === 'accounts.google.com' ? electronUserAgent : null;
  } catch {
    return null;
  }
}
