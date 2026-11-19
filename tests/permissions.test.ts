import { isPermissionAllowed } from '../src/main/views/permissions';

test.each([
  ['media', 'https://meet.google.com/abc', true],
  ['display-capture', 'https://meet.google.com/abc', true],
  ['media', 'https://app.slack.com/client', true],
  ['media', 'https://web.whatsapp.com/', true],
  ['media', 'https://mail.google.com/', false],
  ['media', 'https://teams.microsoft.com/v2/', true],
  ['display-capture', 'https://teams.cloud.microsoft/', true],
  ['media', 'https://teams.live.com/v2/', true],
  ['media', 'https://outlook.office.com/mail/', false],
  ['media', 'https://evil.example.com/', false],
  ['notifications', 'https://mail.google.com/', true],
  ['notifications', 'https://anything.example/', true],
  ['clipboard-sanitized-write', 'https://docs.google.com/', true],
  ['fullscreen', 'https://drive.google.com/', true],
  ['geolocation', 'https://meet.google.com/', false],
  ['media', 'not a url', false],
])('%s on %s → %s', (permission, url, expected) => {
  expect(isPermissionAllowed(permission, url)).toBe(expected);
});
