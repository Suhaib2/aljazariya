// Страница «Настройки»: язык и перевод, текст, чтец и аудио, заучивание, модель, цель дня, тема.
// Чтеца и число повторов можно сменить и прямо в плеере.
import { html, useState, useEffect, cx } from "../lib.js";
import { TOTAL } from "../data/index.js";
import { useSel, act } from "../core/store.js";
import { SPEEDS, REPEATS, setSpeed, setReciter, setRepeat } from "../core/audio.js";
import { lib, reciterName, reciterCount, currentReciter, onMediaChange } from "../core/media.js";
import { route } from "../core/nav.js";
import { L, LANG, TR, LANGS, effectiveTr } from "../core/i18n.js";
import { Icon, Seg } from "../ui/kit.js";
import { VerseText, Translation, displayOf } from "../ui/verse.js";
import { setUiLang } from "../ui/lang.js";

const set = (k) => (v) => act.setPref(k, v);
const trName = (t) => (t === "ru" ? L("русский", "Russian", "الروسية") : t === "en" ? L("английский", "English", "الإنجليزية") : L("без перевода", "no translation", "بلا ترجمة"));

function Switch({ checked, onChange, label, disabled }) {
  return html`<label class="toggle"><input type="checkbox" role="switch" aria-label=${label} checked=${!!checked} disabled=${disabled} onChange=${(e) => onChange(e.currentTarget.checked)} /></label>`;
}
function Row({ t, d, children, dis }) {
  return html`<div class=${cx("set-row", dis && "dis")}><div class="set-l"><div class="set-t">${t}</div>${d && html`<div class="set-d">${d}</div>`}</div><div class="set-c">${children}</div></div>`;
}
function Group({ id, icon, title, children }) {
  return html`<section class="card set-group" id=${"opt-" + id}><h2 class="set-h"><${Icon} name=${icon} />${title}</h2>${children}</section>`;
}

export function OptionsView() {
  const p = useSel((d) => d.s.prefs);
  const goal = useSel((d) => d.s.goal);
  const [, bump] = useState(0);
  useEffect(() => onMediaChange(() => bump((x) => x + 1)), []);
  useEffect(() => { const t = setTimeout(() => bump((x) => x + 1), 400); return () => clearTimeout(t); }, []);
  useEffect(() => {
    const sec = route().state?.section;
    if (sec) setTimeout(() => document.getElementById("opt-" + sec)?.scrollIntoView({ block: "start", behavior: "smooth" }), 80);
  }, []);
  const show = displayOf(p);
  const autoTr = effectiveTr({ ...p, trLang: "auto" });
  const nav = [
    ["lang", "globe", L("Язык и перевод", "Language and translation", "اللغة والترجمة")],
    ["text", "type", L("Текст матна", "Text of the matn", "نصّ المتن")],
    ["audio", "headphones", L("Чтец и аудио", "Reciter and audio", "القارئ والصوت")],
    ["memo", "layers", L("Заучивание", "Memorization", "الحفظ")],
    ["model", "head", L("Модель махраджей", "Makharij model", "نموذج المخارج")],
    ["goal", "target", L("Цель дня", "Daily goal", "هدف اليوم")],
    ["look", "sun", L("Оформление", "Appearance", "المظهر")],
  ];
  const jump = (id) => document.getElementById("opt-" + id)?.scrollIntoView({ block: "start", behavior: "smooth" });

  return html`<div>
    <div class="page-head"><div><h1>${L("Настройки", "Settings", "الإعدادات")}</h1>
      <p class="sub">${L("Все параметры платформы собраны здесь. Изменения сохраняются сразу.", "All of the platform’s settings are here. Changes are saved immediately.", "جميع إعدادات المنصة هنا، وتُحفظ التغييرات فورًا.")}</p></div></div>
    <div class="opt-layout">
      <nav class="opt-nav" aria-label=${L("Разделы настроек", "Settings sections", "أقسام الإعدادات")}>
        ${nav.map(([id, ico, t]) => html`<button onClick=${() => jump(id)}><${Icon} name=${ico} />${t}</button>`)}
      </nav>
      <div class="col" style="gap:16px;min-width:0">

        <${Group} id="lang" icon="globe" title=${nav[0][2]}>
          <${Row} t=${L("Язык сайта", "Site language", "لغة الموقع")} d=${L("Его же можно сменить значком глобуса вверху страницы.", "You can also change it with the globe icon at the top of the page.", "ويمكن تغييرها أيضًا بأيقونة الكرة الأرضية أعلى الصفحة.")}>
            <${Seg} label=${L("Язык сайта", "Site language", "لغة الموقع")} value=${LANG} onChange=${setUiLang} options=${LANGS.map((l) => ({ v: l.id, label: html`<span lang=${l.id}>${l.name}</span>` }))} /></${Row}>
          <${Row} t=${L("Перевод бейтов", "Translation of the bayts", "ترجمة الأبيات")}
            d=${L(`«Авто» следует языку сайта: сейчас — ${trName(autoTr)}. Русский сайт — русский перевод, английский — английский, арабский — без перевода.`,
              `“Auto” follows the site language: now ${trName(autoTr)}. Russian site — Russian translation, English — English, Arabic — no translation.`,
              `«تلقائي» يتبع لغة الموقع: الآن ${trName(autoTr)}. الموقع الروسي بالترجمة الروسية، والإنجليزي بالإنجليزية، والعربي بلا ترجمة.`)}>
            <${Seg} label=${L("Перевод бейтов", "Translation", "الترجمة")} value=${p.trLang} onChange=${set("trLang")}
              options=${[{ v: "auto", label: L("Авто", "Auto", "تلقائي") }, { v: "ru", label: "Русский" }, { v: "en", label: "English" }, { v: "off", label: L("Выкл.", "Off", "إيقاف") }]} /></${Row}>
          <${Row} t=${L("Пословный перевод", "Word-by-word translation", "ترجمة كل كلمة")} dis=${!TR}
            d=${TR ? L("Под каждым арабским словом — его перевод.", "The translation appears under each Arabic word.", "تظهر الترجمة تحت كل كلمة عربية.") : L("Доступен, когда включён перевод.", "Available when the translation is on.", "متاح عند تشغيل الترجمة.")}>
            <${Switch} label=${L("Пословный перевод", "Word-by-word translation", "ترجمة كل كلمة")} checked=${p.wordByWord && !!TR} disabled=${!TR} onChange=${set("wordByWord")} /></${Row}>
          <${Row} t=${L("Что показывать", "What to show", "ما يُعرض")} dis=${!TR}>
            <${Seg} label=${L("Что показывать", "What to show", "ما يُعرض")} value=${TR ? p.mode : "both"} onChange=${(v) => TR && act.setPref("mode", v)}
              options=${[{ v: "both", label: L("Арабский и перевод", "Arabic and translation", "العربي والترجمة") }, { v: "tr", label: L("Только перевод", "Translation only", "الترجمة فقط") }]} /></${Row}>
        </${Group}>

        <${Group} id="text" icon="type" title=${nav[1][2]}>
          <${Row} t=${L("Арабский шрифт", "Arabic font", "الخط العربي")}>
            <${Seg} label=${L("Шрифт", "Font", "الخط")} value=${p.font} onChange=${set("font")}
              options=${[{ v: "naskh", label: html`<span style="font-family:var(--f-ar);font-size:17px" lang="ar">نسخ</span> ${L("насх", "Naskh", "")}` }, { v: "ruqaa", label: html`<span style="font-family:var(--f-ruqaa);font-size:17px" lang="ar">رقعة</span> ${L("рук‘а", "Ruq‘ah", "")}` }]} /></${Row}>
          <${Row} t=${L("Размер арабского текста", "Arabic text size", "حجم النص العربي")} d=${`${p.size}px`}>
            <input type="range" min="20" max="52" step="1" value=${p.size} aria-label=${L("Размер арабского текста", "Arabic text size", "حجم النص العربي")} onInput=${(e) => act.setPref("size", +e.currentTarget.value)} /></${Row}>
          <${Row} t=${L("Полустишия", "Hemistichs", "الشطران")}>
            <${Seg} label=${L("Расположение полустиший", "Hemistich layout", "ترتيب الشطرين")} value=${p.layout} onChange=${set("layout")}
              options=${[{ v: "pair", label: L("В строку", "Side by side", "متجاوران") }, { v: "stack", label: L("Столбиком", "Stacked", "متتاليان") }]} /></${Row}>
          <${Row} t=${L("Подчёркивать термины таджвида", "Underline tajweed terms", "تمييز مصطلحات التجويد")} d=${L("Наведите на термин — краткое пояснение.", "Hover a term for a short explanation.", "مرّر على المصطلح لترى شرحًا موجزًا.")}>
            <${Switch} label=${L("Термины", "Terms", "المصطلحات")} checked=${p.terms} onChange=${set("terms")} /></${Row}>
          <div class="set-preview">
            ${show.ar && html`<${VerseText} n=${9} />`}
            ${show.tr && html`<${Translation} n=${9} />`}
          </div>
        </${Group}>

        <${Group} id="audio" icon="headphones" title=${nav[2][2]}>
          <${Row} t=${L("Чтец", "Reciter", "القارئ")} d=${lib.reciters.length ? L("Если у выбранного чтеца нет записи бейта, звучит запись другого чтеца.", "If the chosen reciter has no recording of a bayt, another reciter’s recording plays.", "إن لم يوجد تسجيل للبيت عند القارئ المختار، يُشغَّل تسجيل قارئ آخر.") : L("Записи чтецов загружает администратор. Пока их нет, бейты не озвучиваются.", "Reciters’ recordings are uploaded by the administrator. Until then the bayts have no audio.", "يرفع المشرف تسجيلات القرّاء، وإلى ذلك الحين لا صوت للأبيات.")}>
            ${lib.reciters.length ? html`<select class="input" style="width:auto;min-width:200px" value=${currentReciter()?.id} onChange=${(e) => setReciter(e.currentTarget.value)} aria-label=${L("Чтец", "Reciter", "القارئ")}>
              ${lib.reciters.map((r, i) => html`<option value=${r.id}>${reciterName(r, i)} · ${reciterCount(r.id)}/${TOTAL}</option>`)}
            </select>` : html`<span class="hint">${L("Чтецов пока нет — записи добавляет администратор.", "No reciters yet — the administrator adds the recordings.", "لا قرّاء بعد؛ يضيف المشرف التسجيلات.")}</span>`}</${Row}>
          <${Row} t=${L("Скорость", "Speed", "السرعة")}>
            <${Seg} label=${L("Скорость", "Speed", "السرعة")} small=${true} value=${p.speed} onChange=${setSpeed} options=${SPEEDS.map((v) => ({ v, label: v + "×" }))} /></${Row}>
          <${Row} t=${L("Повтор бейта", "Repeat each bayt", "تكرار البيت")} d=${L("Сколько раз звучит каждый бейт — и по одному, и при прослушивании подряд.", "How many times each bayt plays — on its own and in continuous listening.", "عدد مرات تشغيل كل بيت، منفردًا وفي الاستماع المتتابع.")}>
            <${Seg} label=${L("Повтор бейта", "Repeat", "التكرار")} small=${true} value=${p.repeat} onChange=${setRepeat} options=${REPEATS.map((v) => ({ v, label: v ? v + "×" : "∞" }))} /></${Row}>
          <${Row} t=${L("Пауза между повторами", "Pause between repeats", "الفاصل بين التكرارات")}>
            <${Seg} label=${L("Пауза", "Pause", "الفاصل")} small=${true} value=${p.pauseSec} onChange=${set("pauseSec")} options=${[0, 1, 2, 3, 5].map((v) => ({ v, label: `${v} ${L("с", "s", "ث")}` }))} /></${Row}>
          <${Row} t=${L("Дальше автоматически", "Continue automatically", "الانتقال التلقائي")} d=${L("После бейта начинается следующий.", "The next bayt starts after the current one.", "يبدأ البيت التالي بعد انتهاء الحالي.")}>
            <${Switch} label=${L("Дальше автоматически", "Continue automatically", "الانتقال التلقائي")} checked=${p.autoNext} onChange=${set("autoNext")} /></${Row}>
          <${Row} t=${L("Подсветка строки при чтении", "Highlight the line being read", "تمييز السطر المقروء")}>
            <${Switch} label=${L("Подсветка строки", "Line highlight", "تمييز السطر")} checked=${p.lineHL} onChange=${set("lineHL")} /></${Row}>
          <${Row} t=${L("Прокручивать к звучащему бейту", "Scroll to the bayt being played", "التمرير إلى البيت المسموع")}>
            <${Switch} label=${L("Прокрутка", "Scrolling", "التمرير")} checked=${p.follow} onChange=${set("follow")} /></${Row}>
          <${Row} t=${L("«Слушать матн»: показывать текст", "“Listen”: show the text", "«الاستماع»: إظهار النص")}>
            <${Switch} label=${L("Показывать текст", "Show the text", "إظهار النص")} checked=${p.listenText} onChange=${set("listenText")} /></${Row}>
        </${Group}>

        <${Group} id="memo" icon="layers" title=${nav[3][2]}>
          <${Row} t=${L("Скрывать слова", "Hide words", "إخفاء الكلمات")} d=${L("Скрытое слово открывается нажатием.", "Tap a hidden word to reveal it.", "انقر الكلمة المخفية لإظهارها.")}>
            <${Seg} label=${L("Доля скрытых слов", "Share of hidden words", "نسبة الكلمات المخفية")} small=${true} value=${p.hideLevel} onChange=${set("hideLevel")} options=${[0, 25, 50, 75, 100].map((v) => ({ v, label: v ? v + "%" : L("Нет", "None", "لا") }))} /></${Row}>
          <${Row} t=${L("Только первые буквы слов", "First letters only", "الحروف الأولى فقط")}>
            <${Switch} label=${L("Первые буквы", "First letters", "الحروف الأولى")} checked=${p.firstLetters} onChange=${set("firstLetters")} /></${Row}>
          <${Row} t=${L("Скрыть перевод", "Hide the translation", "إخفاء الترجمة")} d=${L("Перевод открывается нажатием.", "Tap the translation to reveal it.", "انقر الترجمة لإظهارها.")} dis=${!TR}>
            <${Switch} label=${L("Скрыть перевод", "Hide the translation", "إخفاء الترجمة")} checked=${p.hideRu} disabled=${!TR} onChange=${set("hideRu")} /></${Row}>
          <${Row} t=${L("Только аудио", "Audio only", "الصوت فقط")} d=${L("Текст бейтов скрыт полностью.", "The text of the bayts is fully hidden.", "يُخفى نصّ الأبيات كاملًا.")}>
            <${Switch} label=${L("Только аудио", "Audio only", "الصوت فقط")} checked=${p.audioOnly} onChange=${set("audioOnly")} /></${Row}>
          <${Row} t=${L("Скрывать слово по нажатию", "Hide a word on tap", "إخفاء الكلمة بالنقر")} d=${L("Вместо карточки слова нажатие прячет его.", "A tap hides the word instead of opening its card.", "النقر يخفي الكلمة بدل فتح بطاقتها.")}>
            <${Switch} label=${L("Скрывать по нажатию", "Hide on tap", "الإخفاء بالنقر")} checked=${p.clickHide} onChange=${set("clickHide")} /></${Row}>
        </${Group}>

        <${Group} id="model" icon="head" title=${nav[4][2]}>
          <${Row} t=${L("Вид модели", "Model view", "نوع النموذج")} d=${L("3D требует WebGL.", "3D requires WebGL.", "العرض ثلاثي الأبعاد يتطلّب WebGL.")}>
            <${Seg} label=${L("Вид модели", "Model view", "نوع النموذج")} value=${p.model} onChange=${set("model")}
              options=${[{ v: "2d", label: html`<span class="row" style="gap:6px"><${Icon} name="square" />2D</span>` }, { v: "3d", label: html`<span class="row" style="gap:6px"><${Icon} name="cube" />3D</span>` }]} /></${Row}>
          <${Row} t=${L("Подписи органов", "Organ labels", "أسماء الأعضاء")} d=${L("Только в 2D.", "2D only.", "في العرض ثنائي الأبعاد فقط.")}>
            <${Switch} label=${L("Подписи органов", "Organ labels", "أسماء الأعضاء")} checked=${p.mkLabels} onChange=${set("mkLabels")} /></${Row}>
        </${Group}>

        <${Group} id="goal" icon="target" title=${nav[5][2]}>
          ${[["learn", L("Новых бейтов в день", "New bayts per day", "أبيات جديدة يوميًا"), 1, 10], ["review", L("Повторений в день", "Reviews per day", "مراجعات يوميًا"), 0, 40], ["listen", L("Минут слушать", "Minutes of listening", "دقائق الاستماع"), 0, 120]].map(([k, t, a, b]) => html`
            <${Row} t=${t}><input class="input num" type="number" min=${a} max=${b} value=${goal[k]} id=${"goal-" + k} style="width:96px" aria-label=${t}
              onChange=${(e) => act.setGoal({ [k]: Math.max(a, Math.min(b, +e.currentTarget.value || a)) })} /></${Row}>`)}
        </${Group}>

        <${Group} id="look" icon="sun" title=${nav[6][2]}>
          <${Row} t=${L("Тема", "Theme", "السمة")}>
            <${Seg} label=${L("Тема", "Theme", "السمة")} value=${p.theme} onChange=${set("theme")}
              options=${[{ v: "auto", label: L("Как в системе", "System", "حسب النظام") }, { v: "light", label: L("Светлая", "Light", "فاتحة") }, { v: "dark", label: L("Тёмная", "Dark", "داكنة") }]} /></${Row}>
        </${Group}>
      </div>
    </div>
  </div>`;
}
