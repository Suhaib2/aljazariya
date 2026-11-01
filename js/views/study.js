// Страница одного бейта: текст, плеер, шарх и заучивание.
// Скорость и скрытие текста задаются в настройках, чтец и повторы — ещё и в плеере.
import { html, useState, useEffect, useMemo, useRef, useMedia, cx, shuffle } from "../lib.js";
import { V, TOK, TOTAL, sectionOf } from "../data/index.js";
import { useSel, act } from "../core/store.js";
import { usePlayer, toggle as togglePlay } from "../core/audio.js";
import { norm, alignWords, AR_KEYS } from "../core/arabic.js";
import { go, route } from "../core/nav.js";
import { L, LANG, bayt, secName } from "../core/i18n.js";
import { Icon, Seg, toast } from "../ui/kit.js";
import { VerseText, Translation, StatusSeg, VerseActions, VNum, Sharh, displayOf } from "../ui/verse.js";

const srcLabel = (k) => (k === "shared" ? L("запись чтеца", "reciter’s recording", "تسجيل القارئ") : "");

export function PlayerRow({ n }) {
  const repeat = useSel((d) => d.s.prefs.repeat);
  const playing = usePlayer((p) => p.n === n && (p.playing || p.loading));
  const kind = usePlayer((p) => (p.n === n ? p.kind : null));
  const reciter = usePlayer((p) => (p.n === n ? p.reciter : ""));
  const rep = usePlayer((p) => (p.n === n ? p.rep : 0));
  const err = usePlayer((p) => (p.n === n ? p.error : ""));
  return html`<div class="player-row">
    <button class="play-btn" onClick=${() => togglePlay(n)} aria-label=${playing ? L("Пауза", "Pause", "إيقاف مؤقت") : L("Слушать", "Listen", "استمع")}><${Icon} name=${playing ? "pause" : "play"} /></button>
    <span class="muted" style="font-size:12.5px">${kind ? srcLabel(kind) + (reciter ? " · " + reciter : "") : ""}${playing && repeat !== 1 ? ` · ${L("повтор", "repeat", "تكرار")} ${rep + 1}${repeat ? "/" + repeat : ""}` : ""}</span>
    ${err === "no-audio" && html`<div class="warn-box" style="width:100%">${L("Записи этого бейта пока нет ни у одного чтеца.", "No reciter has a recording of this bayt yet.", "لا يوجد تسجيل لهذا البيت عند أي قارئ بعد.")}</div>`}
    ${err === "file" && html`<div class="warn-box" style="width:100%">${L("Не удалось воспроизвести запись. Проверьте соединение и нажмите «Слушать» ещё раз.", "The recording could not be played. Check the connection and press Listen again.", "تعذّر تشغيل التسجيل. تحقّق من الاتصال واضغط «استمع» مرة أخرى.")}</div>`}
  </div>`;
}

export function StudyView({ n }) {
  const [tab, setTab] = useState(() => (route().state?.tab === "memo" ? "memo" : "explain"));
  const prefs = useSel((d) => d.s.prefs);
  const roomy = useMedia("(min-width: 1100px)");
  const [manual, setManual] = useState(() => new Set());
  useEffect(() => { act.openVerse(n); setManual(new Set()); const t = route().state?.tab; if (t === "memo" || t === "explain") setTab(t); }, [n]);
  useEffect(() => {
    const k = (e) => {
      if (e.target.closest("input,textarea,select,[contenteditable]")) return;
      const back = LANG === "ar" ? "ArrowRight" : "ArrowLeft", fwd = LANG === "ar" ? "ArrowLeft" : "ArrowRight";
      if (e.key === back && n > 1) go("v" + (n - 1));
      if (e.key === fwd && n < TOTAL) go("v" + (n + 1));
    };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [n]);
  const sec = sectionOf(n);
  const show = displayOf(prefs);
  const hide = { level: prefs.hideLevel, first: prefs.firstLetters, manual, toggle: (k) => setManual((m) => { const s = new Set(m); s.has(k) ? s.delete(k) : s.add(k); return s; }) };
  const tabs = [["explain", L("Объяснение", "Explanation", "الشرح")], ["memo", L("Заучивание", "Memorize", "الحفظ")]];
  return html`<div>
    <div class="study-nav">
      <button class="btn sm ghost" onClick=${() => go("read", { n })}><${Icon} name="arrowL" />${L("Матн", "Matn", "المتن")}</button>
      <span class="chip">${secName(sec)}</span>
      <span class="grow"></span>
      <button class="btn sm" disabled=${n <= 1} onClick=${() => go("v" + (n - 1))} aria-label=${L("Предыдущий бейт", "Previous bayt", "البيت السابق")}><${Icon} name="chevL" />${n - 1 || ""}</button>
      <span class="num muted" style="font-size:13px" dir="ltr">${n} / ${TOTAL}</span>
      <button class="btn sm" disabled=${n >= TOTAL} onClick=${() => go("v" + (n + 1))} aria-label=${L("Следующий бейт", "Next bayt", "البيت التالي")}>${n < TOTAL ? n + 1 : ""}<${Icon} name="chevR" /></button>
    </div>
    <div class="card study-hero">
      <div class="vhead"><${VNum} n=${n} /><div><div class="label">${bayt(n)}</div></div><${VerseActions} n=${n} compact=${true} /></div>
      ${show.ar && html`<${VerseText} n=${n} big=${1.15} hide=${hide} blind=${prefs.audioOnly} layout=${roomy ? prefs.layout : "stack"} />`}
      ${show.tr && html`<${Translation} n=${n} hidden=${show.ar && prefs.hideRu} />`}
      <${PlayerRow} n=${n} />
      <div class="row" style="margin-top:12px;justify-content:space-between"><${StatusSeg} n=${n} />
        ${manual.size > 0 && html`<button class="btn sm ghost" onClick=${() => setManual(new Set())}>${L("Показать скрытые слова", "Show hidden words", "إظهار الكلمات المخفية")} (${manual.size})</button>`}</div>
    </div>
    <div class="tabs" role="tablist">${tabs.map(([id, l]) => html`<button role="tab" aria-selected=${String(tab === id)} onClick=${() => setTab(id)}>${l}</button>`)}</div>
    ${tab === "explain" && html`<div class="card"><${Sharh} n=${n} inMargin=${true} /></div>`}
    ${tab === "memo" && html`<${MemoTab} n=${n} />`}
  </div>`;
}

// ---------- заучивание ----------
function hideSummary(p) {
  const parts = [];
  if (p.audioOnly) parts.push(L("только аудио", "audio only", "الصوت فقط"));
  else {
    if (p.hideLevel) parts.push(L(`скрыто ${p.hideLevel}% слов`, `${p.hideLevel}% of words hidden`, `إخفاء ${p.hideLevel}% من الكلمات`));
    if (p.firstLetters) parts.push(L("первые буквы", "first letters", "الحروف الأولى"));
    if (p.hideRu) parts.push(L("перевод скрыт", "translation hidden", "الترجمة مخفية"));
  }
  if (p.clickHide) parts.push(L("скрытие по нажатию", "hide on tap", "الإخفاء بالنقر"));
  return parts.length ? parts.join(" · ") : L("текст показан полностью", "the full text is shown", "النص ظاهر كاملًا");
}

function MemoTab({ n }) {
  const prefs = useSel((d) => d.s.prefs);
  const [mode, setMode] = useState("build");
  const [key, setKey] = useState(0);
  return html`<div class="col" style="gap:14px">
    <div class="card col" style="gap:8px">
      <div class="row" style="justify-content:space-between"><span><span class="label">${L("Скрытие текста", "Hiding the text", "إخفاء النص")}:</span> ${hideSummary(prefs)}</span>
        <button class="btn sm ghost" onClick=${() => go("options", { section: "memo" })}><${Icon} name="gear" />${L("Изменить в настройках", "Change in settings", "التغيير في الإعدادات")}</button></div>
      <p class="hint">${L("Порядок заучивания: прослушайте бейт 3–5 раз, прочитайте с переводом, затем скрывайте 25 → 50 → 100% слов и проверьте себя ниже. Скрытое слово открывается нажатием.",
        "How to memorize: listen to the bayt 3–5 times, read it with the translation, then hide 25 → 50 → 100% of the words and test yourself below. Tap a hidden word to reveal it.",
        "طريقة الحفظ: استمع إلى البيت 3–5 مرات، واقرأه مع الشرح، ثم أخفِ 25 ← 50 ← 100% من الكلمات واختبر نفسك أدناه. انقر الكلمة المخفية لإظهارها.")}</p>
    </div>
    <div class="card col" style="gap:14px">
      <div class="row" style="justify-content:space-between"><h3>${L("Проверь себя", "Test yourself", "اختبر نفسك")}</h3>
        <${Seg} label=${L("Вид проверки", "Check type", "نوع الاختبار")} value=${mode} onChange=${(v) => { setMode(v); setKey((k) => k + 1); }}
          options=${[{ v: "build", label: L("Собери бейт", "Build the bayt", "رتّب البيت") }, { v: "write", label: L("Напиши по памяти", "Write from memory", "اكتب من حفظك") }, { v: "gaps", label: L("Пропуски", "Gaps", "الفراغات") }]} /></div>
      ${mode === "build" && html`<${BuildCheck} key=${"b" + n + key} n=${n} onAgain=${() => setKey((k) => k + 1)} />`}
      ${mode === "write" && html`<${WriteCheck} key=${"w" + n + key} n=${n} />`}
      ${mode === "gaps" && html`<${GapCheck} key=${"g" + n + key} n=${n} onAgain=${() => setKey((k) => k + 1)} />`}
    </div>
  </div>`;
}

function Done({ n, pct, onAgain, extra }) {
  const s = useSel((d) => d.s.verses[n]?.s || 0);
  const verdict = pct >= 90 ? L("Отлично, бейт держится в памяти.", "Excellent — the bayt is in your memory.", "ممتاز، البيت ثابت في حفظك.")
    : pct >= 60 ? L("Почти. Повторите трудные места.", "Almost. Go over the difficult places again.", "قريب. راجع المواضع الصعبة.")
    : L("Нужно ещё поработать: послушайте и повторите.", "Needs more work: listen and repeat.", "يحتاج إلى مزيد من العمل: استمع وردّد.");
  return html`<div class="row" style="gap:14px;align-items:center">
    <div class="score-ring" style=${`--p:${pct};--c:${pct >= 90 ? "var(--ok)" : pct >= 60 ? "var(--warn)" : "var(--bad)"};width:84px;height:84px`}><div style="width:66px;height:66px;font-size:20px">${pct}%</div></div>
    <div class="col grow" style="gap:6px"><b>${verdict}</b>${extra}
      <div class="row">${pct >= 80 && s !== 2 && html`<button class="btn sm ok" onClick=${() => { act.setStatus(n, 2); toast(L(`Бейт ${n} выучен`, `Bayt ${n} learned`, `حُفظ البيت ${n}`), { icon: "check" }); }}><${Icon} name="check" />${L("Отметить выученным", "Mark as learned", "سجّله محفوظًا")}</button>`}
        <button class="btn sm" onClick=${onAgain}><${Icon} name="rotate" />${L("Ещё раз", "Again", "مرة أخرى")}</button>
        ${n < TOTAL && html`<button class="btn sm ghost" onClick=${() => go("v" + (n + 1))}>${L("Следующий бейт", "Next bayt", "البيت التالي")}<${Icon} name="chevR" /></button>`}</div></div>
  </div>`;
}

function BuildCheck({ n, onAgain }) {
  const words = useMemo(() => TOK[n].flatMap((l, h) => l.map((w, i) => ({ ...w, h, id: `${h}:${i}` }))), [n]);
  const pool = useMemo(() => shuffle(words), [words]);
  const [placed, setPlaced] = useState([]);
  const [used, setUsed] = useState(() => new Set());
  const [errors, setErrors] = useState(0);
  const [bad, setBad] = useState(null);
  const done = placed.length === words.length;
  const pct = Math.max(0, Math.round(100 * (1 - errors / words.length)));
  useEffect(() => { if (done) act.logCheck(n, "build", pct); }, [done]);
  const pick = (w) => {
    const target = words[placed.length];
    if (w.n === target.n) { setPlaced((p) => [...p, target]); setUsed((u) => new Set(u).add(w.id)); }
    else { setErrors((e) => e + 1); setBad(w.id); setTimeout(() => setBad(null), 420); }
  };
  return html`<div class="col" style="gap:12px">
    <p class="hint">${L("Нажимайте на слова по порядку, справа налево. Неверный выбор считается ошибкой.", "Tap the words in order, from right to left. A wrong choice counts as a mistake.", "انقر الكلمات بالترتيب من اليمين إلى اليسار. الاختيار الخاطئ يُحسب خطأً.")}</p>
    <div class="assembled" lang="ar">${placed.map((w, i) => html`${i && placed[i - 1].h !== w.h ? html`<span style="color:var(--gilt)"> ✦ </span>` : " "}${w.text}`)}${!done && html`<span class="muted"> …</span>`}</div>
    ${!done && html`<div class="chips-pool">${pool.map((w) => html`<button class=${cx("wchip", used.has(w.id) && "used", bad === w.id && "bad")} lang="ar" onClick=${() => pick(w)}>${w.text}</button>`)}</div>`}
    <div class="row muted" style="font-size:13px">${L("Ошибок", "Mistakes", "الأخطاء")}: ${errors} · ${L("Слов", "Words", "الكلمات")}: ${placed.length}/${words.length}
      ${!done && html`<button class="btn sm ghost" onClick=${() => { const t = words[placed.length]; const c = pool.find((w) => !used.has(w.id) && w.n === t.n); if (c) { setErrors((e) => e + 1); pick(c); } }}>${L("Подсказка", "Hint", "تلميح")}</button>`}</div>
    ${done && html`<${Done} n=${n} pct=${pct} onAgain=${onAgain} />`}
  </div>`;
}

function WriteCheck({ n }) {
  const [text, setText] = useState("");
  const [kb, setKb] = useState(false);
  const [res, setRes] = useState(null);
  const ta = useRef();
  const insert = (ch) => {
    const el = ta.current; if (!el) return;
    const s = el.selectionStart ?? text.length, e = el.selectionEnd ?? text.length;
    let next;
    if (ch === "⌫") next = s === e ? text.slice(0, Math.max(0, s - 1)) + text.slice(e) : text.slice(0, s) + text.slice(e);
    else next = text.slice(0, s) + ch + text.slice(e);
    setText(next);
    const pos = ch === "⌫" ? Math.max(0, s === e ? s - 1 : s) : s + ch.length;
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(pos, pos); });
  };
  const check = () => {
    const hyp = text.split(/\s+/).map(norm).filter(Boolean);
    const r = alignWords([...TOK[n][0], ...TOK[n][1]], hyp);
    setRes(r); act.logCheck(n, "write", r.pct);
  };
  return html`<div class="col" style="gap:12px">
    <p class="hint">${L("Напишите бейт по памяти. Огласовки не обязательны: сравниваются буквы. Можно включить экранную арабскую клавиатуру.", "Write the bayt from memory. Vowel marks are optional: only letters are compared. You can turn on the on-screen Arabic keyboard.", "اكتب البيت من حفظك. التشكيل غير لازم؛ المقارنة بالحروف. يمكنك تشغيل لوحة المفاتيح العربية.")}</p>
    <textarea ref=${ta} id=${"write-" + n} class="input ar" dir="rtl" lang="ar" rows="3" style="font-size:24px;line-height:1.8" value=${text} onInput=${(e) => setText(e.currentTarget.value)} placeholder="اكتب البيت هنا"></textarea>
    <div class="row"><button class="btn primary" onClick=${check} disabled=${!text.trim()}><${Icon} name="check" />${L("Проверить", "Check", "تحقّق")}</button>
      <button class=${cx("btn", kb && "soft")} onClick=${() => setKb(!kb)}><${Icon} name="keyboard" />${L("Клавиатура", "Keyboard", "لوحة المفاتيح")}</button>
      <button class="btn ghost" onClick=${() => { setText(""); setRes(null); }}>${L("Очистить", "Clear", "مسح")}</button></div>
    ${kb && html`<div class="akb" role="group" aria-label=${L("Арабская клавиатура", "Arabic keyboard", "لوحة المفاتيح العربية")}>
      ${AR_KEYS.map((row) => html`<div class="krow">${row.map((k) => html`<button type="button" onClick=${() => insert(k)}>${k}</button>`)}</div>`)}
      <div class="krow"><button type="button" class="wide" onClick=${() => insert(" ")}>${L("Пробел", "Space", "مسافة")}</button><button type="button" class="wide" onClick=${() => insert("⌫")}>⌫ ${L("Стереть", "Delete", "حذف")}</button></div></div>`}
    ${res && html`<div class="col" style="gap:10px">
      <div class="diff" lang="ar">${res.ops.map((o) => html`<span class=${o.t}>${o.w}</span>`)}</div>
      <div class="legend"><span><i style="background:var(--ok)"></i>${L("верно", "correct", "صحيح")}</span><span><i style="background:var(--bad)"></i>${L("пропущено", "missing", "ناقص")}</span><span><i style="background:var(--warn)"></i>${L("лишнее", "extra", "زائد")}</span></div>
      <${Done} n=${n} pct=${res.pct} onAgain=${() => { setText(""); setRes(null); }} extra=${html`<span class="muted" style="font-size:13px">${L(`Верно ${res.ok} из ${res.total} слов`, `${res.ok} of ${res.total} words correct`, `صحيح ${res.ok} من ${res.total} كلمة`)}</span>`} />
    </div>`}
  </div>`;
}

function GapCheck({ n, onAgain }) {
  const all = useMemo(() => TOK[n].flatMap((l, h) => l.map((w, i) => ({ ...w, h, i }))), [n]);
  const blanks = useMemo(() => {
    const cand = all.map((w, ix) => ({ w, ix })).filter(({ w }) => w.n.length >= 3);
    const k = Math.min(cand.length, all.length > 8 ? 3 : 2);
    return shuffle(cand).slice(0, k).sort((a, b) => a.ix - b.ix).map(({ w, ix }, bi) => {
      const pool = [];
      for (let d = 1; pool.length < 12 && d < 30; d++) for (const m of [n - d, n + d]) if (V[m]) for (const l of TOK[m]) for (const x of l) if (x.n.length >= 3 && x.n !== w.n && !pool.some((p) => p.n === x.n)) pool.push(x);
      return { ix, bi, w, opts: shuffle([w, ...shuffle(pool).slice(0, 3)]) };
    });
  }, [n]);
  const [ans, setAns] = useState({});
  const done = blanks.every((b) => ans[b.bi] != null);
  const ok = blanks.filter((b) => ans[b.bi] === b.w.n).length;
  const pct = blanks.length ? Math.round((ok / blanks.length) * 100) : 0;
  useEffect(() => { if (done && blanks.length) act.logCheck(n, "gaps", pct); }, [done]);
  const byIx = Object.fromEntries(blanks.map((b) => [b.ix, b]));
  return html`<div class="col" style="gap:14px">
    <div class="quiz-ar" lang="ar">${all.map((w, ix) => {
      const b = byIx[ix];
      const sep = ix > 0 && all[ix - 1].h !== w.h ? html`<span style="color:var(--gilt)"> ✦ </span>` : " ";
      if (!b) return html`${sep}${w.text}`;
      const a = ans[b.bi];
      return html`${sep}<span class=${cx("gap", a != null && (a === b.w.n ? "ok" : "bad"))}>${a != null ? (a === b.w.n ? b.w.text : "✗") : b.bi + 1}</span>`;
    })}</div>
    ${blanks.map((b) => html`<div class="col" style="gap:6px"><span class="label">${L("Пропуск", "Gap", "الفراغ")} ${b.bi + 1}</span>
      <div class="chips-pool">${b.opts.map((o) => html`<button class=${cx("wchip", ans[b.bi] != null && o.n === b.w.n && "used")} disabled=${ans[b.bi] != null} lang="ar"
        style=${ans[b.bi] === o.n && o.n !== b.w.n ? "border-color:var(--bad);background:var(--bad-soft)" : ans[b.bi] != null && o.n === b.w.n ? "opacity:1;border-color:var(--ok);background:var(--ok-soft)" : ""}
        onClick=${() => setAns((s) => ({ ...s, [b.bi]: o.n }))}>${o.text}</button>`)}</div></div>`)}
    ${done && html`<${Done} n=${n} pct=${pct} onAgain=${onAgain} />`}
  </div>`;
}
