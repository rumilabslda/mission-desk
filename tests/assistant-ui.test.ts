import { COMMANDS, expandCommand } from '../src/shared/assistant';
import { parseMarkdown } from '../src/renderer/src/assistant/markdown';

describe('commands', () => {
  test('every command expands to a full prompt; extra words are kept', () => {
    for (const c of COMMANDS) expect(expandCommand(`/${c.name}`).length).toBeGreaterThan(40);
    const s = expandCommand('/schedule 30 min with ana@x.com this week on @Acme, with Meet');
    expect(s).toContain('30 min with ana@x.com this week on @Acme, with Meet');
    expect(s).toContain('find_free_time');
  });
  test('plain text is sent as written; an unknown /word goes as the user\'s text (never as a Claude Code command)', () => {
    expect(expandCommand('What is on today?')).toBe('What is on today?');
    expect(expandCommand('/nope do it')).toBe('The user wrote: /nope do it');
    expect(expandCommand('  /acme-proposal hi')).toBe('The user wrote: /acme-proposal hi'); // another space's skill
  });
});

describe('markdown', () => {
  test('paragraphs, headings, lists and code blocks', () => {
    const blocks = parseMarkdown('## Today\n\nHello **there**\n\n- one\n- two `x`\n\n1. first\n2. second\n\n```\ncode here\n```');
    expect(blocks.map((b) => b.type)).toEqual(['heading', 'paragraph', 'list', 'list', 'code']);
    expect(blocks[2]).toMatchObject({ type: 'list', ordered: false });
    expect(blocks[3]).toMatchObject({ type: 'list', ordered: true });
    expect(blocks[4]).toEqual({ type: 'code', text: 'code here' });
  });
  test('inline: bold, code and links; only http(s) and mailto links', () => {
    const [p] = parseMarkdown('A **b** `c` [d](https://e.com) <javascript:x> [f](javascript:alert(1)) https://g.com');
    expect(p.type).toBe('paragraph');
    const spans = (p as { spans: { type: string; text: string; href?: string }[] }).spans;
    expect(spans).toContainEqual({ type: 'bold', text: 'b' });
    expect(spans).toContainEqual({ type: 'code', text: 'c' });
    expect(spans).toContainEqual({ type: 'link', text: 'd', href: 'https://e.com' });
    expect(spans).toContainEqual({ type: 'link', text: 'https://g.com', href: 'https://g.com' });
    expect(spans.some((s) => s.href?.startsWith('javascript'))).toBe(false);
  });
  test('tables: a header, the separator row and body rows; inline formatting in cells', () => {
    const blocks = parseMarkdown('Today:\n\n| Time | Account | Event |\n|---|:---:|---|\n| 09:00 | Personal | **Swim** |\n| 16:30 | Personal | Pick-up \\| school |\n\nAfter.');
    expect(blocks.map((b) => b.type)).toEqual(['paragraph', 'table', 'paragraph']);
    const t = blocks[1] as Extract<(typeof blocks)[number], { type: 'table' }>;
    expect(t.header.map((c) => c[0].text)).toEqual(['Time', 'Account', 'Event']);
    expect(t.rows).toHaveLength(2);
    expect(t.rows[0][2]).toEqual([{ type: 'bold', text: 'Swim' }]);
    expect(t.rows[1][2]).toEqual([{ type: 'text', text: 'Pick-up | school' }]);
  });
  test('pipes without a separator row stay a paragraph', () => {
    expect(parseMarkdown('a | b | c').map((b) => b.type)).toEqual(['paragraph']);
  });
  test('an unfinished code block while streaming still renders', () => {
    expect(parseMarkdown('```\npartial')).toEqual([{ type: 'code', text: 'partial' }]);
  });
});
