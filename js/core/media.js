// Аудиозаписи бейтов: общая библиотека чтецов (загружает администратор) и разбор ZIP при загрузке.
import { loadScript, useState, useEffect } from "../lib.js";
import { TOTAL } from "../data/index.js";
import { L, LANG } from "./i18n.js";
import { D } from "./store.js";

const JSZIP_URL = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
const MUXER_URL = "https://cdn.jsdelivr.net/npm/webm-muxer@5.0.3/build/webm-muxer.js";
const listeners = new Set();
let ver = 0;
export const onMediaChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const changed = () => { ver++; listeners.forEach((fn) => fn()); };
// Перерисовка при изменении библиотеки; изменение между отрисовкой и подпиской тоже не теряется.
export function useMediaLib() {
  const [, bump] = useState(0);
  const seen = ver;
  useEffect(() => { const off = onMediaChange(() => bump((x) => x + 1)); if (ver !== seen) bump((x) => x + 1); return off; }, []);
  return lib;
}

// db shared/audio: { reciters: [{ id, name, names: { ru, en, ar }, full }], maps: { [id чтеца]: { [бейт]: { id, type, name, size, t } } } }.
// name — имя, введённое при добавлении; names — имя на каждом языке интерфейса.
// Старый формат { map } — это один чтец «r1». published — файлы, опубликованные рядом со страницей.
// audio/manifest.json на своём хостинге, где базы нет: { reciters: [{ id, name, names, files: { [бейт]: путь }, full }], files: { [бейт]: путь } };
// записи его чтецов попадают в maps как { url }.
// full — целая запись матна у чтеца (вкладка «Слушать»): { id или url, dur, marks }; marks — секунда записи,
// с которой начинается каждый из 109 бейтов.
export const lib = { reciters: [], maps: {}, published: {}, assets: null, db: null, canManage: false };
function parseShared(data) {
  if (data && Array.isArray(data.reciters)) return { reciters: data.reciters.filter((r) => r && r.id), maps: data.maps || {} };
  if (data?.map && Object.keys(data.map).length) return { reciters: [{ id: "r1", name: "" }], maps: { r1: data.map } };
  return { reciters: [], maps: {} };
}
function parseManifest(m) {
  const list = (Array.isArray(m?.reciters) ? m.reciters : []).filter((r) => r?.id && r.files);
  return {
    reciters: list.map(({ files, ...r }) => r),
    maps: Object.fromEntries(list.map((r) => [r.id, Object.fromEntries(Object.entries(r.files).filter(([, url]) => url).map(([n, url]) => [n, { url }]))])),
  };
}
export const reciterName = (r, i = lib.reciters.indexOf(r)) => r?.names?.[LANG] || r?.name || L(`Чтец ${i + 1}`, `Reciter ${i + 1}`, `القارئ ${i + 1}`);
// Выбранный чтец: из настроек, а если там «авто» или его уже нет — первый в списке (основной).
export const currentReciter = () => lib.reciters.find((r) => r.id === D.s.prefs.reciter) || lib.reciters[0] || null;
// Запись есть, если она загружена в хранилище (id) или лежит файлом рядом с сайтом (url).
const playable = (x) => !!(x?.id || x?.url);
export const reciterCount = (rid) => Object.values(lib.maps[rid] || {}).filter(playable).length;

export async function initMedia(db) {
  try {
    const r = await fetch("audio/manifest.json", { cache: "no-store" });
    if (r.ok) {
      const m = await r.json();
      lib.published = m.files || {};
      // Чтецы из файла — для своего хостинга; на claude.ai чтецов ведёт база.
      if (!db) Object.assign(lib, parseManifest(m));
    }
  } catch { /* нет опубликованных файлов */ }
  changed();
  if (!db) return;
  lib.db = db;
  db.doc("shared/audio").onSnapshot((snap) => { Object.assign(lib, parseShared(snap.exists ? snap.data() : null)); changed(); }, () => {});
}
// Загрузка файлов включается после входа администратора.
export async function enableManage() {
  if (lib.assets || !window.claude?.use) return;
  try { const assets = await window.claude.use("assets"); if (assets) { lib.assets = assets; lib.canManage = true; changed(); } }
  catch { /* загрузка недоступна */ }
}

// Запись бейта: у выбранного чтеца, иначе у первого, у кого она есть. Синтеза речи нет — только записи.
function pickRecording(n, pref = D.s.prefs.reciter) {
  const order = [...lib.reciters].sort((a, b) => (a.id === pref ? -1 : b.id === pref ? 1 : 0));
  for (const r of order) { const x = lib.maps[r.id]?.[n]; if (playable(x)) return { ...x, reciter: r }; }
  return null;
}
// null — записи этого бейта нет ни у одного чтеца.
export async function sourceFor(n) {
  const rec = pickRecording(n);
  if (rec) return { kind: "shared", url: rec.url || "/_blob/" + rec.id, reciter: reciterName(rec.reciter), rid: rec.reciter.id };
  if (lib.published[n]) return { kind: "shared", url: lib.published[n], reciter: "", rid: "" };
  return null;
}
export const hasFileAudio = (n) => lib.reciters.some((r) => playable(lib.maps[r.id]?.[n])) || !!lib.published[n];
// Целая запись матна: у выбранного чтеца, иначе у первого, у кого она есть. Без отметок бейтов она не годится.
const hasFullRec = (r) => !!(r.full?.id || r.full?.url) && r.full.marks?.length >= TOTAL;
export const hasFull = () => lib.reciters.some(hasFullRec);
export function fullFor(pref = D.s.prefs.reciter) {
  const r = [...lib.reciters].sort((a, b) => (a.id === pref ? -1 : b.id === pref ? 1 : 0)).find(hasFullRec);
  return r ? { url: r.full.url || "/_blob/" + r.full.id, marks: r.full.marks, dur: r.full.dur || 0, reciter: reciterName(r), rid: r.id } : null;
}

// ---------- разбор имён и архивов ----------
export const AUDIO_EXT = /\.(mp3|m4a|mp4|aac|wav|ogg|oga|opus|webm|weba|flac)$/i;
// Номер бейта — последнее число в имени: «001.mp3», «bayt-12.m4a», «Джазария 109.mp3».
export function numberFromName(name) {
  const m = name.replace(/\.[a-z0-9]+$/i, "").match(/(\d{1,3})(?!.*\d)/);
  const n = m ? +m[1] : NaN;
  return n >= 1 && n <= 109 ? n : null;
}
const typeFromName = (name) => {
  const ext = (name.split(".").pop() || "").toLowerCase();
  return { mp3: "audio/mpeg", m4a: "audio/mp4", mp4: "audio/mp4", aac: "audio/aac", wav: "audio/wav", ogg: "audio/ogg", oga: "audio/ogg", opus: "audio/ogg", webm: "audio/webm", weba: "audio/webm", flac: "audio/flac" }[ext] || "";
};
async function JSZipLib() { await loadScript(JSZIP_URL); return window.JSZip; }

// Раскрыть выбранные файлы и ZIP-архивы в список аудиофайлов.
export async function expandFiles(files, onStatus) {
  const out = [];
  for (const f of files) {
    if (/\.zip$/i.test(f.name) || /zip/.test(f.type)) {
      onStatus?.(L(`Распаковываем ${f.name}…`, `Unpacking ${f.name}…`, `جارٍ فكّ ${f.name}…`));
      const JSZip = await JSZipLib();
      const zip = await JSZip.loadAsync(f);
      const entries = Object.values(zip.files).filter((e) => !e.dir && !/(^|\/)(__MACOSX|\.)/.test(e.name) && AUDIO_EXT.test(e.name));
      for (const e of entries) {
        const base = e.name.split("/").pop();
        out.push(new File([await e.async("blob")], base, { type: typeFromName(base) }));
      }
    } else if (AUDIO_EXT.test(f.name) || (f.type || "").startsWith("audio/")) out.push(f);
  }
  return out;
}
// План загрузки: номер бейта для каждого файла, дубли и нераспознанные.
export function planUpload(files) {
  const rows = files.map((f, i) => ({ id: i, f, n: numberFromName(f.name) }));
  const last = new Map();
  rows.forEach((r) => { if (r.n) last.set(r.n, r.id); });
  rows.forEach((r) => { r.dup = !!r.n && last.get(r.n) !== r.id; });
  return rows.sort((a, b) => (a.n || 999) - (b.n || 999) || a.id - b.id);
}

// ---------- перекодирование в WebM/Opus (MP3, WAV, OGG, FLAC) ----------
export const canConvert = () => "AudioEncoder" in window && "AudioData" in window;
async function toWebm(file) {
  if (!canConvert()) throw Object.assign(new Error(L("Этот браузер не умеет перекодировать аудио. Откройте админ-панель в Chrome или Edge либо загрузите M4A.", "This browser cannot convert audio. Open the admin panel in Chrome or Edge, or upload M4A.", "هذا المتصفح لا يحوّل الصوت. افتح لوحة الإدارة في Chrome أو Edge أو ارفع ملفات M4A.")), { code: "no-encoder" });
  await loadScript(MUXER_URL);
  const { Muxer, ArrayBufferTarget } = window.WebMMuxer;
  const sr = 48000;
  const audio = await new OfflineAudioContext(1, sr, sr).decodeAudioData(await file.arrayBuffer());
  const len = audio.length, mono = new Float32Array(len);
  for (let c = 0; c < audio.numberOfChannels; c++) { const ch = audio.getChannelData(c); for (let i = 0; i < len; i++) mono[i] += ch[i] / audio.numberOfChannels; }
  const config = { codec: "opus", numberOfChannels: 1, sampleRate: sr, bitrate: 48000 };
  if (window.AudioEncoder.isConfigSupported && !(await window.AudioEncoder.isConfigSupported(config)).supported) throw Object.assign(new Error(L("Кодек Opus недоступен в этом браузере.", "The Opus codec is not available in this browser.", "ترميز Opus غير متاح في هذا المتصفح.")), { code: "no-encoder" });
  const muxer = new Muxer({ target: new ArrayBufferTarget(), audio: { codec: "A_OPUS", numberOfChannels: 1, sampleRate: sr } });
  let err = null;
  const enc = new window.AudioEncoder({ output: (chunk, meta) => muxer.addAudioChunk(chunk, meta), error: (e) => { err = e; } });
  enc.configure(config);
  const frame = sr / 10;
  for (let i = 0; i < len; i += frame) {
    const slice = mono.slice(i, Math.min(i + frame, len));
    enc.encode(new window.AudioData({ format: "f32-planar", sampleRate: sr, numberOfFrames: slice.length, numberOfChannels: 1, timestamp: Math.round((i / sr) * 1e6), data: slice }));
  }
  await enc.flush();
  if (err) throw err;
  muxer.finalize();
  return new Blob([muxer.target.buffer], { type: "video/webm" });
}
// Хранилище принимает медиа только в контейнерах MP4 и WebM.
function containerOf(file) {
  const t = (file.type || "").toLowerCase(), ext = (file.name.split(".").pop() || "").toLowerCase();
  if (["m4a", "mp4"].includes(ext) || t === "audio/mp4" || t === "audio/x-m4a" || t === "video/mp4") return "video/mp4";
  if (["webm", "weba"].includes(ext) || t.includes("webm")) return "video/webm";
  return null;
}
export const needsConversion = (file) => !containerOf(file);

// ---------- управление общей библиотекой (только администратор) ----------
async function writeShared(reciters, maps) {
  await lib.db.doc("shared/audio").set({ reciters, maps });
  lib.reciters = reciters; lib.maps = maps; changed();
}
const deleteAssets = async (ids, onProgress) => {
  let k = 0;
  for (const id of ids) { try { await lib.assets.delete(id); } catch { /* уже удалён */ } onProgress?.(++k, ids.length); }
};
const notAdmin = () => Object.assign(new Error(L("Загружать записи может только администратор.", "Only the administrator can upload recordings.", "رفع التسجيلات للمشرف فقط.")), { code: "not-allowed" });
export async function addReciter(name) {
  if (!lib.db) throw notAdmin();
  const id = "r" + Date.now().toString(36);
  await writeShared([...lib.reciters, { id, name: name.trim() }], { ...lib.maps, [id]: {} });
  return id;
}
// names = { ru, en, ar }; пустые не сохраняются, name остаётся запасным — по-русски или на первом заполненном языке.
export async function renameReciter(rid, names) {
  const clean = Object.fromEntries(Object.entries(names).map(([k, v]) => [k, (v || "").trim()]).filter(([, v]) => v));
  await writeShared(lib.reciters.map((r) => (r.id === rid ? { ...r, name: clean.ru || clean.en || clean.ar || r.name, names: clean } : r)), lib.maps);
}
// Первый в списке — чтец по умолчанию для режима «авто».
export async function makeDefaultReciter(rid) { const r = lib.reciters.find((x) => x.id === rid); if (r) await writeShared([r, ...lib.reciters.filter((x) => x.id !== rid)], lib.maps); }
export async function removeReciter(rid, onProgress) {
  const ids = [...Object.values(lib.maps[rid] || {}).map((x) => x?.id), lib.reciters.find((r) => r.id === rid)?.full?.id].filter(Boolean);
  const maps = { ...lib.maps }; delete maps[rid];
  await writeShared(lib.reciters.filter((r) => r.id !== rid), maps);
  await deleteAssets(ids, onProgress);
}
export async function uploadShared(n, file, rid) {
  if (!lib.assets || !lib.db) throw notAdmin();
  if (!lib.reciters.some((r) => r.id === rid)) throw Object.assign(new Error(L("Сначала выберите чтеца.", "Choose a reciter first.", "اختر القارئ أولًا.")), { code: "no-reciter" });
  let blob = file, type = containerOf(file);
  if (!type) { blob = await toWebm(file); type = "video/webm"; }
  const r = await lib.assets.upload(blob, { type });
  const old = lib.maps[rid]?.[n]?.id;
  await writeShared(lib.reciters, { ...lib.maps, [rid]: { ...(lib.maps[rid] || {}), [n]: { id: r.id, type, name: file.name, size: r.sizeBytes, t: Date.now() } } });
  if (old && old !== r.id) await deleteAssets([old]);
  return r;
}
export async function removeShared(n, rid) {
  const map = { ...(lib.maps[rid] || {}) };
  const id = map[n]?.id;
  delete map[n];
  await writeShared(lib.reciters, { ...lib.maps, [rid]: map });
  if (id && lib.assets) await deleteAssets([id]);
}
export async function removeAllShared(rid, onProgress) {
  const ids = Object.values(lib.maps[rid] || {}).map((x) => x?.id).filter(Boolean);
  await writeShared(lib.reciters, { ...lib.maps, [rid]: {} });
  await deleteAssets(ids, onProgress);
}
export async function storageUsage() {
  if (!lib.assets) return null;
  try {
    const { assets, usage } = await lib.assets.list();
    const used = new Set([...Object.values(lib.maps).flatMap((m) => Object.values(m || {}).map((x) => x?.id)), ...lib.reciters.map((r) => r.full?.id)]);
    return { usage, orphans: assets.filter((a) => !used.has(a.id)) };
  } catch { return null; }
}
export async function removeOrphans(list) { for (const a of list) { try { await lib.assets.delete(a.id); } catch { /* уже удалён */ } } }
