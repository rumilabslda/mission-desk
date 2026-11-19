import { backgroundKinds, viewPolicy, startupPlan } from '../src/main/hibernation/policy';
import type { Account, AppState } from '../src/shared/types';

const acct = (id: string, extra: Partial<Account> = {}): Account => ({
  id, service: 'google', name: id, color: '#000000', muted: false, hibernateWhenIdle: false, ...extra,
});
const state = (accounts: Account[], activeAccountId: string | null = null): AppState => ({
  version: 1, accounts, activeAccountId, activeGoogleSubApp: {}, window: { x: 0, y: 0, width: 1, height: 1 },
});

test('google main is always-on, calendar and extras are idle', () => {
  expect(viewPolicy(acct('a'), 'main')).toBe('always-on');
  expect(viewPolicy(acct('a'), 'calendar')).toBe('idle');
  expect(viewPolicy(acct('a'), 'extra:3')).toBe('idle');
});

test('hibernateWhenIdle makes main idle', () => {
  expect(viewPolicy(acct('a', { hibernateWhenIdle: true }), 'main')).toBe('idle');
});

test('startupPlan loads the active account first and staggers the rest in order', () => {
  expect(startupPlan(state([acct('a'), acct('b'), acct('c')], 'b'))).toEqual({ immediate: 'b', staggered: ['a', 'c'] });
});

test('startupPlan falls back to the first account', () => {
  expect(startupPlan(state([acct('a'), acct('b')]))).toEqual({ immediate: 'a', staggered: ['b'] });
});

test('startupPlan skips hibernateWhenIdle accounts unless active', () => {
  const s = state([acct('a', { hibernateWhenIdle: true }), acct('b'), acct('c', { hibernateWhenIdle: true })], 'a');
  expect(startupPlan(s)).toEqual({ immediate: 'a', staggered: ['b'] });
});

test('startupPlan with no accounts', () => {
  expect(startupPlan(state([]))).toEqual({ immediate: null, staggered: [] });
});

test('Teams in a Microsoft 365 account runs like the main page (its messages must arrive)', () => {
  const ms = acct('m', { service: 'microsoft', teamsInBackground: true });
  // Until the user has opened Teams once, it doesn't run in the background (no Teams licence, memory).
  expect(backgroundKinds(acct('n', { service: 'microsoft' }))).toEqual(['main']);
  expect(viewPolicy(acct('n', { service: 'microsoft' }), 'teams')).toBe('idle');
  expect(viewPolicy(ms, 'teams')).toBe('always-on');
  expect(viewPolicy(ms, 'calendar')).toBe('idle');
  expect(viewPolicy({ ...ms, hibernateWhenIdle: true }, 'teams')).toBe('idle');
  expect(backgroundKinds(ms)).toEqual(['main', 'teams']);
  expect(backgroundKinds(acct('g'))).toEqual(['main']);
});
