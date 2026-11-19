import { hasTabs, SERVICE_TABS, tabUrl } from '../src/shared/tabs';
import { kindToSubApp, subAppToKind } from '../src/shared/types';

test('Google and Microsoft 365 accounts have tabs; Slack and WhatsApp do not', () => {
  expect(hasTabs('google')).toBe(true);
  expect(hasTabs('microsoft')).toBe(true);
  expect(hasTabs('slack')).toBe(false);
  expect(hasTabs('whatsapp')).toBe(false);
});

test('a Microsoft 365 account has Outlook, Calendar and Teams', () => {
  expect(SERVICE_TABS.microsoft?.map((t) => [t.kind, t.title])).toEqual([
    ['main', 'Outlook'],
    ['calendar', 'Calendar'],
    ['teams', 'Teams'],
  ]);
  expect(tabUrl('microsoft', 'main')).toBe('https://outlook.office.com/mail/');
  expect(tabUrl('microsoft', 'calendar')).toBe('https://outlook.office.com/calendar/');
  expect(tabUrl('microsoft', 'teams')).toBe('https://teams.microsoft.com/v2/');
});

test("Google's tabs are unchanged", () => {
  expect(SERVICE_TABS.google?.map((t) => [t.kind, t.title])).toEqual([
    ['main', 'Gmail'],
    ['calendar', 'Calendar'],
    ['drive', 'Drive'],
    ['meet', 'Meet'],
  ]);
  expect(tabUrl('google', 'calendar')).toBe('https://calendar.google.com/');
});

test('a tab the service does not have has no URL', () => {
  expect(tabUrl('microsoft', 'drive')).toBeUndefined();
  expect(tabUrl('google', 'teams')).toBeUndefined();
  expect(tabUrl('slack', 'calendar')).toBeUndefined();
});

test('Teams is a sub-app like Meet', () => {
  expect(kindToSubApp('teams')).toBe('teams');
  expect(subAppToKind('teams')).toBe('teams');
});
