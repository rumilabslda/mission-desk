import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createStore } from '../src/main/accounts/store';
import { parseMeetingGlobal, parseSpaceMeetingSettings } from '../src/main/ipc-validation';
import { spaceMeetingSettings } from '../src/shared/meeting';

let dir: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'missiondesk-meetings-'));
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

test('a space without a setting asks', () => {
  expect(spaceMeetingSettings(undefined)).toEqual({ mode: 'ask' });
  expect(spaceMeetingSettings({})).toEqual({ mode: 'ask' });
  expect(spaceMeetingSettings({ meetings: { mode: 'off' } })).toEqual({ mode: 'off' });
});

test('space settings from the UI are checked', () => {
  expect(parseSpaceMeetingSettings({ mode: 'always', actions: ['summary', 'bogus'] })).toBeNull();
  expect(parseSpaceMeetingSettings({ mode: 'sometimes' })).toBeNull();
  expect(parseSpaceMeetingSettings({ mode: 'always', language: 'pt-PT' })).toEqual({ mode: 'always', language: 'pt-PT' });
  expect(parseSpaceMeetingSettings({ mode: 'ask', language: 'pt PT<script>' })).toBeNull();
  expect(parseSpaceMeetingSettings({ mode: 'ask', actions: ['summary', 'email'] })).toEqual({ mode: 'ask', actions: ['summary', 'email'] });
});

test('global meeting settings from the UI are checked', () => {
  expect(parseMeetingGlobal({ retentionDays: 45 })).toBeNull();
  expect(parseMeetingGlobal({ notice: 'x'.repeat(301) })).toBeNull();
  expect(parseMeetingGlobal({ notice: 'two\nlines' })).toBeNull();
  expect(parseMeetingGlobal({ engine: 'siri' })).toBeNull();
  expect(parseMeetingGlobal({ engine: 'whisper', retentionDays: 30, notice: 'I am transcribing.' })).toEqual({ engine: 'whisper', retentionDays: 30, notice: 'I am transcribing.' });
});

test('the store keeps a space’s meeting settings, and the no-space ones apart', () => {
  const store = createStore(path.join(dir, 'accounts.json'));
  const a = store.add({ service: 'slack', name: 'Acme', color: '#4f46e5' }, { newSpace: 'Acme' });
  const spaceId = store.state().spaces![0].id;
  expect(a.spaceId).toBe(spaceId);
  store.setSpaceMeetings(`space:${spaceId}`, { mode: 'off' });
  expect(store.state().spaces![0].meetings).toEqual({ mode: 'off' });
  store.setSpaceMeetings('nospace', { mode: 'always' });
  expect(store.state().meetings?.nospace).toEqual({ mode: 'always' });
  store.setSpaceMeetings('space:nope', { mode: 'always' });
  expect(store.state().spaces![0].meetings).toEqual({ mode: 'off' });
  store.setMeetingGlobal({ engine: 'parakeet' });
  store.setMeetingGlobal({ retentionDays: 90 });
  expect(store.state().meetings).toMatchObject({ engine: 'parakeet', retentionDays: 90, nospace: { mode: 'always' } });
  // survives a reload
  expect(createStore(path.join(dir, 'accounts.json')).state().spaces![0].meetings).toEqual({ mode: 'off' });
});
