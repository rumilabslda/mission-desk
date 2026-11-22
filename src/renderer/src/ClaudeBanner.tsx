import type { UiSnapshot } from '../../shared/ipc';
import { rich, t } from './i18n';

/** Shown above the page while Claude may act in the account on screen. Height: CLAUDE_BANNER_HEIGHT. */
export function ClaudeBanner({ snapshot }: { snapshot: UiSnapshot }): React.JSX.Element | null {
  const id = snapshot.calendarOpen || snapshot.settingsOpen || snapshot.todayOpen ? null : snapshot.activeAccountId;
  if (!id || !snapshot.claude.acting.includes(id)) return null;
  const name = snapshot.accounts.find((a) => a.id === id)?.name ?? t('assistant.banner.thisAccount');
  return (
    <div className="claude-banner" role="status">
      <span className="claude-dot" aria-hidden="true" />
      <span>{rich('assistant.banner.working', { b: (s) => <strong>{s}</strong> }, { name })}</span>
      <button onClick={() => window.missiondesk.stopClaude(id)}>{t('assistant.stop')}</button>
    </div>
  );
}
