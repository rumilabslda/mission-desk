import { useModal } from '../modal';
import { useEffect } from 'react';

export interface Choice<T> {
  label: string;
  value: T;
  primary?: boolean;
  danger?: boolean;
}

/** A small question over the calendar (scope, send emails, delete). Esc or a click outside cancels. */
export function ChoiceDialog<T>({
  title,
  message,
  choices,
  onChoose,
  onCancel,
}: {
  title: string;
  message?: string;
  choices: Choice<T>[];
  onChoose(v: T): void;
  onCancel(): void;
}): React.JSX.Element {
  useModal(); // the floating assistant and pages stay out of its way
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCancel();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onCancel]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="dialog cal-choice" role="dialog" aria-label={title}>
        <h2>{title}</h2>
        {message && <p className="hint">{message}</p>}
        <div className="cal-choice-buttons">
          {choices.map((c) => (
            <button
              key={c.label}
              autoFocus={c.primary}
              className={c.primary ? 'primary' : c.danger ? 'cal-danger' : 'cal-plain'}
              onClick={() => onChoose(c.value)}
            >
              {c.label}
            </button>
          ))}
          <button className="cal-plain" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
