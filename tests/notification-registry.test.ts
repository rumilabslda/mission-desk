import { createShownNotifications } from '../src/main/notifications/registry';
import { BACKGROUND_SWITCHES } from '../src/main/views/throttling';

class N {
  closed = 0;
  close(): void {
    this.closed++;
  }
}

describe('shown notifications', () => {
  test('the page closing a notification closes the Mac one', () => {
    const r = createShownNotifications<N>();
    const n = new N();
    r.add(1, 7, '', n);
    r.close(1, 7);
    expect(n.closed).toBe(1);
    r.close(1, 7); // already gone: nothing happens
    expect(n.closed).toBe(1);
  });

  test('a new notification with the same tag replaces the old one (same page only)', () => {
    const r = createShownNotifications<N>();
    const a = new N();
    const b = new N();
    const other = new N();
    r.add(1, 1, 'chat-42', a);
    r.add(2, 1, 'chat-42', other); // another page
    r.add(1, 2, 'chat-42', b);
    expect(a.closed).toBe(1);
    expect(other.closed).toBe(0);
    expect(b.closed).toBe(0);
  });

  test('ids from different pages never collide', () => {
    const r = createShownNotifications<N>();
    const a = new N();
    const b = new N();
    r.add(1, 5, '', a);
    r.add(2, 5, '', b);
    r.close(2, 5);
    expect(a.closed).toBe(0);
    expect(b.closed).toBe(1);
  });

  test('a page closing its own notification within 30 s while the account is off screen keeps it (an auto-dismissed toast)', () => {
    let t = 0;
    const r = createShownNotifications<N>(200, () => t);
    const a = new N();
    r.add(1, 1, '', a);
    t = 5_000;
    r.close(1, 1, false); // a toast timeout: the user never saw it
    expect(a.closed).toBe(0);
    t = 60_000;
    r.close(1, 1, false); // later: read on another device
    expect(a.closed).toBe(1);
    const b = new N();
    r.add(1, 2, '', b);
    r.close(1, 2, true); // the user is looking at the account
    expect(b.closed).toBe(1);
  });

  test('close says whether it was a real close (Home keeps its line after a toast timeout)', () => {
    let clock = 0;
    const r = createShownNotifications<N>(200, () => clock);
    r.add(1, 7, '', new N());
    expect(r.close(1, 7, false)).toBe(false); // the page's toast timing out, account off screen
    clock = 31_000;
    expect(r.close(1, 7, false)).toBe(true); // later: read elsewhere
    expect(r.close(1, 7)).toBe(false); // already gone
    r.add(1, 8, '', new N());
    expect(r.close(1, 8, true)).toBe(true); // on screen: read
  });

  test('after a page reload its old notifications are forgotten, so reused ids and tags touch nothing', () => {
    const r = createShownNotifications<N>();
    const old = new N();
    r.add(1, 1, 'chat-A', old);
    r.forgetSender(1);
    const fresh = new N();
    r.add(1, 1, 'chat-B', fresh);
    r.add(1, 2, 'chat-A', new N()); // must not close `fresh`
    expect(fresh.closed).toBe(0);
    expect(old.closed).toBe(0); // left in Notification Center
    r.close(1, 1);
    expect(fresh.closed).toBe(1);
  });

  test('forget drops a notification the user dismissed; the list is bounded', () => {
    const r = createShownNotifications<N>();
    const a = new N();
    r.add(1, 1, 't', a);
    r.forget(a);
    r.close(1, 1);
    expect(a.closed).toBe(0);
    for (let i = 0; i < 500; i++) r.add(1, 100 + i, '', new N());
    expect(r.size()).toBeLessThanOrEqual(200);
  });
});

test('hidden pages keep full-speed timers but still report themselves as hidden', () => {
  // backgroundThrottling: false would make every hidden page say it is visible (read receipts, no notifications).
  expect(BACKGROUND_SWITCHES).toEqual(['disable-background-timer-throttling', 'disable-renderer-backgrounding']);
});
