// Быстрые переключатели в верхней панели: язык сайта и светлая/тёмная тема.
// При смене языка перевод возвращается в режим «авто»: арабский — без перевода,
// русский и английский — с переводом на этом языке. Изменить это можно в настройках.
import { html, cx, useState, useEffect } from "../lib.js";
import { act, useSel } from "../core/store.js";
import { LANGS, LANG, L } from "../core/i18n.js";
import { Icon, openPop, closePop } from "./kit.js";

export function setUiLang(id) {
  closePop();
  if (id !== LANG) act.setPrefs({ uiLang: id, trLang: "auto" });
}

function LangMenu() {
  return html`<div class="col lang-menu" style="gap:4px" role="menu">
    ${LANGS.map((l) => html`<button role="menuitemradio" aria-checked=${String(l.id === LANG)} class=${cx("lang-opt", l.id === LANG && "on")}
      lang=${l.id} onClick=${() => setUiLang(l.id)}><span class="lang-code">${l.code}</span><span class="grow">${l.name}</span>${l.id === LANG && html`<${Icon} name="check" />`}</button>`)}
  </div>`;
}

export function LangButton() {
  const cur = LANGS.find((l) => l.id === LANG) || LANGS[0];
  const label = L("Язык сайта", "Site language", "لغة الموقع");
  return html`<button class="btn sm ghost lang-btn" title=${label} aria-label=${label} aria-haspopup="menu"
    onClick=${(e) => openPop(e.currentTarget, () => html`<${LangMenu} />`, { cls: "pop-lang" })}>
    <${Icon} name="globe" /><span class="lang-code">${cur.code}</span></button>`;
}

// Светлая или тёмная тема одним нажатием; вариант «Как в системе» — в настройках.
const darkMq = () => matchMedia("(prefers-color-scheme: dark)");
export function ThemeButton() {
  const theme = useSel((d) => d.s.prefs.theme);
  const [, bump] = useState(0);
  useEffect(() => {
    const mq = darkMq(), fn = () => bump((x) => x + 1);
    mq.addEventListener?.("change", fn);
    return () => mq.removeEventListener?.("change", fn);
  }, []);
  const dark = theme === "dark" || (theme !== "light" && darkMq().matches);
  const label = dark ? L("Включить светлую тему", "Switch to the light theme", "التبديل إلى السمة الفاتحة") : L("Включить тёмную тему", "Switch to the dark theme", "التبديل إلى السمة الداكنة");
  return html`<button class="icon-btn" title=${label} aria-label=${label} onClick=${() => act.setPref("theme", dark ? "light" : "dark")}><${Icon} name=${dark ? "sun" : "moon"} /></button>`;
}
