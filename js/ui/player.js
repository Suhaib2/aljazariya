// Мини-плеер внизу экрана и быстрый выбор чтеца и числа повторов.
// Те же параметры есть в настройках; здесь они меняются на ходу.
import { html, cx } from "../lib.js";
import { V, TOTAL, sectionOf } from "../data/index.js";
import { useSel } from "../core/store.js";
import { usePlayer, toggle, next, prev, close as closePlayer, REPEATS, setRepeat, setReciter } from "../core/audio.js";
import { lib, reciterName, reciterCount, currentReciter, useMediaLib } from "../core/media.js";
import { go, route } from "../core/nav.js";
import { L, bayt, secName } from "../core/i18n.js";
import { Icon, openPop, closePop } from "./kit.js";

const repLabel = (v) => (v ? v + "×" : "∞");

function MenuItem({ on, onPick, children, sub }) {
  return html`<button role="menuitemradio" aria-checked=${String(on)} class=${cx("lang-opt", on && "on")} onClick=${() => { onPick(); closePop(); }}>
    <span class="grow col" style="gap:0;align-items:flex-start">${children}${sub && html`<span class="menu-sub">${sub}</span>`}</span>${on && html`<${Icon} name="check" />`}</button>`;
}

// Только чтецы, добавленные администратором; отмечен выбранный (по умолчанию — первый в списке).
function ReciterMenu() {
  useSel((d) => d.s.prefs.reciter);
  const cur = currentReciter()?.id;
  return html`<div class="col" style="gap:2px" role="menu" aria-label=${L("Чтец", "Reciter", "القارئ")}>
    <div class="menu-h">${L("Чтец", "Reciter", "القارئ")}</div>
    ${lib.reciters.map((r, i) => html`<${MenuItem} on=${cur === r.id} onPick=${() => setReciter(r.id)} sub=${`${reciterCount(r.id)} / ${TOTAL}`}>${reciterName(r, i)}</${MenuItem}>`)}
  </div>`;
}

function RepeatMenu() {
  const cur = useSel((d) => d.s.prefs.repeat);
  return html`<div class="col" style="gap:2px" role="menu" aria-label=${L("Повтор бейта", "Repeat each bayt", "تكرار البيت")}>
    <div class="menu-h">${L("Сколько раз звучит бейт", "Times each bayt plays", "عدد مرات تشغيل البيت")}</div>
    <div class="rep-grid">${REPEATS.map((v) => html`<button role="menuitemradio" aria-checked=${String(cur === v)} class=${cx("chip", cur === v && "on")} onClick=${() => { setRepeat(v); closePop(); }}>${repLabel(v)}</button>`)}</div>
  </div>`;
}

// Две кнопки: чтец и повтор. Кнопку чтеца не показываем, пока записей нет; повтора нет у целой записи матна.
export function PlayerOptions({ compact, noRepeat }) {
  useMediaLib();
  useSel((d) => d.s.prefs.reciter);
  const repeat = useSel((d) => d.s.prefs.repeat);
  const name = reciterName(currentReciter());
  const tRec = L("Выбрать чтеца", "Choose the reciter", "اختيار القارئ"), tRep = L("Повтор бейта", "Repeat each bayt", "تكرار البيت");
  return html`<div class=${cx("p-opts", compact && "compact")}>
    ${lib.reciters.length > 0 && html`<button class="p-opt" title=${tRec} aria-label=${`${tRec}: ${name}`} aria-haspopup="menu"
      onClick=${(e) => openPop(e.currentTarget, () => html`<${ReciterMenu} />`, { cls: "pop-lang" })}><${Icon} name="mic" /><span class="p-opt-t">${name}</span><${Icon} name="chevD" /></button>`}
    ${!noRepeat && html`<button class="p-opt" title=${tRep} aria-label=${`${tRep}: ${repLabel(repeat)}`} aria-haspopup="menu"
      onClick=${(e) => openPop(e.currentTarget, () => html`<${RepeatMenu} />`, { cls: "pop-lang" })}><${Icon} name="repeat" /><span class="num">${repLabel(repeat)}</span></button>`}
  </div>`;
}

export function MiniPlayer() {
  const n = usePlayer((p) => p.n);
  const playing = usePlayer((p) => p.playing || p.loading);
  const prog = usePlayer((p) => (p.dur ? p.t / p.dur : 0));
  const queue = usePlayer((p) => (p.queue ? `${p.qi + 1}/${p.queue.list.length}` : ""));
  const rep = usePlayer((p) => p.rep);
  const repeat = useSel((d) => d.s.prefs.repeat);
  const missing = usePlayer((p) => p.error === "no-audio");
  const full = usePlayer((p) => !!p.full);
  useMediaLib();
  if (!n) return null;
  return html`<div class="mini" role="region" aria-label=${L("Плеер", "Player", "المشغّل")}>
    <button class="icon-btn sm" aria-label=${L("Предыдущий бейт", "Previous bayt", "البيت السابق")} onClick=${prev}><${Icon} name="prev" /></button>
    <button class="play-btn" aria-label=${playing ? L("Пауза", "Pause", "إيقاف مؤقت") : L("Играть", "Play", "تشغيل")} onClick=${() => toggle()}><${Icon} name=${playing ? "pause" : "play"} /></button>
    <button class="icon-btn sm" aria-label=${L("Следующий бейт", "Next bayt", "البيت التالي")} onClick=${next}><${Icon} name="next" /></button>
    <div class="m-info" onClick=${() => (full ? route().name !== "listen" && go("listen") : go("v" + n))} title=${full ? L("Слушать матн", "Listen to the matn", "الاستماع إلى المتن") : L("Открыть бейт", "Open bayt", "فتح البيت")}>
      <div class="m-ar" lang="ar">${V[n].a[0].replace(/[{}]/g, "")}</div>
      <div class="m-meta"><b class="num">${bayt(n)}</b><span class="hide-sm">${secName(sectionOf(n))}</span>${queue && html`<span class="num">· ${queue}</span>`}${full ? html`<span>· ${L("целая запись", "whole recording", "التسجيل الكامل")}</span>` : repeat !== 1 && playing && html`<span class="num">· ${rep + 1}${repeat ? "/" + repeat : ""}</span>`}${missing && html`<span>· ${L("записи пока нет", "no recording yet", "لا تسجيل بعد")}</span>`}</div>
    </div>
    <${PlayerOptions} compact=${true} noRepeat=${full} />
    <button class="icon-btn sm" aria-label=${L("Закрыть плеер", "Close player", "إغلاق المشغّل")} onClick=${closePlayer}><${Icon} name="x" /></button>
    <div class="m-prog"><i style=${`width:${Math.round(prog * 100)}%`}></i></div>
  </div>`;
}
