import type { AccountView } from '../../shared/ipc';
import { LOGOS } from './logos';

export function Badge({ unread }: { unread: AccountView['unread'] }): React.JSX.Element | null {
  if (unread === 'dot') return <span className="badge dot" aria-label="Unread messages" />;
  if (unread <= 0) return null;
  return <span className="badge">{unread > 99 ? '99+' : unread}</span>;
}

/** The account's image, service logo, or letter on its colour. */
export function AccountAvatar({ a, small }: { a: AccountView; small?: boolean }): React.JSX.Element {
  const serviceAsIcon = a.icon.kind === 'service';
  const image = a.icon.kind === 'image' ? a.icon.src : serviceAsIcon ? LOGOS[a.service] : null;
  const cls = small ? 'mini' : 'avatar';
  return image ? (
    <span className={`${cls} has-image${serviceAsIcon ? ' service-icon' : ''}`}>
      <img src={image} alt="" draggable={false} />
    </span>
  ) : (
    <span className={cls} style={{ background: a.color }}>
      {a.name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
