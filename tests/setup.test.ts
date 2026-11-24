import { appNames, assistantsInPlan, baseName, existingSpace, hasMeetingApps, needsSetup, planOf, setupSteps, spaceColours, spaceNameProblem, uniqueName, type SetupDraft } from '../src/shared/setup';
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
    connection: '',
    assistantReads: true,
    spaces: [{ name: '  Acme ', apps: [{ service: 'google' }, { service: 'custom', url: 'notion.so' }] }],
    apps: [{ service: 'whatsapp' }],
  };

  test('a valid plan is cleaned', () => {
    expect(parseSetupPlan(ok)).toEqual({
      engine: 'claude',
      connection: '',
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

  test('each space can name its own connection; a built-in id becomes the type\'s built-in', () => {
    const own = { ...ok, connection: 'mac-claude', spaces: [{ ...ok.spaces[0], assistant: { engine: 'codex', connection: 'abcdefghijkl' } }] };
    const p = parseSetupPlan(own);
    expect(p?.connection).toBe('');
    expect(p?.spaces[0].assistant).toEqual({ engine: 'codex', connection: 'abcdefghijkl' });
    expect(parseSetupPlan({ ...ok, spaces: [{ ...ok.spaces[0], assistant: { engine: 'off', connection: 'x' } }] })?.spaces[0].assistant).toEqual({ engine: 'off', connection: '' });
  });

  test('a connection that is not one is refused', () => {
    expect(parseSetupPlan({ ...ok, connection: '../etc' })).toBeNull();
    expect(parseSetupPlan({ ...ok, spaces: [{ ...ok.spaces[0], assistant: { engine: 'gpt', connection: '' } }] })).toBeNull();
    expect(parseSetupPlan({ ...ok, spaces: [{ ...ok.spaces[0], assistant: { engine: 'claude', connection: 'Nope!' } }] })).toBeNull();
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
  const draft = (over: Partial<SetupDraft> = {}): SetupDraft => ({ engine: 'claude', connection: '', perSpace: false, reads: true, together: false, spaces: [], loose: [], ...over });
  const space = (name: string, apps: SetupDraft['loose'] = []): SetupDraft['spaces'][number] => ({ key: name, name, apps });

  test('spaces, then one apps step per space (or one when together), then the assistant', () => {
    const kinds = (d: SetupDraft): string[] => setupSteps(d).map((s) => (s.kind === 'apps' ? `apps:${s.space}` : s.kind));
    expect(kinds(draft({ spaces: [space('Personal'), space('Acme')] }))).toEqual(['welcome', 'spaces', 'apps:0', 'apps:1', 'assistant', 'ready']);
    expect(kinds(draft({ together: true, spaces: [space('Personal')] }))).toEqual(['welcome', 'spaces', 'apps:-1', 'assistant', 'ready']);
    expect(kinds(draft())).toEqual(['welcome', 'spaces', 'assistant', 'ready']); // no space yet: nothing to fill
  });

  test('one assistant for every space, unless each space chooses its own', () => {
    const g = { key: 'a', service: 'google' as const };
    const mine = { engine: 'codex' as const, connection: 'abcdefghijkl' };
    const d = draft({ connection: 'zyxwvutsrqpo', spaces: [{ ...space('Personal', [g]), assistant: mine }, space('Acme', [g])] });
    expect(planOf(d).spaces.map((s) => s.assistant)).toEqual([undefined, undefined]); // not per space: the choice above
    expect(planOf({ ...d, perSpace: true }).spaces.map((s) => s.assistant)).toEqual([mine, undefined]);
    expect(planOf({ ...d, perSpace: true, together: true }).spaces).toEqual([]);
  });

  test('reading is asked only when some space has an assistant', () => {
    const g = { key: 'a', service: 'google' as const };
    const d = draft({ engine: 'off', perSpace: true, spaces: [{ ...space('Acme', [g]), assistant: { engine: 'claude', connection: '' } }] });
    expect(assistantsInPlan(planOf(d))).toBe(true);
    expect(planOf(d).assistantReads).toBe(true);
    expect(assistantsInPlan(planOf({ ...d, perSpace: false }))).toBe(false);
    expect(planOf({ ...d, perSpace: false }).assistantReads).toBe(false);
  });

  test('meetings are mentioned when a space has an app with calls', () => {
    expect(hasMeetingApps(draft({ spaces: [space('A', [{ key: 'x', service: 'slack' }])] }))).toBe(false);
    expect(hasMeetingApps(draft({ spaces: [space('A', [{ key: 'x', service: 'zoom' }])] }))).toBe(true);
    expect(hasMeetingApps(draft({ together: true, loose: [{ key: 'x', service: 'microsoft' }] }))).toBe(true);
    expect(hasMeetingApps(draft({ together: true, spaces: [space('A', [{ key: 'x', service: 'google' }])] }))).toBe(false); // together: the spaces' apps aren't used
  });

  test('the plan keeps only spaces with apps; together puts every app outside spaces', () => {
    const g = { key: 'a', service: 'google' as const };
    const s = { key: 'b', service: 'slack' as const };
    expect(planOf(draft({ spaces: [space('Personal', [g]), space('Empty')] }))).toEqual({
      engine: 'claude',
      connection: '',
      assistantReads: true,
      spaces: [{ name: 'Personal', apps: [{ service: 'google', name: 'Google' }] }],
      apps: [],
    });
    expect(planOf(draft({ together: true, spaces: [space('Personal', [g])], loose: [s] }))).toEqual({ engine: 'claude', connection: '', assistantReads: true, spaces: [], apps: [{ service: 'slack', name: 'Slack' }] });
    expect(planOf(draft({ engine: 'off' })).assistantReads).toBe(false); // no assistant: nothing to read
  });

  test('the name typed on the first screen goes with the plan; none: nothing', () => {
    expect(planOf(draft({ userName: '  Armando ' })).userName).toBe('Armando');
    expect('userName' in planOf(draft({ userName: '  ' }))).toBe(false);
    expect('userName' in planOf(draft())).toBe(false);
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
