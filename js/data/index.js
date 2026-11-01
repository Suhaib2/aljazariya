import { VERSES_A } from "./verses-a.js";
import { VERSES_B } from "./verses-b.js";
import { VERSES_C } from "./verses-c.js";
import { SECTIONS, sectionOf } from "./sections.js";
import { RULES, RULE_CATS } from "./rules.js";
import { GLOSSARY, TERM_KINDS } from "./glossary.js";
import { QUIZ } from "./quiz.js";
import { tokenize, norm, clean } from "../core/arabic.js";

export { SECTIONS, sectionOf, RULES, RULE_CATS, GLOSSARY, TERM_KINDS, QUIZ };
export * from "./letters.js";

export const VERSES = [...VERSES_A, ...VERSES_B, ...VERSES_C];
export const TOTAL = VERSES.length;
export const V = Object.fromEntries(VERSES.map((v) => [v.n, v]));
export const RULE = Object.fromEntries(RULES.map((r) => [r.id, r]));
export const TERM = Object.fromEntries(GLOSSARY.map((t) => [t.id, t]));
export const SECTION = Object.fromEntries(SECTIONS.map((s) => [s.id, s]));

// Слова каждого полустишия, подготовленные один раз.
export const TOK = Object.fromEntries(VERSES.map((v) => [v.n, v.a.map(tokenize)]));
export const PLAIN = Object.fromEntries(VERSES.map((v) => [v.n, v.a.map(clean)]));
export const NORM = Object.fromEntries(VERSES.map((v) => [v.n, norm(v.a.join(" "))]));
// Пересчитать слова бейта после редакционной правки текста.
export function rebuildVerse(n) {
  TOK[n] = V[n].a.map(tokenize);
  PLAIN[n] = V[n].a.map(clean);
  NORM[n] = norm(V[n].a.join(" "));
}

// Термины: нормализованная форма слова → термин (с учётом ограничения по бейтам).
const TERM_FORMS = new Map();
for (const t of GLOSSARY) for (const f of t.f) {
  const k = norm(f);
  if (!TERM_FORMS.has(k)) TERM_FORMS.set(k, []);
  TERM_FORMS.get(k).push(t);
}
export function termFor(n, normWord) {
  const list = TERM_FORMS.get(normWord);
  if (!list) return null;
  return list.find((t) => !t.v || t.v.includes(n)) || null;
}
export function termsInVerse(n) {
  const seen = new Map();
  for (const line of TOK[n]) for (const w of line) {
    const t = termFor(n, w.n);
    if (t && !seen.has(t.id)) seen.set(t.id, t);
  }
  return [...seen.values()];
}

// Значения трудных слов для всплывающей подсказки по слову.
export function wordMeanings(n, normWord) {
  const v = V[n];
  if (!v.w) return [];
  return v.w.filter(([ar]) => {
    const parts = norm(ar).split(/\s+/);
    return parts.includes(normWord) || norm(ar) === normWord;
  });
}

// Бейты, где упомянуто правило (по полю rl и по списку v правила).
export function versesForRule(id) {
  const s = new Set(RULE[id]?.v || []);
  for (const v of VERSES) if (v.rl?.includes(id)) s.add(v.n);
  return [...s].sort((a, b) => a - b);
}
export function rulesForVerse(n) {
  const s = new Set(V[n].rl || []);
  for (const r of RULES) if (r.v.includes(n)) s.add(r.id);
  return [...s].map((id) => RULE[id]).filter(Boolean);
}
export const sectionVerses = (sec) => Array.from({ length: sec.to - sec.from + 1 }, (_, i) => sec.from + i);
