import { useEffect, useState } from 'react';
import { MAX_USER_NAME } from '../../../shared/user';
import { t } from '../i18n';

/** Settings → General: the user's name, saved (one line, trimmed) when the field is left or on Return. */
export function NameField({ value, onSave }: { value: string; onSave(name: string): void }): React.JSX.Element {
  const [name, setName] = useState(value);
  useEffect(() => setName(value), [value]);
  const save = (): void => {
    const clean = name.replace(/\s+/g, ' ').trim();
    if (clean !== value) onSave(clean);
  };
  return (
    <input
      className="set-input set-name"
      value={name}
      maxLength={MAX_USER_NAME}
      placeholder={t('settings.general.namePlaceholder')}
      aria-label={t('settings.general.name')}
      autoComplete="name"
      onChange={(e) => setName(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
    />
  );
}
