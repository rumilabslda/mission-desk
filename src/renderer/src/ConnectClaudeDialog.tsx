import { useEffect, useState } from 'react';
import type { ClaudeConnectInfo } from '../../shared/ipc';
import { rich, t } from './i18n';

function CopyBlock({ label, text }: { label: string; text: string }): React.JSX.Element {
  const [copied, setCopied] = useState(false);
  return (
    <div className="copy-block">
      <div className="copy-head">
        <span>{label}</span>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(text).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            });
          }}
        >
          {copied ? t('assistant.copied') : t('assistant.copy')}
        </button>
      </div>
      <pre>{text}</pre>
    </div>
  );
}

/** The "Allow Claude to connect" switch and the connect commands (dialog and Settings). */
export function ClaudeConnectPanel(): React.JSX.Element {
  const [info, setInfo] = useState<ClaudeConnectInfo | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void window.missiondesk.getClaudeConnectInfo().then(setInfo);
  }, []);

  async function toggle(on: boolean): Promise<void> {
    setBusy(true);
    setInfo(await window.missiondesk.setClaudeEnabled(on));
    setBusy(false);
  }

  return (
    <>
      <p className="hint">{t('assistant.connect.hint')}</p>
      <label className="switch-row">
        <input type="checkbox" checked={!!info?.enabled} disabled={!info || busy} onChange={(e) => void toggle(e.target.checked)} />
        {t('assistant.connect.allow')}
      </label>
      {info?.error && <p className="error">{info.error}</p>}
      {info?.enabled && (
        <>
          <CopyBlock label={t('assistant.connect.claudeCode')} text={info.claudeCode} />
          <CopyBlock label={t('assistant.connect.claudeDesktop')} text={info.desktopJson} />
          <p className="hint">{rich('assistant.connect.accessHint', { b: (s) => <strong>{s}</strong> })}</p>
        </>
      )}
    </>
  );
}

export function ConnectClaudeDialog({ onClose }: { onClose: () => void }): React.JSX.Element {
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog connect-dialog" onKeyDown={(e) => e.key === 'Escape' && onClose()} tabIndex={-1}>
        <h2>{t('assistant.connect.title')}</h2>
        <ClaudeConnectPanel />
        <div className="actions">
          <button type="button" className="primary" onClick={onClose}>
            {t('common.done')}
          </button>
        </div>
      </div>
    </div>
  );
}
