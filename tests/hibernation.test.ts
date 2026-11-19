import { createHibernationScheduler } from '../src/main/hibernation/scheduler';

const IDLE = 1000;
let fired: string[];
let s: ReturnType<typeof createHibernationScheduler>;

beforeEach(() => {
  vi.useFakeTimers();
  fired = [];
  s = createHibernationScheduler({ idleMs: IDLE, onHibernate: (k) => fired.push(k) });
});
afterEach(() => vi.useRealTimers());

test('an idle view hidden for idleMs hibernates once', () => {
  s.register('a:calendar', 'idle');
  vi.advanceTimersByTime(IDLE);
  expect(fired).toEqual(['a:calendar']);
  vi.advanceTimersByTime(IDLE * 5);
  expect(fired).toEqual(['a:calendar']);
});

test('becoming visible cancels the timer', () => {
  s.register('a:calendar', 'idle');
  vi.advanceTimersByTime(IDLE - 1);
  s.setVisible('a:calendar', true);
  vi.advanceTimersByTime(IDLE * 2);
  expect(fired).toEqual([]);
});

test('hiding again restarts the full idle time', () => {
  s.register('a:calendar', 'idle');
  s.setVisible('a:calendar', true);
  s.setVisible('a:calendar', false);
  vi.advanceTimersByTime(IDLE - 1);
  expect(fired).toEqual([]);
  vi.advanceTimersByTime(1);
  expect(fired).toEqual(['a:calendar']);
});

test('an always-on view never hibernates', () => {
  s.register('a:main', 'always-on');
  vi.advanceTimersByTime(IDLE * 10);
  expect(fired).toEqual([]);
});

test('a view in a call never hibernates; after the call it waits a fresh idleMs', () => {
  s.register('a:meet', 'idle');
  s.setInCall('a:meet', true);
  vi.advanceTimersByTime(IDLE * 3);
  expect(fired).toEqual([]);
  s.setInCall('a:meet', false);
  vi.advanceTimersByTime(IDLE - 1);
  expect(fired).toEqual([]);
  vi.advanceTimersByTime(1);
  expect(fired).toEqual(['a:meet']);
});

test('unregister cancels a pending timer', () => {
  s.register('a:drive', 'idle');
  s.unregister('a:drive');
  vi.advanceTimersByTime(IDLE * 2);
  expect(fired).toEqual([]);
});

test('re-registering with a new policy replaces the old one', () => {
  s.register('a:main', 'always-on');
  s.register('a:main', 'idle');
  vi.advanceTimersByTime(IDLE);
  expect(fired).toEqual(['a:main']);
});
