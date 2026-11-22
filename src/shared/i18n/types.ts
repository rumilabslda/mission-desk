/** A message with plural forms: picked by `count` with Intl.PluralRules ("other" when a form is missing). */
export interface Plural {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
}
export type Msg = string | Plural;

/** A translation of an English namespace: every key, the same shape (plain text or plural forms). */
export type Translation<T> = { [K in keyof T]: T[K] extends string ? string : Plural };
