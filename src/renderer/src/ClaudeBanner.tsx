import type { UiSnapshot } from '../../shared/ipc';

/** Shown above the page while Claude may act in the account on screen. Height: CLAUDE_BANNER_HEIGHT. */
export function ClaudeBanner({ snapshot }: { snapshot: UiSnapshot }): React.JSX.Element | null {
  const id = snapshot.calendarOpen || snapshot.settingsOpen || snapshot.todayOpen ? null : snapshot.activeAccountId;
  if (!id || !snapshot.claude.acting.includes(id)) return null;
  const name = snapshot.accounts.find((a) => a.id === id)?.name ?? 'this account';
  return (
    <div className="claude-banner" role="status">
      <span className="claude-dot" aria-hidden="true" />
      <span>
        Claude is working in <strong>{name}</strong>
      </span>
      <button onClick={() => window.missiondesk.stopClaude(id)}>Stop</button>
    </div>
  );
}
