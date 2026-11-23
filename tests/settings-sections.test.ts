import { settingsSections } from '../src/renderer/src/settings/sections';
import { t } from '../src/shared/i18n';

test('Settings lists General, Spaces, then Apps (what used to be Accounts)', () => {
  const ids = settingsSections('darwin').map((s) => s.id);
  expect(ids.slice(0, 3)).toEqual(['general', 'spaces', 'apps']);
  expect(ids).not.toContain('accounts');
  expect(t(settingsSections('darwin')[2].label)).toBe('Apps');
});

test('Meetings shows only on macOS', () => {
  expect(settingsSections('darwin').map((s) => s.id)).toContain('meetings');
  expect(settingsSections('win32').map((s) => s.id)).not.toContain('meetings');
});
