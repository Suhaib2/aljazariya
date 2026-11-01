// Редакционные правки администратора (текст, переводы, шарх бейтов), объявление и почта сайта.
// Правки лежат в db edits/v<N> и применяются поверх встроенного текста у всех.
// Формат: { a:[2], tr:{ ru:[2], en:[2] }, c:{ ru, en, ar } }; старый { r:[2], c:"…" } — это русский.
import { useState, useEffect } from "../lib.js";
import { V, rebuildVerse } from "../data/index.js";
import { CONTACT_EMAIL } from "../config.js";

export const C = { edits: {}, notice: null, site: {}, ver: 0 };
export const contactEmail = () => C.site.email || CONTACT_EMAIL;
export const EDIT = {};
const ORIG = {};
const subs = new Set();
const emit = () => { C.ver++; subs.forEach((fn) => fn()); };
export function useContent() {
  const [, force] = useState(0);
  const seen = C.ver;
  useEffect(() => {
    const fn = () => force((x) => x + 1);
    subs.add(fn);
    if (C.ver !== seen) fn();
    return () => subs.delete(fn);
  }, []);
  return C;
}

const pair = (x) => (Array.isArray(x) && x.length === 2 && x.every((s) => typeof s === "string") ? x : null);
const str = (x) => (typeof x === "string" && x.trim() ? x : null);
export function normEdit(e = {}) {
  const tr = e.tr && typeof e.tr === "object" ? e.tr : {};
  const c = typeof e.c === "string" ? { ru: e.c } : e.c && typeof e.c === "object" ? e.c : {};
  return {
    a: pair(e.a),
    tr: { ru: pair(tr.ru) || pair(e.r), en: pair(tr.en) },
    c: { ru: str(c.ru), en: str(c.en), ar: str(c.ar) },
  };
}

function apply(n, raw) {
  if (!ORIG[n]) ORIG[n] = { a: [...V[n].a], r: [...V[n].r], c: V[n].c };
  const o = ORIG[n], e = normEdit(raw);
  EDIT[n] = e;
  V[n].a = e.a || o.a;
  V[n].r = e.tr.ru || o.r;
  V[n].c = e.c.ru || o.c;
  rebuildVerse(n);
}
function restore(n) {
  delete EDIT[n];
  const o = ORIG[n];
  if (!o) return;
  V[n].a = o.a; V[n].r = o.r; V[n].c = o.c;
  rebuildVerse(n);
}
export const original = (n) => ORIG[n] || { a: V[n].a, r: V[n].r, c: V[n].c };

let db = null;
export function initContent(database) {
  if (!database) return;
  db = database;
  db.collection("edits").onSnapshot((snap) => {
    const next = {};
    for (const d of snap.docs) { const n = +d.id.replace(/^v/, ""); if (n >= 1 && n <= 109) next[n] = d.data(); }
    for (const n of Object.keys(C.edits)) if (!next[n]) restore(+n);
    for (const [n, e] of Object.entries(next)) apply(+n, e);
    C.edits = next;
    emit();
  }, () => {});
  db.doc("shared/notice").onSnapshot((snap) => { C.notice = snap.exists ? snap.data() : null; emit(); }, () => {});
  db.doc("shared/site").onSnapshot((snap) => { C.site = snap.exists ? snap.data() : {}; emit(); }, () => {});
}

export async function saveEdit(n, body) { await db.doc(`edits/v${n}`).set({ ...body, t: Date.now() }); }
export async function resetEdit(n) { await db.doc(`edits/v${n}`).delete(); }
export async function saveNotice(text) {
  if (text.trim()) await db.doc("shared/notice").set({ text: text.trim(), t: Date.now() });
  else await db.doc("shared/notice").delete();
}
export async function saveSite(patch) { await db.doc("shared/site").set({ ...C.site, ...patch, t: Date.now() }); }
