import { useEffect } from 'react';

export interface ToastState {
  message: string;
  actions?: { label: string; run(): void }[];
  error?: boolean;
}

/** A short message at the bottom of the calendar; closes itself after 6 seconds. */
export function Toast({ toast, onClose }: { toast: ToastState; onClose(): void }): React.JSX.Element {
  useEffect(() => {
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [toast, onClose]);
  return (
    <div className={`cal-toast${toast.error ? ' error' : ''}`} role="status">
      <span>{toast.message}</span>
      {toast.actions?.map((a) => (
        <button
          key={a.label}
          onClick={() => {
            a.run();
            onClose();
          }}
        >
          {a.label}
        </button>
      ))}
      <button className="cal-toast-x" aria-label="Dismiss" onClick={onClose}>
        ×
      </button>
    </div>
  );
}
