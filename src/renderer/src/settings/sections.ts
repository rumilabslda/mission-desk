import type { MessageKey } from '../../../shared/i18n';

export type Section = 'general' | 'spaces' | 'apps' | 'integrations' | 'assistant' | 'skills' | 'meetings' | 'data' | 'about';

const ALL: { id: Section; label: MessageKey }[] = [
  { id: 'general', label: 'settings.section.general' },
  { id: 'spaces', label: 'settings.section.spaces' },
  { id: 'apps', label: 'settings.section.apps' },
  { id: 'integrations', label: 'settings.section.integrations' },
  { id: 'assistant', label: 'settings.section.assistant' },
  { id: 'skills', label: 'settings.section.skills' },
  { id: 'meetings', label: 'meetings.title' },
  { id: 'data', label: 'settings.section.data' },
  { id: 'about', label: 'settings.section.about' },
];

/** Settings' sections in order; Meetings only on macOS. */
export function settingsSections(platform: string): { id: Section; label: MessageKey }[] {
  return ALL.filter((s) => s.id !== 'meetings' || platform === 'darwin');
}
