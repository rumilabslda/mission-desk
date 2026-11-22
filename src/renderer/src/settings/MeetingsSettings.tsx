import { useEffect, useState } from 'react';
import type { UiSnapshot } from '../../../shared/ipc';
import { DEFAULT_ACTIONS, type EngineId, type EngineStatus, MEETING_ACTIONS, MEETING_LOCALES, type MeetingAction, meetingLocale, type MeetingMode, MAX_NOTICE, type SpaceMeetingSettings } from '../../../shared/meeting';
import { intlLocale, type MessageKey, t } from '../i18n';

/** Meeting transcription is a macOS feature. */
export const meetingsAvailable = (platform: string): boolean => platform === 'darwin';

const MODES: [MeetingMode, MessageKey][] = [
  ['always', 'meetings.settings.always'],
  ['ask', 'meetings.settings.ask'],
  ['off', 'meetings.settings.off'],
];
const ENGINE: Record<EngineId, { name: MessageKey; desc: MessageKey }> = {
  apple: { name: 'meetings.engine.apple', desc: 'meetings.settings.appleDesc' },
  whisper: { name: 'meetings.engine.whisper', desc: 'meetings.settings.whisperDesc' },
  parakeet: { name: 'meetings.engine.parakeet', desc: 'meetings.settings.parakeetDesc' },
};
const ACTION: Record<MeetingAction, MessageKey> = {
  summary: 'meetings.action.summary',
  myTodos: 'meetings.action.myTodos',
  waitingOn: 'meetings.action.waitingOn',
  email: 'meetings.action.email',
  memory: 'meetings.action.memory',
  event: 'meetings.action.event',
};
const languageName = (l: string): string => {
  try {
    return new Intl.DisplayNames([intlLocale()], { type: 'language' }).of(l) ?? l;
  } catch {
    return l;
  }
};
const gb = (bytes: number): string => (bytes / 1e9).toLocaleString(intlLocale(), { maximumFractionDigits: 1 });

/** Settings → Meetings: each space's mode, language and ticks; the engines; the notice; retention. */
export function MeetingsSettings({ snap }: { snap: UiSnapshot }): React.JSX.Element {
  const md = window.missiondesk;
  const m = snap.meetings;
  const [apple, setApple] = useState<{ supported: string[]; installed: string[] } | null>(null);
  const [notice, setNotice] = useState(m.settings.notice ?? '');
  useEffect(() => {
    void md.meetingCapabilities().then((c) => setApple(c?.apple ?? null));
  }, [m.localeInstall]);

  const scopes = [...snap.spaces.map((s) => ({ key: `space:${s.id}`, name: s.name })), { key: 'nospace', name: t('common.noSpace') }];
  const settingsOf = (key: string): SpaceMeetingSettings => m.spaces[key] ?? { mode: 'ask' };
  const set = (key: string, patch: Partial<SpaceMeetingSettings>): void => md.setSpaceMeetings(key, { ...settingsOf(key), ...patch });
  const chosen = m.settings.engine ?? 'apple';
  /** What a space without a language of its own uses: the interface language, in the Mac's region. */
  const defaultLanguage = meetingLocale(md.locale?.locale ?? 'en', md.locale?.format ?? 'en');
  const wantedLanguages = [...new Set(scopes.filter((s) => settingsOf(s.key).mode !== 'off').map((s) => settingsOf(s.key).language ?? defaultLanguage))];

  const engineRow = (e: EngineStatus): React.JSX.Element => (
    <div key={e.id} className="set-card mt-engine" data-engine={e.id}>
      <div className="mt-engine-head">
        <strong>{t(ENGINE[e.id].name)}</strong>
        {e.id !== 'apple' && <span className="set-muted">{t('meetings.settings.size', { size: gb(e.bytes) })}</span>}
        {chosen === e.id && <span className="sk-badge">{t('meetings.settings.inUse')}</span>}
      </div>
      <p className="set-muted">{e.reason ?? t(ENGINE[e.id].desc)}</p>
      <div className="mt-engine-actions">
        {chosen !== e.id && (
          <button type="button" className="set-action" disabled={e.state !== 'ready'} onClick={() => md.setMeetingGlobal({ engine: e.id })}>
            {t('meetings.settings.use')}
          </button>
        )}
        {e.id !== 'apple' && e.state === 'notDownloaded' && (
          <button type="button" className="set-action" onClick={() => md.modelDownload(e.id as 'whisper' | 'parakeet')}>
            {t('meetings.settings.download')}
          </button>
        )}
        {e.id !== 'apple' && e.state === 'downloading' && (
          <>
            <span className="set-muted">{t('meetings.settings.downloading', { percent: `${Math.round((e.progress ?? 0) * 100)}%` })}</span>
            <button type="button" className="set-link" onClick={() => md.modelCancel(e.id as 'whisper' | 'parakeet')}>
              {t('meetings.settings.cancel')}
            </button>
          </>
        )}
        {e.id !== 'apple' && e.state === 'ready' && (
          <button type="button" className="set-link danger" onClick={() => md.modelDelete(e.id as 'whisper' | 'parakeet')}>
            {t('meetings.settings.delete')}
          </button>
        )}
      </div>
      {e.id === 'apple' && e.state === 'ready' && apple && wantedLanguages.length > 0 && (
        <div className="mt-engine-langs">
          <span className="set-muted">{t('meetings.settings.appleLanguages')}</span>
          {wantedLanguages.map((l) =>
            apple.installed.includes(l) ? (
              <span key={l} className="mt-lang">
                {t('meetings.settings.languageReady', { language: languageName(l) })}{' '}
                <button type="button" className="set-link" onClick={() => md.appleLocaleRemove(l)}>
                  {t('meetings.settings.languageRemove')}
                </button>
              </span>
            ) : apple.supported.includes(l) ? (
              m.localeInstall?.locale === l ? (
                <span key={l} className="set-muted">
                  {t('meetings.bar.downloading', { language: languageName(l), percent: `${Math.round(m.localeInstall.fraction * 100)}%` })}
                </span>
              ) : (
                <button key={l} type="button" className="set-action" onClick={() => md.meetingInstallLocale(l)}>
                  {t('meetings.settings.languageDownload', { language: languageName(l) })}
                </button>
              )
            ) : null,
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      <h2>{t('meetings.title')}</h2>
      <p className="set-muted">{t('meetings.settings.intro')}</p>

      <h3>{t('meetings.settings.spaces')}</h3>
      {scopes.map((s) => {
        const st = settingsOf(s.key);
        const ticks = st.actions ?? DEFAULT_ACTIONS;
        return (
          <div key={s.key} className="set-card mt-space" data-scope={s.key}>
            <div className="mt-space-head">
              <strong>{s.name}</strong>
              <div className="mt-modes" role="radiogroup">
                {MODES.map(([mode, label]) => (
                  <button key={mode} type="button" role="radio" aria-checked={st.mode === mode} className={`mt-mode${st.mode === mode ? ' on' : ''}`} onClick={() => set(s.key, { mode })}>
                    {t(label)}
                  </button>
                ))}
              </div>
            </div>
            {st.mode !== 'off' && (
              <>
                <label className="mt-inline">
                  {t('meetings.settings.language')}
                  <select className="set-select" value={st.language ?? ''} onChange={(e) => set(s.key, { language: e.target.value || undefined })}>
                    <option value="">{languageName(defaultLanguage)}</option>
                    {MEETING_LOCALES.map((l) => (
                      <option key={l} value={l}>
                        {languageName(l)}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="mt-inline">
                  <span>{t('meetings.settings.actions')}</span>
                  <div className="sk-scopes">
                    {MEETING_ACTIONS.map((a) => (
                      <button
                        key={a}
                        type="button"
                        className={`sk-scope${ticks.includes(a) ? ' on' : ''}`}
                        aria-pressed={ticks.includes(a)}
                        onClick={() => set(s.key, { actions: ticks.includes(a) ? ticks.filter((x) => x !== a) : MEETING_ACTIONS.filter((x) => x === a || ticks.includes(x)) })}
                      >
                        {t(ACTION[a])}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })}

      <h3>{t('meetings.settings.engines')}</h3>
      <p className="set-muted">{t('meetings.settings.enginesHint')}</p>
      {m.engines.map(engineRow)}

      <h3>{t('meetings.settings.notice')}</h3>
      <input
        className="set-input"
        maxLength={MAX_NOTICE}
        value={notice}
        placeholder={t('meetings.notice.default')}
        onChange={(e) => setNotice(e.target.value.replace(/[\r\n]/g, ' '))}
        onBlur={() => notice !== (m.settings.notice ?? '') && md.setMeetingGlobal({ notice })}
      />
      <p className="set-muted">{t('meetings.settings.noticeHint')}</p>

      <h3>{t('meetings.settings.retention')}</h3>
      <select className="set-select" data-retention value={String(m.settings.retentionDays ?? 0)} onChange={(e) => md.setMeetingGlobal({ retentionDays: Number(e.target.value) as 0 | 30 | 90 })}>
        <option value="0">{t('meetings.settings.never')}</option>
        <option value="30">{t('meetings.settings.days', { count: 30 })}</option>
        <option value="90">{t('meetings.settings.days', { count: 90 })}</option>
      </select>
      <p className="set-muted">{t('meetings.settings.retentionHint')}</p>
    </>
  );
}
