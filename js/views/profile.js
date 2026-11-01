// Личный кабинет: прогресс, цель дня, рейтинг разделов, достижения, закладки, история.
// Сейчас вкладка скрыта (SHOW_CABINET в config.js), код оставлен на будущее.
import { html, useState, cx } from "../lib.js";
import { V, TOTAL, SECTIONS, sectionOf } from "../data/index.js";
import { useSel, act, D, learnedCount, learningCount, streak, todayKey, levelOf, levelName, sectionRating, ACH, achText } from "../core/store.js";
import { go } from "../core/nav.js";
import { L, bayt, nDay, secName, fmtDate, fmtDur } from "../core/i18n.js";
import { Icon, Seg, Ring, Bar, statusName } from "../ui/kit.js";

function Heatmap({ daily }) {
  const days = [];
  const now = new Date();
  const start = new Date(now); start.setDate(now.getDate() - 83 - ((now.getDay() + 6) % 7));
  for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
    const k = todayKey(d.getTime()), xp = daily[k]?.xp || 0;
    days.push({ k, l: xp === 0 ? 0 : xp < 15 ? 1 : xp < 40 ? 2 : 3 });
  }
  return html`<div class="heat" role="img" aria-label=${L("Активность за 12 недель", "Activity over 12 weeks", "النشاط خلال 12 أسبوعًا")}>${days.map((d) => html`<i data-l=${d.l} title=${d.k}></i>`)}</div>`;
}

export function ProfileView() {
  const s = useSel((d) => d.s);
  const h = useSel((d) => d.h);
  const [histTab, setHistTab] = useState("study");
  const [listTab, setListTab] = useState("bookmarks");
  const lvl = levelOf(s.xp), st = streak(s), today = s.daily[todayKey()] || {};
  const learned = learnedCount(s);
  const tests = Object.values(s.tests);
  const avgTest = tests.length ? Math.round(tests.reduce((a, t) => a + t.best, 0) / tests.length) : 0;
  const study = h.study.filter((e) => e.type !== "exam");
  const listMap = listTab === "bookmarks" ? s.bookmarks : s.favorites;
  const listNs = Object.keys(listMap).map(Number).sort((a, b) => a - b);

  return html`<div class="col" style="gap:16px">
    <div class="page-head"><div><h1>${L("Личный кабинет", "My progress", "حسابي")}</h1></div></div>
    <div class="grid g-main">
      <div class="card pad-lg col" style="gap:14px">
        <div class="row" style="gap:16px;flex-wrap:nowrap">
          <div class="avatar"><${Icon} name="trophy" /></div>
          <div class="col grow" style="gap:6px;min-width:0">
            <h2 style="font-size:22px">${levelName(lvl)}</h2>
            <div class="row" style="gap:8px"><span class="chip"><${Icon} name="flame" />${nDay(st)} ${L("подряд", "in a row", "متتالية")}</span><span class="muted num">${s.xp} XP</span></div>
            <div style="max-width:360px"><${Bar} pct=${lvl.pct} kind="gilt" /></div>
            <span class="hint">${lvl.next ? L(`До уровня «${levelName(lvl.next)}» — ${lvl.next.xp - s.xp} XP`, `${lvl.next.xp - s.xp} XP to the “${levelName(lvl.next)}” level`, `بقي ${lvl.next.xp - s.xp} XP حتى مستوى «${levelName(lvl.next)}»`) : L("Высший уровень достигнут", "Top level reached", "بلغت أعلى مستوى")}</span>
          </div>
        </div>
        <p class="hint">${L("Прогресс хранится в этом браузере. На другом устройстве или после очистки данных сайта он начнётся заново.", "Progress is kept in this browser. On another device, or after clearing the site’s data, it starts over.", "يُحفظ التقدّم في هذا المتصفح، ويبدأ من جديد على جهاز آخر أو بعد مسح بيانات الموقع.")}</p>
      </div>
      <div class="card col" style="gap:12px">
        <div class="row" style="justify-content:space-between"><h3>${L("Ежедневная цель", "Daily goal", "الهدف اليومي")}</h3>
          <button class="icon-btn sm" title=${L("Изменить цель в настройках", "Change the goal in settings", "غيّر الهدف من الإعدادات")} aria-label=${L("Изменить цель в настройках", "Change the goal in settings", "غيّر الهدف من الإعدادات")} onClick=${() => go("options", { section: "goal" })}><${Icon} name="gear" /></button></div>
        <div class="row" style="justify-content:space-around">
          <div class="col" style="align-items:center;gap:6px"><${Ring} pct=${((today.learned || 0) / Math.max(1, s.goal.learn)) * 100} label=${`${today.learned || 0}/${s.goal.learn}`} color="var(--ok)" /><span class="muted" style="font-size:12px">${L("новые", "new", "جديدة")}</span></div>
          <div class="col" style="align-items:center;gap:6px"><${Ring} pct=${((today.reviewed || 0) / Math.max(1, s.goal.review)) * 100} label=${`${today.reviewed || 0}/${s.goal.review}`} /><span class="muted" style="font-size:12px">${L("повторение", "review", "مراجعة")}</span></div>
          <div class="col" style="align-items:center;gap:6px"><${Ring} pct=${((today.listenSec || 0) / 60 / Math.max(1, s.goal.listen)) * 100} label=${`${Math.round((today.listenSec || 0) / 60)}/${s.goal.listen}`} color="var(--gilt)" /><span class="muted" style="font-size:12px">${L("минут", "minutes", "دقائق")}</span></div>
        </div>
        <span class="label">${L("Активность за 12 недель", "Activity over 12 weeks", "النشاط خلال 12 أسبوعًا")}</span><${Heatmap} daily=${s.daily} />
      </div>
    </div>

    <div class="grid g4">
      <div class="card stat"><b>${learned}<span style="font-size:15px;color:var(--ink-3)"> / ${TOTAL}</span></b><span>${L("выучено", "learned", "محفوظ")}</span></div>
      <div class="card stat"><b>${learningCount(s)}</b><span>${L("изучаю", "learning", "قيد الحفظ")}</span></div>
      <div class="card stat"><b>${fmtDur(s.stats.listenSec)}</b><span>${L("прослушано", "listened", "استماع")}</span></div>
      <div class="card stat"><b>${avgTest}%</b><span>${L("средний лучший результат тестов", "average best test score", "متوسط أفضل نتائج الاختبارات")}</span></div>
    </div>

    <div class="card col" style="gap:8px">
      <div class="row" style="justify-content:space-between"><h3>${L("Рейтинг по разделам", "Rating by section", "التقييم حسب الأبواب")}</h3><span class="hint">${L("Оценка = 60% выученных бейтов + 40% лучшего теста", "Score = 60% learned bayts + 40% best test", "التقييم = 60% من المحفوظ + 40% من أفضل اختبار")}</span></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>${L("Раздел", "Section", "الباب")}</th><th>${L("Выучено", "Learned", "المحفوظ")}</th><th>${L("Тест", "Test", "الاختبار")}</th><th>${L("Оценка", "Score", "التقييم")}</th><th></th></tr></thead><tbody>
        ${SECTIONS.map((sec) => { const r = sectionRating(sec, s); return html`<tr>
          <td><b>${secName(sec)}</b><div class="muted num" style="font-size:12px">${L("бейты", "bayts", "الأبيات")} ${sec.from}–${sec.to}</div></td>
          <td style="min-width:140px"><div class="row" style="gap:8px;flex-wrap:nowrap"><div style="width:80px"><${Bar} pct=${r.pct} /></div><span class="num muted">${r.learned}/${r.total}</span></div></td>
          <td class="num">${r.test ? r.test + "%" : "—"}</td>
          <td><span class="stars">${"★".repeat(r.stars)}${"☆".repeat(3 - r.stars)}</span> <span class="muted" style="font-size:12.5px">${r.label}</span></td>
          <td><button class="btn sm ghost" onClick=${() => go("test-" + sec.id)}>${L("Тест", "Test", "اختبار")}</button></td></tr>`; })}
      </tbody></table></div>
    </div>

    <div class="card col" style="gap:12px">
      <div class="row" style="justify-content:space-between"><h3>${L("Достижения", "Achievements", "الإنجازات")}</h3><span class="muted num" dir="ltr">${Object.keys(s.ach).length} / ${ACH.length}</span></div>
      <div class="grid g3">${ACH.map((a) => { const t = achText(a); return html`<div class=${cx("ach", s.ach[a.id] && "got")}><div class="medal"><${Icon} name=${a.ico} /></div>
        <div style="min-width:0"><b class="a-t">${t.t}</b><div class="muted" style="font-size:12.5px">${t.d}</div>${s.ach[a.id] && html`<div class="muted" style="font-size:11.5px">${fmtDate(s.ach[a.id], false)}</div>`}</div></div>`; })}</div>
    </div>

    <div class="card col" style="gap:10px">
        <div class="row" style="justify-content:space-between"><h3>${L("Мои бейты", "My bayts", "أبياتي")}</h3>
          <${Seg} label=${L("Список", "List", "القائمة")} value=${listTab} onChange=${setListTab} small=${true} options=${[{ v: "bookmarks", label: L("Закладки", "Bookmarks", "العلامات") }, { v: "favorites", label: L("Избранное", "Favorites", "المفضلة") }]} /></div>
        ${listNs.length ? html`<div class="hist">${listNs.map((k) => html`<div class="h-row"><span class="num" style="width:30px;color:var(--gilt);font-weight:700">${k}</span>
          <span class="ar grow" lang="ar" style="font-size:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${V[k].a[0].replace(/[{}]/g, "")}</span>
          ${listTab === "bookmarks" && html`<input class="input" style="max-width:130px;min-height:30px;padding:3px 8px;font-size:12.5px" placeholder=${L("метка", "label", "وسم")} value=${s.bookmarks[k]?.label || ""} onChange=${(e) => act.labelBookmark(k, e.currentTarget.value)} aria-label=${L("Метка закладки", "Bookmark label", "وسم العلامة")} />`}
          <button class="icon-btn sm" aria-label=${L("Открыть", "Open", "فتح")} onClick=${() => go("v" + k)}><${Icon} name="chevR" /></button></div>`)}</div>`
          : html`<p class="hint">${listTab === "bookmarks" ? L("Добавляйте закладки значком ленты у бейта — например, на трудных местах.", "Add bookmarks with the ribbon icon next to a bayt — for example, at difficult places.", "أضف علامة بأيقونة الشريط بجانب البيت، مثلًا عند المواضع الصعبة.") : L("Отмечайте звездой любимые бейты.", "Star your favorite bayts.", "ضع نجمة على أبياتك المفضلة.")}</p>`}
    </div>

    <div class="card col" style="gap:10px">
      <div class="row" style="justify-content:space-between"><h3>${L("История", "History", "السجلّ")}</h3>
        <${Seg} label=${L("История", "History", "السجلّ")} value=${histTab} onChange=${setHistTab} small=${true} options=${[{ v: "study", label: L("Изучение", "Study", "الدراسة") }, { v: "listen", label: L("Прослушивание", "Listening", "الاستماع") }]} /></div>
      ${histTab === "listen" ? (h.listen.length ? html`<div class="hist">${h.listen.slice(0, 60).map((e) => html`<div class="h-row">
          <span class="muted num" style="width:110px;font-size:12.5px">${fmtDate(e.t)}</span><span class="grow">${bayt(e.n)} · ${secName(sectionOf(e.n))}</span><span class="muted num">${fmtDur(e.d)}</span>
          <button class="icon-btn sm" aria-label=${L("Открыть", "Open", "فتح")} onClick=${() => go("v" + e.n)}><${Icon} name="chevR" /></button></div>`)}</div>` : html`<p class="hint">${L("Прослушанные бейты появятся здесь.", "Bayts you listen to will appear here.", "ستظهر هنا الأبيات التي استمعت إليها.")}</p>`)
        : (study.length ? html`<div class="hist">${study.slice(0, 60).map((e) => html`<div class="h-row">
          <span class="muted num" style="width:110px;font-size:12.5px">${fmtDate(e.t)}</span><span class="grow">${studyText(e)}</span>
          ${e.n && html`<button class="icon-btn sm" aria-label=${L("Открыть", "Open", "فتح")} onClick=${() => go("v" + e.n)}><${Icon} name="chevR" /></button>`}</div>`)}</div>` : html`<p class="hint">${L("Здесь будет история: открытые бейты, проверки, тесты, повторения.", "Your history will be here: opened bayts, checks, tests and reviews.", "سيظهر هنا سجلّك: الأبيات المفتوحة والاختبارات والمراجعات.")}</p>`)}
    </div>
  </div>`;
}

function studyText(e) {
  const check = { build: L("Собери бейт", "Build the bayt", "رتّب البيت"), write: L("Напиши по памяти", "Write from memory", "اكتب من حفظك"), gaps: L("Пропуски", "Gaps", "الفراغات") };
  const grade = [L("не вспомнил", "forgot", "نسيته"), L("с трудом", "with effort", "بصعوبة"), L("помню", "remembered", "أتذكّره")];
  const sec = (id) => secName(SECTIONS.find((s) => s.id === id));
  switch (e.type) {
    case "open": return L(`Открыт бейт ${e.n}`, `Opened bayt ${e.n}`, `فُتح البيت ${e.n}`);
    case "status": return `${bayt(e.n)}: ${statusName(e.s)}`;
    case "check": return L(`Проверка «${check[e.kind] || e.kind}», бейт ${e.n}: ${e.pct}%`, `Check “${check[e.kind] || e.kind}”, bayt ${e.n}: ${e.pct}%`, `اختبار «${check[e.kind] || e.kind}»، البيت ${e.n}: ${e.pct}%`);
    case "review": return L(`Повторение бейта ${e.n}: ${grade[e.g]}`, `Review of bayt ${e.n}: ${grade[e.g]}`, `مراجعة البيت ${e.n}: ${grade[e.g]}`);
    case "test": return L(`Тест «${sec(e.sec)}»: ${e.pct}%`, `Test “${sec(e.sec)}”: ${e.pct}%`, `اختبار «${sec(e.sec)}»: ${e.pct}%`);
    default: return e.type;
  }
}
export { D };
