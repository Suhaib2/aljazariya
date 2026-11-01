// Анатомия речевого аппарата в сагиттальном разрезе (лицо смотрит влево).
// Координаты SVG: x — вперёд/назад, y — вниз. Те же точки строят 3D-модель.
import { html } from "../lib.js";
import { L } from "../core/i18n.js";

export const HEAD = [[300, 38], [372, 44], [432, 72], [480, 118], [510, 178], [522, 246], [514, 312], [492, 368], [466, 410], [458, 452], [460, 520], [466, 600], [470, 640],
  [262, 640], [258, 590], [254, 540], [249, 508], [243, 490], [228, 479], [200, 474], [168, 470], [146, 462], [128, 448], [118, 430], [119, 414], [126, 403],
  [116, 397], [108, 387], [110, 375], [118, 367], [110, 360], [104, 350], [107, 338], [116, 329], [104, 325], [92, 317], [86, 304], [90, 292], [104, 270],
  [118, 246], [128, 226], [126, 210], [120, 192], [118, 168], [126, 138], [146, 100], [184, 66], [236, 46]];
export const NASAL = [[100, 306], [112, 292], [128, 272], [150, 252], [180, 238], [222, 232], [262, 236], [292, 248], [314, 266], [322, 288], [318, 304], [304, 312],
  [276, 312], [252, 310], [214, 312], [176, 316], [146, 320], [124, 320], [108, 316]];
export const TURB = [[[196, 252], [228, 245], [262, 251]], [[178, 268], [214, 261], [256, 266], [280, 275]], [[160, 288], [200, 281], [246, 285], [282, 294]]];
export const PALATE = [[126, 320], [160, 316], [214, 312], [252, 310], [255, 320], [224, 322], [192, 326], [168, 334], [152, 344], [144, 350], [138, 344], [132, 332]];
export const VELUM = [[252, 310], [274, 312], [294, 320], [306, 334], [312, 350], [312, 362], [306, 369], [300, 362], [294, 348], [282, 336], [266, 326], [255, 320]];
export const UP_INC = [[128, 343], [140, 345], [146, 350], [143, 357], [136, 365], [130, 371.5], [126, 371], [124, 362], [125, 351]];
export const LO_INC = [[130, 366], [134, 366], [139, 372], [141, 382], [139, 390], [131, 390], [128, 380]];
export const UP_GUM = [[124, 326], [136, 321], [146, 329], [151, 341], [148, 350], [140, 346], [128, 344], [123, 338]];
export const LO_GUM = [[128, 388], [141, 386], [148, 395], [147, 410], [135, 413], [127, 403]];
export const MANDIBLE = [[132, 384], [146, 382], [156, 396], [160, 418], [158, 440], [150, 458], [138, 462], [126, 452], [122, 432], [124, 410], [128, 394]];
export const UP_LIP = [[116, 329], [107, 338], [104, 350], [110, 360], [118, 367], [124, 368], [127, 362], [127, 348], [124, 336]];
export const LO_LIP = [[118, 367], [110, 375], [108, 387], [116, 397], [126, 403], [129, 392], [129, 380], [126, 370]];
export const TONGUE_TOP = [[140, 374], [146, 365], [156, 358], [172, 353], [194, 350], [218, 349], [242, 350], [264, 353], [282, 360], [294, 371], [301, 387], [303, 404], [300, 422], [294, 438], [288, 450]];
export const TONGUE_BOT = [[140, 376], [144, 384], [152, 392], [168, 402], [190, 412], [214, 422], [238, 432], [258, 440], [272, 446], [282, 450], [288, 450]];
export const TONGUE = [...TONGUE_TOP, ...TONGUE_BOT.slice(0, -1).reverse()];
export const AIR = [[128, 370], [146, 352], [170, 336], [200, 327], [232, 322], [254, 321], [270, 328], [290, 342], [304, 358], [314, 352], [316, 336], [318, 314], [326, 300],
  [334, 318], [338, 350], [340, 390], [339, 430], [336, 462], [330, 486], [318, 504], [314, 560], [314, 640], [284, 640], [284, 560], [284, 506], [288, 494], [292, 476],
  [294, 462], [290, 452], [296, 436], [302, 404], [296, 372], [276, 360], [240, 352], [200, 352], [160, 362], [140, 374]];
export const ESO = [[318, 504], [334, 498], [339, 520], [339, 640], [318, 640]];
export const EPI = [[292, 458], [298, 444], [306, 428], [316, 414], [321, 413], [320, 420], [312, 434], [304, 450], [298, 462]];
export const THYROID = [[262, 468], [280, 462], [286, 472], [286, 506], [270, 510], [258, 500], [254, 484]];
export const EAR = [[352, 238], [372, 232], [390, 244], [394, 268], [388, 292], [376, 306], [364, 304], [360, 290], [366, 276], [366, 258], [356, 250]];
export const FLOW = [[302, 520], [304, 490], [318, 460], [322, 420], [318, 384], [304, 360], [276, 342], [236, 337], [196, 340], [158, 352], [128, 366], [96, 368], [70, 368]];
export const NOSE_FLOW = [[306, 370], [318, 330], [312, 292], [270, 270], [210, 264], [150, 276], [112, 298], [84, 316]];

// Точки опоры махраджей в боковом разрезе.
export const ANCHOR = {
  jawf: [182, 340], aqsa_halq: [304, 489], wasat_halq: [326, 430], adna_halq: [322, 375], qaf: [292, 355], kaf: [274, 344],
  wasat_lisan: [240, 338], hafa: [214, 368], lam: [158, 348], nun: [151, 350], ra: [166, 347], nitiya: [145, 352],
  safir: [137, 372], lithawiya: [129, 367], fa: [123, 372], shafatan: [110, 368], khayshum: [226, 300],
};

const r1 = (v) => Math.round(v * 10) / 10;
export function smooth(pts, closed = true) {
  const n = pts.length;
  const g = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    d += `C${r1(p1[0] + (p2[0] - p0[0]) / 6)},${r1(p1[1] + (p2[1] - p0[1]) / 6)} ${r1(p2[0] - (p3[0] - p1[0]) / 6)},${r1(p2[1] - (p3[1] - p1[1]) / 6)} ${p2[0]},${p2[1]}`;
  }
  return d + (closed ? "Z" : "");
}
const S = (pts, style, extra = {}) => html`<path d=${smooth(pts)} style=${style} ...${extra} />`;

const spine = () => {
  const out = [];
  for (let y = 300; y < 640; y += 36) out.push(html`<rect x="348" y=${y} width="44" height="30" rx="7" style="fill:var(--a-bone);stroke:var(--a-bone-line);stroke-width:1;opacity:.45" />`);
  return out;
};
const rings = () => {
  const out = [];
  for (let y = 524; y < 640; y += 18) out.push(html`<path d=${`M285,${y} Q299,${y + 4} 313,${y}`} style="fill:none;stroke:var(--a-cart);stroke-width:4;stroke-linecap:round" />`);
  return out;
};

// Боковой разрез. hover — подсвеченный орган, onOrgan — клик по органу.
export function SideSVG({ vb, onOrgan, flow, nasalFlow, dim }) {
  const hit = (id, pts, label) => html`<g class="org-g" onClick=${() => onOrgan?.(id)}>
    <path class="org-hit" d=${typeof pts === "string" ? pts : smooth(pts)}><title>${label} — ${L("нажмите, чтобы рассмотреть", "click to zoom in", "انقر للتكبير")}</title></path>
    <path class="org-hl" d=${typeof pts === "string" ? pts : smooth(pts)} /></g>`;
  const lipsD = smooth(UP_LIP) + smooth(LO_LIP);
  const teethD = smooth(UP_INC) + smooth(LO_INC);
  const throatD = smooth([[300, 330], [320, 300], [338, 330], [342, 420], [336, 470], [322, 512], [286, 512], [288, 470], [298, 420], [300, 380]]);
  const noseD = smooth(NASAL) + smooth([[128, 226], [104, 270], [86, 304], [92, 317], [118, 320]]);
  const jawfD = smooth([[150, 350], [200, 330], [254, 324], [290, 344], [300, 360], [240, 352], [190, 350], [158, 360]]);
  return html`<svg viewBox=${vb.join(" ")} preserveAspectRatio="xMidYMid meet" role="img" aria-label=${L("Речевой аппарат в разрезе, вид сбоку", "Speech organs in cross-section, side view", "أعضاء النطق في مقطع جانبي")}>
    <defs>
      <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--a-tongue)" /><stop offset="1" style="stop-color:var(--a-tongue-2)" /></linearGradient>
    </defs>
    <g style=${dim ? "opacity:.55" : ""}>
      ${S(HEAD, "fill:var(--a-skin);stroke:var(--a-skin-line);stroke-width:1.5")}
      ${S(EAR, "fill:none;stroke:var(--a-skin-line);stroke-width:1.4;opacity:.7")}
      <path d="M140 207 Q152 198 164 205 Q152 212 140 207Z" style="fill:var(--a-sheet,var(--sheet));stroke:var(--a-skin-line);stroke-width:1.2" />
      <path d="M132 190 Q150 181 172 187" style="fill:none;stroke:var(--a-skin-line);stroke-width:2;stroke-linecap:round" />
      ${spine()}
      ${S(NASAL, "fill:var(--a-air);stroke:var(--a-air-line);stroke-width:1.2")}
      ${TURB.map((t) => html`<path d=${smooth(t, false)} style="fill:none;stroke:var(--a-gum);stroke-width:7;stroke-linecap:round;opacity:.75" />`)}
      ${S(AIR, "fill:var(--a-air);stroke:var(--a-air-line);stroke-width:1.2")}
      ${S(ESO, "fill:var(--a-gum);opacity:.45")}
      ${rings()}
      ${S(THYROID, "fill:var(--a-cart);stroke:var(--a-air-line);stroke-width:1")}
      ${S(MANDIBLE, "fill:var(--a-bone);opacity:.45")}
      ${S(PALATE, "fill:var(--a-bone);stroke:var(--a-bone-line);stroke-width:1")}
      <path d=${smooth([[255, 320], [224, 322], [192, 326], [168, 334], [152, 344], [144, 350]], false)} style="fill:none;stroke:var(--a-gum);stroke-width:4;stroke-linecap:round" />
      ${S(VELUM, "fill:var(--a-gum);stroke:var(--a-tongue-2);stroke-width:1;stroke-opacity:.4")}
      <rect x="186" y="356" width="56" height="16" rx="6" style="fill:var(--a-tooth);stroke:var(--a-tooth-line);stroke-width:1;stroke-dasharray:3 3;opacity:.55" />
      ${S(TONGUE, "fill:url(#tg);stroke:var(--a-tongue-2);stroke-width:1.2")}
      <path d=${smooth([[160, 368], [200, 362], [250, 364], [282, 378]], false)} style="fill:none;stroke:var(--a-tongue-2);stroke-width:1;opacity:.35" />
      ${S(EPI, "fill:var(--a-gum);stroke:var(--a-tongue-2);stroke-width:1")}
      <path d="M286 492 L303 487 L320 490" style="fill:none;stroke:var(--a-gum);stroke-width:4;stroke-linecap:round" />
      ${S(LO_GUM, "fill:var(--a-gum)")}
      ${S(UP_GUM, "fill:var(--a-gum)")}
      ${S(LO_INC, "fill:var(--a-tooth);stroke:var(--a-tooth-line);stroke-width:1")}
      ${S(UP_INC, "fill:var(--a-tooth);stroke:var(--a-tooth-line);stroke-width:1")}
      ${S(UP_LIP, "fill:var(--a-lip)")}
      ${S(LO_LIP, "fill:var(--a-lip)")}
    </g>
    ${flow && html`<path class="flow" d=${smooth(FLOW, false)} />`}
    ${nasalFlow && html`<path class="flow" style="stroke:var(--k-nun)" d=${smooth(NOSE_FLOW, false)} />`}
    ${onOrgan && html`<g>
      ${hit("nose", noseD, L("Нос и носовая полость", "Nose and nasal cavity", "الأنف وتجويفه"))}
      ${hit("jawf", jawfD, L("Полость рта (джауф)", "Mouth cavity (jawf)", "الجوف"))}
      ${hit("throat", throatD, L("Горло", "Throat", "الحلق"))}
      ${hit("tongue", TONGUE, L("Язык", "Tongue", "اللسان"))}
      ${hit("teeth", teethD, L("Зубы и кончик языка", "Teeth and tongue tip", "الأسنان وطرف اللسان"))}
      ${hit("lips", lipsD, L("Губы", "Lips", "الشفتان"))}
    </g>`}
  </svg>`;
}

// Зубная дуга (вид сверху): центры зубов одной стороны, размеры.
const ARCH = [[124, 204, 30, 14], [131, 177, 26, 13], [147, 152, 24, 18], [173, 130, 24, 23], [203, 114, 25, 26], [244, 101, 34, 33], [289, 95, 32, 31]];
function archTeeth() {
  const out = [], L = ARCH.length;
  ARCH.forEach(([x, y, w, h], i) => {
    const nx = ARCH[Math.min(i + 1, L - 1)], px = ARCH[Math.max(i - 1, 0)];
    const a = (Math.atan2(nx[1] - px[1], nx[0] - px[0]) * 180) / Math.PI;
    for (const side of [1, -1]) {
      const yy = side > 0 ? y : 440 - y, rot = side > 0 ? a : -a;
      out.push(html`<g transform=${`translate(${x} ${yy}) rotate(${rot})`}>
        <rect x=${-w / 2} y=${-h / 2} width=${w} height=${h} rx=${i >= 5 ? 9 : 6} style="fill:var(--a-tooth);stroke:var(--a-tooth-line);stroke-width:1.2" />
        ${i >= 3 && html`<path d=${`M${-w / 4} 0 H${w / 4} M0 ${-h / 4} V${h / 4}`} style="stroke:var(--a-tooth-line);stroke-width:1;opacity:.6" />`}</g>`);
    }
  });
  return out;
}
const archLine = () => smooth([...ARCH.map(([x, y]) => [x, y]).reverse(), ...ARCH.map(([x, y]) => [x, 440 - y])], false);

// Вид сверху: язык в полости рта, вокруг — верхняя зубная дуга.
export function TopSVG() {
  const papillae = [[398, 172], [412, 187], [426, 201], [440, 213], [450, 220], [440, 227], [426, 239], [412, 253], [398, 268]];
  return html`<svg viewBox="-80 0 680 440" preserveAspectRatio="xMidYMid meet" role="img" aria-label=${L("Язык, вид сверху", "Tongue, top view", "اللسان من الأعلى")}>
    <defs>
      <linearGradient id="tgt" x1="0" y1="0" x2="1" y2="0"><stop offset=".55" style="stop-color:var(--a-tongue);stop-opacity:1" /><stop offset="1" style="stop-color:var(--a-tongue-2);stop-opacity:.35" /></linearGradient>
      <radialGradient id="mouth" cx=".45" cy=".5" r=".6"><stop offset="0" style="stop-color:var(--a-gum);stop-opacity:.55" /><stop offset="1" style="stop-color:var(--a-skin);stop-opacity:1" /></radialGradient>
    </defs>
    <path d=${smooth([[96, 220], [104, 120], [170, 56], [300, 40], [440, 52], [560, 110], [586, 220], [560, 330], [440, 388], [300, 400], [170, 384], [104, 320]])} style="fill:url(#mouth);stroke:var(--a-skin-line);stroke-width:1.2" />
    <path d=${archLine()} style="fill:none;stroke:var(--a-gum);stroke-width:44;stroke-linecap:round;stroke-linejoin:round;opacity:.9" />
    ${archTeeth()}
    <path d="M146 220 C146 198 156 176 176 162 C204 142 246 128 296 122 C348 118 410 126 452 140 C496 156 520 190 522 220 C520 250 496 284 452 300 C410 314 348 322 296 318 C246 312 204 298 176 278 C156 264 146 242 146 220Z"
      style="fill:url(#tgt);stroke:var(--a-tongue-2);stroke-width:1.5" />
    <path d="M160 220 C260 218 380 220 470 221" style="fill:none;stroke:var(--a-tongue-2);stroke-width:2;stroke-dasharray:5 6;opacity:.55" />
    ${papillae.map(([x, y]) => html`<circle cx=${x} cy=${y} r="4" style="fill:var(--a-gum);stroke:var(--a-tongue-2);stroke-width:.8" />`)}
    <path d="M150 196 C170 168 200 150 236 138" style="fill:none;stroke:var(--k-mkh);stroke-width:5;stroke-linecap:round;opacity:.35" />
    <path d="M150 244 C170 272 200 290 236 302" style="fill:none;stroke:var(--k-mkh);stroke-width:5;stroke-linecap:round;opacity:.35" />
    <path d="M236 302 C262 310 300 318 340 316" style="fill:none;stroke:var(--k-sfa);stroke-width:6;stroke-linecap:round;opacity:.45" />
  </svg>`;
}

// Вид спереди: губы, приоткрытые над верхними резцами.
export function FrontSVG() {
  return html`<svg viewBox="0 0 600 420" preserveAspectRatio="xMidYMid meet" role="img" aria-label=${L("Губы, вид спереди", "Lips, front view", "الشفتان من الأمام")}>
    <path d="M120 40 C200 20 400 20 480 40 C520 120 530 250 470 340 C420 400 180 400 130 340 C70 250 80 120 120 40Z" style="fill:var(--a-skin);stroke:var(--a-skin-line);stroke-width:1.4" />
    <path d="M250 70 C262 92 284 100 300 100 C316 100 338 92 350 70" style="fill:none;stroke:var(--a-skin-line);stroke-width:1.6;stroke-linecap:round" />
    <ellipse cx="278" cy="92" rx="10" ry="6" style="fill:var(--a-skin-line);opacity:.55" /><ellipse cx="322" cy="92" rx="10" ry="6" style="fill:var(--a-skin-line);opacity:.55" />
    <path d="M286 104 L292 150 M314 104 L308 150" style="stroke:var(--a-skin-line);stroke-width:1.2;opacity:.6" />
    <path d="M196 214 C232 222 270 228 300 228 C330 228 368 222 404 214 L404 220 C370 232 332 238 300 238 C268 238 230 232 196 220Z" style="fill:#1c1416;opacity:.85" />
    <rect x="262" y="206" width="36" height="22" rx="4" style="fill:var(--a-tooth);stroke:var(--a-tooth-line)" /><rect x="302" y="206" width="36" height="22" rx="4" style="fill:var(--a-tooth);stroke:var(--a-tooth-line)" />
    <rect x="232" y="208" width="28" height="17" rx="4" style="fill:var(--a-tooth);stroke:var(--a-tooth-line);opacity:.9" /><rect x="340" y="208" width="28" height="17" rx="4" style="fill:var(--a-tooth);stroke:var(--a-tooth-line);opacity:.9" />
    <path d="M180 206 C214 178 252 160 282 166 C292 168 296 174 300 176 C304 174 308 168 318 166 C348 160 386 178 420 206 C386 212 344 214 300 212 C256 214 214 212 180 206Z" style="fill:var(--a-lip);stroke:var(--a-skin-line);stroke-width:1.2" />
    <path d="M180 214 C214 224 256 232 300 232 C344 232 386 224 420 214 C396 262 352 290 300 290 C248 290 204 262 180 214Z" style="fill:var(--a-lip);stroke:var(--a-skin-line);stroke-width:1.2" />
    <path d="M226 252 C258 266 342 266 374 252" style="fill:none;stroke:#fff;stroke-width:3;opacity:.18;stroke-linecap:round" />
    <g transform="translate(470 330)">
      <circle r="48" style="fill:var(--sheet);stroke:var(--rule-2)" />
      <ellipse rx="26" ry="21" style="fill:var(--a-lip);stroke:var(--a-skin-line)" /><ellipse rx="10" ry="8" style="fill:#1c1416;opacity:.85" />
    </g>
  </svg>`;
}

// Виды модели: слой и окно просмотра (для бокового разреза).
export const VIEWS = {
  overview: { layer: "side", vb: [14, 34, 544, 604], ru: "Общий вид", t: ["Общий вид", "Overview", "منظر عام"] },
  throat: { layer: "side", vb: [226, 332, 172, 196], ru: "Горло", t: ["Горло", "Throat", "الحلق"] },
  tongue: { layer: "top", from: [118, 300, 210, 150], ru: "Язык — вид сверху", t: ["Язык — вид сверху", "Tongue — top view", "اللسان من الأعلى"] },
  teeth: { layer: "side", vb: [84, 314, 118, 86], ru: "Зубы и кончик языка", t: ["Зубы и кончик языка", "Teeth and tongue tip", "الأسنان وطرف اللسان"] },
  lips: { layer: "front", from: [80, 318, 70, 96], ru: "Губы — вид спереди", t: ["Губы — вид спереди", "Lips — front view", "الشفتان من الأمام"] },
  nose: { layer: "side", vb: [70, 200, 290, 140], ru: "Носовая полость", t: ["Носовая полость", "Nasal cavity", "تجويف الأنف"] },
  jawf: { layer: "side", vb: [56, 210, 330, 320], ru: "Полость (джауф)", t: ["Полость (джауф)", "Cavity (jawf)", "الجوف"] },
};

// Надписи с татвилем (мадд ـُو, ـِي) выше и ниже обычных букв — в кружках и плитке им нужен шрифт мельче.
export const TALL = /ـ/;

// Маркеры: mk — махрадж, at — где стоит кружок, to — точка опоры (линия-выноска), dir — раскладка букв.
export const MARKS = {
  overview: [
    { mk: "jawf", at: [182, 340] }, { mk: "wasat_lisan", at: [240, 337] }, { mk: "kaf", at: [276, 343] }, { mk: "qaf", at: [295, 356] }, { mk: "hafa", at: [214, 368] },
    { mk: "adna_halq", at: [322, 375] }, { mk: "wasat_halq", at: [326, 430] }, { mk: "aqsa_halq", at: [304, 489] }, { mk: "khayshum", at: [226, 300] },
    { mk: "ra", at: [62, 290], to: ANCHOR.ra }, { mk: "lam", at: [62, 314], to: ANCHOR.lam }, { mk: "nun", at: [62, 338], to: ANCHOR.nun },
    { mk: "nitiya", at: [50, 362], to: ANCHOR.nitiya }, { mk: "lithawiya", at: [50, 388], to: ANCHOR.lithawiya }, { mk: "shafatan", at: [50, 414], to: ANCHOR.shafatan },
    { mk: "fa", at: [62, 440], to: ANCHOR.fa }, { mk: "safir", at: [50, 466], to: ANCHOR.safir },
  ],
  teeth: [
    { mk: "shafatan", at: [98, 364], to: ANCHOR.shafatan }, { mk: "fa", at: [116, 386], to: ANCHOR.fa }, { mk: "lithawiya", at: [124, 358], to: [129, 367] },
    { mk: "safir", at: [140, 384], to: ANCHOR.safir }, { mk: "nitiya", at: [140, 340], to: ANCHOR.nitiya }, { mk: "nun", at: [156, 360], to: ANCHOR.nun },
    { mk: "lam", at: [166, 334], to: ANCHOR.lam }, { mk: "ra", at: [178, 352], to: ANCHOR.ra },
  ],
  throat: [{ mk: "adna_halq", at: [322, 375] }, { mk: "wasat_halq", at: [327, 431] }, { mk: "aqsa_halq", at: [304, 489] }],
  nose: [{ mk: "khayshum", at: [222, 296] }],
  jawf: [{ mk: "jawf", at: [190, 340], dir: "row" }],
  tongue: [
    { mk: "qaf", at: [452, 220] }, { mk: "kaf", at: [408, 220] }, { mk: "wasat_lisan", at: [300, 214] },
    { mk: "hafa", at: [300, 306] }, { mk: "hafa", at: [300, 134], ghost: true },
    { mk: "lam", at: [196, 156] }, { mk: "lam", at: [196, 284] },
    { mk: "ra", at: [58, 118], to: [170, 204] }, { mk: "nun", at: [52, 162], to: [158, 210] }, { mk: "nitiya", at: [46, 206], to: [151, 216] },
    { mk: "lithawiya", at: [46, 250], to: [147, 222] }, { mk: "safir", at: [46, 294], to: [150, 230] },
  ],
  lips: [{ mk: "shafatan", only: ["ba"], at: [214, 210] }, { mk: "shafatan", only: ["mim"], at: [386, 210] }, { mk: "fa", at: [300, 248] }, { mk: "shafatan", only: ["waw"], at: [470, 330] }],
};

// На узком экране вместо мелких кружков — по одной кнопке на орган.
export const HOTSPOTS = [
  { o: "nose", at: [214, 262], t: ["Нос", "Nose", "الأنف"] }, { o: "jawf", at: [196, 336], t: ["Полость", "Cavity", "الجوف"] }, { o: "tongue", at: [226, 404], t: ["Язык", "Tongue", "اللسان"] },
  { o: "throat", at: [334, 440], t: ["Горло", "Throat", "الحلق"] }, { o: "teeth", at: [58, 336], t: ["Зубы", "Teeth", "الأسنان"] }, { o: "lips", at: [58, 404], t: ["Губы", "Lips", "الشفتان"] },
];

// Подписи органов (HTML поверх рисунка, постоянного размера).
export const LABELS = {
  overview: [{ t: ["носовая полость", "nasal cavity", "تجويف الأنف"], at: [222, 222] }, { t: ["язык", "tongue", "اللسان"], at: [232, 404] }, { t: ["глотка", "pharynx", "البلعوم"], at: [356, 286] }, { t: ["гортань", "larynx", "الحنجرة"], at: [226, 506] }, { t: ["трахея", "trachea", "القصبة الهوائية"], at: [252, 590] }, { t: ["мягкое нёбо", "soft palate", "الحنك الليّن"], at: [300, 300] }],
  teeth: [{ t: ["верхний резец", "upper incisor", "الثنية العليا"], at: [118, 330] }, { t: ["нижний резец", "lower incisor", "الثنية السفلى"], at: [150, 402] }, { t: ["альвеолы (дёсны)", "alveoli (gums)", "اللثة"], at: [160, 326] }, { t: ["губы", "lips", "الشفتان"], at: [96, 394] }],
  throat: [{ t: ["язычок", "uvula", "اللهاة"], at: [322, 360] }, { t: ["надгортанник", "epiglottis", "لسان المزمار"], at: [356, 414] }, { t: ["голосовые связки", "vocal cords", "الأوتار الصوتية"], at: [362, 492] }, { t: ["корень языка", "root of the tongue", "أصل اللسان"], at: [262, 420] }],
  nose: [{ t: ["носовые раковины", "nasal conchae", "القرينات الأنفية"], at: [226, 244] }, { t: ["мягкое нёбо", "soft palate", "الحنك الليّن"], at: [290, 330] }, { t: ["ноздря", "nostril", "فتحة الأنف"], at: [86, 326] }],
  jawf: [{ t: ["воздух идёт из лёгких через горло и рот", "air flows from the lungs through the throat and mouth", "يجري الهواء من الرئتين عبر الحلق والفم"], at: [214, 300] }],
  tongue: [{ t: ["кончик", "tip", "الطرف"], at: [200, 222] }, { t: ["середина", "middle", "الوسط"], at: [300, 256] }, { t: ["задняя часть", "back", "الأقصى"], at: [440, 254] }, { t: ["левый край языка ↔ коренные зубы (ض)", "left edge of the tongue ↔ molars (ض)", "حافة اللسان اليسرى ↔ الأضراس (ض)"], at: [300, 394] }, { t: ["резцы", "incisors", "الثنايا"], at: [96, 222] }, { t: ["коренные зубы", "molars", "الأضراس"], at: [268, 52] }],
  lips: [{ t: ["смыкание губ — ب م", "lips close — ب م", "انطباق الشفتين — ب م"], at: [300, 150] }, { t: ["нижняя губа касается краёв верхних резцов — ف", "lower lip touches the edges of the upper incisors — ف", "بطن الشفة السفلى مع أطراف الثنايا العليا — ف"], at: [300, 316] }, { t: ["округление губ — و", "lip rounding — و", "ضمّ الشفتين — و"], at: [470, 400] }],
};
