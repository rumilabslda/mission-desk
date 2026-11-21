import { eventDraftAt, isDialAction, parseQuickRequest } from '../src/shared/quick';

describe('quick entry pop-ups', () => {
  test('a new event starts at the next half hour and lasts an hour', () => {
    const d = eventDraftAt(new Date(2026, 10, 19, 11, 52));
    expect(new Date(d.start).getHours()).toBe(12);
    expect(new Date(d.start).getMinutes()).toBe(0);
    expect(new Date(d.end).getTime() - new Date(d.start).getTime()).toBe(3_600_000);
    expect(d).toMatchObject({ calendarId: 'primary', title: '', allDay: false, guests: [], meet: false });
  });

  test('before the half hour it starts at the half hour', () => {
    const d = eventDraftAt(new Date(2026, 10, 19, 11, 5));
    expect([new Date(d.start).getHours(), new Date(d.start).getMinutes()]).toEqual([11, 30]);
  });

  test('requests from main are checked', () => {
    expect(parseQuickRequest({ kind: 'todo', tag: { kind: 'space', id: 'w' } })).toEqual({ kind: 'todo', tag: { kind: 'space', id: 'w' } });
    expect(parseQuickRequest({ kind: 'todo', tag: null })).toEqual({ kind: 'todo', tag: null });
    expect(parseQuickRequest({ kind: 'event', accountId: 'g' })).toEqual({ kind: 'event', accountId: 'g' });
    expect(parseQuickRequest({ kind: 'event', accountId: null })).toEqual({ kind: 'event', accountId: null });
    expect(parseQuickRequest({ kind: 'todo', tag: { kind: 'planet', id: 'x' } })).toBeNull();
    expect(parseQuickRequest({ kind: 'nope' })).toBeNull();
    expect(parseQuickRequest(null)).toBeNull();
  });

  test('the floating button menu: where the button is, and only known actions', () => {
    const dial = { kind: 'dial', fab: { x: 900, y: 500, width: 52, height: 52 }, side: 'right', label: 'Rumi', actions: ['meet', 'event', 'todo', 'assistant'] };
    expect(parseQuickRequest(dial)).toEqual(dial);
    expect(parseQuickRequest({ ...dial, label: null })).toEqual({ ...dial, label: null });
    expect(parseQuickRequest({ ...dial, actions: ['todo', 'rm -rf'] })).toBeNull();
    expect(parseQuickRequest({ ...dial, side: 'top' })).toBeNull();
    expect(parseQuickRequest({ ...dial, fab: { x: 'a', y: 0, width: 52, height: 52 } })).toBeNull();
    expect(isDialAction('assistant')).toBe(true);
    expect(isDialAction('settings')).toBe(false);
  });
});
