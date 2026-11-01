// Карточки правил таджвида и словарь терминов.
import { html, useState, useMemo, cx } from "../lib.js";
import { RULES, RULE_CATS, RULE, GLOSSARY, TERM_KINDS, VERSES, TOK, versesForRule } from "../data/index.js";
import { norm, isArabic } from "../core/arabic.js";
import { go, route } from "../core/nav.js";
import { L, LANG, ruleL, catName, termL, kindName, bayt, nBayt } from "../core/i18n.js";
import { Icon, RichText } from "../ui/kit.js";
import { VerseQuote } from "../ui/verse.js";

export function RulesView() {
  return html`<div>
    <div class="page-head"><div><h1>${L("Правила таджвида", "Tajweed rules", "أحكام التجويد")}</h1>
      <p class="sub">${L("Карточки правил, упомянутых в поэме. Каждое правило связано с бейтами, а из бейта можно вернуться к правилу.", "Cards for the rules mentioned in the poem. Each rule is linked to its bayts, and from a bayt you can return to the rule.", "بطاقات القواعد الواردة في المنظومة. كل قاعدة مرتبطة بأبياتها، ومن البيت تعود إلى القاعدة.")}</p></div></div>
    ${RULE_CATS.map((c) => {
      const list = RULES.filter((r) => r.cat === c.id).map(ruleL);
      return html`<section style="margin-bottom:26px"><h2 style="margin:0 0 12px">${catName(c.id)}</h2>
        <div class="grid g3">${list.map((r) => {
          const vs = versesForRule(r.id);
          return html`<button class="card rule-card" onClick=${() => go("rule-" + r.id)}>
            ${LANG !== "ar" && html`<div class="r-ar" lang="ar">${r.ar}</div>`}<h3>${r.t}</h3><p class="ink2" style="font-size:14px">${r.sum}</p>
            <span class="muted" style="font-size:12.5px">${nBayt(vs.length)} · ${vs.slice(0, 6).join(", ")}${vs.length > 6 ? "…" : ""}</span></button>`;
        })}</div></section>`;
    })}
  </div>`;
}

function Block({ b }) {
  if (typeof b === "string") return html`<p><${RichText} text=${b} /></p>`;
  const [t, a, c] = b;
  if (t === "h") return html`<h4>${a}</h4>`;
  if (t === "ul") return html`<ul>${a.map((x) => html`<li><${RichText} text=${x} /></li>`)}</ul>`;
  if (t === "tbl") return html`<div class="tbl-wrap"><table class="tbl"><thead><tr>${a.map((x) => html`<th>${x}</th>`)}</tr></thead>
    <tbody>${c.map((row) => html`<tr>${row.map((x) => html`<td><${RichText} text=${x} /></td>`)}</tr>`)}</tbody></table></div>`;
  return null;
}

export function RuleView({ id }) {
  const r = ruleL(RULE[id]);
  const st = route().state || {};
  if (!r) return html`<div class="empty">${L("Правило не найдено.", "Rule not found.", "القاعدة غير موجودة.")} <button class="btn sm" onClick=${() => go("rules")}>${L("Все правила", "All rules", "كل القواعد")}</button></div>`;
  const verses = versesForRule(id);
  const same = RULES.filter((x) => x.cat === r.cat && x.id !== r.id).map(ruleL);
  return html`<div class="col" style="gap:18px">
    <div class="study-nav">
      ${st.from ? html`<button class="btn sm soft" onClick=${() => go("v" + st.from)}><${Icon} name="arrowL" />${L(`Вернуться к бейту ${st.from}`, `Back to bayt ${st.from}`, `العودة إلى البيت ${st.from}`)}</button>`
        : st.letter ? html`<button class="btn sm soft" onClick=${() => go("makharij", { letter: st.letter })}><${Icon} name="arrowL" />${L("К модели махраджей", "Back to the makharij model", "العودة إلى نموذج المخارج")}</button>`
        : html`<button class="btn sm ghost" onClick=${() => go("rules")}><${Icon} name="arrowL" />${L("Все правила", "All rules", "كل القواعد")}</button>`}
    </div>
    <div class="page-head" style="margin-top:0"><div><div class="eyebrow">${catName(r.cat)}</div><h1>${r.t}</h1>
      ${LANG !== "ar" && html`<div class="ar" style="font-size:26px;color:var(--gilt);margin-top:6px">${r.ar}</div>`}<p class="sub">${r.sum}</p></div></div>
    <div class="grid g-main">
      <div class="card pad-lg rule-body">${r.body.map((b) => html`<${Block} b=${b} />`)}
        ${r.ex?.length > 0 && html`<h4>${L("Примеры", "Examples", "أمثلة")}</h4><div class="words">${r.ex.map(([ar, note]) => html`<div class="word"><span class="ar ar-text" lang="ar">${ar}</span><span>${note}</span></div>`)}</div>`}
      </div>
      <div class="col" style="gap:10px">
        <h3>${L("Бейты, где упомянуто правило", "Bayts that mention this rule", "الأبيات التي ذُكرت فيها القاعدة")}</h3>
        ${verses.map((n) => html`<${VerseQuote} n=${n} showTr=${verses.length <= 8} />`)}
        ${same.length > 0 && html`<h3 style="margin-top:10px">${L("Смежные правила", "Related rules", "قواعد قريبة")}</h3><div class="row" style="gap:6px">${same.map((x) => html`<button class="chip" onClick=${() => go("rule-" + x.id, st)}>${x.t}</button>`)}</div>`}
      </div>
    </div>
  </div>`;
}

export function DictView() {
  const st = route().state || {};
  const initial = st.q ? GLOSSARY.find((t) => t.id === st.q) : null;
  const [q, setQ] = useState(initial ? (LANG === "ar" ? initial.ar : termL(initial).tr) : "");
  const [kind, setKind] = useState("all");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase().replace(/ё/g, "е");
    const a = isArabic(s) ? norm(s) : null;
    return GLOSSARY.map(termL).filter((t) => (kind === "all" || t.k === kind) && (!s || (a ? norm(t.ar).includes(a) || norm(t.def).includes(a)
      : [t.tr, t.m, t.def, t.ru].join(" ").toLowerCase().replace(/ё/g, "е").includes(s))));
  }, [q, kind]);
  return html`<div>
    <div class="page-head"><div><h1>${L("Словарь терминов", "Glossary of terms", "معجم المصطلحات")}</h1>
      <p class="sub">${L(`${GLOSSARY.length} терминов таджвида с переводом и определением. В тексте матна они подчёркнуты пунктиром.`, `${GLOSSARY.length} tajweed terms with a translation and a definition. In the text of the matn they are underlined with dots.`, `${GLOSSARY.length} مصطلحًا من مصطلحات التجويد مع تعريفها. وهي مسطّرة بخطّ منقّط في نصّ المتن.`)}</p></div></div>
    <div class="row" style="margin-bottom:12px"><input class="input" id="dict-q" style="max-width:340px" dir="auto"
      placeholder=${L("Поиск: «итбак», «мадд», «إخفاء»…", "Search: “itbaq”, “madd”, “إخفاء”…", "ابحث: «الإخفاء»، «المد»…")} value=${q} onInput=${(e) => setQ(e.currentTarget.value)} />
      <div class="row" style="gap:6px"><button class=${cx("chip", kind === "all" && "on")} onClick=${() => setKind("all")}>${L("Все", "All", "الكل")}</button>
        ${Object.keys(TERM_KINDS).map((k) => html`<button class=${cx("chip", kind === k && "on")} onClick=${() => setKind(k)}>${kindName(k)}</button>`)}</div></div>
    <div class="card" style="padding:4px 18px">
      ${list.length ? list.map((t) => html`<div class=${"dict-item k-" + t.k} id=${"t-" + t.id}>
        <div class="ar" lang="ar">${t.ar}</div>
        <div class="col" style="gap:4px"><div class="row" style="gap:8px">${t.tr && html`<b style="font-size:16px">${t.tr}</b>`}<span class="muted">${t.tr ? "— " : ""}${t.m}</span><span class="pill" style=${"background:var(--sheet-2);color:var(--k)"}>${kindName(t.k)}</span></div>
          <p class="ink2" style="line-height:1.6"><${RichText} text=${t.def} /></p>
          <div class="row" style="gap:6px">${t.rule && html`<button class="btn sm soft" onClick=${() => go("rule-" + t.rule)}><${Icon} name="scroll" />${ruleL(RULE[t.rule])?.t}</button>`}
            ${versesForTerm(t).slice(0, 8).map((n) => html`<button class="chip" onClick=${() => go("v" + n)}>${bayt(n)}</button>`)}</div></div>
      </div>`) : html`<div class="empty" style="margin:14px 0">${L("Ничего не найдено. Попробуйте другое написание.", "Nothing found. Try another spelling.", "لا نتائج. جرّب كتابة أخرى.")}</div>`}
    </div>
  </div>`;
}

function versesForTerm(t) {
  const forms = new Set(t.f.map(norm));
  return VERSES.filter((v) => (!t.v || t.v.includes(v.n)) && TOK[v.n].some((l) => l.some((w) => forms.has(w.n)))).map((v) => v.n);
}
