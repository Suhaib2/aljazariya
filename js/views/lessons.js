// Уроки: видео из плейлиста YouTube (данные — в data/lessons.js), по главам матна.
// Какие уроки открывались, помнит только этот браузер.
import { html, useState, cx } from "../lib.js";
import { PLAYLIST, LESSONS } from "../data/lessons.js";
import { SECTION } from "../data/index.js";
import { go } from "../core/nav.js";
import { L, LANG, secName, fmtDur, nLesson } from "../core/i18n.js";
import { Icon, RichText } from "../ui/kit.js";

const titleOf = (t) => (typeof t === "string" ? t : t?.[LANG] || t?.ru || t?.en || t?.ar || "");
const videoUrl = (id) => `https://www.youtube.com/watch?v=${encodeURIComponent(id)}${PLAYLIST ? "&list=" + encodeURIComponent(PLAYLIST) : ""}`;
const listUrl = () => `https://www.youtube.com/playlist?list=${encodeURIComponent(PLAYLIST)}`;
const seconds = (d) => (d || "").split(":").reduce((a, x) => a * 60 + (+x || 0), 0);

// Номера — как на YouTube: видео с x не нумеруются. Подряд идущие уроки одной главы — одна группа.
let count = 0;
const ITEMS = LESSONS.map((x) => ({ ...x, n: x.x ? 0 : ++count, sec: SECTION[x.s] || null }));
const GROUPS = ITEMS.reduce((gs, x) => {
  const g = gs[gs.length - 1];
  if (g && g.sec === x.sec) g.items.push(x);
  else gs.push({ sec: x.sec, items: [x] });
  return gs;
}, []);
const TOTAL_SEC = ITEMS.reduce((a, x) => a + seconds(x.d), 0);

const KEY = "jz.lessons.v1";
function loadMem() {
  try { const m = JSON.parse(localStorage.getItem(KEY)); return m && typeof m === "object" ? m : {}; } catch { return {}; }
}

function GroupHead({ g }) {
  const nums = g.items.filter((x) => x.n).map((x) => x.n);
  const a = nums[0], b = nums[nums.length - 1];
  const range = !a ? "" : a === b ? L(`Урок ${a}`, `Lesson ${a}`, `الدرس ${a}`) : L(`Уроки ${a}–${b}`, `Lessons ${a}–${b}`, `الدروس ${a}–${b}`);
  const dur = fmtDur(g.items.reduce((s, x) => s + seconds(x.d), 0));
  return html`<div class="l-head">
    <h2>${g.sec ? secName(g.sec) : L("Дополнительно", "Extras", "إضافات")}</h2>
    <span class="muted num">${range}${range && " · "}${dur}</span>
    ${g.sec && html`<button class="chip" title=${L("Открыть главу в матне", "Open the chapter in the matn", "فتح الباب في المتن")} onClick=${() => go("sec-" + g.sec.id)}>
      <${Icon} name="book" />${L(`Бейты ${g.sec.from}–${g.sec.to}`, `Bayts ${g.sec.from}–${g.sec.to}`, `الأبيات ${g.sec.from}–${g.sec.to}`)}</button>`}
  </div>`;
}

export function LessonsView() {
  const [mem, setMem] = useState(loadMem);
  const seen = mem.seen || {};
  const last = ITEMS.find((x) => x.id === mem.last);
  const mark = (id) => {
    const next = { last: id, seen: { ...seen, [id]: 1 } };
    setMem(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* отметка продержится до перезагрузки */ }
  };
  const toLast = () => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("ls-" + last.id)?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
  };

  const card = (x) => html`<li class=${cx("card lesson", seen[x.id] && "seen", last === x && "last")} id=${"ls-" + x.id}>
    <span class="lesson-n num">${x.n || html`<${Icon} name="scroll" />`}</span>
    <div class="col grow" style="gap:4px;min-width:0"><b class="lesson-t"><${RichText} text=${titleOf(x.t)} links=${false} /></b>
      <span class="row muted" style="gap:4px 12px;font-size:13px;flex-wrap:wrap">${x.d && html`<span class="num"><${Icon} name="clock" /> ${x.d}</span>`}
        ${last === x ? html`<span class="l-mark"><${Icon} name="bookmark" /> ${L("последний открытый", "opened last", "آخر ما فتحته")}</span>`
        : seen[x.id] && html`<span><${Icon} name="check" /> ${L("вы открывали", "opened before", "فتحته من قبل")}</span>`}</span></div>
    <a class="btn sm primary" href=${videoUrl(x.id)} target="_blank" rel="noopener noreferrer" onClick=${() => mark(x.id)}
      aria-label=${x.n ? L(`Смотреть урок ${x.n}`, `Watch lesson ${x.n}`, `مشاهدة الدرس ${x.n}`) : L("Смотреть видео", "Watch the video", "مشاهدة المقطع")}><${Icon} name="play" /><span class="l-watch">${L("Смотреть", "Watch", "مشاهدة")}</span></a>
  </li>`;

  return html`<div>
    <div class="page-head"><div><h1>${L("Уроки", "Lessons", "الدروس")}</h1>
      <p class="sub">${L("Разбор матна аль-Джазарии от доктора Аймана Рушди Сувейда. Уроки на арабском языке, каждый открывается на YouTube в новой вкладке.", "Dr. Ayman Rushdi Suwayd explains the Matn al-Jazariyya. The lessons are in Arabic; each one opens on YouTube in a new tab.", "شرح متن الجزرية للدكتور أيمن رشدي سويد. يُفتح كل درس على YouTube في نافذة جديدة.")}</p>
      ${ITEMS.length > 0 && html`<p class="l-meta muted num">${nLesson(count)} · ${fmtDur(TOTAL_SEC)}</p>`}</div>
      <div class="row" style="gap:8px;flex-wrap:wrap">
        ${last && html`<button class="btn" title=${L("Последний урок, который вы открывали", "The last lesson you opened", "آخر درس فتحته")} onClick=${toLast}>
          <${Icon} name="bookmark" />${last.n ? L(`К уроку ${last.n}`, `Go to lesson ${last.n}`, `إلى الدرس ${last.n}`) : L("К последнему видео", "Go to the last video", "إلى آخر مقطع")}</button>`}
        ${PLAYLIST && html`<a class="btn" href=${listUrl()} target="_blank" rel="noopener noreferrer"><${Icon} name="external" />${L("Весь плейлист", "Whole playlist", "قائمة التشغيل كاملة")}</a>`}
      </div></div>
    ${ITEMS.length ? html`<div class="l-groups">${GROUPS.map((g) => html`<section class="l-group">
        <${GroupHead} g=${g} />
        <ol class="lessons">${g.items.map(card)}</ol>
      </section>`)}</div>`
    : html`<div class="card pad-lg lessons-empty">
        <span class="login-ico"><${Icon} name="lesson" /></span>
        <div class="col" style="gap:6px"><h3>${L("Уроки скоро появятся", "Lessons are coming soon", "الدروس قريبًا")}</h3>
          <p class="ink2">${L("Здесь будут видеоуроки с YouTube по главам матна.", "Video lessons from YouTube on the chapters of the matn will be here.", "ستظهر هنا دروس مرئية من YouTube في أبواب المتن.")}</p></div>
      </div>`}
  </div>`;
}
