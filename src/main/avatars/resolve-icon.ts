import type { Account, AccountIcon } from '../../shared/types';
import { readsPhoto } from './sources';

export interface IconContext {
  /** A cached image by key: an account id (fetched) or "custom:<id>" (chosen). */
  image(key: string): string | null;
  account(accountId: string): Account | undefined;
  accounts(): Account[];
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
    case 'auto': {
      const fetched = image(a.id);
      if (fetched) return fetched;
      // WhatsApp Web never shows your own photo, so its logo beats a bare letter.
      if (a.service === 'whatsapp') return { kind: 'service' };
      // No photo is ever read from it (LinkedIn, Telegram…): its logo, unless another app of the same
      // service needs the letter and colour to tell them apart. A website has no logo of its own.
      const alone = ctx.accounts().filter((o) => o.service === a.service).length <= 1;
      if (a.service !== 'custom' && !readsPhoto(a.service) && alone) return { kind: 'service' };
      return { kind: 'letter' };
    }
  }
}
