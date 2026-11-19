import { useEffect } from 'react';

// Dialogs of the main UI are drawn under the account pages and the floating assistant, so main
// hides those while any dialog is open. Several dialogs may be open at once: count them.
let open = 0;
const report = (): void => window.missiondesk.setModalOpen(open > 0);

/** While `isOpen`, this dialog counts as open. */
export function useModal(isOpen = true): void {
  useEffect(() => {
    if (!isOpen) return;
    open++;
    report();
    return () => {
      open--;
      report();
    };
  }, [isOpen]);
}
