import { useState } from 'react';
import { ACCOUNT_COLORS, type AccountView } from '../../shared/ipc';
import type { ServiceId, Space } from '../../shared/types';
import { SERVICE_LABEL, ServiceLogo } from './service-glyph';
import { cleanSiteUrl } from '../../shared/custom-site';
import { t } from './i18n';

export type DialogState = { mode: 'add' } | { mode: 'edit'; accountId: string };

const SERVICES: ServiceId[] = ['google', 'microsoft', 'slack', 'whatsapp', 'telegram', 'linkedin', 'discord', 'zoom', 'notion', 'proton', 'icloud', 'fastmail', 'custom'];
const HINT: Record<ServiceId, string> = {
  google: t('app.account.hint.google'),
  slack: t('app.account.hint.slack'),
  whatsapp: t('app.account.hint.whatsapp'),
  microsoft: t('app.account.hint.microsoft'),
  telegram: t('app.account.hint.telegram'),
  linkedin: t('app.account.hint.linkedin'),
  discord: t('app.account.hint.discord'),
  zoom: t('app.account.hint.zoom'),
  proton: t('app.account.hint.proton'),
  icloud: t('app.account.hint.icloud'),
  fastmail: t('app.account.hint.fastmail'),
  notion: t('app.account.hint.notion'),
  custom: t('app.account.hint.custom'),
};

/** A name from a site address: "app.notion.so" → "Notion". */
function nameFromSite(url: string): string {
  try {
    const labels = new URL(url).hostname.split('.').filter((l) => !['www', 'app', 'web', 'my'].includes(l));
    const first = labels[0] ?? '';
    return first.charAt(0).toUpperCase() + first.slice(1);
  } catch {
    return '';
  }
}

export function AccountDialog({
  state,
  account,
  spaces = [],
  onClose,
}: {
  state: DialogState;
  account?: AccountView;
  spaces?: Space[];
  onClose: () => void;
}): React.JSX.Element {
  const editing = state.mode === 'edit';
  const [service, setService] = useState<ServiceId>(account?.service ?? 'google');
  const [name, setName] = useState(account?.name ?? '');
  const [site, setSite] = useState('');
  const siteUrl = cleanSiteUrl(site);
  const siteOk = editing || service !== 'custom' || siteUrl !== null;
  const [color, setColor] = useState(account?.color ?? ACCOUNT_COLORS[0]);
  // '' = no space, '+new' = a new space named below, otherwise a space id.
  const [spaceChoice, setSpaceChoice] = useState('');
  const [newSpace, setNewSpace] = useState('');
  const newSpaceOk = spaceChoice !== '+new' || (newSpace.trim().length > 0 && newSpace.trim().length <= 40);
  const valid = name.trim().length > 0 && name.trim().length <= 60 && newSpaceOk && siteOk;

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!valid) return;
    if (editing && account) window.missiondesk.updateAccount(account.id, { name: name.trim(), color });
    else {
      const space = spaceChoice === '+new' ? { newName: newSpace.trim() } : spaceChoice ? { id: spaceChoice } : undefined;
      await window.missiondesk.addAccount({ service, name: name.trim(), color, ...(service === 'custom' && siteUrl ? { url: siteUrl } : {}), ...(space ? { space } : {}) });
    }
    onClose();
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="dialog" onSubmit={submit} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
        <h2>{editing ? t('app.account.editTitle') : t('app.account.addTitle')}</h2>
        {!editing && (
          <div className="services" role="radiogroup" aria-label={t('app.account.service')}>
            {SERVICES.map((s) => (
              <button
                type="button"
                key={s}
                role="radio"
                aria-checked={service === s}
                className={`service-option${service === s ? ' selected' : ''}`}
                onClick={() => setService(s)}
              >
                <ServiceLogo service={s} className="service-logo" />
                {SERVICE_LABEL[s]}
              </button>
            ))}
          </div>
        )}
        {!editing && <p className="hint">{HINT[service]}</p>}
        {!editing && service === 'custom' && (
          <label>
            {t('app.account.address')}
            <input
              autoFocus
              value={site}
              maxLength={2048}
              inputMode="url"
              placeholder={t('app.account.addressPlaceholder')}
              aria-invalid={site.trim() !== '' && siteUrl === null}
              onChange={(e) => setSite(e.target.value)}
              onBlur={() => siteUrl && !name.trim() && setName(nameFromSite(siteUrl))}
            />
            {site.trim() !== '' && siteUrl === null && <small className="field-error">{t('app.account.addressError')}</small>}
          </label>
        )}
        {editing && account?.service === 'custom' && account.url && <p className="hint">{account.url}</p>}
        <label>
          {t('app.account.name')}
          <input
            autoFocus={service !== 'custom' || editing}
            value={name}
            maxLength={60}
            placeholder={t('app.account.namePlaceholder')}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <div className="colors" role="radiogroup" aria-label={t('app.account.colour')}>
          {ACCOUNT_COLORS.map((c) => (
            <button
              type="button"
              key={c}
              role="radio"
              aria-checked={color === c}
              aria-label={c}
              className={`swatch${color === c ? ' selected' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
        {!editing && (
          <label className="space-field">
            {t('app.account.space')}
            <select value={spaceChoice} onChange={(e) => setSpaceChoice(e.target.value)}>
              <option value="">{t('common.none')}</option>
              {spaces.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
              <option value="+new">{t('app.account.newSpace')}</option>
            </select>
          </label>
        )}
        {!editing && spaceChoice === '+new' && (
          <label className="space-field">
            {t('app.account.spaceName')}
            <input autoFocus value={newSpace} maxLength={40} placeholder={t('app.space.namePlaceholder')} onChange={(e) => setNewSpace(e.target.value)} />
          </label>
        )}
        <div className="actions">
          <button type="button" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="primary" disabled={!valid}>
            {editing ? t('common.save') : t('common.add')}
          </button>
        </div>
      </form>
    </div>
  );
}
