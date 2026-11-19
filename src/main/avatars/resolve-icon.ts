import type { Account, AccountIcon } from '../../shared/types';

export interface IconContext {
  /** A cached image by key: an account id (fetched) or "custom:<id>" (chosen). */
  image(key: string): string | null;
  account(accountId: string): Account | undefined;
}

export function resolveIcon(a: Account, ctx: IconContext): AccountIcon {
  const image = (key: string): AccountIcon | null => {
    const src = ctx.image(key);
    return src ? { kind: 'image', src } : null;
  };
  switch (a.iconMode ?? 'auto') {
    case 'letter':
      return { kind: 'letter' };
    case 'service':
      return { kind: 'service' };
    case 'custom':
      return image(`custom:${a.id}`) ?? { kind: 'letter' };
    case 'account': {
      // Show whatever image the other account shows (fetched or chosen); no chains.
      const source = a.iconSourceAccountId ? ctx.account(a.iconSourceAccountId) : undefined;
      if (!source || source.iconMode === 'account') return { kind: 'letter' };
      const shown = resolveIcon(source, ctx);
      return shown.kind === 'image' ? shown : { kind: 'letter' };
    }
    case 'auto':
      // WhatsApp Web never shows your own photo, so its logo beats a bare letter.
      return image(a.id) ?? (a.service === 'whatsapp' ? { kind: 'service' } : { kind: 'letter' });
  }
}
