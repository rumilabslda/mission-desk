export interface PageElement {
  ref: number;
  role: string;
  name: string;
}

const MAX_ELEMENTS = 300;
const MAX_NAME = 80;

/** `[ref] role "name"` lines for Claude, capped and escaped. */
export function formatElements(els: PageElement[]): string {
  if (els.length === 0) return '(no interactive elements found)';
  const lines = els.slice(0, MAX_ELEMENTS).map((e) => {
    const name = e.name.length > MAX_NAME ? `${e.name.slice(0, MAX_NAME)}…` : e.name;
    return `[${e.ref}] ${e.role} "${name.replace(/"/g, '\\"')}"`;
  });
  if (els.length > MAX_ELEMENTS) lines.push(`… ${els.length - MAX_ELEMENTS} more not shown`);
  return lines.join('\n');
}

/** Read the visible text (isolated world). */
export const READ_SCRIPT = `(() => { /*read*/ return (document.body?.innerText || '').slice(0, 40000); })()`;

/**
 * Runs in the view's isolated world (never the page's own world). Numbers the
 * visible interactive elements 1..n and keeps them in a private map, tagged with
 * the main process's snapshot id so refs from older snapshots or pages never match.
 * Elements on screen come first. Returns the elements with their local refs.
 */
export function collectScript(snapshotId: number): string {
  return `(() => { /*collect*/
  const ROLES = ['button','link','textbox','searchbox','checkbox','radio','tab','menuitem','option','combobox','switch'];
  const selector = ['a[href]','button','input:not([type=hidden])','textarea','select','[contenteditable="true"]']
    .concat(ROLES.map((r) => '[role="' + r + '"]')).join(',');
  const clean = (s) => (s || '').replace(/\\s+/g, ' ').trim();
  const roleOf = (el) => {
    const r = el.getAttribute('role');
    if (r && ROLES.includes(r)) return r;
    const tag = el.tagName.toLowerCase();
    if (tag === 'a') return 'link';
    if (tag === 'button') return 'button';
    if (tag === 'textarea' || el.isContentEditable) return 'textbox';
    if (tag === 'select') return 'combobox';
    if (tag === 'input') {
      const t = (el.getAttribute('type') || 'text').toLowerCase();
      if (t === 'checkbox' || t === 'radio') return t;
      if (t === 'search') return 'searchbox';
      if (['button','submit','reset','image'].includes(t)) return 'button';
      return 'textbox';
    }
    return r || tag;
  };
  const nameOf = (el) => {
    const labelled = el.getAttribute('aria-labelledby');
    const byId = labelled ? clean(labelled.split(/\\s+/).map((id) => document.getElementById(id)?.innerText || '').join(' ')) : '';
    return clean(el.getAttribute('aria-label')) || byId || clean(el.getAttribute('placeholder')) ||
      clean(el.getAttribute('title')) || clean(el.innerText) || clean(el.value);
  };
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    return el.checkVisibility ? el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) : true;
  };
  const onScreen = (el) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; };
  const found = [...document.querySelectorAll(selector)].filter(visible);
  found.sort((a, b) => Number(onScreen(b)) - Number(onScreen(a)));
  const map = new Map();
  const elements = found.map((el, i) => { map.set(i + 1, el); return { ref: i + 1, role: roleOf(el), name: nameOf(el) }; });
  window.__wdRefs = { id: ${Number(snapshotId)}, map };
  return elements;
})()`;
}

/**
 * Waits for layout to settle, scrolls the element into view instantly and returns
 * its centre, but only if that point really hits the element (nothing on top).
 */
export function pointScript(snapshotId: number, ref: number): string {
  return `(async () => { /*point*/
  const st = window.__wdRefs;
  if (!st || st.id !== ${Number(snapshotId)}) return { error: 'stale' };
  const el = st.map.get(${Number(ref)});
  if (!el || !el.isConnected) return { error: 'stale' };
  const frame = () => new Promise((resolve) => {
    let done = false;
    requestAnimationFrame(() => { done = true; resolve(); });
    setTimeout(() => { if (!done) resolve(); }, 100);
  });
  await frame();
  await frame();
  el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
  await frame();
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return { error: 'stale' };
  const x = Math.round(r.left + r.width / 2);
  const y = Math.round(r.top + r.height / 2);
  if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) return { error: 'obscured' };
  const hit = document.elementFromPoint(x, y);
  if (!hit || !(hit === el || el.contains(hit))) return { error: 'obscured' };
  return { x, y };
})()`;
}

/** True when the element (or something inside it) has the keyboard focus. */
export function focusScript(snapshotId: number, ref: number): string {
  return `(() => { /*focus*/
  const st = window.__wdRefs;
  if (!st || st.id !== ${Number(snapshotId)}) return false;
  const el = st.map.get(${Number(ref)});
  if (!el || !el.isConnected) return false;
  const active = document.activeElement;
  return !!active && (active === el || el.contains(active));
})()`;
}
