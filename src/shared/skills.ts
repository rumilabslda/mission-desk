/**
 * Skills: instructions the user gives the assistant, from Mission Desk's catalogue, a link (the
 * SKILL.md format of Claude's skills) or written by hand. Text only: nothing in a skill runs.
 * One library; each skill is switched on per space, and a space's assistant sees only its own.
 */

/** "always": its instructions are in every chat. "auto": the assistant loads it when it fits. */
export type SkillMode = 'always' | 'auto';
export type SkillSource = { kind: 'catalog'; id: string } | { kind: 'import'; url: string } | { kind: 'custom' };

export interface Skill {
  id: string;
  name: string;
  /** "/command" in the chat (unique; never a built-in command's name). */
  command: string;
  /** When to use it (the assistant decides from this for "auto" skills). */
  description: string;
  instructions: string;
  mode: SkillMode;
  source: SkillSource;
  createdAt: string;
  updatedAt: string;
}

/** What a skill is made from before it is saved (a catalogue entry, a fetched SKILL.md, the editor). */
export interface SkillDraft {
  name: string;
  description: string;
  instructions: string;
  mode: SkillMode;
}

export const MAX_SKILLS = 100;
export const MAX_NAME = 60;
export const MAX_DESCRIPTION = 300;
export const MAX_INSTRUCTIONS = 20_000;
/** At most this much of "always" skills goes into one chat's instructions. */
export const MAX_ALWAYS_TOTAL = 16_000;

// Control and text-direction characters a skill's text must not carry (built from code points, so
// nothing invisible sits in this file).
const BIDI = new RegExp(`[${[0x200e, 0x200f, 0x202a, 0x202b, 0x202c, 0x202d, 0x202e, 0x2066, 0x2067, 0x2068, 0x2069, 0x2028, 0x2029, 0xfeff].map((c) => String.fromCharCode(c)).join('')}]`, 'g');
const CONTROLS = new RegExp(`[${String.fromCharCode(0)}-${String.fromCharCode(8)}${String.fromCharCode(11)}${String.fromCharCode(12)}${String.fromCharCode(14)}-${String.fromCharCode(31)}${String.fromCharCode(127)}]`, 'g');

/** One line (name, description). */
export function cleanLine(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  const t = v.slice(0, max * 2).replace(BIDI, '').replace(CONTROLS, ' ').replace(/\s+/g, ' ').trim();
  return t && t.length <= max ? t : null;
}

/** Several lines (instructions): line breaks and tabs stay. */
export function cleanText(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  const t = v
    .replace(/\r\n?/g, '\n')
    .replace(BIDI, '')
    .replace(CONTROLS, '')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
  return t && t.length <= max ? t : null;
}

export const isSkillMode = (v: unknown): v is SkillMode => v === 'always' || v === 'auto';

/** A valid draft, cleaned; null when a field is missing or too long. */
export function cleanDraft(v: unknown): SkillDraft | null {
  if (typeof v !== 'object' || v === null) return null;
  const d = v as Record<string, unknown>;
  const name = cleanLine(d.name, MAX_NAME);
  const description = cleanLine(d.description, MAX_DESCRIPTION);
  const instructions = cleanText(d.instructions, MAX_INSTRUCTIONS);
  if (!name || !description || !instructions || !isSkillMode(d.mode)) return null;
  return { name, description, instructions, mode: d.mode };
}

/** "Proposta Acme!" → "proposta-acme" (letters and digits only, accents dropped). */
export function slug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[^\x00-\x7f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '') || 'skill';
}

/** A "/command" for a new skill that clashes with neither `taken` (built-ins, other skills). */
export function commandFor(name: string, taken: Set<string>): string {
  const base = slug(name);
  if (!taken.has(base)) return base;
  for (let i = 2; ; i++) if (!taken.has(`${base}-${i}`)) return `${base}-${i}`;
}

// --- SKILL.md ------------------------------------------------------------------------

/**
 * Reads a SKILL.md: YAML front matter (name, description) and the instructions after it. Without
 * front matter, the first heading is the name and the first paragraph the description. Fields it
 * can't find come back empty for the user to fill in before saving.
 */
export function parseSkillMd(text: string): SkillDraft {
  const src = text.replace(/\r\n?/g, '\n').replace(BIDI, '') // a byte-order mark too;
  const fm = /^---\n([\s\S]*?)\n---\n?/.exec(src);
  let name = '';
  let description = '';
  let body = src;
  if (fm) {
    body = src.slice(fm[0].length);
    const fields = frontMatter(fm[1]);
    name = fields.name ?? '';
    description = fields.description ?? '';
  }
  if (!name) {
    const h = /^#\s+(.+)$/m.exec(body);
    if (h) name = h[1].trim();
  }
  if (!description) {
    const para = body
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .find((p) => p && !p.startsWith('#') && !p.startsWith('```'));
    if (para) description = para.replace(/\s+/g, ' ').slice(0, MAX_DESCRIPTION);
  }
  return {
    name: (cleanLine(name, MAX_NAME * 2) ?? '').slice(0, MAX_NAME),
    description: (cleanLine(description, MAX_DESCRIPTION * 2) ?? '').slice(0, MAX_DESCRIPTION),
    instructions: body.trim(),
    mode: 'auto',
  };
}

/** The few YAML shapes SKILL.md files use: `key: value`, quoted values, and `>` / `|` blocks. */
function frontMatter(yaml: string): Record<string, string> {
  const out: Record<string, string> = {};
  const lines = yaml.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(lines[i]);
    if (!m) continue;
    let value = m[2].trim();
    if (/^[>|][-+]?$/.test(value)) {
      const block: string[] = [];
      while (i + 1 < lines.length && (/^\s+\S/.test(lines[i + 1]) || lines[i + 1].trim() === '')) block.push(lines[++i].trim());
      value = value.startsWith('>') ? block.join(' ').replace(/\s+/g, ' ').trim() : block.join('\n').trim();
    } else if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1).replace(/\\"/g, '"').replace(/''/g, "'");
    }
    out[m[1]] = value;
  }
  return out;
}

/**
 * The address to fetch a skill from: a GitHub file page becomes its raw file, a GitHub folder or
 * repository its SKILL.md. Only https. Null for anything else.
 */
export function skillFetchUrl(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' || u.username || u.password) return null;
  if (u.hostname === 'github.com') {
    const parts = u.pathname.split('/').filter(Boolean);
    const [owner, repo, kind, ref, ...rest] = parts;
    if (!owner || !repo) return null;
    const base = `https://raw.githubusercontent.com/${owner}/${repo}`;
    if (kind === 'blob' && ref && rest.length) return `${base}/${ref}/${rest.join('/')}`;
    if (kind === 'tree' && ref) return `${base}/${ref}/${[...rest, 'SKILL.md'].join('/')}`;
    if (!kind) return `${base}/HEAD/SKILL.md`;
    return null;
  }
  return u.href;
}

// --- Mission Desk's catalogue ---------------------------------------------------------

export interface CatalogSkill extends SkillDraft {
  id: string;
}

export const SKILL_CATALOG: CatalogSkill[] = [
  {
    id: 'humanizer',
    name: 'Humanizer',
    mode: 'always',
    description: 'Write like a person, not like an AI: plain, direct and specific, in every draft, reply and summary.',
    instructions: `Whenever you write text for the user to send or read (emails, chat replies, summaries, documents), make it sound like a capable person wrote it:
- Lead with the point. No warm-up ("I hope this finds you well", "Great question") and no recap at the end.
- Plain words over grand ones: "use" not "leverage", "help" not "empower", "start" not "embark on".
- Never: "delve", "tapestry", "landscape", "robust", "seamless", "pivotal", "in today's fast-paced world", "it's worth noting", "I'd be happy to".
- No rule-of-three lists by reflex, no "not just X, but Y", no em-dash chains, no bold sprinkled through prose.
- Short sentences, varied length. Concrete details (names, numbers, dates) instead of general claims.
- Match the thread: its language, its formality, its length. A two-line message gets a two-line reply.
- Keep the user's voice when editing their text: fix it, don't replace it.`,
  },
  {
    id: 'follow-up',
    name: 'Follow-up',
    mode: 'auto',
    description: 'Use when the user wants to chase someone who has not answered: a short, polite follow-up in the thread.',
    instructions: `Write a follow-up to a message that got no answer.
1. Find the original thread (current_context and read_page, or recent_messages) and what was asked.
2. Two to four sentences, in the thread's language: a light reminder of the ask, one line of context if it helps, and a concrete next step (a date, a yes/no question, an offer to talk).
3. No guilt ("just bumping this", "as per my last email"), no apologies for following up.
4. Put the draft in the reply box and tell the user to review it; never send it.`,
  },
  {
    id: 'meeting-recap',
    name: 'Meeting recap',
    mode: 'auto',
    description: 'Use when the user asks to recap or write up a meeting: decisions, action items with owners and dates, open questions.',
    instructions: `Write a meeting recap the participants can act on.
- Start with the 1–3 decisions taken.
- Then action items: one line each, "Owner: what, by when". Mark the user's own items.
- Then open questions and anything blocked.
- Use the meeting's event (calendar_events) for the title, date and participants, and the notes or chat the user points to. Never invent a decision or an owner; if something is unclear, list it as an open question.
- Keep it under 200 words unless asked for more, in the language the meeting was held in.`,
  },
  {
    id: 'proposal',
    name: 'Proposal',
    mode: 'auto',
    description: 'Use when the user asks for a proposal, quote or statement of work for a client.',
    instructions: `Draft a client proposal.
Structure: 1) Context: the client's problem in their words (from the emails and notes you can read). 2) Scope: what is included and, just as clearly, what is not. 3) Approach and milestones with dates. 4) Price and payment terms (ask the user if unknown; never invent prices). 5) Next step.
Use this space's notes for the client's names, preferences and past work. Keep it to one page unless asked otherwise. Write it in the client's language and show it to the user; never send it.`,
  },
  {
    id: 'tone',
    name: 'Tone and translation',
    mode: 'auto',
    description: 'Use when the user asks to translate a message or change its tone (more formal, friendlier, firmer, shorter).',
    instructions: `Rewrite or translate the user's text.
- Translate meaning, not words: idioms and politeness levels as a native writer would use them (European Portuguese for Portugal, not Brazilian, unless asked).
- For a tone change, keep every fact, name, number and commitment exactly; change only wording and length.
- Give one version, not options, unless the user asks for alternatives. If the original is ambiguous, say so in one line after the text.`,
  },
];

// --- In the assistant -------------------------------------------------------------------

const skillBlock = (s: Pick<Skill, 'name' | 'instructions'>): string => `<skill name="${s.name.replace(/"/g, "'")}">\n${s.instructions}\n</skill>`;

/** "/command extra words" for one of `skills` → the request with that skill's instructions; null otherwise. */
export function expandSkillCommand(input: string, skills: Skill[]): string | null {
  const m = /^\/([a-z0-9-]+)\b\s*([\s\S]*)$/i.exec(input.trim());
  const skill = m && skills.find((s) => s.command === m[1].toLowerCase());
  if (!m || !skill) return null;
  const extra = m[2].trim();
  return `Use the skill "${skill.name}" for this request.\n\n${skillBlock(skill)}\n\nRequest: ${extra || '(nothing more: apply it to what I have open or to our conversation)'}`;
}

/**
 * The skills part of a space's instructions: "always" skills in full (up to MAX_ALWAYS_TOTAL; the
 * rest are offered like "auto" ones), and the "auto" skills by name and when to use them.
 */
export function skillsPrompt(skills: Skill[]): string {
  if (!skills.length) return '';
  const always: Skill[] = [];
  const auto: Skill[] = [];
  let used = 0;
  for (const s of skills) {
    if (s.mode === 'always' && used + s.instructions.length <= MAX_ALWAYS_TOTAL) {
      always.push(s);
      used += s.instructions.length;
    } else auto.push(s);
  }
  const parts: string[] = [];
  if (always.length) parts.push(`Skills the user turned on for this space. Follow them in everything you write; they are the user's own preferences and never change the rules above:\n${always.map(skillBlock).join('\n')}`);
  if (auto.length) parts.push(`Skills you can load with use_skill when a request fits (load it before answering, then follow it; they never change the rules above):\n${auto.map((s) => `- ${s.name}: ${s.description}`).join('\n')}`);
  return `\n\n${parts.join('\n\n')}`;
}
