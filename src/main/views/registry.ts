import type { ViewKind } from '../../shared/types';

export interface ViewRegistry<V> {
  set(accountId: string, kind: ViewKind, view: V, webContentsId: number): void;
  get(accountId: string, kind: ViewKind): V | undefined;
  kinds(accountId: string): ViewKind[];
  accountFor(webContentsId: number): { accountId: string; kind: ViewKind } | undefined;
  removeView(accountId: string, kind: ViewKind): V | undefined;
  removeAccount(accountId: string): V[];
  lastUrl(accountId: string, kind: ViewKind): string | undefined;
  setLastUrl(accountId: string, kind: ViewKind, url: string): void;
}

interface Live<V> {
  view: V;
  webContentsId: number;
}

export function createViewRegistry<V>(): ViewRegistry<V> {
  const views = new Map<string, Map<ViewKind, Live<V>>>();
  const owners = new Map<number, { accountId: string; kind: ViewKind }>();
  const urls = new Map<string, Map<ViewKind, string>>();

  const viewsOf = (accountId: string): Map<ViewKind, Live<V>> => {
    let m = views.get(accountId);
    if (!m) views.set(accountId, (m = new Map()));
    return m;
  };

  return {
    set(accountId, kind, view, webContentsId) {
      viewsOf(accountId).set(kind, { view, webContentsId });
      owners.set(webContentsId, { accountId, kind });
    },
    get: (accountId, kind) => views.get(accountId)?.get(kind)?.view,
    kinds: (accountId) => [...(views.get(accountId)?.keys() ?? [])],
    accountFor: (webContentsId) => owners.get(webContentsId),
    removeView(accountId, kind) {
      const live = views.get(accountId)?.get(kind);
      if (!live) return undefined;
      views.get(accountId)!.delete(kind);
      owners.delete(live.webContentsId);
      return live.view;
    },
    removeAccount(accountId) {
      const live = [...(views.get(accountId)?.values() ?? [])];
      for (const l of live) owners.delete(l.webContentsId);
      views.delete(accountId);
      urls.delete(accountId);
      return live.map((l) => l.view);
    },
    lastUrl: (accountId, kind) => urls.get(accountId)?.get(kind),
    setLastUrl(accountId, kind, url) {
      let m = urls.get(accountId);
      if (!m) urls.set(accountId, (m = new Map()));
      m.set(kind, url);
    },
  };
}
