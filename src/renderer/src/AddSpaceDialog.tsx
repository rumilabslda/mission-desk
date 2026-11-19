import { useState } from 'react';
import type { UiSnapshot } from '../../shared/ipc';
import { AccountAvatar } from './AccountAvatar';
import { SERVICE_LABEL } from './service-glyph';

/** The + menu's "Add space…": a name and the accounts to put in it (at least one). */
export function AddSpaceDialog({ snapshot, onClose }: { snapshot: UiSnapshot; onClose: () => void }): React.JSX.Element {
  const [name, setName] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const clean = name.trim();
  const valid = clean.length > 0 && clean.length <= 40 && picked.size > 0;
  const spaceName = new Map(snapshot.spaces.map((s) => [s.id, s.name]));

  const toggle = (id: string): void =>
    setPicked((p) => {
      const next = new Set(p);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  function submit(e: React.FormEvent): void {
    e.preventDefault();
    if (!valid) return;
    // In sidebar order, so the space keeps the accounts' current order.
    window.missiondesk.createSpace(clean, snapshot.accounts.filter((a) => picked.has(a.id)).map((a) => a.id));
    onClose();
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="dialog" onSubmit={submit} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
        <h2>Add space</h2>
        <label>
          Name
          <input autoFocus value={name} maxLength={40} placeholder="e.g. Acme, Personal" onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="space-pick-title">Apps in this space</div>
        <ul className="space-pick">
          {snapshot.accounts.map((a) => {
            const current = a.spaceId ? spaceName.get(a.spaceId) : undefined;
            return (
              <li key={a.id}>
                <label className="space-pick-row">
                  <input type="checkbox" checked={picked.has(a.id)} onChange={() => toggle(a.id)} />
                  <AccountAvatar a={a} small />
                  <span className="space-pick-name">{a.name}</span>
                  <span className="space-pick-meta">{current ? `${SERVICE_LABEL[a.service]} · in ${current}` : SERVICE_LABEL[a.service]}</span>
                </label>
              </li>
            );
          })}
        </ul>
        <div className="actions" style={{ marginTop: 16 }}>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary" disabled={!valid}>
            Create
          </button>
        </div>
      </form>
    </div>
  );
}
