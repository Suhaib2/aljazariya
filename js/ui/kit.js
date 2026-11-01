// Общие элементы интерфейса: иконки, переключатели, всплывающие окна, уведомления.
import { html, useState, useEffect, useRef, cx } from "../lib.js";
import { go } from "../core/nav.js";
import { L, LANG } from "../core/i18n.js";

const I = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  book: "M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5zM5 19.5A1.5 1.5 0 0 0 6.5 21H19M9 7h6M9 10.5h6",
  head: "M9 21v-3.3A7 7 0 1 1 19.2 10l1.6 3a.6.6 0 0 1-.5.9H19v2.6a1.5 1.5 0 0 1-1.5 1.5H15V21M13 9.5c1.1 0 2 .6 2.4 1.4",
  layers: "m12 3 9 5-9 5-9-5zM3 12.5l9 5 9-5M3 16.5l9 5 9-5",
  tests: "M4 4h16v16H4zM8 12l3 3 5-6",
  headphones: "M3 15v-3a9 9 0 0 1 18 0v3M3 15h3v6H4.5A1.5 1.5 0 0 1 3 19.5zM21 15h-3v6h1.5a1.5 1.5 0 0 0 1.5-1.5z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1.5v2M12 20.5v2M4.6 4.6 6 6M18 18l1.4 1.4M1.5 12h2M20.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4",
  moon: "M20.5 13A8.5 8.5 0 1 1 11 3.5a6.6 6.6 0 0 0 9.5 9.5z",
  type: "M4 7V4.5h16V7M9.5 20h5M12 4.5V20",
  sliders: "M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1.5 14h5M9.5 8h5M17.5 16h5",
  play: "M7.5 4.6v14.8a.8.8 0 0 0 1.2.7l11.6-7.4a.8.8 0 0 0 0-1.4L8.7 3.9a.8.8 0 0 0-1.2.7z",
  pause: "M7 4h3.4v16H7zM13.6 4H17v16h-3.4z",
  prev: "M18 5.5v13L9 12zM6 5v14",
  next: "M6 5.5v13l9-6.5zM18 5v14",
  repeat: "M17 2l4 4-4 4M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3",
  bookmark: "M6 3.5h12v17l-6-4-6 4z",
  star: "m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z",
  note: "M4 20h4L19 9l-4-4L4 16zM14 6l4 4",
  mic: "M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zM19 11a7 7 0 0 1-14 0M12 18v3",
  stop: "M6.5 6.5h11v11h-11z",
  x: "M6 6l12 12M18 6 6 18",
  chevL: "m15 18-6-6 6-6", chevR: "m9 18 6-6-6-6", chevD: "m6 9 6 6 6-6", chevU: "m6 15 6-6 6 6",
  check: "m5 12.5 4.5 4.5L19 7",
  flame: "M12 22c4 0 7-2.7 7-7 0-3-2-5.5-3.5-7 0 2-1 3.5-2.5 4 .5-3-1-6.5-4-9 0 4-5 6.5-5 12 0 4.3 3 7 8 7z",
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM12 12.5v-1",
  trophy: "M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5.5M12 7.8v.4",
  eye: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  eyeOff: "M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2",
  shuffle: "M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5",
  keyboard: "M3 6h18v12H3zM7 10h.01M11 10h.01M15 10h.01M17 10h.01M7 14h10",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3.2 2",
  download: "M12 3v12M7 10.5l5 5 5-5M4 21h16",
  upload: "M12 21V9M7 13.5l5-5 5 5M4 3h16",
  cloud: "M7 18.5a4.5 4.5 0 1 1 .8-8.9A6 6 0 0 1 19.2 11a3.8 3.8 0 0 1-.7 7.5z",
  list: "M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01",
  grid: "M4 4h6.5v6.5H4zM13.5 4H20v6.5h-6.5zM4 13.5h6.5V20H4zM13.5 13.5H20V20h-6.5z",
  arrowL: "M19 12H5M11 18l-6-6 6-6",
  spark: "M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8",
  volume: "M4 9.5v5h3.5L13 19V5L7.5 9.5zM16.5 9a4 4 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11",
  help: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.2a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1 1-1.1 1.7v.6M12 16.8v.4",
  dict: "M2.5 5H9a3 3 0 0 1 3 3v12a2.5 2.5 0 0 0-2.5-2.5h-7zM21.5 5H15a3 3 0 0 0-3 3v12a2.5 2.5 0 0 1 2.5-2.5h7z",
  scroll: "M8 3h11v14.5a3.5 3.5 0 0 1-3.5 3.5H6.5A3.5 3.5 0 0 1 3 17.5V16h11v1.5a3.5 3.5 0 0 0 3.5 3.5M8 3a3 3 0 0 0-3 3v10M11 7.5h5M11 11.5h5",
  cube: "m12 2.5 8.5 4.8v9.4L12 21.5l-8.5-4.8V7.3zM12 21.5V12M20.5 7.3 12 12 3.5 7.3",
  square: "M4.5 4.5h15v15h-15zM4.5 12h15M12 4.5v15",
  zap: "M13 2 3.5 14H12l-1 8 9.5-12H12z",
  rotate: "M20.5 12a8.5 8.5 0 1 1-2.6-6.1L20.5 8.5M20.5 3.5v5h-5",
  trash: "M4 7h16M10 11v6M14 11v6M5.5 7l1 13h11l1-13M9 7V4h6v3",
  plus: "M12 5v14M5 12h14",
  send: "M21.5 2.5 10.5 13.5M21.5 2.5 15 21l-4.5-7.5L3 9z",
  edit: "M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z",
  sound: "M3 10v4M7 7v10M11 4v16M15 8v8M19 11v2",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3.5 9h17M3.5 15h17M12 3a13.5 13.5 0 0 1 0 18M12 3a13.5 13.5 0 0 0 0 18",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  words: "M3 5h8M7 5v7M4.5 12h5M13 19l4-10 4 10M14.5 15.5h5M3 19h7",
  lock: "M5.5 11h13v10h-13zM8.5 11V7.5a3.5 3.5 0 0 1 7 0V11M12 15v2",
  mail: "M3 5.5h18v13H3zM3.5 6l8.5 7 8.5-7",
  copy: "M8.5 8.5h11.5v11.5H8.5zM15.5 8.5V4H4v11.5h4.5",
  logout: "M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15M10 16l4-4-4-4M14 12H4",
  lesson: "M3 5h18v14H3zM10 9v6l5-3z",
  external: "M14 4h6v6M20 4l-9 9M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10",
};
const FILLED = new Set(["play", "pause"]);
// В арабском интерфейсе стрелки «назад/вперёд» зеркалятся.
const MIRROR = new Set(["chevL", "chevR", "arrowL", "logout"]);

export function Icon({ name, fill, size }) {
  const d = I[name] || I.info;
  const filled = fill ?? FILLED.has(name);
  return html`<svg class=${MIRROR.has(name) ? "ico flip" : "ico"} viewBox="0 0 24 24" width=${size} height=${size} fill=${filled ? "currentColor" : "none"} stroke=${filled ? "none" : "currentColor"}
    stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d=${d} /></svg>`;
}

export function Seg({ value, options, onChange, label, small }) {
  return html`<div class="seg" role="group" aria-label=${label}>
    ${options.map((o) => html`<button type="button" aria-pressed=${String(o.v === value)} title=${o.title || ""} onClick=${() => onChange(o.v)}
      style=${small ? "padding:5px 9px;font-size:13px" : ""}>${o.label}</button>`)}
  </div>`;
}

export function Toggle({ checked, onChange, label, id }) {
  return html`<label class="toggle"><input type="checkbox" id=${id} checked=${checked} onChange=${(e) => onChange(e.currentTarget.checked)} />${label}</label>`;
}

export const Bar = ({ pct, kind }) => html`<div class=${cx("bar", kind)}><i style=${`width:${Math.max(0, Math.min(100, pct))}%`}></i></div>`;
export const Ring = ({ pct, label, color }) => html`<div class="ring" style=${`--p:${Math.min(100, pct)};${color ? `--c:${color}` : ""}`}><span>${label}</span></div>`;

// Текст с арабскими вставками и ссылками на бейты («бейт 12», «bayts 41–43», «البيت 30»).
const AR_RUN = /([؀-ۿﷺ][؀-ۿً-ٰٟﷺ‍ ]*[؀-ۿً-ٰٟﷺ]|[؀-ۿﷺ])/g;
// В арабском тексте отдельным шрифтом выделяются только цитаты в «…».
const AR_QUOTE = /«[^»]+»/g;
const VREF = /((?:бейт(?:ы|ах|ам|ов|е|а)?|bayts?|البيت(?:ان|ين)?|الأبيات)\s+)(\d{1,3})(?:\s*[–-]\s*(\d{1,3}))?/gi;
function arabize(text, keyBase) {
  const out = [];
  let last = 0, m, k = 0;
  const re = LANG === "ar" ? AR_QUOTE : AR_RUN;
  re.lastIndex = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(html`<bdi key=${keyBase + "a" + k++} class="ar-inline" lang="ar">${m[0]}</bdi>`);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
export function RichText({ text, links = true }) {
  if (!text) return null;
  if (!links) return arabize(text, "r");
  const out = [];
  let last = 0, m, k = 0;
  VREF.lastIndex = 0;
  while ((m = VREF.exec(text))) {
    const a = +m[2], b = m[3] ? +m[3] : null;
    if (a < 1 || a > 109) continue;
    if (m.index > last) out.push(...arabize(text.slice(last, m.index), "s" + k));
    out.push(m[1]);
    out.push(html`<a key=${"v" + k++} href=${"#v" + a} onClick=${(e) => { e.preventDefault(); go("v" + a); }}>${a}</a>`);
    if (b) { out.push("–"); out.push(html`<a key=${"v" + k++} href=${"#v" + b} onClick=${(e) => { e.preventDefault(); go("v" + b); }}>${b}</a>`); }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(...arabize(text.slice(last), "e" + k));
  return out;
}

// ---------- уведомления ----------
let pushToast = () => {};
export function toast(msg, opts = {}) { pushToast({ id: Math.random(), msg, ...opts }); }
export function ToastHost() {
  const [list, setList] = useState([]);
  useEffect(() => {
    pushToast = (t) => {
      setList((l) => [...l.slice(-2), t]);
      setTimeout(() => setList((l) => l.filter((x) => x.id !== t.id)), t.ms || 3600);
    };
  }, []);
  return html`<div class="toasts" role="status" aria-live="polite">
    ${list.map((t) => html`<div key=${t.id} class=${cx("toast", t.kind)}>${t.icon && html`<${Icon} name=${t.icon} />`}<span>${t.msg}</span></div>`)}
  </div>`;
}

// ---------- всплывающая карточка ----------
let setPop = () => {};
let popAnchor = null;
export function openPop(anchor, render, opts = {}) { popAnchor = anchor; setPop({ render, opts, rect: anchor.getBoundingClientRect(), id: Math.random() }); }
export function closePop() { popAnchor = null; setPop(null); }
export function PopHost() {
  const [pop, set] = useState(null);
  const ref = useRef();
  const [pos, setPos] = useState(null);
  useEffect(() => { setPop = set; }, []);
  useEffect(() => {
    if (!pop) return;
    const el = ref.current;
    if (!el) return;
    const r = pop.rect, w = el.offsetWidth, h = el.offsetHeight;
    const vw = window.innerWidth, vh = window.innerHeight;
    let left = Math.min(vw - w - 12, Math.max(12, r.left + r.width / 2 - w / 2));
    let top = r.bottom + 8;
    if (top + h > vh - 12 && r.top - h - 8 > 12) top = r.top - h - 8;
    setPos({ left, top: Math.max(12, Math.min(top, vh - h - 12)) });
  }, [pop]);
  useEffect(() => {
    if (!pop || pop.opts.tip) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target) && !popAnchor?.contains(e.target)) closePop(); };
    const onKey = (e) => e.key === "Escape" && closePop();
    const onScroll = () => closePop();
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true, once: true });
    return () => { document.removeEventListener("pointerdown", onDown, true); document.removeEventListener("keydown", onKey); window.removeEventListener("scroll", onScroll); };
  }, [pop]);
  if (!pop) return null;
  return html`<div ref=${ref} class=${cx("pop", pop.opts.tip && "tip", pop.opts.cls)} role=${pop.opts.tip ? "tooltip" : "dialog"}
    style=${pos ? `left:${pos.left}px;top:${pos.top}px` : "left:-9999px;top:0"}>${pop.render()}</div>`;
}

export function Dialog({ title, onClose, children, wide }) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, []);
  return html`<div class="overlay" onPointerDown=${(e) => e.target === e.currentTarget && onClose()}>
    <div class="dialog" role="dialog" aria-modal="true" aria-label=${title} style=${wide ? "width:min(900px,100%)" : ""}>
      <div class="d-head"><h3 class="grow">${title}</h3><button class="icon-btn" onClick=${onClose} aria-label=${L("Закрыть", "Close", "إغلاق")}><${Icon} name="x" /></button></div>
      <div class="d-body">${children}</div>
    </div>
  </div>`;
}

export function Confirm({ text, yes, onYes, onNo, danger }) {
  return html`<div class="warn-box col" style="gap:10px"><div>${text}</div>
    <div class="row"><button class=${cx("btn sm", danger ? "danger" : "primary")} onClick=${onYes}>${yes || L("Подтвердить", "Confirm", "تأكيد")}</button><button class="btn sm ghost" onClick=${onNo}>${L("Отмена", "Cancel", "إلغاء")}</button></div></div>`;
}

export const StatusPill = ({ s, due }) => due
  ? html`<span class="pill due">${L("На повторение", "Due for review", "للمراجعة")}</span>`
  : html`<span class=${cx("pill", ["new", "learning", "learned"][s])}>${statusName(s)}</span>`;
export const statusName = (s) => [L("Новый", "New", "جديد"), L("Изучаю", "Learning", "قيد الحفظ"), L("Выучен", "Learned", "محفوظ")][s];
