import { useState } from 'react';
import type { SpaceNameRequest } from '../../shared/ipc';

/** Asks for a space's name, to create a space from some accounts or to rename one. */
export function SpaceNameDialog({ request, onClose }: { request: SpaceNameRequest; onClose: () => void }): React.JSX.Element {
  const [name, setName] = useState(request.mode === 'rename' ? request.name : '');
  const clean = name.trim();
  const valid = clean.length > 0 && clean.length <= 40;

  function submit(e: React.FormEvent): void {
    e.preventDefault();
    if (!valid) return;
    if (request.mode === 'create') window.missiondesk.createSpace(clean, request.accountIds);
    else window.missiondesk.renameSpace(request.spaceId, clean);
    onClose();
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="dialog" onSubmit={submit} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
        <h2>{request.mode === 'create' ? 'New space' : 'Rename space'}</h2>
        <label>
          Name
          <input autoFocus value={name} maxLength={40} placeholder="e.g. Acme, Personal" onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="actions" style={{ marginTop: 20 }}>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary" disabled={!valid}>
            {request.mode === 'create' ? 'Create' : 'Rename'}
          </button>
        </div>
      </form>
    </div>
  );
}
