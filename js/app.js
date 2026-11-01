// Оболочка приложения: навигация с главами матна, верхняя панель, мини-плеер, поиск,
// подвал с почтой и скрытым входом администратора, окно о машинном переводе.
import { html, render, useState, useEffect, useMemo, useRef, cx } from "./lib.js";
import { TOK, TOTAL, SECTIONS, NORM, GLOSSARY, RULES, sectionOf, sectionVerses } from "./data/index.js";
import { useSel, D, applyPrefs, dueList, setAchievementHandler, setGoalHandler, achText } from "./core/store.js";
import { initAuth, useAuth } from "./core/auth.js";
import { initContent, useContent, contactEmail } from "./core/content.js";
import { toggle, P } from "./core/audio.js";
import { initMedia, enableManage } from "./core/media.js";
import { norm, isArabic } from "./core/arabic.js";
import { go, useRoute } from "./core/nav.js";
import { L, LANG, TR, WBW, onLang, langReady, bayt, vTr, vSharh, secName, ruleL, termL } from "./core/i18n.js";
import { SHOW_CABINET, SHOW_ADMIN } from "./config.js";
import { Icon, ToastHost, PopHost, Dialog, toast } from "./ui/kit.js";
import { LangButton, ThemeButton } from "./ui/lang.js";
import { MiniPlayer } from "./ui/player.js";
import { HomeView } from "./views/home.js";
import { ReadView, useReadSection } from "./views/read.js";
import { StudyView } from "./views/study.js";
import { MakharijView } from "./views/makharij.js";
import { RulesView, RuleView, DictView } from "./views/rules.js";
import { MemorizeView, ReviewView, TestsView, TestView } from "./views/practice.js";
import { ListenView } from "./views/listen.js";
import { LessonsView } from "./views/lessons.js";
import { ProfileView } from "./views/profile.js";
import { OptionsView } from "./views/options.js";
import { AdminView } from "./views/admin.js";

const NAV = [
  { id: "home", ico: "home", t: () => L("Главная", "Home", "الرئيسية") },
  { id: "read", ico: "book", t: () => L("Матн", "Matn", "المتن") },
  { id: "lessons", ico: "lesson", t: () => L("Уроки", "Lessons", "الدروس") },
  { id: "makharij", ico: "head", t: () => L("Махраджи", "Makharij", "المخارج") },
  { id: "memorize", ico: "layers", t: () => L("Заучивание", "Memorize", "الحفظ") },
  { id: "tests", ico: "tests", t: () => L("Тесты", "Tests", "الاختبارات") },
  { id: "listen", ico: "headphones", t: () => L("Слушать матн", "Listen", "الاستماع") },
  { id: "rules", ico: "scroll", t: () => L("Правила", "Rules", "القواعد") },
  { id: "dict", ico: "dict", t: () => L("Словарь", "Glossary", "المعجم") },
  ...(SHOW_CABINET ? [{ id: "profile", ico: "user", t: () => L("Кабинет", "My progress", "حسابي") }] : []),
  { id: "options", ico: "gear", t: () => L("Настройки", "Settings", "الإعدادات") },
];
// Пункт админ-панели появляется только после входа администратора.
const ADMIN_ITEM = { id: "admin", ico: "edit", t: () => L("Админ-панель", "Admin panel", "لوحة الإدارة") };
const navFor = (admin) => (admin && SHOW_ADMIN ? [...NAV, ADMIN_ITEM] : NAV);
const TABS = ["home", "read", "lessons", "memorize"];
const SECTION_OF_ROUTE = { study: "read", rule: "rules", test: "tests", review: "memorize" };
function titleOf(r, admin) {
  if (r.name === "study") return bayt(r.n);
  const T = {
    admin: admin ? L("Админ-панель", "Admin panel", "لوحة الإدارة") : L("Вход", "Sign in", "الدخول"), home: "", read: L("Матн аль-Джазария", "Matn al-Jazariyya", "متن الجزرية"),
    lessons: L("Уроки", "Lessons", "الدروس"), makharij: L("Махраджи", "Makharij", "المخارج"), memorize: L("Заучивание", "Memorization", "الحفظ"),
    review: L("Повторение", "Review", "المراجعة"), tests: L("Тесты", "Tests", "الاختبارات"), test: L("Тест раздела", "Section test", "اختبار الباب"),
    listen: L("Слушать матн", "Listen to the matn", "الاستماع إلى المتن"), rules: L("Правила таджвида", "Tajweed rules", "أحكام التجويد"),
    rule: L("Правило", "Rule", "القاعدة"), dict: L("Словарь терминов", "Glossary of terms", "معجم المصطلحات"),
    profile: L("Личный кабинет", "My progress", "حسابي"), options: L("Настройки", "Settings", "الإعدادات"),
  };
  return T[r.name] ?? "";
}

function Brand({ sub = true }) {
  return html`<button class="brand" onClick=${() => go("home")} aria-label=${L("На главную", "Home", "الرئيسية")}>
    <span class="brand-mark" lang="ar">الجَزَرِيَّة</span>
    <span><span class="brand-name">${L("Матн аль-Джазария", "Matn al-Jazariyya", "متن الجزرية")}</span>${sub && html`<br /><span class="brand-sub">${L("таджвид · заучивание", "tajweed · memorization", "تجويد · حفظ")}</span>`}</span></button>`;
}

// Главы матна: в боковой панели — выпадающим списком под «Матн», на телефоне — в отдельном окне.
function ChapterList({ onPick }) {
  const cur = useReadSection();
  return html`<div class="chapters">${SECTIONS.map((s) => html`<button class="ch-item" aria-current=${cur === s.id ? "true" : null}
    onClick=${() => { onPick?.(); go("sec-" + s.id, { keepScroll: true, at: Date.now() }); }}>
    <span class="rng num">${s.from}–${s.to}</span><span class="ch-name">${secName(s)}</span></button>`)}</div>`;
}

const NAV_OPEN = "jz.navChapters";
const navOpenGet = () => { try { return localStorage.getItem(NAV_OPEN) === "1"; } catch { return false; } };
const navOpenSet = (v) => { try { localStorage.setItem(NAV_OPEN, v ? "1" : "0"); } catch { /* не запомним */ } };

function Rail({ active, admin }) {
  const due = useSel((d) => dueList(d.s).length);
  const [open, setOpen] = useState(() => active === "read" || navOpenGet());
  useEffect(() => { if (active === "read") setOpen(true); }, [active]);
  const flip = () => setOpen((o) => { navOpenSet(!o); return !o; });
  const tCh = L("Главы матна", "Chapters of the matn", "أبواب المتن");
  return html`<aside class="rail" aria-label=${L("Навигация", "Navigation", "التنقّل")}>
    <${Brand} />
    <nav class="nav">${navFor(admin).map((n) => (n.id === "read"
      ? html`<div class="nav-group">
          <div class="nav-row"><button aria-current=${active === "read" ? "page" : null} onClick=${() => go("read")}><${Icon} name=${n.ico} />${n.t()}</button>
            <button class="nav-caret" aria-expanded=${String(open)} aria-controls="nav-chapters" title=${tCh} aria-label=${tCh} onClick=${flip}><${Icon} name=${open ? "chevU" : "chevD"} /></button></div>
          ${open && html`<div id="nav-chapters" class="nav-sub"><${ChapterList} /></div>`}</div>`
      : html`<button aria-current=${active === n.id ? "page" : null} onClick=${() => go(n.id)}><${Icon} name=${n.ico} />${n.t()}
          ${n.id === "memorize" && due > 0 && html`<span class="badge">${due}</span>`}</button>`))}</nav>
  </aside>`;
}

function TabBar({ active, onMore }) {
  const items = TABS.map((id) => NAV.find((n) => n.id === id));
  const moreActive = !TABS.includes(active);
  return html`<nav class="tabbar" aria-label=${L("Основные разделы", "Main sections", "الأقسام الرئيسية")}>
    ${items.map((n) => html`<button aria-current=${active === n.id ? "page" : null} onClick=${() => go(n.id)}><${Icon} name=${n.ico} />${n.t()}</button>`)}
    <button aria-current=${moreActive ? "page" : null} onClick=${onMore}><${Icon} name="grid" />${L("Ещё", "More", "المزيد")}</button>
  </nav>`;
}

function MoreSheet({ onClose, admin }) {
  return html`<div class="overlay" onPointerDown=${(e) => e.target === e.currentTarget && onClose()} style="align-items:flex-end;padding-bottom:calc(76px + env(safe-area-inset-bottom,0px))">
    <div class="dialog" role="dialog" aria-label=${L("Все разделы", "All sections", "كل الأقسام")}><div class="d-body"><div class="grid g2">
      ${navFor(admin).filter((n) => !TABS.includes(n.id)).map((n) => html`<button class="btn lg" style="justify-content:flex-start" onClick=${() => { onClose(); go(n.id); }}><${Icon} name=${n.ico} />${n.t()}</button>`)}
    </div></div></div></div>`;
}

// Подвал: почта для сообщений об ошибках. Знак © — скрытый вход для администратора.
function Footer() {
  useContent();
  const email = contactEmail();
  const copy = async (e) => {
    const box = e.currentTarget.closest(".foot-mail")?.querySelector(".mail");
    try { await navigator.clipboard.writeText(email); toast(L("Адрес скопирован", "Address copied", "نُسخ العنوان"), { icon: "check" }); }
    catch { if (box) { const r = document.createRange(); r.selectNodeContents(box); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); } }
  };
  return html`<footer class="site-foot">
    <div class="foot-mail"><span class="foot-q"><${Icon} name="mail" />${L("Нашли ошибку в тексте или переводе? Напишите нам:", "Found a mistake in the text or translation? Write to us:", "وجدت خطأً في النص أو الترجمة؟ راسلنا:")}</span>
      <span class="row" style="gap:4px;flex-wrap:nowrap"><a class="mail" href=${"mailto:" + email} dir="ltr">${email}</a>
      <button class="icon-btn sm" title=${L("Скопировать адрес", "Copy the address", "نسخ العنوان")} aria-label=${L("Скопировать адрес", "Copy the address", "نسخ العنوان")} onClick=${copy}><${Icon} name="copy" /></button></span></div>
    <div class="foot-meta">${SHOW_ADMIN ? html`<button class="foot-key" type="button" onClick=${() => go("admin")}>©</button>` : "©"} <span class="num">${new Date().getFullYear()}</span> · ${L("Матн аль-Джазария", "Matn al-Jazariyya", "متن الجزرية")}</div>
  </footer>`;
}

// Окно о машинном переводе — на языке включённого перевода (русский или английский). Появляется при каждом
// заходе, смене языка страницы или перевода и включении пословного перевода, пока посетитель не отметит
// «Больше не показывать».
const AI = {
  ru: { t: "Перевод выполнен нейросетью", b: "Перевод бейтов и пословный перевод сделаны с помощью искусственного интеллекта, поэтому в них возможны неточности.", ask: "Если вы заметили ошибку, пожалуйста, сообщите нам:", ok: "Понятно", copy: "Скопировать", copied: "Адрес скопирован", never: "Больше не показывать" },
  en: { t: "This translation was made by AI", b: "The translation of the bayts and the word-by-word glosses were made with artificial intelligence, so they may contain inaccuracies.", ask: "If you notice a mistake, please let us know:", ok: "Got it", copy: "Copy", copied: "Address copied", never: "Don’t show this again" },
};
const AI_OFF = "jz.aiNotice.off";
let aiMuted = false; // если хранилище недоступно, отказ действует хотя бы до закрытия вкладки
const aiOff = () => { if (aiMuted) return true; try { return localStorage.getItem(AI_OFF) === "1"; } catch { return false; } };
const muteAi = () => { aiMuted = true; try { localStorage.setItem(AI_OFF, "1"); } catch { /* только до закрытия вкладки */ } };

function AiNotice() {
  const [tr, setTr] = useState(null);
  const [never, setNever] = useState(false);
  useContent();
  useEffect(() => {
    // onLang срабатывает и после загрузки языковых пакетов — окно показываем только на настоящее изменение.
    let last = null;
    const check = () => {
      const now = { lang: LANG, tr: TR, wbw: WBW };
      const show = !last || now.lang !== last.lang || now.tr !== last.tr || (now.wbw && !last.wbw);
      last = now;
      if (!TR || !AI[TR]) return setTr(null);
      if (show && !aiOff()) { setNever(false); setTr(TR); }
    };
    check();
    return onLang(check);
  }, []);
  useEffect(() => {
    if (!tr) return;
    const k = (e) => e.key === "Escape" && close();
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [tr, never]);
  if (!tr) return null;
  const T = AI[tr], email = contactEmail();
  function close() { if (never) muteAi(); setTr(null); }
  const copy = async (e) => {
    const box = e.currentTarget.parentElement.querySelector(".mail");
    try { await navigator.clipboard.writeText(email); toast(T.copied, { icon: "check" }); }
    catch { const r = document.createRange(); r.selectNodeContents(box); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); }
  };
  return html`<div class="overlay ai-overlay" onPointerDown=${(e) => e.target === e.currentTarget && close()}>
    <div class="dialog ai-note" role="dialog" aria-modal="true" aria-labelledby="ai-t" lang=${tr} dir="ltr">
      <div class="d-body col" style="gap:12px">
        <div class="row" style="gap:12px;align-items:center;flex-wrap:nowrap"><span class="login-ico"><${Icon} name="words" /></span><h3 id="ai-t">${T.t}</h3></div>
        <p>${T.b}</p>
        <p>${T.ask}</p>
        <div class="mail-box"><span class="mail">${email}</span><button class="btn sm" onClick=${copy}><${Icon} name="copy" />${T.copy}</button></div>
        <div class="row" style="justify-content:space-between">
          <label class="ai-never"><input type="checkbox" checked=${never} onChange=${(e) => setNever(e.currentTarget.checked)} />${T.never}</label>
          <button class="btn primary" onClick=${close}>${T.ok}</button></div>
      </div>
    </div>
  </div>`;
}

const fold = (x) => x.toLowerCase().replace(/ё/g, "е");
function hlWords(n, tokens) {
  return TOK[n].map((line) => line.map((w) => (tokens.some((t) => w.n.includes(t)) ? html`<mark>${w.text}</mark>` : w.text)).reduce((a, x, i) => (i ? [...a, " ", x] : [x]), [])).reduce((a, x, i) => (i ? [...a, "  ✦  ", ...x] : [...x]), []);
}
function hlText(text, q) {
  const i = fold(text).indexOf(q);
  if (i < 0) return text;
  return [text.slice(0, i), html`<mark>${text.slice(i, i + q.length)}</mark>`, text.slice(i + q.length)];
}
const snippet = (text, i) => text.slice(Math.max(0, i - 40), Math.max(0, i - 40) + 160);

function Search({ onClose }) {
  const [q, setQ] = useState("");
  const [deep, setDeep] = useState(false);
  const [cur, setCur] = useState(0);
  const inp = useRef();
  useEffect(() => { inp.current?.focus(); }, []);
  const res = useMemo(() => {
    const s = q.trim();
    if (!s) return [];
    const out = [];
    const num = +s;
    if (Number.isInteger(num) && num >= 1 && num <= TOTAL) out.push({ type: "jump", n: num });
    if (isArabic(s)) {
      const tokens = norm(s).split(/\s+/).filter(Boolean);
      const whole = tokens.join(" ");
      for (const v of Object.keys(NORM)) { const n = +v; if (NORM[n].includes(whole) || tokens.every((t) => NORM[n].includes(t))) out.push({ type: "ar", n, tokens }); }
      if (deep && LANG === "ar") for (let n = 1; n <= TOTAL; n++) { const c = vSharh(n); const i = norm(c).indexOf(whole); if (i >= 0) out.push({ type: "sharhAr", n, text: snippet(c, i) }); }
      for (const t of GLOSSARY) if (norm(t.ar).includes(whole)) out.push({ type: "term", t });
    } else if (s.length >= 2) {
      const ql = fold(s);
      for (let n = 1; n <= TOTAL; n++) {
        const hit = ["ru", "en"].map((l) => vTr(n, l)?.join(" ")).find((tr) => tr && fold(tr).includes(ql));
        if (hit) { out.push({ type: "tr", n, ql, text: hit }); continue; }
        if (deep) { const c = vSharh(n); const i = fold(c).indexOf(ql); if (i >= 0) out.push({ type: "sharh", n, ql, text: snippet(c, i) }); }
      }
      for (const r of RULES) { const t = ruleL(r).t; if (fold(t + " " + r.ru).includes(ql)) out.push({ type: "rule", r }); }
      for (const raw of GLOSSARY) { const t = termL(raw); if (fold([raw.tr, raw.ru, t.tr, t.m].join(" ")).includes(ql)) out.push({ type: "term", t: raw }); }
    }
    return out.slice(0, 60);
  }, [q, deep]);
  useEffect(() => setCur(0), [q, deep]);
  const open = (r) => {
    onClose();
    if (r.type === "rule") return go("rule-" + r.r.id);
    if (r.type === "term") return go("dict", { q: r.t.id });
    go("v" + r.n);
  };
  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setCur((c) => Math.min(res.length - 1, c + 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setCur((c) => Math.max(0, c - 1)); }
    if (e.key === "Enter" && res[cur]) open(res[cur]);
    if (e.key === "Escape") onClose();
  };
  const examples = LANG === "ar" ? ["12", "الضاد", "غنة", "القلقلة"] : LANG === "en" ? ["12", "الضاد", "madd", "qalqala", "غنة"] : ["12", "الضاد", "мадд", "калькаля", "غنة"];
  return html`<div class="overlay" onPointerDown=${(e) => e.target === e.currentTarget && onClose()}>
    <div class="dialog" role="dialog" aria-modal="true" aria-label=${L("Поиск", "Search", "البحث")}>
      <div class="d-head"><${Icon} name="search" />
        <input ref=${inp} id="search-q" class="search-in" placeholder=${L("Номер бейта, арабский текст или слово перевода", "Bayt number, Arabic text or a word of the translation", "رقم البيت أو نصّ عربي أو كلمة من الترجمة")} value=${q} onInput=${(e) => setQ(e.currentTarget.value)} onKeyDown=${onKey} dir="auto" autocomplete="off" />
        <button class="icon-btn" aria-label=${L("Закрыть поиск", "Close search", "إغلاق البحث")} onClick=${onClose}><${Icon} name="x" /></button></div>
      <div class="d-body">
        <div class="row" style="justify-content:space-between;margin-bottom:8px"><label class="toggle"><input type="checkbox" checked=${deep} onChange=${(e) => setDeep(e.currentTarget.checked)} />${L("Искать и в объяснениях", "Also search the commentary", "ابحث في الشرح أيضًا")}</label>
          <span class="hint">${q.trim() ? L(`Найдено: ${res.length}`, `Found: ${res.length}`, `النتائج: ${res.length}`) : L("Огласовки в арабском запросе не нужны", "No need for vowel marks in Arabic queries", "لا حاجة إلى التشكيل في البحث")}</span></div>
        <div class="s-res">${res.map((r, i) => {
          const cls = cx(i === cur && "cur");
          if (r.type === "jump") return html`<button class=${cls} onClick=${() => open(r)}><span class="n">${r.n}</span><span>${L(`Перейти к бейту ${r.n}`, `Go to bayt ${r.n}`, `الانتقال إلى البيت ${r.n}`)} · ${secName(sectionOf(r.n))}</span></button>`;
          if (r.type === "ar") return html`<button class=${cls} onClick=${() => open(r)}><span class="n">${r.n}</span><span class="ar" lang="ar">${hlWords(r.n, r.tokens)}</span></button>`;
          if (r.type === "tr") return html`<button class=${cls} onClick=${() => open(r)}><span class="n">${r.n}</span><span dir="ltr">${hlText(r.text, r.ql)}</span></button>`;
          if (r.type === "sharh") return html`<button class=${cls} onClick=${() => open(r)}><span class="n">${r.n}</span><span class="ink2">${L("В объяснении", "In the commentary", "في الشرح")}: ${hlText(r.text, r.ql)}…</span></button>`;
          if (r.type === "sharhAr") return html`<button class=${cls} onClick=${() => open(r)}><span class="n">${r.n}</span><span class="ink2">في الشرح: ${r.text}…</span></button>`;
          if (r.type === "rule") return html`<button class=${cls} onClick=${() => open(r)}><span class="n"><${Icon} name="scroll" /></span><span>${L("Правило", "Rule", "قاعدة")}: <b>${ruleL(r.r).t}</b></span></button>`;
          const t = termL(r.t);
          return html`<button class=${cls} onClick=${() => open(r)}><span class="n"><${Icon} name="dict" /></span><span>${L("Термин", "Term", "مصطلح")}: ${t.tr && html`<b>${t.tr}</b> `}<bdi class="ar-inline">${t.ar}</bdi> — ${t.m}</span></button>`;
        })}
        ${q.trim() && !res.length && html`<div class="empty">${L("Ничего не найдено. Проверьте написание или включите поиск в объяснениях.", "Nothing found. Check the spelling or turn on commentary search.", "لا نتائج. تحقّق من الكتابة أو فعّل البحث في الشرح.")}</div>`}
        ${!q.trim() && html`<div class="col" style="gap:8px"><span class="label">${L("Например", "For example", "مثلًا")}</span><div class="row" style="gap:6px">
          ${examples.map((x) => html`<button class="chip" onClick=${() => setQ(x)}>${x}</button>`)}</div></div>`}
        </div>
      </div>
    </div>
  </div>`;
}

function View({ r }) {
  switch (r.name) {
    case "read": return html`<${ReadView} />`;
    case "study": return html`<${StudyView} n=${Math.max(1, Math.min(TOTAL, r.n))} />`;
    case "lessons": return html`<${LessonsView} />`;
    case "makharij": return html`<${MakharijView} />`;
    case "rules": return html`<${RulesView} />`;
    case "rule": return html`<${RuleView} id=${r.id} />`;
    case "dict": return html`<${DictView} />`;
    case "memorize": return html`<${MemorizeView} />`;
    case "review": return html`<${ReviewView} />`;
    case "tests": return html`<${TestsView} />`;
    case "test": return html`<${TestView} id=${r.id} />`;
    case "listen": return html`<${ListenView} />`;
    case "profile": return SHOW_CABINET ? html`<${ProfileView} />` : html`<${HomeView} />`;
    case "options": return html`<${OptionsView} />`;
    case "admin": return html`<${AdminView} />`;
    default: return html`<${HomeView} />`;
  }
}

function App() {
  const r = useRoute();
  const auth = useAuth();
  useContent();
  const [, bump] = useState(0);
  const [search, setSearch] = useState(false);
  const [more, setMore] = useState(false);
  const [chapters, setChapters] = useState(false);
  const top = useRef();
  const active = SECTION_OF_ROUTE[r.name] || r.name;
  useEffect(() => onLang(() => bump((x) => x + 1)), []);
  useEffect(() => { if (auth.admin) enableManage(); }, [auth.admin]);
  useEffect(() => {
    const onScroll = () => top.current?.classList.toggle("scrolled", window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    const onKey = (e) => {
      const typing = e.target.closest?.("input,textarea,select,[contenteditable]");
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) { e.preventDefault(); setSearch(true); }
      if (e.key === " " && !typing && !e.target.closest?.("button") && P.n) { e.preventDefault(); toggle(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("scroll", onScroll); document.removeEventListener("keydown", onKey); };
  }, []);
  const wide = ["read", "makharij", "study"].includes(r.name);
  const tCh = L("Главы матна", "Chapters of the matn", "أبواب المتن");
  return html`<div class="shell" key=${LANG}>
    <${Rail} active=${active} admin=${auth.admin} />
    <div class="main">
      <header class=${cx("topbar", r.name === "read" && "has-ch")} ref=${top}>
        <${Brand} sub=${false} />
        <div class="t-title">${titleOf(r, auth.admin)}</div>
        <span class="grow"></span>
        ${r.name === "read" && html`<button class="btn sm ghost show-md" onClick=${() => setChapters(true)} title=${tCh} aria-label=${tCh}><${Icon} name="list" /><span class="hide-sm">${L("Главы", "Chapters", "الأبواب")}</span></button>`}
        <button class="btn sm ghost" onClick=${() => setSearch(true)} aria-label=${L("Поиск", "Search", "البحث")}><${Icon} name="search" /><span class="hide-sm" style="display:inline-flex;gap:6px;align-items:center">${L("Поиск", "Search", "البحث")} <span class="kbd">⌘K</span></span></button>
        <${LangButton} />
        <${ThemeButton} />
        <button class=${cx("icon-btn", r.name === "options" && "on")} title=${L("Настройки", "Settings", "الإعدادات")} aria-label=${L("Настройки", "Settings", "الإعدادات")} onClick=${() => go("options")}><${Icon} name="gear" /></button>
      </header>
      <main class=${cx("view", wide && "wide")} id="main"><${View} r=${r} /></main>
      <${Footer} />
    </div>
    <${MiniPlayer} />
    <${TabBar} active=${active} onMore=${() => setMore(true)} />
    ${more && html`<${MoreSheet} onClose=${() => setMore(false)} admin=${auth.admin} />`}
    ${chapters && html`<${Dialog} title=${tCh} onClose=${() => setChapters(false)}><${ChapterList} onPick=${() => setChapters(false)} /></${Dialog}>`}
    ${search && html`<${Search} onClose=${() => setSearch(false)} />`}
    <${AiNotice} />
    <${PopHost} />
    <${ToastHost} />
  </div>`;
}

setAchievementHandler((a) => toast(L(`Достижение: «${achText(a).t}»`, `Achievement: “${achText(a).t}”`, `إنجاز: «${achText(a).t}»`), { icon: a.ico, kind: "gilt", ms: 5200 }));
setGoalHandler(() => toast(L("Цель дня выполнена. Да примет Аллах!", "Daily goal complete. May Allah accept it!", "تحقّق هدف اليوم. تقبّل الله!"), { icon: "target", kind: "gilt", ms: 5200 }));
applyPrefs();
const root = document.getElementById("app");
langReady().then(() => {
  root.textContent = "";
  render(html`<${App} />`, root);
});
initAuth().then((a) => {
  initMedia(a.db);
  initContent(a.db);
});
export { sectionVerses, D };
