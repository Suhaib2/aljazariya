// Аудиодвижок: записи чтецов, повторы, автопереход, очередь «весь матн подряд»,
// подсветка полустишия. Синтеза речи нет — звучат только загруженные записи.
import { useState, useEffect, useRef } from "../lib.js";
import { V, TOTAL, PLAIN } from "../data/index.js";
import { D, act } from "./store.js";
import { sourceFor, hasFileAudio } from "./media.js";
import { L, bayt } from "./i18n.js";

export const P = { n: null, playing: false, loading: false, h: -1, w: -1, kind: null, reciter: "", rid: "", queue: null, qi: 0, rep: 0, t: 0, dur: 0, error: "" };
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
let token = 0, timer = 0, session = null;
export const REPEATS = [1, 2, 3, 5, 7, 10, 0]; // 0 — бесконечно
export const SPEEDS = [0.5, 0.75, 0.9, 1, 1.25, 1.5];

function startSession(n, kind) { session = { n, kind, t0: performance.now(), acc: 0 }; }
function endSession() {
  if (!session) return;
  const sec = session.acc + (performance.now() - session.t0) / 1000;
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
  set({ n, playing: true, loading: true, h: 0, w: -1, kind: null, reciter: "", rid: "", queue, qi: queue ? queue.list.indexOf(n) : 0, rep: opts.rep || 0, t: 0, dur: 0, error: "" });
  setMediaSession(n);
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

function playFile(url, my) {
  el.src = url;
  el.playbackRate = D.s.prefs.speed;
  el.play().catch((e) => { if (my === token && e?.name !== "AbortError") { endSession(); set({ playing: false, error: e?.name === "NotAllowedError" ? "" : "file" }); } });
}
el.addEventListener("timeupdate", () => {
  if (!P.playing) return;
  const d = el.duration || 0, t = el.currentTime;
  const a = PLAIN[P.n] || ["", ""];
  const split = d * (a[0].length / Math.max(1, a[0].length + a[1].length));
  set({ t, dur: d, h: t < split ? 0 : 1 });
});
el.addEventListener("ended", () => verseDone(token));
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

export function toggle(n) {
  if (n && n !== P.n) return play(n);
  if (P.n == null) return play(D.s.last || 1);
  if (P.playing) {
    pauseSession();
    el.pause();
    set({ playing: false });
  } else {
    if (!session) return play(P.n, { keepQueue: true });
    resumeSession();
    set({ playing: true });
    el.play().catch(() => {});
  }
}
export function stop() { stopOutputs(); endSession(); set({ playing: false, h: -1, w: -1 }); }
export function close() { stop(); set({ n: null, queue: null, kind: null, reciter: "", rid: "" }); }
export function next() {
  if (P.queue) { const i = Math.min(P.queue.list.length - 1, P.qi + 1); return play(P.queue.list[i], { keepQueue: true }); }
  return play(Math.min(TOTAL, (P.n || 0) + 1));
}
export function prev() {
  if (P.queue) { const i = Math.max(0, P.qi - 1); return play(P.queue.list[i], { keepQueue: true }); }
  return play(Math.max(1, (P.n || 2) - 1));
}
export function playQueue(list, { start = 0 } = {}) {
  if (!list.length) return;
  play(list[start], { queue: { list } });
}
export function setSpeed(r) { act.setPref("speed", r); el.playbackRate = r; }
export function setRepeat(v) { act.setPref("repeat", v); }
// Новый чтец звучит сразу: текущий бейт начинается заново его голосом. На паузе прежняя запись
// не продолжается — следующее «Играть» начнёт бейт уже новым голосом.
export function setReciter(id) {
  act.setPref("reciter", id);
  if (!P.n || id === P.rid) return;
  if (P.playing || P.loading) play(P.n, { keepQueue: true, rep: P.rep });
  else { stopOutputs(); endSession(); set({ kind: null, reciter: "", rid: "" }); }
}

function setMediaSession(n) {
  if (!("mediaSession" in navigator)) return;
  try {
    navigator.mediaSession.metadata = new window.MediaMetadata({ title: bayt(n), artist: L("Матн аль-Джазария", "Matn al-Jazariyya", "متن الجزرية"), album: V[n].a[0].replace(/[{}]/g, "") });
    navigator.mediaSession.setActionHandler("play", () => toggle());
    navigator.mediaSession.setActionHandler("pause", () => toggle());
    navigator.mediaSession.setActionHandler("nexttrack", () => next());
    navigator.mediaSession.setActionHandler("previoustrack", () => prev());
  } catch { /* не поддерживается */ }
}
