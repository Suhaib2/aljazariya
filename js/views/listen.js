// «Слушать весь матн»: целая запись чтеца одним файлом, без перехода к бейтам. Бейт, который звучит,
// подсвечивается в списке; разделы и кнопки бейтов перематывают ту же запись. Если целой записи нет
// ни у одного чтеца, звучат записи бейтов подряд. Чтец меняется здесь, скорость и показ текста — в настройках.
import { html, useState, useEffect, cx, range } from "../lib.js";
import { V, TOTAL, SECTIONS, SECTION, sectionOf, sectionVerses } from "../data/index.js";
import { useSel } from "../core/store.js";
import { usePlayer, playQueue, playFull, seekTime, toggle, next, prev, stop } from "../core/audio.js";
import { fullFor, useMediaLib } from "../core/media.js";
import { go } from "../core/nav.js";
import { L, bayt, nBayt, secName } from "../core/i18n.js";
import { Icon } from "../ui/kit.js";
import { PlayerOptions } from "../ui/player.js";

const clock = (s) => { s = Math.max(0, Math.round(s || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

export function ListenView() {
  useMediaLib();
  const prefs = useSel((d) => d.s.prefs);
  const [scope, setScope] = useState("all");
  const cur = usePlayer((p) => p.n);
  const playing = usePlayer((p) => p.playing || p.loading);
  const full = usePlayer((p) => p.full);
  const inQueue = usePlayer((p) => !!p.queue);
  const qi = usePlayer((p) => p.qi);
  const qlen = usePlayer((p) => p.queue?.list.length || 0);
  const sec = usePlayer((p) => (p.full ? Math.floor(p.t) : 0));
  const dur = usePlayer((p) => p.dur);
  const failed = usePlayer((p) => p.error === "file");
  const src = fullFor();
  const active = !!cur && (!!full || inQueue);
  const scopes = [{ id: "all", name: L("Весь матн", "The whole matn", "المتن كاملًا"), from: 1, to: TOTAL }, ...SECTIONS.map((s) => ({ id: s.id, name: secName(s), from: s.from, to: s.to }))];
  const sc = scopes.find((s) => s.id === scope);
  const list = scope === "all" ? range(1, TOTAL) : sectionVerses(SECTION[scope]);
  const start = (s, at = s.from) => (src ? playFull({ from: s.from, to: s.to, at }) : playQueue(range(s.from, s.to), { start: at - s.from }));
  const pick = (s) => { setScope(s.id); start(s); };
  const len = src ? (sc.to < TOTAL ? src.marks[sc.to] : src.dur) - (sc.from === 1 ? 0 : src.marks[sc.from - 1]) : 0;
  const rs = full?.rs || 0, re = full ? full.re ?? dur : 0;

  // Список следует за чтецом, только когда человек смотрит на него: предыдущий бейт был на экране.
  useEffect(() => {
    if (!active || !playing || !prefs.follow) return;
    const row = document.getElementById("ls-" + cur), before = document.getElementById("ls-" + (cur - 1));
    if (!row || !before) return;
    const bottom = document.querySelector(".mini")?.getBoundingClientRect().top ?? innerHeight;
    const b = before.getBoundingClientRect(), r = row.getBoundingClientRect();
    if (b.bottom > 64 && b.top < bottom && (r.bottom > bottom - 8 || r.top < 64)) row.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [cur]);

  return html`<div>
    <div class="page-head"><div><h1>${L("Слушать матн", "Listen to the matn", "الاستماع إلى المتن")}</h1></div></div>
    <div class="grid g-main">
      <div class="card pad-lg col" style="gap:16px">
        ${active ? html`
          <div class="row" style="justify-content:space-between;align-items:flex-start;gap:12px">
            <div><div class="eyebrow">${bayt(cur)}</div><span class="muted">${secName(sectionOf(cur))}</span></div>
            <span class="num muted" dir="ltr">${full ? `${clock(sec - rs)} / ${clock(re - rs)}` : `${qi + 1} / ${qlen}`}</span></div>
          ${full && html`<input type="range" min=${rs} max=${Math.max(rs + 1, Math.floor(re))} step="1" value=${sec} onInput=${(e) => seekTime(+e.currentTarget.value)} aria-label=${L("Перемотка", "Seek", "التقديم والتأخير")} />`}
          <div class="row" style="justify-content:center;gap:14px">
            <button class="icon-btn" aria-label=${L("Предыдущий бейт", "Previous bayt", "البيت السابق")} onClick=${prev}><${Icon} name="prev" /></button>
            <button class="play-btn" style="width:56px;height:56px" aria-label=${playing ? L("Пауза", "Pause", "إيقاف مؤقت") : L("Играть", "Play", "تشغيل")} onClick=${() => toggle()}><${Icon} name=${playing ? "pause" : "play"} /></button>
            <button class="icon-btn" aria-label=${L("Следующий бейт", "Next bayt", "البيت التالي")} onClick=${next}><${Icon} name="next" /></button>
            <button class="icon-btn" aria-label=${L("Остановить", "Stop", "إيقاف")} onClick=${stop}><${Icon} name="stop" /></button></div>`
        : html`<div class="col" style="gap:10px;align-items:flex-start"><h3>${sc.name} · ${nBayt(list.length)}</h3>
            ${src && html`<span class="muted">${L("Целая запись", "Whole recording", "التسجيل الكامل")} · ${src.reciter} · <span class="num">${clock(len)}</span></span>`}
            <button class="btn primary lg" onClick=${() => start(sc)}><${Icon} name="headphones" />${L("Слушать", "Listen", "استمع")}</button></div>`}
        ${failed && html`<div class="warn-box">${L("Не удалось загрузить запись. Проверьте соединение и нажмите «Играть» ещё раз.", "The recording could not be loaded. Check the connection and press Play again.", "تعذّر تحميل التسجيل. تحقّق من الاتصال واضغط «تشغيل» مرة أخرى.")}</div>`}
        <div class="row" style="justify-content:space-between;gap:8px"><${PlayerOptions} noRepeat=${!!src} />
          <button class="btn sm ghost" onClick=${() => go("options", { section: "audio" })}><${Icon} name="gear" />${src ? L("Скорость", "Speed", "السرعة") : L("Пауза и скорость", "Pause and speed", "الفاصل والسرعة")}</button></div>
      </div>
      <div class="card col listen-scopes" style="gap:2px">
        ${scopes.map((s) => html`<button class=${cx("scope-row", scope === s.id && "on")} onClick=${() => pick(s)}>
          <span class="num muted rng">${s.from}–${s.to}</span><span class="grow">${s.name}</span><${Icon} name="play" /></button>`)}
      </div>
    </div>
    <div class="card" style="margin-top:16px;padding:8px">
      <div class="hist">${list.map((n) => html`<div class="h-row" id=${"ls-" + n} style=${cur === n && active ? "background:var(--lapis-soft);border-radius:10px;padding-inline-start:8px" : ""}>
        <span class="num" style="width:34px;color:var(--gilt);font-weight:700">${n}</span>
        ${prefs.listenText ? html`<span class="ar grow" lang="ar" style="font-size:19px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${V[n].a[0].replace(/[{}]/g, "")}</span>` : html`<span class="grow muted">${bayt(n)}</span>`}
        <button class="icon-btn sm" aria-label=${L(`Слушать с бейта ${n}`, `Listen from bayt ${n}`, `استمع من البيت ${n}`)} onClick=${() => start(sc, n)}><${Icon} name="play" /></button></div>`)}</div>
    </div>
  </div>`;
}
