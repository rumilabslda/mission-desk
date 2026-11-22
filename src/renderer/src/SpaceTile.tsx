import type { AccountView } from '../../shared/ipc';
import { ssoGroups } from '../../shared/sso';
import type { Space, UnreadCount } from '../../shared/types';
import { AccountAvatar, Badge } from './AccountAvatar';
import { t } from './i18n';

interface Props {
  space: Space;
  members: AccountView[];
  /** The account on screen is inside this space. */
  active: boolean;
  panelOpen?: boolean;
  unread: UnreadCount;
  onClick(el: HTMLElement): void;
  onContextMenu(e: React.MouseEvent): void;
}

/** A closed space: up to four mini icons of its accounts and its unread total. */
export function SpaceTile({ space, members, active, panelOpen, unread, onClick, onContextMenu }: Props): React.JSX.Element {
  return (
    <button
      className={`space-tile${active ? ' active' : ''}${panelOpen ? ' open' : ''}`}
      title={t(ssoGroups(members, [space]).length ? 'app.spaceTile.titleSharesGoogle' : 'app.spaceTile.title', { name: space.name, count: members.length })}
      aria-label={space.name}
      onClick={(e) => onClick(e.currentTarget)}
      onContextMenu={onContextMenu}
    >
      <span className="space-grid">
        {members.slice(0, 4).map((m) => (
          <AccountAvatar key={m.id} a={m} small />
        ))}
      </span>
      <Badge unread={unread} />
    </button>
  );
}
