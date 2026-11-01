// Админ-панель: чтецы и записи бейтов (массовая загрузка из ZIP, папки или файлов),
// правка текстов на трёх языках, объявление для всех, почта сайта и пароль администратора.
// Без входа вместо панели показывается форма входа.
import { html, useState, useEffect, cx } from "../lib.js";
import { V, TOTAL, sectionOf } from "../data/index.js";
import { useAuth, logoutAdmin, changeAdmin } from "../core/auth.js";
import { useContent, saveEdit, resetEdit, saveNotice, saveSite, contactEmail, original, EDIT } from "../core/content.js";
import { CONTACT_EMAIL } from "../config.js";
import { lib, onMediaChange, expandFiles, planUpload, uploadShared, removeShared, removeAllShared, storageUsage, removeOrphans, canConvert, needsConversion, numberFromName,
  addReciter, renameReciter, makeDefaultReciter, removeReciter, reciterName, reciterCount } from "../core/media.js";
import { toggle as togglePlay } from "../core/audio.js";
import { go } from "../core/nav.js";
import { L, bayt, secName, fmtDate, nFile } from "../core/i18n.js";
import { Icon, Bar, toast, Confirm } from "../ui/kit.js";
import { VerseText, Translation } from "../ui/verse.js";
import { LoginView } from "./login.js";

// Если для бейта несколько файлов, загружается последний в списке.
function markDups(rs) {
  const last = new Map();
  rs.forEach((r) => r.n && last.set(r.n, r.id));
  return rs.map((r) => ({ ...r, dup: !!r.n && last.get(r.n) !== r.id }));
}
const mb = (b) => (b / 1048576).toFixed(b > 104857600 ? 0 : 1) + " " + L("МБ", "MB", "م.ب");

export function AdminView() {
  const auth = useAuth();
  const [tab, setTab] = useState("audio");
  if (!auth.admin) return html`<${LoginView} />`;
  const tabs = [["audio", L("Чтецы и аудио", "Reciters and audio", "القرّاء والتسجيلات")], ["texts", L("Тексты", "Texts", "النصوص")], ["notice", L("Объявление", "Announcement", "الإعلان")], ["site", L("Сайт и вход", "Site and sign-in", "الموقع والدخول")]];
  return html`<div>
    <div class="page-head"><div><h1>${L("Админ-панель", "Admin panel", "لوحة الإدارة")}</h1>
      <p class="sub">${L("Чтецы и записи бейтов, правка текста, перевода и шарха, объявление на главной, почта сайта. Посетители видят результат, но не могут ничего изменить.", "Reciters and recordings, editing the text, translations and commentary, the home-page announcement and the site’s email. Visitors see the result but cannot change anything.", "القرّاء والتسجيلات، وتحرير النص والترجمة والشرح، وإعلان الصفحة الرئيسية، وبريد الموقع. يرى الزوّار النتيجة ولا يغيّرون شيئًا.")}</p></div>
      <button class="btn sm" onClick=${() => { logoutAdmin(); go("home"); }}><${Icon} name="logout" />${L("Выйти", "Sign out", "خروج")}</button></div>
    <div class="tabs" role="tablist">${tabs.map(([id, l]) => html`<button role="tab" aria-selected=${String(tab === id)} onClick=${() => setTab(id)}>${l}</button>`)}</div>
    ${tab === "audio" && html`<${AudioAdmin} />`}
    ${tab === "texts" && html`<${TextsAdmin} />`}
    ${tab === "notice" && html`<${NoticeAdmin} />`}
    ${tab === "site" && html`<${SiteAdmin} />`}
  </div>`;
}

// ---------- чтецы и аудио ----------
function Rules() {
  return html`<details class="card rules-box"><summary><b>${L("Как назвать файлы", "How to name the files", "كيف تُسمّى الملفات")}</b> <span class="muted">— ${L("номер бейта берётся из имени", "the bayt number is taken from the name", "رقم البيت يؤخذ من الاسم")}</span></summary>
    <ul>
      <li>${L("В имени файла должен быть номер бейта от 1 до 109. Если чисел несколько, берётся последнее:", "The file name must contain the bayt number from 1 to 109. If there are several numbers, the last one is used:", "يجب أن يحوي اسم الملف رقم البيت من 1 إلى 109، وإن تعدّدت الأرقام أُخذ الأخير:")} <code>001.mp3</code>, <code>1.mp3</code>, <code>bayt-012.m4a</code>, <code>Jazariyya 109.mp3</code>.</li>
      <li>${L("Ведущие нули не обязательны, но с ними файлы удобнее сортировать:", "Leading zeros are optional but make sorting easier:", "الأصفار في البداية اختيارية لكنها تسهّل الترتيب:")} <code>001.mp3 … 109.mp3</code>.</li>
      <li>${L("Один файл — один бейт. Если для бейта загружено два файла, используется последний.", "One file — one bayt. If two files are given for a bayt, the last one is used.", "ملف واحد لكل بيت، وإن وُجد ملفان لبيت واحد اعتُمد الأخير.")}</li>
      <li>${L("Записи разных чтецов загружайте отдельно: выберите чтеца выше, затем файлы.", "Upload each reciter’s recordings separately: choose the reciter above, then the files.", "ارفع تسجيلات كل قارئ على حدة: اختر القارئ أعلاه ثم الملفات.")}</li>
      <li>${L("Форматы: M4A и WebM сохраняются как есть; MP3, WAV, OGG и FLAC браузер перекодирует в WebM", "Formats: M4A and WebM are stored as they are; MP3, WAV, OGG and FLAC are converted to WebM by the browser", "الصيغ: M4A وWebM تُحفظ كما هي، وMP3 وWAV وOGG وFLAC يحوّلها المتصفح إلى WebM")}${canConvert() ? "" : L(" (нужен Chrome или Edge)", " (Chrome or Edge is required)", " (يلزم Chrome أو Edge)")}.</li>
      <li>${L("Можно выбрать сразу всю папку, много файлов или один ZIP-архив. Папки внутри архива не мешают.", "You can choose a whole folder, many files or one ZIP archive. Folders inside the archive are fine.", "يمكنك اختيار مجلد كامل أو ملفات كثيرة أو أرشيف ZIP واحد، ولا تضرّ المجلدات داخله.")}</li>
      <li>${L("Новая запись заменяет старую; прежний файл удаляется из хранилища.", "A new recording replaces the old one; the old file is deleted from storage.", "التسجيل الجديد يحلّ محل القديم، ويُحذف الملف السابق من التخزين.")}</li>
    </ul></details>`;
}

// Имя чтеца на каждом языке интерфейса: пустое поле — показывается имя, введённое при добавлении.
const NAME_LANGS = [["ru", "Русский"], ["en", "English"], ["ar", "العربية"]];
const namesOf = (r) => ({ ru: r?.names?.ru || r?.name || "", en: r?.names?.en || "", ar: r?.names?.ar || "" });

function Reciters({ rid, setRid }) {
  const [name, setName] = useState("");
  const [names, setNames] = useState(() => namesOf(null));
  const [confirmDel, setConfirmDel] = useState(false);
  const [busy, setBusy] = useState(false);
  const cur = lib.reciters.find((r) => r.id === rid);
  const saved = namesOf(cur);
  useEffect(() => { setNames(namesOf(cur)); setConfirmDel(false); }, [rid, JSON.stringify(saved)]);
  const dirty = NAME_LANGS.some(([k]) => names[k].trim() !== saved[k]);
  const add = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try { const id = await addReciter(name); setRid(id); setName(""); toast(L("Чтец добавлен", "Reciter added", "أُضيف القارئ"), { icon: "check" }); }
    catch (e) { toast(e?.message || L("Не удалось сохранить", "Could not save", "تعذّر الحفظ"), { icon: "info" }); }
    setBusy(false);
  };
  return html`<div class="card col" style="gap:12px">
    <div class="row" style="justify-content:space-between"><h3>${L("Чтецы", "Reciters", "القرّاء")}</h3>
      <span class="hint">${L("Ученики выбирают чтеца в настройках. Первый в списке звучит по умолчанию.", "Students choose the reciter in Settings. The first one in the list plays by default.", "يختار الطلاب القارئ من الإعدادات، والأول في القائمة هو الافتراضي.")}</span></div>
    ${lib.reciters.length > 0 && html`<div class="row" style="gap:6px">${lib.reciters.map((r, i) => html`<button class=${cx("chip", r.id === rid && "on")} onClick=${() => setRid(r.id)}>
      ${i === 0 && html`<${Icon} name="star" fill=${true} />`}${reciterName(r, i)} <span class="num muted">${reciterCount(r.id)}/${TOTAL}</span></button>`)}</div>`}
    <div class="row" style="gap:6px"><input class="input" id="rec-new" style="max-width:280px" value=${name} onInput=${(e) => setName(e.currentTarget.value)}
      placeholder=${L("Имя нового чтеца, например: шейх Айман Сувейд", "New reciter’s name, e.g. Shaykh Ayman Suwayd", "اسم القارئ الجديد، مثل: الشيخ أيمن سويد")} onKeyDown=${(e) => e.key === "Enter" && add()} />
      <button class="btn sm" disabled=${!name.trim() || busy} onClick=${add}><${Icon} name="plus" />${L("Добавить чтеца", "Add reciter", "إضافة قارئ")}</button></div>
    ${cur && html`<div class="vquote" style="gap:8px">
      <div class="label">${L("Имя чтеца на языках сайта", "Reciter’s name in the site’s languages", "اسم القارئ بلغات الموقع")}</div>
      ${NAME_LANGS.map(([k, t]) => html`<label class="row" style="gap:8px;flex-wrap:nowrap"><span class="hint" style="width:70px;flex:none">${t}</span>
        <input class="input" id=${"rec-name-" + k} lang=${k} dir=${k === "ar" ? "rtl" : "ltr"} style="max-width:280px" value=${names[k]} onInput=${(e) => { const v = e.currentTarget.value; setNames((x) => ({ ...x, [k]: v })); }} /></label>`)}
      <div class="row" style="gap:6px">
        <button class="btn sm" disabled=${!dirty || !NAME_LANGS.some(([k]) => names[k].trim())} onClick=${async () => { await renameReciter(rid, names); toast(L("Имя сохранено", "Name saved", "حُفظ الاسم"), { icon: "check" }); }}><${Icon} name="check" />${L("Сохранить имя", "Save name", "حفظ الاسم")}</button>
        ${lib.reciters[0]?.id !== rid && html`<button class="btn sm ghost" onClick=${() => makeDefaultReciter(rid)}><${Icon} name="star" />${L("Сделать основным", "Make default", "اجعله الافتراضي")}</button>`}
        <span class="grow"></span>
        <button class="btn sm danger" onClick=${() => setConfirmDel(true)}><${Icon} name="trash" />${L("Удалить чтеца", "Delete reciter", "حذف القارئ")}</button></div>
      ${confirmDel && html`<${Confirm} danger=${true} text=${L(`Удалить чтеца «${reciterName(cur)}» и все его записи (${reciterCount(rid)})?`, `Delete the reciter “${reciterName(cur)}” and all of their recordings (${reciterCount(rid)})?`, `حذف القارئ «${reciterName(cur)}» وكل تسجيلاته (${reciterCount(rid)})؟`)} yes=${L("Удалить", "Delete", "حذف")}
        onYes=${async () => { setConfirmDel(false); await removeReciter(rid); setRid(lib.reciters[0]?.id || null); toast(L("Чтец удалён", "Reciter deleted", "حُذف القارئ"), { icon: "trash" }); }} onNo=${() => setConfirmDel(false)} />`}
    </div>`}
  </div>`;
}

function AudioAdmin() {
  const [, bump] = useState(0);
  const [rid, setRid] = useState(() => lib.reciters[0]?.id || null);
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("");
  const [prog, setProg] = useState(null);
  const [usage, setUsage] = useState(null);
  const [sel, setSel] = useState(null);
  const [drag, setDrag] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);
  useEffect(() => onMediaChange(() => bump((x) => x + 1)), []);
  useEffect(() => { if (!lib.reciters.some((r) => r.id === rid)) setRid(lib.reciters[0]?.id || null); });
  const map = (rid && lib.maps[rid]) || {};
  const count = Object.values(map).filter((x) => x?.id).length;
  const total = lib.reciters.reduce((a, r) => a + reciterCount(r.id), 0);
  useEffect(() => { storageUsage().then(setUsage); }, [total]);
  if (!lib.canManage) return html`<div class="warn-box">${L("Загрузка записей недоступна в этом окне. Откройте платформу в Claude под аккаунтом владельца или редактора страницы.", "Uploading is not available in this window. Open the platform in Claude with the page owner’s or an editor’s account.", "الرفع غير متاح في هذه النافذة. افتح المنصة في Claude بحساب مالك الصفحة أو محرّرها.")}</div>`;

  const onFiles = async (files) => {
    if (!files?.length) return;
    setStatus(L("Читаем файлы…", "Reading files…", "جارٍ قراءة الملفات…")); setProg(null);
    try {
      const list = await expandFiles([...files], setStatus);
      setRows(planUpload(list));
      setStatus(list.length ? "" : L("В выбранном нет аудиофайлов.", "There are no audio files in the selection.", "لا ملفات صوتية في المحدد."));
    } catch (e) { setStatus(L("Не удалось прочитать архив: ", "Could not read the archive: ", "تعذّرت قراءة الأرشيف: ") + (e?.message || "")); }
  };
  const setN = (id, n) => setRows((rs) => markDups(rs.map((r) => (r.id === id ? { ...r, n: n >= 1 && n <= TOTAL ? n : null } : r))));
  const ready = rows.filter((r) => r.n && !r.dup);
  const start = async () => {
    const errors = [];
    let ok = 0;
    for (let k = 0; k < ready.length; k++) {
      const r = ready[k];
      setProg({ k, total: ready.length, name: r.f.name, errors });
      try { await uploadShared(r.n, r.f, rid); ok++; }
      catch (e) { errors.push({ n: r.n, name: r.f.name, msg: e?.message || e?.code || "" }); if (e?.code === "no-encoder" || e?.code === "no-reciter") break; }
    }
    setProg({ k: ready.length, total: ready.length, done: true, errors, ok });
    setRows([]);
    toast(L(`Загружено записей: ${ok}`, `Recordings uploaded: ${ok}`, `التسجيلات المرفوعة: ${ok}`), { icon: "cloud" });
  };
  const replaceOne = async (n, file) => {
    if (!file) return;
    setStatus(L(`Загружаем бейт ${n}…`, `Uploading bayt ${n}…`, `جارٍ رفع البيت ${n}…`));
    try { await uploadShared(n, file, rid); toast(L(`Запись бейта ${n} обновлена`, `Bayt ${n} recording updated`, `حُدّث تسجيل البيت ${n}`), { icon: "check" }); setStatus(""); }
    catch (e) { setStatus(`${bayt(n)}: ${e?.message || L("не удалось загрузить", "upload failed", "تعذّر الرفع")}`); }
  };
  const pct = prog ? Math.round((prog.k / Math.max(1, prog.total)) * 100) : 0;
  const cur = lib.reciters.find((r) => r.id === rid);
  return html`<div class="col" style="gap:14px">
    <${Reciters} rid=${rid} setRid=${setRid} />
    ${!cur ? html`<div class="note-box">${L("Добавьте первого чтеца — затем загрузите его записи.", "Add the first reciter, then upload their recordings.", "أضف القارئ الأول ثم ارفع تسجيلاته.")}</div>` : html`
    <div class="grid g3">
      <div class="card stat"><b>${count}<span style="font-size:15px;color:var(--ink-3)"> / ${TOTAL}</span></b><span>${L("бейтов с записью", "bayts recorded", "بيتًا مسجّلًا")} · ${reciterName(cur)}</span><${Bar} pct=${(count / TOTAL) * 100} /></div>
      <div class="card stat"><b>${usage ? mb(usage.usage.bytes) : "—"}</b><span>${usage ? L(`занято из ${mb(usage.usage.maxBytes)}`, `used of ${mb(usage.usage.maxBytes)}`, `مستخدم من ${mb(usage.usage.maxBytes)}`) : L("место в хранилище", "storage space", "مساحة التخزين")}</span></div>
      <div class="card stat"><b>${TOTAL - count}</b><span>${L("без записи этого чтеца", "without this reciter’s recording", "بلا تسجيل لهذا القارئ")}</span></div>
    </div>
    <div class=${cx("dropzone", drag && "on")} onDragOver=${(e) => { e.preventDefault(); setDrag(true); }} onDragLeave=${() => setDrag(false)}
      onDrop=${(e) => { e.preventDefault(); setDrag(false); onFiles(e.dataTransfer.files); }}>
      <${Icon} name="upload" />
      <b>${L("Перетащите сюда ZIP-архив или файлы бейтов", "Drop a ZIP archive or bayt files here", "اسحب إلى هنا أرشيف ZIP أو ملفات الأبيات")}</b>
      <span class="muted">${L(`Записи чтеца «${reciterName(cur)}». Файлы сами распределятся по бейтам по номеру в имени.`, `Recordings of “${reciterName(cur)}”. Files are matched to bayts by the number in the name.`, `تسجيلات «${reciterName(cur)}». توزَّع الملفات على الأبيات حسب الرقم في الاسم.`)}</span>
      <span class="row" style="justify-content:center">
        <label class="btn sm primary"><${Icon} name="upload" />${L("Выбрать файлы или ZIP", "Choose files or ZIP", "اختر ملفات أو ZIP")}<input type="file" class="sr" multiple accept=".zip,application/zip,audio/*,.m4a,.mp3,.wav,.ogg,.webm,.flac" onChange=${(e) => { onFiles(e.currentTarget.files); e.currentTarget.value = ""; }} /></label>
        <label class="btn sm"><${Icon} name="list" />${L("Выбрать папку", "Choose a folder", "اختر مجلدًا")}<input type="file" class="sr" webkitdirectory="" multiple onChange=${(e) => { onFiles(e.currentTarget.files); e.currentTarget.value = ""; }} /></label>
      </span>
    </div>
    ${status && html`<div class="hint">${status}</div>`}
    <${Rules} />

    ${rows.length > 0 && html`<div class="card col" style="gap:10px">
      <div class="row" style="justify-content:space-between"><h3>${L("Проверьте распределение", "Check the matching", "تحقّق من التوزيع")}</h3>
        <span class="muted">${L(`${ready.length} к загрузке · ${rows.filter((r) => !r.n).length} не распознано · ${rows.filter((r) => r.dup).length} дублей`, `${ready.length} to upload · ${rows.filter((r) => !r.n).length} unrecognized · ${rows.filter((r) => r.dup).length} duplicates`, `${ready.length} للرفع · ${rows.filter((r) => !r.n).length} غير معروف · ${rows.filter((r) => r.dup).length} مكرّر`)}</span></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>${L("Файл", "File", "الملف")}</th><th>${L("Бейт", "Bayt", "البيت")}</th><th>${L("Статус", "Status", "الحالة")}</th><th>${L("Размер", "Size", "الحجم")}</th></tr></thead><tbody>
        ${rows.map((r) => html`<tr>
          <td style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" dir="auto">${r.f.name}</td>
          <td><input class="input num" type="number" min="1" max=${TOTAL} value=${r.n || ""} style="width:78px;min-height:30px;padding:3px 8px" aria-label=${L("Номер бейта для ", "Bayt number for ", "رقم البيت لـ ") + r.f.name}
            onChange=${(e) => setN(r.id, +e.currentTarget.value)} /></td>
          <td>${!r.n ? html`<span class="pill learning">${L("укажите номер", "enter a number", "أدخل الرقم")}</span>` : r.dup ? html`<span class="pill new">${L("дубль — пропущен", "duplicate — skipped", "مكرّر — تُرك")}</span>`
            : html`<span class=${cx("pill", map[r.n] ? "due" : "learned")}>${map[r.n] ? L("заменит запись", "replaces a recording", "يستبدل تسجيلًا") : L("новая запись", "new recording", "تسجيل جديد")}</span>${needsConversion(r.f) ? html` <span class="muted" style="font-size:12px">→ WebM</span>` : ""}`}</td>
          <td class="num muted">${mb(r.f.size)}</td></tr>`)}
      </tbody></table></div>
      ${!canConvert() && rows.some((r) => needsConversion(r.f)) && html`<div class="warn-box">${L("Этот браузер не умеет перекодировать MP3/WAV. Откройте админ-панель в Chrome или Edge либо загрузите файлы M4A.", "This browser cannot convert MP3/WAV. Open the admin panel in Chrome or Edge, or upload M4A files.", "هذا المتصفح لا يحوّل MP3/WAV. افتح لوحة الإدارة في Chrome أو Edge أو ارفع ملفات M4A.")}</div>`}
      <div class="row"><button class="btn primary" disabled=${!ready.length || (prog && !prog.done)} onClick=${start}><${Icon} name="cloud" />${L("Загрузить", "Upload", "رفع")} ${ready.length}</button>
        <button class="btn ghost" onClick=${() => setRows([])}>${L("Отменить", "Cancel", "إلغاء")}</button></div>
    </div>`}

    ${prog && html`<div class="card col" style="gap:8px">
      ${prog.done ? html`<b>${L(`Готово: загружено ${prog.ok} из ${prog.total}.`, `Done: ${prog.ok} of ${prog.total} uploaded.`, `تمّ: رُفع ${prog.ok} من ${prog.total}.`)}</b>` : html`<b>${L(`Загружаем ${prog.k + 1} из ${prog.total}: `, `Uploading ${prog.k + 1} of ${prog.total}: `, `جارٍ رفع ${prog.k + 1} من ${prog.total}: `)}${prog.name}</b>`}
      <${Bar} pct=${prog.done ? 100 : pct} kind="lapis" />
      ${prog.errors.length > 0 && html`<div class="warn-box col" style="gap:4px">${prog.errors.map((e) => html`<span>${bayt(e.n)} (${e.name}): ${e.msg}</span>`)}</div>`}
    </div>`}

    <div class="card col" style="gap:12px">
      <div class="row" style="justify-content:space-between"><h3>${L("Записи по бейтам", "Recordings by bayt", "التسجيلات حسب الأبيات")}</h3>
        <div class="legend"><span><i style="background:var(--ok)"></i>${L("есть запись", "recorded", "مسجّل")}</span><span><i style="background:var(--rule-2)"></i>${L("нет записи", "no recording", "بلا تسجيل")}</span></div></div>
      <div class="map109 agrid">${Array.from({ length: TOTAL }, (_, i) => i + 1).map((n) => html`<button data-s=${map[n] ? 2 : 0} class=${cx(sel === n && "due")} onClick=${() => setSel(sel === n ? null : n)} title=${map[n]?.name || L("нет записи", "no recording", "بلا تسجيل")}>${n}</button>`)}</div>
      ${sel && html`<div class="vquote" style="gap:8px">
        <div class="row" style="justify-content:space-between"><b>${bayt(sel)} · ${secName(sectionOf(sel))}</b><span class="muted" style="font-size:12.5px" dir="auto">${map[sel] ? `${map[sel].name} · ${mb(map[sel].size || 0)} · ${fmtDate(map[sel].t)}` : L("Записи нет", "No recording", "لا تسجيل")}</span></div>
        <div class="ar ar-text" lang="ar">${V[sel].a.map((a) => a.replace(/[{}]/g, "")).join("  ✦  ")}</div>
        <div class="row">
          <button class="btn sm" onClick=${() => togglePlay(sel)}><${Icon} name="play" />${L("Прослушать", "Listen", "استمع")}</button>
          <label class="btn sm"><${Icon} name="upload" />${map[sel] ? L("Заменить", "Replace", "استبدال") : L("Загрузить", "Upload", "رفع")}<input type="file" class="sr" accept="audio/*,.m4a,.mp3,.wav,.ogg,.webm" onChange=${(e) => { replaceOne(sel, e.currentTarget.files?.[0]); e.currentTarget.value = ""; }} /></label>
          ${map[sel] && html`<button class="btn sm danger" onClick=${async () => { await removeShared(sel, rid); toast(L(`Запись бейта ${sel} удалена`, `Bayt ${sel} recording deleted`, `حُذف تسجيل البيت ${sel}`), { icon: "trash" }); }}><${Icon} name="trash" />${L("Удалить", "Delete", "حذف")}</button>`}
        </div>
        <span class="hint">${L("«Прослушать» играет запись по настройке чтеца у вас в настройках.", "“Listen” plays according to the reciter chosen in your own settings.", "«استمع» يشغّل حسب القارئ المختار في إعداداتك.")}</span></div>`}
    </div>`}

    <div class="card col" style="gap:10px"><h3>${L("Обслуживание", "Maintenance", "الصيانة")}</h3>
      ${usage?.orphans?.length > 0 && html`<div class="row"><span class="grow">${L(`В хранилище ${nFile(usage.orphans.length)} без привязки к бейтам (например, после прерванной загрузки).`, `Storage holds ${nFile(usage.orphans.length)} not linked to any bayt (for example, after an interrupted upload).`, `في التخزين ${nFile(usage.orphans.length)} غير مرتبطة بأبيات (مثلًا بعد رفع متقطّع).`)}</span>
        <button class="btn sm" onClick=${async () => { await removeOrphans(usage.orphans); setUsage(await storageUsage()); toast(L("Лишние файлы удалены", "Unused files deleted", "حُذفت الملفات الزائدة"), { icon: "trash" }); }}>${L("Удалить лишние", "Delete unused", "حذف الزائد")}</button></div>`}
      ${cur && count > 0 && (confirmAll ? html`<${Confirm} danger=${true} text=${L(`Удалить все ${count} записей чтеца «${reciterName(cur)}»?`, `Delete all ${count} recordings of “${reciterName(cur)}”?`, `حذف تسجيلات «${reciterName(cur)}» كلها (${count})؟`)} yes=${L("Удалить все", "Delete all", "حذف الكل")} onYes=${async () => { setConfirmAll(false); await removeAllShared(rid); toast(L("Записи удалены", "Recordings deleted", "حُذفت التسجيلات"), { icon: "trash" }); }} onNo=${() => setConfirmAll(false)} />`
        : html`<button class="btn sm danger" style="align-self:flex-start" onClick=${() => setConfirmAll(true)}><${Icon} name="trash" />${L("Удалить все записи этого чтеца", "Delete all of this reciter’s recordings", "حذف كل تسجيلات هذا القارئ")}</button>`)}
      ${!total && !usage?.orphans?.length && html`<p class="hint">${L("Пока нечего обслуживать.", "Nothing to maintain yet.", "لا شيء للصيانة بعد.")}</p>`}
    </div>
  </div>`;
}

// ---------- тексты на трёх языках ----------
const FIELDS = ["a0", "a1", "r0", "r1", "e0", "e1", "cru", "cen", "car"];
function TextsAdmin() {
  const content = useContent();
  const [n, setN] = useState(1);
  const [packs, setPacks] = useState(null);
  useEffect(() => {
    Promise.all([import("../data/en-verses.js"), import("../data/ar-verses.js")])
      .then(([e, a]) => setPacks({ en: e.VERSES_EN, ar: a.VERSES_AR })).catch(() => setPacks({ en: {}, ar: {} }));
  }, []);
  // Исходные значения (без правок) и текущие (с правками).
  const base = (k) => { const o = original(k); return { a0: o.a[0], a1: o.a[1], r0: o.r[0], r1: o.r[1], e0: packs?.en[k]?.r?.[0] || "", e1: packs?.en[k]?.r?.[1] || "", cru: o.c, cen: packs?.en[k]?.c || "", car: packs?.ar[k]?.c || "" }; };
  const load = (k) => {
    const b = base(k), e = EDIT[k];
    if (!e) return b;
    return { a0: e.a?.[0] ?? b.a0, a1: e.a?.[1] ?? b.a1, r0: e.tr.ru?.[0] ?? b.r0, r1: e.tr.ru?.[1] ?? b.r1, e0: e.tr.en?.[0] ?? b.e0, e1: e.tr.en?.[1] ?? b.e1, cru: e.c.ru ?? b.cru, cen: e.c.en ?? b.cen, car: e.c.ar ?? b.car };
  };
  const [f, setF] = useState(() => load(1));
  const [busy, setBusy] = useState(false);
  useEffect(() => setF(load(n)), [n, content.ver, packs]);
  const edited = Object.keys(content.edits).map(Number).sort((a, b) => a - b);
  const isEdited = !!content.edits[n];
  const set = (k) => (e) => setF({ ...f, [k]: e.currentTarget.value });
  const save = async () => {
    if (!f.a0.trim() || !f.a1.trim()) return toast(L("Оба полустишия должны быть заполнены", "Both hemistichs must be filled in", "يجب ملء الشطرين"), { icon: "info" });
    const b = base(n), t = Object.fromEntries(FIELDS.map((k) => [k, (f[k] || "").trim()]));
    const diff = (keys) => keys.some((k) => t[k] !== (b[k] || "").trim());
    const body = { tr: {}, c: {} };
    if (diff(["a0", "a1"])) body.a = [t.a0, t.a1];
    if (diff(["r0", "r1"])) body.tr.ru = [t.r0, t.r1];
    if (diff(["e0", "e1"]) && t.e0 && t.e1) body.tr.en = [t.e0, t.e1];
    if (diff(["cru"]) && t.cru) body.c.ru = t.cru;
    if (diff(["cen"]) && t.cen) body.c.en = t.cen;
    if (diff(["car"]) && t.car) body.c.ar = t.car;
    const empty = !body.a && !Object.keys(body.tr).length && !Object.keys(body.c).length;
    setBusy(true);
    try {
      if (empty) { if (isEdited) await resetEdit(n); toast(L("Изменений нет", "No changes", "لا تغييرات"), { icon: "info" }); }
      else { await saveEdit(n, body); toast(L(`Бейт ${n} обновлён для всех`, `Bayt ${n} updated for everyone`, `حُدّث البيت ${n} للجميع`), { icon: "check" }); }
    } catch (e) { toast(L("Не удалось сохранить: ", "Could not save: ", "تعذّر الحفظ: ") + (e?.code || ""), { icon: "info" }); }
    setBusy(false);
  };
  const o = original(n);
  return html`<div class="grid g-main">
    <div class="card pad-lg col" style="gap:12px">
      <div class="row" style="justify-content:space-between">
        <div class="row"><button class="icon-btn sm" aria-label=${L("Предыдущий бейт", "Previous bayt", "البيت السابق")} disabled=${n <= 1} onClick=${() => setN(n - 1)}><${Icon} name="chevL" /></button>
          <label class="row" style="gap:6px">${L("Бейт", "Bayt", "البيت")} <input class="input num" type="number" min="1" max=${TOTAL} value=${n} style="width:80px" onChange=${(e) => setN(Math.max(1, Math.min(TOTAL, +e.currentTarget.value || 1)))} /></label>
          <button class="icon-btn sm" aria-label=${L("Следующий бейт", "Next bayt", "البيت التالي")} disabled=${n >= TOTAL} onClick=${() => setN(n + 1)}><${Icon} name="chevR" /></button></div>
        ${isEdited ? html`<span class="pill due">${L("изменён", "edited", "معدَّل")}</span>` : html`<span class="pill new">${L("исходный текст", "original text", "النص الأصلي")}</span>`}
      </div>
      <h4>${L("Арабский текст", "Arabic text", "النص العربي")}</h4>
      <label class="field" for="ed-a0">${L("Первое полустишие (садр)", "First hemistich (sadr)", "الصدر")}<input id="ed-a0" class="input ar ar-text" dir="rtl" lang="ar" style="font-size:22px" value=${f.a0} onInput=${set("a0")} /></label>
      <label class="field" for="ed-a1">${L("Второе полустишие (‘аджуз)", "Second hemistich (‘ajuz)", "العجز")}<input id="ed-a1" class="input ar ar-text" dir="rtl" lang="ar" style="font-size:22px" value=${f.a1} onInput=${set("a1")} /></label>
      <span class="hint">${L("Фигурные скобки { } выделяют мнемоническую фразу золотым цветом, например {قُطْبُ جَدٍ}. Если изменить число слов, пословный перевод этого полустишия скроется.", "Curly braces { } mark a mnemonic phrase in gold, e.g. {قُطْبُ جَدٍ}. If you change the number of words, the word-by-word translation of that hemistich is hidden.", "الأقواس { } تميّز العبارة الجامعة باللون الذهبي، مثل {قُطْبُ جَدٍ}. وإن تغيّر عدد الكلمات أُخفيت ترجمة كلمات ذلك الشطر.")}</span>
      <h4>${L("Перевод на русский", "Russian translation", "الترجمة الروسية")}</h4>
      <input id="ed-r0" class="input" lang="ru" dir="ltr" value=${f.r0} onInput=${set("r0")} aria-label=${L("Русский перевод, первое полустишие", "Russian, first hemistich", "الروسية، الشطر الأول")} />
      <input id="ed-r1" class="input" lang="ru" dir="ltr" value=${f.r1} onInput=${set("r1")} aria-label=${L("Русский перевод, второе полустишие", "Russian, second hemistich", "الروسية، الشطر الثاني")} />
      <h4>${L("Перевод на английский", "English translation", "الترجمة الإنجليزية")}</h4>
      <input id="ed-e0" class="input" lang="en" dir="ltr" value=${f.e0} onInput=${set("e0")} aria-label=${L("Английский перевод, первое полустишие", "English, first hemistich", "الإنجليزية، الشطر الأول")} />
      <input id="ed-e1" class="input" lang="en" dir="ltr" value=${f.e1} onInput=${set("e1")} aria-label=${L("Английский перевод, второе полустишие", "English, second hemistich", "الإنجليزية، الشطر الثاني")} />
      <h4>${L("Шарх", "Commentary", "الشرح")}</h4>
      <label class="field" for="ed-cru">Русский<textarea id="ed-cru" class="input" lang="ru" dir="ltr" rows="5" value=${f.cru} onInput=${set("cru")}></textarea></label>
      <label class="field" for="ed-cen">English<textarea id="ed-cen" class="input" lang="en" dir="ltr" rows="5" value=${f.cen} onInput=${set("cen")}></textarea></label>
      <label class="field" for="ed-car">العربية<textarea id="ed-car" class="input" lang="ar" dir="rtl" rows="5" value=${f.car} onInput=${set("car")}></textarea></label>
      <div class="row"><button class="btn primary" disabled=${busy || !packs} onClick=${save}><${Icon} name="check" />${L("Сохранить для всех", "Save for everyone", "حفظ للجميع")}</button>
        ${isEdited && html`<button class="btn" onClick=${async () => { await resetEdit(n); toast(L(`Бейт ${n}: возвращён исходный текст`, `Bayt ${n}: original text restored`, `البيت ${n}: أُعيد النص الأصلي`), { icon: "rotate" }); }}><${Icon} name="rotate" />${L("Вернуть исходный", "Restore original", "استعادة الأصل")}</button>`}
        <button class="btn ghost" onClick=${() => setF(load(n))}>${L("Отменить правки", "Discard changes", "تجاهل التعديلات")}</button></div>
    </div>
    <div class="col" style="gap:12px">
      <div class="card col" style="gap:8px"><span class="label">${L("Как увидят ученики", "What students will see", "ما سيراه الطلاب")}</span><${VerseText} n=${n} /><${Translation} n=${n} /></div>
      ${isEdited && html`<div class="card col" style="gap:6px"><span class="label">${L("Исходный вариант", "Original version", "النسخة الأصلية")}</span>
        <div class="ar" lang="ar" style="font-size:20px;line-height:1.9">${o.a.map((x) => x.replace(/[{}]/g, "")).join("  ✦  ")}</div><div class="ink2" lang="ru" dir="ltr">${o.r.join(" ")}</div></div>`}
      <div class="card col" style="gap:8px"><span class="label">${L("Изменённые бейты", "Edited bayts", "الأبيات المعدّلة")}</span>
        ${edited.length ? html`<div class="row" style="gap:6px">${edited.map((k) => html`<button class=${cx("chip", k === n && "on")} onClick=${() => setN(k)}>${k}</button>`)}</div>` : html`<p class="hint">${L("Правок пока нет.", "No edits yet.", "لا تعديلات بعد.")}</p>`}</div>
    </div>
  </div>`;
}

// ---------- объявление ----------
function NoticeAdmin() {
  const content = useContent();
  const [text, setText] = useState(content.notice?.text || "");
  const [busy, setBusy] = useState(false);
  const publish = async (t) => {
    setBusy(true);
    try { await saveNotice(t); toast(t.trim() ? L("Объявление опубликовано", "Announcement published", "نُشر الإعلان") : L("Объявление снято", "Announcement removed", "أُزيل الإعلان"), { icon: "check" }); if (!t.trim()) setText(""); }
    catch { toast(L("Не удалось сохранить", "Could not save", "تعذّر الحفظ"), { icon: "info" }); }
    setBusy(false);
  };
  return html`<div class="card pad-lg col" style="gap:12px;max-width:760px">
    <h3>${L("Объявление на главной", "Home-page announcement", "إعلان الصفحة الرئيسية")}</h3>
    <p class="hint">${L("Его увидят все ученики в начале главной страницы: расписание урока, задание на неделю, напоминание. Пишите на языке своих учеников — объявление не переводится.", "All students will see it at the top of the home page: the lesson schedule, the week’s task, a reminder. Write in your students’ language — the announcement is not translated.", "يراه جميع الطلاب أعلى الصفحة الرئيسية: موعد الدرس أو واجب الأسبوع أو تذكير. اكتبه بلغة طلابك، فالإعلان لا يُترجم.")}</p>
    <textarea class="input" id="notice-text" rows="5" dir="auto" value=${text} onInput=${(e) => setText(e.currentTarget.value)} placeholder=${L("Например: В четверг повторяем бейты 9–19 (махраджи). Выучите их до урока.", "For example: On Thursday we review bayts 9–19 (makharij). Learn them before the lesson.", "مثلًا: يوم الخميس نراجع الأبيات 9–19 (المخارج)، فاحفظوها قبل الدرس.")}></textarea>
    <div class="row"><button class="btn primary" disabled=${busy || !text.trim()} onClick=${() => publish(text)}><${Icon} name="send" />${L("Опубликовать", "Publish", "نشر")}</button>
      ${content.notice && html`<button class="btn" disabled=${busy} onClick=${() => publish("")}>${L("Снять объявление", "Remove", "إزالة الإعلان")}</button>`}
      ${content.notice && html`<span class="muted" style="font-size:12.5px">${L("Опубликовано", "Published", "نُشر")} ${fmtDate(content.notice.t)}</span>`}</div>
  </div>`;
}

// ---------- сайт и вход ----------
function SiteAdmin() {
  const auth = useAuth();
  useContent();
  const [email, setEmail] = useState(contactEmail() === CONTACT_EMAIL ? "" : contactEmail());
  const [cur, setCur] = useState(""), [login, setLogin] = useState(auth.login || ""), [p1, setP1] = useState(""), [p2, setP2] = useState("");
  const [busy, setBusy] = useState(false), [err, setErr] = useState("");
  const saveEmail = async () => {
    const v = email.trim();
    if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { toast(L("Проверьте адрес почты", "Check the email address", "تحقّق من عنوان البريد"), { icon: "info" }); return; }
    try { await saveSite({ email: v }); toast(L("Почта сохранена", "Email saved", "حُفظ البريد"), { icon: "check" }); }
    catch { toast(L("Не удалось сохранить", "Could not save", "تعذّر الحفظ"), { icon: "info" }); }
  };
  const savePass = async (e) => {
    e.preventDefault();
    setErr("");
    if (!login.trim()) return setErr(L("Введите логин.", "Enter the login.", "أدخل اسم الدخول."));
    if (p1.length < 8) return setErr(L("Новый пароль должен быть не короче 8 символов.", "The new password must be at least 8 characters.", "يجب ألّا تقلّ كلمة المرور الجديدة عن 8 أحرف."));
    if (p1 !== p2) return setErr(L("Новые пароли не совпадают.", "The new passwords do not match.", "كلمتا المرور الجديدتان غير متطابقتين."));
    setBusy(true);
    try {
      if (await changeAdmin(cur, login, p1)) { setCur(""); setP1(""); setP2(""); toast(L("Логин и пароль обновлены", "Login and password updated", "حُدّث اسم الدخول وكلمة المرور"), { icon: "check" }); }
      else setErr(L("Текущий пароль неверен.", "The current password is wrong.", "كلمة المرور الحالية غير صحيحة."));
    } catch { setErr(L("Не удалось сохранить. Попробуйте ещё раз.", "Could not save. Try again.", "تعذّر الحفظ. حاول مرة أخرى.")); }
    setBusy(false);
  };
  return html`<div class="grid g2" style="align-items:start">
    <div class="card pad-lg col" style="gap:12px">
      <h3>${L("Почта для сообщений об ошибках", "Email for error reports", "بريد الإبلاغ عن الأخطاء")}</h3>
      <p class="hint">${L("Показывается внизу каждой страницы и в окне о машинном переводе. Посетители, которые открыли сайт не в аккаунте Claude, видят адрес из файла config.js.", "Shown at the bottom of every page and in the machine-translation notice. Visitors who open the site without a Claude account see the address from config.js.", "يظهر أسفل كل صفحة وفي نافذة الترجمة الآلية. ومن يفتح الموقع دون حساب Claude يرى العنوان المكتوب في config.js.")}</p>
      <label class="field" for="site-email">${L("Адрес", "Address", "العنوان")}
        <input class="input" id="site-email" type="email" dir="ltr" value=${email} placeholder=${CONTACT_EMAIL} onInput=${(e) => setEmail(e.currentTarget.value)} /></label>
      <div class="row"><button class="btn primary" onClick=${saveEmail}><${Icon} name="check" />${L("Сохранить", "Save", "حفظ")}</button></div>
    </div>
    <form class="card pad-lg col" style="gap:12px" onSubmit=${savePass} noValidate>
      <h3>${L("Логин и пароль администратора", "Administrator login and password", "اسم دخول المشرف وكلمة مروره")}</h3>
      <p class="hint">${L("После смены пароля вход на других вкладках и устройствах сбрасывается.", "After a change, sign-ins on other tabs and devices are reset.", "بعد التغيير يُلغى الدخول في الألسنة والأجهزة الأخرى.")}</p>
      <label class="field" for="adm-cur">${L("Текущий пароль", "Current password", "كلمة المرور الحالية")}<input class="input" id="adm-cur" type="password" autocomplete="current-password" dir="ltr" value=${cur} onInput=${(e) => setCur(e.currentTarget.value)} /></label>
      <label class="field" for="adm-new-login">${L("Логин", "Login", "اسم الدخول")}<input class="input" id="adm-new-login" autocomplete="username" dir="ltr" value=${login} onInput=${(e) => setLogin(e.currentTarget.value)} /></label>
      <label class="field" for="adm-new1">${L("Новый пароль", "New password", "كلمة المرور الجديدة")}<input class="input" id="adm-new1" type="password" autocomplete="new-password" dir="ltr" value=${p1} onInput=${(e) => setP1(e.currentTarget.value)} /></label>
      <label class="field" for="adm-new2">${L("Новый пароль ещё раз", "Repeat the new password", "أعد كلمة المرور الجديدة")}<input class="input" id="adm-new2" type="password" autocomplete="new-password" dir="ltr" value=${p2} onInput=${(e) => setP2(e.currentTarget.value)} /></label>
      ${err && html`<div class="warn-box" role="alert">${err}</div>`}
      <div class="row"><button class="btn primary" type="submit" disabled=${busy || !cur}>${busy ? L("Сохраняем…", "Saving…", "جارٍ الحفظ…") : L("Сменить", "Change", "تغيير")}</button></div>
    </form>
  </div>`;
}
export { go, numberFromName };
