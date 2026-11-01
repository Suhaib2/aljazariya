// Матн: только текст поэмы. Переход по главам — в боковой панели, остальное — в настройках.
import { html, useState, useEffect, useMedia, cx } from "../lib.js";
import { SECTIONS, SECTION, sectionVerses } from "../data/index.js";
import { useSel, sectionProgress, D } from "../core/store.js";
import { usePlayer, playQueue } from "../core/audio.js";
import { go, route } from "../core/nav.js";
import { L, LANG, secName } from "../core/i18n.js";
import { Icon } from "../ui/kit.js";
import { VerseCard, Hashiya } from "../ui/verse.js";

// Глава, которая сейчас на экране, — для подсветки в боковом меню.
let curSec = null;
const secSubs = new Set();
function setCurSec(id) { if (id !== curSec) { curSec = id; secSubs.forEach((fn) => fn()); } }
export function useReadSection() {
  const [, force] = useState(0);
  useEffect(() => { const fn = () => force((x) => x + 1); secSubs.add(fn); return () => secSubs.delete(fn); }, []);
  return curSec;
}

export function ReadView() {
  const follow = useSel((d) => d.s.prefs.follow);
  const wide = useMedia("(min-width: 1280px)");
  const [sel, setSel] = useState(() => D.s.last || 1);
  const [open, setOpen] = useState({});
  const playingN = usePlayer((p) => (p.playing ? p.n : null));
  const r = route();

  useEffect(() => {
    const target = r.sec ? document.getElementById("sec-" + r.sec) : r.state?.n ? document.getElementById("b" + r.state.n) : null;
    if (target) setTimeout(() => target.scrollIntoView({ block: r.sec ? "start" : "center" }), 60);
    if (r.state?.n) setSel(r.state.n);
  }, [r.sec, r.state?.n, r.state?.at]);

  useEffect(() => {
    if (!playingN || !follow) return;
    const el = document.getElementById("b" + playingN);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < 120 || rect.bottom > window.innerHeight - 90) el.scrollIntoView({ block: "center", behavior: "smooth" });
    if (wide) setSel(playingN);
  }, [playingN]);

  useEffect(() => {
    let raf = 0;
    const spy = () => {
      raf = 0;
      let id = SECTIONS[0].id;
      for (const el of document.querySelectorAll(".sec-head")) { if (el.getBoundingClientRect().top < 160) id = el.id.slice(4); else break; }
      setCurSec(id);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(spy); };
    window.addEventListener("scroll", onScroll, { passive: true });
    spy();
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); setCurSec(null); };
  }, []);

  const toggleOpen = (n) => setOpen((o) => ({ ...o, [n]: !o[n] }));
  return html`<div class=${cx("reader", wide && "with-margin")}>
    <div>
      ${SECTIONS.map((sec) => html`<${SectionBlock} key=${sec.id} sec=${sec} sel=${sel} open=${open} wide=${wide} onSelect=${setSel} onToggle=${toggleOpen} />`)}
    </div>
    ${wide && html`<aside class="hashiya" aria-label=${L("Шарх на полях", "Commentary in the margin", "الشرح في الهامش")}><${Hashiya} n=${sel} /></aside>`}
  </div>`;
}

// Заголовок главы — на языке сайта: арабский только в арабской версии.
function SectionBlock({ sec, sel, open, wide, onSelect, onToggle }) {
  const p = useSel((d) => sectionProgress(sec, d.s).learned);
  const total = sec.to - sec.from + 1;
  return html`<section>
    <div class="sec-head" id=${"sec-" + sec.id}>
      ${LANG === "ar" ? html`<h2 class="sec-ar" lang="ar">${sec.ar}</h2>` : html`<h2>${secName(sec)}</h2>`}
      <div class="sec-meta">
        <span class="meta num">${sec.from}–${sec.to} · ${p}/${total}</span>
        <button class="icon-btn sm" title=${L("Слушать раздел", "Listen to the section", "استمع إلى الباب")} aria-label=${L("Слушать раздел", "Listen to the section", "استمع إلى الباب")} onClick=${() => playQueue(sectionVerses(sec))}><${Icon} name="play" /></button>
        <button class="icon-btn sm" title=${L("Тест раздела", "Section test", "اختبار الباب")} aria-label=${L("Тест раздела", "Section test", "اختبار الباب")} onClick=${() => go("test-" + sec.id)}><${Icon} name="tests" /></button>
      </div>
    </div>
    <div class="verses">${sectionVerses(sec).map((n) => html`<${VerseCard} key=${n} n=${n} selected=${wide && sel === n} open=${!!open[n]} wide=${wide} onSelect=${onSelect} onToggle=${onToggle} />`)}</div>
  </section>`;
}

export { SECTION };
