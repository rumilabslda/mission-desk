import { useEffect, useState } from 'react';
import type { ClaudeStatus } from '../../../shared/assistant';
import type { UiSnapshot } from '../../../shared/ipc';
import { rich, t } from '../i18n';

const INSTALL = 'curl -fsSL https://claude.ai/install.sh | bash';

/**
 * Before any chat: the steps the assistant needs, one at a time.
 * 1. Claude Code installed and signed in (the assistant runs on it).
 * 2. The accounts it may read.
 */
export function AssistantSetup({
  status,
  snapshot,
  onRecheck,
}: {
  status: ClaudeStatus | null;
  snapshot: UiSnapshot;
  onRecheck(next?: ClaudeStatus): void;
}): React.JSX.Element {
  const [signingIn, setSigningIn] = useState(false);
  const [copied, setCopied] = useState(false);
  const [signInFailed, setSignInFailed] = useState(false);
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!signingIn) return setSlow(false);
    const timer = setTimeout(() => setSlow(true), 20_000);
    return () => clearTimeout(timer);
  }, [signingIn]);
  const claudeReady = status?.state === 'ready';
  const shared = snapshot.accounts.filter((x) => (x.claudeAccess ?? 'off') !== 'off');

  async function signIn(): Promise<void> {
    setSigningIn(true);
    setSignInFailed(false);
    const next = await window.missiondesk.assistantSignIn();
    setSigningIn(false);
    if (next.state !== 'ready') setSignInFailed(true); // cancelled, or the browser tab was closed: Sign in shows again
    onRecheck(next);
  }

  return (
    <div className="ast">
      <p className="ast-intro">{rich('assistant.setup.intro', { b: (s) => <strong>{s}</strong> })}</p>

      <ol className="ast-steps">
        <li className={`ast-step${claudeReady ? ' done' : ' current'}`}>
          <div className="ast-step-head">
            <span className="ast-num">{claudeReady ? '✓' : '1'}</span>
            <strong>{t('assistant.setup.connectClaude')}</strong>
            {claudeReady && status && 'version' in status && status.version && <span className="ast-note">Claude Code {status.version}</span>}
          </div>
          {status === null && <p className="ast-muted">{t('assistant.setup.checking')}</p>}

          {status?.state === 'not-installed' && (
            <div className="ast-body">
              <p>{t('assistant.setup.notInstalled')}</p>
              <div className="ast-cmd">
                <code>{INSTALL}</code>
                <button
                  onClick={() => {
                    void navigator.clipboard.writeText(INSTALL).then(() => setCopied(true));
                  }}
                >
                  {copied ? t('assistant.copied') : t('assistant.copy')}
                </button>
              </div>
              <p className="ast-muted">{t('assistant.setup.needsPlan')}</p>
              <button className="ast-primary" onClick={() => onRecheck()}>
                {t('assistant.setup.installed')}
              </button>
            </div>
          )}

          {status?.state === 'signed-out' && (
            <div className="ast-body">
              <p>{t('assistant.setup.signInIntro')}</p>
              {signingIn ? (
                <>
                  <p className="ast-wait">{t('assistant.setup.waiting')}</p>
                  <button className="ast-link" onClick={() => window.missiondesk.assistantSignInCancel()}>
                    {t('common.cancel')}
                  </button>
                  {slow && (
                    <p className="ast-muted">
                      {rich('assistant.setup.slow', {
                        code: (s) => <code>{s}</code>,
                        link: (s) => (
                          <button className="ast-link" onClick={() => onRecheck()}>
                            {s}
                          </button>
                        ),
                      })}
                    </p>
                  )}
                </>
              ) : (
                <button className="ast-primary" onClick={() => void signIn()}>
                  {t('assistant.setup.signIn')}
                </button>
              )}
              {signInFailed && (
                <p className="ast-muted">
                  {rich('assistant.setup.signInFailed', {
                    code: (s) => <code>{s}</code>,
                    link: (s) => (
                      <button className="ast-link" onClick={() => onRecheck()}>
                        {s}
                      </button>
                    ),
                  })}
                </p>
              )}
            </div>
          )}
        </li>

        <li className={`ast-step${!claudeReady ? ' later' : shared.length ? ' done' : ' current'}`}>
          <div className="ast-step-head">
            <span className="ast-num">{claudeReady && shared.length ? '✓' : '2'}</span>
            <strong>{t('assistant.setup.chooseAccounts')}</strong>
          </div>
          {claudeReady && (
            <div className="ast-body">
              <p>{t('assistant.setup.accountsIntro')}</p>
              <ul className="ast-accounts">
                {snapshot.accounts.map((x) => (
                  <li key={x.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={(x.claudeAccess ?? 'off') !== 'off'}
                        onChange={(e) => window.missiondesk.updateAccount(x.id, { claudeAccess: e.target.checked ? 'read' : 'off' })}
                      />
                      <span>{x.name}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <p className="ast-muted">{t('assistant.setup.changeLater')}</p>
            </div>
          )}
        </li>
      </ol>
    </div>
  );
}
