/** A small, safe Markdown subset for assistant answers (rendered as React elements, never HTML). */

export type Span = { type: 'text' | 'bold' | 'code'; text: string } | { type: 'link'; text: string; href: string };
export type Block =
  | { type: 'paragraph'; spans: Span[] }
  | { type: 'heading'; level: number; spans: Span[] }
  | { type: 'list'; ordered: boolean; items: Span[][] }
  | { type: 'code'; text: string }
  | { type: 'table'; header: Span[][]; rows: Span[][][] };

const SAFE_HREF = /^(https?:\/\/|mailto:)/i;

export function parseInline(text: string): Span[] {
  const out: Span[] = [];
  const re = /\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)|(https?:\/\/[^\s<>)]+)/g;
  let last = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > last) out.push({ type: 'text', text: text.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ type: 'bold', text: m[1] });
    else if (m[2] !== undefined) out.push({ type: 'code', text: m[2] });
    else if (m[3] !== undefined) out.push(SAFE_HREF.test(m[4]) ? { type: 'link', text: m[3], href: m[4] } : { type: 'text', text: m[3] });
    else if (m[5] !== undefined) out.push({ type: 'link', text: m[5], href: m[5] });
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ type: 'text', text: text.slice(last) });
  return out;
}

const TABLE_SEPARATOR = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

/** The cells of one `| a | b |` row (`\|` is a pipe inside a cell). */
function tableCells(line: string): Span[][] {
  const cells = line.trim().replace(/^\|/, '').replace(/(?<!\\)\|$/, '').split(/(?<!\\)\|/);
  return cells.map((c) => parseInline(c.trim().replace(/\\\|/g, '|')));
}

export function parseMarkdown(src: string): Block[] {
  const lines = src.replace(/\r/g, '').split('\n');
  const blocks: Block[] = [];
  let para: string[] = [];
  const flush = (): void => {
    if (para.length) blocks.push({ type: 'paragraph', spans: parseInline(para.join(' ')) });
    para = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^```/.test(line)) {
      flush();
      const code: string[] = [];
      for (i++; i < lines.length && !/^```/.test(lines[i]); i++) code.push(lines[i]);
      blocks.push({ type: 'code', text: code.join('\n') });
      continue;
    }
    // A table: a row with pipes, then a separator row (| --- | :---: |).
    if (line.includes('|') && i + 1 < lines.length && lines[i + 1].includes('-') && TABLE_SEPARATOR.test(lines[i + 1])) {
      flush();
      const header = tableCells(line);
      const rows: Span[][][] = [];
      for (i += 2; i < lines.length && lines[i].trim() && lines[i].includes('|'); i++) rows.push(tableCells(lines[i]));
      i--;
      blocks.push({ type: 'table', header, rows });
      continue;
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      flush();
      blocks.push({ type: 'heading', level: h[1].length, spans: parseInline(h[2]) });
      continue;
    }
    const li = /^\s*([-*•]|\d+[.)])\s+(.*)$/.exec(line);
    if (li) {
      flush();
      const ordered = /\d/.test(li[1]);
      const prev = blocks[blocks.length - 1];
      if (prev && prev.type === 'list' && prev.ordered === ordered) prev.items.push(parseInline(li[2]));
      else blocks.push({ type: 'list', ordered, items: [parseInline(li[2])] });
      continue;
    }
    if (!line.trim()) {
      flush();
      continue;
    }
    para.push(line.trim());
  }
  flush();
  return blocks;
}
