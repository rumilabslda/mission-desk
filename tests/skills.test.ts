import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  cleanDraft,
  commandFor,
  expandSkillCommand,
  MAX_ALWAYS_TOTAL,
  parseSkillMd,
  SKILL_CATALOG,
  type Skill,
  skillFetchUrl,
  skillsPrompt,
  slug,
} from '../src/shared/skills';
import { createSkillsStore } from '../src/main/assistant/skills-store';
import { assistantTools, type AssistantToolHost } from '../src/main/assistant/tools';
import { assistantPrompt } from '../src/main/assistant/prompt';
import { COMMANDS } from '../src/shared/assistant';

const tmp = (): string => path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'md-skills-')), 'skills.json');
const draft = (name: string, mode: 'always' | 'auto' = 'auto', instructions = `Do ${name} well.`) => ({ name, description: `Use for ${name}`, instructions, mode });
const skill = (name: string, mode: 'always' | 'auto' = 'auto', instructions = `Do ${name} well.`): Skill => ({
  id: slug(name),
  command: slug(name),
  ...draft(name, mode, instructions),
  source: { kind: 'custom' },
  createdAt: '',
  updatedAt: '',
});
const ACME = 'space:acme';
const GLOBEX = 'space:globex';

describe('SKILL.md files', () => {
  test('front matter gives the name and description; the rest is the instructions', () => {
    const d = parseSkillMd('---\nname: humanizer\ndescription: Remove signs of AI writing.\nlicense: MIT\n---\n\n# Humanizer\n\nWrite plainly.\n');
    expect(d).toEqual({ name: 'humanizer', description: 'Remove signs of AI writing.', instructions: '# Humanizer\n\nWrite plainly.', mode: 'auto' });
  });

  test('quoted values, folded and literal blocks, Windows line ends and a byte-order mark', () => {
    const bom = String.fromCharCode(0xfeff);
    const d = parseSkillMd(`${bom}---\r\nname: "Follow-up: polite"\r\ndescription: >\r\n  Use when someone\r\n  hasn't answered.\r\n---\r\nBody`);
    expect(d.name).toBe('Follow-up: polite');
    expect(d.description).toBe("Use when someone hasn't answered.");
    expect(d.instructions).toBe('Body');
    expect(parseSkillMd("---\nname: 'It''s mine'\ndescription: |\n  Line one\n  Line two\n---\nx").description).toBe('Line one Line two'); // one line in Mission Desk
  });

  test('without front matter: the first heading and paragraph; nothing found stays empty for the user', () => {
    const d = parseSkillMd('# Proposal writer\n\nWrites proposals for clients.\n\n## Steps\n1. Ask.');
    expect(d.name).toBe('Proposal writer');
    expect(d.description).toBe('Writes proposals for clients.');
    expect(parseSkillMd('just text').name).toBe('');
  });

  test('links: GitHub file and folder pages become raw files; only https without credentials', () => {
    expect(skillFetchUrl('https://github.com/acme/skills/blob/main/humanizer/SKILL.md')).toBe('https://raw.githubusercontent.com/acme/skills/main/humanizer/SKILL.md');
    expect(skillFetchUrl('https://github.com/acme/skills/tree/main/humanizer')).toBe('https://raw.githubusercontent.com/acme/skills/main/humanizer/SKILL.md');
    expect(skillFetchUrl('https://github.com/acme/humanizer')).toBe('https://raw.githubusercontent.com/acme/humanizer/HEAD/SKILL.md');
    expect(skillFetchUrl('  https://example.com/skills/x.md ')).toBe('https://example.com/skills/x.md');
    for (const bad of ['http://example.com/SKILL.md', 'https://user:pw@example.com/x', 'file:///etc/passwd', 'javascript:alert(1)', 'nope', 'https://github.com/acme/skills/issues/1'])
      expect(skillFetchUrl(bad)).toBeNull();
  });
});

describe('a skill is clean text with a unique /command', () => {
  test('commands: plain letters, never a built-in command, never twice', () => {
    expect(slug('Proposta Acme!')).toBe('proposta-acme');
    expect(slug('Resumo de reunião')).toBe('resumo-de-reuniao');
    expect(slug('***')).toBe('skill');
    const builtIns = new Set(COMMANDS.map((c) => c.name));
    expect(commandFor('Brief', builtIns)).toBe('brief-2');
    expect(commandFor('Reply', new Set([...builtIns, 'reply-2']))).toBe('reply-3');
  });

  test('a draft needs every field within its limits; invisible direction characters are dropped', () => {
    const rlo = String.fromCharCode(0x202e);
    expect(cleanDraft({ ...draft('x'), name: `Nice${rlo} name` })?.name).toBe('Nice name');
    expect(cleanDraft({ ...draft('x'), instructions: 'a\r\nb' })?.instructions).toBe('a\nb');
    expect(cleanDraft({ ...draft('x'), name: '' })).toBeNull();
    expect(cleanDraft({ ...draft('x'), name: 'x'.repeat(61) })).toBeNull();
    expect(cleanDraft({ ...draft('x'), instructions: 'x'.repeat(20_001) })).toBeNull();
    expect(cleanDraft({ ...draft('x'), mode: 'sometimes' })).toBeNull();
    expect(cleanDraft(null)).toBeNull();
  });

  test('the catalogue: valid skills with unique ids, Humanizer always on', () => {
    expect(new Set(SKILL_CATALOG.map((c) => c.id)).size).toBe(SKILL_CATALOG.length);
    for (const c of SKILL_CATALOG) expect(cleanDraft(c)).not.toBeNull();
    expect(SKILL_CATALOG.find((c) => c.id === 'humanizer')?.mode).toBe('always');
  });
});

describe('skills library: on per space, never across', () => {
  test("each space sees only the skills turned on for it", () => {
    const s = createSkillsStore(tmp());
    const proposal = s.add(draft('Acme proposal'), { kind: 'custom' }, [ACME]) as Skill;
    const falcon = s.add(draft('Falcon memo'), { kind: 'custom' }, [GLOBEX]) as Skill;
    expect(s.activeFor(ACME).map((x) => x.name)).toEqual(['Acme proposal']);
    expect(s.activeFor(GLOBEX).map((x) => x.name)).toEqual(['Falcon memo']);
    expect(s.activeFor('all')).toEqual([]); // "All spaces" has its own switches too
    expect(s.setActive(falcon.id, ACME, true)).toBe(true);
    expect(s.activeFor(ACME)).toHaveLength(2);
    expect(s.setActive(proposal.id, 'space:../x', true)).toBe(false);
    expect(s.setActive('missing', ACME, true)).toBe(false);
  });

  test('a catalogue skill is added once; adding it again turns it on where asked', () => {
    const s = createSkillsStore(tmp());
    const h = SKILL_CATALOG[0];
    const a = s.add(h, { kind: 'catalog', id: h.id }, [ACME]) as Skill;
    const b = s.add(h, { kind: 'catalog', id: h.id }, [GLOBEX]) as Skill;
    expect(b.id).toBe(a.id);
    expect(s.all()).toHaveLength(1);
    expect(s.activeFor(GLOBEX)).toHaveLength(1);
  });

  test('renaming gets a new command; removing clears it from every space; a deleted space loses its switches', () => {
    const s = createSkillsStore(tmp());
    const x = s.add(draft('Brief'), { kind: 'custom' }, [ACME, GLOBEX]) as Skill;
    expect(x.command).toBe('brief-2');
    expect(s.update(x.id, { name: 'Weekly brief' })?.command).toBe('weekly-brief');
    expect(s.update(x.id, { instructions: '' })).toBeNull();
    s.prune((sc) => sc !== GLOBEX);
    expect(s.activeMap()[GLOBEX]).toBeUndefined();
    expect(s.activeFor(ACME)).toHaveLength(1);
    expect(s.remove(x.id)).toBe(true);
    expect(s.activeFor(ACME)).toEqual([]);
  });

  test('saved for this user only; survives a restart; broken entries and unknown scopes are dropped', () => {
    const file = tmp();
    createSkillsStore(file).add(draft('Acme proposal'), { kind: 'import', url: 'https://example.com/SKILL.md' }, [ACME]);
    expect(fs.statSync(file).mode & 0o777).toBe(0o600);
    const again = createSkillsStore(file);
    expect(again.activeFor(ACME).map((x) => x.name)).toEqual(['Acme proposal']);
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    raw.skills.push({ ...raw.skills[0], id: 'bad', command: 'brief' }); // a built-in command
    raw.skills.push({ ...raw.skills[0], id: 'bad2', source: { kind: 'import', url: 'http://insecure.example' } });
    raw.active['../evil'] = [raw.skills[0].id];
    raw.active[GLOBEX] = ['not-a-skill'];
    fs.writeFileSync(file, JSON.stringify(raw));
    const loaded = createSkillsStore(file);
    expect(loaded.all()).toHaveLength(1);
    expect(Object.keys(loaded.activeMap()).sort()).toEqual([ACME, GLOBEX]);
    expect(loaded.activeFor(GLOBEX)).toEqual([]);
    fs.writeFileSync(file, 'not json');
    expect(createSkillsStore(file).all()).toEqual([]);
    expect(fs.existsSync(`${file}.bak`)).toBe(true);
  });
});

describe('skills in the assistant', () => {
  test('"always" skills go in whole, "auto" ones by name and when to use them', () => {
    const p = skillsPrompt([skill('Humanizer', 'always', 'No fluff.'), skill('Acme proposal')]);
    expect(p).toContain('<skill name="Humanizer">\nNo fluff.\n</skill>');
    expect(p).toContain('- Acme proposal: Use for Acme proposal');
    expect(p).not.toContain('Do Acme proposal well.'); // loaded only with use_skill
    expect(p).toMatch(/never change the rules above/);
    expect(skillsPrompt([])).toBe('');
  });

  test('too much "always" text: the rest is offered like an "auto" skill', () => {
    const big = skill('Big style', 'always', 'x'.repeat(MAX_ALWAYS_TOTAL - 10));
    const more = skill('More style', 'always', 'y'.repeat(100));
    const p = skillsPrompt([big, more]);
    expect(p).toContain('<skill name="Big style">');
    expect(p).not.toContain('<skill name="More style">');
    expect(p).toContain('- More style: Use for More style');
  });

  test('/command uses one of this space’s skills; anything else is left to the built-in commands', () => {
    const on = [skill('Acme proposal')];
    const out = expandSkillCommand('/acme-proposal for the Q1 audit', on)!;
    expect(out).toContain('Use the skill "Acme proposal"');
    expect(out).toContain('Do Acme proposal well.');
    expect(out).toContain('Request: for the Q1 audit');
    expect(expandSkillCommand('/acme-proposal', on)).toContain('nothing more');
    expect(expandSkillCommand('/falcon-memo', on)).toBeNull(); // another space's skill: not here
    expect(expandSkillCommand('/brief', on)).toBeNull();
    expect(expandSkillCommand('hello', on)).toBeNull();
  });

  test('the space prompt carries its skills after the rules', () => {
    const p = assistantPrompt(new Date(2026, 10, 22), 'pt-PT', 'Acme only.', [], [skill('Humanizer', 'always', 'No fluff.')]);
    expect(p.indexOf('How to work:')).toBeLessThan(p.indexOf('<skill name="Humanizer">'));
  });
});

describe('assistant tools: use_skill and save_skill', () => {
  function host(active: Skill[], confirm: boolean): AssistantToolHost & { saved: unknown[]; asked: number } {
    const h = {
      saved: [] as unknown[],
      asked: 0,
      context: async () => ({}),
      googleAccounts: () => [],
      loadEvents: async () => ({ events: [], status: [] }),
      unread: () => [],
      confirmCreate: async () => ({ create: false, notify: false }),
      createEvent: async () => ({ ok: false as const, error: 'forbidden' as const }),
      recentMessages: () => [],
      todos: () => [],
      addTodo: () => null,
      completeTodo: () => false,
      memory: () => [],
      confirmMemory: async () => false,
      remember: () => null,
      forget: () => false,
      skills: () => active,
      confirmSkill: async () => (h.asked++, confirm),
      saveSkill: (d: unknown) => (h.saved.push(d), { ...skill('Saved'), command: 'saved' }),
    };
    return h;
  }
  const run = async (h: AssistantToolHost, name: string, args: Record<string, unknown>) =>
    (await assistantTools(h).find((t) => t.name === name)!.run(args, new AbortController().signal)) as { text: string; isError?: boolean };

  test("use_skill loads only a skill that's on in this space, by name or /command", async () => {
    const h = host([skill('Acme proposal')], true);
    expect((await run(h, 'use_skill', { name: 'acme proposal' })).text).toContain('Do Acme proposal well.');
    expect((await run(h, 'use_skill', { name: '/acme-proposal' })).text).toContain('<skill name="Acme proposal">');
    const other = await run(h, 'use_skill', { name: 'Falcon memo' });
    expect(other.isError).toBe(true);
    expect(other.text).not.toContain('Do Falcon');
  });

  test('save_skill asks first; declined saves nothing', async () => {
    const no = host([], false);
    expect((await run(no, 'save_skill', draft('Acme proposal'))).text).toMatch(/declined/);
    expect(no.asked).toBe(1);
    expect(no.saved).toEqual([]);
    const yes = host([], true);
    expect((await run(yes, 'save_skill', { ...draft('Acme proposal'), mode: 'always' })).text).toMatch(/Saved as the skill/);
    expect(yes.saved).toEqual([{ ...draft('Acme proposal'), mode: 'always' }]);
  });
});
