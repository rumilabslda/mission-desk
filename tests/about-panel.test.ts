import { aboutPanelOptions } from '../src/main/about-panel';

test('the About window names the version, the company, the app\'s website and the license', () => {
  const o = aboutPanelOptions('1.0.0');
  expect(o.applicationVersion).toBe('1.0.0');
  expect(o.copyright).toContain('Rumi Labs, Lda.');
  expect(o.credits).toContain('missiondesk.rumilabs.pt'); // macOS shows only the credits text
  expect(o.website).toBe('https://missiondesk.rumilabs.pt'); // Linux shows it as a link
  expect(o.credits).toContain('GPL-3.0-or-later');
  expect(o.credits).not.toContain('Apache');
});
