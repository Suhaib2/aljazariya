// Аудиодвижок: записи чтецов по бейтам (повторы, автопереход, очередь) и целая запись матна
// на вкладке «Слушать», подсветка полустишия. Синтеза речи нет — звучат только загруженные записи.
import { useState, useEffect, useRef } from "../lib.js";
import { V, TOTAL, PLAIN } from "../data/index.js";
import { D, act } from "./store.js";
import { sourceFor, hasFileAudio, fullFor } from "./media.js";
import { L, bayt } from "./i18n.js";

// full — звучит целая запись матна: { from, to, marks, rs, re, done }; n — бейт, который звучит сейчас,
// rs и re — секунды начала и конца выбранного отрезка записи (re = null — до конца файла).
export const P = { n: null, playing: false, loading: false, h: -1, w: -1, kind: null, reciter: "", rid: "", queue: null, qi: 0, rep: 0, t: 0, dur: 0, error: "", full: null };
const subs = new Set();
function set(patch) { Object.assign(P, patch); subs.forEach((fn) => fn()); }
export function usePlayer(sel) {
  const [, force] = useState(0);
  const selRef = useRef(sel); selRef.current = sel;
  const v = sel(P); const last = useRef(v); last.current = v;
  useEffect(() => {
    const fn = () => { const nv = selRef.current(P); if (!Object.is(nv, last.current)) { last.current = nv; force((x) => x + 1); } };
    subs.add(fn); fn(); return () => subs.delete(fn);
  }, []);
  return v;
}

const el = new Audio();
el.preload = "auto";
let token = 0, timer = 0, session = null, loaded = "", seekTo = null;
// Сервер, который не отдаёт файл частями (Range), не даёт перематывать: такая целая запись загружается
// в память и играет оттуда. whole — адрес записи → обещание адреса blob:, noRange — такие адреса.
const whole = new Map(), noRange = new Set();
const seekable = () => el.seekable.length > 0 && el.seekable.end(el.seekable.length - 1) > 1;
const wholeOf = (url) => {
  if (!whole.has(url)) whole.set(url, fetch(url).then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.blob(); }).then((b) => URL.createObjectURL(b))
    .catch((e) => { whole.delete(url); throw e; }));
  return whole.get(url);
};
export const REPEATS = [1, 2, 3, 5, 7, 10, 0]; // 0 — бесконечно
export const SPEEDS = [0.5, 0.75, 0.9, 1, 1.25, 1.5];

function startSession(n, kind) { session = { n, kind, t0: performance.now(), acc: 0 }; }
function endSession() {
  if (!session) return;
  const sec = session.acc + (session.paused ? 0 : (performance.now() - session.t0) / 1000);
  act.logListen(session.n, sec, session.kind);
  session = null;
}
function pauseSession() { if (session) { session.acc += (performance.now() - session.t0) / 1000; session.t0 = performance.now(); session.paused = true; } }
function resumeSession() { if (session) { session.t0 = performance.now(); session.paused = false; } }

function stopOutputs() {
  token++;
  clearTimeout(timer);
  try { el.pause(); } catch { /* нет источника */ }
}

export async function play(n, opts = {}) {
  n = Math.max(1, Math.min(TOTAL, n));
  stopOutputs();
  endSession();
  const my = ++token;
  const queue = opts.queue !== undefined ? opts.queue : (opts.keepQueue ? P.queue : null);
  set({ n, playing: true, loading: true, h: 0, w: -1, kind: null, reciter: "", rid: "", queue, qi: queue ? queue.list.indexOf(n) : 0, rep: opts.rep || 0, t: 0, dur: 0, error: "", full: null });
  setMediaSession(bayt(n), V[n].a[0].replace(/[{}]/g, ""));
  const src = await sourceFor(n);
  if (my !== token) return;
  if (!src) return missing(my);
  set({ kind: src.kind, reciter: src.reciter || "", rid: src.rid || "", loading: false });
  startSession(n, src.kind);
  playFile(src.url, my);
}

// Записи этого бейта нет ни у одного чтеца: в очереди и при автопереходе звучит следующий бейт с записью.
function missing(my) {
  const rest = P.queue ? P.queue.list.slice(P.qi + 1) : D.s.prefs.autoNext ? Array.from({ length: TOTAL - P.n }, (_, i) => P.n + 1 + i) : [];
  const nx = rest.find(hasFileAudio);
  set({ loading: false });
  if (nx == null) { set({ playing: false, h: -1, error: "no-audio" }); return; }
  timer = setTimeout(() => { if (my === token) play(nx, { keepQueue: true }); }, 150);
}

const failed = (my) => (e) => { if (my === token && e?.name !== "AbortError") { endSession(); set({ playing: false, loading: false, error: e?.name === "NotAllowedError" ? "" : "file" }); } };
function playFile(url, my) {
  loaded = url; seekTo = null;
  el.src = url;
  el.playbackRate = D.s.prefs.speed;
  el.play().catch(failed(my));
}

// Целая запись матна (вкладка «Слушать»): от бейта from до конца бейта to, начиная с бейта at.
// Весь матн звучит с самого начала файла — со вступлением чтеца, если оно есть.
export function playFull({ from = 1, to = TOTAL, at = from } = {}) {
  const src = fullFor();
  if (!src) return playQueue(Array.from({ length: to - from + 1 }, (_, i) => from + i), { start: at - from });
  const m = src.marks, rs = from === 1 ? 0 : m[from - 1], start = at === from ? rs : m[at - 1];
  stopOutputs();
  endSession();
  const my = ++token;
  set({ n: at, playing: true, loading: true, h: -1, w: -1, kind: "full", reciter: src.reciter, rid: src.rid, queue: null, qi: 0, rep: 0, t: start, dur: src.dur, error: "",
    full: { from, to, marks: m, rs, re: to < TOTAL ? m[to] : null } });
  setMediaSession(L("Весь матн", "The whole matn", "المتن كاملًا"), src.reciter);
  startSession(at, "full");
  if (loaded === src.url && el.readyState >= 1 && seekable()) el.currentTime = start;
  else if (noRange.has(src.url)) return playWhole(src.url, start, my);
  else { loaded = src.url; seekTo = start; el.src = src.url + "#t=" + start; }
  el.playbackRate = D.s.prefs.speed;
  el.play().catch(failed(my));
}
// Целая запись из памяти. Пока она загружается, звучит начало файла, только если слушают с самого начала.
async function playWhole(url, t, my) {
  noRange.add(url);
  const fromStart = t < 0.5 && loaded === url && !el.paused;
  if (!fromStart) { try { el.pause(); } catch { /* нет источника */ } set({ loading: true }); }
  let blob;
  // Не загрузилась: если уже звучит начало файла, слушают дальше без перемотки, иначе — ошибка.
  try { blob = await wholeOf(url); } catch { if (my === token && !fromStart) { endSession(); set({ playing: false, loading: false, error: "file" }); } return; }
  if (my !== token) return;
  loaded = url; seekTo = fromStart ? el.currentTime : t;
  el.src = blob;
  el.playbackRate = D.s.prefs.speed;
  if (P.playing) el.play().catch(failed(my));
}
// Какой бейт звучит в целой записи; в конце выбранного отрезка — стоп.
function fullTick() {
  const f = P.full, m = f.marks, t = el.currentTime, d = el.duration || P.dur;
  let n = f.from;
  while (n < f.to && m[n] <= t + 0.05) n++;
  const a = PLAIN[n] || ["", ""], s0 = m[n - 1], s1 = n < TOTAL ? m[n] : d;
  const h = !P.playing || t < s0 ? -1 : t < s0 + (s1 - s0) * (a[0].length / Math.max(1, a[0].length + a[1].length)) ? 0 : 1;
  if (n !== P.n) { endSession(); startSession(n, "full"); if (!P.playing) session.paused = true; }
  set({ n, t, dur: d, h });
  if (!P.playing || f.re == null) return;
  const left = (f.re - t) / (el.playbackRate || 1);
  clearTimeout(timer);
  if (left <= 0.03) return fullDone(token);
  if (left < 1.5) { const my = token; timer = setTimeout(() => fullDone(my), left * 1000); }
}
function fullDone(my) {
  if (my !== token || !P.full) return;
  clearTimeout(timer);
  try { el.pause(); } catch { /* нет источника */ }
  endSession();
  set({ playing: false, h: -1, full: { ...P.full, done: true } });
}
// Перемотка целой записи ползунком; на паузе остаётся пауза.
export function seekTime(t) {
  const f = P.full;
  if (!f) return;
  const end = f.re ?? (el.duration || P.dur);
  t = Math.max(f.rs, Math.min(end - 0.1, t));
  if (el.readyState >= 1) el.currentTime = t;
  set({ t, full: f.done ? { ...f, done: false } : f });
}

el.addEventListener("loadedmetadata", () => {
  const t = seekTo;
  seekTo = null;
  if (!P.full) return;
  if (!seekable()) return playWhole(loaded, t ?? el.currentTime, token);
  if (t != null && Math.abs(el.currentTime - t) > 0.5) el.currentTime = t;
});
el.addEventListener("playing", () => { if (P.loading) set({ loading: false }); });
el.addEventListener("timeupdate", () => {
  if (P.full) return fullTick();
  if (!P.playing) return;
  const d = el.duration || 0, t = el.currentTime;
  const a = PLAIN[P.n] || ["", ""];
  const split = d * (a[0].length / Math.max(1, a[0].length + a[1].length));
  set({ t, dur: d, h: t < split ? 0 : 1 });
});
el.addEventListener("ended", () => (P.full ? fullDone(token) : verseDone(token)));
el.addEventListener("error", () => { if (P.playing && el.src) { endSession(); set({ playing: false, loading: false, error: "file" }); } });

function verseDone(my) {
  if (my !== token) return;
  endSession();
  // Повтор и пауза читаются из настроек в момент окончания бейта, поэтому
  // изменение в плеере действует сразу, без перезапуска.
  const total = D.s.prefs.repeat;
  const pause = Math.max(0, D.s.prefs.pauseSec * 1000);
  if (total === 0 || P.rep + 1 < total) {
    set({ h: -1, w: -1 });
    timer = setTimeout(() => { if (my === token) play(P.n, { keepQueue: true, rep: P.rep + 1 }); }, Math.min(pause, 1200) + 250);
    return;
  }
  if (P.queue) {
    const i = P.qi + 1;
    if (i < P.queue.list.length) {
      set({ h: -1, w: -1 });
      timer = setTimeout(() => { if (my === token) play(P.queue.list[i], { keepQueue: true }); }, pause + 150);
    } else set({ playing: false, h: -1, w: -1 });
    return;
  }
  if (D.s.prefs.autoNext && P.n < TOTAL) {
    set({ h: -1, w: -1 });
    timer = setTimeout(() => { if (my === token) play(P.n + 1); }, pause + 150);
    return;
  }
  set({ playing: false, h: -1, w: -1 });
}

// toggle(n) — кнопка бейта: на паузе целой записи она включает запись самого бейта.
export function toggle(n) {
  if (n && (n !== P.n || (P.full && !P.playing))) return play(n);
  if (P.n == null) return play(D.s.last || 1);
  if (P.playing) {
    pauseSession();
    clearTimeout(timer);
    el.pause();
    set({ playing: false });
    return;
  }
  const f = P.full;
  if (f && (f.done || !session)) return playFull({ from: f.from, to: f.to, at: f.done ? f.from : P.n });
  if (!f && !session) return play(P.n, { keepQueue: true });
  resumeSession();
  set({ playing: true });
  el.play().catch(() => {});
}
export function stop() { stopOutputs(); endSession(); set({ playing: false, h: -1, w: -1 }); }
export function close() { stop(); set({ n: null, queue: null, kind: null, reciter: "", rid: "", full: null }); }
// В целой записи «дальше» и «назад» — переход к началу соседнего бейта в пределах отрезка.
export function next() {
  if (P.full) return playFull({ from: P.full.from, to: P.full.to, at: Math.min(P.full.to, P.n + 1) });
  if (P.queue) { const i = Math.min(P.queue.list.length - 1, P.qi + 1); return play(P.queue.list[i], { keepQueue: true }); }
  return play(Math.min(TOTAL, (P.n || 0) + 1));
}
export function prev() {
  if (P.full) return playFull({ from: P.full.from, to: P.full.to, at: Math.max(P.full.from, P.n - 1) });
  if (P.queue) { const i = Math.max(0, P.qi - 1); return play(P.queue.list[i], { keepQueue: true }); }
  return play(Math.max(1, (P.n || 2) - 1));
}
export function playQueue(list, { start = 0 } = {}) {
  if (!list.length) return;
  play(list[start], { queue: { list } });
}
export function setSpeed(r) { act.setPref("speed", r); el.playbackRate = r; }
export function setRepeat(v) { act.setPref("repeat", v); }
// Новый чтец звучит сразу: текущий бейт начинается заново его голосом (в целой записи — с начала этого бейта).
// На паузе прежняя запись не продолжается — следующее «Играть» начнёт бейт уже новым голосом.
export function setReciter(id) {
  act.setPref("reciter", id);
  if (!P.n || id === P.rid) return;
  const f = P.full;
  if (P.playing || P.loading) { if (f) playFull({ from: f.from, to: f.to, at: P.n }); else play(P.n, { keepQueue: true, rep: P.rep }); }
  else { stopOutputs(); endSession(); set({ kind: f ? "full" : null, reciter: "", rid: "" }); }
}

function setMediaSession(title, album) {
  if (!("mediaSession" in navigator)) return;
  try {
    navigator.mediaSession.metadata = new window.MediaMetadata({ title, artist: L("Матн аль-Джазария", "Matn al-Jazariyya", "متن الجزرية"), album });
    navigator.mediaSession.setActionHandler("play", () => toggle());
    navigator.mediaSession.setActionHandler("pause", () => toggle());
    navigator.mediaSession.setActionHandler("nexttrack", () => next());
    navigator.mediaSession.setActionHandler("previoustrack", () => prev());
  } catch { /* не поддерживается */ }
}
