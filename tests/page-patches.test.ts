import { shouldPatchPage } from '../src/shared/page-patches';

test('the Google sign-in pages are left untouched', () => {
  expect(shouldPatchPage('accounts.google.com')).toBe(false);
  expect(shouldPatchPage('accounts.youtube.com')).toBe(false);
});

test('service pages get the notification and call shims', () => {
  expect(shouldPatchPage('mail.google.com')).toBe(true);
  expect(shouldPatchPage('app.slack.com')).toBe(true);
  expect(shouldPatchPage('web.whatsapp.com')).toBe(true);
});

test('the Microsoft sign-in pages are left untouched', () => {
  for (const h of ['login.microsoftonline.com', 'login.live.com', 'login.microsoft.com']) expect(shouldPatchPage(h)).toBe(false);
  expect(shouldPatchPage('outlook.office.com')).toBe(true);
  expect(shouldPatchPage('teams.microsoft.com')).toBe(true);
});
