import { useEffect, useState } from 'react';
import type { ClaudeConnectInfo } from '../../shared/ipc';

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
          {copied ? 'Copied' : 'Copy'}
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
      <p className="hint">
        Let Claude Code or Claude Desktop on this Mac read and work in the accounts you choose. Nothing leaves your Mac
        except through Claude itself.
      </p>
      <label className="switch-row">
        <input type="checkbox" checked={!!info?.enabled} disabled={!info || busy} onChange={(e) => void toggle(e.target.checked)} />
        Allow Claude to connect
      </label>
      {info?.error && <p className="error">{info.error}</p>}
      {info?.enabled && (
        <>
          <CopyBlock label="Claude Code — run in Terminal" text={info.claudeCode} />
          <CopyBlock label="Claude Desktop — add to claude_desktop_config.json" text={info.desktopJson} />
          <p className="hint">
            Then give each account access (Settings → Accounts, or right-click it → <strong>Claude access</strong>): Read, or
            Read &amp; act. Claude must ask you before it clicks or types, and you can stop it any time with ⌘.
          </p>
        </>
      )}
    </>
  );
}

export function ConnectClaudeDialog({ onClose }: { onClose: () => void }): React.JSX.Element {
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog connect-dialog" onKeyDown={(e) => e.key === 'Escape' && onClose()} tabIndex={-1}>
        <h2>Connect Claude</h2>
        <ClaudeConnectPanel />
        <div className="actions">
          <button type="button" className="primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
