// @vitest-environment happy-dom
import { outlookInboxUnread, teamsUnread, unreadSourceMatches } from '../src/shared/page-unread';
import { parseUnread } from '../src/main/unread/parsers';
import { createUnreadTracker } from '../src/main/unread/aggregator';

const page = (html: string): ParentNode => {
  const d = document.createElement('div');
  d.innerHTML = html;
  return d;
};

// Shape of Outlook's folder list: a count, then a screen-reader word.
const folder = (name: string, count?: number) =>
  `<div role="treeitem" title="${name}"><span>${name}</span>${count ? `<span>${count}</span><span class="screenReaderOnly">unread</span>` : ''}</div>`;

describe('Outlook Inbox', () => {
  test('reads the Inbox count, not other folders', () => {
    const root = page(`<div role="tree">${folder('Favorites')}${folder('Inbox', 7)}${folder('Junk Email', 40)}${folder('Drafts', 2)}</div>`);
    expect(outlookInboxUnread(root)).toBe(7);
  });

  test('an Inbox with nothing unread is 0; no folder list yet is unknown', () => {
    expect(outlookInboxUnread(page(`<div role="tree">${folder('Inbox')}</div>`))).toBe(0);
    expect(outlookInboxUnread(page('<div>Loading…</div>'))).toBeNull();
  });

  test('Portuguese and Spanish inbox names; counts from the label when there is no screen-reader word', () => {
    expect(outlookInboxUnread(page(`<div role="tree">${folder('Caixa de Entrada', 3)}</div>`))).toBe(3);
    expect(outlookInboxUnread(page('<div role="tree"><div role="treeitem" aria-label="Bandeja de entrada 12 sin leer">Bandeja de entrada</div></div>'))).toBe(12);
  });

  test('a folder that only starts with "Inbox" is not the Inbox', () => {
    const root = page(`<div role="tree">${folder('Inbox Zero', 40)}${folder('Inbox', 2)}</div>`);
    expect(outlookInboxUnread(root)).toBe(2);
  });

  test('the first Inbox counts once (it can appear under Favorites and under the account)', () => {
    const root = page(`<div role="tree">${folder('Inbox', 5)}</div><div role="tree">${folder('Inbox', 5)}</div>`);
    expect(outlookInboxUnread(root)).toBe(5);
  });
});

describe('Teams', () => {
  test('the "(N)" title prefix wins', () => {
    expect(teamsUnread(page('<div data-tid="app-layout"></div>'), '(4) Chat | Microsoft Teams')).toBe(4);
  });

  test('otherwise the largest app bar badge (a chat mention shows in Activity and Chat: never added twice)', () => {
    const root = page('<div data-tid="app-layout"><nav><span class="fui-Badge">2</span><span class="fui-Badge">3</span></nav><div><span class="fui-Badge">12</span></div></div>');
    expect(teamsUnread(root, 'Chat | Microsoft Teams')).toBe(3);
  });

  test('badges outside the app bar never count; without an app bar the count is unknown', () => {
    expect(teamsUnread(page('<div data-tid="app-layout"><nav></nav><span class="fui-Badge">3</span><span class="fui-Badge">12</span></div>'), 'Microsoft Teams')).toBe(0);
    expect(teamsUnread(page('<div data-tid="app-layout"><span class="fui-Badge">3</span></div>'), 'Microsoft Teams')).toBeNull();
  });

  test('nothing unread is 0; before the app loads it is unknown', () => {
    expect(teamsUnread(page('<div data-tid="app-layout"><nav></nav></div>'), 'Microsoft Teams')).toBe(0);
    expect(teamsUnread(page('<div>Signing in…</div>'), 'Sign in to your account')).toBeNull();
  });
});

test('a Microsoft title with a "(N)" prefix is read; others leave the count to the page reader', () => {
  expect(parseUnread('microsoft', '(3) Mail - Someone - Outlook')).toBe(3);
  expect(parseUnread('microsoft', 'Mail - Someone - Outlook')).toBeNull();
});

test("an account's badge is the sum of its views (Outlook + Teams)", () => {
  const t = createUnreadTracker();
  expect(t.set('a', 'main', 4)).toBe(true);
  expect(t.set('a', 'teams', 2)).toBe(true);
  expect(t.get('a')).toBe(6);
  expect(t.set('a', 'teams', 2)).toBe(false);
  expect(t.all()).toEqual([6]);
  t.set('a', 'main', 0);
  t.set('a', 'teams', 'dot');
  expect(t.get('a')).toBe('dot');
  t.remove('a');
  expect(t.get('a')).toBe(0);
});

test('a count is only taken from the page it belongs to (Outlook for the main view, Teams for the Teams tab)', () => {
  expect(unreadSourceMatches('microsoft', 'main', 'https://outlook.office.com/mail/inbox')).toBe(true);
  expect(unreadSourceMatches('microsoft', 'main', 'https://outlook.live.com/mail/0/')).toBe(true);
  expect(unreadSourceMatches('microsoft', 'main', 'https://teams.microsoft.com/v2/')).toBe(false); // Outlook's view followed a Teams link
  expect(unreadSourceMatches('microsoft', 'teams', 'https://teams.cloud.microsoft/')).toBe(true);
  expect(unreadSourceMatches('microsoft', 'teams', 'https://outlook.office.com/mail/')).toBe(false);
  expect(unreadSourceMatches('microsoft', 'calendar', 'https://outlook.office.com/calendar/')).toBe(false);
  expect(unreadSourceMatches('microsoft', 'main', 'not a url')).toBe(false);
});
