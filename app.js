(function(){
'use strict';
var doc = document;
var curLessonId = 'u0l1';
/* BASE: بيانات الكورس العامة من content.js وحدها. ويُدمج كل درس معها في نسخة جديدة،
   فلا يتسرب حقل من درس إلى آخر. كان درسا الاستماع في الأسبوع التأسيسي يعرضان «قراءة»
   درس آخر بسبب هذا التسرب. */
var BASE = DATA;
var D = BASE;
function lessonData(id){ return Object.assign({}, BASE, (typeof LESSONS !== 'undefined' && LESSONS[id]) || {}); }
function $(s, r){ return (r||doc).querySelector(s); }
function $$(s, r){ return Array.prototype.slice.call((r||doc).querySelectorAll(s)); }
var AUTO_DIR = { P:1, LI:1, SMALL:1, H1:1, H2:1, H3:1, LABEL:1, SUMMARY:1, TD:1, TH:1, Q:1, BLOCKQUOTE:1 };
function h(tag, attrs){
  var el = doc.createElement(tag), k, v;
  if (AUTO_DIR[el.tagName] && !(attrs && attrs.dir)) el.setAttribute('dir', 'auto');
  if (attrs) for (k in attrs){ if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue; v = attrs[k];
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'on'){ for (var ev in v) el.addEventListener(ev, v[ev]); }
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  for (var i = 2; i < arguments.length; i++) addKid(el, arguments[i]);
  return el;
}
function addKid(el, kid){ if (kid == null || kid === false) return; if (Array.isArray(kid)) { kid.forEach(function(x){ addKid(el, x); }); return; } el.append(kid.nodeType ? kid : String(kid)); }
function put(el){ var kids = []; for (var i = 1; i < arguments.length; i++) kids.push(arguments[i]); var flat = []; (function walk(a){ a.forEach(function(x){ if (Array.isArray(x)) walk(x); else if (x != null && x !== false) flat.push(x.nodeType ? x : doc.createTextNode(String(x))); }); })(kids); el.replaceChildren.apply(el, flat); }
function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
var LAT = /\d+(?:\.\d+)?\s?[–\-]\s?\d+(?:\.\d+)?|[A-Za-z][A-Za-z0-9'’.\-\/+ ]*[A-Za-z0-9'’!?%]|[A-Za-z]/g;
function arHTML(s){ s = String(s == null ? '' : s); var out = '', last = 0, m; LAT.lastIndex = 0; while ((m = LAT.exec(s))) { out += esc(s.slice(last, m.index)) + '<bdi class="en">' + esc(m[0]) + '</bdi>'; last = m.index + m[0].length; } return out + esc(s.slice(last)); }
function shuffle(a){ a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
var RM = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

/* bilingual UI builders (English first, Arabic small underneath) */
/* منذ 1 نوفمبر 2026 (قرار المتعلم): العناوين والأزرار بالإنجليزي وحده، والعربي سطر تحت تعليمات الأسئلة فقط (label)،
   وفي الشرح خلف «اعرض بالعربي». فيبقى المعامل الثاني مقبولًا ولا يُعرض. */
function biNode(en, ar, cls){
  return h('span', { class:'bi' + (cls ? ' ' + cls : '') }, h('span', { class:'bi-en', dir:'ltr' }, en));
}
function biBtn(en, ar){ return en; }
function arReveal(arContent, isHtml){
  if (!arContent) return null;
  var box = h('div', { class:'ar-box', hidden:true, dir:'rtl', lang:'ar' });
  if (isHtml) box.innerHTML = arContent; else box.innerHTML = '<p>' + arHTML(arContent) + '</p>';
  var btn = h('button', { class:'ar-btn', type:'button', 'aria-expanded':'false' }, 'اعرض بالعربي');
  btn.addEventListener('click', function(e){
    e.stopPropagation();
    var show = box.hidden;
    box.hidden = !show;
    btn.classList.toggle('on', show);
    btn.setAttribute('aria-expanded', show ? 'true' : 'false');
    btn.textContent = show ? 'إخفاء العربي' : 'اعرض بالعربي';
  });
  return h('div', { class:'ar-wrap' }, btn, box);
}

/* ---------- icons ---------- */
function svg(p, sw){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 2) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + p + '</svg>'; }
var IC = {
  check: svg('<path d="M5 12.5l4.5 4.5L19 7"/>', 2.6),
  x: svg('<path d="M6 6l12 12M18 6L6 18"/>', 2.2),
  /* الصفحة من اليسار منذ 1 نوفمبر 2026: «التالي» يشير يمينًا و«رجوع» يسارًا. */
  fwd: svg('<path d="M5 12h14M13 6l6 6-6 6"/>', 2.2),
  back: svg('<path d="M19 12H5M11 6l-6 6 6 6"/>', 2.2),
  chev: svg('<path d="M9 6l6 6-6 6"/>', 2.6),
  down: svg('<path d="M6 9l6 6 6-6"/>', 2.4),
  up: svg('<path d="M6 15l6-6 6 6"/>', 2.4),
  chat: svg('<path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 3.5V16.5H5A1.5 1.5 0 0 1 3.5 15V7A1.5 1.5 0 0 1 5 5.5z"/>'),
  help: svg('<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6"/><path d="M12 16.8v.2"/>'),
  info: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5"/><path d="M12 7.6v.2"/>'),
  lock: svg('<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>', 2.2),
  home: svg('<path d="M4 11l8-7 8 7v8.5a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H5.5A1.5 1.5 0 0 1 4 19.5z"/>'),
  book: svg('<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3"/>'),
  cards: svg('<rect x="3" y="7" width="13" height="14" rx="2.5"/><path d="M8 3.5h10.5A2.5 2.5 0 0 1 21 6v11"/>'),
  review: svg('<path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4v5h-5"/>'),
  gear: svg('<path d="M12 2.8l8 4.6v9.2l-8 4.6-8-4.6V7.4z"/><circle cx="12" cy="12" r="3.2"/>'),
  mark: svg('<path d="M7 3.5h10a1 1 0 0 1 1 1V21l-6-4-6 4V4.5a1 1 0 0 1 1-1z"/>'),
  chart: svg('<path d="M4 4v16h16"/><path d="M7.5 14.5l3.5-4 3 2.5 4.5-5.5"/>'),
  speaker: svg('<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>'),
  play: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>',
  dots: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="5.5" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="18.5" cy="12" r="1.8" fill="currentColor"/></svg>',
  clock: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  mail: svg('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 7l8.5 6 8.5-6"/>'),
  quiz: svg('<path d="M10 6.5h10M10 12h10M10 17.5h10"/><path d="M3.5 6.5l1.5 1.5 2.5-2.5M3.5 12l1.5 1.5 2.5-2.5M3.5 17.5l1.5 1.5 2.5-2.5"/>'),
  pen: svg('<path d="M4 20l1-4.5L16 4.5l3.5 3.5L8.5 19z"/><path d="M13.5 7.5l3 3"/>'),
  spark: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M11 3l1.9 5.6L18.5 10.5l-5.6 1.9L11 18l-1.9-5.6L3.5 10.5l5.6-1.9z" fill="currentColor"/><path d="M18.5 15l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" fill="currentColor"/></svg>',
  moon: svg('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>', 1.8),
  globe: svg('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.6 5.4 3.6 8.5s-1.1 5.9-3.6 8.5c-2.5-2.6-3.6-5.4-3.6-8.5s1.1-5.9 3.6-8.5z"/>', 1.8),
  trophy: svg('<path d="M8 4h8v5.5a4 4 0 0 1-8 0z"/><path d="M8 6H5.5v1.5A3.5 3.5 0 0 0 8.6 11M16 6h2.5v1.5a3.5 3.5 0 0 1-3.1 3.5M12 13.5V17M8.5 20.5h7M10 17h4"/>', 1.8),
  copy: svg('<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>'),
  star: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" fill="currentColor"/></svg>'
};
function ico(k){ return h('span', { class:'ico', html:IC[k] }); }
function aa(){ return h('span', { class:'aa' }, 'Aa'); }
var PENG = '<path d="M60 18 C 30 18, 18 50, 18 92 C 18 138, 34 164, 60 164 C 86 164, 102 138, 102 92 C 102 50, 90 18, 60 18 Z" fill="#2C4A6E"/><path d="M20 82 C 6 102, 8 126, 22 136 C 24 118, 26 100, 30 88 Z" fill="#1E3550"/><path d="M100 82 C 114 102, 112 126, 98 136 C 96 118, 94 100, 90 88 Z" fill="#1E3550"/><path d="M60 52 C 42 52, 36 78, 36 104 C 36 134, 46 154, 60 154 C 74 154, 84 134, 84 104 C 84 78, 78 52, 60 52 Z" fill="#F7F3EC"/><circle cx="49" cy="40" r="5" fill="#F7F3EC"/><circle cx="50" cy="41" r="2.4" fill="#1E2A33"/><circle cx="71" cy="40" r="5" fill="#F7F3EC"/><circle cx="70" cy="41" r="2.4" fill="#1E2A33"/><path d="M53 50 L67 50 L60 60 Z" fill="#F2B857"/><ellipse cx="46" cy="166" rx="12" ry="4.5" fill="#F2B857"/><ellipse cx="74" cy="166" rx="12" ry="4.5" fill="#F2B857"/>';
function penguin(w, hh, cls){ return h('span', { class:cls || '', 'aria-hidden':'true', html:'<svg width="' + w + '" height="' + hh + '" viewBox="0 0 120 170" focusable="false">' + PENG + '</svg>' }); }
var SPARK = '<path d="M0 -9 C 1 -1 1 -1 9 0 C 1 1 1 1 0 9 C -1 1 -1 1 -9 0 C -1 -1 -1 -1 0 -9 Z" fill="#F2B857"/>';
var WELCOME_SVG = '<svg viewBox="0 0 390 480" preserveAspectRatio="xMidYMid slice" direction="ltr" aria-hidden="true" focusable="false">' +
  '<g font-family="Quicksand, sans-serif" font-weight="700" fill="#F7F3EC">' +
  '<text x="34" y="104" font-size="24" opacity="0.16" transform="rotate(-10 34 104)">Hello</text>' +
  '<text x="262" y="84" font-size="20" opacity="0.14" transform="rotate(8 262 84)">travel</text>' +
  '<text x="292" y="176" font-size="18" opacity="0.2" transform="rotate(-6 292 176)">learn</text>' +
  '<text x="26" y="212" font-size="17" opacity="0.12" transform="rotate(6 26 212)">science</text>' +
  '<text x="150" y="70" font-size="15" opacity="0.12">culture</text>' +
  '<text x="300" y="250" font-size="15" opacity="0.12" transform="rotate(10 300 250)">team</text></g>' +
  '<ellipse cx="195" cy="398" rx="130" ry="18" fill="#F2B857" opacity="0.18"/>' +
  '<path d="M195 312 C 160 294, 118 292, 80 304 L 80 392 C 118 380, 160 382, 195 400 Z" fill="#FFFDF8"/>' +
  '<path d="M195 312 C 230 294, 272 292, 310 304 L 310 392 C 272 380, 230 382, 195 400 Z" fill="#EFE9DF"/>' +
  '<path d="M195 312 L 195 400" stroke="#E2D9CC" stroke-width="2"/>' +
  '<path d="M98 320 C 124 312, 150 312, 178 322 M98 336 C 124 328, 150 328, 178 338 M98 352 C 124 344, 150 344, 178 354 M98 368 C 120 361, 140 361, 160 367" fill="none" stroke="#D5CEC2" stroke-width="2.2" stroke-linecap="round"/>' +
  '<path d="M212 322 C 240 312, 266 312, 292 320 M212 338 C 240 328, 266 328, 292 336 M212 354 C 240 344, 266 344, 292 352" fill="none" stroke="#D5CEC2" stroke-width="2.2" stroke-linecap="round"/>' +
  '<g font-family="Quicksand, sans-serif" font-weight="700" fill="#F7F3EC"><text x="176" y="282" font-size="38">A</text><text x="212" y="240" font-size="30" opacity="0.75">b</text><text x="168" y="200" font-size="24" opacity="0.5">c</text></g>' +
  '<g transform="translate(246 206)">' + SPARK + '</g><g transform="translate(140 252) scale(0.7)">' + SPARK + '</g><g transform="translate(228 160) scale(0.5)" opacity="0.8">' + SPARK + '</g></svg>';

/* ---------- structure & multi-lesson loader (6-Stage Template) ---------- */
var PARTS = [
  { k:'recall', en:'Recall', fullEn:'Active Recall', ar:'الاسترجاع', fullAr:'مراجعة بالاسترجاع النشط', min:5, ic:'review' },
  { k:'vocab', en:'Phrases', fullEn:'New Phrases', ar:'العبارات', fullAr:'عبارات جديدة', min:8, ic:'cards' },
  { k:'grammar', en:'Grammar', fullEn:'Grammar', ar:'القواعد', fullAr:'القواعد', min:12, ic:'aa' },
  { k:'reading', en:'Reading', fullEn:'Reading', ar:'القراءة', fullAr:'القراءة', min:17, ic:'mail' },
  { k:'writing', en:'Writing', fullEn:'Writing', ar:'الكتابة', fullAr:'الكتابة', min:10, ic:'pen' },
  { k:'quiz', en:'Quiz', fullEn:'Short Quiz & Analysis', ar:'الاختبار', fullAr:'اختبار قصير وتحليل الأخطاء', min:8, ic:'quiz' }
];
function partOf(k){ return PARTS.filter(function(p){ return p.k === k; })[0]; }
function partIcon(p){ return p.ic === 'aa' ? aa() : ico(p.ic); }
function mkIds(p, n){ var a = []; for (var i = 0; i < n; i++) a.push(p + '-' + i); return a; }
function mcqOf(x){ return { prompt:x.s, opts:x.opts, a:x.a, whyEn:x.whyEn, why:x.why, errCat:x.errCat }; }

/* أنواع الأخطاء في تحليل الاختبار. لكل قيمة errCat في الدروس وcontent.js مدخل هنا،
   وما لا مدخل له يظهر تحت «general» لا تحت الأزمنة. */
var ERR_CATS = {
  tense: {
    en: "Tense Choice & Time Words",
    ar: "اختيار الزمن وكلمات الزمان",
    whyEn: "Let the time words choose the tense: habits and facts (every day, usually) → Present Simple; right now or this month → Present Continuous (am/is/are + -ing); yesterday or last week → Past (was/were).",
    whyAr: "كلمات الزمان تحدد الزمن: العادة والحقيقة (every day, usually) للمضارع البسيط، وما يحدث الآن أو هذا الشهر للمضارع المستمر، وyesterday وlast week للماضي (was/were)."
  },
  be_verb: {
    en: "Using 'be' & 'do' with Verbs",
    ar: "استعمال be و do مع الأفعال",
    whyEn: "Use am / is / are with a noun, an adjective or a place (I am busy), and do / does with an action verb (Do you work?). Never put am / is / are before a base verb (✗ She is go), and never drop it before an -ing verb (✗ She working).",
    whyAr: "نستعمل am / is / are مع الاسم أو الصفة أو المكان (I am busy)، وdo / does مع فعل الحدث (Do you work?). ولا نضع am / is / are قبل الفعل الأصلي، ولا نحذفها قبل الفعل المنتهي بـ ing."
  },
  agreement: {
    en: "Singular & Plural Agreement",
    ar: "المطابقة مع المفرد والجمع",
    whyEn: "Match the verb to its subject. One person or thing → is / was / there is / this / he works / doesn't. More than one → are / were / there are / these / they work / don't.",
    whyAr: "طابق الفعل مع فاعله: المفرد مع is وwas وthere is وthis والفعل المضاف إليه s (he works) وdoesn't، والجمع مع are وwere وthere are وthese والفعل بلا s وdon't."
  },
  articles_prep: {
    en: "Articles (a / an / the) & Prepositions",
    ar: "أدوات التنكير والتعريف (a / an / the) وحروف الجر",
    whyEn: "Put a / an before a singular job or thing (She is a lawyer · an official document), use no 'the' for general ideas (Life is busy), and learn each preposition with its word (good at, at the office).",
    whyAr: "نضع a أو an قبل المهنة أو الاسم المفرد (a lawyer · an official document)، ولا نضع the قبل الاسم بمعناه العام (Life is busy)، ونحفظ حرف الجر مع كلمته (good at · at the office)."
  },
  stative: {
    en: "Stative Verbs (know / need / understand)",
    ar: "أفعال الحالة والذهن والمشاعر",
    whyEn: "Verbs of thinking, feeling, and needing (know, understand, need, want, like) stay in Present Simple even when we mean right now.",
    whyAr: "أفعال التفكير والمشاعر والحاجة تبقى في المضارع البسيط ولا تأخذ ing حتى لو قصدنا اللحظة الحالية."
  },
  word_order: {
    en: "Word Order & Question Formation",
    ar: "ترتيب الكلمات وتكوين السؤال",
    whyEn: "Put frequency words (usually, often) before the main verb, and start questions with Do/Does or Am/Is/Are before the subject.",
    whyAr: "كلمات التكرار تأتي قبل الفعل الأساسي، وفي السؤال يسبق الفعل المساعد الفاعل."
  },
  spelling: {
    en: "Spelling & Memory Recall",
    ar: "الإملاء واسترجاع الكلمات",
    whyEn: "Pay attention to silent -e (write → writing), consonant clusters (scientist, strange), and vowel pairs (research, team, measure).",
    whyAr: "انتبه لحذف الـ e الصامتة قبل ing، وتتابع الحروف الساكنة والعلة في كتابة المفردات."
  },
  vocab: {
    en: "Vocabulary Meaning & Collocations",
    ar: "معاني المفردات والمتلازمات اللفظية",
    whyEn: "Check how each word fits the context and its natural partners (do research, collect data, measure temperature, sign a contract).",
    whyAr: "راجع معنى الكلمة في السياق والكلمات التي تتلازم معها طبيعيًا."
  },
  reading: {
    en: "Reading Comprehension & Evidence",
    ar: "فهم المقروء والدليل من النص",
    whyEn: "Always verify details and numbers against the exact sentence in the text before choosing.",
    whyAr: "تأكد من التفاصيل والأرقام بالرجوع إلى الجملة الدالة عليها في النص."
  },
  general: {
    en: "Other Mistakes",
    ar: "أخطاء أخرى",
    whyEn: "Read the explanation under each question, then compare it with today's grammar cards.",
    whyAr: "اقرأ الشرح تحت كل سؤال، ثم قارنه ببطاقات قاعدة اليوم."
  }
};

var IDS = {}, ITEMS = {}, GCARDS = [], VOCAB_LIST = '', ALL_VOCAB = [];
var INDEX_CACHE = {};

/* يبني فهرس أسئلة درس معيّن: لدرس اليوم، أو لدرس سابق حين تعود أسئلته في دفتر الأخطاء. */
function buildIndex(L){
  var vocab = (L.vocab || []).slice();
  if (L.legalPhrase) vocab.push(Object.assign({ isLegal:true }, L.legalPhrase));
  var ids = {
    rc: mkIds('rc', (L.recall || []).length),
    vg: mkIds('vg', (L.vocabGaps || []).length),
    gA: mkIds('gA', (L.gA || []).length),
    gB: mkIds('gB', (L.gB || []).length),
    gC: mkIds('gC', (L.gC || []).length),
    gD: mkIds('gD', (L.gD || []).length),
    rq: mkIds('rq', L.reading && L.reading.questions ? L.reading.questions.length : 0),
    lq: mkIds('lq', L.listening && L.listening.questions ? L.listening.questions.length : 0)
  };
  var items = {};
  (L.recall || []).forEach(function(x, i){ items['rc-' + i] = { type:'recall', secEn:'Active Recall', sec:'مراجعة بالاسترجاع النشط', groupEn:'Write the word from memory', group:'اكتب الكلمة من الذاكرة', errCat:x.errCat || 'spelling', x:x }; });
  (L.vocabGaps || []).forEach(function(x, i){ items['vg-' + i] = { type:'mcq', secEn:'New Phrases', sec:'عبارات جديدة', groupEn:'Choose the right word', group:'اختر الكلمة المناسبة', errCat:x.errCat || 'vocab', x:mcqOf(x) }; });
  (L.gA || []).forEach(function(x, i){ items['gA-' + i] = { type:'mcq', secEn:'Grammar', sec:'القواعد', groupEn:'Choose the correct form', group:'اختر الصيغة الصحيحة', errCat:x.errCat || 'tense', x:mcqOf(x) }; });
  (L.gB || []).forEach(function(x, i){ items['gB-' + i] = { type:'tf', secEn:'Grammar', sec:'القواعد', groupEn:'Correct or has a mistake?', group:'صحيحة أم فيها خطأ؟', errCat:x.errCat || 'be_verb', x:x }; });
  (L.gC || []).forEach(function(x, i){ var tg = typingGroup(x); items['gC-' + i] = { type:'typing', secEn:'Grammar', sec:'القواعد', groupEn:x.groupEn || tg[0], group:x.group || tg[1], errCat:x.errCat || 'tense', x:x }; });
  (L.gD || []).forEach(function(x, i){ items['gD-' + i] = { type:'builder', secEn:'Grammar', sec:'القواعد', groupEn:'Put the words in order', group:'رتّب الكلمات', errCat:x.errCat || 'word_order', x:x }; });
  if (L.reading && L.reading.questions) {
    L.reading.questions.forEach(function(x, i){ items['rq-' + i] = x.tf ? { type:'rtf', secEn:'Reading', sec:'القراءة', groupEn:'Comprehension Questions', group:'أسئلة الفهم', errCat:x.errCat || 'reading', x:x } : { type:'mcq', secEn:'Reading', sec:'القراءة', groupEn:'Comprehension Questions', group:'أسئلة الفهم', errCat:x.errCat || 'reading', x:{ prompt:x.q, opts:x.opts, a:x.a, whyEn:x.whyEn, why:x.why, ev:x.ev, errCat:x.errCat || 'reading' } }; });
  }
  if (L.listening && L.listening.questions) {
    L.listening.questions.forEach(function(x, i){ items['lq-' + i] = x.tf ? { type:'rtf', secEn:'Listening', sec:'الاستماع', groupEn:'Listening Questions (2nd Listen)', group:'أسئلة الاستماع (الاستماع الثاني)', errCat:x.errCat || 'reading', x:x } : { type:'mcq', secEn:'Listening', sec:'الاستماع', groupEn:'Listening Questions (2nd Listen)', group:'أسئلة الاستماع (الاستماع الثاني)', errCat:x.errCat || 'reading', x:{ prompt:x.q, opts:x.opts, a:x.a, whyEn:x.whyEn, why:x.why, ev:x.ev, errCat:x.errCat || 'reading' } }; });
  }
  (L.quiz || []).forEach(function(x, i){ items['qz-' + i] = { type:'mcq', secEn:'Quiz', sec:'الاختبار', groupEn:'Lesson Quiz', group:'اختبار الدرس', errCat:x.errCat || (x.tag && x.tag.indexOf('Vocabulary') >= 0 ? 'vocab' : 'tense'), x:mcqOf(x) }; });
  return { IDS:ids, ITEMS:items, GCARDS:L.gCards || [], ALL_VOCAB:vocab, VOCAB_LIST:vocab.map(function(v){ return v.en; }).join(', ') };
}
/* عنوان تمرين الكتابة (gC): «اكتب الفعل» حين يكون التلميح فعلًا (visit · not / like)، وتسمية محايدة
   حين يكون تعليمة (capitalize: riyadh · care + ful · dish — plural). وللسؤال أن يضع groupEn / group بنفسه. */
function isVerbCue(x){ return !!x.verb && !/[:+—–]/.test(x.verb); }
function typingGroup(x){ return isVerbCue(x) ? ['Write the verb in the correct form', 'اكتب الفعل بالصيغة الصحيحة'] : ['Write the correct form', 'اكتب الصيغة الصحيحة']; }
function indexFor(lid){
  if (lid === curLessonId) return { IDS:IDS, ITEMS:ITEMS, ALL_VOCAB:ALL_VOCAB, GCARDS:GCARDS };
  if (!INDEX_CACHE[lid]) INDEX_CACHE[lid] = buildIndex(lessonData(lid));
  return INDEX_CACHE[lid];
}
function rebuildLessonIndex(){
  D = lessonData(curLessonId);
  var ix = buildIndex(D);
  IDS = ix.IDS; ITEMS = ix.ITEMS; GCARDS = ix.GCARDS; ALL_VOCAB = ix.ALL_VOCAB; VOCAB_LIST = ix.VOCAB_LIST;
  var rPart = partOf('reading');
  if (rPart) {
    if (D.listening && !D.reading) { rPart.en = 'Listening'; rPart.fullEn = 'Listening'; rPart.ar = 'الاستماع'; rPart.fullAr = 'الاستماع'; rPart.ic = 'speaker'; }
    else { rPart.en = 'Reading'; rPart.fullEn = 'Reading'; rPart.ar = 'القراءة'; rPart.fullAr = 'القراءة'; rPart.ic = 'mail'; }
  }
}

function itemText(it){ var x = it.x; return x.prompt || x.s || x.q || x.cueEn || (x.sentPre ? (x.sentPre + ' ___ ' + (x.sentPost || '')) : '') || ((x.pre || '') + ' ___ ' + (x.post || '')) || (Array.isArray(x.ans) ? x.ans[0] : x.ans) || ''; }

/* ---------- state ----------
   حالتان محفوظتان في الجهاز:
   - G (ep4.course): حالة الكورس كله: دفتر الأخطاء ومختبرها، ومراجعة الأفعال الشاذة،
     والوضع المختصر، ودقائق التدريب، وسجل كامبلي، واختبارات الوحدات والاختبارات القبلية،
     ودرس اليوم، وحالة الواجهة.
   - S (ep4.lesson.<id>): حالة درس واحد: إجاباته ومراحله وكتابته وبطاقاته وموضعه.
   كانت الحالتان شيئًا واحدًا لكل درس، فتبدأ الأخطاء والمراجعة من الصفر في كل درس جديد. */
var SR_DAYS = [1, 3, 7, 30];
var KEY_G = 'ep4.course', KEY_SYNC = 'ep4.sync', KEY_SYNC_META = 'ep4.syncmeta';
function KEY_L(id){ return 'ep4.lesson.' + id; }
function isObj(x){ return !!x && typeof x === 'object' && !Array.isArray(x); }
function readJSON(k){ try { var s = localStorage.getItem(k); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
function writeJSON(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function seedErrorLab(){
  var lab = {};
  (BASE.errorLabCatalog || []).forEach(function(cat){
    lab[cat.key] = { count: cat.seedCount || 1, solved: 0, box: 0, nextAt: 0, fromDiag: !!cat.fromDiag, lastSample: cat.wrongEx || '' };
  });
  return lab;
}
function GDEFAULT(){ return { v:4, updatedAt:0, startedAt:0, cur:null, ui:{ view:'home', welcomed:false, part:null, wordsTab:'vocab', irrGroup:'all', reviewTab:'lab' }, mistakes:{}, errorLab:seedErrorLab(), irrSr:{}, expressSessions:0, practiceMins:0, camblyLogs:[], unitTests:{}, preTests:{} }; }
function LDEFAULT(){ return { v:4, updatedAt:0, cards:{}, match:false, read1Done:false, listen1Done:false, ans:{}, stamps:{}, quiz:{ best:null, attempts:0, last:null }, writing:{ text:'', fb:null }, writingDone:false, predict:null, revealed:false, hl:false, step:{} }; }
function normalizeG(o){ var r = Object.assign(GDEFAULT(), isObj(o) ? o : {});
  ['mistakes','errorLab','irrSr','unitTests','preTests'].forEach(function(k){ if (!isObj(r[k])) r[k] = {}; });
  (BASE.errorLabCatalog || []).forEach(function(cat){
    if (!isObj(r.errorLab[cat.key])) r.errorLab[cat.key] = { count: cat.seedCount || 1, solved: 0, box: 0, nextAt: 0, fromDiag: !!cat.fromDiag, lastSample: cat.wrongEx || '' };
  });
  if (typeof r.expressSessions !== 'number' || r.expressSessions < 0) r.expressSessions = 0;
  if (typeof r.practiceMins !== 'number' || r.practiceMins < 0) r.practiceMins = 0;
  if (!Array.isArray(r.camblyLogs)) r.camblyLogs = [];
  var ui = Object.assign({ view:'home', welcomed:false, part:null, wordsTab:'vocab', irrGroup:'all', reviewTab:'lab' }, isObj(r.ui) ? r.ui : {});
  if (ui.wordsTab !== 'vocab' && ui.wordsTab !== 'irregular') ui.wordsTab = 'vocab';
  if (!ui.irrGroup) ui.irrGroup = 'all';
  if (ui.reviewTab !== 'lab' && ui.reviewTab !== 'notebook') ui.reviewTab = 'lab';
  if (['home','lessons','words','review','lesson','player'].indexOf(ui.view) < 0) ui.view = 'home';
  r.ui = ui; return r; }
function normalizeL(o){ var r = Object.assign(LDEFAULT(), isObj(o) ? o : {});
  ['cards','ans','stamps','step'].forEach(function(k){ if (!isObj(r[k])) r[k] = {}; });
  r.quiz = Object.assign({ best:null, attempts:0, last:null }, isObj(r.quiz) ? r.quiz : {});
  r.writing = Object.assign({ text:'', fb:null }, isObj(r.writing) ? r.writing : {});
  return r; }
function bumpErrorLab(catKey, sampleText){
  /* أخطاء المفردات وفهم المقروء ليست نمطًا نحويًا، فلا تُحسب في المختبر (كانت تُحسب خطأً في الأزمنة). */
  if (!catKey || catKey === 'vocab' || catKey === 'reading') return;
  var mapped = catKey === 'stative' ? 'tense' : catKey;
  if (!G.errorLab[mapped]) G.errorLab[mapped] = { count:0, solved:0, box:0, nextAt:0, fromDiag:false, lastSample:'' };
  G.errorLab[mapped].count = (G.errorLab[mapped].count || 0) + 1;
  G.errorLab[mapped].box = 0;
  G.errorLab[mapped].nextAt = Date.now();
  if (sampleText) G.errorLab[mapped].lastSample = sampleText;
}
var SYNC = createSync();
function saveLocal(){ writeJSON(KEY_G, G); writeJSON(KEY_L(curLessonId), S); }
function touch(){ var t = Date.now(); G.updatedAt = t; S.updatedAt = t; saveLocal(); SYNC.dirty(); }

/* بداية من الصفر: أول تشغيل لهذه النسخة يمسح التقدم التجريبي القديم ومفتاح المزامنة القديم. */
(function resetLegacyOnce(){
  try {
    if (localStorage.getItem(KEY_G)) return;
    var old = [];
    for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && (k.indexOf('english-passport.') === 0 || k.indexOf('gh_sync_') === 0)) old.push(k); }
    old.forEach(function(k){ localStorage.removeItem(k); });
  } catch (e) {}
})();

/* ترتيب الدروس في الكورس: قوائم unit0Lessons ثم unit1Lessons ثم unit2Lessons... بترتيب أرقامها،
   ويدخل منها كل درس مفتوح (open) له ملف محمّل. */
function courseOrder(){
  var lists = Object.keys(BASE).map(function(k){ var m = /^unit(\d+)Lessons$/.exec(k); return m ? { n:Number(m[1]), list:BASE[k] } : null; })
    .filter(Boolean).sort(function(a, b){ return a.n - b.n; });
  var all = []; lists.forEach(function(x){ all = all.concat(x.list || []); });
  return all.filter(function(l){ return l && l.id && l.open && typeof LESSONS !== 'undefined' && LESSONS[l.id]; }).map(function(l){ return l.id; });
}
function stampsOf(id){ var o = (id === curLessonId && S) ? S : readJSON(KEY_L(id)); return (o && isObj(o.stamps)) ? o.stamps : {}; }
function isLessonDone(id){ var st = stampsOf(id); return PARTS.every(function(p){ return !!st[p.k]; }); }
function lastStampAt(id){ var st = stampsOf(id), m = 0; Object.keys(st).forEach(function(k){ if (st[k] > m) m = st[k]; }); return m; }
function nextIncomplete(after){ var order = courseOrder(), i0 = after ? order.indexOf(after) + 1 : 0;
  for (var i = i0; i < order.length; i++) if (!isLessonDone(order[i])) return order[i];
  return null; }
function startOfToday(){ var d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); }
/* درس اليوم: آخر درس اخترته، فإن اكتمل في يوم سابق انتقل إلى الدرس الذي يليه. */
function pickTodayLesson(){
  var order = courseOrder(), cur = G.cur && order.indexOf(G.cur) >= 0 ? G.cur : null;
  if (!cur) return nextIncomplete(null) || order[0];
  if (isLessonDone(cur) && lastStampAt(cur) < startOfToday()) return nextIncomplete(cur) || cur;
  return cur;
}
function lessonTag(lid){ var m = /^u(\d+)l(\d+)$/.exec(lid || ''); if (!m) return String(lid || ''); return m[1] === '0' ? 'F' + m[2] : 'U' + m[1] + '·L' + m[2]; }
/* رقم وحدة الدرس من حقل unit في ملفه، وإلا من معرّفه (u0l3 → 0). الوحدة 0 هي الأسبوع التأسيسي،
   ورقمها falsy، فلا يُكتب له بديل بـ ||. */
function unitOfLesson(id){ var L = typeof LESSONS !== 'undefined' && LESSONS[id]; if (L && typeof L.unit === 'number') return L.unit; var m = /^u(\d+)l\d+$/.exec(id || ''); return m ? Number(m[1]) : 1; }
function arDigits(n){ return String(n).replace(/\d/g, function(d){ return '٠١٢٣٤٥٦٧٨٩'.charAt(Number(d)); }); }

var G = normalizeG(readJSON(KEY_G));
var S = null;
curLessonId = pickTodayLesson() || curLessonId;
G.cur = curLessonId;
rebuildLessonIndex();
S = normalizeL(readJSON(KEY_L(curLessonId)));

function selectLesson(id){
  if (!id || typeof LESSONS === 'undefined' || !LESSONS[id]) return false;
  if (curLessonId !== id) {
    saveLocal();
    curLessonId = id;
    M = null; M_POOL = null;
    rebuildLessonIndex();
    S = normalizeL(readJSON(KEY_L(curLessonId)));
  }
  G.cur = id;
  saveLocal();
  return true;
}
/* يعيد قراءة الحالة من الجهاز بعد استعادة نسخة احتياطية أو سحب تقدم من السحابة. */
function reloadState(keepUi){
  var ui = G && G.ui;
  G = normalizeG(readJSON(KEY_G));
  if (keepUi && ui) G.ui = ui;
  var order = courseOrder(), id = G.cur && order.indexOf(G.cur) >= 0 ? G.cur : pickTodayLesson();
  curLessonId = id || curLessonId; G.cur = curLessonId; INDEX_CACHE = {};
  M = null; M_POOL = null; P = null;
  rebuildLessonIndex();
  S = normalizeL(readJSON(KEY_L(curLessonId)));
}

/* ---------- Human Pronunciation (Wikimedia Commons + Oxford Learner's Dictionary, NO Robotic TTS) ---------- */
function findVocabEntry(wordOrObj){
  if (!wordOrObj) return null;
  if (typeof wordOrObj === 'object') return wordOrObj;
  var k = String(wordOrObj).toLowerCase().trim();
  return ALL_VOCAB.filter(function(v){ return v.en.toLowerCase() === k; })[0] || null;
}
function oxUrl(wordOrObj){
  var v = findVocabEntry(wordOrObj);
  var slug = v && v.oxfordSlug ? v.oxfordSlug : String(v ? v.en : (wordOrObj || '')).toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').split(/\s+/)[0];
  if (!slug) return 'https://www.oxfordlearnersdictionaries.com/';
  return 'https://www.oxfordlearnersdictionaries.com/definition/english/' + encodeURIComponent(slug);
}
function oxBtn(wordOrObj, label){
  var a = h('a', { class:'ox-link', href:oxUrl(wordOrObj), target:'_blank', rel:'noopener noreferrer', 'aria-label':(label || 'Oxford Dictionary') }, 'Oxford ↗');
  a.addEventListener('click', function(e){ e.stopPropagation(); });
  return a;
}
var AUDIO = {
  cache: {},
  player: null,
  resolveFile: function(file){
    if (AUDIO.cache[file]) return Promise.resolve(AUDIO.cache[file]);
    var api = 'https://commons.wikimedia.org/w/api.php?action=query&titles=File:' + encodeURIComponent(file) + '&prop=imageinfo&iiprop=url|derivatives&format=json&origin=*';
    var fallback = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(file);
    if (typeof fetch !== 'function') { AUDIO.cache[file] = fallback; return Promise.resolve(fallback); }
    return fetch(api).then(function(r){ return r.json(); }).then(function(d){
      var pages = d && d.query && d.query.pages;
      var k = pages && Object.keys(pages)[0];
      var ii = k && pages[k] && pages[k].imageinfo && pages[k].imageinfo[0];
      if (!ii) { AUDIO.cache[file] = fallback; return fallback; }
      var mp3 = (ii.derivatives || []).filter(function(x){ return /mp3/i.test(x.type || '') || /\.mp3$/i.test(x.src || ''); })[0];
      var url = (mp3 && mp3.src) || ii.url || fallback;
      AUDIO.cache[file] = url;
      return url;
    }).catch(function(){ AUDIO.cache[file] = fallback; return fallback; });
  },
  filesFor: function(target){
    var v = findVocabEntry(target);
    if (v) {
      if (Array.isArray(v.wikiFiles) && v.wikiFiles.length) return v.wikiFiles.slice();
      if (v.wikiFile) return [v.wikiFile];
    }
    if (typeof target === 'string') {
      var words = target.toLowerCase().trim().replace(/[^a-z\s-]/g, '').split(/\s+/).filter(Boolean);
      if (words.length >= 1 && words.length <= 4) {
        return words.map(function(w){ return 'En-us-' + w + '.ogg'; });
      }
    }
    return [];
  },
  playSeq: function(files, idx, onFail){
    if (idx >= files.length) return;
    AUDIO.resolveFile(files[idx]).then(function(url){
      try {
        if (AUDIO.player) { AUDIO.player.pause(); }
        var a = new Audio(url);
        AUDIO.player = a;
        a.onended = function(){ AUDIO.playSeq(files, idx + 1, onFail); };
        a.onerror = function(){ if (onFail) onFail(); };
        var p = a.play();
        if (p && typeof p.catch === 'function') p.catch(function(){ if (onFail) onFail(); });
      } catch (e) { if (onFail) onFail(); }
    });
  },
  play: function(target){
    var files = AUDIO.filesFor(target);
    if (!files.length) {
      toast('Open Oxford ↗ to hear pronunciation');
      return;
    }
    AUDIO.playSeq(files, 0, function(){
      toast('Audio requires internet or Oxford ↗');
    });
  }
};
function sayBtn(target, label, cls){
  var b = h('button', { class:'ib say ' + (cls || 'sm light'), type:'button', 'aria-label':label || 'Human Pronunciation' }, ico('speaker'));
  b.addEventListener('click', function(e){ e.stopPropagation(); AUDIO.play(typeof target === 'function' ? target() : target); });
  return b;
}

/* ---------- toast ---------- */
var toastT;
function toast(msg){ var t = $('#toast'); t.textContent = msg; t.hidden = false; t.classList.remove('in'); void t.offsetWidth; t.classList.add('in'); clearTimeout(toastT); toastT = setTimeout(function(){ t.hidden = true; }, 2600); }

/* ---------- progress ---------- */
function computeDone(){ function all(p){ return !IDS[p] || !IDS[p].length || IDS[p].every(function(id){ return !!S.ans[id]; }); }
  var readOrListenDone = (D.listening && !D.reading) ? all('lq') : all('rq');
  return {
    recall: all('rc'),
    vocab: !!S.match && all('vg'),
    grammar: all('gA') && all('gB') && all('gC') && all('gD'),
    reading: readOrListenDone,
    writing: !!S.writingDone,
    quiz: (S.quiz.best || 0) >= Math.ceil(D.quiz.length * 0.8)
  };
}
function updateProgress(){ var d = computeDone(), changed = false;
  PARTS.forEach(function(p){ if (d[p.k] && !S.stamps[p.k]) { S.stamps[p.k] = Date.now(); changed = true; } });
  if (changed) { touch(); SYNC.soon(); } updateNav(); }
function lessonProgress(){ var done = PARTS.filter(function(p){ return S.stamps[p.k]; }); var left = PARTS.filter(function(p){ return !S.stamps[p.k]; });
  return { done:done.length, total:PARTS.length, pct:Math.round(done.length / PARTS.length * 100), mins:left.reduce(function(a, p){ return a + p.min; }, 0), next:left[0] || null }; }
function lessonProgressOf(id){
  if (!id || id === curLessonId) return lessonProgress();
  var stObj = stampsOf(id);
  var done = PARTS.filter(function(p){ return !!stObj[p.k]; });
  var left = PARTS.filter(function(p){ return !stObj[p.k]; });
  return { done:done.length, total:PARTS.length, pct:Math.round(done.length / PARTS.length * 100), mins:left.reduce(function(a, p){ return a + p.min; }, 0), next:left[0] || null };
}
/* دفتر الأخطاء للكورس كله: المفتاح «الدرس|السؤال»، ويعود السؤال بعد يوم، ثم 3 أيام، ثم أسبوع، ثم شهر، ويخرج بعدها. */
function mkey(lid, id){ return lid + '|' + id; }
function itemFor(key){ var i = String(key).indexOf('|'); if (i < 0) return null; var lid = key.slice(0, i), id = key.slice(i + 1); if (typeof LESSONS === 'undefined' || !LESSONS[lid]) return null; return indexFor(lid).ITEMS[id] || null; }
function record(id, c, v){ if (S.ans[id]) return; S.ans[id] = { c:!!c, v:v };
  if (!c) { var t = Date.now(); G.mistakes[mkey(curLessonId, id)] = { lid:curLessonId, id:id, box:0, t:t, due:t + SR_DAYS[0] * 864e5 }; if (ITEMS[id]) bumpErrorLab(ITEMS[id].errCat || 'tense', itemText(ITEMS[id])); }
  touch(); updateProgress(); }
function allMistakeKeys(){ return Object.keys(G.mistakes).filter(function(k){ return !!itemFor(k); }).sort(function(a, b){ return (G.mistakes[a].due || 0) - (G.mistakes[b].due || 0); }); }
function mistakeIds(){ var now = Date.now(); return allMistakeKeys().filter(function(k){ return (G.mistakes[k].due || 0) <= now; }); }
function courseDay(){ return Math.max(0, Math.floor((Date.now() - (G.startedAt || Date.now())) / 864e5)); }

/* ---------- routing ---------- */
/* ثلاثة أقسام منذ 1 نوفمبر 2026: اليوم (الرئيسية وصفحة الدرس معًا)، والكورس، والتدريب (المراجعة والكلمات معًا).
   وتبقى مفاتيح الواجهات القديمة lesson وwords أسماءً بديلة: lesson تعرض «اليوم»، وwords تعرض «التدريب» على الكلمات. */
var TABS = [
  { k:'home', en:'Today', ar:'اليوم', ic:'home' },
  { k:'lessons', en:'Course', ar:'الكورس', ic:'book' },
  { k:'review', en:'Practice', ar:'التدريب', ic:'review' }
];
var P = null;
function go(view){ G.ui.view = view; if (view !== 'player') { P = null; G.ui.part = null; } saveLocal(); render(); try { window.scrollTo(0, 0); } catch (e) {} }
function render(){
  hideDict(); var v = G.ui.view; if (!G.ui.welcomed) v = 'welcome';
  if (v === 'lesson') { v = G.ui.view = 'home'; }
  if (v === 'words') { G.ui.practiceTab = G.ui.wordsTab === 'irregular' ? 'verbs' : 'words'; v = G.ui.view = 'review'; }
  var isTab = TABS.some(function(t){ return t.k === v; });
  $('#nav').hidden = !isTab;
  var view = v === 'welcome' ? vWelcome() : v === 'home' ? vHome() : v === 'lessons' ? vLessons() : v === 'words' ? vWords() : v === 'review' ? vReview() : v === 'lesson' ? vLesson() : vPlayer();
  put($('#screen'), view); updateNav(); }
function updateNav(){ var nav = $('#nav'), n = mistakeIds().length;
  put(nav, TABS.map(function(t){ var on = G.ui.view === t.k;
    return h('button', { class:'nav-it' + (on ? ' on' : ''), type:'button', 'aria-label':t.en, 'aria-current':on ? 'page' : null, on:{ click:function(){ go(t.k); } } },
      ico(t.ic), h('span', { class:'lbl' }, t.en), (t.k === 'review' && n && !on) ? h('span', { class:'nav-dot', 'aria-hidden':'true' }) : null); })); }

/* ---------- welcome ---------- */
function vWelcome(){
  return h('section', { class:'wel' },
    h('div', { class:'wel-art', html:WELCOME_SVG }),
    h('div', { class:'wel-txt gut' },
      h('p', { class:'wel-lbl' }, biNode('English Course', 'كورس الإنجليزية')),
      h('h1', { class:'bi-h' }, h('span', { class:'en', dir:'ltr' }, 'Your English Journey Starts Here'), h('small', {}, 'رحلتك في الإنجليزية تبدأ هنا')),
      h('p', {}, biNode('Short daily lessons built for your level and goals in study and work.', 'دروس قصيرة كل يوم، مبنية على مستواك وهدفك في الدراسة والعمل.'))),
    h('div', { class:'wel-cta gut' }, h('button', { class:'btn', type:'button', on:{ click:function(){ G.ui.welcomed = true; if (!G.startedAt) G.startedAt = Date.now(); touch(); go('home'); } } }, biBtn("Let's Start", 'لنبدأ'))));
}

/* ---------- today: progress and place first, then today's lesson (تصميم 1 نوفمبر 2026) ----------
   الرئيسية تجمع ما كان في الرئيسية وصفحة الدرس: رحلتك ومكانك، ثم مراحل درس اليوم وزر البدء، ثم الأدوات. */
function header(){ var d = courseDay(), wk = Math.min(32, Math.floor(d / 7) + 1);
  return h('header', { class:'hd' },
    h('p', { class:'hd-week' }, 'Week ' + wk + ' · Day ' + (d + 1)),
    h('button', { class:'ib', id:'gearBtn', type:'button', 'aria-label':'Settings and plan', on:{ click:openPlan } }, ico('gear'), SYNC.hasProblem() ? h('span', { class:'sync-dot', 'aria-hidden':'true' }) : null));
}
function unitList(u){ return (u === 0 ? D.unit0Lessons : D['unit' + u + 'Lessons']) || []; }
function unitTitle(u){ if (u === 0) return 'Foundation Week'; var x = (D.units || []).filter(function(y){ return y.n === u; })[0]; return x ? x.en : 'Unit ' + u; }
function a2LessonTotals(){
  var total = 0;
  [0].concat((D.units || []).map(function(u){ return u.n; })).forEach(function(u){
    var n = unitList(u).filter(function(l){ return l && !l.test; }).length; total += n || 5; });
  return { total:total, done:courseOrder().filter(isLessonDone).length };
}
function activePatternCount(){ return sortedErrorLabCats().filter(function(c){ var s = G.errorLab[c.key]; return s && (s.count || 0) > (s.solved || 0); }).length; }
function journeyCard(){
  var st = computeDashboardStats(), tot = a2LessonTotals(), u = unitOfLesson(curLessonId);
  var lessons = unitList(u).filter(function(l){ return l && !l.test; }), me = lessons.filter(function(l){ return l.id === curLessonId; })[0];
  var a2Pct = tot.total ? Math.round(tot.done / tot.total * 100) : 0;
  var stages = [['A2', 'now'], ['B1', ''], ['B2', ''], ['C1', 'IELTS']];
  function stat(v, l){ return h('div', { class:'jr-stat' }, h('b', { dir:'ltr' }, v), h('span', {}, l)); }
  return h('section', { class:'jr', 'aria-label':'Your journey' },
    h('div', { class:'jr-top' },
      h('span', { class:'jr-lbl' }, 'Your journey'),
      h('button', { class:'jr-more', type:'button', on:{ click:openDashboard } }, ico('chart'), 'Progress')),
    h('div', { class:'jr-track', role:'img', 'aria-label':'You are in stage A2. Next come B1, B2 and C1.' }, stages.map(function(s, i){
      return h('div', { class:'jr-seg' + (i === 0 ? ' on' : '') },
        h('span', { class:'jr-bar' }, i === 0 ? h('i', { style:'width:' + Math.max(4, a2Pct) + '%' }) : null),
        h('span', { class:'jr-st' }, s[0] + (s[1] ? ' · ' + s[1] : ''))); })),
    h('p', { class:'jr-place' }, (u === 0 ? '' : 'Unit ' + u + ' · ') + unitTitle(u)),
    h('p', { class:'jr-sub' }, me ? 'Lesson ' + me.n + ' of ' + lessons.length : 'Your current lesson'),
    h('div', { class:'jr-stats' },
      stat(tot.done + '/' + tot.total, 'A2 lessons'),
      stat(st.hoursStr + '/' + st.a2TargetHrs + 'h', 'Study hours'),
      stat(String(activePatternCount()), 'Mistakes to fix')));
}
function firstSentence(s){ s = String(s || ''); var m = /^(.+?[.!?])(\s|$)/.exec(s); return m ? m[1] : s; }
function todayLesson(){
  var pr = lessonProgress(), cur = pr.next, u = unitOfLesson(curLessonId);
  var me = unitList(u).filter(function(l){ return l && l.id === curLessonId; })[0] || {};
  var done = pr.done === pr.total, nextId = done ? nextIncomplete(curLessonId) : null;
  var head = h('div', { class:'td-head' },
    h('div', { class:'td-txt' },
      h('p', { class:'td-lbl' }, (u === 0 ? 'Foundation Week' : 'Unit ' + u) + (me.n ? ' · Lesson ' + me.n : '')),
      h('h1', { class:'td-title' }, me.en || D.en || ''),
      h('p', { class:'td-sub' }, String(D.subEn || me.subEn || '').replace(/^Foundation \d+ · /, '') + (pr.mins ? ' · ' + pr.mins + ' min' + (pr.done ? ' left' : '') : ''))),
    penguin(54, 77, 'td-peng'));
  var doneCard = done ? h('div', { class:'tp-donecard' },
    h('b', {}, 'Lesson complete'),
    h('p', {}, nextId ? 'Your next lesson is ready.' : 'You finished every lesson built so far.'),
    h('div', { class:'tp-acts' },
      nextId ? h('button', { class:'btn sm', type:'button', on:{ click:function(){ selectLesson(nextId); render(); } } }, 'Next lesson', ico('fwd')) : null,
      h('button', { class:'btn sm light', type:'button', on:{ click:function(){ openPart('recall'); } } }, 'Review from start'))) : null;
  var path = h('ol', { class:'tpath' }, PARTS.map(function(p, i){
    var isDone = !!S.stamps[p.k], isCur = !!cur && cur.k === p.k, info = (D.intro && D.intro[p.k]) || {};
    if (isCur) return h('li', { class:'tp cur' },
      h('span', { class:'tp-n' }, String(i + 1)),
      h('div', { class:'tp-card' },
        h('div', { class:'tp-row' }, h('b', {}, p.fullEn), h('span', {}, p.min + ' min')),
        info.dEn ? h('p', { class:'tp-line' }, firstSentence(info.dEn)) : null,
        h('button', { class:'btn pstep cur', type:'button', on:{ click:function(){ openPart(p.k); } } }, pr.done ? 'Continue' : 'Start', ico('fwd'))));
    return h('li', { class:'tp' + (isDone ? ' done' : '') },
      h('button', { class:'tp-btn pstep' + (isDone ? ' done' : ''), type:'button', 'aria-label':p.fullEn + (isDone ? ', done' : ''), on:{ click:function(){ openPart(p.k); } } },
        h('span', { class:'tp-n' }, isDone ? ico('check') : String(i + 1)),
        h('span', { class:'tp-name' }, p.fullEn),
        h('span', { class:'tp-min' }, isDone ? 'Done' : p.min + ' min')));
  }));
  return [head, doneCard, path];
}
/* اختبار الوحدة يظهر في الرئيسية حين يُفتح (بعد اكتمال دروس الوحدة)، والاختبار المصغر حين يستحق. */
function unitTestBanner(){
  var u = unitOfLesson(curLessonId), ut = unitTestOf(u);
  if (!ut || !unitLessonsDone(u)) return null;
  var st = (G.unitTests && G.unitTests[u]) || {};
  if (st.status === 'mastered' && !st.miniQuizDue) return null;
  var name = u === 0 ? 'Foundation Week test' : 'Unit ' + u + ' test';
  return h('div', { class:'tbanner' },
    h('span', { class:'tb-ic' }, ico('trophy')),
    h('div', { class:'tb-t' },
      h('b', {}, st.miniQuizDue ? 'Mini follow-up quiz is due' : st.status ? name + ': aim for mastery' : name + ' is ready'),
      h('span', {}, ut.legalCorner ? 'Includes the legal corner' : 'Questions you have not seen before')),
    h('button', { class:'btn sm', type:'button', on:{ click:function(){ openSession((st.miniQuizDue ? 'unitMini:' : 'unitTest:') + u); } } }, 'Open'));
}
function todayTools(){
  return h('div', { class:'tools' },
    h('button', { class:'tool', type:'button', on:{ click:function(){ openSession('express'); } } }, ico('clock'), h('span', {}, 'Express 15 min')),
    h('button', { class:'tool', type:'button', on:{ click:openCambly } }, ico('chat'), h('span', {}, 'Cambly card')),
    SAMPLE
      ? h('button', { class:'tool', type:'button', on:{ click:openAsk } }, ico('help'), h('span', {}, 'Ask the teacher'))
      : h('button', { class:'tool', type:'button', on:{ click:openAbout } }, ico('dots'), h('span', {}, 'About lesson')));
}
function vHome(){
  return h('section', { class:'scr gut today' }, header(), journeyCard(), todayLesson(), unitTestBanner(), todayTools());
}
function vLesson(){ return vHome(); }

/* ---------- course: units as one journey line, with unit tests and pre-tests ---------- */
function stageTrack(){
  var stages = [['A2', 'now'], ['B1', ''], ['B2', ''], ['C1', 'IELTS']];
  return h('div', { class:'jr-track light', role:'img', 'aria-label':'You are in stage A2. Next come B1, B2 and C1.' }, stages.map(function(s, i){
    return h('div', { class:'jr-seg' + (i === 0 ? ' on' : '') }, h('span', { class:'jr-bar' }), h('span', { class:'jr-st' }, s[0] + (s[1] ? ' · ' + s[1] : ''))); }));
}
/* سطر اختبار الوحدة: مقفل حتى تُبنى دروس الوحدة كلها وتكتمل، ثم يفتح جلسة unitTest:<u>.
   ولا يظهر سطر للأسبوع التأسيسي ما دام D.unitTests[0] غير موجود. وأسماء الأصناف u0-test وu-test يعتمدها الاختبار الشامل. */
function unitTestRow(u, l){
  var ut = unitTestOf(u);
  if (!ut && !l) return null;
  var st = (G.unitTests && G.unitTests[u]) || {}, open = !!ut && unitLessonsDone(u);
  var mPct = (ut && ut.masteryPct) || 90, pPct = (ut && ut.passPct) || 80;
  var title = (l && l.en) || (ut && ut.titleEn) || 'Unit test';
  var cls = 'cl-row ' + (u === 0 ? 'u0-test' : 'u-test');
  var sub = open ? (st.status === 'mastered' ? 'Mastered (' + mPct + '%+)' : st.status === 'passed' ? 'Passed (' + pPct + '%+). Aim for ' + mPct + '%' : 'Goal ' + mPct + '% · pass ' + pPct + '%') + (ut && ut.legalCorner ? ' · legal corner' : '')
    : 'Opens after the unit lessons';
  var body = [h('span', { class:'cl-n' + (open ? '' : ' lk') }, open ? ico('trophy') : ico('lock')), h('span', { class:'cl-t' }, h('b', {}, title), h('small', {}, sub))];
  if (!open) return h('li', {}, h('div', { class:cls + ' locked', 'aria-disabled':'true' }, body));
  return h('li', {},
    h('button', { class:cls, type:'button', on:{ click:function(){ openSession('unitTest:' + u); } } }, body, h('span', { class:st.status ? 'chip-done' : 'chip-now' }, st.status ? (st.status === 'mastered' ? 'Mastered' : 'Passed') : 'Open')),
    st.miniQuizDue ? h('button', { class:'btn sm out cl-mini', type:'button', on:{ click:function(){ openSession('unitMini:' + u); } } }, ico('review'), 'Mini follow-up quiz') : null);
}
function unitHasList(u){ var list = D['unit' + u + 'Lessons']; return Array.isArray(list) && list.length > 0; }
function currentUnit(){
  var u = unitOfLesson(G.cur || curLessonId);
  if (u >= 1 && unitHasList(u)) return u;
  var next = (D.units || []).filter(function(x){ return x && x.open && x.n >= 1 && unitHasList(x.n) && !unitLessonsDone(x.n); })[0];
  return next ? next.n : 1;
}
function preTestBox(u){
  if (!(D.preTests && D.preTests[u.n])) return null;
  var rec = ptRecValid(u.n), first = rec && rec.first, pct = first ? ptPct(first.sc, first.n) : 0, exempt = !!(first && ptExemptOK(first.sc, first.n));
  return h('div', { class:'cl-pre' },
    h('span', { class:exempt ? 'exempt-chip' : 'pre-chip' }, exempt ? 'Exempted (' + pct + '%) · it returns in the review week' : first ? 'First attempt: ' + pct + '% · you study it when you get there' : 'Pre-Test Available · the first attempt decides'),
    h('button', { class:'btn sm' + (first ? ' out' : ''), type:'button', on:{ click:function(){ openSession('pretest:' + u.n); } } }, first ? 'Practice' : 'Pre-Test', ico('fwd')));
}
function unitNode(u, openN){
  var isOpen = u.n === 0 || !!u.open, list = unitList(u.n), lessons = list.filter(function(l){ return l && !l.test; });
  var doneN = lessons.filter(function(l){ return l.open && l.id && isLessonDone(l.id); }).length;
  var sub = (u.gEn || '') + (isOpen ? ' · ' + lessons.length + ' lessons' : ' · coming soon');
  var node = h('span', { class:'u-n' + (isOpen ? '' : ' lk') }, String(u.n));
  function toggle(){ G.ui.openUnit = openN === u.n ? -1 : u.n; saveLocal(); render(); }
  if (!isOpen) return h('li', { class:'tl-it' + (D.preTests && D.preTests[u.n] ? ' u-card-wrap' : '') },
    node, h('div', { class:'tl-main' }, h('div', { class:'tl-row locked' }, h('span', { class:'tl-t' }, h('b', {}, u.en), h('small', {}, sub)), ico('lock')), preTestBox(u)));
  if (openN !== u.n) return h('li', { class:'tl-it' }, node,
    h('button', { class:'tl-row', type:'button', 'aria-expanded':'false', on:{ click:toggle } },
      h('span', { class:'tl-t' }, h('b', {}, u.en), h('small', {}, sub)),
      h('span', { class:'tl-prog' }, doneN + '/' + lessons.length), ico('down')));
  var rows = list.map(function(l){
    if (l.test) return unitTestRow(u.n, l);
    var done = l.open && l.id && isLessonDone(l.id), isNext = l.id === curLessonId && !done;
    if (!l.open) return h('li', {}, h('div', { class:'cl-row locked' }, h('span', { class:'cl-n lk' }, ico('lock')), h('span', { class:'cl-t' }, h('b', {}, l.en), h('small', {}, 'Coming soon'))));
    return h('li', {}, h('button', { class:'cl-row' + (isNext ? ' next' : ''), type:'button', on:{ click:function(){ if (l.id) selectLesson(l.id); go('home'); } } },
      h('span', { class:'cl-n' + (done ? ' ok' : '') }, done ? ico('check') : String(l.n)),
      h('span', { class:'cl-t' }, h('b', {}, l.en), l.subEn ? h('small', {}, l.subEn) : null),
      isNext ? h('span', { class:'chip-next' }, 'Next') : done ? null : ico('chev')));
  });
  if (u.n === 0 && !list.some(function(l){ return l && l.test; })) rows.push(unitTestRow(0, null));
  return h('li', { class:'tl-it open' }, h('span', { class:'u-n on' }, String(u.n)),
    h('div', { class:'tl-card' },
      h('button', { class:'tl-head', type:'button', 'aria-expanded':'true', on:{ click:toggle } },
        h('span', { class:'tl-t' }, h('b', {}, u.en), h('small', {}, u.gEn || '')),
        h('span', { class:'tl-prog' }, doneN + '/' + lessons.length), ico('up')),
      h('ol', { class:'cl-list' }, rows)));
}
function vLessons(){
  var openN = G.ui.openUnit != null && G.ui.openUnit !== '' ? Number(G.ui.openUnit) : unitOfLesson(curLessonId);
  var all = [{ n:0, en:'Foundation Week', gEn:'be and do · was and were · agreement', open:true }].concat(D.units || []);
  var lastOpen = all.filter(function(u){ return u.n === 0 || u.open; }).map(function(u){ return u.n; }).pop() || 0;
  var cut = lastOpen + 3, showAll = !!G.ui.allUnits;
  var shown = showAll ? all : all.filter(function(u){ return u.n <= cut; }), rest = all.filter(function(u){ return u.n > cut; });
  var restPre = rest.filter(function(u){ return D.preTests && D.preTests[u.n]; }).length;
  return h('section', { class:'scr gut course' },
    h('div', { class:'pg-top' },
      h('h1', { class:'h1' }, 'Course'),
      h('button', { class:'pill-btn', type:'button', on:{ click:openDashboard } }, ico('chart'), 'Progress')),
    stageTrack(),
    h('ol', { class:'tl' }, shown.map(function(u){ return unitNode(u, openN); }),
      (!showAll && rest.length) ? h('li', { class:'tl-it' }, h('span', { class:'u-n lk' }, '+'),
        h('button', { class:'tl-row', type:'button', on:{ click:function(){ G.ui.allUnits = true; saveLocal(); render(); } } },
          h('span', { class:'tl-t' }, h('b', {}, 'Units ' + rest[0].n + ' to ' + rest[rest.length - 1].n), h('small', {}, rest.length + ' units' + (restPre ? ' · ' + restPre + ' pre-test' + (restPre > 1 ? 's' : '') + ' available' : ''))), ico('down'))) : null));
}

/* ---------- practice: mistakes, lesson phrases and irregular verbs together ---------- */
var POS_AR = { noun:'اسم', verb:'فعل', adjective:'صفة', adverb:'ظرف', 'legal phrase':'عبارة قانونية' };
function irrStatus(base){
  var st = G.irrSr && G.irrSr[base];
  if (!st || !st.box) return { st:'new', lbl:'New', due:true, days:0 };
  var due = !st.nextAt || Date.now() >= st.nextAt;
  var d = SR_DAYS[Math.min(SR_DAYS.length - 1, st.box - 1)];
  return { st: st.box >= 3 ? 'k' : 'r', lbl: due ? ('Due (+' + d + 'd)') : ('In ' + d + 'd'), due:due, days:d, box:st.box };
}
function sortedErrorLabCats(){
  var cats = (D.errorLabCatalog || []).slice();
  return cats.sort(function(a, b){
    var sa = G.errorLab[a.key] || { count:0, solved:0 };
    var sb = G.errorLab[b.key] || { count:0, solved:0 };
    return ((sb.count || 0) - (sb.solved || 0)) - ((sa.count || 0) - (sa.solved || 0));
  });
}
function practiceMistakes(){
  var cats = sortedErrorLabCats(), all = allMistakeKeys(), list = mistakeIds();
  var patterns = h('div', { class:'card plist' }, cats.map(function(cat){
    var st = G.errorLab[cat.key] || { count:cat.seedCount || 1, solved:0, box:0, fromDiag:true };
    var net = Math.max(0, (st.count || 0) - (st.solved || 0));
    var srDay = st.box > 0 ? SR_DAYS[Math.min(SR_DAYS.length - 1, st.box - 1)] : 1;
    return h('details', { class:'pat' },
      h('summary', {}, h('span', { class:'pat-t' }, cat.en), net > 0 ? h('span', { class:'p-chip' }, st.count + '×') : h('span', { class:'p-chip ok' }, 'Practiced · +' + srDay + 'd'), ico('down')),
      h('div', { class:'pat-body' },
        h('div', { class:'elab-ex' }, h('span', { class:'no' }, st.lastSample || cat.wrongEx), h('span', { class:'yes' }, cat.rightEx)),
        h('p', { class:'elab-rule' }, cat.ruleEn),
        h('div', { class:'pat-acts' },
          h('button', { class:'btn sm', type:'button', on:{ click:function(){ openSession('errlab:' + cat.key); } } }, 'New drill', ico('fwd')),
          arReveal(cat.ruleAr, false))));
  }));
  function dueChip(m){ var left = (m.due || 0) - Date.now();
    if (left <= 0) return h('span', { class:'rv-due now' }, 'Due');
    return h('span', { class:'rv-due' }, 'In ' + Math.max(1, Math.ceil(left / 864e5)) + 'd'); }
  var notebook = !all.length
    ? h('div', { class:'card nb-empty' }, h('span', { class:'cl-n' }, ico('mark')),
        h('span', { class:'cl-t' }, h('b', {}, 'Mistake notebook is empty'), h('small', {}, 'Questions you miss come back here after 1 day, 3 days, a week and a month.')))
    : [h('div', { class:'rv-hero', id:'nbHero' },
        h('div', {}, h('span', { class:'rv-n' }, String(list.length)), h('span', { class:'rv-l' }, list.length ? 'Questions due today' : 'Nothing due today')),
        list.length ? h('button', { class:'btn light sm', type:'button', on:{ click:function(){ openSession('review'); } } }, 'Start review', ico('fwd')) : null),
      h('div', { class:'rv-list' }, all.map(function(key){ var it = itemFor(key), m = G.mistakes[key];
        return h('div', { class:'rv-row' },
          h('div', { class:'rv-q' }, h('span', {}, lessonTag(m.lid) + ' · ' + (it.secEn || it.sec)), h('p', {}, itemText(it))),
          dueChip(m),
          h('span', { class:'streak', 'aria-label':'Review step ' + (m.box || 0) + ' of 4' }, [0, 1, 2, 3].map(function(i){ return h('i', { class:(m.box || 0) > i ? 'on' : '' }); }))); }))];
  return [h('p', { class:'sec-lbl' }, 'Your mistake patterns'), patterns, h('p', { class:'sec-lbl' }, 'Mistake notebook'), notebook];
}
function practiceWords(){
  var k = 0, r = 0;
  ALL_VOCAB.forEach(function(v){ if (S.cards[v.en] === 'k') k++; else if (S.cards[v.en] === 'r') r++; });
  return [h('p', { class:'p-sum' }, k + ' known · ' + r + ' to review · ' + (ALL_VOCAB.length - k - r) + ' new'), h('div', { class:'card wlist' }, ALL_VOCAB.map(function(v){ var st = S.cards[v.en];
      return h('details', { class:'wrow' },
        h('summary', {}, h('span', { class:'w-st' + (st ? ' ' + st : ''), 'aria-hidden':'true' }),
          sayBtn(v, 'Play ' + v.en),
          h('span', { class:'w-en' },
            h('b', {}, v.en),
            h('span', {}, v.isLegal ? 'legal phrase · ' : (v.pos + ' · '), h('span', { class:'w-ar', dir:'rtl', lang:'ar' }, v.ar))),
          oxBtn(v)),
        h('div', { class:'w-more' },
          v.isLegal ? h('span', { class:'legal-badge' }, 'Legal track') : null,
          h('p', { class:'w-ex' }, v.ex),
          v.exAr ? h('p', { class:'w-exar' }, v.exAr) : null,
          v.tipEn ? h('p', { class:'w-tip-en' }, v.tipEn) : null,
          arReveal(v.tip, false)));
    })),
    h('button', { class:'link credits', type:'button', on:{ click:openCredits } }, 'Audio credits')];
}
function practiceVerbs(){
  var verbs = D.irregularVerbs || [], mastered = 0, learning = 0, dueCnt = 0;
  verbs.forEach(function(v){ var s = irrStatus(v.base); if (s.st === 'k') mastered++; else if (s.st === 'r') learning++; if (s.due) dueCnt++; });
  var curG = G.ui.irrGroup || 'all';
  var filtered = curG === 'all' ? verbs : verbs.filter(function(v){ return v.g === curG; });
  return [
    h('p', { class:'p-sum' }, mastered + ' mastered · ' + learning + ' learning · ' + dueCnt + ' due'),
    h('button', { class:'btn', type:'button', on:{ click:function(){ openSession('irregular'); } } }, ico('pen'), 'Practice irregular verbs'),
    h('div', { class:'pills' }, (D.irregularGroups || []).map(function(g){
      return h('button', { class:'pill-b' + (curG === g.k ? ' on' : ''), type:'button', on:{ click:function(){ G.ui.irrGroup = g.k; saveLocal(); render(); } } }, g.en);
    })),
    h('div', { class:'card wlist' }, filtered.map(function(v){
      var st = irrStatus(v.base);
      return h('details', { class:'wrow' },
        h('summary', {},
          h('span', { class:'w-st' + (st.st !== 'new' ? ' ' + st.st : ''), 'aria-hidden':'true' }),
          sayBtn(v.base, 'Play ' + v.base),
          h('span', { class:'w-en' }, h('b', {}, v.base + ' → ' + v.past + ' → ' + v.pp), h('span', {}, h('span', { class:'w-ar', dir:'rtl', lang:'ar' }, v.ar), ' · ' + st.lbl)),
          oxBtn(v.base)),
        h('div', { class:'w-more' },
          h('div', { class:'irr-forms' },
            h('div', { class:'irr-f' }, h('small', {}, 'Base'), h('b', {}, v.base)),
            h('div', { class:'irr-f' }, h('small', {}, 'Past'), h('b', {}, v.past)),
            h('div', { class:'irr-f' }, h('small', {}, 'Participle'), h('b', {}, v.pp)))));
    }))];
}
function vReview(){
  var tab = G.ui.practiceTab || 'mistakes';
  var k = 0, r = 0;
  ALL_VOCAB.forEach(function(v){ if (S.cards[v.en] === 'k') k++; else if (S.cards[v.en] === 'r') r++; });
  var n = ALL_VOCAB.length - k - r, active = activePatternCount(), due = mistakeIds().length;
  function setTab(t){ return function(){ G.ui.practiceTab = t; G.ui.wordsTab = t === 'verbs' ? 'irregular' : 'vocab'; saveLocal(); render(); }; }
  var segBtn = function(t, label){ return h('button', { class:'seg-b' + (tab === t ? ' on' : ''), type:'button', role:'tab', 'aria-selected':tab === t ? 'true' : 'false', on:{ click:setTab(t) } }, label); };
  return h('section', { class:'scr gut practice' },
    h('h1', { class:'h1' }, 'Practice'),
    h('div', { class:'p-cards' },
      h('div', { class:'p-card dark', id:'elabHero' },
        h('span', { class:'p-lbl' }, 'Mistakes'),
        h('b', { class:'p-big' }, String(active || (D.errorLabCatalog || []).length)),
        h('span', { class:'p-sub' }, 'patterns to fix' + (due ? ' · ' + due + ' due' : '')),
        h('button', { class:'btn sm', type:'button', on:{ click:function(){ openSession('errlab'); } } }, 'Practice')),
      h('div', { class:'p-card' },
        h('span', { class:'p-lbl' }, 'Words'),
        h('b', { class:'p-big' }, String(r || n)),
        h('span', { class:'p-sub' }, r ? 'hard words to review' : 'new phrases'),
        h('button', { class:'btn sm out', type:'button', on:{ click:function(){ openSession('cards'); } } }, r ? 'Review hard words' : 'Flashcards'))),
    h('div', { class:'seg three', role:'tablist', 'aria-label':'Practice view' },
      segBtn('mistakes', 'Mistakes'), segBtn('words', 'Words · ' + ALL_VOCAB.length), segBtn('verbs', 'Verbs · ' + (D.irregularVerbs || []).length)),
    tab === 'words' ? practiceWords() : tab === 'verbs' ? practiceVerbs() : practiceMistakes());
}
function vWords(){ return vReview(); }

/* ---------- reading markup ---------- */
function parseMarkup(s){ return s
  .replace(/<<([sct]):(.+?)>>/g, function(_, k, t){ return '<span class="p' + k + '">' + t + '</span>'; })
  .replace(/\{([^}|]+)(?:\|([^}]+))?\}/g, function(_, t, k){ return '<span class="w core" role="button" tabindex="0" data-k="' + esc((k || t).toLowerCase()) + '">' + t + '</span>'; })
  .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, function(_, t, ar){ return '<span class="w gl" role="button" tabindex="0" data-en="' + esc(t) + '" data-ar="' + esc(ar) + '">' + t + '</span>'; }); }
function stripMarkup(s){ return s
  .replace(/<<[sct]:(.+?)>>/g, '$1')
  .replace(/\{([^}|]+)(?:\|[^}]+)?\}/g, '$1')
  .replace(/\[\[([^\]|]+)\|[^\]]+\]\]/g, '$1'); }
function emailBody(plain){
  return h('div', { class:'mail-body' + (plain ? ' mail-plain' : ''), dir:'ltr', html:D.reading.paras.map(function(p){ return '<p>' + (plain ? stripMarkup(p) : parseMarkup(p)) + '</p>'; }).join('') });
}
/* رأس الإيميل: الصورة (reading.art) وسطر المرسل (reading.fromMeta) من الدرس نفسه؛
   ودرس بلا صورة لا صورة له، وبلا fromMeta يظهر اسم المرسل وحده. */
function mailHead(r){ return [
  r.art ? h('div', { class:'mail-art', html:r.art }) : null,
  h('div', { class:'mail-meta' }, h('div', {}, h('span', { class:'k' }, 'FROM'), r.fromMeta || r.from || ''), h('div', {}, h('span', { class:'k' }, 'TO'), r.to), h('div', {}, h('span', { class:'k' }, 'SUBJECT'), h('span', { class:'subj' }, r.title)))]; }
/* عدد كلمات نص القراءة بعد حذف علامات التلوين والوسوم. */
function readingWords(r){ var t = ((r && r.paras) || []).map(function(p){ return stripMarkup(String(p)).replace(/<[^>]*>/g, ' '); }).join(' ');
  return (t.match(/[A-Za-z0-9]+(?:['’][A-Za-z]+)*/g) || []).length; }
/* هدف مؤقت القراءة الأولى: targetSeconds من الدرس، وإلا نحو 100 كلمة في الدقيقة مقرّبًا إلى 10 ثوانٍ. */
function readingTarget(r){ var t = Number(r && r.targetSeconds); return t > 0 ? Math.round(t) : Math.max(30, Math.round(readingWords(r) * 0.6 / 10) * 10); }
function arMinutes(n){ return n === 1 ? 'دقيقة' : n === 2 ? 'دقيقتين' : arDigits(n) + (n <= 10 ? ' دقائق' : ' دقيقة'); }
var dictT;
function showWord(el){ var en, ar, tag = '', v = null;
  if (el.classList.contains('core')) { v = ALL_VOCAB.filter(function(x){ return String(x.en || '').toLowerCase() === el.getAttribute('data-k'); })[0]; en = v ? v.en : el.textContent; ar = v ? v.ar : ''; tag = v ? ('Lesson word · ' + v.pos) : ''; }
  else { en = el.getAttribute('data-en') || el.textContent; ar = el.getAttribute('data-ar') || ''; }
  $('#dEn').textContent = en; $('#dAr').textContent = ar; $('#dTag').textContent = tag; $('#dTag').hidden = !tag;
  var dOx = $('#dOx'); if (dOx) dOx.href = oxUrl(v || en);
  $('#dSay').onclick = function(){ AUDIO.play(v || en); };
  $$('.w.on').forEach(function(x){ x.classList.remove('on'); }); el.classList.add('on');
  $('#dict').hidden = false; clearTimeout(dictT); dictT = setTimeout(hideDict, 7000); }
function hideDict(){ var d = $('#dict'); if (d) d.hidden = true; $$('.w.on').forEach(function(x){ x.classList.remove('on'); }); }

/* ---------- player (6 Stages) ---------- */
function stepsFor(k){
  function items(ids){ return (ids || []).map(function(id){ return { t:'item', id:id }; }); }
  if (k === 'recall') return [{ t:'intro', k:k }].concat(items(IDS.rc), [{ t:'done', k:k }]);
  if (k === 'vocab') return [{ t:'intro', k:k }].concat(ALL_VOCAB.map(function(_, i){ return { t:'flash', i:i }; }), [{ t:'match' }], items(IDS.vg), [{ t:'done', k:k }]);
  if (k === 'grammar') return [{ t:'intro', k:k }].concat(GCARDS.map(function(_, i){ return { t:'explain', i:i }; }), items(IDS.gA), items(IDS.gB), items(IDS.gC), items(IDS.gD), [{ t:'done', k:k }]);
  if (k === 'reading') {
    if (D.listening && !D.reading) {
      return [{ t:'intro', k:k }, { t:'listen1' }].concat(items(IDS.lq), [{ t:'listen3' }, { t:'done', k:k }]);
    }
    return [{ t:'intro', k:k }, { t:'predict' }, { t:'read1' }, { t:'reveal' }, { t:'email' }].concat(items(IDS.rq), [{ t:'done', k:k }]);
  }
  if (k === 'writing') return [{ t:'intro', k:k }, { t:'writing' }, { t:'done', k:k }];
  if (k === 'quiz') { var a = [{ t:'quizIntro' }]; for (var i = 0; i < D.quiz.length; i++) a.push({ t:'quizQ', n:i }); a.push({ t:'quizResult' }); return a; }
  if (k === 'review') return mistakeIds().map(function(key){ return { t:'item', key:key, review:true }; }).concat([{ t:'sessionDone', k:'review' }]);
  if (k === 'cards') { var r = ALL_VOCAB.map(function(v, i){ return S.cards[v.en] === 'r' ? i : -1; }).filter(function(i){ return i >= 0; });
    var idx = r.length ? r : ALL_VOCAB.map(function(_, i){ return i; });
    return idx.map(function(i){ return { t:'flash', i:i, session:true }; }).concat([{ t:'sessionDone', k:'cards' }]); }
  if (k === 'express') {
    var expSteps = [{ t:'expressIntro' }];
    (IDS.rc || []).slice(0, 3).forEach(function(id){ expSteps.push({ t:'item', id:id, review:true }); });
    [0, 1, ALL_VOCAB.length - 1].forEach(function(i){ if (ALL_VOCAB[i]) expSteps.push({ t:'flash', i:i, session:true }); });
    var topCats = sortedErrorLabCats().slice(0, 2);
    topCats.forEach(function(c){ expSteps.push({ t:'errDrill', catKey:c.key, dIdx:0 }); });
    expSteps.push({ t:'sessionDone', k:'express' });
    return expSteps;
  }
  if (k === 'irregular') {
    var verbs = (D.irregularVerbs || []).slice();
    var dueV = verbs.filter(function(v){ return irrStatus(v.base).due; });
    var pickV = (dueV.length ? dueV : verbs).slice(0, 6);
    return pickV.map(function(v, idx){ return { t:'irrDrill', base:v.base, pos:idx + 1, total:pickV.length }; }).concat([{ t:'sessionDone', k:'irregular' }]);
  }
  if (k === 'errlab' || (typeof k === 'string' && k.indexOf('errlab:') === 0)) {
    var targetKey = k.indexOf('errlab:') === 0 ? k.slice(7) : null;
    var poolCats = targetKey ? (D.errorLabCatalog || []).filter(function(c){ return c.key === targetKey; }) : sortedErrorLabCats().slice(0, 4);
    var drills = [];
    poolCats.forEach(function(c){
      (c.drills || []).forEach(function(_, di){ drills.push({ t:'errDrill', catKey:c.key, dIdx:di }); });
    });
    return drills.concat([{ t:'sessionDone', k:'errlab' }]);
  }
  /* unitTest:0 هو اختبار الأسبوع التأسيسي. كان Number('0') || 1 يحوّله إلى الوحدة 1. */
  if (typeof k === 'string' && k.indexOf('unitTest:') === 0) {
    var uId = unitArg(k, 'unitTest:', 1);
    var utObj = unitTestOf(uId);
    if (!utObj || !utObj.questions) return [];
    UT_STATE = { unit:uId, ans:{}, applied:(G.unitTests[uId] && G.unitTests[uId].appliedText) || '' };
    var uSteps = [{ t:'unitLegal', unit:uId }];
    utObj.questions.forEach(function(_, qi){ uSteps.push({ t:'unitTestQ', unit:uId, qIdx:qi }); });
    if (utObj.appliedTask) uSteps.push({ t:'unitApplied', unit:uId });
    uSteps.push({ t:'unitTestResult', unit:uId });
    return uSteps;
  }
  if (typeof k === 'string' && k.indexOf('unitMini:') === 0) {
    var mUnit = unitArg(k, 'unitMini:', 1);
    var utData = unitTestOf(mUnit);
    if (!utData || !utData.questions) return [];
    var savedUt = (G.unitTests && G.unitTests[mUnit]) || {};
    var idxs = ((savedUt.missedIdxs && savedUt.missedIdxs.length) ? savedUt.missedIdxs : [0, 2, 5, 7]).filter(function(qi){ return qi < utData.questions.length; });
    MINI_STATE = { unit:mUnit, idxs:idxs, ans:{} };
    return idxs.map(function(qi, pos){ return { t:'unitMiniQ', unit:mUnit, qIdx:qi, pos:pos + 1, total:idxs.length }; }).concat([{ t:'unitMiniResult', unit:mUnit }]);
  }
  if (typeof k === 'string' && k.indexOf('pretest:') === 0) {
    var pUnit = unitArg(k, 'pretest:', 5);
    var ptObj = D.preTests && D.preTests[pUnit];
    if (!ptObj) return [];
    /* first: المحاولة الأولى ما لم يكن في السجل الصالح first. وcounted: هل سُجّلت هذه الجلسة محاولةً (عند أول إجابة). */
    var pRec0 = ptRecValid(pUnit);
    PT_STATE = { unit:pUnit, ans:{}, counted:false, first:!(pRec0 && pRec0.first) };
    var pSteps = [{ t:'preTestIntro', unit:pUnit }];
    ptObj.items.forEach(function(_, pi){ pSteps.push({ t:'preTestQ', unit:pUnit, qIdx:pi }); });
    pSteps.push({ t:'preTestResult', unit:pUnit });
    return pSteps;
  }
  return [];
}
function openPart(k){ clearReadTimer(); M = null; M_POOL = null; var steps = stepsFor(k), i = 0, saved = S.step[k];
  if (typeof saved === 'number' && saved > 0 && saved < steps.length) i = saved;
  if (S.stamps[k] && steps[i] && steps[i].t === 'done') i = 0;
  if (k === 'quiz') { Q = null; i = 0; }
  if (i === 0 && steps[0] && steps[0].t === 'intro' && steps.length > 1) i = 1;
  P = { part:k, steps:steps, i:i }; G.ui.part = k; G.ui.view = 'player'; saveLocal(); render(); try { window.scrollTo(0, 0); } catch (e) {} }
function openSession(k){ clearReadTimer();
  var tm = /^unit(?:Test|Mini):(\d+)$/.exec(String(k));
  if (tm && !(unitTestOf(Number(tm[1])) && unitLessonsDone(Number(tm[1])))) { toast(unitTestOf(Number(tm[1])) ? unitLockText(Number(tm[1])) : 'Test not available yet'); return; }
  var steps = stepsFor(k); if (steps.length < 2) { toast(k === 'review' ? 'Notebook is empty' : tm ? 'Test not available yet' : 'No cards'); return; }
  P = { part:k, steps:steps, i:0, session:true }; G.ui.part = k; G.ui.view = 'player'; saveLocal(); render(); try { window.scrollTo(0, 0); } catch (e) {} }
function closePlayer(){ clearReadTimer(); var sess = P && P.session, k = String((P && P.part) || ''); P = null; G.ui.part = null;
  if (!sess) { go('home'); return; }
  if (k === 'express') { go('home'); return; }
  if (k === 'review' || k === 'errlab' || k.indexOf('errlab:') === 0) { go('review'); return; }
  if (k.indexOf('unitTest:') === 0 || k.indexOf('unitMini:') === 0 || k.indexOf('pretest:') === 0) { go('lessons'); return; }
  G.ui.practiceTab = k === 'irregular' ? 'verbs' : 'words'; go('review');
}
/* شاشة التقديم (intro) تبقى أول خطوة في القائمة فلا تتغير أرقام التقدم المحفوظ، لكنها لا تُعرض:
   يبدأ الدرس من الخطوة 1، وتفصيلها في نافذة زر «عن المرحلة». */
function firstStep(){ return (P && P.steps[0] && P.steps[0].t === 'intro' && P.steps.length > 1) ? 1 : 0; }
function goStep(i){ clearReadTimer(); if (!P) return; P.i = Math.max(firstStep(), Math.min(P.steps.length - 1, i)); if (!P.session) { S.step[P.part] = P.i; saveLocal(); } render(); try { window.scrollTo(0, 0); } catch (e) {} }
function nextStep(){ if (!P) return; if (P.i >= P.steps.length - 1) { closePlayer(); return; } goStep(P.i + 1); }
function prevStep(){ if (P && P.i > firstStep()) goStep(P.i - 1); }
function openStageInfo(k){ var p = partOf(k), info = (D.intro && D.intro[k]) || {}, n = PARTS.indexOf(p) + 1;
  openSheet(p.fullEn, p.fullAr, [
    h('p', { class:'muted sm' }, 'Stage ' + n + ' of ' + PARTS.length + ' · about ' + p.min + ' min'),
    info.dEn ? h('p', {}, info.dEn) : null,
    info.d ? arReveal(info.d, false) : null,
    h('ul', { class:'stage-info' }, (info.items || []).map(function(x){ return h('li', {}, ico(x[0]), h('span', {}, x[1])); }))]); }

var EN_LABELS = {
  'التالي': 'Next',
  'تحقق': 'Check',
  'ابدأ': 'Start',
  'راجع المرحلة': 'Review Stage',
  'راجع الجزء': 'Review Stage',
  'إلى التمارين': 'To Exercises',
  'القراءة الأولى': 'First Reading (Main Idea)',
  'أنهيت القراءة الأولى': 'Finished First Reading',
  'القراءة الثانية': 'Second Reading (Details)',
  'قرأت الإيميل': 'To Comprehension Questions',
  'إلى الأسئلة': 'To Questions',
  'ابدأ الاختبار': 'Start Quiz',
  'أعد الاختبار': 'Retake Quiz',
  'النتيجة وتحليل الأخطاء': 'Score & Error Analysis',
  'النتيجة': 'See Score',
  'السؤال التالي': 'Next Question',
  'التالي: الكتابة': 'Next: Writing',
  'التالي: الاختبار': 'Next: Short Quiz',
  'إنهاء المهمة': 'Finish Writing Stage',
  'رجوع للدرس': 'Back to Lesson',
  'رجوع للمراجعة': 'Back to Review',
  'رجوع للكلمات': 'Back to Words',
  'احفظ الإجابة': 'Save answer'
};
function formatCtaLabel(label){
  if (typeof label !== 'string') return label;
  if (EN_LABELS[label]) return biBtn(EN_LABELS[label], label);
  if (label.indexOf('التالي: ') === 0) {
    var arPart = label.slice('التالي: '.length);
    var p = PARTS.filter(function(x){ return x.ar === arPart || x.fullAr === arPart; })[0];
    return biBtn('Next: ' + (p ? p.fullEn : arPart), label);
  }
  return label;
}

function vPlayer(){
  if (!P) { var k = G.ui.part; if (!k || ['recall','vocab','grammar','reading','writing','quiz'].indexOf(k) < 0) { G.ui.view = 'home'; return vHome(); }
    var steps = stepsFor(k), i = S.step[k] || 0; if (k === 'quiz') i = 0; P = { part:k, steps:steps, i:Math.min(i, steps.length - 1) }; }
  if (P.i < firstStep()) P.i = firstStep();
  var off = firstStep(), st = P.steps[P.i], N = P.steps.length - off, pos = P.i - off + 1;
  var part = !P.session ? partOf(P.part) : null;
  var cta = h('button', { class:'btn', type:'button' }, formatCtaLabel('التالي'), ico('fwd'));
  var ctl = {
    cta:cta,
    set:function(label, enabled, fn){ put(cta, formatCtaLabel(label), ico('fwd')); cta.disabled = !enabled; cta.onclick = fn || nextStep; cta.hidden = false; },
    enable:function(label){ ctl.set(label || 'التالي', true, nextStep); },
    hide:function(){ cta.hidden = true; }
  };
  ctl.set('التالي', true, nextStep);
  var foot = h('div', { class:'pl-foot gut' });
  var backBtn = h('button', { class:'ib back', type:'button', 'aria-label':'Previous step · الخطوة السابقة', on:{ click:prevStep } }, ico('back'));
  var body = renderStep(st, ctl, foot);
  if (P.i > off && st.t !== 'done' && st.t !== 'sessionDone' && st.t !== 'quizResult' && !(P.part === 'quiz' && st.t === 'quizQ')) foot.prepend(backBtn);
  foot.append(cta);
  var stageLine = part ? h('div', { class:'pl-stage' },
    h('span', {}, part.fullEn + ' · stage ' + (PARTS.indexOf(part) + 1) + ' of ' + PARTS.length),
    (D.intro && D.intro[part.k]) ? h('button', { class:'pl-info', type:'button', 'aria-label':'About this stage', on:{ click:function(){ openStageInfo(part.k); } } }, ico('info'), 'About') : null) : null;
  return h('section', { class:'pl' },
    h('div', { class:'pl-top gut' },
      h('button', { class:'ib', type:'button', 'aria-label':'Close · إغلاق', on:{ click:closePlayer } }, ico('x')),
      h('div', { class:'pbar', 'aria-hidden':'true' }, h('span', { style:'width:' + Math.round(pos / N * 100) + '%' })),
      h('span', { class:'pcount' }, pos + ' / ' + N)),
    h('div', { class:'pl-body gut' }, stageLine, body), foot);
}
function renderStep(st, ctl, foot){
  switch (st.t) {
    case 'intro': return stIntro(st.k, ctl);
    case 'flash': return stFlash(st, ctl, foot);
    case 'match': return stMatch(ctl);
    case 'item': return stItem(st, ctl);
    case 'explain': return stExplain(st.i, ctl);
    case 'predict': return stPredict(ctl);
    case 'read1': return stRead1(ctl);
    case 'email': return stEmail(ctl);
    case 'reveal': return stReveal(ctl);
    case 'listen1': return stListen1(ctl);
    case 'listen3': return stListen3(ctl);
    case 'quizIntro': return stQuizIntro(ctl);
    case 'quizQ': return stQuizQ(st.n, ctl);
    case 'quizResult': return stQuizResult(ctl);
    case 'writing': return stWriting(ctl);
    case 'expressIntro': return stExpressIntro(ctl);
    case 'irrDrill': return stIrrDrill(st, ctl);
    case 'errDrill': return stErrDrill(st, ctl);
    case 'unitLegal': return stUnitLegal(st, ctl);
    case 'unitTestQ': return stUnitTestQ(st, ctl);
    case 'unitApplied': return stUnitApplied(st, ctl);
    case 'unitTestResult': return stUnitTestResult(st, ctl);
    case 'unitMiniQ': return stUnitMiniQ(st, ctl);
    case 'unitMiniResult': return stUnitMiniResult(st, ctl);
    case 'preTestIntro': return stPreTestIntro(st, ctl);
    case 'preTestQ': return stPreTestQ(st, ctl);
    case 'preTestResult': return stPreTestResult(st, ctl);
    case 'done': return stDone(st.k, ctl);
    case 'sessionDone': return stSessionDone(st.k, ctl);
  }
  return h('p', {}, '');
}
/* label: عنوان الخطوة أو عدّادها، بالإنجليزي وحده. instr: تعليمة السؤال، وتحتها سطر عربي صغير. */
function label(enText, arText, extra){
  if (arguments.length === 2 && (arText == null || typeof arText === 'object')) extra = arText;
  return instr(enText, null, extra);
}
function instr(enText, arText, extra){
  return h('div', { class:'st-lbl' },
    h('div', { class:'st-tx' },
      h('p', { class:'st-en', dir:'ltr', html:arHTML(enText) }),
      arText ? h('p', { class:'st-ar', dir:'rtl', lang:'ar', html:arHTML(arText) }) : null),
    extra || null);
}

function stIntro(k, ctl){ var p = partOf(k), info = (D.intro && D.intro[k]) || {}, n = PARTS.indexOf(p) + 1;
  ctl.enable(S.stamps[k] ? 'راجع المرحلة' : 'ابدأ');
  return h('div', { class:'intro' },
    h('span', { class:'intro-ic' }, partIcon(p)),
    label('Stage ' + n + ' of ' + PARTS.length + ' · ~' + p.min + ' min', 'المرحلة ' + n + ' من ' + PARTS.length + ' · نحو ' + p.min + ' دقائق'),
    h('h1', { class:'bi-h' }, h('span', { class:'en', dir:'ltr' }, p.fullEn), h('small', {}, p.fullAr)),
    info.dEn ? h('p', { class:'en-p' }, info.dEn) : null,
    h('p', {}, info.d || ''),
    h('ul', {}, (info.items || []).map(function(x){
      return h('li', {}, ico(x[0]), x[2] ? biNode(x[1], x[2]) : h('span', { html:arHTML(x[1]) }));
    })));
}

/* ---------- Stage 1: Active Recall (Keyboard Recall + Spelling) ---------- */
function editDistance(a, b){
  a = String(a || ''); b = String(b || '');
  var m = a.length, n = b.length, dp = [], i, j;
  for (i = 0; i <= m; i++) { dp[i] = [i]; }
  for (j = 0; j <= n; j++) { dp[0][j] = j; }
  for (i = 1; i <= m; i++) {
    for (j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j - 1], dp[i][j - 1], dp[i - 1][j]);
    }
  }
  return dp[m][n];
}
function RecallTyping(x, o, ctl){
  o = o || {};
  var targetWord = x.ans[0];
  var inp = h('input', { class:'gap-in', type:'text', dir:'ltr', autocomplete:'off', autocapitalize:'off', autocorrect:'off', spellcheck:'false', enterkeyhint:'done', placeholder:'Type here…', 'aria-label':'Type from memory · اكتب الكلمة من ذاكرتك' });
  var pre = x.sentPre != null ? x.sentPre + ' ' : (x.cueEn || '___').split('___')[0];
  var post = x.sentPost != null ? (/^[.!?,]/.test(x.sentPost) ? x.sentPost : ' ' + x.sentPost) : ((x.cueEn || '___').split('___')[1] || '');
  var sent = h('p', { class:'q-en sm', dir:'ltr' }, pre, inp, post);
  var cueEn = x.promptEn ? h('p', { class:'en', dir:'ltr', style:'font-size:14.5px;color:var(--on-dark-2);margin-bottom:4px;text-align:left' }, x.promptEn + (x.hint ? ' · [' + x.hint + ']' : '')) : null;
  var cueAr = h('p', { class:'q-ar', style:'margin-bottom:8px;color:var(--honey)' }, 'المعنى المطلوب: ' + (x.promptAr || x.cueAr || ''));
  /* شارة «عبارة قانونية» لما وُسم في الدرس بـ isLegal وحده (كانت مربوطة بالسؤال rc-4 أيًّا كان). */
  var card = qCard(h('div', {}, cueEn, cueAr, sent), x.isLegal ? { tag:'Legal phrase' } : {});
  var fb = h('div', { hidden:true }), done = false;
  function check(){
    if (done) return;
    var v = inp.value.trim();
    if (!v) { inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake'); inp.focus(); return; }
    var nv = norm(v);
    var loose = x.ans.some(function(a){ return norm(a) === nv; });
    var exact = x.exact ? x.ans.some(function(a){ return exactNorm(a) === exactNorm(v); }) : loose;
    var closeSpell = !loose && x.ans.some(function(a){ var d = editDistance(norm(a), nv); return d > 0 && d <= 2; });
    show(v, exact, closeSpell);
    if (o.onAnswer) o.onAnswer(exact, v);
  }
  function show(v, exact, closeSpell){
    done = true; inp.value = v; inp.disabled = true; inp.classList.add(exact ? 'ok' : 'bad');
    fb.hidden = false;
    var caseOnly = !exact && !!x.exact && x.ans.some(function(a){ return norm(a) === norm(v); });
    var whyEn = caseOnly ? (CASE_NOTE_EN + ' "' + targetWord + '". ' + (x.spellNoteEn || '')) : closeSpell ? ('Close! You recalled the word, but check the spelling: "' + targetWord + '". ' + (x.spellNoteEn || '')) : (x.spellNoteEn || 'Spelling pattern checked.');
    var whyAr = caseOnly ? (CASE_NOTE_AR + ' ' + targetWord + '. ' + (x.spellNote || x.spellNoteAr || '')) : closeSpell ? ('تذكّرت الكلمة بشكل قريب، لكن انتبه للإملاء الصحيح: ' + targetWord + '. ' + (x.spellNote || x.spellNoteAr || '')) : (x.spellNote || x.spellNoteAr || '');
    var cardNode = fbCard(exact, whyAr, null, exact ? null : [caseOnly ? 'Correct form' : 'Correct spelling', targetWord], whyEn);
    var tools = h('div', { class:'audio-row' },
      sayBtn(targetWord, 'Human Pronunciation'),
      oxBtn(targetWord),
      h('span', { class:'repeat-pill' }, 'Listen & repeat'));
    cardNode.querySelector('.fb-t').append(tools);
    put(fb, cardNode);
  }
  inp.addEventListener('keydown', function(e){ if (e.key === 'Enter') { e.preventDefault(); check(); } });
  if (o.saved && typeof o.saved.v === 'string') {
    var nv0 = norm(o.saved.v);
    var ex0 = x.ans.some(function(a){ return norm(a) === nv0; });
    var cl0 = !ex0 && x.ans.some(function(a){ var d = editDistance(norm(a), nv0); return d > 0 && d <= 2; });
    show(o.saved.v, !!o.saved.c, cl0);
  } else {
    ctl.set('تحقق', true, check);
  }
  return [card, fb];
}

/* ---------- Stage 2: Flashcards (New Phrases + Legal Phrase + Oxford + Human Audio) ---------- */
function stFlash(st, ctl, foot){ var v = ALL_VOCAB[st.i], mark = S.cards[v.en];
  var card = h('div', { class:'fc', role:'button', tabindex:'0', 'aria-label':'Flashcard ' + v.en + ' · بطاقة ' + v.en + '، اضغط لقلبها' });
  var arcs = '<svg class="fc-arc" viewBox="0 0 320 360" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M-10 334 C 90 300, 220 300, 330 322" fill="none" stroke="#E2D9CC" stroke-width="2" vector-effect="non-scaling-stroke"/><path d="M-10 352 C 110 326, 210 328, 330 344" fill="none" stroke="#EFE9DF" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>';
  var front = h('div', { class:'fc-face fc-front' }, h('span', { html:arcs }),
    sayBtn(v, 'Human Pronunciation'),
    v.isLegal ? h('span', { class:'legal-badge', style:'position:relative' }, 'Legal Phrase') : h('span', { class:'fc-pos' }, v.pos),
    h('span', { class:'fc-word', style:v.en.length > 12 ? 'font-size:34px' : '' }, v.en),
    h('span', { class:'fc-say' }, 'Sounds like: ', h('b', {}, v.say)),
    h('div', { class:'audio-row', style:'position:relative;justify-content:center' },
      oxBtn(v),
      h('span', { class:'repeat-pill' }, 'Listen & repeat')),
    h('span', { class:'fc-hint' }, 'Tap card to flip'));
  var back = h('div', { class:'fc-face fc-back' },
    v.isLegal ? h('span', { class:'legal-badge', style:'align-self:flex-start' }, 'Legal Track') : null,
    h('span', { class:'fc-ar' }, v.ar),
    h('div', { class:'fc-exrow' }, h('p', { class:'fc-ex' }, v.ex), sayBtn(v, 'Human Pronunciation')),
    h('p', { class:'fc-exar' }, v.exAr),
    h('div', { class:'audio-row' }, oxBtn(v), h('span', { class:'repeat-pill' }, 'Repeat aloud')),
    h('div', { class:'fc-tip' },
      v.tipEn ? h('p', { class:'fc-tip-en' }, v.tipEn) : null,
      v.tipEn ? arReveal(v.tip, false) : h('p', { html:arHTML(v.tip) })));
  card.append(front, back);
  function flip(){ card.classList.toggle('flip'); }
  card.addEventListener('click', function(e){ if (e.target.closest('.say, .ar-btn, .ox-link')) return; flip(); });
  card.addEventListener('keydown', function(e){ if (e.target !== card) return; if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
  function markIt(k){ S.cards[v.en] = k; touch(); nextStep(); }
  ctl.hide();
  foot.append(
    h('button', { class:'btn out', type:'button', on:{ click:function(){ markIt('r'); } } }, biBtn('Review later', 'أراجعها لاحقًا')),
    h('button', { class:'btn', type:'button', on:{ click:function(){ markIt('k'); } } }, biBtn('I know it', 'أعرفها'))
  );
  var total = st.session ? P.steps.length - 1 : ALL_VOCAB.length, pos = st.session ? P.i + 1 : st.i + 1;
  return [label('Phrase ' + pos + ' of ' + total, 'بطاقة ' + pos + ' من ' + total, mark ? h('span', { class:'tag' }, mark === 'k' ? 'Known' : 'To review') : null), card];
}

/* matching (randomized pool across rounds + true derangement so pattern is never fixed) */
var M = null, M_POOL = null, LAST_MATCH_SIG = '';
function derangeWords(arr){
  var n = arr.length;
  if (n <= 1) return arr.slice();
  var best = null;
  for (var tries = 0; tries < 50; tries++) {
    var cand = shuffle(arr);
    var fixed = 0;
    for (var i = 0; i < n; i++) { if (cand[i] === arr[i]) fixed++; }
    var sig = arr.map(function(k){ return cand.indexOf(k); }).join(',');
    var isUniformShift = n >= 4 && arr.every(function(k, idx){ return cand[(idx + 1) % n] === k || cand[(idx + n - 1) % n] === k; });
    if (fixed === 0 && !isUniformShift && sig !== LAST_MATCH_SIG) {
      LAST_MATCH_SIG = sig;
      return cand;
    }
    if (fixed === 0 && !best) best = cand;
  }
  if (best) return best;
  var step = 1 + Math.floor(Math.random() * (n - 1));
  return arr.map(function(_, idx){ return arr[(idx + step) % n]; });
}
function mkRound(r, misses){
  var rawPool = (D.vocab.length >= 12 ? shuffle(ALL_VOCAB).slice(0, 12) : ALL_VOCAB.slice());
  if (r === 0 || !M_POOL || M_POOL.lessonId !== curLessonId) {
    M_POOL = shuffle(ALL_VOCAB.slice());
    if (M_POOL.length > 12) M_POOL = M_POOL.slice(0, 12);
    M_POOL.lessonId = curLessonId;
  }
  var perRound = Math.ceil(M_POOL.length / 2);
  var w = M_POOL.slice(r * perRound, (r + 1) * perRound).map(function(v){ return v.en; });
  var arOrder = shuffle(w);
  var enOrder = derangeWords(arOrder);
  return { round:r, target:w.length, totalWords:M_POOL.length, sel:null, matched:{}, n:0, misses:misses || 0, ar:arOrder, en:enOrder, locked:false };
}
function stMatch(ctl){ var box = h('div', { class:'mt-box' });
  var totalW = ALL_VOCAB.length > 12 ? 12 : ALL_VOCAB.length;
  function done(misses){ ctl.enable(); put(box,
    label('Matching Game', 'لعبة التوصيل'),
    h('div', { class:'fb' }, h('span', { class:'fb-ic' }, ico('check')),
      h('div', { class:'fb-t' },
        h('b', {}, 'Game Complete'),
        h('p', {}, misses == null ? ('You matched all ' + totalW + ' words with their meanings.') : (misses === 0 ? 'Zero mistakes. Great job!' : 'Wrong attempts: ' + misses + ' · عدد المحاولات الخاطئة: ' + misses)))),
    h('button', { class:'btn out sm', type:'button', style:'align-self:flex-start', on:{ click:function(){ M_POOL = null; M = mkRound(0, 0); draw(); } } }, biBtn('New Random Round', 'جولة عشوائية جديدة'))); }
  function draw(){ ctl.set('التالي', !!S.match, nextStep);
    var byEn = {}; ALL_VOCAB.forEach(function(v){ byEn[v.en] = v; });
    function item(side, key, txt){ var b = h('button', { class:'m-it ' + side + (M.matched[key] ? ' matched' : ''), type:'button', disabled:!!M.matched[key], dir:side === 'en' ? 'ltr' : 'rtl' }, txt); b.addEventListener('click', function(){ pick(side, key, b); }); return b; }
    function pick(side, key, el){ if (M.matched[key] || M.locked) return;
      if (!M.sel || M.sel.side === side) { if (M.sel) M.sel.el.classList.remove('sel'); M.sel = { side:side, key:key, el:el }; el.classList.add('sel'); return; }
      var a = M.sel; M.sel = null; a.el.classList.remove('sel');
      if (a.key === key) { M.matched[key] = true; M.n++; [a.el, el].forEach(function(x){ x.classList.add('matched'); x.disabled = true; });
        if (M.n === (M.target || 6)) { if (M.round === 0) { var ms = M.misses; setTimeout(function(){ M = mkRound(1, ms); draw(); }, 550); } else { var mm = M.misses; setTimeout(function(){ M = null; S.match = true; touch(); updateProgress(); done(mm); }, 450); } } }
      else { M.locked = true; M.misses++; [a.el, el].forEach(function(x){ x.classList.add('miss'); }); setTimeout(function(){ [a.el, el].forEach(function(x){ x.classList.remove('miss'); }); M.locked = false; }, 550); } }
    put(box,
      label('Matching Game', 'لعبة التوصيل', h('b', {}, 'Round ' + (M.round + 1) + ' of 2')),
      h('div', { style:'display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap' },
        h('p', { class:'muted' }, biNode('Tap an English word, then tap its Arabic meaning.', 'اضغط على الكلمة، ثم على معناها.')),
        h('button', { class:'ar-btn', type:'button', on:{ click:function(){ M_POOL = null; M = mkRound(0, 0); draw(); } } }, ico('review'), 'Shuffle')),
      h('div', { class:'match' }, h('div', { class:'m-col' }, M.ar.map(function(k){ return item('ar', k, byEn[k].ar); })), h('div', { class:'m-col' }, M.en.map(function(k){ return item('en', k, k); })))); }
  if (S.match && !M) done(null); else { if (!M) M = mkRound(0, 0); draw(); }
  return box;
}

/* item components */
/* head (اختياري): عنوان بديل للبطاقة، كما في «لم تُجب» في مراجعة الاختبار القبلي. وبدونه يبقى العنوان كما كان. */
function fbCard(ok, why, ev, fix, whyEn, head){
  var extra = fix ? h('p', { class:'fb-fix' }, fix[0] + ': ', h('bdi', { dir:'ltr', lang:'en' }, fix[1])) : null;
  return h('div', { class:'fb' + (ok ? '' : ' bad'), role:'status' }, h('span', { class:'fb-ic' }, ico(ok ? 'check' : 'x')),
    h('div', { class:'fb-t' },
      /* الجزء الإنجليزي داخل bdi، وإلا انتقلت علامة التعجب في السطر العربي إلى أول الكلمة فظهرت «!Correct». */
      h('b', {}, head || (ok ? 'Correct' : 'Not quite')),
      extra,
      whyEn ? h('p', { class:'fb-en' }, whyEn) : null,
      why ? (whyEn ? arReveal(why, false) : h('p', { html:arHTML(why) })) : null,
      ev ? h('div', { class:'fb-ev' }, h('span', {}, 'From the text'), h('q', { dir:'ltr', lang:'en' }, ev)) : null));
}
function blankText(s, word){ return s.replace('___', word || '...'); }
function qCard(content, opts){ opts = opts || {};
  var c = h('div', { class:'qcard' + (opts.tag ? ' top' : '') }, opts.tag ? h('span', { class:'q-tag' }, opts.tag) : null, content);
  return c; }
/* الوضع الصامت (o.quiet) في MCQ وTyping، ويُستعمل في الاختبار القبلي وحده: بعد الإجابة لا صح ولا خطأ ولا بطاقة ولا جواب،
   بل حالة «حُفظت» محايدة وسطر صغير. وبدون o.quiet يبقى السلوك كما كان في الدروس والاختبارات والمراجعات. */
function savedNote(){ return h('p', { class:'saved-note', role:'status' }, 'Answer saved'); }
function MCQ(x, o){ o = o || {}; var quiet = !!o.quiet, isBlank = x.prompt.indexOf('___') >= 0, longOpts = x.opts.some(function(t){ return t.length > 22; });
  var picked = null;
  var prompt = h('p', { class:'q-en' + (isBlank ? '' : ' sm'), dir:'ltr' });
  if (isBlank) { var parts = x.prompt.split('___'); prompt.append(parts[0]); var bl = h('span', { class:'blank' }, ' '); prompt.append(bl, parts[1] || ''); } else prompt.textContent = x.prompt;
  var card = qCard(prompt, { tag:o.tag });
  var fb = h('div', { hidden:true });
  var btns = x.opts.map(function(t, i){ var b = h('button', { class:'opt' + (longOpts ? ' long' : ''), type:'button', dir:'ltr' }, h('span', {}, t), h('span', { class:'o-dot', html:'' }));
    b.addEventListener('click', function(){ if (picked != null) return; show(i); if (o.onAnswer) o.onAnswer(i === x.a, i); }); return b; });
  function show(i){ picked = i; var ok = i === x.a;
    if (quiet) {
      btns.forEach(function(b, j){ b.disabled = true; b.classList.add(j === i ? 'chosen' : 'rest'); });
      if (isBlank) prompt.querySelector('.blank').textContent = x.opts[i];
      fb.hidden = false; put(fb, savedNote()); return;
    }
    btns.forEach(function(b, j){ b.disabled = true; var dot = b.querySelector('.o-dot');
      if (j === x.a) { b.classList.add('ok'); put(dot, ico('check')); } else if (j === i) { b.classList.add('bad'); put(dot, ico('x')); } else b.classList.add('dim'); });
    if (isBlank) { var blk = prompt.querySelector('.blank'); blk.textContent = x.opts[i]; blk.classList.add(ok ? 'ok' : 'bad'); }
    fb.hidden = false; put(fb, fbCard(ok, x.why, x.ev, ok ? null : ['Correct answer', x.opts[x.a]], x.whyEn)); }
  if (o.saved && typeof o.saved.v === 'number') show(o.saved.v);
  return [card, h('div', { class:'opts' }, btns), fb];
}
function TF(x, o){ o = o || {}; var reading = !!o.reading, truth = reading ? !!x.a : !!x.ok, vals = [true, false];
  var labels = reading ? ['True', 'False'] : ['Correct', 'Has a mistake'];
  var sent = h('p', { class:'q-en sm', dir:'ltr' }, reading ? x.q : x.s), fb = h('div', { hidden:true }), answered = false;
  var card = qCard(sent, { tag:o.tag || (reading ? 'True or False?' : null) });
  var btns = vals.map(function(v, i){ var b = h('button', { class:'opt center', type:'button' }, h('span', {}, labels[i]), h('span', { class:'o-dot' }));
    b.addEventListener('click', function(){ if (answered) return; show(v); if (o.onAnswer) o.onAnswer(v === truth, v); }); return b; });
  function show(v){ answered = true; var ok = v === truth;
    btns.forEach(function(b, i){ b.disabled = true; b.classList.add(vals[i] === truth ? 'ok' : (vals[i] === v ? 'bad' : 'dim')); });
    if (!reading && !x.ok) sent.classList.add('struck');
    fb.hidden = false; put(fb, fbCard(ok, x.why, reading ? x.ev : null, (!reading && !x.ok) ? ['Correction', x.fix] : null, x.whyEn)); }
  if (o.saved && typeof o.saved.v === 'boolean') show(o.saved.v);
  return [card, h('div', { class:'opts two' }, btns), fb];
}
/* لوحة الآيفون تكتب الفاصلة العليا ’ أو ‘ بدل '، فتُوحَّد قبل كل مقارنة وكل فحص كتابة. */
var APOS_RE = /[’‘‛ʼ`´]/g;
function fixQuotes(s){ return String(s == null ? '' : s).replace(APOS_RE, "'"); }
function norm(s){ return fixQuotes(s).toLowerCase().replace(/[^a-z'\s]/g, ' ').replace(/\s+/g, ' ').trim(); }
/* exact: true في السؤال (تمارين الحرف الكبير): المقارنة حساسة لحالة الحروف وعلامات الترقيم،
   بعد توحيد الفاصلة العليا وحذف المسافات الزائدة. وبدونه تبقى المقارنة القديمة المتسامحة. */
function exactNorm(s){ return fixQuotes(s).replace(/\s+/g, ' ').trim(); }
var CASE_NOTE_EN = 'Check the capital letters. Write it exactly like this:', CASE_NOTE_AR = 'انتبه لحالة الحرف (كبير أو صغير)، واكتبها هكذا:';
function typedLooseOK(x, v){ var n = norm(v), pre = norm(x.pre), post = norm(x.post);
  if (pre && n.indexOf(pre + ' ') === 0) n = n.slice(pre.length + 1);
  if (post && n.length > post.length + 1 && n.slice(-(post.length + 1)) === ' ' + post) n = n.slice(0, -(post.length + 1));
  return x.ans.some(function(a){ return norm(a) === n; }); }
function typedExactOK(x, v){ var n = exactNorm(v), pre = (x.pre && x.pre !== '___') ? exactNorm(x.pre) : '', post = exactNorm(x.post), sep = /^[.!?,;:]/.test(post) ? '' : ' ';
  return x.ans.some(function(a){ a = exactNorm(a); if (n === a) return true;
    /* من كتب الجملة كلها: تُقبل بحروفها كما هي، ومع نقطة النهاية أو بدونها. */
    var forms = pre ? [pre + ' ' + a] : [];
    if (post) [a + sep + post].concat(pre ? [pre + ' ' + a + sep + post] : []).forEach(function(f){ forms.push(f); if (/[.!?]$/.test(post)) forms.push(f.replace(/[.!?]+$/, '')); });
    return forms.indexOf(n) >= 0; }); }
function typedOK(x, v){ return x.exact ? typedExactOK(x, v) : typedLooseOK(x, v); }
function Typing(x, o, ctl){ o = o || {}; var quiet = !!o.quiet;
  var inp = h('input', { class:'gap-in' + (o.wide ? ' wide' : ''), type:'text', dir:'ltr', autocomplete:'off', autocapitalize:'off', autocorrect:'off', spellcheck:'false', enterkeyhint:'done', 'aria-label':(isVerbCue(x) ? 'Verb form' : 'Correct form') + x.verb });
  var noSpace = /^[.!?,]/.test(x.post);
  var sent = h('p', { class:'q-en', dir:'ltr' }, x.pre + ' ', inp, ' ', h('span', { class:'verb' }, '(' + x.verb + ')'), noSpace ? '' : ' ', x.post);
  var fb = h('div', { hidden:true }), done = false;
  function check(){ if (done) return; var v = inp.value.trim();
    if (!v) { inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake'); inp.focus(); return; }
    var ok = typedOK(x, v); show(v, ok); if (o.onAnswer) o.onAnswer(ok, v); }
  function show(v, ok){ done = true; inp.value = v; inp.disabled = true; fb.hidden = false;
    if (quiet) { inp.classList.add('saved'); put(fb, savedNote()); return; }
    inp.classList.add(ok ? 'ok' : 'bad');
    /* الإجابة الصحيحة بحروف خاطئة الحالة (riyadh): تنبيه على الحرف الكبير مع الصيغة الصحيحة. */
    var caseOnly = !ok && !!x.exact && typedLooseOK(x, v);
    put(fb, fbCard(ok, caseOnly ? CASE_NOTE_AR + ' ' + x.ans[0] + '. ' + (x.why || '') : x.why, null,
      ok ? null : [caseOnly ? 'Correct form' : 'Correct answer', x.ans[0]],
      caseOnly ? CASE_NOTE_EN + ' "' + x.ans[0] + '". ' + (x.whyEn || '') : x.whyEn)); }
  inp.addEventListener('keydown', function(e){ if (e.key === 'Enter') { e.preventDefault(); check(); } });
  if (o.saved && typeof o.saved.v === 'string') show(o.saved.v, !!o.saved.c);
  else ctl.set(quiet ? 'احفظ الإجابة' : 'تحقق', true, check);
  return [qCard(sent), fb];
}
function Builder(x, o, ctl){ o = o || {}; var placed = [], locked = false;
  var line = h('div', { class:'b-line', dir:'ltr' }), pool = h('div', { class:'b-pool', dir:'ltr' }), fb = h('div', { hidden:true });
  var clear = h('button', { class:'link', type:'button', style:'align-self:flex-start' }, 'Reset words');
  function draw(){
    put(line, placed.length ? placed.map(function(ci, pos){ var b = h('button', { class:'chip', type:'button', disabled:locked }, x.chips[ci]); b.addEventListener('click', function(){ if (locked) return; placed.splice(pos, 1); draw(); }); return b; }) : h('span', { class:'b-ph' }, 'Tap words below in the right order'));
    put(pool, x.chips.map(function(c, ci){ if (placed.indexOf(ci) >= 0) return null; var b = h('button', { class:'chip', type:'button', disabled:locked }, c); b.addEventListener('click', function(){ if (locked) return; placed.push(ci); draw(); }); return b; }));
    if (!locked && ctl) ctl.set('تحقق', placed.length === x.chips.length, check);
  }
  function finish(ok){ locked = true; draw(); line.classList.add(ok ? 'ok' : 'bad'); pool.hidden = true; clear.hidden = true; fb.hidden = false; put(fb, fbCard(ok, x.why, null, ok ? null : ['Correct order', x.ans], x.whyEn)); }
  function check(){ if (locked || placed.length !== x.chips.length) return; var s = placed.map(function(i){ return x.chips[i]; }).join(' '), ok = s === x.ans; finish(ok); if (o.onAnswer) o.onAnswer(ok, placed.slice()); }
  clear.addEventListener('click', function(){ if (locked) return; placed = []; draw(); });
  if (o.saved && Array.isArray(o.saved.v)) { placed = o.saved.v.slice(); finish(!!o.saved.c); } else draw();
  return [qCard(line), pool, clear, fb];
}
function stItem(st, ctl){ var it = st.review ? itemFor(st.key) : ITEMS[st.id]; if (!it) { ctl.enable(); return h('p', {}, ''); }
  var review = !!st.review, saved = review ? null : S.ans[st.id];
  var o = { saved:saved, onAnswer:function(c, v){
    if (review) {
      var m = G.mistakes[st.key];
      if (m) {
        if (c) { m.box = (m.box || 0) + 1; if (m.box >= SR_DAYS.length) { delete G.mistakes[st.key]; toast('Question cleared!'); } else m.due = Date.now() + SR_DAYS[m.box] * 864e5; }
        else { m.box = 0; m.due = Date.now() + SR_DAYS[0] * 864e5; }
        touch(); updateNav();
      }
    }
    else record(st.id, c, v);
    ctl.enable(); } };
  var nodes;
  if (it.type === 'recall') nodes = RecallTyping(it.x, o, ctl);
  else if (it.type === 'mcq') nodes = MCQ(it.x, Object.assign(o, review ? { tag:it.secEn || it.sec } : {}));
  else if (it.type === 'tf') nodes = TF(it.x, o);
  else if (it.type === 'rtf') nodes = TF(it.x, Object.assign(o, { reading:true }));
  else if (it.type === 'typing') nodes = Typing(it.x, o, ctl);
  else nodes = Builder(it.x, o, ctl);
  if ((it.type === 'mcq' || it.type === 'tf' || it.type === 'rtf') && !saved) ctl.set('التالي', false, nextStep);
  var extra = review ? h('span', { class:'tag' }, 'Review · ' + lessonTag(String(st.key).split('|')[0])) : (it.secEn === 'Listening' && D.listening && D.listening.url ? h('a', { class:'ox-link', href:D.listening.url, target:'_blank', rel:'noopener noreferrer' }, 'Audio Clip ↗') : null);
  return [instr(it.groupEn || it.group, it.groupEn ? it.group : null, extra)].concat(nodes);
}

/* grammar explain: simplified English first, Arabic hidden under "اعرض بالعربي" (except Common Arab Mistakes which stays bilingual) */
function stExplain(i, ctl){ var c = GCARDS[i];
  ctl.enable(i === GCARDS.length - 1 ? 'إلى التمارين' : 'التالي');
  var box = h('div', { class:'xp', html:c.enHtml || c.html });
  if (!c.bilingual && c.arHtml) {
    var rev = arReveal(c.arHtml, true);
    var h2 = box.querySelector('h2');
    if (h2 && h2.nextSibling) box.insertBefore(rev, h2.nextSibling);
    else box.append(rev);
  }
  return [
    label('Grammar Explanation · ' + (i + 1) + ' of ' + GCARDS.length, 'شرح القاعدة · ' + (i + 1) + ' من ' + GCARDS.length),
    box,
    SAMPLE ? h('button', { class:'link', type:'button', style:'align-self:flex-start;color:var(--dark);font-weight:700', on:{ click:function(){ openAsk(); } } }, 'Need help? Ask the Teacher') : null
  ];
}

/* ---------- Stage 4: Reading (First Reading Timed + Second Reading Interactive + Fluency) & Listening ---------- */
var readTimerId = null;
function clearReadTimer(){ if (readTimerId) { clearInterval(readTimerId); readTimerId = null; } }
function fmtSec(s){ var m = Math.floor(s / 60), r = s % 60; return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r; }

function stPredict(ctl){ var p = D.reading.predict, sel = S.predict;
  if (sel == null) ctl.set('القراءة الأولى', false, nextStep); else ctl.enable('القراءة الأولى');
  var btns = p.opts.map(function(t, i){
    var enOpt = p.optsEn && p.optsEn[i];
    var b = h('button', { class:'opt ar' + (sel === i ? ' picked' : ''), type:'button' },
      enOpt ? biNode(enOpt, t) : h('span', {}, t),
      h('span', { class:'o-dot' }));
    b.addEventListener('click', function(){ S.predict = i; S.revealed = false; touch(); btns.forEach(function(x, j){ x.classList.toggle('picked', j === i); }); ctl.enable('القراءة الأولى'); }); return b; });
  return [
    label('Step 1 · Predict Before Reading', 'الخطوة 1'),
    qCard(h('div', {}, p.qEn ? h('p', { class:'q-en sm', dir:'ltr', style:'margin-bottom:6px' }, p.qEn) : null, h('p', { class:'q-ar' + (p.qEn ? ' sub' : ''), dir:'rtl', lang:'ar' }, p.q))),
    h('div', { class:'opts' }, btns),
    h('p', { class:'hint' }, 'Guess before reading. Next is a quick first reading for the main idea.')
  ];
}

function stRead1(ctl){
  var r = D.reading, target = readingTarget(r), tgt = fmtSec(target), mins = Math.max(1, Math.round(target / 60));
  ctl.set('أنهيت القراءة الأولى', true, function(){ S.read1Done = true; touch(); nextStep(); });
  var sec = 0;
  var tSpan = h('span', { class:'rtimer-t' }, '00:00 / ' + tgt);
  clearReadTimer();
  readTimerId = setInterval(function(){ sec++; tSpan.textContent = fmtSec(sec) + ' / ' + tgt; }, 1000);
  var mail = h('article', { class:'mail', 'aria-label':'First Reading · القراءة الأولى' }, mailHead(r), emailBody(true));
  return [
    label('Step 2 · First Reading (Main Idea)', 'الخطوة 2', h('span', { class:'tag' }, 'No dictionary')),
    h('div', { class:'rtimer' },
      biNode('Comfortable advisory timer (~' + mins + ' min) — read for the general idea without stopping at words.', 'مؤقت إرشادي مريح (نحو ' + arMinutes(mins) + ') — اقرأ للفكرة العامة دون التوقف عند الكلمات.'),
      tSpan),
    mail
  ];
}

/* صندوق «نظرة على النص» من reading.insight في الدرس، ولا يظهر في درس بلا insight
   (كانت فيه جمل إيميل نور تظهر لأي درس قراءة). */
function stReveal(ctl){ var p = D.reading.predict, ins = D.reading.insight; ctl.enable('القراءة الثانية');
  if (!S.revealed) { S.revealed = true; touch(); }
  var ok = S.predict === p.a;
  return [
    label('Check Your Prediction', 'تحقق من توقّعك'),
    S.predict == null ? h('p', { class:'muted' }, 'No prediction recorded this time.') :
      fbCard(ok, p.reveal, null, null, p.revealEn),
    ins ? h('div', { class:'insight' },
      h('h3', { class:'bi-h', style:'font-size:16px' }, h('span', { class:'en', dir:'ltr' }, ins.titleEn), h('small', {}, ins.titleAr)),
      ins.l1En ? h('p', { class:'en', dir:'ltr', style:'font-size:14px;color:var(--ink-2);text-align:left' }, ins.l1En) : null,
      ins.ex1 ? h('p', { class:'xen' }, ins.ex1) : null,
      ins.l2En ? h('p', { class:'en', dir:'ltr', style:'font-size:14px;color:var(--ink-2);text-align:left' }, ins.l2En) : null,
      ins.ex2 ? h('p', { class:'xen' }, ins.ex2) : null,
      arReveal(ins.arHtml, true)) : null
  ];
}

function stEmail(ctl){ var r = D.reading, raw = (r.paras || []).join(' ');
  ctl.enable('قرأت الإيميل');
  var mail = h('article', { class:'mail' + (S.hl ? ' hl-on' : ''), 'aria-label':'Second Reading · القراءة الثانية' }, mailHead(r), emailBody(false));
  /* أسماء الألوان من الدرس (reading.lg1 / lg2 / lg3)، ولا يُشرح لون لا يستعمله نصه. */
  var legend = h('div', { class:'legend', hidden:!S.hl },
    raw.indexOf('<<s:') >= 0 ? h('span', { class:'lg s' }, r.lg1 || 'Present Simple') : null,
    raw.indexOf('<<c:') >= 0 ? h('span', { class:'lg c' }, r.lg2 || 'Present Continuous') : null,
    raw.indexOf('<<t:') >= 0 ? h('span', { class:'lg t' }, r.lg3 || 'Signal word') : null);
  var nW = Math.max(10, Math.round(readingWords(r) / 10) * 10);
  var tg = h('input', { type:'checkbox', id:'hlToggle' }); tg.checked = !!S.hl;
  tg.addEventListener('change', function(){ S.hl = tg.checked; saveLocal(); mail.classList.toggle('hl-on', S.hl); legend.hidden = !S.hl; });
  var flSec = 0, flOn = false;
  var flBtn = h('button', { class:'ar-btn', type:'button' }, 'Fluency Timer');
  flBtn.addEventListener('click', function(){
    if (flOn) { clearReadTimer(); flOn = false; flBtn.textContent = 'Fluency timer (' + fmtSec(flSec) + ')'; }
    else { flSec = 0; flOn = true; clearReadTimer(); readTimerId = setInterval(function(){ flSec++; flBtn.textContent = 'Stop timer (' + fmtSec(flSec) + ')'; }, 1000); }
  });
  return [
    label('Step 3 · Second Reading (With Word Meanings)', 'الخطوة 3', h('span', { class:'tag' }, '~' + nW + ' words')),
    r.introEn ? h('p', { class:'en', dir:'ltr', style:'font-size:14.5px;font-weight:600;color:var(--ink-2);text-align:left' }, r.introEn) : null,
    r.introEn ? null : h('p', { class:'muted', html:arHTML(r.intro) }),
    h('div', { class:'mail-tools' },
      h('label', { class:'toggle', for:'hlToggle' }, tg, h('span', {}, r.hlLabel || 'Highlight grammar')),
      flBtn,
      h('span', { class:'hint' }, 'Tap underlined words for meaning, Oxford ↗ & human audio')),
    legend, mail
  ];
}

/* 3-stage Listening support for Listening days */
/* كلمة زر «Key Phrase Audio»: عبارة الدرس التي يطابق en (ثم headword) فيها listening.audioWord، وإلا أول كلمات الدرس. */
function keyPhraseOf(L){ var w = String((L && L.audioWord) || '').toLowerCase().trim();
  function by(f){ return w ? ALL_VOCAB.filter(function(v){ return String(v[f] || '').toLowerCase().trim() === w; })[0] : null; }
  return by('en') || by('headword') || ALL_VOCAB[0]; }
function stListen1(ctl){
  var L = D.listening || {};
  var sec = 0, target = L.targetSeconds || 90;
  var tSpan = h('span', { class:'rtimer-t' }, '00:00 / ' + fmtSec(target));
  clearReadTimer();
  readTimerId = setInterval(function(){ sec++; tSpan.textContent = fmtSec(sec) + ' / ' + fmtSec(target); }, 1000);
  var p = L.predict, gistBox = null;
  if (p) {
    var sel = S.predict;
    if (sel == null) ctl.set('إلى الأسئلة', false, function(){ S.listen1Done = true; touch(); nextStep(); });
    else ctl.set('إلى الأسئلة', true, function(){ S.listen1Done = true; touch(); nextStep(); });
    var fb = h('div', { hidden: sel == null });
    if (sel != null) put(fb, fbCard(sel === p.a, p.reveal || p.why, null, null, p.revealEn || p.whyEn));
    var btns = p.opts.map(function(t, i){
      var enOpt = p.optsEn && p.optsEn[i];
      var b = h('button', { class:'opt ar' + (sel === i ? ' picked' : ''), type:'button' },
        enOpt ? biNode(enOpt, t) : h('span', {}, t),
        h('span', { class:'o-dot' }));
      b.addEventListener('click', function(){
        S.predict = i; S.revealed = true; touch();
        btns.forEach(function(x, j){ x.classList.toggle('picked', j === i); });
        fb.hidden = false;
        put(fb, fbCard(i === p.a, p.reveal || p.why, null, null, p.revealEn || p.whyEn));
        ctl.set('إلى الأسئلة', true, function(){ S.listen1Done = true; touch(); nextStep(); });
      });
      return b;
    });
    gistBox = h('div', { style:'display:flex;flex-direction:column;gap:10px' },
      qCard(h('div', {}, p.qEn ? h('p', { class:'q-en sm', dir:'ltr', style:'margin-bottom:6px' }, p.qEn) : null, h('p', { class:'q-ar' }, p.q)), { tag:'Stage 1 · Main Idea Check' }),
      h('div', { class:'opts' }, btns),
      fb);
  } else {
    ctl.set('إلى الأسئلة', true, function(){ S.listen1Done = true; touch(); nextStep(); });
  }
  return [
    label('Listening · Stage 1 of 3 (Main Idea — No Transcript)', 'الاستماع ١ من ٣ · الفكرة العامة بدون النص المكتوب', h('span', { class:'tag' }, L.sourceTag || 'Audio Clip')),
    h('div', { class:'rtimer' },
      biNode('Step 1: Listen once in the source page for the main idea without looking at the transcript, then answer the main-idea question below.', 'الخطوة ١: استمع مرة واحدة للفكرة العامة بدون قراءة النص المكتوب، ثم أجب عن سؤال الفكرة العامة بالأسفل.'),
      tSpan),
    h('div', { class:'xbox' },
      h('span', { class:'xtag s', dir:'ltr' }, L.title || 'Audio Clip'),
      h('p', { class:'en-p', dir:'ltr' }, L.introEn || 'Listen first for the general idea without reading the transcript.'),
      h('p', { html:arHTML(L.intro || 'استمع أولًا للفكرة العامة في صفحة المصدر بدون قراءة النص المكتوب.') }),
      h('div', { class:'wbtns', style:'margin-top:4px' },
        L.url ? h('a', { class:'btn sm', href:L.url, target:'_blank', rel:'noopener noreferrer' }, biBtn('Open Audio Clip in Source Page ↗', 'افتح المقطع في صفحة المصدر ↗')) : null,
        h('button', { class:'btn out sm', type:'button', on:{ click:function(){ AUDIO.play(keyPhraseOf(L)); } } }, ico('speaker'), biBtn('Key Phrase Audio', 'سماع نطق الكلمات المفتاحية')))),
    gistBox
  ];
}
function stListen3(ctl){
  var L = D.listening || {};
  ctl.enable('التالي');
  var paras = L.paras || L.transcriptParas || (L.transcript ? [L.transcript] : []);
  var ins = L.insight;
  var insightBox = ins ? h('div', { class:'insight' },
      h('h3', { class:'bi-h', style:'font-size:16px' }, h('span', { class:'en', dir:'ltr' }, ins.titleEn), h('small', {}, ins.titleAr)),
      h('p', { class:'en', dir:'ltr', style:'font-size:14px;color:var(--ink-2);text-align:left' }, ins.l1En),
      h('p', { class:'xen' }, ins.ex1),
      h('p', { class:'en', dir:'ltr', style:'font-size:14px;color:var(--ink-2);text-align:left' }, ins.l2En),
      h('p', { class:'xen' }, ins.ex2),
      arReveal(ins.arHtml, true)) : null;
  var shSec = 0, shOn = false;
  var shBtn = h('button', { class:'ar-btn', type:'button' }, 'Shadowing Timer');
  shBtn.addEventListener('click', function(){
    if (shOn) { clearReadTimer(); shOn = false; shBtn.textContent = 'Shadowing timer (' + fmtSec(shSec) + ')'; }
    else { shSec = 0; shOn = true; clearReadTimer(); readTimerId = setInterval(function(){ shSec++; shBtn.textContent = 'Stop timer (' + fmtSec(shSec) + ')'; }, 1000); }
  });
  /* Real recordings: the transcript belongs to the source, so it is read there, not copied here. */
  if (!paras.length) {
    return [
      label('Listening · Stage 3 of 3 (Transcript & Shadowing)', 'الاستماع ٣ من ٣ · النص المكتوب والترديد مع المتحدث'),
      h('div', { class:'xbox' },
        h('p', { class:'en-p', dir:'ltr' }, 'Now open the transcript on the source page and read it while you listen again. Check anything you missed, then replay the clip and shadow the speakers aloud.'),
        h('p', {}, 'الآن افتح النص المكتوب في صفحة المصدر، واقرأه وأنت تستمع مرة أخرى لتراجع ما فاتك، ثم أعد تشغيل المقطع وردّد مع المتحدثين بصوت مسموع.'),
        L.url ? h('a', { class:'btn sm', href:L.url, target:'_blank', rel:'noopener noreferrer', style:'align-self:flex-start' }, biBtn('Open Transcript & Clip ↗', 'افتح النص والمقطع في صفحة المصدر ↗')) : null,
        L.sourceMeta ? h('p', { class:'fine', dir:'ltr' }, 'Source: ' + L.sourceMeta + (L.speakers ? ' · ' + L.speakers : '')) : null),
      insightBox,
      h('div', { class:'mail-tools' }, shBtn)
    ];
  }
  var bodyHtml = paras.map(function(p){ return '<p>' + parseMarkup(p) + '</p>'; }).join('');
  var mail = h('article', { class:'mail' + (S.hl ? ' hl-on' : ''), 'aria-label':'Audio Transcript · النص المكتوب للمقطع' },
    h('div', { class:'mail-meta' },
      h('div', {}, h('span', { class:'k' }, 'SOURCE'), L.sourceMeta || 'Audio Clip'),
      h('div', {}, h('span', { class:'k' }, 'SPEAKERS'), L.speakers || 'Dialogue'),
      h('div', {}, h('span', { class:'k' }, 'TITLE'), h('span', { class:'subj' }, L.title || 'Transcript'))),
    h('div', { class:'mail-body', dir:'ltr', html:bodyHtml }));
  var legend = h('div', { class:'legend', hidden:!S.hl },
    h('span', { class:'lg s' }, L.lg1 || 'Target Form 1'),
    h('span', { class:'lg c' }, L.lg2 || 'Target Form 2'),
    h('span', { class:'lg t' }, 'Key Signal'));
  var tg = h('input', { type:'checkbox', id:'hlToggleL' }); tg.checked = !!S.hl;
  tg.addEventListener('change', function(){ S.hl = tg.checked; saveLocal(); mail.classList.toggle('hl-on', S.hl); legend.hidden = !S.hl; });
  return [
    label('Listening · Stage 3 of 3 (Transcript & Shadowing)', 'الاستماع ٣ من ٣ · النص المكتوب والترديد مع المتحدث'),
    h('div', { class:'xbox' },
      h('p', { class:'en-p', dir:'ltr' }, 'Now read the full transcript to verify anything you missed, tap underlined words for Oxford ↗ & human audio, and replay the source clip to shadow the speaker aloud.'),
      h('p', {}, 'الآن اقرأ النص الكامل لمراجعة ما فاتك، واضغط الكلمات المسطّرة لمعناها ونطقها، ثم أعد تشغيل المقطع وردّد مع المتحدث بصوت مسموع.'),
      L.url ? h('a', { class:'btn sm out', href:L.url, target:'_blank', rel:'noopener noreferrer', style:'align-self:flex-start' }, biBtn('Replay Clip for Shadowing ↗', 'أعد تشغيل المقطع للترديد مع المتحدث ↗')) : null),
    insightBox,
    h('div', { class:'mail-tools' },
      h('label', { class:'toggle', for:'hlToggleL' }, tg, h('span', {}, 'Highlight grammar')),
      shBtn,
      h('span', { class:'hint' }, 'Tap underlined words for meaning, Oxford ↗ & human audio')),
    legend,
    mail
  ];
}

/* ---------- Stage 6: Short Quiz & Lesson Error Analysis ---------- */
var Q = null;
function startQuiz(){ var order = shuffle(D.quiz.map(function(_, i){ return i; }));
  Q = { score:0, res:[], items:order.map(function(k){ var x = D.quiz[k], perm = shuffle(x.opts.map(function(_, j){ return j; }));
    return { src:k, prompt:x.s, opts:perm.map(function(j){ return x.opts[j]; }), a:perm.indexOf(x.a), whyEn:x.whyEn, why:x.why, tag:x.tag, errCat:x.errCat || 'tense' }; }) };
  goStep(1); }
function stQuizIntro(ctl){ var best = S.quiz.best;
  ctl.set(best == null ? 'ابدأ الاختبار' : 'أعد الاختبار', true, startQuiz);
  return h('div', { class:'qi' },
    h('h1', { class:'bi-h' }, h('span', { class:'en', dir:'ltr', style:'color:#fff' }, 'Stage 6 · Short Quiz & Error Analysis'), h('small', { style:'color:var(--honey)' }, 'المرحلة 6')),
    h('p', { class:'en', dir:'ltr', style:'text-align:left;color:#fff;font-weight:600' }, '10 questions on vocabulary and grammar. Score 80% or higher to pass, followed by an analysis of your lesson mistakes and their causes.'),
    h('div', { class:'qi-stats' },
      h('div', { class:'qs' }, h('b', {}, String(D.quiz.length)), h('span', {}, 'Questions')),
      h('div', { class:'qs' }, h('b', { dir:'ltr' }, '80%'), h('span', {}, 'To Pass')),
      h('div', { class:'qs' }, h('b', { dir:'ltr' }, best == null ? '—' : best + '/' + D.quiz.length), h('span', {}, 'Best'))));
}
function stQuizQ(n, ctl){ if (!Q) { setTimeout(function(){ goStep(0); }, 0); return h('p', {}, ''); }
  var it = Q.items[n], last = n === Q.items.length - 1;
  ctl.set(last ? 'النتيجة وتحليل الأخطاء' : 'السؤال التالي', Q.res[n] != null, last ? finishQuiz : nextStep);
  var nodes = MCQ(it, { tag:it.tag, saved:Q.res[n] != null ? { v:Q.res[n].v } : null, onAnswer:function(c, v){ Q.res[n] = { c:c, v:v }; if (c) Q.score++; else { var qt = Date.now(); G.mistakes[mkey(curLessonId, 'qz-' + it.src)] = { lid:curLessonId, id:'qz-' + it.src, box:0, t:qt, due:qt + SR_DAYS[0] * 864e5 }; touch(); updateNav(); } ctl.set(last ? 'النتيجة وتحليل الأخطاء' : 'السؤال التالي', true, last ? finishQuiz : nextStep); } });
  return [label('Question ' + (n + 1) + ' of ' + Q.items.length, 'السؤال ' + (n + 1) + ' من ' + Q.items.length)].concat(nodes);
}
function finishQuiz(){ if (!Q) return; S.quiz.attempts = (S.quiz.attempts || 0) + 1; S.quiz.last = Q.score; S.quiz.best = Math.max(S.quiz.best || 0, Q.score); touch(); updateProgress(); nextStep(); }
function ring(v, max){ var r = 42, C = 2 * Math.PI * r, f = Math.max(0, Math.min(1, v / max));
  return h('div', { class:'ring-w', html:'<svg class="ring" viewBox="0 0 100 100" role="img" aria-label="' + v + ' من ' + max + '"><circle class="bg" cx="50" cy="50" r="' + r + '"/><circle class="fg' + (f < 0.8 ? ' low' : '') + '" cx="50" cy="50" r="' + r + '" stroke-dasharray="' + (C * f).toFixed(1) + ' ' + C.toFixed(1) + '"/><text x="50" y="52" text-anchor="middle" dominant-baseline="middle" font-size="24">' + v + '<tspan font-size="12" dx="1">/' + max + '</tspan></text></svg>' }); }

function renderErrorAnalysis(quizWrongs){
  var grouped = {};
  function addErr(cat, title, right, whyEn, whyAr){
    cat = ERR_CATS[cat] ? cat : 'general';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push({ title:title, right:right, whyEn:whyEn, whyAr:whyAr });
  }
  (quizWrongs || []).forEach(function(it){
    var pp = it.prompt.split('___');
    var full = pp.length > 1 ? pp[0] + '[' + it.opts[it.a] + ']' + pp[1] : it.prompt + ' → ' + it.opts[it.a];
    addErr(it.errCat || 'tense', full, it.opts[it.a], it.whyEn, it.why);
  });
  Object.keys(S.ans).forEach(function(id){
    var a = S.ans[id];
    if (!a || a.c) return;
    var it = ITEMS[id];
    if (!it) return;
    var x = it.x, right = '';
    if (it.type === 'mcq') right = x.opts[x.a];
    else if (it.type === 'tf') right = x.ok ? 'Correct' : x.fix;
    else if (it.type === 'rtf') right = x.a ? 'True' : 'False';
    else if (it.type === 'typing' || it.type === 'recall') right = x.ans[0];
    else if (it.type === 'builder') right = x.ans;
    addErr(it.errCat || 'tense', itemText(it), right, x.whyEn || x.spellNoteEn, x.why || x.spellNote || x.spellNoteAr);
  });
  var cats = Object.keys(grouped);
  if (!cats.length) {
    return h('div', { class:'err-analysis' },
      h('h3', { class:'bi-h', style:'font-size:16px' }, h('span', { class:'en', dir:'ltr' }, 'Lesson Error Analysis'), h('small', {}, 'تحليل أخطاء الدرس وأسبابها')),
      h('div', { class:'fb' }, h('span', { class:'fb-ic' }, ico('check')),
        h('div', { class:'fb-t' },
          h('b', {}, 'Zero Mistakes Across the Lesson!'),
          h('p', { class:'fb-en' }, 'You used today\'s grammar correctly in every exercise and spelled the recall words accurately.'),
          arReveal('أصبت في قاعدة اليوم في كل التمارين، وأتقنت إملاء كلمات الاسترجاع.', false))));
  }
  return h('div', { class:'err-analysis' },
    h('h3', { class:'bi-h', style:'font-size:16px' }, h('span', { class:'en', dir:'ltr' }, 'Lesson Error Analysis (' + cats.length + ' ' + (cats.length === 1 ? 'Category' : 'Categories') + ')'), h('small', {}, 'تحليل أخطاء الدرس وأسبابها')),
    cats.map(function(cKey){
      var info = ERR_CATS[cKey] || ERR_CATS.general, list = grouped[cKey];
      return h('div', { class:'err-cat' },
        h('div', { class:'err-cat-h' },
          biNode(info.en, info.ar),
          h('span', { class:'tag' }, h('bdi', { class:'en', dir:'ltr' }, list.length + (list.length === 1 ? ' item' : ' items')), ' · ' + (list.length === 1 ? 'سؤال' : 'أسئلة'))),
        h('div', { class:'err-cat-why' },
          h('p', { class:'en', dir:'ltr', style:'font-weight:600;color:var(--ink);text-align:left' }, 'Why it happens: ' + info.whyEn),
          arReveal(info.whyAr, false)),
        list.slice(0, 5).map(function(e){
          return h('div', { class:'wl' },
            h('p', { class:'xen' }, e.title, e.right ? [' → ', h('b', {}, e.right)] : null),
            e.whyEn ? h('p', { class:'en', dir:'ltr', style:'text-align:left;font-weight:600;color:var(--ink)' }, e.whyEn) : null,
            e.whyAr ? arReveal(e.whyAr, false) : null);
        }));
    }));
}

function stQuizResult(ctl){ if (!Q) { var b = S.quiz.last; if (b == null) { setTimeout(function(){ goStep(0); }, 0); return h('p', {}, ''); } }
  var sc = Q ? Q.score : S.quiz.last, n = D.quiz.length, pass = sc >= Math.ceil(n * 0.8);
  var wrong = Q ? Q.items.filter(function(_, j){ return !(Q.res[j] && Q.res[j].c); }) : [];
  if (pass) ctl.set('رجوع للدرس', true, closePlayer); else ctl.set('أعد الاختبار', true, function(){ Q = null; goStep(0); });
  return h('div', { class:'result' }, ring(sc, n),
    h('div', { class:'res-msg' }, sc === n ? biNode('Perfect Score!', 'علامة كاملة!') : (pass ? biNode('Great job, you passed!', 'ممتاز، نجحت في الاختبار.') : biNode('Almost! You need 80% to pass.', 'قريب! تحتاج 80% للنجاح.'))),
    h('div', { class:'res-sub' }, pass ? biNode('Stage 6 complete! Review the error analysis below. Any missed questions were added to your mistake notebook.', 'اكتملت المرحلة السادسة! راجع تحليل الأخطاء بالأسفل.') : biNode('Review the error analysis below and try the quiz again.', 'راجع تحليل الأخطاء بالأسفل ثم أعد الاختبار.')),
    renderErrorAnalysis(wrong),
    pass ? h('button', { class:'btn out sm', type:'button', on:{ click:function(){ Q = null; goStep(0); } } }, biBtn('Retake Quiz', 'أعد الاختبار')) : null);
}

/* ---------- Stage 5: Writing (4 Separate Sentences + Spelling Separated from Grammar) ---------- */
var VRE = { scientist:/\bscientists?\b/i, research:/\bresearch(es|ed|er|ers|ing)?\b/i, team:/\bteams?\b/i, lab:/\blabs?\b|\blaborator(y|ies)\b/i, data:/\bdata\b/i, measure:/\bmeasur(e|es|ed|ing|ement|ements)\b/i, temperature:/\btemperatures?\b/i, safe:/\bsafe(ly|r|st)?\b/i, strange:/\bstrange(ly|r|st)?\b/i, health:/\bhealth(y|ier)?\b/i, culture:/\bcultur(e|es|al)\b/i, miss:/\bmiss(es|ed|ing)?\b/i, 'sign a contract':/\bsign(s|ed|ing)?\s+(a|the|my|our)?\s*contracts?\b/i, lawyer:/\blawyers?\b/i, client:/\bclients?\b/i, office:/\boffices?\b/i, court:/\bcourts?\b/i, busy:/\bbus(y|ier|iest)\b/i, helpful:/\bhelpful\b/i, prepare:/\bprepar(e|es|ed|ing)\b/i, 'give legal advice':/\bgiv(e|es|ing)\s+(?:legal\s+)?advice\b|\blegal\s+advice\b/i, case:/\bcases?\b/i, judge:/\bjudges?\b/i, witness:/\bwitness(es)?\b/i, folder:/\bfolders?\b/i, seat:/\bseats?\b/i, mistake:/\bmistakes?\b/i, ready:/\bready\b/i, 'go to court':/\bgo(es|ing)?\s+to\s+court\b|\bin\s+court\b/i, yesterday:/\byesterday\b/i, hearing:/\bhearings?\b/i, absent:/\babsent\b/i, late:/\blate(r|st)?\b/i, traffic:/\btraffic\b/i, calm:/\bcalm(ly)?\b/i, clear:/\bclear(ly)?\b/i, 'hire a lawyer':/\bhir(e|es|ed|ing)\s+(a|the|our)?\s*lawyers?\b/i, sentence:/\bsentences?\b/i, capital:/\bcapitals?\b/i, period:/\bperiods?\b/i, draft:/\bdrafts?\b/i, polite:/\bpolite(ly)?\b/i, short:/\bshort(er|est)?\b/i, explain:/\bexplain(s|ed|ing)?\b/i, 'legal right':/\blegal\s+rights?\b/i, careful:/\bcareful(ly)?\b/i, useful:/\buseful\b/i, beautiful:/\bbeautiful(ly)?\b/i, study:/\bstud(y|ies|ied|ying)\b/i, write:/\bwrit(e|es|ing)|wrote|written\b/i, rain:/\brain(s|ed|ing|y)?\b/i, check:/\bcheck(s|ed|ing)?\b/i, 'official document':/\bofficial\s+documents?\b/i };
/* أشكال الكلمة التي تُعدّ استعمالًا لها في الكتابة: s وes وed وing، وd وing بعد e، وies وied بعد حرف ساكن وy،
   ومضاعفة الحرف الأخير (planned)، وصيغ الشاذ من قائمة irregularVerbs في content.js (went, had). وفي العبارة تتصرّف كلمتها الأولى:
   went on holiday، paid a fine. وVRE يبقى مقدَّمًا لكلماته. */
var IRR_EXTRA = { get: ['got', 'gotten'] };
function wordForms(w){
  w = String(w || '').toLowerCase();
  var f = [w, w + 's', w + 'es', w + 'ed', w + 'ing'];
  if (/e$/.test(w)) f.push(w + 'd', w.slice(0, -1) + 'ing');
  if (/[^aeiou]y$/.test(w)) f.push(w.slice(0, -1) + 'ies', w.slice(0, -1) + 'ied');
  if (/[^aeiou][aeiou][bdgklmnprt]$/.test(w)) f.push(w + w.slice(-1) + 'ed', w + w.slice(-1) + 'ing');
  var iv = (typeof DATA !== 'undefined' && DATA && DATA.irregularVerbs) || [];
  iv.forEach(function(x){ if (x && x.base === w) String(x.past || '').split('/').concat([x.pp]).forEach(function(p){ p = String(p || '').trim(); if (p) f.push(p); }); });
  (IRR_EXTRA[w] || []).forEach(function(p){ f.push(p); });
  return f;
}
function matchVocabInText(v, text){
  if (VRE[v.en]) return VRE[v.en].test(text);
  var hw = (v.headword || v.en || '').trim();
  if (!hw) return false;
  var esc = function(x){ return x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); };
  var parts = hw.split(/\s+/), head = '(?:' + wordForms(parts[0]).map(esc).join('|') + ')';
  var re = parts.length === 1 ? new RegExp('\\b' + head + '\\b', 'i')
    : new RegExp('\\b' + head + '\\s+' + parts.slice(1).map(esc).join('\\s+') + '(?:s|es)?\\b', 'i');
  return re.test(text);
}
var SIG_RE = /\b(usually|always|often|sometimes|never|every\s+(?:day|morning|afternoon|evening|night|week|weekend|month|year|friday|saturday|sunday|monday|tuesday|wednesday|thursday)|on\s+(?:fridays|saturdays|sundays|mondays|tuesdays|wednesdays|thursdays|weekends))\b/gi;
var CONT_RE = /\b(?:am|is|are|i'm|you're|we're|they're|he's|she's|it's)\s+(?:not\s+|also\s+|still\s+|really\s+)?([a-z]+ing)\b/gi;
var ING_NOT = ['interesting','boring','amazing','exciting','morning','evening','everything','nothing','something','anything','thing','king','spring','ring','sing','bring','during','ceiling','building','wedding','string','swing','wing','sibling','darling'];
var WRITING_TYPOS = {
  studing: { right:'studying', why:'Keep y before adding -ing (study → studying).' },
  writting: { right:'writing', why:'Drop silent -e without doubling t (write → writing).' },
  rainning: { right:'raining', why:'Do not double n after two vowels ai (rain → raining).' },
  butefull: { right:'beautiful', why:'Suffix -ful ends with one l (beautiful).' },
  beautifull: { right:'beautiful', why:'Suffix -ful ends with one l (beautiful).' },
  scintist: { right:'scientist', why:'Remember scie- in scientist.' },
  temprature: { right:'temperature', why:'Remember the middle -era- in temperature.' },
  carefull: { right:'careful', why:'Suffix -ful ends with one l (careful).' },
  usefull: { right:'useful', why:'Suffix -ful ends with one l (useful).' },
  helpfull: { right:'helpful', why:'Suffix -ful ends with one l (helpful).' },
  writeing: { right:'writing', why:'Drop the silent -e before -ing (write → writing).' },
  studys: { right:'studies', why:'Consonant + y → -ies with he / she / it (study → studies).' }
};

function analyze(t){ var text = fixQuotes(t);
  var words = (text.match(/[A-Za-z']+/g) || []).length;
  var sentences = text.split(/[.!?]+/).filter(function(s){ return (s.match(/[A-Za-z']+/g) || []).length >= 3; }).length;
  var runOn = words >= 28 && sentences < 4;
  var cont = 0, m; CONT_RE.lastIndex = 0; while ((m = CONT_RE.exec(text))) { if (ING_NOT.indexOf(m[1].toLowerCase()) < 0) cont++; }
  var sig = (text.match(SIG_RE) || []).length;
  var used = ALL_VOCAB.filter(function(v){ return matchVocabInText(v, text); }).map(function(v){ return v.en; });
  return { words:words, sentences:sentences, runOn:runOn, cont:cont, sig:sig, used:used }; }

var CHECKS = [
  { k:'sentences', tEn:'At least 4 separate sentences (end each with a period .)', t:'4 جمل منفصلة على الأقل (بنقطة في نهاية كل جملة)', ok:function(a){ return a.sentences >= 4; } },
  { k:'cont', tEn:'2 sentences in Present Continuous', t:'جملتان بالمضارع المستمر', ex:'am / is / are + ing', ok:function(a){ return a.cont >= 2; } },
  { k:'sig', tEn:'At least 2 routine signal words', t:'كلمتا روتين على الأقل', ex:'usually · every day · often', ok:function(a){ return a.sig >= 2; } },
  { k:'vocab', tEn:'3 words/phrases from the lesson', t:'3 كلمات أو عبارات من الدرس', ok:function(a){ return a.used.length >= 3; } }
];

function localWritingCheck(text){
  text = fixQuotes(text); /* «I don’t» من الآيفون تُفحص كـ «I don't» في كل الفحوص */
  var a = analyze(text);
  var gMist = [], sMist = [];
  if (/\b(?:I\s+am|He\s+is|She\s+is|We\s+are|They\s+are)\s+(?:work|study|go|live|sleep|wake|check|measure|miss)\b/i.test(text)) {
    var m1 = text.match(/\b(?:I\s+am|He\s+is|She\s+is|We\s+are|They\s+are)\s+(?:work|study|go|live|sleep|wake|check|measure|miss)\b/i)[0];
    gMist.push({ wrong:m1, right:m1.replace(/\b(He|She)\s+is\s+(\w+)/i, '$1 $2s').replace(/\b(am|is|are)\s+/i, ''), why:'Do not put am/is/are before a base verb in Present Simple.' });
  }
  if (/\b(?:I|He|She|We|They)\s+(?:working|studying|going|living|sleeping|sitting|writing|reading|learning)\b/i.test(text)) {
    var m2 = text.match(/\b(?:I|He|She|We|They)\s+(?:working|studying|going|living|sleeping|sitting|writing|reading|learning)\b/i)[0];
    gMist.push({ wrong:m2, right:m2.replace(/^(\w+)\s+/, '$1 am/is/are '), why:'Present Continuous needs am / is / are before verb-ing.' });
  }
  if (/\b(?:am|is|are|'m|'s|'re)\s+(?:knowing|needing|wanting|understanding|loving)\b/i.test(text)) {
    var m3 = text.match(/\b(?:am|is|are|'m|'s|'re)\s+(?:knowing|needing|wanting|understanding|loving)\b/i)[0];
    gMist.push({ wrong:m3, right:'know / need / want / understand', why:'Stative verbs do not take -ing.' });
  }
  if (/\bi\b/.test(text)) {
    sMist.push({ wrong:'i', right:'I', why:'Always write the pronoun "I" with a capital letter.' });
  }
  Object.keys(WRITING_TYPOS).forEach(function(k){
    var re = new RegExp('\\b' + k + '\\b', 'i');
    if (re.test(text)) sMist.push({ wrong:k, right:WRITING_TYPOS[k].right, why:WRITING_TYPOS[k].why });
  });
  if (a.runOn) {
    sMist.push({ wrong:'One long connected sentence', right:'4 separate sentences with periods (.)', why:'Split long sentences with a period (.) and start the next sentence with a capital letter.' });
  }
  var activeCks = (D.writing && Array.isArray(D.writing.checks)) ? D.writing.checks : CHECKS;
  var met = activeCks.filter(function(c){ return c.ok(a, text); }).length, all = met >= activeCks.length, four = activeCks.length === 4;
  var score = Math.max(4, Math.min(10, 6 + met - gMist.length - Math.min(2, sMist.length)));
  return {
    score: score,
    praise: all ? (four ? 'Great job meeting all 4 task criteria!' : 'Great job meeting all the task criteria!') : 'Good effort practicing today\'s grammar and vocabulary!',
    grammarMistakes: gMist,
    spellingMistakes: sMist,
    mistakes: gMist.concat(sMist),
    corrected: '',
    next: !all ? (four ? 'Try to complete all 4 checklist items above for a higher score.' : 'Try to complete all the checklist items above for a higher score.') : 'Keep separating each sentence clearly with a period and capital letter.'
  };
}

function stWriting(ctl){
  var W = D.writing || {};
  /* بلا تصحيح تلقائي من iOS: يبقى الحرف الصغير في i وبداية الجملة والإملاء الخاطئ كما كتبه المتعلم، فيراه الفحص. */
  var ta = h('textarea', { class:'wt', id:'wText', rows:'8', placeholder:W.placeholder || 'Write your sentences here…', autocomplete:'off', autocapitalize:'off', autocorrect:'off', spellcheck:'false', 'aria-label':'Your paragraph in English · فقرتك بالإنجليزي' }); ta.value = S.writing.text || '';
  var checks = h('ul', { class:'checks', 'aria-live':'polite' }), count = h('p', { class:'wcount' }), runOnWarn = h('div', { class:'tip', hidden:true }), fbBox = h('div', { hidden:true, 'aria-live':'polite' });
  function paint(){ var a = analyze(ta.value), text = fixQuotes(ta.value);
    var activeCks = (D.writing && Array.isArray(D.writing.checks)) ? D.writing.checks : CHECKS;
    put(checks, activeCks.map(function(c){ var on = c.ok(a, text); return h('li', { class:on ? 'on' : '' }, h('span', { class:'cb' }, on ? ico('check') : null), h('div', { class:'ck-t' }, h('span', { class:'ck-en' }, c.tEn || c.t), c.ex ? h('span', { class:'ck-ex', dir:'ltr', lang:'en' }, c.ex) : null, (c.k === 'vocab' && a.used.length) ? h('span', { class:'used' }, a.used.map(function(u){ return h('span', {}, u); })) : null)); }));
    count.textContent = 'Words: ' + a.words + ' · Separate sentences: ' + a.sentences + ' / 4';
    runOnWarn.hidden = !a.runOn;
    if (a.runOn) put(runOnWarn, biNode('Tip: Split your writing into at least 4 separate sentences ending with a period (.) rather than one long connected sentence.', 'تنبيه: قسّم كتابتك إلى 4 جمل منفصلة تنتهي كل منها بنقطة (.) بدل جملة واحدة طويلة موصولة.'));
    return a; }
  var t1, t2;
  ta.addEventListener('input', function(){ clearTimeout(t1); t1 = setTimeout(paint, 120); clearTimeout(t2); t2 = setTimeout(function(){ S.writing.text = ta.value; touch(); }, 900); });
  var fix = h('button', { class:'btn', type:'button' }, ico('spark'), biBtn('Instant Check (Grammar vs. Spelling)', 'تصحيح فوري (يفصل القواعد عن الإملاء)'));
  var copy = h('button', { class:'btn out', type:'button' }, ico('copy'), biBtn('Copy for Chat', 'نسخ للمحادثة'));
  fix.addEventListener('click', function(){ correctWriting(ta, fix, fbBox); });
  copy.addEventListener('click', function(){ var text = ta.value.trim(); if (!text) { toast('Paragraph is empty.'); return; }
    var payload = 'صحّح لي فقرة درس «' + (D.en || lessonTag(curLessonId)) + '» من جواز الإنجليزية (مع فصل أخطاء الإملاء عن القواعد):\n\n' + text, fallback = function(){ ta.focus(); ta.select(); toast('Text selected — copy from your device menu.'); };
    try { navigator.clipboard.writeText(payload).then(function(){ toast('Copied! Paste it in chat.'); }, fallback); } catch (e) { fallback(); } });
  ctl.set(S.writingDone ? 'التالي' : 'إنهاء المهمة', true, function(){ var a = analyze(ta.value); if (a.sentences < 4) { toast('Write at least 4 separate sentences ending with a period (.).'); return; } S.writing.text = ta.value; S.writingDone = true; touch(); updateProgress(); nextStep(); });
  if (S.writing.fb) { fbBox.hidden = false; paintFeedback(fbBox, S.writing.fb); }
  paint();
  var modelSrc = W.modelMarked || W.model || '', modelLegend = writingModelLegend(W, modelSrc);
  return [
    label('Stage 5 of 6 · Writing', 'المرحلة 5 من 6'),
    h('div', { class:'task' },
      D.writing.taskEn ? h('p', { class:'task-en' }, D.writing.taskEn) : null,
      h('p', { class:'task-ar', dir:'rtl', lang:'ar' }, D.writing.task),
      checks),
    ta, count, runOnWarn,
    h('div', { class:'wbtns' }, fix, copy),
    SAMPLE ? h('p', { class:'fine' }, 'Instant check separates Grammar & Usage from Spelling mistakes.') : null,
    fbBox,
    h('details', { class:'model' },
      h('summary', {}, 'Model Answer'),
      h('p', { class:'model-t hl-on', dir:'ltr', html:parseMarkup(modelSrc) }),
      modelLegend ? h('p', { class:'fine' }, modelLegend) : null)
  ];
}
/* شرح ألوان النموذج من الدرس (legendEn / legendAr)، وإلا سطر عام إن كان في النموذج تلوين (<<s: أو <<c:)،
   ولا سطر لنموذج بلا ألوان (u0l4). */
function writingModelLegend(W, src){
  if (W.legendEn || W.legendAr) return [W.legendEn, W.legendAr].filter(Boolean).join(' · ');
  return /<<[sc]:/.test(src || '') ? 'Highlighted words show today\'s grammar and lesson words' : '';
}
function paintFeedback(box, fb){
  var gMist = Array.isArray(fb.grammarMistakes) ? fb.grammarMistakes : (Array.isArray(fb.mistakes) ? fb.mistakes.filter(function(m){ return m.kind !== 'spelling'; }) : []);
  var sMist = Array.isArray(fb.spellingMistakes) ? fb.spellingMistakes : (Array.isArray(fb.mistakes) ? fb.mistakes.filter(function(m){ return m.kind === 'spelling'; }) : []);
  function renderList(arr){
    return h('ol', {}, arr.map(function(m){
      var whyParts = String(m.why || '').split(' · ');
      var whyNode = !m.why ? null : (whyParts.length > 1 ? biNode(whyParts[0], whyParts.slice(1).join(' · ')) : h('p', { class:'why', html:arHTML(m.why) }));
      return h('li', {}, h('p', { class:'fx' }, h('s', {}, m.wrong), h('span', { 'aria-hidden':'true' }, '←'), h('b', {}, m.right)), whyNode);
    }));
  }
  put(box, h('div', { class:'fbk' },
    h('div', { class:'fbk-top' }, ring(fb.score, 10), h('div', {}, h('p', { class:'st-lbl' }, 'Teacher Feedback'), (String(fb.praise || '').indexOf(' · ') >= 0 ? biNode(fb.praise.split(' · ')[0], fb.praise.split(' · ')[1]) : h('p', { style:'font-weight:600', html:arHTML(fb.praise) })))),
    h('div', { class:'fbk-sec' },
      h('h3', {}, '1. Grammar and usage (' + gMist.length + ')'),
      gMist.length ? renderList(gMist) : h('p', { style:'font-weight:600;color:var(--ok-ink);font-size:13.5px' }, 'No grammar mistakes found!')),
    h('div', { class:'fbk-sec spell' },
      h('h3', {}, '2. Spelling and punctuation (' + sMist.length + ')'),
      sMist.length ? renderList(sMist) : h('p', { style:'font-weight:600;color:var(--ok-ink);font-size:13.5px' }, 'Clean spelling and punctuation!')),
    fb.corrected ? h('div', { class:'fbk-corr' }, h('h3', {}, 'Corrected Paragraph'), h('p', { dir:'ltr' }, fb.corrected)) : null,
    fb.next ? h('p', { class:'fbk-next', html:'<b>Next step: </b>' + arHTML(fb.next) }) : null));
}

/* done screens */
var PART_SCORE = {
  recall:function(){ return scoreOf(IDS.rc); },
  vocab:function(){ return scoreOf(IDS.vg); },
  grammar:function(){ return scoreOf([].concat(IDS.gA, IDS.gB, IDS.gC, IDS.gD)); },
  reading:function(){ return scoreOf((D.listening && !D.reading) ? IDS.lq : IDS.rq); },
  writing:function(){ return S.writing.fb ? 'Paragraph score: ' + S.writing.fb.score + '/10' : 'Paragraph saved'; },
  quiz:function(){ return S.quiz.best != null ? S.quiz.best + ' of ' + D.quiz.length + ' · ' + S.quiz.best + ' من ' + D.quiz.length : ''; }
};
function scoreOf(ids){ var c = (ids || []).filter(function(id){ return S.ans[id] && S.ans[id].c; }).length, a = (ids || []).filter(function(id){ return S.ans[id]; }).length; return c + ' correct of ' + a + ' · ' + c + ' صحيحة من ' + a; }
function stDone(k, ctl){ updateProgress(); var p = partOf(k), idx = PARTS.indexOf(p), nxt = PARTS[idx + 1], pr = lessonProgress(), all = pr.done === pr.total, isDone = !!S.stamps[k];
  if (all) ctl.set('رجوع للدرس', true, closePlayer);
  else if (nxt) ctl.set('التالي: ' + nxt.ar, true, function(){ openPart(nxt.k); });
  else ctl.set('رجوع للدرس', true, closePlayer);
  var redo = (k !== 'quiz' && k !== 'writing') ? h('button', { class:'link', type:'button', on:{ click:function(){ resetPart(k); } } }, 'Redo exercises in this stage') : null;
  return h('div', { class:'fin' }, h('span', { class:'done-ic pop' }, all ? ico('star') : ico('check')),
    h('h1', { class:'bi-h' },
      h('span', { class:'en', dir:'ltr' }, all ? 'Lesson Complete!' : (isDone ? p.fullEn + ' Complete!' : 'End of ' + p.fullEn)),
      h('small', {}, all ? 'اكتمل الدرس بمراحله الست!' : (isDone ? 'اكتملت مرحلة ' + p.fullAr : 'وصلت لنهاية ' + p.fullAr))),
    h('p', {}, all ? 'All 6 stages finished!' : (isDone ? PART_SCORE[k]() : 'Some questions in this stage are still unanswered.')),
    all ? penguin(84, 119) : null, redo);
}
function resetPart(k){ var ids = k === 'recall' ? IDS.rc : k === 'vocab' ? IDS.vg : k === 'grammar' ? [].concat(IDS.gA, IDS.gB, IDS.gC, IDS.gD) : k === 'reading' ? ((D.listening && !D.reading) ? IDS.lq : IDS.rq) : [];
  ids.forEach(function(id){ delete S.ans[id]; }); if (k === 'vocab') { M = null; } touch(); P.i = 0; S.step[k] = 0; saveLocal(); toast('Stage reset'); render(); }
function stExpressIntro(ctl){
  ctl.enable('ابدأ');
  return h('div', { class:'intro' },
    h('span', { class:'intro-ic' }, ico('clock')),
    label('Busy-Day Express Mode · 15 Minutes', 'الوضع المختصر للأيام المزحومة · ١٥ دقيقة'),
    h('h1', { class:'bi-h' }, h('span', { class:'en', dir:'ltr' }, '15-Minute Express Review'), h('small', {}, 'مراجعة سريعة تحفظ سلسلتك في الأيام المزحومة')),
    h('p', { class:'en-p', dir:'ltr' }, 'Short on time today? Complete 3 active recall words from memory, 3 key flashcards (including the legal phrase), and 2 targeted Error Lab drills.'),
    h('p', {}, 'يومك مزحوم؟ أنجز ٣ كلمات بالاسترجاع النشط كتابةً، و٣ بطاقات (مع العبارة القانونية)، وسؤالين من مختبر الأخطاء. تُسجَّل جلسة مراجعة (+١٥ دقيقة في ساعات الدراسة) لا درسًا مكتملًا.'),
    h('ul', {}, [
      ['pen', '3 Active Recall words typed from memory', '٣ كلمات استرجاع نشط كتابةً من الذاكرة'],
      ['cards', '3 Flashcards + Legal Phrase with human audio', '٣ بطاقات مع العبارة القانونية والنطق البشري'],
      ['spark', '2 Priority Error Lab drills', 'تمرينان من أعلى أنماط مختبر الأخطاء تكرارًا']
    ].map(function(x){ return h('li', {}, ico(x[0]), biNode(x[1], x[2])); })));
}
function stIrrDrill(st, ctl){
  var v = (D.irregularVerbs || []).filter(function(x){ return x.base === st.base; })[0] || D.irregularVerbs[0];
  var inPast = h('input', { class:'gap-in', type:'text', dir:'ltr', autocomplete:'off', autocapitalize:'off', autocorrect:'off', spellcheck:'false', placeholder:'Past Simple…', 'aria-label':'Past Simple of ' + v.base });
  var inPp = h('input', { class:'gap-in', type:'text', dir:'ltr', autocomplete:'off', autocapitalize:'off', autocorrect:'off', spellcheck:'false', placeholder:'Past Participle…', 'aria-label':'Past Participle of ' + v.base });
  var fb = h('div', { hidden:true }), done = false;
  var card = qCard(h('div', {},
    h('p', { class:'en', dir:'ltr', style:'font-size:13.5px;color:var(--on-dark-2);text-align:left' }, 'Type the Past Simple (V2) and Past Participle (V3) from memory:'),
    h('p', { class:'q-en', dir:'ltr', style:'margin-top:4px' }, v.base, h('span', { class:'verb' }, ' (' + v.ar + ')')),
    h('div', { class:'irr-inputs' },
      h('div', { class:'irr-field' }, h('label', {}, 'Past Simple (V2)'), inPast),
      h('div', { class:'irr-field' }, h('label', {}, 'Past Participle (V3)'), inPp))
  ), { tag:'Irregular Verbs' });

  function matchForm(typed, target){
    var nt = norm(typed);
    return String(target).split('/').some(function(part){ return norm(part) === nt; }) || norm(target) === nt;
  }
  function check(){
    if (done) return;
    var p1 = inPast.value.trim(), p2 = inPp.value.trim();
    if (!p1 || !p2) {
      var emptyEl = !p1 ? inPast : inPp;
      emptyEl.classList.remove('shake'); void emptyEl.offsetWidth; emptyEl.classList.add('shake'); emptyEl.focus();
      return;
    }
    done = true;
    var ok1 = matchForm(p1, v.past), ok2 = matchForm(p2, v.pp), ok = ok1 && ok2;
    inPast.disabled = true; inPp.disabled = true;
    inPast.classList.add(ok1 ? 'ok' : 'bad');
    inPp.classList.add(ok2 ? 'ok' : 'bad');
    var cur = (G.irrSr && G.irrSr[v.base]) || { box:0, nextAt:0 };
    var nextBox = ok ? Math.min(4, (cur.box || 0) + 1) : 1;
    var days = SR_DAYS[Math.min(SR_DAYS.length - 1, nextBox - 1)];
    G.irrSr[v.base] = { box:nextBox, lastAt:Date.now(), nextAt:Date.now() + days * 864e5 };
    if (!ok) bumpErrorLab('spelling', v.base + ' → ' + v.past + ' → ' + v.pp);
    touch();
    fb.hidden = false;
    var whyEn = 'Three forms: ' + v.base + ' → ' + v.past + ' → ' + v.pp + ' (Next review in +' + days + 'd).';
    var whyAr = 'الصيغ الثلاث للفعل (' + v.ar + '): ' + v.base + ' → ' + v.past + ' → ' + v.pp + ' · المراجعة القادمة بعد ' + days + ' يوم.';
    var cNode = fbCard(ok, whyAr, null, ok ? null : ['Correct forms', v.base + ' → ' + v.past + ' → ' + v.pp], whyEn);
    cNode.querySelector('.fb-t').append(h('div', { class:'audio-row' }, sayBtn(v.base, 'Human Pronunciation'), oxBtn(v.base)));
    put(fb, cNode);
    ctl.enable('التالي');
  }
  inPast.addEventListener('keydown', function(e){ if (e.key === 'Enter') { e.preventDefault(); inPp.focus(); } });
  inPp.addEventListener('keydown', function(e){ if (e.key === 'Enter') { e.preventDefault(); check(); } });
  ctl.set('تحقق', true, check);
  return [label('Irregular Verb ' + st.pos + ' of ' + st.total, 'الفعل الشاذ ' + st.pos + ' من ' + st.total), card, fb];
}
function stErrDrill(st, ctl){
  var cat = (D.errorLabCatalog || []).filter(function(c){ return c.key === st.catKey; })[0] || D.errorLabCatalog[0];
  var d = (cat.drills && cat.drills[st.dIdx]) || cat.drills[0];
  ctl.set('التالي', false, nextStep);
  var nodes = MCQ({ prompt:d.s, opts:d.opts, a:d.a, whyEn:d.whyEn, why:d.why }, {
    tag:'Error Lab · ' + cat.en,
    onAnswer:function(ok){
      var entry = G.errorLab[cat.key] || { count:cat.seedCount || 1, solved:0, box:0 };
      if (ok) {
        entry.solved = (entry.solved || 0) + 1;
        entry.box = Math.min(4, (entry.box || 0) + 1);
        var days = SR_DAYS[Math.min(SR_DAYS.length - 1, entry.box - 1)];
        entry.nextAt = Date.now() + days * 864e5;
      } else {
        entry.count = (entry.count || 0) + 1;
        entry.box = 1;
        entry.nextAt = Date.now() + 864e5;
      }
      G.errorLab[cat.key] = entry;
      touch();
      ctl.enable('التالي');
    }
  });
  return [
    label('Error Lab Drill · ' + cat.en, 'تمرين مختبر الأخطاء · ' + cat.ar),
    h('div', { class:'elab-ex' }, h('span', { class:'no' }, cat.wrongEx), h('span', { class:'yes' }, cat.rightEx))
  ].concat(nodes);
}
function stSessionDone(k, ctl){
  if (P && !P._logged) {
    P._logged = true;
    var n = Math.max(0, P.steps.length - 1);
    if (k === 'express') G.expressSessions = (G.expressSessions || 0) + 1;
    else G.practiceMins = (G.practiceMins || 0) + (k === 'cards' ? Math.round(n / 4) : n);
    touch(); SYNC.soon();
  }
  var isRev = (k === 'review' || k === 'errlab' || String(k).indexOf('errlab:') === 0);
  var ctaLbl = k === 'express' ? 'رجوع للدرس' : (isRev ? 'رجوع للمراجعة' : 'رجوع للكلمات');
  ctl.set(ctaLbl, true, closePlayer);
  var left = mistakeIds().length;
  var titleEn = k === 'express' ? '15-Min Express Review Logged!' : k === 'irregular' ? 'Irregular Verbs Practice Complete!' : isRev ? 'Error Lab & Review Complete!' : 'Flashcards Complete';
  var titleAr = k === 'express' ? 'سُجّلت جلسة الوضع المختصر (+١٥ دقيقة)!' : k === 'irregular' ? 'أنهيت تدريب الأفعال الشاذة!' : isRev ? 'أنهيت جلسة مختبر الأخطاء والمراجعة!' : 'أنهيت البطاقات';
  var desc = k === 'express'
    ? 'Added +15 minutes to your study hours as a review session (not a completed lesson). Total express sessions: ' + (G.expressSessions || 1) + '.'
    : k === 'irregular'
    ? 'Your Spaced Repetition intervals (+1d, +3d, +7d, +30d) have been updated.'
    : isRev
    ? (left ? left + ' item(s) still due today. Error Lab priorities updated.' : 'Nothing else is due today. Correct answers come back later on the spaced schedule.')
    : 'Words marked "Review later" will appear first next time.';
  return h('div', { class:'fin' }, h('span', { class:'done-ic pop' }, ico('check')),
    h('h1', { class:'bi-h' }, h('span', { class:'en', dir:'ltr' }, titleEn), h('small', {}, titleAr)),
    h('p', {}, desc));
}

/* ---------- sheets ---------- */
var sheetClose = null;
function openSheet(titleEn, titleAr, nodes, onClose){ var box = $('#sheetBox');
  put(box, h('span', { class:'grab', 'aria-hidden':'true' }),
    h('div', { class:'sheet-h' },
      h('h2', { id:'sheetTitle', class:'bi-h' }, h('span', { class:'en', dir:'ltr' }, titleEn), h('small', {}, titleAr)),
      h('button', { class:'ib sm close', type:'button', 'aria-label':'Close · إغلاق', on:{ click:closeSheet } }, ico('x'))),
    nodes);
  $('#sheet').hidden = false; doc.body.style.overflow = 'hidden'; sheetClose = onClose || null; }
function closeSheet(){ $('#sheet').hidden = true; doc.body.style.overflow = ''; if (sheetClose) { var f = sheetClose; sheetClose = null; f(); } }

function openCredits(){
  openSheet('Wikimedia Commons Audio Credits', 'أصحاب التسجيلات الصوتية البشرية', [
    h('p', { class:'muted sm' }, biNode('Human pronunciation recordings are streamed from Wikimedia Commons under Creative Commons / Public Domain licenses, alongside direct links to Oxford Learner\'s Dictionaries.', 'التسجيلات الصوتية البشرية تُشغَّل مباشرة من ويكيميديا كومنز وفق تراخيص المشاع الإبداعي أو الملكية العامة، إلى جانب روابط قاموس أوكسفورد للمتعلمين.')),
    h('ul', { class:'cred-list' }, ALL_VOCAB.map(function(v){
      var files = v.wikiFiles ? v.wikiFiles : (v.wikiFile ? [v.wikiFile] : []);
      return h('li', { class:'cred-it' },
        h('div', { style:'display:flex;justify-content:space-between;align-items:center;gap:8px' },
          h('b', { class:'en', dir:'ltr' }, v.en),
          oxBtn(v)),
        files.map(function(f){
          return h('a', { href:'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(f), target:'_blank', rel:'noopener noreferrer' }, 'File:' + f + ' ↗');
        }),
        h('span', { class:'muted sm' }, v.wikiCredit || 'Wikimedia Commons · CC BY-SA / Public Domain'));
    }))
  ]);
}

function allLessonStates(){ var out = {}; courseOrder().forEach(function(id){ out[id] = id === curLessonId ? S : normalizeL(readJSON(KEY_L(id))); }); return out; }
/* أرقام اللوحة من إجاباتك الفعلية في كل الدروس، ولا رقم مفترض: المهارة بلا بيانات تظهر «لا بيانات بعد». */
function computeDashboardStats(){
  var states = allLessonStates(), stageMins = 0, lessonsDone = 0, writingDone = 0;
  var tally = { rq:[0, 0], lq:[0, 0], g:[0, 0], v:[0, 0] };
  Object.keys(states).forEach(function(id){ var st = states[id];
    PARTS.forEach(function(p){ if (st.stamps[p.k]) stageMins += p.min; });
    if (PARTS.every(function(p){ return !!st.stamps[p.k]; })) lessonsDone++;
    if (st.writingDone) writingDone++;
    Object.keys(st.ans).forEach(function(qid){ var a = st.ans[qid], pre = qid.split('-')[0];
      var b = pre === 'rq' ? 'rq' : pre === 'lq' ? 'lq' : (pre === 'gA' || pre === 'gB' || pre === 'gC' || pre === 'gD') ? 'g' : (pre === 'rc' || pre === 'vg') ? 'v' : null;
      if (b) { tally[b][1]++; if (a && a.c) tally[b][0]++; } });
  });
  function pct(t){ return t[1] ? Math.round(t[0] / t[1] * 100) : null; }
  var expMins = (G.expressSessions || 0) * 15;
  var camblyMins = (G.camblyLogs || []).reduce(function(acc, l){ return acc + (Number(l.mins) || 0); }, 0);
  var practiceMins = G.practiceMins || 0;
  var totalMins = stageMins + expMins + camblyMins + practiceMins;
  var hours = totalMins / 60, a2TargetHrs = 90;
  var irr = G.irrSr || {};
  return {
    totalMins:totalMins, stageMins:stageMins, expMins:expMins, camblyMins:camblyMins, practiceMins:practiceMins,
    hoursStr:hours.toFixed(1), a2TargetHrs:a2TargetHrs, hoursPct:Math.min(100, Math.round(hours / a2TargetHrs * 100)),
    readPct:pct(tally.rq), readN:tally.rq[1], listenPct:pct(tally.lq), listenN:tally.lq[1],
    gramPct:pct(tally.g), gramN:tally.g[1], vocPct:pct(tally.v), vocN:tally.v[1],
    writingDone:writingDone, lessonsDone:lessonsDone,
    speakSessions:(G.camblyLogs || []).length,
    speakPhrases:(G.camblyLogs || []).reduce(function(a, l){ return a + (Number(l.phrases) || 0); }, 0),
    irrPracticed:Object.keys(irr).length,
    irrMastered:Object.keys(irr).filter(function(b){ return (irr[b].box || 0) >= 3; }).length
  };
}
function openDashboard(){
  var st = computeDashboardStats();
  function nAns(n){ return n + ' answer(s) across lessons'; }
  var skills = [
    { en:'Reading', pct:st.readPct, cls:'ok', subEn:st.readN ? nAns(st.readN) : 'Comprehension questions in reading lessons', subAr:st.readN ? '' : 'أسئلة الفهم في دروس القراءة' },
    { en:'Listening', pct:st.listenPct, cls:'ok', subEn:st.listenN ? nAns(st.listenN) : 'Questions in listening lessons', subAr:st.listenN ? '' : 'أسئلة دروس الاستماع' },
    { en:'Writing', pct:null, cls:'acc', subEn:st.writingDone + ' writing task(s) done. A score appears once real correction is available.', subAr:'أنجزت ' + st.writingDone + ' من مهام الكتابة، وتظهر الدرجة حين يتوفر تصحيح حقيقي.' },
    { en:'Speaking (Cambly)', pct:null, cls:'acc',
      subEn: st.speakSessions ? (st.speakSessions + ' Cambly session(s) · ' + st.speakPhrases + ' card phrases used') : 'Measured by your Cambly tutor in the first session',
      subAr: st.speakSessions ? (st.speakSessions + ' جلسات كامبلي · استُخدمت ' + st.speakPhrases + ' عبارة') : 'يقيسه معلم كامبلي في أول جلسة' },
    { en:'Grammar', pct:st.gramPct, cls:'', subEn:st.gramN ? nAns(st.gramN) : 'Grammar exercises in every lesson', subAr:st.gramN ? '' : 'تمارين القواعد في كل درس' },
    { en:'Vocabulary & Spelling', pct:st.vocPct, cls:'', subEn:(st.vocN ? nAns(st.vocN) + ' · ' : '') + st.irrMastered + '/60 irregular verbs steady', subAr:'ثبت ' + st.irrMastered + ' من ٦٠ فعلًا شاذًا' }
  ];
  openSheet('Progress & Skills Dashboard', 'لوحة التقدم بالساعات والمهارات', [
    h('div', { class:'dash-hero' },
      h('div', { class:'dash-hrs' },
        biNode('Stage A2 Study Hours', 'ساعات الدراسة في مرحلة A2'),
        h('b', {}, st.hoursStr + ' / ' + st.a2TargetHrs + ' hrs')),
      h('div', { class:'dash-bar' }, h('span', { style:'width:' + Math.max(st.totalMins ? 4 : 0, st.hoursPct) + '%' })),
      h('p', { class:'sm', style:'color:var(--on-dark-2);display:flex;flex-direction:column;gap:2px' }, h('span', { dir:'ltr', style:'unicode-bidi:isolate' }, 'Stage A2 target ≈ 90 hrs: 4–5 months at 5 hrs/week, per the plan.'), h('span', {}, 'هدف مرحلة A2 نحو ٩٠ ساعة: ٤–٥ أشهر بخمس ساعات أسبوعيًا كما في الخطة.')),
      h('div', { class:'dash-meta' },
        h('div', { class:'dash-m' }, h('b', {}, st.stageMins + 'm'), h('span', {}, 'Lessons')),
        h('div', { class:'dash-m' }, h('b', {}, (G.expressSessions || 0) + ' (' + st.expMins + 'm)'), h('span', {}, 'Express')),
        h('div', { class:'dash-m' }, h('b', {}, st.practiceMins + 'm'), h('span', {}, 'Practice')),
        h('div', { class:'dash-m' }, h('b', {}, st.camblyMins + 'm'), h('span', {}, 'Cambly')))),
    h('h3', { class:'bi-h', style:'font-size:15.5px' }, h('span', { class:'en', dir:'ltr' }, '4 Skills & Foundation Indicators'), h('small', {}, 'مؤشرات المهارات الأربع والأساس اللغوي')),
    h('div', { class:'skill-list' }, skills.map(function(sk){
      return h('div', { class:'skill-card' },
        h('div', { class:'skill-top' },
          h('b', { style:'font-size:14px' }, sk.en),
          h('span', { class:'skill-pct' }, sk.pct == null ? 'No data yet' : sk.pct + '%')),
        h('div', { class:'skill-track' }, h('span', { class:sk.cls, style:'width:' + (sk.pct == null ? 0 : Math.max(sk.pct ? 6 : 0, sk.pct)) + '%' })),
        sk.subAr ? biNode(sk.subEn, sk.subAr) : h('span', { class:'muted sm', dir:'ltr' }, sk.subEn));
    })),
    h('div', { class:'wbtns' },
      h('button', { class:'btn sm', type:'button', on:{ click:function(){ closeSheet(); openCambly(); } } }, ico('speaker'), biBtn('Cambly Card & Log', 'بطاقة كامبلي وسجل الجلسة')),
      h('button', { class:'btn out sm', type:'button', on:{ click:function(){ closeSheet(); openSession('express'); } } }, ico('clock'), biBtn('15-Min Express Mode', 'الوضع المختصر ١٥ د')))
  ]);
}

/* ---------- Stage 4: Unit Test (90% Mastery / 80% Pass), Legal Corner & Pre-Tests (90% Skip) ---------- */
var UT_STATE = null, MINI_STATE = null, PT_STATE = null;

/* اختبار الوحدة u من D.unitTests. الوحدة 0 (الأسبوع التأسيسي) رقمها falsy، فلا يُكتب لها بديل بـ ||. */
function unitTestOf(u){ return (D.unitTests && D.unitTests[u]) || null; }
function unitArg(k, prefix, dflt){ var n = parseInt(String(k).slice(prefix.length), 10); return isNaN(n) ? dflt : n; }
/* يُفتح اختبار الوحدة حين تُبنى كل دروسها (open) وتكتمل، بقاعدة isLessonDone نفسها التي تختار درس اليوم وتحسب دقائق اللوحة.
   وسطر الاختبار نفسه في القائمة (test: true) ليس درسًا. */
function unitLessonsDone(u){ var list = (D['unit' + u + 'Lessons'] || []).filter(function(l){ return l && !l.test; });
  return list.length > 0 && list.every(function(l){ return !!(l.open && l.id && typeof LESSONS !== 'undefined' && LESSONS[l.id] && isLessonDone(l.id)); }); }
function unitNameEn(u){ return u === 0 ? 'Foundation Week' : 'Unit ' + u; }
function unitLockText(u){ return u === 0 ? 'Opens after Foundation Week' : 'Opens after ' + unitNameEn(u) + ' · يُفتح بعد إكمال الوحدة ' + u; }
function arQs(n){ return arDigits(n) + (n >= 3 && n <= 10 ? ' أسئلة' : ' سؤالًا'); }
function utNums(ut){ var N = ut.questions.length, m = ut.masteryPct || 90, p = ut.passPct || 80;
  return { N:N, m:m, p:p, mN:Math.ceil(N * m / 100), pN:Math.ceil(N * p / 100) }; }

function stUnitLegal(st, ctl){
  var ut = unitTestOf(st.unit) || unitTestOf(1), n = utNums(ut);
  var lc = ut.legalCorner, newAr = n.N >= 3 && n.N <= 10 ? arDigits(n.N) + ' أسئلة جديدة' : arDigits(n.N) + ' سؤالًا جديدًا';
  ctl.enable('ابدأ الاختبار');
  return [
    lc ? label('Friday Review · Weekly Legal Corner (10 min)', 'مراجعة الجمعة · الركن القانوني الأسبوعي (١٠ دقائق)') : label('Friday Review', 'مراجعة الجمعة'),
    h('div', { class:'qi' },
      h('h1', { class:'bi-h' }, h('span', { class:'en', dir:'ltr', style:'color:#fff' }, ut.titleEn), h('small', { style:'color:var(--honey)' }, ut.titleAr)),
      h('p', { class:'en', dir:'ltr', style:'color:#fff;font-weight:600;text-align:left' }, n.N + ' new questions' + (ut.appliedTask ? ' + a short applied writing task' : '') + '. Mastery target: ' + n.m + '% (' + n.mN + '/' + n.N + '). Passing threshold: ' + n.p + '% (' + n.pN + '/' + n.N + ').'),
      h('p', {}, newAr + ' لم تظهر في الدروس' + (ut.appliedTask ? ' + مهمة تطبيقية قصيرة' : '') + '. هدف الإتقان ' + arDigits(n.m) + '٪ (' + arDigits(n.mN) + '/' + arDigits(n.N) + ')، وحد العبور ' + arDigits(n.p) + '٪ (' + arDigits(n.pN) + '/' + arDigits(n.N) + '): من ' + arDigits(n.p) + ' إلى ' + arDigits(n.m - 1) + '٪ تعبر الوحدة وتعود أخطاؤك لمختبر الأخطاء مع اختبار مصغر الأسبوع التالي، وأقل من ' + arDigits(n.p) + '٪ تراجع الدروس الضعيفة أولًا.'),
      h('div', { class:'qi-stats' },
        h('div', { class:'qs' }, h('b', {}, String(n.N)), h('span', {}, 'New Qs · ' + (n.N >= 3 && n.N <= 10 ? 'أسئلة جديدة' : 'سؤالًا جديدًا'))),
        h('div', { class:'qs' }, h('b', { dir:'ltr' }, n.m + '%'), h('span', {}, 'Mastery')),
        h('div', { class:'qs' }, h('b', { dir:'ltr' }, n.p + '%'), h('span', {}, 'Pass')))),
    lc ? h('div', { class:'sec-h' }, h('h2', { class:'bi-h', style:'font-size:17px' }, h('span', { class:'en', dir:'ltr' }, lc.titleEn), h('small', {}, lc.titleAr))) : null,
    lc ? h('p', { class:'muted sm' }, biNode(lc.introEn, lc.introAr)) : null,
    lc ? h('div', { class:'wlist' }, (lc.terms || []).map(function(t){
      return h('div', { class:'elab-card' },
        h('div', { style:'display:flex;justify-content:space-between;align-items:center;gap:8px' },
          biNode(t.en, t.ar),
          h('div', { class:'audio-row', style:'margin:0' }, oxBtn(t.en), sayBtn(t.en, 'Pronunciation: ' + t.en))),
        h('p', { class:'w-ex' }, t.ex),
        h('p', { class:'sm muted' }, t.exAr));
    })) : null
  ];
}

function stUnitTestQ(st, ctl){
  var ut = unitTestOf(st.unit) || unitTestOf(1);
  var q = ut.questions[st.qIdx];
  var saved = UT_STATE && UT_STATE.ans[st.qIdx];
  ctl.set('التالي', saved != null, nextStep);
  var nodes = MCQ({ prompt:q.s, opts:q.opts, a:q.a, whyEn:q.whyEn, why:q.why }, {
    tag:unitNameEn(st.unit) + ' Test · Q' + (st.qIdx + 1) + '/' + ut.questions.length,
    saved: saved != null ? { v:saved.v } : null,
    onAnswer:function(ok, v){
      if (!UT_STATE) UT_STATE = { unit:st.unit, ans:{}, applied:'' };
      UT_STATE.ans[st.qIdx] = { c:ok, v:v };
      if (!ok) bumpErrorLab(q.errCat || 'tense', q.s);
      touch();
      ctl.enable('التالي');
    }
  });
  return [label('Unit Test · Question ' + (st.qIdx + 1) + ' of ' + ut.questions.length, 'اختبار الوحدة · السؤال ' + (st.qIdx + 1) + ' من ' + ut.questions.length)].concat(nodes);
}

function stUnitApplied(st, ctl){
  var ut = unitTestOf(st.unit) || unitTestOf(1), task = ut.appliedTask || {};
  var minS = task.minSentences || 3;
  /* مثال الوحدة 1 القديم يبقى لها، ولغيرها مثال الدرس (placeholder) أو أرقام الجمل فقط. */
  var ph = task.placeholder || (st.unit === 1 ? '1. I usually ...\n2. This week, I am ...\n3. Before starting a job, we sign a contract.' : Array.apply(null, Array(minS)).map(function(_, i){ return (i + 1) + '. …'; }).join('\n'));
  var ta = h('textarea', { class:'wt', rows:'5', placeholder:ph, autocomplete:'off', autocapitalize:'off', autocorrect:'off', spellcheck:'false', 'aria-label':'Short Applied Task · المهمة التطبيقية القصيرة' });
  ta.value = (UT_STATE && UT_STATE.applied) || '';
  var cnt = h('p', { class:'wcount' });
  function up(){
    var a = analyze(ta.value);
    cnt.textContent = 'Separate sentences: ' + a.sentences + ' / ' + minS + ' · Words: ' + a.words;
    return a;
  }
  ta.addEventListener('input', up);
  up();
  ctl.set('النتيجة وتحليل الأخطاء', true, function(){
    var a = up();
    if (a.sentences < minS) {
      toast('Write at least ' + minS + ' separate sentences ending with a period (.).');
      return;
    }
    if (!UT_STATE) UT_STATE = { unit:st.unit, ans:{}, applied:'' };
    UT_STATE.applied = ta.value;
    nextStep();
  });
  return [
    label('Unit Test · Short Applied Task', 'اختبار الوحدة · المهمة التطبيقية القصيرة'),
    h('div', { class:'task' },
      h('p', { class:'task-en' }, task.promptEn),
      h('h2', { class:'task-ar' }, task.promptAr)),
    ta, cnt
  ];
}

function stUnitTestResult(st, ctl){
  var ut = unitTestOf(st.unit) || unitTestOf(1), n = utNums(ut);
  var N = n.N;
  var sc = 0, missedIdxs = [], weakLessons = {};
  ut.questions.forEach(function(q, idx){
    var a = UT_STATE && UT_STATE.ans[idx];
    if (a && a.c) sc++;
    else {
      missedIdxs.push(idx);
      if (q.lesson) weakLessons[q.lesson] = true;
    }
  });
  var pct = Math.round((sc / N) * 100);
  var status = pct >= n.m ? 'mastered' : pct >= n.p ? 'passed' : 'review_needed';
  var prev = (G.unitTests && G.unitTests[st.unit]) || {};
  G.unitTests[st.unit] = {
    best: Math.max(prev.best || 0, sc),
    last: sc,
    attempts: (prev.attempts || 0) + 1,
    status: (prev.status === 'mastered' || status === 'mastered') ? 'mastered' : status,
    appliedText: (UT_STATE && UT_STATE.applied) || prev.appliedText || '',
    miniQuizDue: status === 'passed',
    missedIdxs: missedIdxs
  };
  touch(); SYNC.soon();
  ctl.set('رجوع للدروس', true, closePlayer);

  var msgEn = status === 'mastered'
    ? 'Full Mastery Achieved (' + pct + '% · ≥' + n.m + '%)!'
    : status === 'passed'
    ? 'Unit Passed (' + pct + '% · ' + n.p + '–' + (n.m - 1) + '% Threshold)!'
    : 'Score Below ' + n.p + '% (' + pct + '%) — Review Weak Lessons First';
  var msgAr = status === 'mastered'
    ? 'حققت درجة الإتقان الكامل للوحدة (' + pct + '٪ — ' + arDigits(n.m) + '٪ فأكثر)!'
    : status === 'passed'
    ? 'عبرت الوحدة (' + pct + '٪ — بين ' + arDigits(n.p) + '٪ و' + arDigits(n.m - 1) + '٪)!'
    : 'أقل من حد العبور ' + arDigits(n.p) + '٪ (' + pct + '٪) — راجع الدروس الضعيفة أولًا';
  var subEn = status === 'mastered'
    ? 'You mastered ' + (st.unit === 0 ? 'the Foundation Week' : unitNameEn(st.unit)) + ' and its applied task. Ready for the next unit!'
    : status === 'passed'
    ? 'You can move forward! Your missed questions were sent to the Error Lab and scheduled for a Mini Follow-Up Quiz next week.'
    : 'Review the lessons listed below where mistakes occurred, then retake the Unit Test.';
  var subAr = status === 'mastered'
    ? (st.unit === 0 ? 'أتقنت الأسبوع التأسيسي ومهمته التطبيقية بنجاح.' : 'أتقنت الوحدة ' + arDigits(st.unit) + ' ومهمتها التطبيقية بنجاح.')
    : status === 'passed'
    ? 'يمكنك المتابعة للوحدة التالية! أُضيفت أخطاؤك إلى مختبر الأخطاء وجُدول لك اختبار مصغر في الأسبوع التالي.'
    : 'راجع الدروس المحددة أدناه أولًا ثم أعد اختبار الوحدة.';

  /* أسماء الدروس كما تظهر في القوائم (F1 · U1·L2)، لا معرّفاتها (U0L1). */
  var weakKeys = Object.keys(weakLessons).map(lessonTag);
  return h('div', { class:'result' },
    ring(sc, N),
    h('div', { class:'res-msg' }, biNode(msgEn, msgAr)),
    h('div', { class:'res-sub' }, biNode(subEn, subAr)),
    status === 'passed' ? h('button', { class:'btn sm', type:'button', on:{ click:function(){ openSession('unitMini:' + st.unit); } } },
      ico('review'), biBtn('Open Mini Follow-Up Quiz (' + missedIdxs.length + ' Qs)', 'افتح الاختبار المصغر للأخطاء (' + missedIdxs.length + ' أسئلة)')) : null,
    weakKeys.length ? h('div', { class:'elab-card', style:'width:100%;text-align:right' },
      biNode('Recommended Lessons to Review:', 'الدروس التي يُنصح بمراجعتها من أخطائك:'),
      h('p', { class:'en', dir:'ltr', style:'font-weight:700;color:var(--accent-ink);text-align:left' }, weakKeys.join(' · '))) : null,
    h('button', { class:'btn out sm', type:'button', on:{ click:function(){ openSession('unitTest:' + st.unit); } } }, biBtn('Retake Unit Test', 'إعادة اختبار الوحدة')));
}

function stUnitMiniQ(st, ctl){
  var ut = unitTestOf(st.unit) || unitTestOf(1);
  var q = ut.questions[st.qIdx] || ut.questions[0];
  ctl.set('التالي', false, nextStep);
  var nodes = MCQ({ prompt:q.s, opts:q.opts, a:q.a, whyEn:q.whyEn, why:q.why }, {
    tag:'Mini Follow-Up Quiz · ' + st.pos + '/' + st.total,
    onAnswer:function(ok, v){
      if (!MINI_STATE) MINI_STATE = { unit:st.unit, idxs:[st.qIdx], ans:{} };
      MINI_STATE.ans[st.qIdx] = { c:ok, v:v };
      ctl.enable('التالي');
    }
  });
  return [label('Mini Follow-Up Quiz · ' + st.pos + ' of ' + st.total, 'الاختبار المصغر لأخطاء الوحدة · ' + st.pos + ' من ' + st.total)].concat(nodes);
}

function stUnitMiniResult(st, ctl){
  var idxs = (MINI_STATE && MINI_STATE.idxs) || [];
  var okCnt = idxs.filter(function(i){ return MINI_STATE && MINI_STATE.ans[i] && MINI_STATE.ans[i].c; }).length;
  var allCleared = okCnt === idxs.length;
  if (allCleared && G.unitTests && G.unitTests[st.unit]) {
    G.unitTests[st.unit].miniQuizDue = false;
    G.unitTests[st.unit].status = 'mastered';
    touch(); SYNC.soon();
  }
  ctl.set('رجوع للدروس', true, closePlayer);
  return h('div', { class:'fin' },
    h('span', { class:'done-ic pop' }, ico('check')),
    h('h1', { class:'bi-h' }, h('span', { class:'en', dir:'ltr' }, allCleared ? 'Mini Follow-Up Quiz Mastered!' : 'Mini Follow-Up Quiz Complete'), h('small', {}, allCleared ? 'أتقنت الاختبار المصغر وارتفعت الوحدة إلى درجة الإتقان!' : 'أنهيت الاختبار المصغر')),
    h('p', {}, 'Score: ' + okCnt + ' / ' + idxs.length + '.'));
}

/* ---------- Pre-Tests for Units 5, 8, 9, 12 (90% Exemption: the first attempt only) ---------- */
/* قواعد الاختبار القبلي:
   - المحاولة الأولى وحدها تقرر الإعفاء، وما بعدها تدريب لا يغيّر الإعفاء. والخروج في منتصف الأولى يحسبها، والأسئلة التي لم تُجب خاطئة.
   - السجل G.preTests[u] = { v, attempts, first:{ sc, n, done, at }, exempt, last, best }.
     وv إصدار الاختبار (version في content.js): سجل بإصدار آخر يُعدّ فارغًا، فتُهمَل نتائج الأسئلة القديمة.
   - الإعفاء في كل مكان: sc * 10 >= n * 9 (٩٠٪ فأكثر)، والنسبة المعروضة Math.round(sc / n * 100).
   - لا صح ولا خطأ أثناء الاختبار (الوضع الصامت quiet)، والإجابات والشروح في شاشة النتيجة وحدها. */
function ptExemptOK(sc, n){ return sc * 10 >= n * 9; }
function ptPct(sc, n){ return Math.round(sc / n * 100); }
/* السجل الصالح للوحدة u، أو null إن غاب أو كان بإصدار قديم. للقراءة وحدها. */
function ptRecValid(u){ var pt = D.preTests && D.preTests[u], r = G.preTests && G.preTests[u]; return (pt && isObj(r) && r.v === pt.version) ? r : null; }
/* السجل الصالح للكتابة: إن غاب أو كان قديمًا يُصفَّر عند الحاجة إليه. */
function ptRecEnsure(u){ var pt = D.preTests && D.preTests[u]; if (!pt) return null;
  if (!isObj(G.preTests)) G.preTests = {};
  var r = G.preTests[u];
  if (!(isObj(r) && r.v === pt.version)) r = G.preTests[u] = { v:pt.version, attempts:0 };
  return r; }
function ptScore(pt){ var sc = 0; pt.items.forEach(function(_, i){ if (PT_STATE && PT_STATE.ans[i] && PT_STATE.ans[i].c) sc++; }); return sc; }
/* عند كل إجابة: أول إجابة في الجلسة تسجّل المحاولة (attempts)، وفي المحاولة الأولى يُحدَّث first.sc والإعفاء بعد كل إجابة،
   فالخروج في المنتصف يحسب المحاولة الأولى والباقي خاطئ. */
function ptRecordAnswer(unit, qIdx, ok, v){
  var pt = D.preTests && D.preTests[unit]; if (!pt) return;
  if (!PT_STATE || PT_STATE.unit !== unit) { var cur = ptRecValid(unit); PT_STATE = { unit:unit, ans:{}, counted:false, first:!(cur && cur.first) }; }
  PT_STATE.ans[qIdx] = { c:!!ok, v:v };
  var rec = ptRecEnsure(unit);
  if (!PT_STATE.counted) {
    PT_STATE.counted = true;
    rec.attempts = (rec.attempts || 0) + 1;
    if (rec.first) PT_STATE.first = false;   /* سُجّلت محاولة أولى من جهاز أو نافذة أخرى بعد فتح هذه الجلسة: هذه تدريب */
  }
  if (PT_STATE.first) {
    if (!rec.first) rec.first = { sc:0, n:pt.items.length, done:false, at:Date.now() };
    rec.first.sc = ptScore(pt);
    rec.exempt = ptExemptOK(rec.first.sc, rec.first.n);
  }
  touch(); SYNC.soon();
}
function arQCount(k){ return k === 1 ? 'سؤال واحد' : k === 2 ? 'سؤالان' : arQs(k); }

function stPreTestIntro(st, ctl){
  var pt = D.preTests && D.preTests[st.unit];
  var n = pt.items.length, typed = pt.items.filter(function(x){ return x.type === 'typing'; }).length, mcq = n - typed, need = Math.ceil(n * 9 / 10);
  var prev = ptRecValid(st.unit), pf = prev && prev.first;
  /* داخل الجلسة تقرر PT_STATE.first، فلا تنقلب المحاولة الأولى «تدريبًا» إن رجع المتعلم إلى المقدمة بعد أول إجابة. */
  var practice = (PT_STATE && PT_STATE.unit === st.unit) ? !PT_STATE.first : !!pf;
  var pfPct = pf ? ptPct(pf.sc, pf.n) : 0, pfEx = !!(pf && ptExemptOK(pf.sc, pf.n));
  var kindsEn = [], kindsAr = [];
  if (typed) { kindsEn.push(typed + ' typing'); kindsAr.push(arQCount(typed) + ' تصريف وكتابة'); }
  if (mcq) { kindsEn.push(mcq + ' multiple choice'); kindsAr.push(arQCount(mcq) + ' اختيار'); }
  var countsEn = n + ' questions (' + kindsEn.join(' + ') + '). ', countsAr = ' (' + kindsAr.join(' + ') + ').';
  ctl.enable('ابدأ الاختبار');
  return h('div', { class:'qi' },
    h('h1', { class:'bi-h' }, h('span', { class:'en', dir:'ltr', style:'color:#fff' }, pt.en), h('small', { style:'color:var(--honey)' }, pt.ar)),
    practice
      ? h('p', { class:'en', dir:'ltr', style:'color:#fff;font-weight:600;text-align:left' }, countsEn + 'This is a practice attempt: it does not change your exemption. Your first attempt on this pre-test already counted' + (pf ? ' (' + pfPct + '%' + (pfEx ? ', exempted' : '') + ')' : '') + '.')
      : h('p', { class:'en', dir:'ltr', style:'color:#fff;font-weight:600;text-align:left' }, countsEn + 'Only your FIRST attempt counts for the exemption: score at least ' + need + ' of ' + n + ' (90%) to skip this unit; its grammar will return in the Consolidation Week.'),
    h('p', { class:'en', dir:'ltr', style:'text-align:left' }, practice
      ? 'Answers and explanations appear at the end.'
      : 'No feedback while you answer: answers and explanations appear at the end. If you leave midway, it still counts as your first attempt, and unanswered questions count as wrong.'),
    pt.noteEn ? h('p', { class:'en pt-note', dir:'ltr', style:'text-align:left' }, pt.noteEn) : null,
    practice
      ? h('p', {}, 'هذه محاولة تدريب لا تغيّر الإعفاء، فقد حُسبت محاولتك الأولى في هذا الاختبار القبلي من قبل' + (pf ? ' (' + arDigits(pfPct) + '٪' + (pfEx ? ' — معفى' : '') + ')' : '') + countsAr + ' وتظهر الإجابات والشروح في النهاية.')
      : [h('p', {}, pt.ruleNoteAr + countsAr),
         h('p', {}, 'المحاولة الأولى وحدها هي التي تُحسب للإعفاء، ويلزمك ' + arDigits(need) + ' من ' + arDigits(n) + ' فأكثر (٩٠٪). ولا تظهر الإجابات والشروح إلا في النهاية، والخروج في المنتصف يُعدّ محاولتك الأولى وتُحسب الأسئلة التي لم تُجب خاطئة. أما حد العبور العادي للوحدة فيبقى ٨٠٪.')],
    pt.noteAr ? h('p', { class:'pt-note' }, pt.noteAr) : null,
    h('div', { class:'qi-stats' },
      h('div', { class:'qs' }, h('b', {}, String(n)), h('span', {}, 'Questions')),
      h('div', { class:'qs' }, h('b', { dir:'ltr' }, typed + '/' + n), h('span', {}, 'Typing')),
      h('div', { class:'qs' }, h('b', { dir:'ltr' }, need + '/' + n), h('span', {}, 'To Skip'))));
}

function stPreTestQ(st, ctl){
  var pt = D.preTests && D.preTests[st.unit];
  var item = pt.items[st.qIdx], n = pt.items.length;
  var saved = PT_STATE && PT_STATE.ans[st.qIdx];
  var o = {
    saved: saved, quiet: true, wide: true,
    tag: 'Unit ' + st.unit + ' Pre-Test · Q' + (st.qIdx + 1) + '/' + n,
    onAnswer: function(ok, v){ ptRecordAnswer(st.unit, st.qIdx, ok, v); ctl.enable('التالي'); }
  };
  var head = [label('Pre-Test Question ' + (st.qIdx + 1) + ' of ' + n, 'سؤال الاختبار القبلي ' + (st.qIdx + 1) + ' من ' + n)];
  var nodes;
  if (item.type === 'typing') {
    /* التعليمة (والملاحظة إن وُجدت في الاختبار) بالإنجليزية ثم العربية تحتها، لا في سطر واحد يتداخل فيه الاتجاهان على الجوال الضيق. */
    head.push(h('div', { class:'pt-ins' },
      h('div', { class:'pt-ins-t' }, instr('Type the missing words. Use the words in brackets.', 'اكتب الكلمات الناقصة مستعينًا بما بين القوسين.')),
      (pt.noteEn || pt.noteAr) ? h('div', { class:'pt-ins-n' }, biNode(pt.noteEn || '', pt.noteAr || '')) : null));
    nodes = Typing(item, o, ctl);
  } else {
    if (!saved) ctl.set('التالي', false, nextStep);
    nodes = MCQ({ prompt:item.s, opts:item.opts, a:item.a, whyEn:item.whyEn, why:item.why }, o);
  }
  return head.concat(nodes);
}

/* بند واحد في قائمة المراجعة: رقمه وجملته (وإجابة المتعلم مظللة) ثم بطاقة fbCard المعتمدة بالإجابة الصحيحة والشرح. */
function ptReviewItem(item, idx, N, a){
  var typed = item.type === 'typing', answered = !!(a && a.v != null), ok = !!(a && a.c);
  var correct = typed ? item.ans[0] : item.opts[item.a];
  var mark = answered ? (ok ? ' ok' : ' bad') : '';
  var sent;
  if (typed) {
    var noSpace = /^[.!?,]/.test(item.post);
    sent = h('p', { class:'q-en sm', dir:'ltr' }, item.pre ? item.pre + ' ' : '', h('span', { class:'blank' + mark }, answered ? a.v : ' '), ' ', h('span', { class:'verb' }, '(' + item.verb + ')'), noSpace ? '' : ' ', item.post);
  } else {
    var mine = answered ? item.opts[a.v] : null;
    if (item.s.indexOf('___') >= 0) {
      var pp = item.s.split('___');
      sent = h('p', { class:'q-en sm', dir:'ltr' }, pp[0], h('span', { class:'blank' + mark }, answered ? mine : ' '), pp[1] || '');
    } else {
      sent = h('div', {}, h('p', { class:'q-en sm', dir:'ltr' }, item.s),
        answered ? h('p', { class:'pt-pick', dir:'ltr' }, h('small', {}, 'Your answer'), h('span', { class:'blank' + mark }, mine)) : null);
    }
  }
  return h('div', { class:'pt-item' },
    qCard(sent, { tag:'Q' + (idx + 1) + '/' + N }),
    fbCard(ok, item.why, null, ['Correct answer', correct], item.whyEn, answered ? null : 'No answer'));
}

function stPreTestResult(st, ctl){
  var pt = D.preTests && D.preTests[st.unit];
  var N = pt.items.length, sc = ptScore(pt);
  var pct = ptPct(sc, N), exempt = ptExemptOK(sc, N);
  var first = !!(PT_STATE && PT_STATE.unit === st.unit && PT_STATE.first);
  /* تسجيل النتيجة: المحاولة الأولى تُغلق (done)، وما بعدها تدريب يحفظ last وbest ولا يمس الإعفاء. وتُكتب التغييرات وحدها لأن الشاشة قد تُرسم أكثر من مرة. */
  var rec = ptRecEnsure(st.unit), changed = false;
  if (first) {
    if (rec.first && !rec.first.done) { rec.first.done = true; changed = true; }
  } else if (PT_STATE && PT_STATE.unit === st.unit) {
    var best = Math.max(rec.best || 0, sc);
    if (rec.last !== sc || rec.best !== best) { rec.last = sc; rec.best = best; changed = true; }
  }
  if (changed) { touch(); SYNC.soon(); }
  var f = rec.first, fPct = f ? ptPct(f.sc, f.n) : pct, fEx = !!(f && ptExemptOK(f.sc, f.n));
  ctl.set('رجوع للدروس', true, closePlayer);
  return h('div', { class:'result' },
    ring(sc, N),
    h('div', { class:'res-msg' }, first
      ? (exempt
        ? biNode('Unit ' + st.unit + ' Exempted (' + pct + '% · ≥90%)!', 'أُعفيت من الوحدة ' + st.unit + ' (' + pct + '٪ — ٩٠٪ فأكثر)!')
        : biNode('Score: ' + pct + '% (Below 90% Exemption Threshold)', 'النتيجة: ' + pct + '٪ (أقل من حد الإعفاء ٩٠٪)'))
      : biNode('Practice Score: ' + pct + '%', 'نتيجة التدريب: ' + pct + '٪')),
    h('div', { class:'res-sub' }, first
      ? (exempt
        ? biNode('You can skip Unit ' + st.unit + '! Its grammar rule will automatically return in the Consolidation Week.', 'يمكنك تخطي الوحدة ' + st.unit + '، وستعود قاعدتها للمراجعة في أسبوع التثبيت.')
        : biNode('Only your first attempt decides the exemption (90% needed). You will study Unit ' + st.unit + ' normally when you reach it (with the standard 80% passing threshold).', 'المحاولة الأولى وحدها تقرر الإعفاء (٩٠٪). ستدرس الوحدة ' + st.unit + ' بشكل طبيعي عند الوصول إليها (بحد العبور المعتاد ٨٠٪).'))
      : (fEx
        ? biNode('Practice does not change your result: you stay exempted from Unit ' + st.unit + ' (first attempt: ' + fPct + '%). Its grammar rule will return in the Consolidation Week.', 'التدريب لا يغيّر نتيجتك: تبقى معفى من الوحدة ' + st.unit + ' (المحاولة الأولى: ' + fPct + '٪)، وستعود قاعدتها في أسبوع التثبيت.')
        : biNode('Practice does not change the exemption: only your first attempt (' + fPct + '%) counted. You will study Unit ' + st.unit + ' normally when you reach it.', 'التدريب لا يغيّر الإعفاء: حُسبت المحاولة الأولى وحدها (' + fPct + '٪). ستدرس الوحدة ' + st.unit + ' بشكل طبيعي عند الوصول إليها.'))),
    h('div', { class:'pt-list' },
      label('Your Answers & Explanations', 'إجاباتك والشروح'),
      pt.items.map(function(item, idx){ return ptReviewItem(item, idx, N, PT_STATE && PT_STATE.ans[idx]); })));
}

/* ---------- Stage 4: Weekly Cambly Card & Session Logger ---------- */
function buildCamblyCardText(unitNum){
  var cu = (D.camblyUnits && D.camblyUnits[unitNum]) || D.camblyUnits[1];
  var topErrs = sortedErrorLabCats().slice(0, 3);
  var isFirst = !(G.camblyLogs && G.camblyLogs.length);
  var lines = [
    "=== ENGLISH PASSPORT · WEEKLY CAMBLY CARD ===",
    "Learner Level: Early A2 (Saudi Law Student · Goal: Academic & Work English)",
    "Current Unit: " + cu.titleEn,
    isFirst
      ? "Session 1 Special Goal (Speaking Baseline): This is my 1st Cambly session! Please assess my speaking comfort in A2 and help me practice the phrases below."
      : "Session Goal (30 min): Practice this week's target phrases, grammar, and discussion questions.",
    "",
    "1) TARGET PHRASES & LEGAL TRACK (Please encourage me to use these):",
    "   " + cu.phrases.join(" · "),
    "",
    "2) GRAMMAR FOCUS:",
    "   " + cu.grammarEn,
    "",
    "3) DISCUSSION QUESTIONS (Let's discuss these 3 questions):",
    "   Q1: " + cu.questions[0],
    "   Q2: " + cu.questions[1],
    "   Q3: " + cu.questions[2],
    "",
    "4) MY TOP REPEATED MISTAKE PATTERNS THIS WEEK (From my Error Lab):",
    topErrs.map(function(c, i){ return "   " + (i + 1) + ". " + c.en + ": [✗ " + c.wrongEx + " → ✓ " + c.rightEx + "]"; }).join("\n"),
    "",
    "5) NOTE TO TUTOR:",
    "   Please focus on the phrases above, gently correct my pronunciation and grammar (especially my top 3 mistake patterns), and write key corrections in the chat box. Thank you!"
  ];
  return lines.join("\n");
}

/* بطاقة كامبلي لوحدة درس اليوم (G.cur): الأسبوع التأسيسي له بطاقته، والوحدة 1 إن لم تكن للوحدة بطاقة. */
function camblyUnitNow(){ var u = unitOfLesson(G.cur || curLessonId); return (D.camblyUnits && D.camblyUnits[u]) ? u : 1; }
function openCambly(){
  var cu = camblyUnitNow(), cardText = buildCamblyCardText(cu);
  var inMins = h('input', { class:'c-in', type:'number', min:'5', max:'120', value:'30', 'aria-label':'Session Duration in Minutes · مدة الجلسة بالدقائق' });
  var inPhrases = h('input', { class:'c-in', type:'number', min:'0', max:'15', value:'6', 'aria-label':'Card Phrases Used · عدد عبارات البطاقة المستعملة' });
  var logsBox = h('div', { class:'c-logs' });

  function drawLogs(){
    var logs = (G.camblyLogs || []).slice().reverse();
    if (!logs.length) {
      put(logsBox, h('p', { class:'muted sm' }, 'No Cambly sessions logged yet. Your 1st session is your Speaking Baseline!'));
      return;
    }
    put(logsBox, logs.map(function(l, idx){
      var dStr = new Date(l.at || Date.now()).toLocaleDateString('en-GB');
      return h('div', { class:'c-log' },
        h('span', {}, h('b', { class:'en', dir:'ltr' }, (l.isBaseline ? 'Session 1 (Baseline)' : 'Weekly Session') + ' · ' + dStr)),
        h('span', { class:'qtile-badge' }, l.mins + ' min · ' + l.phrases + ' phrases'));
    }));
  }
  drawLogs();

  var copyBtn = h('button', { class:'btn sm', type:'button', on:{ click:function(){
    try {
      navigator.clipboard.writeText(cardText).then(function(){ toast('Cambly Card copied! Paste it in Cambly chat.'); }, function(){ toast('Select text above to copy'); });
    } catch (e) { toast('Select text above to copy'); }
  } } }, ico('copy'), biBtn('Copy Card for Cambly Tutor', 'نسخ البطاقة لمعلم كامبلي'));

  var logBtn = h('button', { class:'btn light sm', type:'button', on:{ click:function(){
    var mins = Math.max(5, Math.min(180, Number(inMins.value) || 30));
    var phr = Math.max(0, Math.min(20, Number(inPhrases.value) || 0));
    var isFirst = !(G.camblyLogs && G.camblyLogs.length);
    G.camblyLogs.push({ at:Date.now(), mins:mins, phrases:phr, unit:cu, isBaseline:isFirst });
    touch(); SYNC.soon();
    drawLogs();
    render();
    toast('Cambly session logged (+' + mins + ' min, ' + phr + ' phrases).');
  } } }, ico('check'), biBtn('Log Cambly Session', 'تسجيل الجلسة في تقدمك'));

  openSheet('Weekly Cambly Card & Session Log', 'بطاقة كامبلي الأسبوعية وسجل الجلسات', [
    h('p', { class:'muted sm' }, biNode('Ready in English to paste into your Cambly tutor chat. Automatically includes your top repeated mistakes from the Error Lab.', 'جاهزة بالإنجليزية للصقها في محادثة معلم كامبلي، وتضم تلقائيًا أكثر أخطائك تكرارًا من مختبر الأخطاء.')),
    h('div', { class:'cambly-card' },
      cu === 0 ? biNode('Foundation Week · Weekly Cambly Card (English)', 'بطاقة الأسبوع التأسيسي (تُلصق للمعلم)') : biNode('Unit ' + cu + ' · Weekly Cambly Card (English)', 'بطاقة الأسبوع للوحدة ' + arDigits(cu) + ' (تُلصق للمعلم)'),
      h('pre', { class:'cambly-pre' }, cardText),
      copyBtn),
    h('div', { class:'cambly-form' },
      biNode('Log Completed Cambly Session', 'سجّل جلستك بعد انتهائها (تُضاف للساعات ومؤشر التحدث)'),
      h('div', { class:'c-grid' },
        h('div', { class:'c-field' }, h('label', {}, 'Duration (min)'), inMins),
        h('div', { class:'c-field' }, h('label', {}, 'Phrases Used'), inPhrases)),
      logBtn),
    h('h3', { class:'bi-h', style:'font-size:15px' }, h('span', { class:'en', dir:'ltr' }, 'Logged Cambly Sessions'), h('small', {}, 'سجل جلسات كامبلي السابقة')),
    logsBox
  ]);
}

/* ---------- Stage 5: Device JSON Backup Export & Restore ---------- */
function progressKeys(){ var out = []; try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && (k === KEY_G || k.indexOf('ep4.lesson.') === 0)) out.push(k); } } catch (e) {} return out; }
function buildBackupPayload(){
  saveLocal();
  var data = {};
  progressKeys().forEach(function(k){ var v = readJSON(k); if (v) data[k] = v; });
  return JSON.stringify({ app: 'English Passport', version: 6, exportedAt: new Date().toISOString(), keys: data }, null, 2);
}

function downloadBackupFile(){
  var json = buildBackupPayload();
  try {
    var blob = new Blob([json], { type:'application/json;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = h('a', { href:url, download:'english-passport-backup.json' });
    doc.body.appendChild(a);
    a.click();
    setTimeout(function(){ try { doc.body.removeChild(a); URL.revokeObjectURL(url); } catch (e) {} }, 250);
    toast('Backup file downloaded (.json)!');
  } catch (e) {
    toast('Use Copy Backup Text below');
  }
}

function restoreBackupPayload(rawJson){
  try {
    var parsed = JSON.parse(String(rawJson || '').trim());
    var keys = parsed && isObj(parsed.keys) ? parsed.keys : null;
    if (!keys || !keys[KEY_G]) throw new Error('Invalid format');
    Object.keys(keys).forEach(function(k){ if (k === KEY_G || k.indexOf('ep4.lesson.') === 0) writeJSON(k, keys[k]); });
    reloadState(true);
    touch(); updateProgress(); SYNC.soon();
    closeSheet();
    render();
    toast('Backup restored successfully!');
    return true;
  } catch (e) {
    toast('Invalid backup file or JSON text.');
    return false;
  }
}

function backupWidgetNode(){
  var ta = h('textarea', { class:'bkp-area', placeholder:'Paste backup JSON here to restore, or tap Copy/Download above…', 'aria-label':'Backup JSON · بيانات النسخة الاحتياطية' });
  var fileIn = h('input', { type:'file', accept:'.json,application/json', hidden:true });
  fileIn.addEventListener('change', function(){
    var f = fileIn.files && fileIn.files[0];
    if (!f) return;
    var reader = new FileReader();
    reader.onload = function(){ restoreBackupPayload(reader.result); };
    reader.readAsText(f);
  });
  return h('div', { class:'bkp-box' },
    biNode('Device Backup & Restore (Stage 5)', 'النسخة الاحتياطية في الجوال (تنزيل واستعادة)'),
    h('p', { class:'muted sm' }, 'Save a backup copy of your progress, Error Lab, Irregular Verbs schedule, and Cambly logs to your iPhone Files, or restore anytime.'),
    h('div', { class:'wbtns' },
      h('button', { class:'btn sm', type:'button', on:{ click:downloadBackupFile } }, ico('mark'), biBtn('Download Backup (.json)', 'تنزيل نسخة احتياطية للجوال')),
      h('button', { class:'btn out sm', type:'button', on:{ click:function(){
        var j = buildBackupPayload();
        ta.value = j;
        try { navigator.clipboard.writeText(j); toast('Backup JSON copied!'); } catch (e) { toast('Backup shown in box below'); }
      } } }, ico('copy'), biBtn('Copy Backup Code', 'نسخ كود النسخة'))),
    ta,
    h('div', { class:'wbtns' },
      h('button', { class:'btn out sm', type:'button', on:{ click:function(){ fileIn.click(); } } }, biBtn('Restore from .json File', 'استعادة من ملف .json')),
      h('button', { class:'btn out sm', type:'button', on:{ click:function(){ if (!ta.value.trim()) { toast('Paste backup JSON in the box first'); return; } restoreBackupPayload(ta.value); } } }, biBtn('Restore Pasted Code', 'استعادة النص الملصوق'))),
    fileIn);
}

/* Plan sheet: interests removed per Stage 1 item 6 */
function openPlan(){
  var L = D.learner || {};
  openSheet('Settings & Plan', 'الإعدادات والخطة', [
    SYNC.panel(),
    h('div', { class:'rows' }, [
      [['Current Level', 'المستوى الحالي'], [L.levelEn || 'Early A2', L.level || 'بداية A2']],
      [['Goal', 'الهدف'], [L.goalEn || 'Study & Work · IELTS 6.5–7', L.goal || 'الدراسة والعمل']],
      [['Daily Time', 'الوقت اليومي'], [L.dailyEn || '45–60 min / day', L.daily || '45–60 دقيقة']]
    ].map(function(r){ return h('div', { class:'rowi' }, biNode(r[0][0], r[0][1]), biNode(r[1][0], r[1][1])); })),
    backupWidgetNode(),
    h('h3', { class:'bi-h', style:'font-size:15.5px' }, h('span', { class:'en', dir:'ltr' }, 'Weekly Rhythm'), h('small', {}, 'إيقاع الأسبوع')),
    h('div', { class:'week' }, D.week.map(function(w){ return h('div', { class:'day' + (w.k === 'test' ? ' t' : w.k === 'rest' ? ' r' : '') }, h('b', {}, (w.dEn ? w.dEn + ' · ' : '') + w.d), h('span', {}, (w.tEn ? w.tEn + ' · ' : '') + w.t)); })),
    h('h3', { class:'bi-h', style:'font-size:15.5px' }, h('span', { class:'en', dir:'ltr' }, 'Daily Lesson Structure (60 min · 6 Stages)'), h('small', {}, 'هيكل الدرس اليومي (60 دقيقة · 6 مراحل)')),
    h('ul', { class:'anat' }, D.anatomy.map(function(a){ return h('li', {}, h('span', { class:'an-m', 'aria-label':a.m + ' دقائق' }, String(a.m)), h('span', { class:'an-t', html:'<b>' + esc((a.nEn ? a.nEn + ' · ' : '') + a.n) + ':</b> ' + arHTML(a.soon ? a.d + ' (في الكورس الكامل)' : a.d) })); })),
    h('h3', { class:'bi-h', style:'font-size:15.5px' }, h('span', { class:'en', dir:'ltr' }, 'How Progress Works'), h('small', {}, 'كيف يُحسب تقدمك')),
    h('ul', { class:'rules' }, [
      'Every stage you complete is stamped on the lesson page.',
      'Lesson quizzes require 80% to pass, followed by an error analysis by category.',
      'Every missed question enters the mistake notebook and comes back after 1 day, 3 days, a week and a month.',
      'Writing requires at least 4 separate sentences and separates spelling from grammar feedback.'
    ].map(function(t){ return h('li', {}, t); }))
  ]);
}
function openAbout(){
  var goals = D.goals || [];
  openSheet('About This Lesson', 'عن الدرس', [
    h('ol', { class:'goals' }, goals.map(function(g){
      return typeof g === 'string' ? h('li', {}, g) : h('li', {}, biNode(g.en, g.ar));
    })),
    h('button', { class:'btn out sm', type:'button', on:{ click:function(){ closeSheet(); openCredits(); } } }, biBtn('Wikimedia Commons Audio Credits', 'أصحاب التسجيلات الصوتية البشرية')),
    SAMPLE ? h('button', { class:'btn', type:'button', on:{ click:function(){ closeSheet(); openAsk(); } } }, ico('spark'), biBtn('Ask the Teacher', 'اسأل المعلم')) : null
  ]);
}

/* ---------- Claude in the page ---------- */
var SAMPLE = null;
var AI_OFF = ['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'];
function initAI(){ if (!(window.claude && typeof window.claude.use === 'function')) return;
  window.claude.use('sample').then(function(s){ var had = !!SAMPLE; SAMPLE = typeof s === 'function' ? s : null; if (!!SAMPLE !== had && (G.ui.view === 'player' || G.ui.view === 'lesson')) render(); }, function(){ SAMPLE = null; }); }
function aiErr(code){
  if (code === 'rate_limited') return 'Usage limit reached temporarily. Try again shortly.';
  if (code === 'session_expired') return 'Session expired. Please sign in again.';
  if (code === 'refused') return 'Could not answer this request. Try rephrasing.';
  if (code === 'prompt_too_large') return 'Text is too long. A shorter paragraph works best.';
  return 'Teacher is unavailable right now. Try again in a moment.'; }
function thinking(t){ return h('div', { class:'thinking' }, h('span', { class:'dots', 'aria-hidden':'true' }, h('i'), h('i'), h('i')), h('span', {}, t)); }
function WPROMPT(text){ return 'أنت معلم لغة إنجليزية خبير، تصحح فقرة كتبها متعلم عربي مستواه بداية A2.\n' +
  'الدرس: ' + (D.en || 'Hello from Antarctica') + ' — ' + (D.ar || 'المضارع البسيط والمضارع المستمر') + '.\n' +
  'كلمات الدرس والعبارة القانونية: ' + VOCAB_LIST + '.\n' +
  'المهمة المطلوبة من المتعلم: ' + D.writing.task + '\n\n' +
  'صحّح الفقرة بدقة ولطف، وافصل أخطاء الإملاء وعلامات الترقيم عن أخطاء القواعد والاستخدام:\n' +
  '- ركّز في grammarMistakes على الأزمنة، وتركيب الجملة، وتصريف الفعل مع he/she/it، واستخدام الكلمات.\n' +
  '- ركّز في spellingMistakes على الإملاء، والحرف الكبير للضمير I وبداية الجملة، وفصل الجمل بنقطة.\n' +
  '- كل شرح بالعربية الفصحى المبسطة في جملة قصيرة، بصيغة محايدة لا تخاطب مذكرًا ولا مؤنثًا.\n\n' +
  'أعد JSON فقط بهذا الشكل:\n' +
  '{"score": 7, "praise": "جملة تشجيع قصيرة عن نقطة قوة حقيقية في الفقرة", "grammarMistakes": [{"wrong": "النص الخاطئ", "right": "النص الصحيح", "why": "سبب قصير"}], "spellingMistakes": [{"wrong": "الكلمة الخاطئة إملائيًا", "right": "الإملاء الصحيح", "why": "القاعدة الإملائية"}], "corrected": "الفقرة كاملة بعد التصحيح", "next": "نصيحة واحدة قصيرة للتحسن"}\n\n' +
  'الفقرة:\n---\n' + text + '\n---'; }
function correctWriting(ta, btn, box){
  var text = ta.value.trim(), a = analyze(text);
  if (a.words < 12) { toast('Paragraph is too short to check.'); return; }
  if (!SAMPLE) {
    var localFb = localWritingCheck(text);
    S.writing.fb = localFb; S.writing.text = ta.value; touch();
    box.hidden = false; paintFeedback(box, localFb);
    return;
  }
  btn.disabled = true; box.hidden = false; put(box, thinking('Teacher is reading your paragraph…'));
  try { box.scrollIntoView({ block:'nearest', behavior:RM ? 'auto' : 'smooth' }); } catch (e) {}
  SAMPLE.json(WPROMPT(text), { modelTier:'default' }).then(function(r){
    if (!r || typeof r !== 'object' || Array.isArray(r)) throw { code:'invalid_json' };
    var mapM = function(arr){ return Array.isArray(arr) ? arr.slice(0, 6).map(function(m){ m = m || {}; return { wrong:String(m.wrong || ''), right:String(m.right || ''), why:String(m.why || '') }; }) : []; };
    var gM = mapM(r.grammarMistakes), sM = mapM(r.spellingMistakes);
    if (!gM.length && !sM.length && Array.isArray(r.mistakes)) gM = mapM(r.mistakes);
    var fb = { score:Math.max(0, Math.min(10, Math.round(Number(r.score) || 0))), praise:String(r.praise || ''),
      grammarMistakes:gM, spellingMistakes:sM, mistakes:gM.concat(sM),
      corrected:String(r.corrected || ''), next:String(r.next || ''), at:Date.now() };
    S.writing.fb = fb; S.writing.text = ta.value; touch(); paintFeedback(box, fb);
  }).catch(function(e){ var code = e && e.code;
    if (code === 'cancelled') { box.hidden = true; return; }
    var localFb = localWritingCheck(text);
    S.writing.fb = localFb; S.writing.text = ta.value; touch();
    paintFeedback(box, localFb);
  }).then(function(){ btn.disabled = false; }); }

var askTurns = [], askCtl = null, askBusy = false;
var ASK_CHIPS = ['متى نستخدم am / is / are مع الفعل؟', 'ليش نقول He works وليس He work؟', 'ما الفرق بين usually و always؟', 'أعطني 3 جمل جديدة بالمضارع المستمر'];
/* أسئلة «اسأل المعلم» المقترحة: من الدرس الحالي إن كتب askChips (حتى أربعة)، وإلا الأسئلة القديمة عن المضارع البسيط والمستمر. */
function askChipsNow(){ var c = D && D.askChips; return Array.isArray(c) && c.length ? c.slice(0, 4) : ASK_CHIPS; }
function stepName(){ if (G.ui.view === 'player' && P) { var p = partOf(P.part); return p ? p.fullAr : 'المراجعة'; } return 'صفحة الدرس'; }
function RULES(){ return 'أنت معلم لغة إنجليزية صبور وخبير داخل كورس اسمه «جواز الإنجليزية».\n' +
  'المتعلم عربي، مستواه بداية A2، وهدفه الدراسة والعمل.\n' +
  'الدرس الحالي: ' + (D.unit === 0 ? 'الأسبوع التأسيسي' : 'الوحدة ' + (D.unit || 1)) + '، الدرس ' + (D.n || 1) + ' «' + (D.en || 'Hello from Antarctica') + '»، وقاعدته ' + (D.ar || 'المضارع البسيط مقابل المضارع المستمر') + '. كلماته: ' + VOCAB_LIST + '.\n' +
  'نص القراءة: ' + (D.reading && D.reading.intro ? D.reading.intro : '') + '\n' +
  'القسم الذي يدرسه المتعلم الآن: ' + stepName() + '.\n\n' +
  'قواعد إجابتك:\n- أجب بالعربية الواضحة البسيطة، مع أمثلة إنجليزية قصيرة بمستوى A2.\n- لا تتجاوز 120 كلمة إلا إذا طُلب التفصيل.\n- استخدم أسطرًا قصيرة أو نقاطًا، وبدون جداول.\n- خاطب المتعلم بصيغة محايدة (مثل: نستخدم، نلاحظ) لا بصيغة مذكر ولا مؤنث.\n- إن كان السؤال خارج تعلّم الإنجليزية فأعد توجيهه للدرس بلطف في جملة واحدة.'; }
function inlineMD(raw){ return raw.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map(function(p){
  if (/^`[^`]+`$/.test(p)) return '<code>' + esc(p.slice(1, -1)) + '</code>';
  if (/^\*\*[^*]+\*\*$/.test(p)) return '<strong>' + arHTML(p.slice(2, -2)) + '</strong>';
  return arHTML(p); }).join(''); }
function mdLite(text){ var html = '', list = null;
  function close(){ if (list) { html += '</' + list + '>'; list = null; } }
  String(text).replace(/\r/g, '').split('\n').forEach(function(ln){ var t = ln.trim(), m;
  if (!t) { close(); return; }
  if ((m = t.match(/^[-*•]\s+(.*)$/))) { if (list !== 'ul') { close(); html += '<ul>'; list = 'ul'; } html += '<li dir="auto">' + inlineMD(m[1]) + '</li>'; return; }
  if ((m = t.match(/^\d+[.)]\s+(.*)$/))) { if (list !== 'ol') { close(); html += '<ol>'; list = 'ol'; } html += '<li dir="auto">' + inlineMD(m[1]) + '</li>'; return; }
  if ((m = t.match(/^#{1,6}\s+(.*)$/))) { close(); html += '<p dir="auto"><strong>' + inlineMD(m[1]) + '</strong></p>'; return; }
  close(); html += '<p dir="auto">' + inlineMD(t) + '</p>'; });
  close(); return html; }
function openAsk(){ if (!SAMPLE) return;
  var log = h('div', { class:'ask-log', 'aria-live':'polite' }), chips = h('div', { class:'ask-chips' }), input = h('textarea', { id:'askInput', rows:'2', placeholder:'Ask your question here…', 'aria-label':'Question · السؤال' });
  var send = h('button', { class:'btn', type:'submit' }, biBtn('Send', 'إرسال')), stop = h('button', { class:'btn out', type:'button', hidden:true }, biBtn('Stop', 'إيقاف'));
  var form = h('form', { class:'ask-form' }, input, h('div', { class:'row' }, send, stop));
  askTurns.forEach(function(t){ log.append(t.role === 'user' ? h('div', { class:'bub me', dir:'auto' }, t.content) : h('div', { class:'bub ai', html:mdLite(t.content) })); });
  if (!askTurns.length) put(chips, askChipsNow().map(function(c){ return h('button', { class:'ask-chip', type:'button', on:{ click:function(){ ask(c); } } }, c); }));
  function ask(q){ if (!SAMPLE || askBusy || !q.trim()) return;
    askBusy = true; input.value = ''; send.disabled = true; stop.hidden = false; put(chips);
    log.append(h('div', { class:'bub me', dir:'auto' }, q)); var bub = h('div', { class:'bub ai' }, thinking('Teacher is thinking…')); log.append(bub);
    try { bub.scrollIntoView({ block:'nearest' }); } catch (e) {}
    askTurns.push({ role:'user', content:q });
    var inputTurns = [{ role:'user', content:RULES() }].concat(askTurns.slice(-7));
    askCtl = new AbortController();
    SAMPLE(inputTurns, { cache:false, signal:askCtl.signal, onText:function(u){ bub.innerHTML = mdLite(u.text); } }).then(function(res){ bub.innerHTML = mdLite(res.text); askTurns.push({ role:'assistant', content:res.text }); })
    .catch(function(e){ var code = e && e.code; askTurns.pop();
      if (e && e.text) bub.innerHTML = mdLite(e.text); else put(bub);
      if (code === 'cancelled') { if (!(e && e.text)) bub.remove(); return; }
      if (AI_OFF.indexOf(code) >= 0) { SAMPLE = null; closeSheet(); toast('Teacher is unavailable right now.'); return; }
      bub.append(h('p', { class:'err' }, aiErr(code))); })
    .then(function(){ askBusy = false; askCtl = null; send.disabled = false; stop.hidden = true; }); }
  form.addEventListener('submit', function(e){ e.preventDefault(); ask(input.value); });
  input.addEventListener('keydown', function(e){ if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); ask(input.value); } });
  stop.addEventListener('click', function(){ if (askCtl) askCtl.abort(); });
  openSheet('Ask the Teacher', 'اسأل المعلم', [
    h('p', { class:'muted sm' }, biNode('Ask about the grammar rule, any word, or any sentence in this lesson.', 'سؤال عن القاعدة أو أي كلمة أو جملة في الدرس. الإجابة بالعربي مع أمثلة قصيرة.')),
    log, chips, form,
    h('p', { class:'fine' }, 'Each question uses your Claude allowance.')
  ], function(){ if (askCtl) askCtl.abort(); });
  setTimeout(function(){ try { input.focus({ preventScroll:true }); } catch (e) {} }, 60);
}

/* ---------- المزامنة السحابية عبر GitHub ----------
   - يُحفظ التقدم في الجهاز أولًا، ثم يُرفع بصمت إلى فرع "progress" في مستودع الموقع نفسه،
     فلا يُعاد نشر الموقع مع كل حفظ، ويبقى سجل تعديلات الموقع (فرع main) نظيفًا.
   - ملف لكل حالة: progress/course.json وprogress/lesson-<id>.json، ولا يُرفع إلا ما تغيّر.
   - متى يُرفع: عند إنهاء أي مرحلة أو جلسة، وعند مغادرة الموقع، واحتياطًا إن بقي تغيير
     لم يُرفع أكثر من 3 دقائق. وعند فتح الموقع يُسحب ما تغيّر في السحابة دون إعادة تحميل.
   - المفتاح يبقى في هذا الجهاز وحده (ep4.sync) ولا يُرفع إلى GitHub أبدًا.
   - الإعدادات في نافذة الترس، ولا يظهر على الشاشة شيء إلا نقطة صغيرة على الترس
     عند مشكلة تحتاج تدخلك (مفتاح خاطئ، أو بلا صلاحية، أو تعذّر الحفظ يومًا كاملًا). */
function createSync(){
  var API = 'https://api.github.com', BRANCH = 'progress', DIR = 'progress';
  var busy = false, again = false, againKeep = false, timer = null, branchOK = false, state = 'idle', onChange = null;
  var MSG = {
    badkey: ['The key is invalid or expired.', 'المفتاح غير صحيح أو انتهت صلاحيته.'],
    noperm: ['This key cannot write to the repository.', 'المفتاح لا يملك صلاحية الكتابة في المستودع.'],
    norepo: ['Repository not found, or the key does not include it.', 'المستودع غير موجود، أو المفتاح لا يشمله.'],
    offline: ['No connection right now. Progress will upload automatically later.', 'لا يوجد اتصال الآن، وسيُرفع تقدمك تلقائيًا لاحقًا.'],
    nokey: ['Not connected.', 'المزامنة غير مفعّلة.']
  };
  function cfg(){ var c = readJSON(KEY_SYNC); return isObj(c) && c.token && c.owner && c.repo ? c : null; }
  function meta(){ var m = readJSON(KEY_SYNC_META); m = isObj(m) ? m : {}; if (!isObj(m.files)) m.files = {}; return m; }
  function setMeta(m){ writeJSON(KEY_SYNC_META, m); }
  function patchMeta(fn){ var m = meta(); fn(m); setMeta(m); return m; }
  function defaults(){
    var host = location.hostname, parts = location.pathname.split('/').filter(Boolean), gh = host.slice(-10) === '.github.io';
    return { owner: gh ? host.slice(0, -10) : 'vua5l', repo: gh && parts[0] && !/\.html?$/i.test(parts[0]) ? parts[0] : 'engl-pass' };
  }
  function fileOf(k){ return k === KEY_G ? DIR + '/course.json' : DIR + '/lesson-' + k.slice('ep4.lesson.'.length) + '.json'; }
  function keyOf(path){ var n = String(path).split('/').pop(); if (n === 'course.json') return KEY_G; var m = /^lesson-(.+)\.json$/.exec(n); return m ? 'ep4.lesson.' + m[1] : null; }
  function localKeys(){ var out = []; try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && (k === KEY_G || k.indexOf('ep4.lesson.') === 0)) out.push(k); } } catch (e) {} return out; }
  /* بصمة المحتوى دون الطابع الزمني وحالة الواجهة، فلا يُرفع ملف لم يتغير فيه شيء مهم. */
  function digest(v){
    var s = JSON.stringify(v, function(key, val){ return (key === 'updatedAt' || key === 'ui') ? undefined : val; }) || '', x = 5381;
    for (var i = 0; i < s.length; i++) x = ((x << 5) + x + s.charCodeAt(i)) | 0;
    return x + ':' + s.length;
  }
  function pendingKeys(){ var m = meta(); return localKeys().filter(function(k){ var v = readJSON(k); return v && digest(v) !== ((m.files[fileOf(k)] || {}).dg); }); }
  function b64e(str){ var bytes = new TextEncoder().encode(str), bin = ''; for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(bin); }
  function b64d(b){ var bin = atob(String(b).replace(/\s/g, '')), bytes = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i); return new TextDecoder().decode(bytes); }
  function fail(code){ var e = new Error(code); e.code = code; return e; }
  function gh(method, path, body, keep){
    var c = cfg(); if (!c) return Promise.reject(fail('nokey'));
    var opt = { method:method, cache:'no-store', headers:{ 'Authorization':'Bearer ' + c.token, 'Accept':'application/vnd.github+json' } };
    if (body) { opt.body = JSON.stringify(body); opt.headers['Content-Type'] = 'application/json'; if (keep && opt.body.length < 60000) opt.keepalive = true; }
    return fetch(API + '/repos/' + encodeURIComponent(c.owner) + '/' + encodeURIComponent(c.repo) + path, opt).then(function(r){
      if (r.status === 401) throw fail('badkey');
      if (r.status === 403 && r.headers.get('x-ratelimit-remaining') !== '0') throw fail('noperm');
      if (r.status === 403 || r.status === 429 || r.status >= 500) throw fail('offline');
      return r.json().catch(function(){ return {}; }).then(function(j){ return { status:r.status, body:j }; });
    }, function(){ throw fail('offline'); });
  }
  function ensureBranch(){
    if (branchOK) return Promise.resolve();
    return gh('GET', '/git/ref/heads/' + BRANCH).then(function(r){
      if (r.status === 200) { branchOK = true; return; }
      return gh('GET', '').then(function(rr){
        if (rr.status !== 200) throw fail('norepo');
        return gh('GET', '/git/ref/heads/' + ((rr.body && rr.body.default_branch) || 'main'));
      }).then(function(m){
        if (m.status !== 200 || !m.body || !m.body.object) throw fail('norepo');
        return gh('POST', '/git/refs', { ref:'refs/heads/' + BRANCH, sha:m.body.object.sha });
      }).then(function(p){
        if (p.status === 201 || p.status === 422) { branchOK = true; return; }
        throw fail(p.status === 404 ? 'noperm' : 'offline');
      });
    });
  }
  function readRemote(path){
    return gh('GET', '/contents/' + path + '?ref=' + BRANCH).then(function(g){
      if (g.status === 404) return null;
      if (g.status !== 200) throw fail('offline');
      var v = null; try { v = JSON.parse(b64d(g.body.content)); } catch (e) {}
      return { sha:g.body.sha, value:v };
    });
  }
  /* يرفع حالة واحدة. إن كانت نسخة السحابة أحدث (من جهاز آخر) أُخذت بدل رفع القديم. */
  function putKey(k, keep, tries){
    var v = readJSON(k); if (!v) return Promise.resolve(false);
    var path = fileOf(k), f = meta().files[path] || {}, dg = digest(v);
    if (f.dg === dg) return Promise.resolve(false);
    var body = { message:'حفظ التقدم: ' + path.split('/').pop(), content:b64e(JSON.stringify(v)), branch:BRANCH };
    if (f.sha) body.sha = f.sha;
    return gh('PUT', '/contents/' + path, body, keep).then(function(r){
      if (r.status === 200 || r.status === 201) { patchMeta(function(m){ m.files[path] = { sha:r.body.content && r.body.content.sha, dg:dg }; }); return false; }
      if ((r.status === 409 || r.status === 422) && (tries || 0) < 2) {
        return readRemote(path).then(function(rem){
          patchMeta(function(m){ m.files[path] = { sha:rem && rem.sha, dg:rem && rem.value ? digest(rem.value) : '' }; });
          if (rem && rem.value && (rem.value.updatedAt || 0) > (v.updatedAt || 0)) { writeJSON(k, rem.value); return true; }
          return putKey(k, keep, (tries || 0) + 1);
        });
      }
      if (r.status === 404) throw fail('noperm');
      throw fail('offline');
    });
  }
  function done(err, changedLocal){
    patchMeta(function(m){
      if (err) { m.err = err; if (!m.errSince) m.errSince = Date.now(); }
      else { m.err = null; m.errSince = 0; m.lastOk = Date.now(); }
      m.dirtyAt = pendingKeys().length ? (m.dirtyAt || Date.now()) : 0;
    });
    if (changedLocal) applyPulled();
    status(err ? 'error' : 'ok');
  }
  function push(keep){
    if (!cfg()) return Promise.resolve();
    if (busy) { again = true; againKeep = againKeep || !!keep; return Promise.resolve(); }
    busy = true; status('saving');
    var keys = pendingKeys(), changedLocal = false;
    keys.sort(function(a, b){ function w(k){ return k === KEY_L(curLessonId) ? 0 : (k === KEY_G ? 1 : 2); } return w(a) - w(b); });
    var chain = ensureBranch();
    keys.forEach(function(k, i){ chain = chain.then(function(){ return putKey(k, keep && i === 0, 0).then(function(took){ if (took) changedLocal = true; }); }); });
    return chain.then(function(){ done(null, changedLocal); }, function(e){ done((e && e.code) || 'offline', changedLocal); })
      .then(function(){ busy = false; if (again) { var k2 = againKeep; again = false; againKeep = false; return push(k2); } });
  }
  /* يسحب ما تغيّر في السحابة. أول سحب في جهاز جديد يأخذ نسخة السحابة، وبعده الأحدث يغلب. */
  function pull(opts){
    opts = opts || {};
    if (!cfg()) return Promise.resolve(false);
    if (busy) return Promise.resolve(false);
    busy = true; status('saving');
    var first = !meta().lastPull, changed = false;
    return ensureBranch().then(function(){ return gh('GET', '/contents/' + DIR + '?ref=' + BRANCH); }).then(function(r){
      if (r.status === 404) return [];
      if (r.status !== 200 || !Array.isArray(r.body)) throw fail('offline');
      return r.body.filter(function(x){ return x.type === 'file' && keyOf(x.path); });
    }).then(function(list){
      var chain = Promise.resolve();
      list.forEach(function(x){
        var k = keyOf(x.path), known = meta().files[x.path] || {};
        if (!opts.force && known.sha === x.sha) return;
        chain = chain.then(function(){ return readRemote(x.path).then(function(rem){
          if (!rem || !rem.value) return;
          var local = readJSON(k), take = opts.force || first || !local || (rem.value.updatedAt || 0) > (local.updatedAt || 0);
          if (take) { writeJSON(k, rem.value); changed = true; }
          patchMeta(function(m){ m.files[x.path] = { sha:rem.sha, dg:digest(rem.value) }; });
        }); });
      });
      return chain;
    }).then(function(){ patchMeta(function(m){ m.lastPull = Date.now(); }); busy = false; done(null, changed); flushAgain(); return changed; },
      function(e){ busy = false; done((e && e.code) || 'offline', changed); flushAgain(); return changed; });
  }
  function flushAgain(){ if (again) { var k2 = againKeep; again = false; againKeep = false; push(k2); } }
  function applyPulled(){ reloadState(true); render(); paintDot(); }
  function dirty(){ if (!cfg()) return; var m = meta(); if (!m.dirtyAt) { m.dirtyAt = Date.now(); setMeta(m); } }
  function soon(){ if (!cfg()) return; clearTimeout(timer); timer = setTimeout(function(){ push(false); }, 1500); }
  function hasProblem(){
    if (!cfg()) return false;
    var m = meta();
    if (m.err && m.err !== 'offline') return true;
    return !!(m.err === 'offline' && m.errSince && Date.now() - m.errSince > 864e5 && m.dirtyAt);
  }
  function paintDot(){
    var b = doc.getElementById('gearBtn'); if (!b) return;
    var d = b.querySelector('.sync-dot');
    if (hasProblem()) { if (!d) b.append(h('span', { class:'sync-dot', 'aria-hidden':'true' })); }
    else if (d) d.remove();
  }
  function status(s){ state = s; paintDot(); if (onChange) { try { onChange(); } catch (e) {} } }
  function init(){
    /* الحالة تُحفظ في الجهاز مع كل تغيير، فلا نعيد كتابتها هنا (قد تكون نافذة أخرى أحدث). */
    doc.addEventListener('visibilitychange', function(){ if (doc.visibilityState === 'hidden') push(true); });
    window.addEventListener('pagehide', function(){ push(true); });
    window.addEventListener('online', function(){ push(false); });
    setInterval(function(){ var m = meta(); if (cfg() && m.dirtyAt && Date.now() - m.dirtyAt > 180000) push(false); }, 60000);
    if (cfg()) pull().then(function(){ return push(false); });
    paintDot();
  }
  function ago(t){
    var s = Math.max(0, Math.round((Date.now() - t) / 1000)), mi = Math.round(s / 60), hr = Math.round(mi / 60), dd = Math.round(hr / 24);
    if (s < 60) return ['just now', 'قبل لحظات'];
    if (mi < 60) return [mi + ' min ago', 'قبل ' + mi + ' دقيقة'];
    if (hr < 24) return [hr + ' h ago', 'قبل ' + hr + ' ساعة'];
    return [dd + ' d ago', 'قبل ' + dd + ' يوم'];
  }
  /* قسم المزامنة في نافذة الترس. */
  function panel(){
    var box = h('div', { class:'bkp-box sync-box', id:'syncBox' });
    function draw(){
      var c = cfg(), m = meta(), d = defaults(), problem = hasProblem() || (m.err && m.err !== 'offline');
      var line;
      if (!c) line = biNode('Cloud sync is off. Progress is saved on this device only.', 'المزامنة غير مفعّلة، والتقدم محفوظ في هذا الجهاز وحده.');
      else if (state === 'saving') line = biNode('Syncing…', 'جارٍ المزامنة…');
      else if (m.err && MSG[m.err]) line = biNode(MSG[m.err][0], MSG[m.err][1]);
      else if (m.lastOk || m.lastPull) { var a = ago(Math.max(m.lastOk || 0, m.lastPull || 0)); line = biNode('Synced ' + a[0] + '.', 'آخر مزامنة ' + a[1] + '.'); }
      else line = biNode('Connected.', 'مفعّلة.');
      var nodes = [
        h('div', { class:'sync-h' },
          biNode('Cloud Sync (GitHub)', 'المزامنة السحابية (GitHub)'),
          h('span', { class:'sync-st ' + (!c ? 'off' : problem ? 'bad' : 'on') }, !c ? 'Off' : problem ? 'Problem' : 'On')),
        h('p', { class:'sync-line' }, line)
      ];
      if (!c) {
        var tok = h('input', { class:'sync-in', id:'syncToken', type:'password', dir:'ltr', autocomplete:'off', autocapitalize:'none', spellcheck:'false', placeholder:'github_pat_…', 'aria-label':'GitHub key · مفتاح GitHub' });
        var own = h('input', { class:'sync-in', type:'text', dir:'ltr', value:d.owner, autocapitalize:'none', spellcheck:'false', 'aria-label':'Account · الحساب' });
        var rep = h('input', { class:'sync-in', type:'text', dir:'ltr', value:d.repo, autocapitalize:'none', spellcheck:'false', 'aria-label':'Repository · المستودع' });
        nodes.push(
          h('label', { class:'sync-lbl', for:'syncToken' }, 'GitHub key'), tok,
          h('details', { class:'sync-adv' }, h('summary', {}, 'Repository: ' + d.owner + '/' + d.repo), h('div', { class:'sync-grid' }, own, rep)),
          h('button', { class:'btn sm', type:'button', id:'syncConnect', on:{ click:function(){
            var t = tok.value.trim();
            if (!t) { toast('Paste the key first'); return; }
            writeJSON(KEY_SYNC, { token:t, owner:own.value.trim() || d.owner, repo:rep.value.trim() || d.repo });
            setMeta({ files:{} }); branchOK = false; saveLocal(); draw();
            pull().then(function(){ return push(false); }).then(function(){
              var mm = meta(); draw();
              toast(mm.err && MSG[mm.err] ? MSG[mm.err][0] : 'Connected');
            });
          } } }, ico('check'), biBtn('Connect', 'ربط')),
          h('p', { class:'muted sm' }, biNode('The key stays on this device and is never uploaded.', 'المفتاح يبقى في هذا الجهاز ولا يُرفع إلى GitHub.')));
      } else {
        nodes.push(
          h('div', { class:'wbtns' },
            h('button', { class:'btn sm', type:'button', id:'syncNow', on:{ click:function(){ saveLocal(); pull().then(function(){ return push(false); }); } } }, ico('review'), biBtn('Sync now', 'زامن الآن')),
            h('button', { class:'btn out sm', type:'button', on:{ click:function(){
              if (!window.confirm('سيستبدل هذا تقدمك في هذا الجهاز بنسخة السحابة. أتابع؟')) return;
              pull({ force:true });
            } } }, biBtn('Restore from cloud', 'استرجع من السحابة'))),
          h('button', { class:'link', type:'button', style:'align-self:flex-start', on:{ click:function(){
            if (!window.confirm('حذف المفتاح من هذا الجهاز؟ يبقى تقدمك في الجهاز وفي السحابة.')) return;
            try { localStorage.removeItem(KEY_SYNC); localStorage.removeItem(KEY_SYNC_META); } catch (e) {}
            branchOK = false; status('idle'); draw();
          } } }, biBtn('Remove key from this device', 'حذف المفتاح من هذا الجهاز')));
      }
      put(box, nodes);
    }
    draw();
    onChange = function(){ if (box.isConnected) draw(); };
    return box;
  }
  return { init:init, dirty:dirty, soon:soon, push:push, pull:pull, panel:panel, hasProblem:hasProblem };
}

/* ---------- wiring ---------- */
function bindGlobal(){
  doc.addEventListener('click', function(e){ var t = e.target; if (!t || !t.closest) return; var w = t.closest('.w'); if (w && !w.closest('.mail-plain')) showWord(w); });
  doc.addEventListener('keydown', function(e){
    if (e.key === 'Escape') { if (!$('#sheet').hidden) closeSheet(); hideDict(); return; }
    if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.classList && e.target.classList.contains('w') && !e.target.closest('.mail-plain')) { e.preventDefault(); showWord(e.target); } });
  $('#sheetBg').addEventListener('click', closeSheet);
  $('#dClose').innerHTML = '<span class="ico">' + IC.x + '</span>'; $('#dClose').addEventListener('click', hideDict);
  $('#dSay').innerHTML = '<span class="ico">' + IC.speaker + '</span>';
}
function boot(){
  doc.documentElement.setAttribute('lang', 'en'); doc.documentElement.setAttribute('dir', 'ltr');
  var hv = (location.hash || '').slice(1); if (['home','lessons','words','review','lesson'].indexOf(hv) >= 0 && G.ui.welcomed) G.ui.view = hv;
  bindGlobal(); updateProgress(); render(); initAI(); SYNC.init();
}
boot();
})();
