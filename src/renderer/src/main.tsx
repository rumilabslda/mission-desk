import './i18n-init';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { AssistantFab, AssistantWindow } from './assistant/AssistantWindow';
import { QuickEntry } from './QuickEntry';
import { SpacePanel } from './SpacePanel';
import { startCapturePage } from './meetings/capture';
import './styles.css';

// The same page also renders the small views drawn above the account pages:
// the "Folders with panel" overlay (main/views/space-panel.ts) and the floating
// assistant (main/views/assistant-overlay.ts) and the ⚡ quick-entry pop-ups (main/views/quick-overlay.ts).
const page = location.hash.slice(1);
if (page === 'capture') startCapturePage();
if (page === 'space-panel' || page === 'assistant' || page === 'assistant-fab' || page === 'quick') document.documentElement.classList.add('overlay-page', `${page}-page`);
if (page !== 'capture') createRoot(document.getElementById('root')!).render(
  page === 'space-panel' ? <SpacePanel /> : page === 'quick' ? <QuickEntry /> : page === 'assistant' ? <AssistantWindow /> : page === 'assistant-fab' ? <AssistantFab /> : <App />,
);
