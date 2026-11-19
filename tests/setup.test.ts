import { appNames, baseName, existingSpace, needsSetup, planOf, setupSteps, spaceColours, spaceNameProblem, uniqueName, type SetupDraft } from '../src/shared/setup';
import { ACCOUNT_COLORS } from '../src/shared/ipc';
import { parseSetupPlan } from '../src/main/ipc-validation';
import { scopeConfig } from '../src/shared/assistant-engines';

test('the setup shows on the very first launch only', () => {
  expect(needsSetup({ accounts: [] })).toBe(true);
  expect(needsSetup({ accounts: [], onboarded: true })).toBe(false); // skipped or finished
  expect(needsSetup({ accounts: [{}] })).toBe(false); // already in use
});

test('apps get short names; two of a kind in one space are told apart', () => {
  expect(appNames([{ service: 'google' }, { service: 'slack' }, { service: 'google' }, { service: 'custom', url: 'https://app.hubspot.com/' }])).toEqual([
    'Google',
    'Slack',
    'Google 2',
    'Hubspot',
  ]);
});

describe('the plan sent by the setup screens', () => {
  const ok = {
    engine: 'claude',
    assistantReads: true,
    spaces: [{ name: '  Acme ', apps: [{ service: 'google' }, { service: 'custom', url: 'notion.so' }] }],
    apps: [{ service: 'whatsapp' }],
  };

  test('a valid plan is cleaned', () => {
    expect(parseSetupPlan(ok)).toEqual({
      engine: 'claude',
      assistantReads: true,
      spaces: [{ name: 'Acme', apps: [{ service: 'google', name: 'Google' }, { service: 'custom', name: 'Notion', url: 'https://notion.so/' }] }],
      apps: [{ service: 'whatsapp', name: 'WhatsApp' }],
    });
  });

  test('anything off is refused', () => {
    expect(parseSetupPlan({ ...ok, engine: 'gpt' })).toBeNull();
    expect(parseSetupPlan({ ...ok, spaces: [{ name: '', apps: [{ service: 'google' }] }] })).toBeNull();
    expect(parseSetupPlan({ ...ok, spaces: [{ name: 'X', apps: [{ service: 'nope' }] }] })).toBeNull();
    expect(parseSetupPlan({ ...ok, spaces: [{ name: 'X', apps: [{ service: 'custom' }] }] })).toBeNull(); // a website needs its address
    expect(parseSetupPlan({ ...ok, spaces: Array.from({ length: 30 }, (_, i) => ({ name: `S${i}`, apps: [{ service: 'google' }] })) })).toBeNull();
    expect(parseSetupPlan(null)).toBeNull();
  });

  test('a space without apps is dropped (a space holds apps)', () => {
    expect(parseSetupPlan({ ...ok, spaces: [{ name: 'Empty', apps: [] }, ...ok.spaces] })?.spaces.map((s) => s.name)).toEqual(['Acme']);
  });
});

test("the assistant chosen in the setup is every space's default", () => {
  expect(scopeConfig({ defaultEngine: 'openrouter' }, 'space:x').engine).toBe('openrouter');
  expect(scopeConfig({ defaultEngine: 'openrouter', scopes: { 'space:x': { engine: 'claude' } } }, 'space:x').engine).toBe('claude');
  expect(scopeConfig({ defaultEngine: 'bogus' }, 'space:x').engine).toBe('claude');
});

describe('the setup flow (renderer)', () => {
  const draft = (over: Partial<SetupDraft> = {}): SetupDraft => ({ engine: 'claude', reads: true, together: false, spaces: [], loose: [], ...over });
  const space = (name: string, apps: SetupDraft['loose'] = []): SetupDraft['spaces'][number] => ({ key: name, name, apps });

  test('one apps step per space, or a single one when everything stays together', () => {
    const kinds = (d: SetupDraft): string[] => setupSteps(d).map((s) => (s.kind === 'apps' ? `apps:${s.space}` : s.kind));
    expect(kinds(draft({ spaces: [space('Personal'), space('Acme')] }))).toEqual(['welcome', 'assistant', 'spaces', 'apps:0', 'apps:1', 'ready']);
    expect(kinds(draft({ together: true, spaces: [space('Personal')] }))).toEqual(['welcome', 'assistant', 'spaces', 'apps:-1', 'ready']);
    expect(kinds(draft())).toEqual(['welcome', 'assistant', 'spaces', 'ready']); // no space yet: nothing to fill
  });

  test('the plan keeps only spaces with apps; together puts every app outside spaces', () => {
    const g = { key: 'a', service: 'google' as const };
    const s = { key: 'b', service: 'slack' as const };
    expect(planOf(draft({ spaces: [space('Personal', [g]), space('Empty')] }))).toEqual({
      engine: 'claude',
      assistantReads: true,
      spaces: [{ name: 'Personal', apps: [{ service: 'google', name: 'Google' }] }],
      apps: [],
    });
    expect(planOf(draft({ together: true, spaces: [space('Personal', [g])], loose: [s] }))).toEqual({ engine: 'claude', assistantReads: true, spaces: [], apps: [{ service: 'slack', name: 'Slack' }] });
    expect(planOf(draft({ engine: 'off' })).assistantReads).toBe(false); // no assistant: nothing to read
  });

  test('space names: trimmed, not empty, not twice, not too long', () => {
    expect(spaceNameProblem('  Acme ', ['Personal'])).toBeNull();
    expect(spaceNameProblem('   ', [])).toBe('empty');
    expect(spaceNameProblem('acme', ['Acme'])).toBe('Acme is already there.');
    expect(spaceNameProblem('x'.repeat(41), [])).toBe('Keep it under 40 characters.');
  });
});

describe('running the setup again', () => {
  const spaces = [{ id: 's1', name: 'Personal' }, { id: 's2', name: 'Acme' }];

  test('a space with the same name gets the new apps (no second "Personal")', () => {
    expect(existingSpace(' personal ', spaces)).toBe('s1');
    expect(existingSpace('Side project', spaces)).toBeNull();
  });

  test('an app named like one already there is numbered', () => {
    expect(uniqueName('Google', ['Google', 'Slack'])).toBe('Google 2');
    expect(uniqueName('Google', ['Google', 'Google 2'])).toBe('Google 3');
    expect(uniqueName('Slack', ['Google'])).toBe('Slack');
  });
});

describe('space colours (the preview shows what gets created)', () => {
  test('new spaces follow the existing ones; an existing space keeps its colour', () => {
    const existing = [{ name: 'Personal', color: '#111111' }, { name: 'Acme' }];
    expect(spaceColours(['Side', 'personal', 'Other'], existing)).toEqual([ACCOUNT_COLORS[2], '#111111', ACCOUNT_COLORS[3]]);
    expect(spaceColours(['A', 'B'], [])).toEqual([ACCOUNT_COLORS[0], ACCOUNT_COLORS[1]]);
  });

  test('an app keeps its base name, numbered against what is there', () => {
    expect(baseName({ service: 'google' })).toBe('Google');
    expect(baseName({ service: 'custom', url: 'https://app.hubspot.com/' })).toBe('Hubspot');
  });
});
