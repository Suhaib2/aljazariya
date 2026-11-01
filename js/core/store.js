// Состояние ученика: прогресс, повторения, прослушивание, история.
// Хранится только в этом браузере (localStorage): на другом устройстве или после
// очистки данных сайта прогресс начинается заново.
import { useState, useEffect, useRef } from "../lib.js";
import { TOTAL, SECTIONS, sectionVerses } from "../data/index.js";
import { L, configure, defaultLang } from "./i18n.js";

const DAY = 86400000;
const KEYS = { s: "jz.state.v1", h: "jz.history.v1" };

// Все настройки живут здесь и меняются только на странице «Настройки».
// mode: "both" — арабский и перевод, "tr" — только перевод; trLang: auto | ru | en | off.
// Чтеца и число повторов можно поменять и прямо в плеере.
export const DEFAULT_PREFS = {
  uiLang: defaultLang(), trLang: "auto", wordByWord: false,
  theme: "auto", font: "naskh", size: 30, mode: "both", layout: "pair", terms: true,
  reciter: "auto", speed: 1, repeat: 1, autoNext: false, lineHL: true, follow: true, pauseSec: 1,
  hideRu: false, hideLevel: 0, firstLetters: false, audioOnly: false, clickHide: false,
  model: "2d", mkLabels: true, listenText: true,
};
// Старые настройки: mode "ar" значил «только арабский», "ru" — «только перевод».
function migratePrefs(raw) {
  const p = { ...raw };
  if (p.trLang === undefined) {
    if (p.mode === "ar") { p.trLang = "off"; p.mode = "both"; }
    else if (p.mode === "ru") p.mode = "tr";
  }
  if (p.mode !== "both" && p.mode !== "tr") p.mode = "both";
  delete p.exam; delete p.name; delete p.listenRepeat;
  // Синтез речи убран: его выбор становится основным чтецом, голос синтеза больше не нужен.
  if (p.reciter === "tts") p.reciter = "auto";
  delete p.voice;
  return p;
}

const freshS = () => ({
  updatedAt: 0, prefs: { ...DEFAULT_PREFS }, verses: {}, bookmarks: {}, favorites: {}, tests: {},
  ach: {}, daily: {}, goal: { learn: 2, review: 5, listen: 10 }, last: 1, xp: 0,
  stats: { listenSec: 0, listened: {}, recordings: 0, letters: {}, reviews: 0, checks: 0 },
});
const freshH = () => ({ updatedAt: 0, listen: [], study: [] });

const ls = {
  get(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* приватный режим или квота */ } },
};

function hydrate(base, raw) {
  if (!raw || typeof raw !== "object") return base;
  const out = { ...base, ...raw };
  if (base.prefs) out.prefs = migratePrefs({ ...base.prefs, ...(raw.prefs || {}) });
  if (base.stats) out.stats = { ...base.stats, ...(raw.stats || {}) };
  if (base.goal) out.goal = { ...base.goal, ...(raw.goal || {}) };
  return out;
}

let S = hydrate(freshS(), ls.get(KEYS.s));
let H = hydrate(freshH(), ls.get(KEYS.h));
delete S.exams;
if (S.ach) { S.ach = { ...S.ach }; delete S.ach.exam; delete S.ach.notes; }
// Заметок больше нет: старые записи удаляются из браузера.
try { localStorage.removeItem("jz.notes.v1"); } catch { /* хранилище недоступно */ }

export const D = { get s() { return S; }, get h() { return H; } };

// ---------- подписки ----------
const subs = new Set();
function emit() { for (const fn of [...subs]) fn(); }
export function subscribe(fn) { subs.add(fn); return () => subs.delete(fn); }

export function useSel(sel) {
  const [, force] = useState(0);
  const selRef = useRef(sel);
  selRef.current = sel;
  const value = sel(D);
  const last = useRef(value);
  last.current = value;
  useEffect(() => {
    const check = () => {
      const v = selRef.current(D);
      if (!Object.is(v, last.current)) { last.current = v; force((x) => x + 1); }
    };
    const off = subscribe(check);
    check();
    return off;
  }, []);
  return value;
}

function commit(keys) {
  const now = Date.now();
  if (keys.includes("s")) { S = { ...S, updatedAt: now }; ls.set(KEYS.s, S); }
  if (keys.includes("h")) { H = { ...H, updatedAt: now }; ls.set(KEYS.h, H); }
  if (keys.includes("s")) checkAchievements();
  emit();
}

// ---------- оформление ----------
export function applyPrefs() {
  const p = S.prefs, root = document.documentElement;
  configure(p);
  if (p.theme === "light" || p.theme === "dark") root.setAttribute("data-theme", p.theme);
  else root.removeAttribute("data-theme");
  root.style.setProperty("--ar-size", `${p.size}px`);
  document.body.classList.toggle("ruqaa", p.font === "ruqaa");
}

// ---------- производные ----------
export const todayKey = (t = Date.now()) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const statusOf = (n, s = S) => s.verses[n]?.s || 0;
export const learnedCount = (s = S) => Object.values(s.verses).filter((v) => v.s === 2).length;
export const learningCount = (s = S) => Object.values(s.verses).filter((v) => v.s === 1).length;
export function sectionProgress(sec, s = S) {
  const list = sectionVerses(sec);
  const learned = list.filter((n) => s.verses[n]?.s === 2).length;
  const learning = list.filter((n) => s.verses[n]?.s === 1).length;
  return { total: list.length, learned, learning, pct: Math.round((learned / list.length) * 100) };
}
export function dueList(s = S, now = Date.now()) {
  return Object.entries(s.verses).filter(([, v]) => v.s === 2 && v.srs && v.srs.due <= now).map(([n]) => +n).sort((a, b) => a - b);
}
export function streak(s = S) {
  let d = new Date(); let count = 0;
  const has = (k) => (s.daily[k]?.xp || 0) > 0;
  if (!has(todayKey(d.getTime()))) d = new Date(d.getTime() - DAY);
  while (has(todayKey(d.getTime()))) { count++; d = new Date(d.getTime() - DAY); }
  return count;
}
export const LEVELS = [
  { xp: 0, ru: "Начинающий", en: "Beginner", ar: "مُبْتَدِئ" }, { xp: 100, ru: "Ученик", en: "Student", ar: "طَالِب" },
  { xp: 300, ru: "Усердный", en: "Diligent", ar: "مُجْتَهِد" }, { xp: 700, ru: "Знающий", en: "Knowledgeable", ar: "عَارِف" },
  { xp: 1300, ru: "Хранитель", en: "Keeper", ar: "حَافِظ" }, { xp: 2200, ru: "Мастер", en: "Master", ar: "مُتْقِن" },
  { xp: 3500, ru: "Знаток", en: "Expert", ar: "مُحَقِّق" },
];
export const levelName = (lv) => L(lv.ru, lv.en, lv.ar);
export function levelOf(xp) {
  let i = 0;
  while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1].xp) i++;
  const cur = LEVELS[i], next = LEVELS[i + 1];
  return { i, ...cur, next, pct: next ? Math.round(((xp - cur.xp) / (next.xp - cur.xp)) * 100) : 100 };
}
export function sectionRating(sec, s = S) {
  const p = sectionProgress(sec, s);
  const test = s.tests[sec.id]?.best || 0;
  const score = Math.round(p.pct * 0.6 + test * 0.4);
  const stars = score >= 90 ? 3 : score >= 60 ? 2 : score >= 25 ? 1 : 0;
  const label = [L("Не начат", "Not started", "لم يبدأ"), L("Начало положено", "Off to a start", "بداية طيبة"), L("Хорошо", "Good", "جيد"), L("Отлично", "Excellent", "ممتاز")][stars];
  return { ...p, test, score, stars, label };
}

// ---------- достижения ----------
export const ACH = [
  { id: "start", t: ["Бисмилля", "Bismillah", "بسم الله"], d: ["Начать изучение: открыть первый бейт", "Begin: open your first bayt", "ابدأ: افتح أول بيت"], ico: "spark", test: (s) => Object.keys(s.verses).length > 0 || s.stats.listenSec > 0 },
  { id: "first", t: ["Первый бейт", "First bayt", "البيت الأول"], d: ["Выучить первый бейт", "Learn your first bayt", "احفظ أول بيت"], ico: "check", test: (s) => learnedCount(s) >= 1 },
  { id: "ten", t: ["Десять бейтов", "Ten bayts", "عشرة أبيات"], d: ["Выучить 10 бейтов", "Learn 10 bayts", "احفظ 10 أبيات"], ico: "layers", test: (s) => learnedCount(s) >= 10 },
  { id: "half", t: ["Половина пути", "Halfway", "نصف الطريق"], d: ["Выучить 55 бейтов", "Learn 55 bayts", "احفظ 55 بيتًا"], ico: "target", test: (s) => learnedCount(s) >= 55 },
  { id: "hafiz", t: ["Хафиз аль-Джазарии", "Hafiz of the Jazariyya", "حافظ الجزرية"], d: ["Выучить все 109 бейтов", "Learn all 109 bayts", "احفظ الأبيات الـ109 كلها"], ico: "trophy", test: (s) => learnedCount(s) >= TOTAL },
  { id: "mkh", t: ["Знаток махраджей", "Makharij expert", "عارف المخارج"], d: ["Выучить раздел о махраджах (бейты 9–19)", "Learn the makharij section (bayts 9–19)", "احفظ باب المخارج (الأبيات 9–19)"], ico: "head", test: (s) => sectionProgress(SECTIONS[1], s).pct === 100 },
  { id: "sfa", t: ["Мастер сифатов", "Sifat master", "متقن الصفات"], d: ["Выучить раздел о сифатах (бейты 20–26)", "Learn the sifat section (bayts 20–26)", "احفظ باب الصفات (الأبيات 20–26)"], ico: "zap", test: (s) => sectionProgress(SECTIONS[2], s).pct === 100 },
  { id: "listen50", t: ["Внимательный слушатель", "Attentive listener", "مستمع منتبه"], d: ["Прослушать 50 бейтов", "Listen to 50 bayts", "استمع إلى 50 بيتًا"], ico: "headphones", test: (s) => Object.values(s.stats.listened).reduce((a, b) => a + b, 0) >= 50 },
  { id: "listenAll", t: ["Весь матн", "The whole matn", "المتن كاملًا"], d: ["Прослушать каждый из 109 бейтов", "Listen to each of the 109 bayts", "استمع إلى كل الأبيات الـ109"], ico: "book", test: (s) => Object.keys(s.stats.listened).length >= TOTAL },
  { id: "streak7", t: ["Неделя усердия", "A week of effort", "أسبوع اجتهاد"], d: ["Заниматься 7 дней подряд", "Study 7 days in a row", "ادرس 7 أيام متتالية"], ico: "flame", test: (s) => streak(s) >= 7 },
  { id: "streak30", t: ["Месяц усердия", "A month of effort", "شهر اجتهاد"], d: ["Заниматься 30 дней подряд", "Study 30 days in a row", "ادرس 30 يومًا متتالية"], ico: "flame", test: (s) => streak(s) >= 30 },
  { id: "perfect", t: ["Без ошибок", "Flawless", "بلا أخطاء"], d: ["Пройти тест раздела на 100%", "Score 100% on a section test", "احصل على 100% في اختبار باب"], ico: "star", test: (s) => Object.values(s.tests).some((t) => t.best >= 100) },
  { id: "allTests", t: ["Все разделы", "All sections", "كل الأبواب"], d: ["Пройти тесты всех 17 разделов на 70% и выше", "Score 70% or more on all 17 section tests", "احصل على 70% فأكثر في اختبارات الأبواب الـ17"], ico: "grid", test: (s) => SECTIONS.every((sec) => (s.tests[sec.id]?.best || 0) >= 70) },
  { id: "anatomy", t: ["Анатом", "Anatomist", "عالم التشريح"], d: ["Изучить 15 букв на модели махраджей", "Explore 15 letters on the makharij model", "تعرّف على 15 حرفًا على نموذج المخارج"], ico: "head", test: (s) => Object.keys(s.stats.letters).length >= 15 },
  { id: "goal", t: ["Цель дня", "Daily goal", "هدف اليوم"], d: ["Выполнить ежедневную цель", "Complete the daily goal", "حقّق الهدف اليومي"], ico: "target", test: (s) => Object.values(s.daily).some((d) => d.goalMet) },
  { id: "review30", t: ["Повторение — мать учения", "Repetition is the mother of learning", "التكرار أمّ التعلّم"], d: ["Повторить 30 бейтов", "Review 30 bayts", "راجع 30 بيتًا"], ico: "repeat", test: (s) => (s.stats.reviews || 0) >= 30 },
];
export const achText = (a) => ({ t: L(...a.t), d: L(...a.d) });
let onAchieve = () => {};
export const setAchievementHandler = (fn) => { onAchieve = fn; };
function checkAchievements() {
  const got = [];
  for (const a of ACH) if (!S.ach[a.id] && a.test(S)) got.push(a);
  if (!got.length) return;
  const ach = { ...S.ach };
  for (const a of got) ach[a.id] = Date.now();
  S = { ...S, ach };
  ls.set(KEYS.s, S);
  got.forEach((a) => onAchieve(a));
}

// ---------- день и опыт ----------
let onGoal = () => {};
export const setGoalHandler = (fn) => { onGoal = fn; };
function bumpDay(fields) {
  const k = todayKey();
  const d = { ...(S.daily[k] || {}) };
  for (const [f, v] of Object.entries(fields)) d[f] = (d[f] || 0) + v;
  const g = S.goal;
  if (!d.goalMet && (d.learned || 0) >= g.learn && (d.reviewed || 0) >= g.review && (d.listenSec || 0) >= g.listen * 60) { d.goalMet = true; setTimeout(onGoal, 50); }
  let daily = { ...S.daily, [k]: d };
  const keys = Object.keys(daily).sort();
  if (keys.length > 400) daily = Object.fromEntries(keys.slice(-400).map((x) => [x, daily[x]]));
  S = { ...S, daily, xp: S.xp + (fields.xp || 0) };
}
function logStudy(type, n, extra = {}) {
  H = { ...H, study: [{ t: Date.now(), type, n, ...extra }, ...H.study].slice(0, 400) };
}
function patchVerse(n, patch) {
  S = { ...S, verses: { ...S.verses, [n]: { ...(S.verses[n] || {}), ...patch } } };
}

// ---------- действия ----------
export const act = {
  setPref(k, v) { S = { ...S, prefs: { ...S.prefs, [k]: v } }; applyPrefs(); commit("s"); },
  setPrefs(p) { S = { ...S, prefs: { ...S.prefs, ...p } }; applyPrefs(); commit("s"); },
  setGoal(p) { S = { ...S, goal: { ...S.goal, ...p } }; commit("s"); },
  openVerse(n) {
    const v = S.verses[n];
    const recent = H.study.find((e) => e.type === "open" && e.n === n && Date.now() - e.t < 3600000);
    if (!v) patchVerse(n, { s: 0, t: Date.now() });
    S = { ...S, last: n };
    if (!recent) { logStudy("open", n); bumpDay({ studied: 1, xp: 2 }); commit("sh"); } else commit("s");
  },
  setStatus(n, st) {
    const prev = statusOf(n);
    if (prev === st) return;
    const patch = { s: st, t: Date.now() };
    if (st === 2) patch.srs = { iv: 1, due: Date.now() + DAY, reps: 0 };
    if (st < 2) patch.srs = null;
    patchVerse(n, patch);
    if (st === 2) bumpDay({ learned: 1, xp: 20 }); else bumpDay({ xp: 1 });
    logStudy("status", n, { s: st });
    commit("sh");
  },
  review(n, grade) {
    const v = S.verses[n] || {};
    const srs = { ...(v.srs || { iv: 1, reps: 0 }) };
    if (grade === 0) { srs.iv = 1; srs.reps = 0; srs.lapses = (srs.lapses || 0) + 1; }
    else if (grade === 1) { srs.iv = Math.max(1, Math.round(srs.iv * 1.3)); srs.reps++; }
    else { srs.iv = srs.reps === 0 ? 3 : Math.round(srs.iv * 2.5); srs.reps++; }
    srs.due = Date.now() + srs.iv * DAY;
    patchVerse(n, { s: 2, srs, t: Date.now() });
    S = { ...S, stats: { ...S.stats, reviews: (S.stats.reviews || 0) + 1 } };
    bumpDay({ reviewed: 1, xp: 5 });
    logStudy("review", n, { g: grade });
    commit("sh");
  },
  toggleBookmark(n, label = "") {
    const b = { ...S.bookmarks };
    if (b[n]) delete b[n]; else b[n] = { t: Date.now(), label };
    S = { ...S, bookmarks: b }; commit("s");
  },
  labelBookmark(n, label) { if (!S.bookmarks[n]) return; S = { ...S, bookmarks: { ...S.bookmarks, [n]: { ...S.bookmarks[n], label } } }; commit("s"); },
  toggleFavorite(n) {
    const f = { ...S.favorites };
    if (f[n]) delete f[n]; else f[n] = Date.now();
    S = { ...S, favorites: f }; commit("s");
  },
  logListen(n, sec, src) {
    if (sec < 2) return;
    H = { ...H, listen: [{ t: Date.now(), n, d: Math.round(sec), src }, ...H.listen].slice(0, 400) };
    const listened = { ...S.stats.listened, [n]: (S.stats.listened[n] || 0) + 1 };
    S = { ...S, stats: { ...S.stats, listenSec: S.stats.listenSec + sec, listened } };
    bumpDay({ listenSec: Math.round(sec), xp: 1 });
    commit("sh");
  },
  logCheck(n, kind, pct) {
    S = { ...S, stats: { ...S.stats, checks: (S.stats.checks || 0) + 1 } };
    bumpDay({ xp: pct >= 90 ? 5 : 2 });
    logStudy("check", n, { kind, pct });
    if (pct >= 60 && statusOf(n) === 0) patchVerse(n, { s: 1, t: Date.now() });
    commit("sh");
  },
  logLetter(k) {
    if (S.stats.letters[k]) return;
    S = { ...S, stats: { ...S.stats, letters: { ...S.stats.letters, [k]: Date.now() } } };
    commit("s");
  },
  saveTest(secId, pct, total) {
    const prev = S.tests[secId] || { best: 0, n: 0 };
    S = { ...S, tests: { ...S.tests, [secId]: { best: Math.max(prev.best, pct), last: pct, n: prev.n + 1, t: Date.now() } } };
    bumpDay({ xp: Math.round(pct / 10) + 3 });
    logStudy("test", null, { sec: secId, pct, total });
    commit("sh");
  },
};
