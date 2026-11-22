import { Fragment, type ReactNode } from 'react';
import { type MessageKey, type Params, t } from '../../shared/i18n';

export { intlLocale, locale, t } from '../../shared/i18n';
export type { MessageKey } from '../../shared/i18n';

/**
 * A message with markup: `<code>/</code>` or `<b>…</b>` in the text become React elements from `tags`.
 * Tags don't nest; text outside them stays plain (never parsed as HTML).
 *   rich('skills.intro', { code: (s) => <code>{s}</code> })
 */
export function rich(key: MessageKey, tags: Record<string, (chunk: string) => ReactNode>, params?: Params): ReactNode {
  const text = t(key, params);
  const out: ReactNode[] = [];
  const re = /<(\w+)>(.*?)<\/\1>|<(\w+)\/>/gs;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const name = m[1] ?? m[3];
    const render = tags[name];
    out.push(<Fragment key={i++}>{render ? render(m[2] ?? '') : m[0]}</Fragment>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}
