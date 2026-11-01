// Маршруты — простые якоря (#read, #v12, #rule-ra), чтобы ссылку на раздел можно было отправить.
import { useState, useEffect } from "../lib.js";
import { SHOW_ADMIN } from "../config.js";

// Разделы с простыми адресами; админ-панель — только если она включена (SHOW_ADMIN в config.js).
const PAGES = ["read", "lessons", "makharij", "rules", "dict", "memorize", "review", "tests", "listen", "profile", "options", ...(SHOW_ADMIN ? ["admin"] : [])];

export function parse(hash) {
  const t = decodeURIComponent((hash || "").replace(/^#/, ""));
  let m;
  if (!t || t === "home") return { name: "home" };
  if ((m = t.match(/^v(\d{1,3})$/))) return { name: "study", n: +m[1] };
  if ((m = t.match(/^rule-([a-z_]+)$/))) return { name: "rule", id: m[1] };
  if ((m = t.match(/^test-([a-z]+)$/))) return { name: "test", id: m[1] };
  if ((m = t.match(/^sec-([a-z]+)$/))) return { name: "read", sec: m[1] };
  if (PAGES.includes(t)) return { name: t };
  return { name: "home" };
}

let R = { ...parse(location.hash), state: {} };
const subs = new Set();
const notify = () => subs.forEach((fn) => fn());

export function go(token, state = {}) {
  R = { ...parse("#" + token), state, token };
  try { history.pushState(state, "", "#" + token); } catch { /* в песочнице адрес может не меняться */ }
  notify();
  if (!state.keepScroll) window.scrollTo({ top: 0, behavior: "instant" in document.documentElement.style ? "instant" : "auto" });
}
export const back = () => { try { history.back(); } catch { go("home"); } };
export const route = () => R;

window.addEventListener("popstate", (e) => { R = { ...parse(location.hash), state: e.state || {} }; notify(); });

export function useRoute() {
  const [, force] = useState(0);
  useEffect(() => { const fn = () => force((x) => x + 1); subs.add(fn); return () => subs.delete(fn); }, []);
  return R;
}
