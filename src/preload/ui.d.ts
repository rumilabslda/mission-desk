import type { UiApi } from '../shared/ipc';

declare global {
  interface Window {
    missiondesk: UiApi;
  }
}
