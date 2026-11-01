// Вход только для администратора. Регистрации нет: прогресс учеников хранится в их браузерах.
// Менять общие данные (записи, тексты, объявление) сервер разрешает только аккаунтам Claude
// с ролью «Редактор» или «Владелец» этой страницы. Логин и пароль — второй замок поверх этого:
// в базе (admin/auth) лежит только хеш пароля PBKDF2-SHA-256 с солью, и читать его могут
// лишь те же администраторы. Самого пароля нет ни в коде, ни в базе.
import { useState, useEffect } from "../lib.js";

const DOC = "admin/auth";
const ITER = 310000;
const SESSION = "jz.admin";

export const A = { ready: false, db: null, user: null, canEdit: false, admin: false, login: "" };
const subs = new Set();
let ver = 0;
const emit = () => { ver++; subs.forEach((fn) => fn()); };
export function useAuth() {
  const [, force] = useState(0);
  const seen = ver;
  useEffect(() => {
    const fn = () => force((x) => x + 1);
    subs.add(fn);
    if (ver !== seen) fn();
    return () => subs.delete(fn);
  }, []);
  return A;
}

const session = {
  get() { try { return sessionStorage.getItem(SESSION); } catch { return null; } },
  set(v) { try { sessionStorage.setItem(SESSION, v); } catch { /* вход продержится до перезагрузки */ } },
  drop() { try { sessionStorage.removeItem(SESSION); } catch { /* нечего удалять */ } },
};

export async function initAuth() {
  if (window.claude?.use) {
    try {
      const [user, db] = await Promise.all([window.claude.use("user"), window.claude.use("db")]);
      A.user = user; A.db = db;
      if (user && db) A.canEdit = !!(await user.canEdit());
      // Вход переживает перезагрузку вкладки, пока не сменился пароль.
      const t = session.get();
      if (A.canEdit && t) {
        const snap = await db.doc(DOC).get();
        if (snap.exists && String(snap.data().t) === t) { A.admin = true; A.login = snap.data().login; }
        else session.drop();
      }
    } catch { /* страница открыта без доступа к данным */ }
  }
  A.ready = true;
  emit();
  return A;
}

// ---------- хеш пароля ----------
const enc = new TextEncoder();
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const normLogin = (x) => x.trim().toLowerCase();
async function derive(password, salt, iter) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  return b64(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: iter }, key, 256));
}
function sameText(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
async function makeRecord(login, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { login: login.trim(), salt: b64(salt), iter: ITER, hash: await derive(password, salt, ITER), t: Date.now() };
}
async function check(rec, login, password) {
  const hash = await derive(password, unb64(rec.salt), rec.iter || ITER);
  return sameText(normLogin(rec.login), normLogin(login)) && sameText(hash, rec.hash);
}
function signIn(rec) {
  session.set(String(rec.t));
  A.admin = true; A.login = rec.login;
  emit();
}

// «unavailable» — страница открыта не в Claude или без входа в аккаунт;
// «setup» — владелец ещё не задал логин и пароль; «login» — обычная форма входа.
export async function adminState() {
  if (!A.db || !A.user) return "unavailable";
  if (!A.canEdit) return "login";
  const snap = await A.db.doc(DOC).get();
  return snap.exists ? "login" : "setup";
}

// После пяти неудачных попыток форма ждёт 30 секунд.
let fails = 0, lockedUntil = 0;
export const lockLeft = () => Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));

export async function loginAdmin(login, password) {
  if (lockLeft()) return "locked";
  let ok = false;
  if (A.canEdit && A.db) {
    const snap = await A.db.doc(DOC).get();
    if (snap.exists) { ok = await check(snap.data(), login, password); if (ok) signIn(snap.data()); }
  } else {
    await new Promise((r) => setTimeout(r, 600));
  }
  if (ok) { fails = 0; return "ok"; }
  if (++fails >= 5) { fails = 0; lockedUntil = Date.now() + 30000; }
  return "wrong";
}

export async function setupAdmin(login, password) {
  if (!A.canEdit) throw Object.assign(new Error("no-rights"), { code: "no-rights" });
  const snap = await A.db.doc(DOC).get();
  if (snap.exists) throw Object.assign(new Error("exists"), { code: "exists" });
  const rec = await makeRecord(login, password);
  await A.db.doc(DOC).set(rec);
  signIn(rec);
}

export async function changeAdmin(current, login, password) {
  const snap = await A.db.doc(DOC).get();
  if (!snap.exists || !(await check(snap.data(), snap.data().login, current))) return false;
  const rec = await makeRecord(login, password);
  await A.db.doc(DOC).set(rec);
  signIn(rec);
  return true;
}

export function logoutAdmin() {
  session.drop();
  A.admin = false; A.login = "";
  emit();
}
