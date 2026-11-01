// Работа с арабским текстом: огласовки, нормализация, слова, поиск, сравнение.
const HARAKAT = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;
const MARK = /[ؐ-ًؚ-ٰٟۖ-ۭ]/;
const NON_JOIN_LEFT = new Set([..."اأإآٱدذرزوؤءة"]);

export const isArabic = (s) => /[؀-ۿ]/.test(s);
export const stripHarakat = (s) => s.replace(HARAKAT, "");
export const clean = (s) => s.replace(/[{}]/g, "");

// Нормализация для поиска и сравнения: без огласовок и разных форм хамзы.
export function norm(s) {
  return stripHarakat(s)
    .replace(/[{}«»()[\].,،؛:!?"'‌‍]/g, "")
    .replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه")
    .replace(/ؤ/g, "و").replace(/ئ/g, "ي").replace(/ء/g, "")
    .trim();
}

// Полустишие → слова. Фигурные скобки отмечают мнемонические фразы.
export function tokenize(line) {
  const out = [];
  let code = false;
  for (const raw of line.split(/\s+/).filter(Boolean)) {
    const segs = [];
    let buf = "";
    for (const ch of raw) {
      if (ch === "{" || ch === "}") {
        if (buf) segs.push({ t: buf, c: code });
        buf = "";
        code = ch === "{";
        continue;
      }
      buf += ch;
    }
    if (buf) segs.push({ t: buf, c: code });
    const text = segs.map((s) => s.t).join("");
    if (!text) continue;
    out.push({ text, segs, n: norm(text), code: segs.some((s) => s.c) });
  }
  return out;
}

// Разделить слово на «первую букву» (с огласовками) и остаток — для режима подсказки.
// Для слов с артиклем показываем артикль и следующую букву.
export function splitHead(word) {
  const chars = [...word];
  let bases = 0, i = 0;
  const startsAl = norm(word).startsWith("ال") && norm(word).length > 3;
  const need = startsAl ? 3 : 1;
  for (; i < chars.length; i++) {
    if (!MARK.test(chars[i])) { if (bases === need) break; bases++; }
  }
  let head = chars.slice(0, i).join(""), tail = chars.slice(i).join("");
  if (!tail) return [word, ""];
  const lastBase = [...head].reverse().find((c) => !MARK.test(c));
  if (lastBase && !NON_JOIN_LEFT.has(lastBase)) { head += "‍"; tail = "‍" + tail; }
  return [head, tail];
}

function lev(a, b) {
  if (Math.abs(a.length - b.length) > 1) return 2;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}
const same = (a, b) => a === b || (a.length > 3 && lev(a, b) <= 1);

// Выравнивание слов эталона и ответа (НОП). Возвращает операции и долю верных.
export function alignWords(refWords, hypWords) {
  const m = refWords.length, n = hypWords.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = same(refWords[i - 1].n, hypWords[j - 1]) ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  const ops = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && same(refWords[i - 1].n, hypWords[j - 1])) { ops.push({ t: "ok", w: refWords[i - 1].text }); i--; j--; }
    else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) { ops.push({ t: "extra", w: hypWords[j - 1] }); j--; }
    else { ops.push({ t: "miss", w: refWords[i - 1].text }); i--; }
  }
  ops.reverse();
  const ok = ops.filter((o) => o.t === "ok").length;
  return { ops, ok, total: m, pct: m ? Math.round((ok / m) * 100) : 0 };
}

// Детерминированный порядок скрытия слов для режима «скрыть N%».
export function hideOrder(n, count) {
  const idx = Array.from({ length: count }, (_, i) => i);
  let s = n * 7919 + 17;
  const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  return idx;
}

// Раскладка экранной арабской клавиатуры (без огласовок: проверка их не учитывает).
export const AR_KEYS = [
  ["ض", "ص", "ث", "ق", "ف", "غ", "ع", "ه", "خ", "ح", "ج"],
  ["ش", "س", "ي", "ب", "ل", "ا", "ت", "ن", "م", "ك", "ط"],
  ["ء", "ئ", "ؤ", "ر", "ى", "ة", "و", "ز", "ظ", "د", "ذ"],
  ["أ", "إ", "آ"],
];
