import { useState } from 'react';
import type { MemoryNote } from '../../../shared/assistant';
import { intlLocale, t } from '../i18n';

const dateFmt = new Intl.DateTimeFormat(intlLocale(), { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * One space's memory: every note its assistant reads, to search, edit, delete or add. Only ever one
 * space at a time (never two clients' notes side by side).
 */
export function MemoryDialog({ scope, name, notes, max, onClose }: { scope: string; name: string; notes: MemoryNote[]; max: number; onClose(): void }): React.JSX.Element {
  const md = window.missiondesk;
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const [asking, setAsking] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const q = query.trim().toLowerCase();
  const shown = q ? notes.filter((n) => n.text.toLowerCase().includes(q)) : notes;
  const full = notes.length >= max;
  const save = (): void => {
    if (!editing) return;
    const text = editing.text.trim();
    const before = notes.find((n) => n.id === editing.id)?.text;
    if (text && text !== before) md.assistantMemoryUpdate(scope, editing.id, text);
    setEditing(null);
  };
  const add = (): void => {
    const text = draft.trim();
    if (!text || full) return;
    md.assistantMemoryAdd(scope, text);
    setDraft('');
  };
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog mem-dialog" role="dialog" aria-labelledby="mem-title" onKeyDown={(e) => e.key === 'Escape' && !editing && onClose()}>
        <div className="mem-head">
          <h2 id="mem-title">{t('settings.memory.dialogTitle', { name })}</h2>
          <span className="set-muted">{t('settings.memory.count', { count: notes.length, max })}</span>
        </div>
        <p className="mem-hint">{scope === 'all' ? t('settings.memory.allHint') : t('settings.memory.spaceHint')}</p>
        {notes.length > 0 && <input type="search" className="mem-search" placeholder={t('settings.memory.search')} value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />}
        <ul className="mem-list">
          {shown.map((n) => (
            <li key={n.id}>
              {editing?.id === n.id ? (
                <input
                  className="mem-edit"
                  autoFocus
                  maxLength={300}
                  value={editing.text}
                  onChange={(e) => setEditing({ id: n.id, text: e.target.value })}
                  onBlur={save}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') save();
                    if (e.key === 'Escape') {
                      e.stopPropagation();
                      setEditing(null);
                    }
                  }}
                />
              ) : (
                <button type="button" className="mem-text" title={t('settings.memory.change')} onClick={() => setEditing({ id: n.id, text: n.text })}>
                  {n.text}
                </button>
              )}
              {asking === n.id ? (
                <span className="mem-ask">
                  {t('settings.memory.deleteAsk')}
                  <button type="button" className="set-link danger" onClick={() => (md.assistantMemoryRemove(scope, n.id), setAsking(null))}>
                    {t('settings.memory.yes')}
                  </button>
                  <button type="button" className="set-link" onClick={() => setAsking(null)}>
                    {t('settings.memory.no')}
                  </button>
                </span>
              ) : (
                <>
                  <span className="mem-date">{t('settings.memory.added', { date: dateFmt.format(new Date(n.createdAt)) })}</span>
                  <button type="button" className="mem-delete" aria-label={t('settings.memory.deleteLabel', { note: n.text })} title={t('settings.memory.delete')} onClick={() => setAsking(n.id)}>
                    🗑
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
        {notes.length === 0 && <p className="set-muted">{t('settings.memory.empty')}</p>}
        {notes.length > 0 && shown.length === 0 && <p className="set-muted">{t('settings.memory.noMatch')}</p>}
        <div className="mem-add">
          <input
            maxLength={300}
            disabled={full}
            placeholder={full ? t('settings.memory.full') : notes.length ? t('settings.memory.addPlaceholder') : t('settings.memory.addPlaceholderExample')}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && add()}
          />
          <button type="button" className="set-action" disabled={full || !draft.trim()} onClick={add}>
            {t('common.add')}
          </button>
        </div>
        <div className="actions">
          <button type="button" className="primary" onClick={onClose}>
            {t('common.done')}
          </button>
        </div>
      </div>
    </div>
  );
}
