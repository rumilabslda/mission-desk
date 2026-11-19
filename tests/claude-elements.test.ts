import { collectScript, focusScript, formatElements, pointScript, READ_SCRIPT } from '../src/main/claude/elements';

test('one line per element', () => {
  expect(formatElements([{ ref: 1, role: 'button', name: 'Send' }])).toBe('[1] button "Send"');
});

test('long names are cut to 80 characters', () => {
  const line = formatElements([{ ref: 2, role: 'link', name: 'x'.repeat(120) }]);
  expect(line).toBe(`[2] link "${'x'.repeat(80)}…"`);
});

test('at most 300 elements, then a summary line', () => {
  const els = Array.from({ length: 305 }, (_, i) => ({ ref: i + 1, role: 'button', name: `b${i}` }));
  const lines = formatElements(els).split('\n');
  expect(lines).toHaveLength(301);
  expect(lines[300]).toBe('… 5 more not shown');
});

test('quotes in names are escaped', () => {
  expect(formatElements([{ ref: 3, role: 'textbox', name: 'Say "hi"' }])).toBe('[3] textbox "Say \\"hi\\""');
});

test('empty page', () => {
  expect(formatElements([])).toBe('(no interactive elements found)');
});

test('the page scripts are self-contained expressions with their markers', () => {
  for (const code of [collectScript(5), pointScript(5, 7), focusScript(5, 7), READ_SCRIPT]) {
    expect(() => new Function(`return ${code}`)).not.toThrow();
  }
  expect(collectScript(5)).toContain('/*collect*/');
  expect(pointScript(5, 7)).toContain('/*point*/');
  expect(focusScript(5, 7)).toContain('/*focus*/');
  expect(READ_SCRIPT).toContain('/*read*/');
});

test('snapshots carry the main-process id, so old refs never match a new page', () => {
  expect(collectScript(42)).toContain('id: 42');
  expect(pointScript(42, 7)).toContain('st.id !== 42');
});

test('clicks wait for layout, scroll instantly and check what is under the pointer', () => {
  const code = pointScript(1, 1);
  expect(code).toContain('requestAnimationFrame');
  expect(code).toContain("behavior: 'instant'");
  expect(code).toContain('elementFromPoint');
  expect(code).toContain("'obscured'");
});
