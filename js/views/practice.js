// Заучивание, интервальное повторение и тесты по разделам.
import { html, useState, useEffect, useMemo, cx, shuffle } from "../lib.js";
import { V, TOK, PLAIN, TOTAL, SECTIONS, SECTION, sectionVerses, sectionOf } from "../data/index.js";
import { useSel, act, D, dueList, learnedCount, learningCount } from "../core/store.js";
import { toggle as togglePlay } from "../core/audio.js";
import { go } from "../core/nav.js";
import { L, TR, bayt, nBayt, vTr, quizL, secName, fmtDate } from "../core/i18n.js";
import { Icon, Bar, toast, StatusPill } from "../ui/kit.js";
import { VerseText, Translation, displayOf } from "../ui/verse.js";

// ---------- генерация вопросов ----------
const near = (n, k = 6) => { const out = []; for (let d = 1; out.length < k && d < TOTAL; d++) for (const m of [n - d, n + d]) if (V[m] && out.length < k) out.push(m); return out; };
const poolFor = (n, base) => [...new Set([...(base || []).filter((m) => m !== n), ...near(n)])];

function qContinue(n, base) {
  const right = PLAIN[n][1];
  const others = shuffle(poolFor(n, base)).slice(0, 3).map((m) => PLAIN[m][1]);
  const o = shuffle([right, ...others]);
  return { kind: "cont", n, title: L("Продолжите бейт", "Continue the bayt", "أكمل البيت"), ar: PLAIN[n][0] + " …", o, arOpts: true, a: o.indexOf(right) };
}
function qMissing(n, base) {
  const words = TOK[n].flat();
  const cand = words.map((w, i) => ({ w, i })).filter((x) => x.w.n.length >= 3);
  const { w, i } = shuffle(cand)[0];
  const dis = [];
  for (const m of shuffle(poolFor(n, base))) for (const x of TOK[m].flat()) if (x.n.length >= 3 && x.n !== w.n && !dis.some((d) => d.n === x.n) && dis.length < 3) dis.push(x);
  const o = shuffle([w, ...dis]);
  const line = words.map((x, j) => (j === i ? "＿＿＿" : x.text)).join(" ");
  return { kind: "miss", n, title: L("Какое слово пропущено?", "Which word is missing?", "ما الكلمة الناقصة؟"), ar: line, o: o.map((x) => x.text), arOpts: true, a: o.indexOf(w) };
}
function qTranslate(n, base) {
  if (!TR) return qContinue(n, base);
  const right = vTr(n).join(" ");
  const others = shuffle(poolFor(n, base)).slice(0, 3).map((m) => vTr(m).join(" "));
  const o = shuffle([right, ...others]);
  return { kind: "tr", n, title: L("Выберите перевод бейта", "Choose the translation of the bayt", "اختر ترجمة البيت"), ar: PLAIN[n].join("  ✦  "), o, trOpts: true, a: o.indexOf(right) };
}
function qNext(n, base) {
  if (n >= TOTAL) return qContinue(n, base);
  const right = PLAIN[n + 1][0];
  const others = shuffle(poolFor(n + 1, base).filter((m) => m !== n)).slice(0, 3).map((m) => PLAIN[m][0]);
  const o = shuffle([right, ...others]);
  return { kind: "next", n, title: L("С чего начинается следующий бейт?", "How does the next bayt begin?", "بمَ يبدأ البيت التالي؟"), ar: PLAIN[n].join("  ✦  "), o, arOpts: true, a: o.indexOf(right) };
}
function qContent(item) {
  const o = shuffle(item.o.map((t, i) => ({ t, i })));
  return { kind: "content", n: item.v, title: item.q, o: o.map((x) => x.t), a: o.findIndex((x) => x.i === item.a), e: item.e };
}
const GEN = { cont: qContinue, miss: qMissing, tr: qTranslate, next: qNext };

export function buildTest(secId, total = 8) {
  const sec = SECTION[secId], vs = sectionVerses(sec);
  const content = shuffle(quizL(secId)).slice(0, Math.min(5, Math.ceil(total / 2))).map(qContent);
  const memo = [];
  const kinds = TR ? ["cont", "miss", "tr", "next"] : ["cont", "miss", "next"];
  let k = 0;
  while (content.length + memo.length < total) {
    const n = shuffle(vs)[0];
    memo.push(GEN[kinds[k++ % kinds.length]](n, vs));
  }
  return shuffle([...content, ...memo]);
}

// ---------- вопрос с вариантами ----------
function Question({ q, picked, reveal, onPick }) {
  const keys = L("АБВГ", "ABCD", "أبجد");
  return html`<div class="col" style="gap:14px">
    <div class="quiz-q">${q.title}</div>
    ${q.ar && html`<div class="quiz-ar" lang="ar">${q.ar}</div>`}
    <div class="opts">${q.o.map((t, i) => html`<button class=${cx("opt", picked === i && "sel", reveal && i === q.a && "right", reveal && picked === i && i !== q.a && "wrong")}
      disabled=${reveal} onClick=${() => onPick(i)}><span class="k">${keys[i]}</span>${q.arOpts ? html`<span class="ar ar-text" lang="ar">${t}</span>` : q.trOpts ? html`<span lang=${TR} dir="ltr">${t}</span>` : html`<span>${t}</span>`}</button>`)}</div>
  </div>`;
}

// ---------- тест раздела ----------
export function TestsView() {
  const tests = useSel((d) => d.s.tests);
  return html`<div>
    <div class="page-head"><div><h1>${L("Тесты по разделам", "Section tests", "اختبارات الأبواب")}</h1>
      <p class="sub">${L("После каждого раздела — короткий тест: вопросы по смыслу правил и на знание текста (продолжите бейт, пропущенное слово, перевод).", "A short test after each section: questions on the meaning of the rules and on the text (continue the bayt, missing word, translation).", "اختبار قصير بعد كل باب: أسئلة في معاني القواعد وفي حفظ النص (أكمل البيت، الكلمة الناقصة…).")}</p></div>
</div>
    <div class="grid g3">${SECTIONS.map((s) => {
      const t = tests[s.id];
      return html`<div class="card col" style="gap:8px">
        <div class="row" style="justify-content:space-between"><span class="label num">${L("Бейты", "Bayts", "الأبيات")} ${s.from}–${s.to}</span>${t && html`<span class=${cx("pill", t.best >= 80 ? "learned" : "learning")}>${L("Лучший", "Best", "الأفضل")} ${t.best}%</span>`}</div>
        <h3>${secName(s)}</h3>
        <div class="row" style="justify-content:space-between;margin-top:auto"><span class="muted" style="font-size:12.5px">${t ? `${L("Попыток", "Attempts", "المحاولات")}: ${t.n} · ${fmtDate(t.t, false)}` : L("Ещё не проходили", "Not taken yet", "لم يُجرَ بعد")}</span>
          <button class="btn sm primary" onClick=${() => go("test-" + s.id)}>${t ? L("Ещё раз", "Again", "مرة أخرى") : L("Пройти", "Start", "ابدأ")}</button></div></div>`;
    })}</div>
  </div>`;
}

export function TestView({ id }) {
  const sec = SECTION[id];
  const [seed, setSeed] = useState(0);
  const qs = useMemo(() => buildTest(id, 8), [id, seed]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState([]);
  const [done, setDone] = useState(false);
  useEffect(() => { setI(0); setPicked(null); setScore(0); setWrong([]); setDone(false); }, [id, seed]);
  if (!sec) return html`<div class="empty">${L("Раздел не найден.", "Section not found.", "الباب غير موجود.")}</div>`;
  const q = qs[i];
  const pick = (k) => { if (picked != null) return; setPicked(k); if (k === q.a) setScore((s) => s + 1); else setWrong((w) => [...w, q]); };
  const next = () => {
    if (i + 1 < qs.length) { setI(i + 1); setPicked(null); return; }
    const pct = Math.round((score / qs.length) * 100);
    act.saveTest(id, pct, qs.length); setDone(true);
    if (pct === 100) toast(L("Тест пройден без ошибок", "Test passed with no mistakes", "اجتزت الاختبار بلا أخطاء"), { icon: "star", kind: "gilt" });
  };
  const back = html`<button class="btn sm ghost" onClick=${() => go("tests")}><${Icon} name="arrowL" />${L("Все тесты", "All tests", "كل الاختبارات")}</button>`;
  if (done) {
    const pct = Math.round((score / qs.length) * 100);
    const stars = pct >= 90 ? 3 : pct >= 60 ? 2 : pct >= 30 ? 1 : 0;
    return html`<div class="col" style="gap:16px;max-width:820px">
      <div class="study-nav">${back}</div>
      <div class="card pad-lg row" style="gap:22px">
        <div class="score-ring" style=${`--p:${pct};--c:${pct >= 80 ? "var(--ok)" : pct >= 50 ? "var(--warn)" : "var(--bad)"}`}><div>${pct}%</div></div>
        <div class="col grow" style="gap:8px"><div class="eyebrow">${secName(sec)}</div>
          <h2>${pct >= 80 ? L("Раздел усвоен", "Section mastered", "أتقنت الباب") : pct >= 50 ? L("Неплохо, но есть пробелы", "Not bad, but there are gaps", "جيد، لكن هناك ثغرات") : L("Стоит повторить раздел", "Worth reviewing the section", "تحسن مراجعة الباب")}</h2>
          <div class="stars" aria-label=${L("Оценка", "Rating", "التقييم")}>${"★".repeat(stars)}${"☆".repeat(3 - stars)}</div>
          <span class="muted">${L(`Верных ответов: ${score} из ${qs.length}`, `Correct answers: ${score} of ${qs.length}`, `الإجابات الصحيحة: ${score} من ${qs.length}`)}</span>
          <div class="row"><button class="btn primary" onClick=${() => setSeed((s) => s + 1)}><${Icon} name="rotate" />${L("Пройти ещё раз", "Take it again", "أعد الاختبار")}</button>
            <button class="btn" onClick=${() => go("sec-" + id)}>${L("Читать раздел", "Read the section", "اقرأ الباب")}</button></div></div>
      </div>
      ${wrong.length > 0 && html`<div class="card col" style="gap:10px"><h3>${L("Разбор ошибок", "Review of mistakes", "مراجعة الأخطاء")}</h3>${wrong.map((w) => html`<div class="row" style="justify-content:space-between;border-bottom:1px solid var(--rule);padding:8px 0">
        <span>${w.title}</span><button class="btn sm ghost" onClick=${() => go("v" + w.n)}>${bayt(w.n)}<${Icon} name="chevR" /></button></div>`)}</div>`}
    </div>`;
  }
  return html`<div class="col" style="gap:16px;max-width:820px">
    <div class="study-nav">${back}<span class="chip">${secName(sec)}</span>
      <span class="grow"></span><span class="num muted" dir="ltr">${i + 1} / ${qs.length}</span></div>
    <${Bar} pct=${(i / qs.length) * 100} kind="lapis" />
    <div class="card pad-lg col" style="gap:16px">
      <${Question} q=${q} picked=${picked} reveal=${picked != null} onPick=${pick} />
      ${picked != null && html`<div class=${picked === q.a ? "note-box" : "warn-box"}>${picked === q.a ? L("Верно. ", "Correct. ", "صحيح. ") : L("Неверно. ", "Wrong. ", "خطأ. ")}${q.e || ""} ${q.n ? html`<a href=${"#v" + q.n} onClick=${(e) => { e.preventDefault(); go("v" + q.n); }}>${bayt(q.n)}</a>` : ""}</div>
        <div class="row"><button class="btn primary" onClick=${next}>${i + 1 < qs.length ? L("Дальше", "Next", "التالي") : L("Результат", "Result", "النتيجة")}<${Icon} name="chevR" /></button></div>`}
    </div>
  </div>`;
}

// ---------- центр заучивания ----------
export function MemorizeView() {
  const s = useSel((d) => d.s);
  const due = dueList(s);
  const nextNew = Array.from({ length: TOTAL }, (_, i) => i + 1).find((n) => (s.verses[n]?.s || 0) < 2) || 1;
  return html`<div>
    <div class="page-head"><div><h1>${L("Заучивание", "Memorization", "الحفظ")}</h1>
      <p class="sub">${L("Учите новые бейты по порядку, а выученные повторяйте через растущие интервалы: 1, 3, 7, 16… дней. Так матн надёжно закрепляется.", "Learn new bayts in order and review the learned ones at growing intervals: 1, 3, 7, 16… days. That is how the matn stays firm.", "احفظ الأبيات الجديدة بالترتيب، وراجع المحفوظ على فترات متزايدة: 1، 3، 7، 16… يومًا؛ هكذا يثبت المتن.")}</p></div></div>
    <div class="grid g3" style="margin-bottom:16px">
      <div class="card col" style="gap:8px"><span class="label">${L("Повторение сегодня", "Review today", "مراجعة اليوم")}</span><b style="font-family:var(--f-disp);font-size:30px">${nBayt(due.length)}</b>
        <button class="btn primary" style="align-self:flex-start" onClick=${() => go("review")}>${due.length ? L("Начать повторение", "Start reviewing", "ابدأ المراجعة") : L("Повторить выученные", "Review learned bayts", "راجع المحفوظ")}</button></div>
      <div class="card col" style="gap:8px"><span class="label">${L("Следующий новый", "Next new bayt", "الجديد التالي")}</span><b style="font-family:var(--f-disp);font-size:30px">${bayt(nextNew)}</b>
        <button class="btn" style="align-self:flex-start" onClick=${() => go("v" + nextNew, { tab: "memo" })}><${Icon} name="layers" />${L("Учить", "Learn", "احفظ")}</button></div>
      <div class="card col" style="gap:8px"><span class="label">${L("Итого", "Total", "المجموع")}</span>
        <div class="row" style="gap:16px"><span class="stat"><b>${learnedCount(s)}</b><span>${L("выучено", "learned", "محفوظ")}</span></span><span class="stat"><b>${learningCount(s)}</b><span>${L("изучаю", "learning", "قيد الحفظ")}</span></span><span class="stat"><b>${TOTAL - learnedCount(s) - learningCount(s)}</b><span>${L("новых", "new", "جديد")}</span></span></div></div>
    </div>
    <div class="card col" style="gap:12px">
      <div class="row" style="justify-content:space-between"><h3>${L("Карта матна", "Map of the matn", "خريطة المتن")}</h3>
        <div class="legend"><span><i style="background:var(--rule)"></i>${L("новый", "new", "جديد")}</span><span><i style="background:var(--warn)"></i>${L("изучаю", "learning", "قيد الحفظ")}</span><span><i style="background:var(--ok)"></i>${L("выучен", "learned", "محفوظ")}</span><span><i style="background:var(--lapis)"></i>${L("на повторение", "due", "للمراجعة")}</span></div></div>
      <div class="map109">${Array.from({ length: TOTAL }, (_, i) => i + 1).map((n) => html`<button data-s=${s.verses[n]?.s || 0} class=${cx(due.includes(n) && "due")} title=${`${bayt(n)} — ${secName(sectionOf(n))}`} onClick=${() => go("v" + n)}>${n}</button>`)}</div>
    </div>
  </div>`;
}

export function ReviewView() {
  const prefs = useSel((d) => d.s.prefs);
  const [list] = useState(() => { const d = dueList(); if (d.length) return d; return shuffle(Object.entries(D.s.verses).filter(([, v]) => v.s === 2).map(([n]) => +n)).slice(0, 10); });
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [stats, setStats] = useState([0, 0, 0]);
  if (!list.length) return html`<div class="col" style="gap:14px;max-width:760px">
    <div class="page-head"><div><h1>${L("Повторение", "Review", "المراجعة")}</h1><p class="sub">${L("Пока нет выученных бейтов. Отметьте бейт как выученный — он появится здесь через день.", "No learned bayts yet. Mark a bayt as learned and it will appear here the next day.", "لا محفوظ بعد. سجّل بيتًا محفوظًا فيظهر هنا في اليوم التالي.")}</p></div></div>
    <button class="btn primary" style="align-self:flex-start" onClick=${() => go("memorize")}>${L("К заучиванию", "To memorization", "إلى الحفظ")}</button></div>`;
  if (i >= list.length) return html`<div class="col" style="gap:14px;max-width:760px">
    <div class="card pad-lg col" style="gap:10px"><h2>${L("Повторение завершено", "Review complete", "انتهت المراجعة")}</h2>
      <p class="ink2">${L("Помню", "Remembered", "أتذكّره")}: ${stats[2]} · ${L("С трудом", "With effort", "بصعوبة")}: ${stats[1]} · ${L("Не вспомнил", "Forgot", "نسيته")}: ${stats[0]}</p>
      <div class="row"><button class="btn primary" onClick=${() => go("memorize")}>${L("Готово", "Done", "تمّ")}</button></div></div></div>`;
  const n = list[i];
  const show = displayOf(prefs);
  const grade = (g) => { act.review(n, g); setStats((s) => s.map((v, k) => (k === g ? v + 1 : v))); setShown(false); setI(i + 1); };
  return html`<div class="col" style="gap:16px;max-width:860px">
    <div class="study-nav"><button class="btn sm ghost" onClick=${() => go("memorize")}><${Icon} name="arrowL" />${L("Заучивание", "Memorization", "الحفظ")}</button><span class="grow"></span><span class="num muted" dir="ltr">${i + 1} / ${list.length}</span></div>
    <${Bar} pct=${(i / list.length) * 100} kind="lapis" />
    <div class="card pad-lg col" style="gap:14px">
      <div class="row" style="justify-content:space-between"><div><div class="eyebrow">${bayt(n)}</div><span class="muted">${secName(sectionOf(n))}</span></div><${StatusPill} s=${2} due=${true} /></div>
      ${shown ? html`<${VerseText} n=${n} big=${1.1} />${show.tr && html`<${Translation} n=${n} />`}`
        : html`<${VerseText} n=${n} big=${1.1} hide=${{ level: 100, first: true }} noGloss=${true} /><p class="hint">${L("Прочитайте бейт по памяти вслух. Подсказка — первые буквы слов; нажмите на слово, чтобы открыть его.", "Recite the bayt aloud from memory. The hint is the first letters of the words; tap a word to reveal it.", "اقرأ البيت من حفظك بصوت مسموع. التلميح هو الحروف الأولى؛ انقر الكلمة لإظهارها.")}</p>`}
      <div class="row">
        <button class="btn" onClick=${() => togglePlay(n)}><${Icon} name="play" />${L("Прослушать", "Listen", "استمع")}</button>
        ${!shown ? html`<button class="btn primary" onClick=${() => setShown(true)}><${Icon} name="eye" />${L("Показать бейт", "Show the bayt", "أظهر البيت")}</button>`
          : html`<button class="btn danger" onClick=${() => grade(0)}>${L("Не вспомнил", "Forgot", "نسيته")}</button><button class="btn" onClick=${() => grade(1)}>${L("С трудом", "With effort", "بصعوبة")}</button><button class="btn ok" onClick=${() => grade(2)}>${L("Помню", "Remembered", "أتذكّره")}</button>`}
      </div>
    </div>
  </div>`;
}
