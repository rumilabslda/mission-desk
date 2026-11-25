/** The last mouse button pressed in a service page, as its preload reported it. */
export interface LinkClick {
  meta: boolean;
  ctrl: boolean;
  middle: boolean;
  /** When main received it (ms). */
  at: number;
}

/** A window opened this long after the click still belongs to it. */
const CLICK_WINDOW_MS = 2000;

/** The page's report (untrusted): only true booleans count. */
export function parseLinkClick(raw: unknown, now: number): LinkClick | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;
  return { meta: o.meta === true, ctrl: o.ctrl === true, middle: o.middle === true, at: now };
}

/**
 * The user asked for the browser: Cmd-click on a Mac (Ctrl-click elsewhere; on a Mac Ctrl-click is a
 * right-click), a middle click, or Chromium's own "background tab" for a modified click.
 */
export function wantsBrowser(click: LinkClick | undefined, disposition: string, platform: NodeJS.Platform, now: number): boolean {
  if (disposition === 'background-tab') return true;
  if (!click || now - click.at > CLICK_WINDOW_MS) return false;
  return click.middle || (platform === 'darwin' ? click.meta : click.ctrl);
}
