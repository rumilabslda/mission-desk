import fs from 'node:fs';
import path from 'node:path';
import { app, desktopCapturer, session, type Session } from 'electron';
import type { ServiceId } from '../../shared/types';
import { googleSignInUserAgent, userAgentFor } from './user-agent';
import { isPermissionAllowed } from './permissions';

const configured = new Set<string>();
let electronUserAgent = '';

/** Electron's original user agent, captured at startup before any rewriting. */
export function setElectronUserAgent(ua: string): void {
  electronUserAgent = ua;
}

export function partitionFor(accountId: string): string {
  return `persist:acct-${accountId}`;
}

/** The isolated, persistent session of one account, configured once. */
export function accountSession(accountId: string, service: ServiceId): Session {
  const ses = session.fromPartition(partitionFor(accountId));
  if (configured.has(accountId)) return ses;
  configured.add(accountId);

  const electronUa = electronUserAgent || ses.getUserAgent();
  ses.setUserAgent(userAgentFor(service, electronUa));
  if (service !== 'google') {
    // "Sign in with Google" inside this app: present the user agent Google's sign-in accepts.
    ses.webRequest.onBeforeSendHeaders({ urls: ['https://accounts.google.com/*'] }, (details, callback) => {
      const ua = googleSignInUserAgent(service, details.url, electronUa);
      if (ua) details.requestHeaders['User-Agent'] = ua;
      callback({ requestHeaders: details.requestHeaders });
    });
  }
  ses.setPermissionRequestHandler((wc, permission, callback, details) => {
    callback(isPermissionAllowed(permission, details.requestingUrl ?? wc.getURL()));
  });
  ses.setPermissionCheckHandler((_wc, permission, requestingOrigin) =>
    isPermissionAllowed(permission, requestingOrigin),
  );
  ses.setDisplayMediaRequestHandler(
    (request, callback) => {
      // Only reached when the macOS system picker is unavailable.
      if (!isPermissionAllowed('display-capture', request.securityOrigin)) return callback({});
      void desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
        callback(sources[0] ? { video: sources[0] } : {});
      });
    },
    { useSystemPicker: true },
  );
  return ses;
}

/** Signs the account out and deletes everything it stored on disk. */
export async function clearAccountData(accountId: string): Promise<void> {
  const ses = session.fromPartition(partitionFor(accountId));
  await ses.clearStorageData();
  await ses.clearCache();
  configured.delete(accountId);
  const dir = path.join(app.getPath('userData'), 'Partitions', `acct-${accountId}`);
  fs.rmSync(dir, { recursive: true, force: true });
}
