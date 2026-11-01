// «Слушать весь матн подряд»: выбор раздела и плеер с крупным текстом.
// Чтец и повторы меняются прямо здесь, пауза, скорость и показ текста — в настройках.
import { html, useState, cx, range } from "../lib.js";
import { V, TOTAL, SECTIONS, SECTION, sectionVerses } from "../data/index.js";
import { useSel } from "../core/store.js";
import { usePlayer, playQueue, toggle, next, prev, stop } from "../core/audio.js";
import { go } from "../core/nav.js";
import { L, bayt, nBayt, secName } from "../core/i18n.js";
import { Icon } from "../ui/kit.js";
import { VerseText, Translation, displayOf } from "../ui/verse.js";
import { PlayerOptions } from "../ui/player.js";

export function ListenView() {
  const prefs = useSel((d) => d.s.prefs);
  const [scope, setScope] = useState("all");
  const cur = usePlayer((p) => p.n);
  const playing = usePlayer((p) => p.playing || p.loading);
  const inQueue = usePlayer((p) => !!p.queue);
  const qi = usePlayer((p) => p.qi);
  const qlen = usePlayer((p) => p.queue?.list.length || 0);
  const listOf = (id) => (id === "all" ? range(1, TOTAL) : sectionVerses(SECTION[id]));
  const list = listOf(scope);
  const startAt = (k = 0, l = list) => playQueue(l, { start: k });
  const playScope = (id) => { setScope(id); startAt(0, listOf(id)); };
  const show = displayOf(prefs);
  const scopes = [{ id: "all", name: L("Весь матн", "The whole matn", "المتن كاملًا"), from: 1, to: TOTAL }, ...SECTIONS.map((s) => ({ id: s.id, name: secName(s), from: s.from, to: s.to }))];
  return html`<div>
    <div class="page-head"><div><h1>${L("Слушать матн", "Listen to the matn", "الاستماع إلى المتن")}</h1></div></div>
    <div class="grid g-main">
      <div class="card pad-lg col" style="gap:16px">
        ${cur && inQueue ? html`
          <div class="row" style="justify-content:space-between"><div><div class="eyebrow">${bayt(cur)}</div><span class="muted num" dir="ltr">${qi + 1} / ${qlen}</span></div>
            <button class="btn sm ghost" onClick=${() => go("v" + cur)}>${L("Открыть бейт", "Open bayt", "فتح البيت")}<${Icon} name="chevR" /></button></div>
          ${prefs.listenText ? html`${show.ar && html`<${VerseText} n=${cur} big=${1.25} />`}${show.tr && html`<${Translation} n=${cur} />`}` : html`<${VerseText} n=${cur} blind=${true} />`}
          <div class="row" style="justify-content:center;gap:14px">
            <button class="icon-btn" aria-label=${L("Предыдущий", "Previous", "السابق")} onClick=${prev}><${Icon} name="prev" /></button>
            <button class="play-btn" style="width:56px;height:56px" aria-label=${playing ? L("Пауза", "Pause", "إيقاف مؤقت") : L("Играть", "Play", "تشغيل")} onClick=${() => toggle()}><${Icon} name=${playing ? "pause" : "play"} /></button>
            <button class="icon-btn" aria-label=${L("Следующий", "Next", "التالي")} onClick=${next}><${Icon} name="next" /></button>
            <button class="icon-btn" aria-label=${L("Остановить", "Stop", "إيقاف")} onClick=${stop}><${Icon} name="stop" /></button></div>`
        : html`<div class="col" style="gap:10px;align-items:flex-start"><h3>${scopes.find((s) => s.id === scope).name} · ${nBayt(list.length)}</h3>
            <button class="btn primary lg" onClick=${() => startAt(0)}><${Icon} name="headphones" />${L("Слушать", "Listen", "استمع")}</button></div>`}
        <div class="row" style="justify-content:space-between;gap:8px"><${PlayerOptions} />
          <button class="btn sm ghost" onClick=${() => go("options", { section: "audio" })}><${Icon} name="gear" />${L("Пауза и скорость", "Pause and speed", "الفاصل والسرعة")}</button></div>
      </div>
      <div class="card col listen-scopes" style="gap:2px">
        ${scopes.map((s) => html`<button class=${cx("scope-row", scope === s.id && "on")} onClick=${() => playScope(s.id)}>
          <span class="num muted rng">${s.from}–${s.to}</span><span class="grow">${s.name}</span><${Icon} name="play" /></button>`)}
      </div>
    </div>
    <div class="card" style="margin-top:16px;padding:8px">
      <div class="hist">${list.map((n, k) => html`<div class="h-row" style=${cur === n && inQueue ? "background:var(--lapis-soft);border-radius:10px;padding-inline-start:8px" : ""}>
        <span class="num" style="width:34px;color:var(--gilt);font-weight:700">${n}</span>
        <span class="ar grow" lang="ar" style="font-size:19px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${V[n].a[0].replace(/[{}]/g, "")}</span>
        <button class="icon-btn sm" aria-label=${L(`Слушать с бейта ${n}`, `Listen from bayt ${n}`, `استمع من البيت ${n}`)} onClick=${() => startAt(k)}><${Icon} name="play" /></button></div>`)}</div>
    </div>
  </div>`;
}
