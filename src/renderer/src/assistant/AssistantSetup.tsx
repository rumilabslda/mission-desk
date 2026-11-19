import { useEffect, useState } from 'react';
import type { ClaudeStatus } from '../../../shared/assistant';
import type { UiSnapshot } from '../../../shared/ipc';

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
    const t = setTimeout(() => setSlow(true), 20_000);
    return () => clearTimeout(t);
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
      <p className="ast-intro">
        The assistant reads your accounts and answers questions, drafts replies and finds time for meetings. It runs on <strong>Claude Code</strong>, with your
        own Claude plan. Two steps to start:
      </p>

      <ol className="ast-steps">
        <li className={`ast-step${claudeReady ? ' done' : ' current'}`}>
          <div className="ast-step-head">
            <span className="ast-num">{claudeReady ? '✓' : '1'}</span>
            <strong>Connect Claude</strong>
            {claudeReady && status && 'version' in status && status.version && <span className="ast-note">Claude Code {status.version}</span>}
          </div>
          {status === null && <p className="ast-muted">Checking…</p>}

          {status?.state === 'not-installed' && (
            <div className="ast-body">
              <p>Claude Code isn’t on this Mac yet. Open Terminal, paste this and press Return:</p>
              <div className="ast-cmd">
                <code>{INSTALL}</code>
                <button
                  onClick={() => {
                    void navigator.clipboard.writeText(INSTALL).then(() => setCopied(true));
                  }}
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="ast-muted">It needs a Claude Pro or Max plan (or an Anthropic Console account).</p>
              <button className="ast-primary" onClick={() => onRecheck()}>
                I’ve installed it
              </button>
            </div>
          )}

          {status?.state === 'signed-out' && (
            <div className="ast-body">
              <p>Sign in with your Claude account. Your browser opens; come back here when it says you’re signed in.</p>
              {signingIn ? (
                <>
                  <p className="ast-wait">Waiting for you to finish in the browser…</p>
                  <button className="ast-link" onClick={() => window.missiondesk.assistantSignInCancel()}>
                    Cancel
                  </button>
                  {slow && (
                    <p className="ast-muted">
                      Taking long? Open Terminal and run <code>claude auth login</code>, then{' '}
                      <button className="ast-link" onClick={() => onRecheck()}>
                        check again
                      </button>
                      .
                    </p>
                  )}
                </>
              ) : (
                <button className="ast-primary" onClick={() => void signIn()}>
                  Sign in to Claude
                </button>
              )}
              {signInFailed && (
                <p className="ast-muted">
                  Not signed in yet. You can also open Terminal and run <code>claude auth login</code>, then{' '}
                  <button className="ast-link" onClick={() => onRecheck()}>
                    check again
                  </button>
                  .
                </p>
              )}
            </div>
          )}
        </li>

        <li className={`ast-step${!claudeReady ? ' later' : shared.length ? ' done' : ' current'}`}>
          <div className="ast-step-head">
            <span className="ast-num">{claudeReady && shared.length ? '✓' : '2'}</span>
            <strong>Choose what it can read</strong>
          </div>
          {claudeReady && (
            <div className="ast-body">
              <p>Only these accounts are visible to it. It never sends anything for you; to click or type it asks first.</p>
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
              <p className="ast-muted">You can change this later in Settings → Assistant.</p>
            </div>
          )}
        </li>
      </ol>
    </div>
  );
}
