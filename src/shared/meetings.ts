// Finding the "Join" link of a calendar event, for one-click joining. Only real meeting
// services count (an invite's text can contain any link), and only https.

export type MeetingProvider = 'meet' | 'zoom' | 'teams' | 'webex' | 'whereby' | 'jitsi' | 'chime' | 'goto';

export interface JoinLink {
  provider: MeetingProvider;
  url: string;
}

const under = (host: string, domain: string): boolean => host === domain || host.endsWith(`.${domain}`);

/** The meeting service of a join address, or null when it isn't one. */
export function meetingProvider(raw: string): MeetingProvider | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:') return null;
  const h = u.hostname;
  const p = u.pathname;
  if (h === 'meet.google.com' && /^\/[a-z]{3,4}-[a-z]{4}-[a-z]{3,4}$/.test(p)) return 'meet';
  if ((under(h, 'zoom.us') || under(h, 'zoomgov.com')) && /^\/(j|my|w|s|wc)\//.test(p)) return 'zoom';
  if ((h === 'teams.microsoft.com' || h === 'teams.cloud.microsoft') && /^\/(l\/meetup-join|meet)\//.test(p)) return 'teams';
  if (h === 'teams.live.com' && /^\/meet\//.test(p)) return 'teams';
  if (under(h, 'webex.com') && p.length > 1) return 'webex';
  if (h === 'whereby.com' && /^\/[\w-]+/.test(p)) return 'whereby';
  if (h === 'meet.jit.si' && /^\/\w+/.test(p)) return 'jitsi';
  if (under(h, 'chime.aws') && p.length > 1) return 'chime';
  if ((h === 'meet.goto.com' || h === 'global.gotomeeting.com' || h === 'app.goto.com') && p.length > 1) return 'goto';
  return null;
}

const URL_RE = /https:\/\/[^\s"'<>()\]]+/g;

/** Meeting links in free text (HTML-escaped descriptions included), in order. */
function linksIn(text: string): string[] {
  const decoded = text.replace(/&amp;/g, '&');
  return [...decoded.matchAll(URL_RE)].map((m) => m[0].replace(/[.,;:!?]+$/, ''));
}

type Item = { hangoutLink?: unknown; conferenceData?: unknown; location?: unknown; description?: unknown };

/**
 * The event's join link: its own call first (Google Meet, or a conference add-on such as
 * Zoom, Teams or Webex), then a meeting link in its location, then in its description.
 */
export function joinLinkOf(item: Item): JoinLink | null {
  const candidates: string[] = [];
  if (typeof item.hangoutLink === 'string') candidates.push(item.hangoutLink);
  const conf = item.conferenceData as { entryPoints?: unknown } | undefined;
  if (conf && Array.isArray(conf.entryPoints)) {
    for (const p of conf.entryPoints as { entryPointType?: unknown; uri?: unknown }[]) {
      if (p?.entryPointType === 'video' && typeof p.uri === 'string') candidates.push(p.uri);
    }
  }
  if (typeof item.location === 'string') candidates.push(...linksIn(item.location));
  if (typeof item.description === 'string') candidates.push(...linksIn(item.description));
  for (const url of candidates) {
    const provider = meetingProvider(url);
    if (provider) return { provider, url };
  }
  return null;
}

export const PROVIDER_NAME: Record<MeetingProvider, string> = {
  meet: 'Google Meet',
  zoom: 'Zoom',
  teams: 'Teams',
  webex: 'Webex',
  whereby: 'Whereby',
  jitsi: 'Jitsi',
  chime: 'Chime',
  goto: 'GoTo',
};

/** The desktop app's own link (opened directly when the app is installed), or null to use the web link. */
export function nativeJoinUrl(join: JoinLink): string | null {
  let u: URL;
  try {
    u = new URL(join.url);
  } catch {
    return null;
  }
  if (join.provider === 'zoom') {
    const m = /^\/j\/(\d+)/.exec(u.pathname);
    if (!m) return null;
    const pwd = u.searchParams.get('pwd');
    return `zoommtg://${u.hostname}/join?action=join&confno=${m[1]}${pwd ? `&pwd=${encodeURIComponent(pwd)}` : ''}`;
  }
  if (join.provider === 'teams' && u.pathname.startsWith('/l/meetup-join/')) return `msteams:${u.pathname}${u.search}`;
  return null;
}
