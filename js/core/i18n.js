// Язык интерфейса, язык перевода бейтов и переведённое содержимое.
// Русский встроен; английский, арабский и пословный перевод подгружаются при первом выборе.
import { V, TOK, RULE_CATS, TERM_KINDS, QUIZ, SIFAT, ORGANS } from "../data/index.js";
import { norm } from "./arabic.js";
import { EDIT } from "./content.js";

export const LANGS = [
  { id: "ru", name: "Русский", code: "RU" },
  { id: "en", name: "English", code: "EN" },
  { id: "ar", name: "العربية", code: "ع" },
];
export const TR_LANGS = ["ru", "en"];

export let LANG = "ru"; // язык интерфейса
export let TR = "ru";   // язык перевода бейтов, null — перевод выключен
export let WBW = false; // пословный перевод под арабскими словами

// L("по-русски", "in English", "بالعربية")
export const L = (ru, en, ar) => (LANG === "en" ? en ?? ru : LANG === "ar" ? ar ?? en ?? ru : ru);

export function defaultLang() {
  const n = (navigator.language || "ru").toLowerCase();
  return n.startsWith("ar") ? "ar" : n.startsWith("en") ? "en" : "ru";
}
// «Авто»: русский интерфейс — русский перевод, английский — английский, арабский — без перевода.
export function effectiveTr(p) {
  if (p.trLang === "off") return null;
  if (TR_LANGS.includes(p.trLang)) return p.trLang;
  return p.uiLang === "ar" ? null : p.uiLang === "en" ? "en" : "ru";
}

const PK = { en: null, ar: null, enV: null, gloss: null };
const subs = new Set();
export const onLang = (fn) => { subs.add(fn); return () => subs.delete(fn); };
const notify = () => subs.forEach((fn) => fn());

let loading = Promise.resolve();
export const langReady = () => loading;

export function configure(p) {
  const ui = LANGS.some((l) => l.id === p.uiLang) ? p.uiLang : "ru";
  const tr = effectiveTr({ ...p, uiLang: ui });
  const wbw = !!p.wordByWord && !!tr;
  const changed = ui !== LANG || tr !== TR || wbw !== WBW;
  LANG = ui; TR = tr; WBW = wbw;
  const root = document.documentElement;
  root.lang = ui;
  root.dir = ui === "ar" ? "rtl" : "ltr";
  document.title = ui === "ar" ? "متن الجزرية" : ui === "en" ? "Matn al-Jazariyya" : "Матн аль-Джазария";
  const jobs = [];
  if (ui === "en" && !PK.en) jobs.push(import("../data/pack-en.js").then((m) => { PK.en = m; }));
  if (ui === "ar" && !PK.ar) jobs.push(import("../data/pack-ar.js").then((m) => { PK.ar = m; }));
  if ((ui === "en" || tr === "en") && !PK.enV) jobs.push(import("../data/en-verses.js").then((m) => { PK.enV = m.VERSES_EN; }));
  if (wbw && !PK.gloss) jobs.push(import("../data/words.js").then((m) => { PK.gloss = m.GLOSS; }));
  if (jobs.length) loading = Promise.allSettled(jobs).then(notify);
  else if (changed) notify();
  return loading;
}

const pack = () => (LANG === "en" ? PK.en : LANG === "ar" ? PK.ar : null);

// ---------- бейты ----------
export const bayt = (n) => L(`Бейт ${n}`, `Bayt ${n}`, `البيت ${n}`);
// Перевод бейта: [первое полустишие, второе] или null.
export function vTr(n, lang = TR) {
  if (!lang || !V[n]) return null;
  const e = EDIT[n]?.tr?.[lang];
  if (Array.isArray(e) && e.length === 2) return e;
  if (lang === "ru") return V[n].r;
  return PK.enV?.[n]?.r || null;
}
export function vSharh(n) {
  const e = EDIT[n]?.c?.[LANG];
  if (typeof e === "string" && e) return e;
  if (LANG === "en" && PK.enV?.[n]?.c) return PK.enV[n].c;
  if (LANG === "ar" && PK.ar?.VERSES?.[n]?.c) return PK.ar.VERSES[n].c;
  return V[n].c;
}
// Трудные слова бейта: [[арабское, значение], …] на языке интерфейса.
export function vWords(n) {
  const w = V[n]?.w || [];
  const loc = LANG === "en" ? PK.enV?.[n]?.w : LANG === "ar" ? PK.ar?.VERSES?.[n]?.w : null;
  return loc ? w.map(([a, m], i) => [a, loc[i] || m]) : w;
}
export function meaningsOf(n, normWord) {
  return vWords(n).filter(([ar]) => {
    const k = norm(ar);
    return k === normWord || k.split(/\s+/).includes(normWord);
  });
}
// Пословный перевод слова i полустишия h; "" — у слова нет отдельного перевода.
export function gloss(n, h, i) {
  if (!WBW || !TR || !PK.gloss) return null;
  const line = PK.gloss[TR]?.[`${n}.${h}`];
  if (!line) return null;
  const parts = line.split(" | ");
  if (parts.length !== TOK[n][h].length) return null; // текст бейта отредактирован
  return parts[i] === "—" ? "" : parts[i];
}

// ---------- справочники ----------
export const secName = (s) => (!s ? "" : LANG === "en" ? PK.en?.SECTIONS?.[s.id] || s.ru : LANG === "ar" ? s.ar : s.ru);
export function ruleL(r) {
  if (!r) return r;
  if (LANG === "ru") return { ...r, t: r.ru };
  const p = pack()?.RULES?.[r.id] || {};
  return {
    ...r, t: LANG === "ar" ? r.ar : p.t || r.ru, sum: p.sum || r.sum, body: p.body || r.body,
    ex: r.ex?.map(([a, note], i) => [a, p.ex?.[i] ?? note]),
  };
}
export const catName = (id) => (LANG === "ru" ? RULE_CATS.find((c) => c.id === id)?.ru : pack()?.RULE_CATS?.[id]) || id;
export const kindName = (k) => (LANG === "ru" ? TERM_KINDS[k] : pack()?.TERM_KINDS?.[k]) || TERM_KINDS[k] || k;
// Термин: m — краткое значение, tr — транслитерация, def — определение.
export function termL(t) {
  if (!t) return t;
  if (LANG === "ru") return { ...t, m: t.ru };
  const p = pack()?.GLOSSARY?.[t.id] || {};
  return { ...t, m: p.m || t.ru, tr: LANG === "ar" ? "" : p.tr || t.tr, def: p.def || t.def };
}
export function quizL(secId) {
  const base = QUIZ[secId] || [];
  const p = pack()?.QUIZ?.[secId];
  if (!p) return base;
  return base.map((q, i) => ({ ...q, q: p[i]?.q || q.q, o: p[i]?.o || q.o, e: p[i]?.e ?? (LANG === "ru" ? q.e : undefined) }));
}
export function letterL(l) {
  if (!l || LANG === "ru") return l;
  const p = pack()?.LETTERS?.[l.k] || {};
  return { ...l, name: LANG === "ar" ? l.ar : p.name || l.name, note: l.note ? p.note || l.note : undefined };
}
export function mkhL(m) {
  if (!m) return m;
  if (LANG === "ru") return { ...m, t: m.ru };
  const p = pack()?.MAKHARIJ?.[m.id] || {};
  return { ...m, t: LANG === "ar" ? m.ar : p.t || m.ru, desc: p.desc || m.desc };
}
export function sifaL(id) {
  const s = SIFAT[id];
  if (!s) return null;
  if (LANG === "ru") return { ...s, id, t: s.ru };
  const p = pack()?.SIFAT?.[id] || {};
  return { ...s, id, t: LANG === "ar" ? s.ar : p.t || s.ru, short: p.short || s.short };
}
export const organName = (id) => (LANG === "ar" ? ORGANS[id]?.ar : LANG === "en" ? PK.en?.ORGANS?.[id] : ORGANS[id]?.ru) || ORGANS[id]?.ru || id;

// ---------- форматирование ----------
const LOCALE = { ru: "ru-RU", en: "en-GB", ar: "ar-u-nu-latn" };
export function fmtDate(ts, withTime = true) {
  const opt = withTime ? { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" } : { day: "numeric", month: "short" };
  try { return new Date(ts).toLocaleString(LOCALE[LANG], opt); } catch { return new Date(ts).toLocaleDateString(); }
}
export function fmtDur(sec) {
  sec = Math.round(sec || 0);
  if (sec < 60) return L(`${sec} с`, `${sec} s`, `${sec} ث`);
  const m = Math.floor(sec / 60);
  if (m < 60) return L(`${m} мин`, `${m} min`, `${m} د`);
  const h = Math.floor(m / 60);
  return L(`${h} ч ${m % 60} мин`, `${h} h ${m % 60} min`, `${h} س ${m % 60} د`);
}
// Формы: ru [1, 2–4, 5+], en [1, другие], ar [1, 2, 3–10, 11+].
export function pl(n, ru, en, ar) {
  if (LANG === "en") return n === 1 ? en[0] : en[1];
  if (LANG === "ar") {
    const m = n % 100;
    return n === 1 ? ar[0] : n === 2 ? ar[1] : m >= 3 && m <= 10 ? ar[2] : ar[3];
  }
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return ru[0];
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return ru[1];
  return ru[2];
}
const countAr = (n, forms) => (n === 1 ? `${forms[0]} واحد` : n === 2 ? forms[1] : `${n} ${n === 0 ? forms[2] : pl(n, [], [], forms)}`);
export const nBayt = (n) => (LANG === "ar" ? countAr(n, ["بيت", "بيتان", "أبيات", "بيتًا"]) : `${n} ${pl(n, ["бейт", "бейта", "бейтов"], ["bayt", "bayts"], [])}`);
export const nQuestion = (n) => (LANG === "ar" ? countAr(n, ["سؤال", "سؤالان", "أسئلة", "سؤالًا"]) : `${n} ${pl(n, ["вопрос", "вопроса", "вопросов"], ["question", "questions"], [])}`);
export const nDay = (n) => (LANG === "ar" ? countAr(n, ["يوم", "يومان", "أيام", "يومًا"]) : `${n} ${pl(n, ["день", "дня", "дней"], ["day", "days"], [])}`);
export const nFile = (n) => (LANG === "ar" ? countAr(n, ["ملف", "ملفان", "ملفات", "ملفًا"]) : `${n} ${pl(n, ["файл", "файла", "файлов"], ["file", "files"], [])}`);
export const nLesson = (n) => (LANG === "ar" ? countAr(n, ["درس", "درسان", "دروس", "درسًا"]) : `${n} ${pl(n, ["урок", "урока", "уроков"], ["lesson", "lessons"], [])}`);
