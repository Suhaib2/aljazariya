// Видеоуроки с YouTube: разбор матна доктора Аймана Рушди Сувейда (на арабском языке).
// Встроить плеер YouTube в эту страницу нельзя, поэтому урок открывается на YouTube в новой вкладке.
// PLAYLIST — id плейлиста (часть ссылки после list=).
// Урок: { id: "<id видео после watch?v=>", d: "12:34", s: "<id главы из sections.js>",
//         t: { ar — тема из названия на YouTube, ru, en — её перевод } }.
// Без s урок попадает в группу «Дополнительно»; x: true — видео без номера урока.
// Порядок — как в плейлисте; номера уроков совпадают с номерами в названиях на YouTube.
export const PLAYLIST = "PL5Bb0wPgk9iXZB7xVzzhl7NDAxGnRHu0D";

export const LESSONS = [
  { id: "PCY8nfiCVtI", d: "47:00", s: "intro", t: { ar: "مقدمة عن علم التجويد", ru: "Введение в науку таджвида", en: "An introduction to the science of tajweed" } },
  { id: "dEvSyaG59Qk", d: "18:49", s: "intro", t: { ar: "التعريف بالإمام محمد بن الجزري", ru: "Об имаме Мухаммаде ибн аль-Джазари", en: "About Imam Muhammad ibn al-Jazari" } },
  { id: "Ff-5WbiWa5Q", d: "26:59", s: "intro", t: { ar: "معنى الحمد", ru: "Смысл восхваления Аллаха", en: "The meaning of praising Allah" } },
  { id: "MhMo4AIzHTU", d: "47:22", s: "intro", t: { ar: "التعريف بآل النبي صلى الله عليه وسلم", ru: "Кто входит в семью Пророка ﷺ", en: "Who the family of the Prophet ﷺ are" } },
  { id: "o4rdrDJZ-NQ", d: "39:48", s: "intro", t: { ar: "الحروف العربية", ru: "Арабские буквы", en: "The Arabic letters" } },

  { id: "0kxBdToOt-g", d: "18:00", s: "makharij", t: { ar: "مخارج الحروف (1): المخارج الرئيسة للحروف العربية", ru: "Места выхода букв (1): основные области", en: "Points of articulation (1): the main areas" } },
  { id: "MYl0V_ubRXg", d: "32:15", s: "makharij", t: { ar: "مخارج الحروف (2): مخرج الجوف ومخرج الحلق", ru: "Места выхода букв (2): полость рта и горла, горло", en: "Points of articulation (2): the oral and throat cavity, the throat" } },
  { id: "yuHUvaWCdCo", d: "27:00", s: "makharij", t: { ar: "مخارج الحروف (3): مخرج الحلق (2)، مخرج اللسان (1)", ru: "Места выхода букв (3): горло (2), язык (1)", en: "Points of articulation (3): the throat (2), the tongue (1)" } },
  { id: "UtBpOi2My-Q", d: "25:25", s: "makharij", t: { ar: "مخارج الحروف (4): مخرج اللسان (2): حافة اللسان (ل)، طرف اللسان (ن، ر)", ru: "Места выхода букв (4): язык (2) — край языка («лям») и кончик языка («нун», «ра»)", en: "Points of articulation (4): the tongue (2) — its edge (lam) and its tip (nun, ra)" } },
  { id: "EBu4KzOWyUE", d: "33:26", s: "makharij", t: { ar: "مخارج الحروف (5): مخرج اللسان (3)، مخرج الشفة، مخرج الغنة", ru: "Места выхода букв (5): язык (3), губы, носовая полость", en: "Points of articulation (5): the tongue (3), the lips, the nasal cavity" } },

  { id: "zei4wGkt-Gk", d: "25:25", s: "sifat", t: { ar: "صفات الحروف (1): الحروف العربية من حيث الهمس والجهر", ru: "Свойства букв (1): глухость и звонкость", en: "Characteristics of the letters (1): whisper and audibility" } },
  { id: "GWclwx9S8Pc", d: "28:41", s: "sifat", t: { ar: "صفات الحروف (2): الحروف العربية من حيث الشدة والرخاوة والبينية", ru: "Свойства букв (2): твёрдость, рыхлость и промежуточность", en: "Characteristics of the letters (2): strength, looseness and the in-between" } },
  { id: "7XVL3r9dPyw", d: "30:53", s: "sifat", t: { ar: "صفات الحروف (3): قياس أزمنة الحروف الصحيحة", ru: "Свойства букв (3): сколько длится звучание согласных", en: "Characteristics of the letters (3): measuring how long consonants last" } },
  { id: "2xD-0AJ4vto", d: "26:27", s: "sifat", t: { ar: "صفات الحروف (4): الاستعلاء والاستفال، الإطباق والانفتاح", ru: "Свойства букв (4): возвышение и опущение, прикрытие и раскрытость", en: "Characteristics of the letters (4): elevation and lowering, closure and openness" } },
  { id: "xYtcdVTbK6U", d: "33:13", s: "sifat", t: { ar: "صفات الحروف (5): الصفير، القلقلة (1)", ru: "Свойства букв (5): свист, встряска (1)", en: "Characteristics of the letters (5): whistling, echo (1)" } },
  { id: "Il7RZbUV1OI", d: "35:28", s: "sifat", t: { ar: "صفات الحروف (6): القلقلة (2)", ru: "Свойства букв (6): встряска (2)", en: "Characteristics of the letters (6): echo (2)" } },
  { id: "aPisR92Zngs", d: "36:11", s: "sifat", t: { ar: "صفات الحروف (7): اللين، الانحراف، التكرير", ru: "Свойства букв (7): мягкость, отклонение, повторение", en: "Characteristics of the letters (7): softness, deviation, repetition" } },
  { id: "Pwtjh_O5Bi0", d: "40:53", s: "sifat", t: { ar: "صفات الحروف (8): التفشي، الاستطالة، الغنة من حيث كونها صفة", ru: "Свойства букв (8): растекание, растяжение и носовой звук как свойство", en: "Characteristics of the letters (8): spreading, elongation, and the nasal sound as a characteristic" } },

  { id: "DRBwyYTOric", d: "36:55", s: "tajwid", t: { ar: "باب التجويد: حكم الالتزام بالتجويد", ru: "О правильном чтении: обязанность соблюдать таджвид", en: "On correct recitation: the duty to observe tajweed" } },
  { id: "E3ztOwiYmZ4", d: "37:07", s: "tajwid", t: { ar: "باب التجويد: اللحن، مراحل تدوين القرآن الكريم", ru: "О правильном чтении: ошибки в чтении, этапы записи Корана", en: "On correct recitation: errors in recitation, the stages of writing down the Quran" } },
  { id: "dlxTN1iFark", d: "41:02", s: "tajwid", t: { ar: "مراحل تدوين القرآن الكريم (2)", ru: "Этапы записи Корана (2)", en: "The stages of writing down the Quran (2)" } },
  { id: "1lzluU1POt4", d: "45:08", s: "tajwid", t: { ar: "النقل الصوتي للقرآن الكريم", ru: "Устная передача Корана", en: "The oral transmission of the Quran" } },
  { id: "NwcMNOPT4nk", d: "49:15", s: "tajwid", t: { ar: "أحد الأسانيد المتصلة، سرعات التلاوة", ru: "Одна из непрерывных цепочек передачи, темпы чтения", en: "One of the unbroken chains of transmission, the speeds of recitation" } },
  { id: "hUotr2CevkQ", d: "48:29", s: "tajwid", t: { ar: "ختام باب التجويد", ru: "Завершение главы о правильном чтении", en: "Concluding the chapter on correct recitation" } },
  { id: "Yuh3-HPY_tQ", d: "1:02:36", s: "tajwid", t: { ar: "حكم قراءة القرآن بالألحان (1)", ru: "Правило о чтении Корана на мелодии (1)", en: "The ruling on reciting the Quran to melodies (1)" } },
  { id: "x7iaVS7VZLc", d: "59:51", s: "tajwid", t: { ar: "منع السلف للقراءة بالألحان", ru: "Запрет праведных предшественников читать Коран на мелодии", en: "The early generations’ prohibition of reciting to melodies" } },

  { id: "PRgWwxG2s9U", d: "49:11", s: "tarqiq", t: { ar: "باب في ذكر بعض التنبيهات (1)", ru: "Некоторые важные замечания (1)", en: "Some important notes (1)" } },
  { id: "NYqQwN-TVMA", d: "57:01", s: "tarqiq", t: { ar: "باب في ذكر بعض التنبيهات (2)", ru: "Некоторые важные замечания (2)", en: "Some important notes (2)" } },

  { id: "lO6py6bEY9A", d: "1:01:06", s: "ra", t: { ar: "أحكام الراءات: الراء من حيث التفخيم والترقيق", ru: "Правила буквы «ра»: тяжёлое и лёгкое произношение", en: "The rules of ra: heavy and light pronunciation" } },

  { id: "oV7b4k0WYEI", d: "57:24", s: "lam", t: { ar: "باب اللامات وأحكام متفرقة (1)", ru: "Буква «лям» и другие правила (1)", en: "The letter lam and other rules (1)" } },
  { id: "Iugrf99B0Us", d: "47:50", s: "lam", t: { ar: "حروف الاستعلاء (2)", ru: "Буквы с возвышением (2)", en: "The letters of elevation (2)" } },
  { id: "tv-GHUmrzek", d: "49:50", s: "lam", t: { ar: "الحرفان الملتقيان (1)", ru: "Две встречающиеся буквы (1)", en: "Two letters that meet (1)" } },
  { id: "pV56dzuu_i8", d: "45:59", s: "lam", t: { ar: "الحرفان الملتقيان (2): المتماثلان والمتجانسان", ru: "Две встречающиеся буквы (2): одинаковые и однородные", en: "Two letters that meet (2): identical and related" } },
  { id: "O56oHPZfH20", d: "43:18", s: "lam", t: { ar: "الحرفان الملتقيان (3): المتقاربان", ru: "Две встречающиеся буквы (3): близкие", en: "Two letters that meet (3): close" } },

  { id: "W-2dXUD6l98", d: "40:48", s: "dad", t: { ar: "باب الضاد والظاء (1)", ru: "Буквы «дад» и «за» (1)", en: "The letters dad and za (1)" } },
  { id: "yqvizExePmo", d: "39:48", s: "dad", t: { ar: "باب الضاد والظاء (2)", ru: "Буквы «дад» и «за» (2)", en: "The letters dad and za (2)" } },
  { id: "dAHE-OxiA3k", d: "38:21", s: "dad", t: { ar: "باب الضاد والظاء (3)", ru: "Буквы «дад» и «за» (3)", en: "The letters dad and za (3)" } },

  { id: "EtftzJnf7bE", d: "43:11", s: "nunmim", t: { ar: "باب النون والميم المشددتين والميم الساكنة (1)", ru: "Удвоенные «нун» и «мим», «мим» без огласовки (1)", en: "Doubled nun and mim, and mim without a vowel (1)" } },
  { id: "T0E8plHnVq4", d: "41:04", s: "nunmim", t: { ar: "أحكام الميم الساكنة (2)، باب النون الساكنة والتنوين", ru: "«Мим» без огласовки (2); «нун» без огласовки и нунация", en: "Mim without a vowel (2); nun without a vowel and nunation" } },

  { id: "5KX-vHe4xIo", d: "50:14", s: "nun", t: { ar: "باب النون الساكنة والتنوين (2): الإظهار الحلقي، الإدغام", ru: "«Нун» без огласовки и нунация (2): ясное произношение перед буквами горла, слияние", en: "Nun without a vowel and nunation (2): clear pronunciation before the throat letters, merging" } },
  { id: "Q4sVYP9pmgo", d: "50:06", s: "nun", t: { ar: "باب النون الساكنة والتنوين (3): الإدغام (2)، القلب", ru: "«Нун» без огласовки и нунация (3): слияние (2), замена", en: "Nun without a vowel and nunation (3): merging (2), conversion" } },
  { id: "wrBUMClopeY", d: "47:21", s: "nun", t: { ar: "باب النون الساكنة والتنوين (4): الإخفاء", ru: "«Нун» без огласовки и нунация (4): скрытое произношение", en: "Nun without a vowel and nunation (4): concealment" } },
  { id: "IXqVloZcKB8", d: "52:35", s: "nun", t: { ar: "باب النون الساكنة والتنوين (5): الإخفاء (2)", ru: "«Нун» без огласовки и нунация (5): скрытое произношение (2)", en: "Nun without a vowel and nunation (5): concealment (2)" } },

  { id: "mQBemuLPDTk", d: "43:46", s: "madd", t: { ar: "باب المد (1)", ru: "Удлинение (1)", en: "Lengthening (1)" } },
  { id: "R_F88YgKagw", d: "39:49", s: "madd", t: { ar: "باب المد (2): المد الطبيعي، مد البدل", ru: "Удлинение (2): естественное удлинение, удлинение замены", en: "Lengthening (2): natural lengthening, substitution lengthening" } },
  { id: "R-2W8OBtLTk", d: "33:05", s: "madd", t: { ar: "باب المد (3): مد العوض، مد الصلة", ru: "Удлинение (3): удлинение возмещения, связующее удлинение", en: "Lengthening (3): compensation lengthening, connecting lengthening" } },
  { id: "-7VBI_T5jEw", d: "38:46", s: "madd", t: { ar: "باب المد (4): مد الصلة (2)", ru: "Удлинение (4): связующее удлинение (2)", en: "Lengthening (4): connecting lengthening (2)" } },
  { id: "30pQgOzbFso", d: "41:10", s: "madd", t: { ar: "باب المد (5): المد اللازم", ru: "Удлинение (5): необходимое удлинение", en: "Lengthening (5): necessary lengthening" } },
  { id: "lGap8X9CPyQ", d: "46:54", s: "madd", t: { ar: "باب المد (6): المدود في الحروف المقطعة، المد الواجب المتصل", ru: "Удлинение (6): удлинения в отдельных буквах в начале сур, обязательное слитное удлинение", en: "Lengthening (6): lengthening in the separate letters that open surahs, the obligatory joined lengthening" } },
  { id: "C_c4w9wbyHY", d: "28:46", s: "madd", t: { ar: "باب المد (7): المد الجائز المنفصل", ru: "Удлинение (7): допустимое раздельное удлинение", en: "Lengthening (7): the permissible separated lengthening" } },
  { id: "I1gEk6mwWcY", d: "25:04", s: "madd", t: { ar: "باب المد (8): مد الصلة الكبرى، المد العارض للسكون", ru: "Удлинение (8): большое связующее удлинение, удлинение из-за остановки", en: "Lengthening (8): the major connecting lengthening, lengthening caused by stopping" } },
  { id: "rKbarUGIVGg", d: "23:10", s: "madd", t: { ar: "باب المد (9): مد اللين", ru: "Удлинение (9): мягкое удлинение", en: "Lengthening (9): soft lengthening" } },
  { id: "KHwxF5k3mSU", d: "30:08", s: "madd", t: { ar: "باب المد (10): أخطاء تقع عند نطق أحرف المد", ru: "Удлинение (10): ошибки при произнесении букв удлинения", en: "Lengthening (10): mistakes in pronouncing the lengthening letters" } },
  { id: "EKDG81ILS-w", d: "39:06", s: "madd", t: { ar: "باب المد (11): قاعدة أقوى السببين", ru: "Удлинение (11): правило более сильной из двух причин", en: "Lengthening (11): the rule of the stronger of two causes" } },
  { id: "HdFuNU9zcxw", d: "47:27", s: "madd", t: { ar: "باب المد (12): قاعدة أقوى السببين (2)", ru: "Удлинение (12): правило более сильной из двух причин (2)", en: "Lengthening (12): the rule of the stronger of two causes (2)" } },
  { id: "cRFDbrURmFs", d: "48:10", s: "madd", t: { ar: "إتمام الحركات", ru: "Полное произнесение огласовок", en: "Giving the vowels their full length" } },

  { id: "D9r6v9cj-Wg", d: "20:56", t: { ar: "لقاء مفتوح", ru: "Открытая встреча", en: "An open session" } },

  { id: "17_T8Q98g28", d: "47:49", s: "waqf", t: { ar: "الوقف والابتداء (1): أنواع الوقف في القرآن الكريم", ru: "Остановка и начало чтения (1): виды остановок в Коране", en: "Stopping and starting (1): the kinds of stops in the Quran" } },
  { id: "mL7jqK2SJkI", d: "30:38", s: "waqf", t: { ar: "الوقف والابتداء (2): أنواع الوقف الجائز", ru: "Остановка и начало чтения (2): виды допустимой остановки", en: "Stopping and starting (2): the kinds of permissible stops" } },
  { id: "hIOsFcgOIxE", d: "36:39", s: "waqf", t: { ar: "الوقف والابتداء (3): الوقف القبيح", ru: "Остановка и начало чтения (3): недопустимая остановка", en: "Stopping and starting (3): the unacceptable stop" } },
  { id: "9tBlToK-2wE", d: "26:32", s: "waqf", t: { ar: "الوقف والابتداء (4): علامات الوقف في المصحف الشريف", ru: "Остановка и начало чтения (4): знаки остановки в тексте Корана", en: "Stopping and starting (4): the stop signs in the written Quran" } },
  { id: "mW_9VqZv8pE", d: "39:52", s: "waqf", t: { ar: "الوقف والابتداء (5): قاعدة حفص في الوقف الاختباري أو الاضطراري", ru: "Остановка и начало чтения (5): правило Хафса для проверочной и вынужденной остановки", en: "Stopping and starting (5): Hafs’s rule for test and forced stops" } },
  { id: "XJmX9jswppw", d: "32:11", s: "waqf", t: { ar: "الوقف والابتداء (6): قاعدة حفص في الوقف الاختباري أو الاضطراري", ru: "Остановка и начало чтения (6): правило Хафса для проверочной и вынужденной остановки", en: "Stopping and starting (6): Hafs’s rule for test and forced stops" } },
  { id: "wGZWXJ9LvHs", d: "18:34", s: "waqf", t: { ar: "الوقف والابتداء (7): السكتتان الجائزتان، الأوجه بين الأنفال والتوبة", ru: "Остановка и начало чтения (7): две допустимые паузы без вдоха, варианты между сурами «аль-Анфаль» и «ат-Тауба»", en: "Stopping and starting (7): the two permissible breathless pauses, the options between al-Anfal and at-Tawbah" } },
  { id: "wpc0q7jTOKw", d: "29:43", s: "waqf", t: { ar: "الوقف والابتداء (8): أنواع الابتداء بتلاوة القرآن الكريم", ru: "Остановка и начало чтения (8): виды начала чтения Корана", en: "Stopping and starting (8): the ways of starting a recitation of the Quran" } },
  { id: "yLrvdso1IQo", d: "21:03", s: "waqf", t: { ar: "الوقف والابتداء (9): أمثلة على الابتداء الاختباري", ru: "Остановка и начало чтения (9): примеры проверочного начала", en: "Stopping and starting (9): examples of starting for a test" } },

  { id: "fDJsGqCyF0Q", d: "35:58", s: "maqtu", t: { ar: "باب المقطوع والموصول (1)", ru: "Раздельное и слитное написание (1)", en: "Separate and joined spelling (1)" } },
  { id: "v-u6RcawbzU", d: "23:26", s: "maqtu", t: { ar: "باب المقطوع والموصول (2)", ru: "Раздельное и слитное написание (2)", en: "Separate and joined spelling (2)" } },
  { id: "7Uox5HuCfEQ", d: "20:31", s: "maqtu", t: { ar: "باب المقطوع والموصول (3)", ru: "Раздельное и слитное написание (3)", en: "Separate and joined spelling (3)" } },
  { id: "XsGzv01Fquc", d: "26:18", s: "maqtu", t: { ar: "باب المقطوع والموصول (4)", ru: "Раздельное и слитное написание (4)", en: "Separate and joined spelling (4)" } },
  { id: "988-1LfQTR0", d: "31:21", s: "maqtu", t: { ar: "باب المقطوع والموصول (5)", ru: "Раздельное и слитное написание (5)", en: "Separate and joined spelling (5)" } },

  { id: "cbS6kihwP28", d: "31:43", s: "ta", t: { ar: "باب التاءات (1)", ru: "Открытая «та» в конце слов (1)", en: "The open ta at word endings (1)" } },
  { id: "As3MAHR5IeI", d: "36:07", s: "ta", t: { ar: "باب التاءات (2)", ru: "Открытая «та» в конце слов (2)", en: "The open ta at word endings (2)" } },

  { id: "0KUCK1zZLCA", d: "39:29", s: "hamza", t: { ar: "همزة الوصل", ru: "Соединительная хамза", en: "The connecting hamza" } },
  { id: "Xwshfg6Lp8E", d: "40:51", s: "hamza", t: { ar: "همزة القطع", ru: "Разделительная хамза", en: "The disjunctive hamza" } },

  { id: "bS1oRoBNG74", d: "42:44", s: "rawm", t: { ar: "باب الوقف على أواخر الكلم (1)", ru: "Остановка на окончаниях слов (1)", en: "Stopping at word endings (1)" } },
  { id: "VRxitI5PUzQ", d: "36:34", s: "rawm", t: { ar: "باب الوقف على أواخر الكلم (2)", ru: "Остановка на окончаниях слов (2)", en: "Stopping at word endings (2)" } },

  { id: "g2JmcLoWcA0", d: "10:21", t: { ar: "منظومة متن الجزرية (1)", ru: "Текст матна (1)", en: "The text of the matn (1)" } },
  { id: "_elY6L26Us8", d: "28:00", t: { ar: "منظومة متن الجزرية (2)", ru: "Текст матна (2)", en: "The text of the matn (2)" } },
  { id: "7m828O0i6AA", d: "14:00", x: true, t: { ar: "منظومة متن الجزرية كاملة", ru: "Весь матн одним видео", en: "The whole matn in one video" } },

  { id: "mdZpoHyLxeU", d: "26:33", s: "khatima", t: { ar: "خاتمة المقدمة الجزرية (الحلقة الأخيرة)", ru: "Заключение поэмы, последний урок", en: "The poem’s conclusion, the final lesson" } },
];
