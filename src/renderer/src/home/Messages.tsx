import { useState } from 'react';
import type { AccountView, UiSnapshot } from '../../../shared/ipc';
import { ago, type MessageView } from '../../../shared/messages';
import { ServiceLogo } from '../service-glyph';

const SHOWN = 6;
const MAIL = new Set(['google', 'microsoft']);

const unreadOf = (a: AccountView): number => (typeof a.unread === 'number' ? a.unread : a.unread === 'dot' ? 1 : 0);

/** Home's "Messages": the latest chats and mails from every app, one line per conversation. */
export function Messages({ snapshot, now }: { snapshot: UiSnapshot; now: Date }): React.JSX.Element {
  const [all, setAll] = useState(false);
  const byId = new Map(snapshot.accounts.map((a) => [a.id, a]));
  const spaces = new Map(snapshot.spaces.map((s) => [s.id, s.name]));
  const list = snapshot.messages.filter((m) => byId.has(m.accountId));
  const shown = all ? list : list.slice(0, SHOWN);
  // Unread elsewhere (apps that didn't send a notification for it, or before Mission Desk opened).
  const withLines = new Set(list.map((m) => m.accountId));
  const others = snapshot.accounts.filter((a) => !a.muted && unreadOf(a) > 0 && !withLines.has(a.id));
  // Only for a mail account that sent nothing this session (its notifications are probably off).
  const sources = new Set(snapshot.messageSources);
  const quietMail = others.some((a) => MAIL.has(a.service) && !sources.has(a.id));
  const where = (a: AccountView): string => (a.spaceId && spaces.get(a.spaceId)) || a.name;

  return (
    <section className="td-card td-msgs" aria-label="Messages">
      <div className="td-msgs-head">
        <h2>Messages</h2>
        {list.length > 0 && (
          <button className="td-link" onClick={() => window.missiondesk.clearMessages()}>
            Clear all
          </button>
        )}
      </div>

      {list.length === 0 ? (
        <p className="td-muted">No new messages. Chats and emails show up here as they arrive.</p>
      ) : (
        <ul className="td-msg-list">
          {shown.map((m) => (
            <Line key={m.key} m={m} a={byId.get(m.accountId)!} where={where(byId.get(m.accountId)!)} now={now.getTime()} />
          ))}
        </ul>
      )}
      {list.length > SHOWN && (
        <button className="td-link td-msg-more" onClick={() => setAll((v) => !v)}>
          {all ? 'Show fewer' : `Show all ${list.length}`}
        </button>
      )}

      {others.length > 0 && (
        <div className="td-msg-others">
          <span className="td-msg-others-label">{list.length ? 'Also unread' : 'Unread'}</span>
          {others.map((a) => (
            <button
              key={a.id}
              className="td-msg-chip"
              title={`${a.name}: ${unreadOf(a)} unread`}
              aria-label={`${a.name}${where(a) === a.name ? '' : `, ${where(a)}`}: ${typeof a.unread === 'number' ? `${a.unread} unread` : 'unread'}`}
              onClick={() => window.missiondesk.selectAccount(a.id)}>
              <ServiceLogo service={a.service} className="td-msg-chip-logo" />
              {where(a) === a.name ? a.name : `${a.name}, ${where(a)}`}
              {typeof a.unread === 'number' && <span className="td-count">{a.unread}</span>}
            </button>
          ))}
        </div>
      )}
      {quietMail && <p className="td-msg-hint">To see each email here, turn on desktop notifications in Gmail or Outlook settings.</p>}
    </section>
  );
}

function Line({ m, a, where, now }: { m: MessageView; a: AccountView; where: string; now: number }): React.JSX.Element {
  return (
    <li className="td-msg">
      <button className="td-msg-open" onClick={() => window.missiondesk.openMessage(m.key)} title={`Open in ${a.name}`}>
        <span className="td-msg-app" style={{ boxShadow: `inset 0 0 0 1.5px ${a.color}` }}>
          <ServiceLogo service={a.service} />
        </span>
        <span className="td-msg-text">
          <span className="td-msg-top">
            <strong>{m.title || a.name}</strong>
            {m.count > 1 && <span className="td-msg-n">{m.count}</span>}
            <span className="td-msg-where">{where}</span>
            <time className="td-msg-time" dateTime={new Date(m.at).toISOString()}>
              {ago(m.at, now)}
            </time>
          </span>
          {m.body && <span className="td-msg-body">{m.body}</span>}
        </span>
      </button>
      <button className="td-msg-x" aria-label={`Dismiss ${m.title || a.name}`} title="Dismiss" onClick={() => window.missiondesk.dismissMessage(m.key)}>
        ×
      </button>
    </li>
  );
}
