const escape = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** A tiny offline page. Retry is a plain link back to the failed URL. */
export function errorPageUrl(failedUrl: string): string {
  const safe = escape(failedUrl);
  const retry = /^https?:\/\//i.test(failedUrl) ? `<a class="retry" href="${safe}">Retry</a>` : '';
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Offline</title>
<style>
  :root { color-scheme: light dark; }
  body { margin: 0; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;
         font: 15px -apple-system, BlinkMacSystemFont, sans-serif; color: #6b6f7b; text-align: center; padding: 24px; }
  p { margin: 0 0 6px; } .url { font-size: 12px; opacity: .7; word-break: break-all; margin-bottom: 18px; }
  .retry { background: #6366f1; color: #fff; padding: 8px 18px; border-radius: 8px; text-decoration: none; font-weight: 600; }
</style></head><body>
<p>Can't reach this page. Check your connection.</p><p class="url">${safe}</p>${retry}
</body></html>`;
  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
}
