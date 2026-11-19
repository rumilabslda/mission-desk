import { useEffect, useState } from 'react';
import type { UiSnapshot } from '../../shared/ipc';
import { AccountAvatar, Badge } from './AccountAvatar';
import { SERVICE_LABEL } from './service-glyph';

/** The "Folders with panel" overlay page: one space's accounts, with names. */
export function SpacePanel(): React.JSX.Element | null {
  const [snap, setSnap] = useState<UiSnapshot | null>(null);

  useEffect(() => {
    void window.missiondesk.getSnapshot().then((s) => s && setSnap(s));
    const off = window.missiondesk.onSnapshot(setSnap);
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') window.missiondesk.closeSpacePanel();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      off();
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const space = snap?.spaces.find((s) => s.id === snap.panelSpaceId);
  if (!snap || !space) return null;
  const members = snap.accounts.filter((a) => a.spaceId === space.id);
  return (
    <div className="space-panel">
      <div className="space-panel-title">{space.name}</div>
      {members.map((a) => (
        <button
          key={a.id}
          className={`space-panel-row${a.id === snap.activeAccountId && !snap.calendarOpen ? ' active' : ''}`}
          onClick={() => window.missiondesk.selectAccount(a.id)}
          onContextMenu={(e) => {
            e.preventDefault();
            window.missiondesk.showAccountMenu(a.id);
          }}
          title={`${a.name} · ${SERVICE_LABEL[a.service]}`}
        >
          <span className="space-panel-icon">
            <AccountAvatar a={a} small />
          </span>
          <span className="space-panel-name">{a.name}</span>
          <span className="space-panel-service">{SERVICE_LABEL[a.service]}</span>
          <Badge unread={a.muted ? 0 : a.unread} />
        </button>
      ))}
    </div>
  );
}
