// 17 махраджей по Ибн аль-Джазари, сифаты и буквы.
// organ — орган, к которому относится махрадж на модели головы.
export const ORGANS = {
  jawf:   { ru: "Полость (джауф)", ar: "الجَوْف" },
  throat: { ru: "Горло", ar: "الحَلْق" },
  tongue: { ru: "Язык", ar: "اللِّسَان" },
  teeth:  { ru: "Зубы и кончик языка", ar: "الأَسْنَان" },
  lips:   { ru: "Губы", ar: "الشَّفَتَان" },
  nose:   { ru: "Нос (хайшум)", ar: "الخَيْشُوم" },
};

export const MAKHARIJ = [
  { id: "jawf",        organ: "jawf",   v: [10],     ar: "الجَوْف", ru: "Полость рта и горла", desc: "Нет точки опоры: звук тянется, пока идёт воздух. Буквы мадда.", letters: ["alif", "waw_m", "ya_m"] },
  { id: "aqsa_halq",   organ: "throat", v: [11],     ar: "أَقْصَى الحَلْق", ru: "Глубина горла", desc: "Самая дальняя от губ часть горла, у голосовых связок.", letters: ["hamza", "ha2"] },
  { id: "wasat_halq",  organ: "throat", v: [11],     ar: "وَسَطُ الحَلْق", ru: "Середина горла", desc: "Область надгортанника.", letters: ["ain", "ha"] },
  { id: "adna_halq",   organ: "throat", v: [12],     ar: "أَدْنَى الحَلْق", ru: "Ближняя часть горла", desc: "Ближе всего ко рту, у корня языка.", letters: ["ghain", "kha"] },
  { id: "qaf",         organ: "tongue", v: [12],     ar: "أَقْصَى اللِّسَانِ فَوْق", ru: "Задняя часть языка с мягким нёбом", desc: "Глубже и выше махраджа кяфа.", letters: ["qaf"] },
  { id: "kaf",         organ: "tongue", v: [12, 13], ar: "أَقْصَى اللِّسَانِ أَسْفَل", ru: "Задняя часть языка, чуть ближе ко рту", desc: "Чуть ниже и ближе ко рту, чем къаф.", letters: ["kaf"] },
  { id: "wasat_lisan", organ: "tongue", v: [13],     ar: "وَسَطُ اللِّسَان", ru: "Середина языка с твёрдым нёбом", desc: "Середина спинки языка поднимается к твёрдому нёбу.", letters: ["jim", "shin", "ya"] },
  { id: "hafa",        organ: "tongue", v: [13, 14], ar: "حَافَّةُ اللِّسَان", ru: "Край языка с верхними коренными зубами", desc: "Слева (чаще), справа или обеими сторонами.", letters: ["dad"] },
  { id: "lam",         organ: "tongue", v: [14],     ar: "أَدْنَى الحَافَّتَيْنِ إِلَى الطَّرَف", ru: "Передняя часть краёв языка до кончика", desc: "Вместе с дёснами верхних передних зубов.", letters: ["lam"] },
  { id: "nun",         organ: "tongue", v: [15],     ar: "طَرَفُ اللِّسَانِ تَحْتَ اللَّام", ru: "Кончик языка, чуть ниже ляма", desc: "Кончик языка с дёснами верхних резцов.", letters: ["nun"] },
  { id: "ra",          organ: "tongue", v: [15],     ar: "طَرَفُ اللِّسَانِ مَعَ ظَهْرِه", ru: "Кончик языка ближе к спинке", desc: "Чуть глубже махраджа нуна.", letters: ["ra"] },
  { id: "nitiya",      organ: "teeth",  v: [16],     ar: "طَرَفُ اللِّسَانِ مَعَ أُصُولِ الثَّنَايَا العُلْيَا", ru: "Кончик языка и корни верхних резцов", desc: "Кончик языка касается дёсен двух верхних передних резцов.", letters: ["ta2", "dal", "ta"] },
  { id: "safir",       organ: "teeth",  v: [16, 17], ar: "طَرَفُ اللِّسَانِ مَعَ الثَّنَايَا السُّفْلَى", ru: "Кончик языка над нижними резцами", desc: "С небольшим зазором, через который проходит свист.", letters: ["sad", "zay", "sin"] },
  { id: "lithawiya",   organ: "teeth",  v: [17, 18], ar: "طَرَفُ اللِّسَانِ مَعَ أَطْرَافِ الثَّنَايَا العُلْيَا", ru: "Кончик языка и края верхних резцов", desc: "Межзубные буквы: кончик языка чуть выходит к краям резцов.", letters: ["zha", "dhal", "tha"] },
  { id: "fa",          organ: "lips",   v: [18],     ar: "بَطْنُ الشَّفَةِ السُّفْلَى مَعَ أَطْرَافِ الثَّنَايَا العُلْيَا", ru: "Нижняя губа и края верхних резцов", desc: "Внутренняя сторона нижней губы касается краёв верхних резцов.", letters: ["fa"] },
  { id: "shafatan",    organ: "lips",   v: [19],     ar: "الشَّفَتَان", ru: "Обе губы", desc: "ب и م — смыканием губ, و — их округлением.", letters: ["waw", "ba", "mim"] },
  { id: "khayshum",    organ: "nose",   v: [19],     ar: "الخَيْشُوم", ru: "Носовая полость", desc: "Махрадж гунны нуна и мима.", letters: ["ghunna"] },
];

export const SIFAT = {
  jahr:      { ar: "الجَهْر",      ru: "Джахр",     short: "звонкость",        v: 20, rule: "hams" },
  hams:      { ar: "الهَمْس",      ru: "Хамс",      short: "глухость",         v: 21, rule: "hams" },
  shidda:    { ar: "الشِّدَّة",     ru: "Шидда",     short: "твёрдость",        v: 21, rule: "shidda" },
  tawassut:  { ar: "التَّوَسُّط",   ru: "Тавассут",  short: "промежуточность",  v: 22, rule: "shidda" },
  rikhwa:    { ar: "الرَّخَاوَة",   ru: "Рихва",     short: "рыхлость",         v: 20, rule: "shidda" },
  istila:    { ar: "الاسْتِعْلَاء", ru: "Исти‘ля",   short: "возвышение",       v: 22, rule: "istila" },
  istifal:   { ar: "الاسْتِفَال",  ru: "Истифаль",  short: "опущение",         v: 20, rule: "istila" },
  itbaq:     { ar: "الإِطْبَاق",    ru: "Итбак",     short: "прикрытие",        v: 23, rule: "itbaq" },
  infitah:   { ar: "الانْفِتَاح",   ru: "Инфитах",   short: "раскрытость",      v: 20, rule: "itbaq" },
  idhlaq:    { ar: "الإِذْلَاق",    ru: "Излак",     short: "лёгкость",         v: 23, rule: "idhlaq" },
  ismat:     { ar: "الإِصْمَات",    ru: "Исмат",     short: "закрытость",       v: 20, rule: "idhlaq" },
  safir:     { ar: "الصَّفِير",     ru: "Сафир",     short: "свист",            v: 24, rule: "safir" },
  qalqala:   { ar: "القَلْقَلَة",   ru: "Калькаля",  short: "встряска",         v: 24, rule: "qalqala" },
  leen:      { ar: "اللِّين",       ru: "Лин",       short: "мягкость",         v: 25, rule: "leen" },
  inhiraf:   { ar: "الانْحِرَاف",   ru: "Инхираф",   short: "отклонение",       v: 26, rule: "inhiraf" },
  takrir:    { ar: "التَّكْرِير",   ru: "Такрир",    short: "повторение",       v: 26, rule: "inhiraf" },
  tafashshi: { ar: "التَّفَشِّي",   ru: "Тафашши",   short: "растекание",       v: 26, rule: "tafashshi" },
  istitala:  { ar: "الاسْتِطَالَة", ru: "Иститаля",  short: "растяжение",       v: 26, rule: "tafashshi" },
  ghunna:    { ar: "الغُنَّة",      ru: "Гунна",     short: "носовой звук",     v: 19, rule: "ghunna" },
};

// Порядок «отличительности»: по первому найденному сифату выбирается бейт,
// который показывается рядом с бейтом о махрадже.
export const SIFA_PRIORITY = ["istitala", "tafashshi", "takrir", "inhiraf", "safir", "qalqala", "itbaq", "istila", "leen", "tawassut", "shidda", "hams", "idhlaq"];

const B = ["jahr", "rikhwa", "istifal", "infitah", "ismat"]; // «базовый» набор сифатов из бейта 20

export const LETTERS = [
  { k: "alif",  ch: "ا", name: "алиф",  ar: "أَلِف", mk: "jawf", madd: true, sf: B, note: "Всегда буква мадда; толстый или тонкий — по предыдущей букве (бейт 34)." },
  { k: "waw_m", ch: "و", disp: "ـُو", name: "вав мадда", ar: "وَاو المَدّ", mk: "jawf", madd: true, sf: B, note: "Вав с сукуном после даммы: «يَقُولُ»." },
  { k: "ya_m",  ch: "ي", disp: "ـِي", name: "йа мадда", ar: "يَاء المَدّ", mk: "jawf", madd: true, sf: B, note: "Йа с сукуном после касры: «قِيلَ»." },
  { k: "hamza", ch: "ء", name: "хамза", ar: "هَمْزَة", mk: "aqsa_halq", sf: ["jahr", "shidda", "istifal", "infitah", "ismat"] },
  { k: "ha2",   ch: "ه", name: "ха",    ar: "هَاء",  mk: "aqsa_halq", sf: ["hams", "rikhwa", "istifal", "infitah", "ismat"], note: "Слабая буква: её легко «потерять» (бейт 61)." },
  { k: "ain",   ch: "ع", name: "‘айн",  ar: "عَيْن", mk: "wasat_halq", sf: ["jahr", "tawassut", "istifal", "infitah", "ismat"] },
  { k: "ha",    ch: "ح", name: "ха",    ar: "حَاء",  mk: "wasat_halq", sf: ["hams", "rikhwa", "istifal", "infitah", "ismat"], note: "Рядом с буквами исти‘ля её легко утолщить (бейт 40)." },
  { k: "ghain", ch: "غ", name: "гайн",  ar: "غَيْن", mk: "adna_halq", sf: ["jahr", "rikhwa", "istila", "infitah", "ismat"] },
  { k: "kha",   ch: "خ", name: "хо",    ar: "خَاء",  mk: "adna_halq", sf: ["hams", "rikhwa", "istila", "infitah", "ismat"] },
  { k: "qaf",   ch: "ق", name: "къаф",  ar: "قَاف",  mk: "qaf", sf: ["jahr", "shidda", "istila", "infitah", "ismat", "qalqala"] },
  { k: "kaf",   ch: "ك", name: "кяф",   ar: "كَاف",  mk: "kaf", sf: ["hams", "shidda", "istifal", "infitah", "ismat"] },
  { k: "jim",   ch: "ج", name: "джим",  ar: "جِيم",  mk: "wasat_lisan", sf: ["jahr", "shidda", "istifal", "infitah", "ismat", "qalqala"], note: "Не превращайте в мягкое «ж» (бейт 38)." },
  { k: "shin",  ch: "ش", name: "шин",   ar: "شِين",  mk: "wasat_lisan", sf: ["hams", "rikhwa", "istifal", "infitah", "ismat", "tafashshi"] },
  { k: "ya",    ch: "ي", name: "йа",    ar: "يَاء",  mk: "wasat_lisan", sf: ["jahr", "rikhwa", "istifal", "infitah", "ismat", "leen"], note: "Лин — только с сукуном после фатхи: «بَيْتٌ»." },
  { k: "dad",   ch: "ض", name: "дад",   ar: "ضَاد",  mk: "hafa", sf: ["jahr", "rikhwa", "istila", "itbaq", "ismat", "istitala"], note: "Самый трудный звук: отличайте от د и ظ (бейт 52)." },
  { k: "lam",   ch: "ل", name: "лям",   ar: "لَام",  mk: "lam", sf: ["jahr", "tawassut", "istifal", "infitah", "idhlaq", "inhiraf"] },
  { k: "nun",   ch: "ن", name: "нун",   ar: "نُون",  mk: "nun", sf: ["jahr", "tawassut", "istifal", "infitah", "idhlaq", "ghunna"] },
  { k: "ra",    ch: "ر", name: "ра",    ar: "رَاء",  mk: "ra", sf: ["jahr", "tawassut", "istifal", "infitah", "idhlaq", "inhiraf", "takrir"] },
  { k: "ta2",   ch: "ط", name: "то",    ar: "طَاء",  mk: "nitiya", sf: ["jahr", "shidda", "istila", "itbaq", "ismat", "qalqala"] },
  { k: "dal",   ch: "د", name: "даль",  ar: "دَال",  mk: "nitiya", sf: ["jahr", "shidda", "istifal", "infitah", "ismat", "qalqala"] },
  { k: "ta",    ch: "ت", name: "та",    ar: "تَاء",  mk: "nitiya", sf: ["hams", "shidda", "istifal", "infitah", "ismat"] },
  { k: "sad",   ch: "ص", name: "сад",   ar: "صَاد",  mk: "safir", sf: ["hams", "rikhwa", "istila", "itbaq", "ismat", "safir"] },
  { k: "zay",   ch: "ز", name: "зай",   ar: "زَاي",  mk: "safir", sf: ["jahr", "rikhwa", "istifal", "infitah", "ismat", "safir"] },
  { k: "sin",   ch: "س", name: "син",   ar: "سِين",  mk: "safir", sf: ["hams", "rikhwa", "istifal", "infitah", "ismat", "safir"], note: "Рядом с ت ط ق не превращайте в ص (бейт 40)." },
  { k: "zha",   ch: "ظ", name: "зо",    ar: "ظَاء",  mk: "lithawiya", sf: ["jahr", "rikhwa", "istila", "itbaq", "ismat"] },
  { k: "dhal",  ch: "ذ", name: "заль",  ar: "ذَال",  mk: "lithawiya", sf: ["jahr", "rikhwa", "istifal", "infitah", "ismat"], note: "Не утолщайте: «مَحْذُورًا» ≠ «مَحْظُورًا» (бейт 48)." },
  { k: "tha",   ch: "ث", name: "са",    ar: "ثَاء",  mk: "lithawiya", sf: ["hams", "rikhwa", "istifal", "infitah", "ismat"] },
  { k: "fa",    ch: "ف", name: "фа",    ar: "فَاء",  mk: "fa", sf: ["hams", "rikhwa", "istifal", "infitah", "idhlaq"] },
  { k: "waw",   ch: "و", name: "вав",   ar: "وَاو",  mk: "shafatan", sf: ["jahr", "rikhwa", "istifal", "infitah", "ismat", "leen"], note: "Округление губ без полного смыкания; лин — с сукуном после фатхи." },
  { k: "ba",    ch: "ب", name: "ба",    ar: "بَاء",  mk: "shafatan", sf: ["jahr", "shidda", "istifal", "infitah", "idhlaq", "qalqala"], note: "Сохраняйте шидду и джахр (бейт 37)." },
  { k: "mim",   ch: "م", name: "мим",   ar: "مِيم",  mk: "shafatan", sf: ["jahr", "tawassut", "istifal", "infitah", "idhlaq", "ghunna"] },
  { k: "ghunna", ch: "نّ", disp: "نّ مّ", name: "гунна", ar: "غُنَّة", mk: "khayshum", sf: ["ghunna"], note: "Не буква, а звук; сопровождает ن и م (бейты 19, 62)." },
];

export const LETTER_BY_KEY = Object.fromEntries(LETTERS.map((l) => [l.k, l]));
export const MAKHRAJ_BY_ID = Object.fromEntries(MAKHARIJ.map((m) => [m.id, m]));

// Бейт с отличительным сифатом буквы (для пары «махрадж + сифат»).
export function keySifaVerse(letter) {
  const s = SIFA_PRIORITY.find((id) => letter.sf.includes(id));
  return s ? SIFAT[s].v : 20;
}
