/// <reference lib="dom" />
// Runs in every service view (Gmail, Slack, WhatsApp…), isolated from the page.
// It gives the page exactly two capabilities: show a notification, and report
// whether a call (camera/microphone) is in progress.
import { contextBridge, ipcRenderer } from 'electron';
import { pickGooglePhoto } from '../main/avatars/sources';
import { shouldPatchPage } from '../shared/page-patches';
import { readerFor } from '../shared/page-unread';
import { type IdentityPayload, SERVICE_IPC, type NotifyPayload } from '../shared/service-ipc';

// Sign-in pages are left exactly as the browser made them.
if (shouldPatchPage(location.hostname)) {
  installPagePatches();
  watchIdentity();
  watchPageUnread();
}

/** Outlook, Teams, Telegram and LinkedIn don't put their unread count in the title: read it from the page (read-only). */
function watchPageUnread(): void {
  const read = readerFor(location.hostname);
  if (!read) return;
  let last: number | null = null;
  setInterval(() => {
    const n = read(document, document.title, location.pathname);
    if (n === null || n === last) return;
    last = n;
    ipcRenderer.send(SERVICE_IPC.unread, n);
  }, 5000);
}

/** Reads the account's photo or company icon from the page (read-only). */
function readIdentity(): IdentityPayload {
  const host = location.hostname;
  const img = (selector: string): string | undefined =>
    document.querySelector<HTMLImageElement>(selector)?.src || undefined;
  if (host === 'mail.google.com') {
    const button = document.querySelector(
      'a[aria-label^="Google Account"], a[aria-label^="Conta Google"], a[href^="https://accounts.google.com/SignOutOptions"]',
    );
    const srcs = [...(button?.querySelectorAll('img') ?? [])].map((i) => i.currentSrc || i.src);
    return { photoUrl: pickGooglePhoto(srcs), companyIconUrl: img('img[src*="/ac/images/logo"]') };
  }
  if (host === 'app.slack.com') {
    try {
      const config = JSON.parse(localStorage.getItem('localConfig_v2') ?? '{}') as {
        teams?: Record<string, { icon?: Record<string, string> }>;
      };
      const teamId = location.pathname.split('/')[2] ?? '';
      const team = config.teams?.[teamId] ?? Object.values(config.teams ?? {})[0];
      const icon = team?.icon ?? {};
      return { companyIconUrl: icon.image_132 ?? icon.image_102 ?? icon.image_88 ?? icon.image_68 ?? icon.image_44 };
    } catch {
      return {};
    }
  }
  if (host === 'web.whatsapp.com') {
    return { photoUrl: img('[aria-label="Profile"] img, header img[src*="pps.whatsapp.net"]') };
  }
  return {};
}

function watchIdentity(): void {
  let last = '';
  const check = (): void => {
    const identity = readIdentity();
    const json = JSON.stringify(identity);
    if (json !== last && (identity.photoUrl || identity.companyIconUrl)) {
      last = json;
      ipcRenderer.send(SERVICE_IPC.identity, identity);
    }
  };
  window.addEventListener('load', () => setTimeout(check, 5000));
  setInterval(check, 60_000);
}

function installPagePatches(): void {
  contextBridge.exposeInMainWorld('__missiondesk', {
    notify(payload: NotifyPayload): void {
      ipcRenderer.send(SERVICE_IPC.notify, {
        id: Number(payload?.id) || 0,
        title: String(payload?.title ?? ''),
        body: String(payload?.body ?? ''),
        tag: String(payload?.tag ?? ''),
      });
    },
    closeNotification(id: number): void {
      ipcRenderer.send(SERVICE_IPC.notificationClose, Number(id) || 0);
    },
    setInCall(inCall: boolean): void {
      ipcRenderer.send(SERVICE_IPC.inCall, Boolean(inCall));
    },
    onNotificationClick(cb: (id: number) => void): void {
      ipcRenderer.on(SERVICE_IPC.notificationClick, (_e, id: number) => cb(id));
    },
  });

  // Installed in the page's own world, before any page script runs.
  contextBridge.executeInMainWorld({
    func: () => {
      type Bridge = {
        notify(p: { id: number; title: string; body: string; tag: string }): void;
        closeNotification(id: number): void;
        setInCall(v: boolean): void;
        onNotificationClick(cb: (id: number) => void): void;
      };
      const bridge = (window as unknown as { __missiondesk: Bridge }).__missiondesk;

      // --- Notifications -------------------------------------------------------
      let nextId = 1 + Math.floor(Math.random() * 1e9); // fresh per page load, so a reload never reuses an id
      const live = new Map<number, MissionDeskNotification>();

      class MissionDeskNotification extends EventTarget {
        static get permission(): NotificationPermission {
          return 'granted';
        }
        static requestPermission(cb?: (p: NotificationPermission) => void): Promise<NotificationPermission> {
          cb?.('granted');
          return Promise.resolve('granted');
        }
        readonly title: string;
        readonly body: string;
        readonly tag: string;
        readonly data: unknown;
        onclick: ((e: Event) => void) | null = null;
        onclose: ((e: Event) => void) | null = null;
        onerror: ((e: Event) => void) | null = null;
        onshow: ((e: Event) => void) | null = null;
        private readonly id = nextId++;

        constructor(title: string, options: NotificationOptions = {}) {
          super();
          this.title = String(title);
          this.body = String(options.body ?? '');
          this.tag = String(options.tag ?? '');
          this.data = options.data;
          live.set(this.id, this);
          if (live.size > 50) live.delete(live.keys().next().value as number);
          bridge.notify({ id: this.id, title: this.title, body: this.body, tag: this.tag });
        }

        close(): void {
          if (live.delete(this.id)) bridge.closeNotification(this.id); // read elsewhere: remove the Mac notification too
        }

        click(): void {
          const event = new Event('click');
          this.onclick?.(event);
          this.dispatchEvent(event);
        }
      }

      bridge.onNotificationClick((id) => live.get(id)?.click());
      Object.defineProperty(window, 'Notification', { value: MissionDeskNotification, writable: true, configurable: true });

      // --- Calls (camera / microphone / screen) --------------------------------
      const devices = navigator.mediaDevices;
      if (!devices) return;
      let liveTracks = 0;
      const track = (stream: MediaStream): MediaStream => {
        for (const t of stream.getTracks()) {
          let ended = false;
          const end = (): void => {
            if (ended) return;
            ended = true;
            liveTracks -= 1;
            if (liveTracks === 0) bridge.setInCall(false);
          };
          liveTracks += 1;
          if (liveTracks === 1) bridge.setInCall(true);
          const stop = t.stop.bind(t);
          t.stop = () => {
            stop();
            end();
          };
          t.addEventListener('ended', end);
        }
        return stream;
      };
      for (const name of ['getUserMedia', 'getDisplayMedia'] as const) {
        const original = devices[name]?.bind(devices) as ((c?: MediaStreamConstraints) => Promise<MediaStream>) | undefined;
        if (original) devices[name] = (c?: MediaStreamConstraints) => original(c).then(track);
      }
    },
  });
}
