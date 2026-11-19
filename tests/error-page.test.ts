import { errorPageUrl } from '../src/main/views/error-page';

const decode = (u: string): string => decodeURIComponent(u.slice(u.indexOf(',') + 1));

test('is a data URL with a retry link to the failed page', () => {
  const url = errorPageUrl('https://mail.google.com/');
  expect(url.startsWith('data:text/html;charset=utf-8,')).toBe(true);
  expect(decode(url)).toContain('href="https://mail.google.com/"');
  expect(decode(url)).toContain("Can't reach this page. Check your connection.");
});

test('escapes the failed URL', () => {
  const html = decode(errorPageUrl('https://x.example/"><script>alert(1)</script>'));
  expect(html).not.toContain('<script>alert');
  expect(html).toContain('&quot;&gt;&lt;script&gt;');
});

test('a non-http URL gets no retry link', () => {
  expect(decode(errorPageUrl('javascript:alert(1)'))).not.toContain('href="javascript');
});
