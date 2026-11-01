// Главная: только то, чего нет в меню, — где вы остановились и план на сегодня.
import { html } from "../lib.js";
import { TOTAL, sectionOf } from "../data/index.js";
import { useSel, learnedCount, dueList, streak, todayKey, levelOf, levelName } from "../core/store.js";
import { useContent } from "../core/content.js";
import { toggle as togglePlay } from "../core/audio.js";
import { go } from "../core/nav.js";
import { L, LANG, bayt, nBayt, nDay, secName } from "../core/i18n.js";
import { Icon, Ring, Bar, RichText } from "../ui/kit.js";
import { VerseText, Translation, displayOf } from "../ui/verse.js";

function nextStep(s) {
  const due = dueList(s);
  if (due.length) return { text: L(`На повторение сегодня: ${nBayt(due.length)}.`, `Due for review today: ${nBayt(due.length)}.`, `للمراجعة اليوم: ${nBayt(due.length)}.`), btn: L("Повторить", "Review", "راجِع"), to: "review" };
  const learning = Object.entries(s.verses).filter(([, v]) => v.s === 1).map(([n]) => +n).sort((a, b) => a - b);
  if (learning.length) { const n = learning[0]; return { text: L(`Закрепите бейт ${n}: проверьте себя и отметьте выученным.`, `Consolidate bayt ${n}: test yourself and mark it learned.`, `ثبّت البيت ${n}: اختبر نفسك وسجّله محفوظًا.`), btn: bayt(n), to: "v" + n, state: { tab: "memo" } }; }
  const fresh = Array.from({ length: TOTAL }, (_, i) => i + 1).find((n) => !s.verses[n]?.s);
  if (fresh) return { text: L(`Следующий новый бейт — ${fresh}.`, `Your next new bayt is ${fresh}.`, `البيت الجديد التالي: ${fresh}.`), btn: L("Учить", "Learn", "احفظ"), to: "v" + fresh, state: { tab: "memo" } };
  return { text: L("Все бейты выучены. Поддерживайте их повторением.", "All bayts are learned. Keep them fresh with review.", "حفظت الأبيات كلها. حافظ عليها بالمراجعة."), btn: L("Повторить", "Review", "راجِع"), to: "review" };
}

function greeting() {
  const h = new Date().getHours();
  if (LANG === "ar") return h < 12 ? "صباح الخير" : "مساء الخير";
  if (LANG === "en") return h < 5 ? "Good night" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  return h < 5 ? "Доброй ночи" : h < 12 ? "Доброе утро" : h < 18 ? "Добрый день" : "Добрый вечер";
}

export function HomeView() {
  const s = useSel((d) => d.s);
  const content = useContent();
  const last = s.last || 1;
  const today = s.daily[todayKey()] || {};
  const g = s.goal, st = streak(s), lvl = levelOf(s.xp);
  const learned = learnedCount(s), due = dueList(s).length;
  const step = nextStep(s);
  const date = new Date().toLocaleDateString({ ru: "ru-RU", en: "en-GB", ar: "ar-u-nu-latn" }[LANG], { weekday: "long", day: "numeric", month: "long" });
  const show = displayOf(s.prefs);

  return html`<div class="col" style="gap:18px">
    <div class="page-head">
      <div><div class="eyebrow">${L("Ассаляму алейкум", "Assalamu alaykum", "السلام عليكم")}</div><h1>${greeting()}</h1><p class="sub" style="text-transform:none">${date[0].toUpperCase() + date.slice(1)}</p></div>
      <div class="row"><span class="chip"><${Icon} name="flame" />${nDay(st)} ${L("подряд", "in a row", "متتالية")}</span>
        <span class="chip"><${Icon} name="trophy" />${levelName(lvl)} · ${s.xp} XP</span></div>
    </div>

    ${content.notice?.text && html`<div class="card notice"><div class="label" style="color:var(--gilt)">${L("Объявление", "Announcement", "إعلان")}</div>
      <p style="white-space:pre-wrap;line-height:1.6" dir="auto"><${RichText} text=${content.notice.text} /></p></div>`}

    <div class="grid g-main">
      <div class="card pad-lg col" style="gap:10px">
        <div class="row" style="justify-content:space-between"><div><div class="label">${L("Вы остановились здесь", "Where you left off", "توقّفت هنا")}</div><h3>${bayt(last)} · ${secName(sectionOf(last))}</h3></div>
          <div class="row"><button class="btn" onClick=${() => togglePlay(last)}><${Icon} name="play" />${L("Слушать", "Listen", "استمع")}</button>
          <button class="btn primary" onClick=${() => go("v" + last)}>${L("Продолжить", "Continue", "تابِع")}<${Icon} name="chevR" /></button></div></div>
        ${show.ar && html`<${VerseText} n=${last} />`}
        ${show.tr && html`<${Translation} n=${last} />`}
        <div class="col" style="gap:6px;margin-top:4px">
          <div class="row muted" style="justify-content:space-between;font-size:13px"><span>${L(`Выучено ${learned} из ${TOTAL}`, `Learned ${learned} of ${TOTAL}`, `محفوظ ${learned} من ${TOTAL}`)}</span>
            ${due > 0 && html`<span>${L("На повторение", "Due for review", "للمراجعة")}: <b class="num">${due}</b></span>`}</div>
          <${Bar} pct=${(learned / TOTAL) * 100} />
        </div>
      </div>
      <div class="card col" style="gap:14px">
        <h3>${L("Сегодня", "Today", "اليوم")}</h3>
        <div class="row" style="justify-content:space-around;gap:14px">
          <div class="col" style="align-items:center;gap:6px"><${Ring} pct=${((today.learned || 0) / Math.max(1, g.learn)) * 100} label=${`${today.learned || 0}/${g.learn}`} color="var(--ok)" /><span class="muted" style="font-size:12.5px">${L("новые", "new", "جديدة")}</span></div>
          <div class="col" style="align-items:center;gap:6px"><${Ring} pct=${((today.reviewed || 0) / Math.max(1, g.review)) * 100} label=${`${today.reviewed || 0}/${g.review}`} /><span class="muted" style="font-size:12.5px">${L("повторение", "review", "مراجعة")}</span></div>
          <div class="col" style="align-items:center;gap:6px"><${Ring} pct=${((today.listenSec || 0) / 60 / Math.max(1, g.listen)) * 100} label=${`${Math.round((today.listenSec || 0) / 60)}/${g.listen}`} color="var(--gilt)" /><span class="muted" style="font-size:12.5px">${L("минут", "minutes", "دقائق")}</span></div>
        </div>
        ${today.goalMet ? html`<div class="note-box">${L("Цель дня выполнена. Да благословит Аллах ваши усилия.", "Today’s goal is done. May Allah bless your efforts.", "تحقّق هدف اليوم. بارك الله في جهدك.")}</div>`
          : html`<div class="col" style="gap:8px"><span class="label">${L("Следующий шаг", "Next step", "الخطوة التالية")}</span><p>${step.text}</p>
            <button class="btn soft" style="align-self:flex-start" onClick=${() => go(step.to, step.state || {})}>${step.btn}<${Icon} name="chevR" /></button></div>`}
      </div>
    </div>
  </div>`;
}
