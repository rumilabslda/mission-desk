import { useEffect, useRef } from 'react';
import type { DialAction, DialRequest } from '../../shared/quick';
import { PlusIcon } from './assistant/AssistantWindow';

const isMac = navigator.platform.toLowerCase().includes('mac');

const ITEMS: Record<DialAction, { label: string; shortcut: string; icon: React.JSX.Element }> = {
  meet: {
    label: 'New meeting link',
    shortcut: isMac ? '⌃⌘M' : 'Ctrl+Alt+M',
    icon: (
      <>
        <rect x="3" y="6" width="12" height="12" rx="2.5" />
        <path d="m15 10.5 5-3v9l-5-3" />
      </>
    ),
  },
  event: {
    label: 'New event',
    shortcut: isMac ? '⌃⌘E' : 'Ctrl+Alt+E',
    icon: (
      <>
        <rect x="4" y="5" width="16" height="15" rx="2.5" />
        <path d="M4 10h16M9 3v4M15 3v4M12 13v4M10 15h4" />
      </>
    ),
  },
  todo: {
    label: 'New to-do',
    shortcut: isMac ? '⌃⌘T' : 'Ctrl+Alt+D',
    icon: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="4" />
        <path d="m8.5 12 2.5 2.5 4.5-5" />
      </>
    ),
  },
  assistant: {
    label: 'Ask the assistant',
    shortcut: isMac ? '⌘J' : 'Ctrl+J',
    icon: <path d="M12 3.5 13.9 9a2 2 0 0 0 1.2 1.2l5.4 1.8-5.4 1.8a2 2 0 0 0-1.2 1.2L12 20.5 10.1 15a2 2 0 0 0-1.2-1.2L3.5 12l5.4-1.8A2 2 0 0 0 10.1 9z" />,
  },
};

/** The button itself sits 4 px inside its view (room for its shadow). */
const INSET = 4;
const BUTTON = 44;
/** Room the list needs above the button before it opens below it instead. */
const ROW = 50;

/**
 * The floating button opened as a menu: the page dims and the quick actions fan out from it,
 * the assistant nearest. A click outside, Esc or the × closes it; ↑ ↓ and Enter, or 1–4, pick.
 */
export function QuickDial({ request }: { request: DialRequest }): React.JSX.Element {
  const { fab, side, actions } = request;
  const btn = { x: fab.x + INSET, y: fab.y + INSET };
  const up = btn.y - 12 >= (actions.length + (request.label ? 0.6 : 0)) * ROW;
  // Nearest the button last when going up, first when going down.
  const order = up ? actions : [...actions].reverse();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const close = (): void => window.missiondesk.quickClose();
  const pick = (a: DialAction): void => window.missiondesk.quickPick(a);

  useEffect(() => {
    refs.current[up ? order.length - 1 : 0]?.focus(); // the assistant, next to the button
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onKey(e: React.KeyboardEvent): void {
    if (e.key === 'Escape') return close();
    const i = refs.current.findIndex((r) => r === document.activeElement);
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const n = order.length;
      refs.current[(i + (e.key === 'ArrowUp' ? -1 : 1) + n) % n]?.focus();
      return;
    }
    // 1 is the action nearest the button.
    const d = Number(e.key);
    if (Number.isInteger(d) && d >= 1 && d <= order.length) {
      const nearestFirst = up ? [...order].reverse() : order;
      pick(nearestFirst[d - 1]);
    }
  }

  const listStyle: React.CSSProperties = {
    [side === 'right' ? 'right' : 'left']: side === 'right' ? `calc(100% - ${btn.x + BUTTON}px)` : btn.x,
    ...(up ? { bottom: `calc(100% - ${btn.y - 14}px)` } : { top: btn.y + BUTTON + 14 }),
    alignItems: side === 'right' ? 'flex-end' : 'flex-start',
  };

  return (
    <div className="qd" onMouseDown={(e) => e.target === e.currentTarget && close()} onKeyDown={onKey}>
      <div className={`qd-list ${up ? 'up' : 'down'}`} style={listStyle} role="menu" aria-label="Quick actions">
        {request.label && <div className={`qd-for${side === 'left' ? ' left' : ''}`}>For {request.label}</div>}
        {order.map((a, i) => {
          const it = ITEMS[a];
          // The animation starts from the button outwards.
          const fromButton = up ? order.length - 1 - i : i;
          return (
            <button
              key={a}
              ref={(el) => {
                refs.current[i] = el;
              }}
              role="menuitem"
              className={`qd-item${side === 'left' ? ' left' : ''}${a === 'assistant' ? ' ai' : ''}`}
              style={{ animationDelay: `${fromButton * 30}ms` }}
              title={it.shortcut}
              onClick={() => pick(a)}
            >
              <span className="qd-label">{it.label}</span>
              <span className="qd-icon">
                <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {it.icon}
                </svg>
              </span>
            </button>
          );
        })}
      </div>
      {/* Drawn over the floating button: its + turns into ×. */}
      <button className="qd-close" style={{ left: btn.x, top: btn.y }} aria-label="Close" onClick={close}>
        <PlusIcon />
      </button>
    </div>
  );
}
