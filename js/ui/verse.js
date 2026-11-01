// Отображение бейта: арабский текст по словам (с пословным переводом), перевод, карточка и шарх.
import { html, useState, useMemo, useEffect, cx } from "../lib.js";
import { V, TOK, sectionOf, termFor, termsInVerse, rulesForVerse, MAKHARIJ, LETTER_BY_KEY } from "../data/index.js";
import { useSel, act, D } from "../core/store.js";
import { usePlayer, toggle as togglePlay, P } from "../core/audio.js";
import { hideOrder, splitHead } from "../core/arabic.js";
import { go } from "../core/nav.js";
import { L, LANG, TR, WBW, bayt, vTr, vSharh, vWords, meaningsOf, gloss, termL, kindName, mkhL, ruleL, secName } from "../core/i18n.js";
import { Icon, RichText, openPop, closePop, toast, StatusPill, statusName } from "./kit.js";

// Подсветка текущего полустишия/слова для бейта n.
export function useHL(n) {
  return usePlayer((p) => (p.n === n && (p.playing || p.loading) ? p.h * 1000 + (p.w + 1) : -1));
}

// Что показывать в карточке бейта при текущих настройках.
export function displayOf(prefs) {
  const tr = TR;
  return { ar: !(tr && prefs.mode === "tr"), tr: !!tr && prefs.mode !== "ar" };
}

function TermCard({ t: raw, n }) {
  const t = termL(raw);
  const m = t.m ? t.m[0].toUpperCase() + t.m.slice(1) : "";
  return html`<div class=${"k-" + t.k} style="display:flex;flex-direction:column;gap:6px">
    <div class="row" style="justify-content:space-between"><span class="label" style=${"color:var(--k)"}>${kindName(t.k)}</span>${t.tr && html`<span class="muted" style="font-size:12.5px">${t.tr}</span>`}</div>
    <div class="p-ar ar">${t.ar}</div>
    <div><b>${m}.</b> <${RichText} text=${t.def} /></div>
    <div class="row" style="gap:6px;margin-top:2px">
      ${t.rule && html`<button class="btn sm soft" onClick=${() => { closePop(); go("rule-" + t.rule, { from: n }); }}><${Icon} name="scroll" />${L("Правило", "Rule", "القاعدة")}</button>`}
      <button class="btn sm ghost" onClick=${() => { closePop(); go("dict", { q: t.id }); }}><${Icon} name="dict" />${L("В словаре", "In glossary", "في المعجم")}</button>
    </div>
  </div>`;
}

function WordPop({ n, h, i, w }) {
  const t = termFor(n, w.n);
  const means = meaningsOf(n, w.n);
  const g = gloss(n, h, i);
  return html`<div class="col" style="gap:8px">
    <div class="p-ar ar" style="font-size:30px">${w.text}</div>
    ${g && html`<div class="gl-pop" lang=${TR} dir="ltr">${g}</div>`}
    ${means.map(([ar, m]) => html`<div><bdi class="ar-inline">${ar}</bdi> — ${m}</div>`)}
    ${t && html`<div class="hr"></div><${TermCard} t=${t} n=${n} />`}
    ${!g && !means.length && !t && html`<div class="muted" style="font-size:13px">${L("Для этого слова нет отдельного пояснения — смотрите шарх бейта.", "There is no separate note for this word — see the bayt’s commentary.", "لا شرح مستقلّ لهذه الكلمة، فانظر شرح البيت.")}</div>`}
  </div>`;
}

/*
 * Арабский текст бейта.
 * hide: { level 0–100, first: bool, manual: Set("h:i"), toggle }, onWord(h,i,w,el) — свой обработчик клика.
 * Если включён пословный перевод, под каждым словом выводится его значение.
 */
export function VerseText({ n, layout, hide, onWord, big, blind, noTerms, noGloss }) {
  const prefs = useSel((d) => d.s.prefs);
  const hl = useHL(n);
  const lines = TOK[n];
  const lay = layout || prefs.layout;
  const level = hide?.level ?? 0;
  const hiddenSet = useMemo(() => {
    const all = [];
    lines.forEach((l, h) => l.forEach((_, i) => all.push(`${h}:${i}`)));
    const order = hideOrder(n, all.length);
    const k = Math.ceil((level / 100) * all.length);
    return new Set(order.slice(0, k).map((ix) => all[ix]));
  }, [n, level, lines]);
  const [peek, setPeek] = useState(() => new Set());
  useEffect(() => setPeek(new Set()), [n, level, hide?.first]);

  if (blind) {
    return html`<div class="vtext blind"><div><${Icon} name="headphones" /><div>${L("Текст скрыт. Слушайте и повторяйте по памяти.", "The text is hidden. Listen and repeat from memory.", "النصّ مخفيّ. استمع وردّد من حفظك.")}</div></div></div>`;
  }
  const hh = hl >= 0 ? Math.floor(hl / 1000) : -1, ww = hl >= 0 ? (hl % 1000) - 1 : -1;
  const showTerms = prefs.terms && !noTerms;
  const wbw = WBW && !noGloss;

  const click = (h, i, w, e) => {
    const k = `${h}:${i}`;
    if (onWord) return onWord(h, i, w, e.currentTarget);
    const isHidden = hide && ((hiddenSet.has(k) || hide.manual?.has(k)) && !peek.has(k));
    if (isHidden || (hide?.first && !peek.has(k))) { setPeek((s) => new Set(s).add(k)); return; }
    if (prefs.clickHide && hide?.toggle) { hide.toggle(k); return; }
    openPop(e.currentTarget, () => html`<${WordPop} n=${n} h=${h} i=${i} w=${w} />`);
  };
  const hover = (h, i, w, e) => {
    if (e.pointerType !== "mouse" || !showTerms) return;
    const raw = termFor(n, w.n);
    if (!raw) return;
    const t = termL(raw);
    openPop(e.currentTarget, () => html`<div class=${"k-" + t.k}><div class="row" style="justify-content:space-between"><b style="color:var(--k)">${t.tr || t.ar}</b><span class="muted" style="font-size:12px">${t.m}</span></div><div style="font-size:13.5px;margin-top:4px"><${RichText} text=${t.def} links=${false} /></div><div class="muted" style="font-size:12px;margin-top:4px">${L("Нажмите на слово — подробнее", "Click the word for details", "انقر الكلمة للتفصيل")}</div></div>`, { tip: true });
  };
  const leave = (e) => { if (e.pointerType === "mouse") { const pop = document.querySelector(".pop.tip"); if (pop) closePop(); } };

  return html`<div class=${cx("vtext ar-text", lay, !showTerms && "noterms", wbw && "wbw")} lang="ar" style=${big ? `font-size:calc(var(--ar-size) * ${big})` : ""}>
    ${lines.map((line, h) => html`
      ${h === 1 && html`<span class="hsep" aria-hidden="true">✦</span>`}
      <div class=${cx("hemi", prefs.lineHL && hh === h && "on")} data-h=${h}>
        ${line.map((w, i) => {
          const k = `${h}:${i}`;
          const t = showTerms ? termFor(n, w.n) : null;
          const hidden = hide && (hiddenSet.has(k) || hide.manual?.has(k)) && !peek.has(k);
          const first = hide?.first && !peek.has(k) && !hidden;
          let inner;
          if (first) { const [a, b] = splitHead(w.text); inner = html`${a}<span class="tail">${b}</span>`; }
          else inner = w.segs.map((s) => (s.c && !w.segs.every((x) => x.c) ? html`<span class="code">${s.t}</span>` : s.t));
          const g = wbw ? gloss(n, h, i) : null;
          const cls = cx("w", t && "term k-" + t.k, w.code && w.segs.every((x) => x.c) && "code", hidden && "hid", peek.has(k) && "peek", prefs.lineHL && hh === h && ww === i && "wnow");
          const handlers = {
            role: "button", tabindex: "0", onClick: (e) => click(h, i, w, e),
            onKeyDown: (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), click(h, i, w, e)),
            onPointerEnter: (e) => hover(h, i, w, e), onPointerLeave: leave,
          };
          if (g !== null && g !== undefined) {
            return html`${i > 0 ? " " : ""}<span class="wg"><span class=${cls} ...${handlers}>${inner}</span><small class=${cx("gl", (hidden || first) && "gl-hid")} lang=${TR} dir="ltr">${g || "·"}</small></span>`;
          }
          return html`${i > 0 ? " " : ""}<span class=${cls} ...${handlers}>${inner}</span>`;
        })}
      </div>`)}
  </div>`;
}

export function Translation({ n, hidden }) {
  const hl = useHL(n);
  const lineHL = useSel((d) => d.s.prefs.lineHL);
  const [reveal, setReveal] = useState(false);
  useEffect(() => setReveal(false), [n, hidden]);
  const tr = vTr(n);
  if (!tr) return null;
  const hh = hl >= 0 ? Math.floor(hl / 1000) : -1;
  const isHid = hidden && !reveal;
  return html`<p class=${cx("vtr", isHid && "hid")} lang=${TR} dir="ltr" onClick=${() => isHid && setReveal(true)}
    title=${isHid ? L("Нажмите, чтобы показать перевод", "Click to show the translation", "انقر لإظهار الترجمة") : ""}>
    ${tr.map((t, h) => html`<span class=${cx(lineHL && hh === h && "on")}>${t}</span>${h === 0 ? " " : ""}`)}
  </p>`;
}

export function StatusSeg({ n }) {
  const s = useSel((d) => d.s.verses[n]?.s || 0);
  const opts = [{ v: 0, l: L("Новый", "New", "جديد") }, { v: 1, l: L("Изучаю", "Learning", "أحفظه") }, { v: 2, l: L("Выучил", "Learned", "حفظته") }];
  return html`<div class="seg" role="group" aria-label=${L("Статус бейта", "Bayt status", "حالة البيت")}>
    ${opts.map((o) => html`<button aria-pressed=${String(s === o.v)} onClick=${() => { act.setStatus(n, o.v); if (o.v === 2) toast(L(`Бейт ${n} отмечен выученным`, `Bayt ${n} marked as learned`, `سُجّل البيت ${n} محفوظًا`), { icon: "check" }); }}>${o.l}</button>`)}
  </div>`;
}

export function VerseActions({ n, compact, onSharh, sharhOn }) {
  const playing = usePlayer((p) => p.n === n && (p.playing || p.loading));
  const bm = useSel((d) => !!d.s.bookmarks[n]);
  const fav = useSel((d) => !!d.s.favorites[n]);
  const tPlay = playing ? L("Пауза", "Pause", "إيقاف مؤقت") : L("Слушать бейт", "Listen", "استمع إلى البيت");
  const tBm = bm ? L("Убрать закладку", "Remove bookmark", "إزالة العلامة") : L("Закладка", "Bookmark", "علامة");
  const tFav = fav ? L("Убрать из избранного", "Remove from favorites", "إزالة من المفضلة") : L("В избранное", "Add to favorites", "إلى المفضلة");
  return html`<div class="vtools">
    <button class=${cx("icon-btn sm", playing && "on")} title=${tPlay} aria-label=${tPlay} onClick=${(e) => { e.stopPropagation(); togglePlay(n); }}>
      <${Icon} name=${playing ? "pause" : "play"} /></button>
    ${onSharh && html`<button class=${cx("icon-btn sm", sharhOn && "on")} title=${L("Шарх", "Commentary", "الشرح")} aria-label=${L("Шарх", "Commentary", "الشرح")} aria-pressed=${String(!!sharhOn)} onClick=${(e) => { e.stopPropagation(); onSharh(); }}><${Icon} name="book" /></button>`}
    <button class=${cx("icon-btn sm", bm && "on")} title=${tBm} aria-label=${tBm} onClick=${(e) => { e.stopPropagation(); act.toggleBookmark(n); }}><${Icon} name="bookmark" fill=${bm} /></button>
    <button class=${cx("icon-btn sm", fav && "on")} title=${tFav} aria-label=${tFav} onClick=${(e) => { e.stopPropagation(); act.toggleFavorite(n); }}><${Icon} name="star" fill=${fav} /></button>
    ${!compact && html`<button class="icon-btn sm" title=${L("Изучать бейт", "Study this bayt", "دراسة البيت")} aria-label=${L("Изучать бейт", "Study this bayt", "دراسة البيت")} onClick=${(e) => { e.stopPropagation(); go("v" + n); }}><${Icon} name="chevR" /></button>`}
  </div>`;
}

export function VNum({ n, onClick }) {
  const s = useSel((d) => d.s.verses[n]?.s || 0);
  return html`<button class="vnum" data-s=${s} onClick=${onClick} title=${`${bayt(n)} · ${statusName(s)}`}>${n}
    ${s === 2 && html`<span class="tick"><${Icon} name="check" /></span>`}</button>`;
}

// Карточка бейта в общем списке матна: номер, кнопки и текст — без лишнего.
export function VerseCard({ n, selected, open, onSelect, onToggle, wide }) {
  const prefs = useSel((d) => d.s.prefs);
  const playing = usePlayer((p) => p.n === n);
  const [manual, setManual] = useState(() => new Set());
  const hide = {
    level: prefs.hideLevel, first: prefs.firstLetters, manual,
    toggle: (k) => setManual((s) => { const x = new Set(s); x.has(k) ? x.delete(k) : x.add(k); return x; }),
  };
  const show = displayOf(prefs);
  return html`<article id=${"b" + n} class=${cx("vcard", selected && "sel", playing && "playing")} onClick=${(e) => { if (wide && !e.target.closest("button,a,.w")) onSelect(n); }}>
    <div class="vhead">
      <${VNum} n=${n} onClick=${() => go("v" + n)} />
      <${VerseActions} n=${n} onSharh=${() => (wide ? onSelect(n) : onToggle(n))} sharhOn=${wide ? selected : open} />
    </div>
    ${show.ar && html`<${VerseText} n=${n} hide=${hide} blind=${prefs.audioOnly} />`}
    ${show.tr && html`<${Translation} n=${n} hidden=${show.ar && prefs.hideRu} />`}
    ${open && !wide && html`<${Sharh} n=${n} />`}
  </article>`;
}

// Шарх: объяснение, трудные слова, термины, правила, махраджи.
export function Sharh({ n, inMargin }) {
  const terms = termsInVerse(n);
  const rules = rulesForVerse(n);
  const words = vWords(n);
  const mkh = MAKHARIJ.filter((m) => m.v.includes(n));
  return html`<div class=${cx(!inMargin && "sharh")}>
    <div class="col" style="gap:14px">
      <div><div class="label" style="margin-bottom:6px">${L("Объяснение", "Explanation", "الشرح")}</div><p><${RichText} text=${vSharh(n)} /></p></div>
      ${words.length > 0 && html`<div><div class="label" style="margin-bottom:8px">${L("Трудные слова", "Difficult words", "غريب الكلمات")}</div>
        <div class="words">${words.map(([ar, m]) => html`<div class="word"><span class="ar ar-text" lang="ar">${ar}</span><span>${m}</span></div>`)}</div></div>`}
      ${terms.length > 0 && html`<div><div class="label" style="margin-bottom:8px">${L("Термины в бейте", "Terms in this bayt", "مصطلحات البيت")}</div>
        <div class="row" style="gap:6px">${terms.map((t) => html`<button class=${"chip tchip k-" + t.k} onClick=${(e) => openPop(e.currentTarget, () => html`<${TermCard} t=${t} n=${n} />`)}>
          <bdi class="ar-inline">${t.ar}</bdi>${LANG !== "ar" && html` ${termL(t).tr}`}</button>`)}</div></div>`}
      ${mkh.length > 0 && html`<div><div class="label" style="margin-bottom:8px">${L("На модели махраджей", "On the makharij model", "على نموذج المخارج")}</div>
        <div class="row" style="gap:6px">${mkh.map((m) => html`<button class="chip" onClick=${() => go("makharij", { letter: m.letters[0] })}>
          <bdi class="ar-inline">${m.letters.map((k) => LETTER_BY_KEY[k].disp || LETTER_BY_KEY[k].ch).join(" ")}</bdi> ${LANG === "ar" ? "" : mkhL(m).t}</button>`)}</div></div>`}
      ${rules.length > 0 && html`<div><div class="label" style="margin-bottom:8px">${L("Связанные правила", "Related rules", "قواعد ذات صلة")}</div>
        <div class="row" style="gap:6px">${rules.map((r) => html`<button class="chip" onClick=${() => go("rule-" + r.id, { from: n })}><${Icon} name="scroll" />${ruleL(r).t}</button>`)}</div></div>`}
    </div>
  </div>`;
}

// Правая колонка «хашия» на широких экранах.
export function Hashiya({ n }) {
  const s = useSel((d) => (n ? d.s.verses[n]?.s || 0 : 0));
  if (!n) return html`<div class="card"><p class="muted">${L("Выберите бейт, чтобы увидеть шарх на полях.", "Select a bayt to see its commentary in the margin.", "اختر بيتًا لترى شرحه في الهامش.")}</p></div>`;
  const sec = sectionOf(n);
  return html`<div class="card col" style="gap:12px">
    <div class="row" style="justify-content:space-between"><div><div class="eyebrow">${bayt(n)}</div><div class="muted" style="font-size:13px">${secName(sec)}</div></div><${StatusPill} s=${s} /></div>
    <div class="h-ar ar-text" lang="ar">${V[n].a[0].replace(/[{}]/g, "")}<br />${V[n].a[1].replace(/[{}]/g, "")}</div>
    <div class="hr"></div>
    <${Sharh} n=${n} inMargin=${true} />
    <div class="row"><button class="btn sm primary" onClick=${() => go("v" + n)}>${L("Изучать бейт", "Study this bayt", "دراسة البيت")}<${Icon} name="chevR" /></button>
      <button class="btn sm" onClick=${() => togglePlay(n)}><${Icon} name="play" />${L("Слушать", "Listen", "استمع")}</button></div>
  </div>`;
}

export function VerseQuote({ n, showTr = true }) {
  const tr = showTr ? vTr(n) : null;
  return html`<div class="vquote">
    <div class="row" style="justify-content:space-between"><span class="label">${bayt(n)}</span>
      <span class="row" style="gap:4px"><button class="icon-btn sm" title=${L("Слушать", "Listen", "استمع")} aria-label=${L("Слушать бейт", "Listen", "استمع إلى البيت")} onClick=${() => togglePlay(n)}><${Icon} name="play" /></button>
      <button class="icon-btn sm" title=${L("Открыть бейт", "Open bayt", "فتح البيت")} aria-label=${L("Открыть бейт", "Open bayt", "فتح البيت")} onClick=${() => go("v" + n)}><${Icon} name="chevR" /></button></span></div>
    <div class="ar ar-text" lang="ar">${V[n].a.map((a) => a.replace(/[{}]/g, "")).join("  ✦  ")}</div>
    ${tr && html`<div class="tr" lang=${TR} dir="ltr">${tr.join(" ")}</div>`}
  </div>`;
}

export const currentPlaying = () => P.n;
export { D };
