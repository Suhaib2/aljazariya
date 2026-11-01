// Страница махраджей: 2D-разрез и 3D-модель головы с буквами в местах образования.
import { html, useState, useEffect, useRef, cx } from "../lib.js";
import { LETTERS, LETTER_BY_KEY, MAKHRAJ_BY_ID, MAKHARIJ as MAKHARIJ_LIST, keySifaVerse, ORGANS } from "../data/index.js";
import { act, useSel } from "../core/store.js";
import { go, route } from "../core/nav.js";
import { Icon, Seg } from "../ui/kit.js";
import { L as T, LANG, letterL, mkhL, sifaL, organName, bayt } from "../core/i18n.js";
import { VerseQuote } from "../ui/verse.js";
import { SideSVG, TopSVG, FrontSVG, VIEWS, MARKS, LABELS, HOTSPOTS, TALL } from "../model/anatomy.js";

const ORDER = ["overview", "throat", "tongue", "teeth", "lips", "nose", "jawf"];
const VIEW_OF_ORGAN = { jawf: "jawf", throat: "throat", tongue: "tongue", teeth: "teeth", lips: "lips", nose: "nose" };
const KCOLOR = { jawf: "var(--k-madd)", throat: "var(--k-waqf)", tongue: "var(--k-mkh)", teeth: "var(--k-rule)", lips: "var(--k-sfa)", nose: "var(--k-nun)" };
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const viewName = (v) => T(...(VIEWS[v]?.t || [VIEWS[v]?.ru]));
export function letterTip(k) {
  const L = letterL(LETTER_BY_KEY[k]), M = mkhL(MAKHRAJ_BY_ID[L.mk]);
  const many = M.v.length > 1;
  return html`<div><b>${L.disp || L.ch}</b> ${L.name} · ${T(`махрадж — бейт${many ? "ы" : ""}`, `makhraj — bayt${many ? "s" : ""}`, many ? "المخرج: البيتان" : "المخرج: البيت")} ${M.v.join("–")}<br /><span style="opacity:.8">${M.t}</span></div>`;
}

// Маркер-группа: несколько букв одного махраджа рядом.
function Marker({ m, x, y, sel, big, onSelect, onTip }) {
  const M = MAKHRAJ_BY_ID[m.mk];
  const keys = m.only || M.letters;
  const color = KCOLOR[M.organ];
  return html`<div class=${cx("mk", big && "big", !big && "sm")} style=${`left:${x}px;top:${y}px;--k:${color};${m.ghost ? "opacity:.55" : ""}`}>
    ${keys.map((k) => {
      const L = LETTER_BY_KEY[k];
      return html`<button class=${cx(sel === k && "on", k === "ghunna" && "gh", TALL.test(L.disp || "") && "tall")} aria-label=${letterL(L).name} onClick=${() => onSelect(k)}
        onPointerEnter=${(e) => onTip(k, e.currentTarget)} onPointerLeave=${() => onTip(null)} onFocus=${(e) => onTip(k, e.currentTarget)} onBlur=${() => onTip(null)}>${L.disp || L.ch}</button>`;
    })}
  </div>`;
}

export function Model2D({ view, setView, sel, onSelect, labels }) {
  const stage = useRef();
  const [size, setSize] = useState({ w: 800, h: 680 });
  const [vb, setVb] = useState(VIEWS.overview.vb);
  const [layer, setLayer] = useState("side");
  const [shown, setShown] = useState("overview");
  const [busy, setBusy] = useState(false);
  const [tip, setTip] = useState(null);
  const cur = useRef({ view: "overview", vb: VIEWS.overview.vb, seq: 0 });

  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(stage.current);
    return () => ro.disconnect();
  }, []);

  const animVb = (to, ms, seq) => new Promise((res) => {
    const from = cur.current.vb, t0 = performance.now();
    const step = (t) => {
      if (seq !== cur.current.seq) return res();
      const k = Math.min(1, (t - t0) / ms), e = ease(k);
      const v = from.map((f, i) => f + (to[i] - f) * e);
      cur.current.vb = v; setVb(v);
      k < 1 ? requestAnimationFrame(step) : res();
    };
    requestAnimationFrame(step);
  });

  useEffect(() => {
    const from = cur.current.view;
    if (from === view) return;
    const seq = ++cur.current.seq;
    const A = VIEWS[from], B = VIEWS[view];
    const run = async () => {
      setBusy(true); setTip(null);
      if (A.layer === "side" && B.layer === "side") {
        await animVb(B.vb, 700, seq);
      } else if (A.layer === "side") {
        await animVb(B.from, 520, seq);
        if (seq !== cur.current.seq) return;
        setLayer(B.layer); await wait(780);
      } else if (B.layer === "side") {
        cur.current.vb = A.from; setVb(A.from); setLayer("side"); await wait(760);
        if (seq !== cur.current.seq) return;
        await animVb(B.vb, 620, seq);
      } else {
        cur.current.vb = A.from; setVb(A.from); setLayer("side"); await wait(700);
        await animVb(B.from, 420, seq);
        if (seq !== cur.current.seq) return;
        setLayer(B.layer); await wait(780);
      }
      if (seq !== cur.current.seq) return;
      cur.current.view = view; setShown(view); setBusy(false);
    };
    run();
  }, [view]);

  const box = layer === "side" ? vb : layer === "top" ? [-80, 0, 680, 440] : [0, 0, 600, 420];
  const map = ([x, y], b = box) => {
    const [vx, vy, vw, vh] = b, s = Math.min(size.w / vw, size.h / vh);
    return [(x - vx) * s + (size.w - vw * s) / 2, (y - vy) * s + (size.h - vh * s) / 2];
  };
  const compact = size.w < 560 && shown === "overview";
  const marks = busy && VIEWS[view].layer !== VIEWS[shown].layer ? [] : MARKS[shown] || [];
  const big = shown !== "overview";
  const onTip = (k, el) => {
    if (!k) return setTip(null);
    const r = el.getBoundingClientRect(), s = stage.current.getBoundingClientRect();
    setTip({ k, x: r.left + r.width / 2 - s.left, y: r.top - s.top });
  };
  const lines = compact ? [] : marks.filter((m) => m.to).map((m) => [map(m.at), map(m.to)]);

  return html`<div class="stage" ref=${stage}>
    <div class=${cx("layer", layer === "top" && "out-up", layer === "front" && "out-side")}>
      <${SideSVG} vb=${vb} onOrgan=${busy ? null : (o) => setView(VIEW_OF_ORGAN[o])} flow=${shown === "jawf"} nasalFlow=${shown === "nose"} dim=${false} />
    </div>
    <div class=${cx("layer", layer !== "top" && "in-down")}><${TopSVG} /></div>
    <div class=${cx("layer", layer !== "front" && "in-side")}><${FrontSVG} /></div>
    <svg class="marks" style="width:100%;height:100%;position:absolute;inset:0;pointer-events:none" aria-hidden="true">
      ${lines.map(([a, b]) => html`<g><line x1=${a[0]} y1=${a[1]} x2=${b[0]} y2=${b[1]} style="stroke:var(--ink-3);stroke-width:1;opacity:.7" /><circle cx=${b[0]} cy=${b[1]} r="3" style="fill:var(--ink-2)" /></g>`)}
    </svg>
    <div class="marks">
      ${labels && !busy && (LABELS[shown] || []).map((l) => { const [x, y] = map(l.at); return html`<span class="alabel-html" style=${`position:absolute;left:${x}px;top:${y}px;transform:translate(-50%,-50%);font-size:11.5px;color:var(--a-label);white-space:nowrap;pointer-events:none;font-weight:500;text-shadow:0 0 6px var(--paper)`}>${Array.isArray(l.t) ? T(...l.t) : l.t}</span>`; })}
      ${compact ? !busy && HOTSPOTS.map((hs) => { const [x, y0] = map(hs.at), y = y0 + (hs.o === "throat" ? 9 : 0); const count = MAKHARIJ_LIST.filter((m) => m.organ === hs.o).reduce((a, m) => a + m.letters.length, 0);
          return html`<div class="mk" style=${`left:${x}px;top:${y}px;--k:${KCOLOR[hs.o]}`}><button class="gh" onClick=${() => setView(VIEW_OF_ORGAN[hs.o])}>${T(...hs.t)} · ${count}</button></div>`; })
        : marks.map((m, i) => { const [x, y] = map(m.at); return html`<${Marker} key=${shown + i} m=${m} x=${x} y=${y} sel=${sel} big=${big} onSelect=${onSelect} onTip=${onTip} />`; })}
    </div>
    ${tip && html`<div class="mk-tip on" style=${`left:${tip.x}px;top:${tip.y}px`}>${letterTip(tip.k)}</div>`}
    <div class="view-title">${shown !== "overview" && html`<button class="tag" onClick=${() => setView("overview")} style="cursor:pointer;border-color:var(--rule-2)"><${Icon} name="arrowL" />${viewName("overview")}</button>`}<span class="tag">${viewName(busy ? view : shown)}</span></div>
    <div class="stage-hint">${shown === "overview" ? (compact ? T("Нажмите на группу букв, чтобы рассмотреть", "Tap a group of letters to look closer", "انقر مجموعة حروف لتكبيرها") : T("Нажмите на орган — камера приблизит его", "Click an organ and the camera zooms in", "انقر عضوًا لتقترب منه الكاميرا")) : T("Наведите на букву — номер бейта; нажмите — бейты и сифаты", "Hover a letter for its bayt; click for the bayts and sifat", "مرّر على الحرف لرقم البيت، وانقره للأبيات والصفات")}</div>
  </div>`;
}

// Карточка выбранной буквы: два бейта (махрадж и сифат) и список сифатов.
export function LetterInfo({ k, onShow }) {
  if (!k) return html`<div class="card col" style="gap:10px">
    <h3>${T("Выберите букву", "Choose a letter", "اختر حرفًا")}</h3>
    <p class="ink2" style="line-height:1.6">${T("Нажмите на букву в кружке на модели или в ряду букв под ней. Здесь появятся бейт о месте её образования, бейт о её отличительном сифате и все её качества.", "Click a letter in a circle on the model or in the row of letters below it. Here you will see the bayt about where it is produced, the bayt about its distinctive sifa and all of its qualities.", "انقر حرفًا في دائرة على النموذج أو في صفّ الحروف تحته؛ يظهر هنا بيت مخرجه وبيت صفته المميّزة وجميع صفاته.")}</p>
    <div class="legend">${Object.keys(ORGANS).map((id) => html`<span><i style=${`background:${KCOLOR[id]}`}></i>${organName(id)}</span>`)}</div>
  </div>`;
  const L = letterL(LETTER_BY_KEY[k]), M = mkhL(MAKHRAJ_BY_ID[L.mk]), sv = keySifaVerse(L);
  const verses = [...new Set([...M.v, sv])];
  return html`<div class="card col" style="gap:14px">
    <div class="row" style="gap:14px;align-items:center;flex-wrap:nowrap">
      <div class=${cx("big-letter", TALL.test(L.disp || "") && "tall", (L.disp || "").includes(" ") && "pair")} lang="ar">${L.disp || L.ch}</div>
      <div class="col" style="gap:2px;min-width:0"><div class="eyebrow">${organName(M.organ)}</div><h2 style="font-size:24px">${L.name[0].toUpperCase() + L.name.slice(1)}</h2>
        ${LANG !== "ar" && html`<div class="muted"><bdi class="ar-inline">${L.ar}</bdi></div>`}</div>
    </div>
    <div><div class="label" style="margin-bottom:4px">${T("Махрадж", "Makhraj", "المخرج")}</div><b>${M.t}</b>${LANG !== "ar" && html` · <bdi class="ar-inline">${M.ar}</bdi>`}<p class="ink2" style="margin-top:4px">${M.desc}</p></div>
    <div class="col" style="gap:8px" id="mk-dalil">
      <div class="label">${T("Бейт о махрадже", "The bayt on the makhraj", "بيت المخرج")}${M.v.length > 1 ? T(" (продолжение в следующем)", " (continued in the next)", " (ويتمّ في الذي يليه)") : ""}</div>
      ${M.v.map((v) => html`<${VerseQuote} n=${v} />`)}
      ${!M.v.includes(sv) && html`<div class="label" style="margin-top:6px">${T("Бейт о сифате буквы", "The bayt on the letter’s sifa", "بيت صفة الحرف")}</div><${VerseQuote} n=${sv} />`}
    </div>
    ${L.sf.length > 0 && html`<div><div class="label" style="margin-bottom:8px">${T("Сифаты", "Sifat", "الصفات")}</div><div class="row" style="gap:6px">
      ${L.sf.map((id) => { const s = sifaL(id); return html`<button class="chip" title=${bayt(s.v)} onClick=${() => go("rule-" + s.rule, { letter: k })}>${s.t} <span class="muted">· ${s.short}</span> <span class="num muted">${s.v}</span></button>`; })}</div></div>`}
    ${L.note && html`<div class="note-box">${L.note}</div>`}
    <div class="row">${onShow && html`<button class="btn sm soft" onClick=${() => onShow(VIEW_OF_ORGAN[M.organ])}><${Icon} name="search" />${T("Показать крупно", "Zoom in", "تكبير")}</button>`}
      ${verses.map((v) => html`<button class="btn sm ghost" onClick=${() => go("v" + v)}>${bayt(v)}<${Icon} name="chevR" /></button>`)}</div>
  </div>`;
}

function Model3DHost({ view, setView, sel, onSelect, onFail }) {
  const host = useRef();
  const ctl = useRef(null);
  const [state, setState] = useState("loading");
  const [tip, setTip] = useState(null);
  useEffect(() => {
    let dead = false;
    import("../model/head3d.js").then((mod) => mod.mount(host.current, {
      onSelect: (k) => onSelectRef.current(k),
      onView: (v) => setViewRef.current(v),
      onTip: (k, x, y) => setTip(k ? { k, x, y } : null),
    })).then((c) => { if (dead) c.destroy(); else { ctl.current = c; c.setView(viewRef.current, true); c.setSel(selRef.current); setState("ready"); } })
      .catch((e) => { console.error(e); if (!dead) setState("error"); });
    return () => { dead = true; ctl.current?.destroy(); ctl.current = null; };
  }, []);
  const onSelectRef = useRef(onSelect); onSelectRef.current = onSelect;
  const setViewRef = useRef(setView); setViewRef.current = setView;
  const viewRef = useRef(view); viewRef.current = view;
  const selRef = useRef(sel); selRef.current = sel;
  useEffect(() => { ctl.current?.setView(view); }, [view]);
  useEffect(() => { ctl.current?.setSel(sel); }, [sel]);
  return html`<div class="stage" ref=${host}>
    ${state === "loading" && html`<div class="loading" style="position:absolute;inset:0;min-height:0"><div><${Icon} name="cube" /><p>${T("Загружаем 3D-модель…", "Loading the 3D model…", "جارٍ تحميل النموذج ثلاثي الأبعاد…")}</p></div></div>`}
    ${state === "error" && html`<div class="loading" style="position:absolute;inset:0;min-height:0"><div class="col" style="gap:10px;align-items:center"><p>${T("Не удалось запустить 3D (нужен WebGL).", "3D could not start (WebGL is required).", "تعذّر تشغيل العرض ثلاثي الأبعاد (يلزم WebGL).")}</p><button class="btn sm" onClick=${onFail}><${Icon} name="square" />${T("Открыть 2D", "Open 2D", "فتح العرض ثنائي الأبعاد")}</button></div></div>`}
    ${tip && html`<div class="mk-tip on" style=${`left:${tip.x}px;top:${tip.y}px;z-index:6`}>${letterTip(tip.k)}</div>`}
    <div class="view-title">${view !== "overview" && html`<button class="tag" onClick=${() => setView("overview")} style="cursor:pointer"><${Icon} name="arrowL" />${viewName("overview")}</button>`}<span class="tag">${viewName(view)}</span></div>
    <div class="stage-hint">${T("Вращайте мышью или пальцем · колесо — масштаб · нажмите на орган", "Rotate with the mouse or a finger · wheel to zoom · click an organ", "أدِر بالفأرة أو بالإصبع · العجلة للتكبير · انقر عضوًا")}</div>
  </div>`;
}

export function MakharijView() {
  const r = route();
  const pref3d = useSel((d) => d.s.prefs.model === "3d");
  const labels = useSel((d) => d.s.prefs.mkLabels);
  const [force2d, setForce2d] = useState(false);
  const [view, setView] = useState("overview");
  const [sel, setSel] = useState(r.state?.letter || null);
  useEffect(() => { if (r.state?.letter) setSel(r.state.letter); }, [r.state?.letter]);
  // После выбора буквы страница сама прокручивается к бейтам-доказательствам, если их не видно.
  const select = (k) => {
    setSel(k); act.logLetter(k);
    setTimeout(() => {
      const el = document.getElementById("mk-dalil");
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      if (top < 70 || top > window.innerHeight * 0.55) el.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }, 60);
  };
  const is3d = pref3d && !force2d;
  return html`<div>
    <div class="page-head"><div><h1>${T("Махраджи", "Makharij", "المخارج")}</h1>
      <p class="sub">${T("Где рождается каждый звук: 17 мест образования по Ибн аль-Джазари. Нажмите на орган — камера приблизится; язык откроется видом сверху, губы — видом спереди.",
        "Where each sound is born: the 17 points of articulation according to Ibn al-Jazari. Click an organ and the camera zooms in; the tongue opens in a top view, the lips in a front view.",
        "أين يولد كل صوت: سبعة عشر مخرجًا على مذهب ابن الجزري. انقر عضوًا لتقترب منه الكاميرا؛ يظهر اللسان من الأعلى والشفتان من الأمام.")}</p></div></div>
    <div class="mk-wrap">
      <div class="card mk-stage-card">
        <div class="mk-bar">
          <div class="row" style="gap:6px">${ORDER.map((v) => html`<button class=${cx("chip", view === v && "on")} onClick=${() => setView(v)}>${v === "overview" ? T("Вся голова", "Whole head", "الرأس كاملًا") : organName(v).split(" (")[0]}</button>`)}</div>
          <div style="margin-inline-start:auto">
            <${Seg} small label=${T("Вид модели", "Model view", "نوع النموذج")} value=${is3d ? "3d" : "2d"} onChange=${(v) => { act.setPref("model", v); setForce2d(false); }}
              options=${[{ v: "2d", label: html`<span class="row" style="gap:6px"><${Icon} name="square" />2D</span>` }, { v: "3d", label: html`<span class="row" style="gap:6px"><${Icon} name="cube" />3D</span>` }]} />
          </div>
        </div>
        ${is3d ? html`<${Model3DHost} view=${view} setView=${setView} sel=${sel} onSelect=${select} onFail=${() => setForce2d(true)} />`
          : html`<${Model2D} view=${view} setView=${setView} sel=${sel} onSelect=${select} labels=${labels} />`}
        <div class="letter-strip" role="group" aria-label=${T("Все буквы", "All letters", "كل الحروف")}>
          ${LETTERS.map((x) => html`<button class=${cx(sel === x.k && "on", x.madd && "madd")} title=${letterL(x).name} lang="ar" onClick=${() => select(x.k)}>${x.disp || x.ch}</button>`)}
        </div>
      </div>
      <div class="col" style="gap:14px"><${LetterInfo} k=${sel} onShow=${setView} /></div>
    </div>
  </div>`;
}
