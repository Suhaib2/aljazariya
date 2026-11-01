// Preact + htm (UMD-сборка, подключена в index.html) и мелкие утилиты.
const P = window.htmPreact;
if (!P) throw new Error("Preact не загрузился");

export const { html, render, h, Component, createContext, useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback, useContext } = P;

export const cx = (...a) => a.filter(Boolean).join(" ");
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

export function debounce(fn, ms) {
  let t;
  const d = (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  d.flush = (...args) => { clearTimeout(t); fn(...args); };
  return d;
}

export function shuffle(arr, seed) {
  const a = arr.slice();
  let s = seed ?? Math.floor(Math.random() * 1e9);
  const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function useMedia(query) {
  const get = () => (window.matchMedia ? window.matchMedia(query).matches : false);
  const [m, setM] = useState(get);
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia(query);
    const on = () => setM(mq.matches);
    mq.addEventListener ? mq.addEventListener("change", on) : mq.addListener(on);
    on();
    return () => (mq.removeEventListener ? mq.removeEventListener("change", on) : mq.removeListener(on));
  }, [query]);
  return m;
}

export function fmtClock(sec) {
  sec = Math.max(0, Math.round(sec || 0));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}
export function loadScript(src) {
  return new Promise((res, rej) => {
    const ex = document.querySelector(`script[data-src="${src}"]`);
    if (ex) { ex.dataset.loaded ? res() : ex.addEventListener("load", () => res()); return; }
    const s = document.createElement("script");
    s.src = src; s.async = true; s.dataset.src = src;
    s.onload = () => { s.dataset.loaded = "1"; res(); };
    s.onerror = () => rej(new Error("Не удалось загрузить " + src));
    document.head.appendChild(s);
  });
}
