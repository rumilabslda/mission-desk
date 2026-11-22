import { useEffect, useState } from 'react';
import type { AccountView, UiSnapshot } from '../../shared/ipc';
import { type DragRef, type DropZone, dropZoneFor, sidebarItems, spaceUnread } from '../../shared/spaces';
import type { Space } from '../../shared/types';
import { AccountAvatar, Badge } from './AccountAvatar';
import { LOGOS } from './logos';
import { SERVICE_LABEL, ServiceLogo } from './service-glyph';
import { SpaceTile } from './SpaceTile';
import { t } from './i18n';

interface Over {
  key: string;
  zone: DropZone;
}
const keyOf = (r: DragRef): string => `${r.kind}:${r.id}`;

/** The drop zone under the pointer (same rule for the indicator and the drop). */
function zoneAt(e: React.DragEvent, drag: DragRef, target: DragRef): DropZone {
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
  return dropZoneFor(drag.kind, target.kind, (e.clientY - r.top) / Math.max(1, r.height));
}

interface Props {
  snapshot: UiSnapshot;
  onAdd(): void;
  /** A drop asked to create a space from these accounts: ask for its name. */
  onCreateSpace(accountIds: string[]): void;
}

export function Sidebar({ snapshot, onAdd, onCreateSpace }: Props): React.JSX.Element {
  const updateReady = snapshot.update.state.kind === 'ready' ? snapshot.update.state.version : null;
  const [dragging, setDragging] = useState<DragRef | null>(null);
  const [over, setOver] = useState<Over | null>(null);
  // A tick on the ⚡ button for a moment after a quick action finishes (in-app feedback).
  const [done, setDone] = useState<string | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const off = window.missiondesk.onActionDone((message) => {
      setDone(message);
      clearTimeout(timer);
      timer = setTimeout(() => setDone(null), 2500);
    });
    return () => {
      off();
      clearTimeout(timer);
    };
  }, []);
  const style = snapshot.sidebarStyle;
  const hasGoogle = snapshot.accounts.some((a) => a.service === 'google');
  const activeId = snapshot.calendarOpen || snapshot.settingsOpen || snapshot.todayOpen ? null : snapshot.activeAccountId;
  const items = sidebarItems(snapshot.accounts, snapshot.spaces);
  const indexOf = new Map(snapshot.accounts.map((a, i) => [a.id, i]));

  const endDrag = (): void => {
    setDragging(null);
    setOver(null);
  };

  /** Drag-and-drop props for anything that can be dragged and dropped on. */
  function dnd(self: DragRef) {
    const k = keyOf(self);
    return {
      draggable: true,
      onDragStart: (e: React.DragEvent) => {
        e.stopPropagation();
        e.dataTransfer.effectAllowed = 'move';
        setDragging(self);
      },
      onDragOver: (e: React.DragEvent) => {
        if (!dragging || keyOf(dragging) === k) return;
        e.preventDefault();
        e.stopPropagation();
        const zone = zoneAt(e, dragging, self);
        if (over?.key !== k || over.zone !== zone) setOver({ key: k, zone });
      },
      onDragLeave: (e: React.DragEvent) => {
        // Moving between this item's own inner elements is not leaving it.
        if (e.relatedTarget instanceof Node && (e.currentTarget as HTMLElement).contains(e.relatedTarget)) return;
        setOver((o) => (o?.key === k ? null : o));
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const drag = dragging;
        endDrag();
        if (!drag || keyOf(drag) === k) return;
        const zone = zoneAt(e, drag, self);
        void window.missiondesk.dropInSidebar(drag, self, zone).then((r) => {
          if (r?.create) onCreateSpace(r.create);
        });
      },
      onDragEnd: endDrag,
    };
  }

  const dropClass = (k: string): string => (over?.key === k && dragging ? ` drop-${over.zone}` : '');

  function accountButton(a: AccountView): React.JSX.Element {
    const i = indexOf.get(a.id) ?? 0;
    const serviceAsIcon = a.icon.kind === 'service';
    const ref: DragRef = { kind: 'account', id: a.id };
    const k = keyOf(ref);
    return (
      <li key={a.id} {...dnd(ref)} className={dropClass(k)}>
        <button
          className={`account${a.id === activeId ? ' active' : ''}${a.hibernated ? ' sleeping' : ''}${dragging && keyOf(dragging) === k ? ' dragging' : ''}${snapshot.claude.acting.includes(a.id) ? ' claude-acting' : ''}`}
          title={`${a.name} · ${SERVICE_LABEL[a.service]}${i < 9 ? `  (⌘${i + 1})` : ''}`}
          onClick={() => window.missiondesk.selectAccount(a.id)}
          onContextMenu={(e) => {
            e.preventDefault();
            window.missiondesk.showAccountMenu(a.id);
          }}
        >
          <AccountAvatar a={a} />
          {!serviceAsIcon && (
            <span className="service">
              <ServiceLogo service={a.service} />
            </span>
          )}
          {a.muted && <span className="muted" aria-label={t('app.sidebar.muted')}>🔕</span>}
          <Badge unread={a.unread} />
        </button>
      </li>
    );
  }

  function space(sp: Space, members: AccountView[]): React.JSX.Element {
    const ref: DragRef = { kind: 'space', id: sp.id };
    const k = keyOf(ref);
    const containsActive = members.some((m) => m.id === activeId);
    const menu = (e: React.MouseEvent): void => {
      e.preventDefault();
      window.missiondesk.showSpaceMenu(sp.id);
    };
    const expanded = style === 'sections' || (style === 'folders' && (!!sp.open || !!sp.alwaysOpen || containsActive));

    if (!expanded) {
      return (
        <li key={sp.id} {...dnd(ref)} className={dropClass(k)}>
          <SpaceTile
            space={sp}
            members={members}
            active={containsActive}
            panelOpen={snapshot.panelSpaceId === sp.id}
            unread={spaceUnread(members)}
            onClick={(el) => {
              if (style === 'panel') {
                if (snapshot.panelSpaceId === sp.id) window.missiondesk.closeSpacePanel();
                else window.missiondesk.openSpacePanel(sp.id, el.getBoundingClientRect().top);
              } else window.missiondesk.setSpaceOpen(sp.id, true);
            }}
            onContextMenu={menu}
          />
        </li>
      );
    }
    const canClose = style === 'folders' && !sp.alwaysOpen && !containsActive;
    return (
      <li key={sp.id} className="space-li">
        <div className={`space-box${dropClass(k)}`}>
          <button
            className={`space-caption${canClose ? ' can-close' : ''}`}
            title={canClose ? t('app.sidebar.spaceClickToClose', { name: sp.name }) : sp.name}
            {...dnd(ref)}
            onClick={() =>
              canClose && window.missiondesk.setSpaceOpen(sp.id, false)
            }
            onContextMenu={menu}
          >
            {sp.name}
          </button>
          <ul className="space-members">{members.map(accountButton)}</ul>
        </div>
      </li>
    );
  }

  return (
    <nav className="sidebar">
      <button
        className={`today-btn${snapshot.todayOpen ? ' active' : ''}`}
        title={`${t('app.sidebar.home')}  (⌘T)`}
        aria-label={t('app.sidebar.home')}
        onClick={() => window.missiondesk.openToday()}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3.5 10.5 12 3.5l8.5 7" />
          <path d="M5.5 9v10.5a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1V9" />
        </svg>
      </button>
      {hasGoogle && (
        <button
          className={`all-calendars${snapshot.calendarOpen ? ' active' : ''}`}
          title={`${t('app.sidebar.allCalendars')}  (⌘0)`}
          aria-label={t('app.sidebar.allCalendars')}
          onClick={() => window.missiondesk.openCalendar()}
        >
          <img src={LOGOS.calendar} alt="" draggable={false} />
        </button>
      )}
      <ul className="accounts">{items.map((it) => (it.kind === 'account' ? accountButton(it.account) : space(it.space, it.accounts)))}</ul>
      {/* The floating button holds the quick actions; this one stands in when it's hidden. */}
      {snapshot.accounts.length > 0 && !snapshot.assistant.button && (
        <button
          className={`actions-btn${done ? ' copied' : ''}`}
          title={done ?? t('app.sidebar.quickActionsTitle')}
          aria-label={done ?? t('app.sidebar.quickActions')}
          onClick={() => window.missiondesk.showActionsMenu()}
        >
          {done ? (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12.5 10 17.5 19 7" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M13 3 4.5 13.5H12l-1 7.5 8.5-10.5H12z" />
            </svg>
          )}
        </button>
      )}
      <button
        className={`settings-btn${snapshot.settingsOpen ? ' active' : ''}${updateReady ? ' has-update' : ''}`}
        title={updateReady ? t('app.sidebar.updateReadyTitle', { version: updateReady }) : `${t('app.sidebar.settings')}  (⌘,)`}
        aria-label={updateReady ? t('app.sidebar.updateReadyLabel', { version: updateReady }) : t('app.sidebar.settings')}
        onClick={() =>
          snapshot.settingsOpen ? window.missiondesk.closeSettings() : window.missiondesk.openSettings(updateReady ? 'about' : undefined)
        }
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
      </button>
      <button className="add" title={t('app.sidebar.add')} onClick={() => (snapshot.accounts.length ? window.missiondesk.showAddMenu() : onAdd())}>
        +
      </button>
    </nav>
  );
}
