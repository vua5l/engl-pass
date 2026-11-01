/*
  اختبار عرض الوحدة الحالية في متصفح حقيقي (Chrome عبر Playwright): الرئيسية وشاشة «الدروس» وبلاطة اختبار الوحدة
  تتبع وحدة درس اليوم لا الوحدة 1 الثابتة، فتظهر الوحدة 2 وما بعدها بمجرد إضافة دروسها إلى content.js.
  التشغيل من جذر المستودع:
    NODE_PATH=/opt/npm-tools/node_modules node tests/units-display.test.js
  (أو بعد: npm i playwright)  ويمكن تحديد مسار Chrome بالمتغير CHROME_PATH.
  يبني الاختبار نسخة مؤقتة من الموقع في مجلد مؤقت: الوحدة 2 فيها مفتوحة في content.js، وقائمتها unit2Lessons درسان
  (u2l1 وu2l2، منسوخان من lessons/u1/l1.js وl2.js بتغيير id وunit وn) وسطر اختبارها، ويُحمَّل الدرسان قبل app.js.
  ولا يلمس أي ملف في المستودع نفسه (يتحقق من بصمة كل ملف قبل الاختبار وبعده)، ويحذف النسخة المؤقتة في آخره.
*/
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const CHROME = process.env.CHROME_PATH || (fs.existsSync('/opt/google/chrome/chrome') ? '/opt/google/chrome/chrome' : undefined);

const results = []; let fails = 0;
function ok(cond, msg) { results.push((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) fails++; }
const sleep = ms => new Promise(r => setTimeout(r, ms));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* قائمة الوحدة 2 في النسخة المؤقتة: درسان وسطر اختبار. الدرس الثاني بلا shortAr عمدًا،
   فلا يُعرض له عنوان قصير من عناوين الوحدة 1 (LESSON_SHORT في app.js) بل عنوانه العربي ar. */
const U2 = [
  { id: 'u2l1', n: 1, en: 'Journey Lesson One', subEn: 'Past Simple: Regular Verbs', ar: 'الماضي البسيط: الأفعال المنتظمة', shortAr: 'الأفعال المنتظمة', icon: 'globe', open: true },
  { id: 'u2l2', n: 2, en: 'Journey Lesson Two', subEn: 'Past Simple: Irregular Verbs', ar: 'الماضي البسيط: الأفعال الشاذة', icon: 'clock', open: true },
  { id: 'u2l3', n: 3, en: 'Journey Review & Test', subEn: 'Unit 2 Review & Mastery Test', ar: 'مراجعة الوحدة واختبارها', icon: 'trophy', test: true }
];

/* بصمة كل ملف في المستودع (عدا .git وnode_modules)، للتأكد أن الاختبار لم يغيّر فيه شيئًا. */
function fingerprint(dir) {
  const out = {};
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === '.git' || e.name === 'node_modules') continue;
      const f = path.join(d, e.name);
      if (e.isDirectory()) walk(f);
      else if (e.isFile()) out[path.relative(dir, f)] = crypto.createHash('sha1').update(fs.readFileSync(f)).digest('hex');
    }
  })(dir);
  return out;
}

/* نسخة درس من الوحدة 1 إلى الوحدة 2: يتغير رأس الدرس (LESSONS.u1lN = { id, unit, n) وحده. */
function copyLesson(site, n, unit) {
  const from = 'u1l' + n, to = 'u' + unit + 'l' + n;
  let src = fs.readFileSync(path.join(site, 'lessons', 'u1', 'l' + n + '.js'), 'utf8');
  const head = new RegExp('LESSONS\\.' + from + '(\\s*=\\s*\\{\\s*id\\s*:\\s*)(["\'])' + from + '\\2(\\s*,\\s*unit\\s*:\\s*)\\d+(\\s*,\\s*n\\s*:\\s*)\\d+');
  if (!head.test(src)) throw new Error('lessons/u1/l' + n + '.js: lesson header "LESSONS.' + from + ' = { id, unit, n" not found');
  src = src.replace(head, (m, a, q, b, c) => 'LESSONS.' + to + a + q + to + q + b + unit + c + n);
  src = src.split('LESSONS.' + from).join('LESSONS.' + to);
  fs.mkdirSync(path.join(site, 'lessons', 'u' + unit), { recursive: true });
  fs.writeFileSync(path.join(site, 'lessons', 'u' + unit, 'l' + n + '.js'), src);
}

/* النسخة المؤقتة: الموقع كله، ثم الوحدة 2 مفتوحة في content.js بقائمتها، ودرساها في index.html قبل سطر app.js مباشرة
   (أيًّا كانت علامات السطر ورقم إصداره). */
function buildSite(site) {
  fs.cpSync(ROOT, site, { recursive: true, filter: src => src === ROOT || !['.git', 'node_modules'].includes(path.basename(src)) });
  fs.appendFileSync(path.join(site, 'content.js'),
    '\n/* units-display.test.js (النسخة المؤقتة وحدها): الوحدة 2 مفتوحة، وقائمتها درسان وسطر اختبارها. */\n' +
    'DATA.units.forEach(function(u){ if (u.n === 2) u.open = true; });\n' +
    'DATA.unit2Lessons = ' + JSON.stringify(U2, null, 2) + ';\n');
  copyLesson(site, 1, 2); copyLesson(site, 2, 2);
  const f = path.join(site, 'index.html');
  const html = fs.readFileSync(f, 'utf8');
  // app.js أو app.js?v=… أو app.<بصمة>.js، بعلامات تنصيص أو بدونها
  const m = /<script\b[^>]*?\bsrc\s*=\s*(["']?)[^"'\s>]*?\bapp(?:[.-][0-9a-f]{6,})?\.js(?:[?#][^"'\s>]*)?\1[^>]*>\s*<\/script>/i.exec(html);
  if (!m) throw new Error('index.html: the <script> tag of app.js was not found');
  fs.writeFileSync(f, html.slice(0, m.index) + '<script src="lessons/u2/l1.js"></script>\n<script src="lessons/u2/l2.js"></script>\n' + html.slice(m.index));
}

function serve(root) {
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json' };
  return new Promise(res => {
    const srv = http.createServer((req, resp) => {
      let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
      const f = path.join(root, p);
      if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { resp.writeHead(404, { 'Content-Type': 'text/html' }); return resp.end('<!doctype html><title>404</title>'); }
      resp.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(resp);
    });
    srv.listen(0, '127.0.0.1', () => res(srv));
  });
}

(async () => {
  const FP0 = fingerprint(ROOT);
  const SITE = fs.mkdtempSync(path.join(os.tmpdir(), 'ep-units-display-'));
  let browser = null, srv = null;
  try {
    buildSite(SITE);
    srv = await serve(SITE);
    const URL0 = 'http://127.0.0.1:' + srv.address().port + '/index.html';
    browser = await chromium.launch({ executablePath: CHROME, headless: true });

    async function newPage() {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await ctx.route('**/*', r => { const u = r.request().url(); return (u.startsWith('http://127.0.0.1') || u.startsWith('data:')) ? r.continue() : r.abort(); });
      const page = await ctx.newPage(); page.errors = [];
      page.on('pageerror', e => page.errors.push(e.message));
      page.on('dialog', d => d.accept());
      return { ctx, page };
    }
    const getJSON = async (page, k) => { const v = await page.evaluate(k => localStorage.getItem(k), k); return v ? JSON.parse(v) : null; };
    // حالة محفوظة ثم إعادة تحميل: درس اليوم cur، ودروس الوحدة 1 كلها مكتملة اليوم إن طُلب doneUnit1
    async function openWith(seed) {
      const { ctx, page } = await newPage();
      await page.goto(URL0); await sleep(300);
      await page.evaluate(s => {
        localStorage.clear();
        const t = Date.now();
        localStorage.setItem('ep4.course', JSON.stringify({ v: 4, startedAt: t, cur: s.cur, ui: { view: 'home', welcomed: true } }));
        if (s.doneUnit1) DATA.unit1Lessons.filter(l => !l.test).forEach(l => localStorage.setItem('ep4.lesson.' + l.id, JSON.stringify({ v: 4, stamps: { recall: t, vocab: t, grammar: t, reading: t, writing: t, quiz: t } })));
      }, seed);
      await page.reload(); await sleep(400);
      return { ctx, page };
    }
    // تصميم 1 نوفمبر 2026: «Today» تعرض مكانك (الوحدة والدرس) واسم الدرس، و«Course» يعرض الوحدات خطًّا واحدًا،
    // والوحدة المفتوحة بطاقة (.tl-it.open) فيها سطور قائمتها هي، وسطر اختبارها.
    const homeInfo = page => page.evaluate(() => {
      const q = s => { const el = document.querySelector('#screen ' + s); return el ? el.textContent : null; };
      return { place: q('.jr-place'), sub: q('.jr-sub'), lbl: q('.td-lbl'), title: q('.td-title'), banner: q('.tbanner') };
    });
    const courseInfo = page => page.evaluate(() => Array.from(document.querySelectorAll('#screen .tl > .tl-it')).map(li => {
      const open = li.classList.contains('open'), nEl = li.querySelector(':scope > .u-n');
      return {
        n: nEl ? nEl.textContent : '', open,
        name: open ? li.querySelector('.tl-head .tl-t b').textContent : ((li.querySelector('.tl-t b') || {}).textContent || ''),
        rows: open ? Array.from(li.querySelectorAll('.cl-list > li')).map(r => ({
          title: (r.querySelector('.cl-t b') || {}).textContent, test: !!r.querySelector('.u-test, .u0-test'),
          open: !!r.querySelector('button.cl-row'), lock: r.querySelector('.cl-row.locked') ? r.textContent : '' })) : null
      };
    }));
    const want = page => page.evaluate(() => ({
      u1: DATA.unit1Lessons.map(l => l.en), u1Lessons: DATA.unit1Lessons.filter(l => !l.test).length, u1Name: DATA.units.find(u => u.n === 1).en,
      u2: DATA.unit2Lessons.map(l => l.en), u2Lessons: DATA.unit2Lessons.filter(l => !l.test).map(l => l.en), u2Name: DATA.units.find(u => u.n === 2).en,
      u1Titles: DATA.unit1Lessons.filter(l => !l.test).map(l => l.en)
    }));
    const homeIs = (hm, u, name, n) => hm.place === 'Unit ' + u + ' · ' + name && hm.lbl === 'Unit ' + u + ' · Lesson ' + n;
    const goTab = async (page, i) => { await page.locator('.nav-it').nth(i).click(); await sleep(250); };
    const expand = async (page, u) => {
      const li = page.locator('#screen .tl > .tl-it').filter({ has: page.locator(':scope > .u-n', { hasText: new RegExp('^' + u + '$') }) });
      if (!(await li.evaluate(el => el.classList.contains('open')))) { await li.locator('button.tl-row').click(); await sleep(250); }
    };
    const unitOf = (L, u) => L.find(b => b.n === String(u)) || { rows: null };

    /* ---------------- أ) درس اليوم u2l2: الوحدة 2 في «Today»، وكل وحدة بقائمتها في «Course» ---------------- */
    {
      const { ctx, page } = await openWith({ cur: 'u2l2' });
      const pre = await page.evaluate(() => ({
        open2: DATA.units.some(u => u.n === 2 && u.open === true), list2: (DATA.unit2Lessons || []).map(l => l.id),
        l1: LESSONS.u2l1 ? [LESSONS.u2l1.id, LESSONS.u2l1.unit, LESSONS.u2l1.n] : null, l2: LESSONS.u2l2 ? [LESSONS.u2l2.id, LESSONS.u2l2.unit, LESSONS.u2l2.n] : null,
        u1: !!(LESSONS.u1l1 && LESSONS.u1l1.unit === 1 && LESSONS.u1l2 && LESSONS.u1l2.unit === 1)
      }));
      ok(pre.open2 && same(pre.list2, ['u2l1', 'u2l2', 'u2l3']) && same(pre.l1, ['u2l1', 2, 1]) && same(pre.l2, ['u2l2', 2, 2]) && pre.u1,
        'temp copy: unit 2 is open in content.js with unit2Lessons, and u2l1/u2l2 (copies of u1l1/u1l2 with id, unit and n changed) load before app.js: ' + JSON.stringify(pre));
      const g0 = await getJSON(page, 'ep4.course');
      ok(g0 && g0.cur === 'u2l2', 'u2l2 is the current lesson after reload (G.cur = ' + (g0 && g0.cur) + ')');
      const W = await want(page);

      let hm = await homeInfo(page);
      ok(homeIs(hm, 2, W.u2Name, 2) && hm.sub === 'Lesson 2 of ' + W.u2Lessons.length,
        'Today places you in unit 2, lesson 2 of unit 2\'s own lessons: ' + JSON.stringify(hm));
      ok(hm.title === W.u2Lessons[1], 'Today shows the current lesson\'s own title from unit 2\'s list: ' + JSON.stringify(hm.title));
      ok(hm.banner === null, 'no unit-test banner on Today while unit 2\'s lessons are not finished');

      await goTab(page, 1);
      let L = await courseInfo(page);
      const n1 = L.filter(b => b.n === '1').length, n2 = L.filter(b => b.n === '2').length;
      ok(n1 === 1 && n2 === 1 && unitOf(L, 1).name === W.u1Name && unitOf(L, 2).open && unitOf(L, 2).name === W.u2Name && L.findIndex(b => b.n === '1') < L.findIndex(b => b.n === '2'),
        'Course shows unit 1 then unit 2, once each, with the current unit (2) open: ' + JSON.stringify(L.map(b => b.n + (b.open ? '*' : '') + ' ' + b.name)));
      const b2 = unitOf(L, 2);
      ok(same((b2.rows || []).map(r => r.title), W.u2) && b2.rows.filter(r => !r.test && r.open).length === 2 && b2.rows.filter(r => r.test).length === 1 && b2.rows.find(r => r.test).lock.includes('Opens after'),
        "unit 2's card lists unit 2's own two lessons and its locked test row, not unit 1's list: " + JSON.stringify((b2.rows || []).map(r => r.title)));
      await expand(page, 1);
      L = await courseInfo(page);
      const b1 = unitOf(L, 1);
      ok(same((b1.rows || []).map(r => r.title), W.u1) && b1.rows.filter(r => !r.test && r.open).length === W.u1Lessons && W.u1Lessons === 5
        && b1.rows.filter(r => r.test).length === 1 && b1.rows.find(r => r.test).lock.includes('Opens after') && !unitOf(L, 2).open,
        "opening unit 1 lists its own " + W.u1Lessons + ' lessons and its locked test row, and folds unit 2: ' + JSON.stringify((b1.rows || []).map(r => r.title)));

      // فتح درس من قائمة الوحدة 2 يجعله درس اليوم، و«Today» تبقى على الوحدة 2
      await expand(page, 2);
      await page.locator('#screen .tl-it.open button.cl-row').first().click(); await sleep(250);
      const g1 = await getJSON(page, 'ep4.course');
      hm = await homeInfo(page);
      ok(g1.cur === 'u2l1' && homeIs(hm, 2, W.u2Name, 1), "opening unit 2's first lesson row makes u2l1 current (G.cur = " + g1.cur + ') and Today shows it in unit 2: ' + JSON.stringify(hm));

      // درس اليوم يعود إلى الوحدة 1، ويبقى بعد إعادة التحميل
      await goTab(page, 1);
      await expand(page, 1);
      await page.locator('#screen .tl-it.open .cl-list > li').nth(2).locator('button.cl-row').click(); await sleep(250);
      const g2 = await getJSON(page, 'ep4.course');
      hm = await homeInfo(page);
      ok(g2.cur === 'u1l3' && homeIs(hm, 1, W.u1Name, 3) && hm.title === W.u1Titles[2], 'with the current lesson back in unit 1 (u1l3), Today shows unit 1, lesson 3: ' + JSON.stringify({ cur: g2.cur, hm }));
      await page.reload(); await sleep(400);
      hm = await homeInfo(page);
      ok(homeIs(hm, 1, W.u1Name, 3), 'after a reload Today still shows unit 1 (the saved current lesson is u1l3)');
      await goTab(page, 1);
      await expand(page, 1); let c1 = unitOf(await courseInfo(page), 1);
      await expand(page, 2); let c2 = unitOf(await courseInfo(page), 2);
      ok(same((c1.rows || []).map(r => r.title), W.u1) && same((c2.rows || []).map(r => r.title), W.u2), 'each unit keeps its own list whichever unit is current');
      ok(page.errors.length === 0, 'no page errors (unit 2 current): ' + page.errors.join(' | '));
      await ctx.close();
    }

    /* ---------------- ب) درس من الأسبوع التأسيسي، واختبار كل وحدة يتبع دروسها هي ---------------- */
    {
      const { ctx, page } = await openWith({ cur: 'u0l1' });
      const hm = await homeInfo(page);
      ok(hm.place === 'Foundation Week' && hm.lbl === 'Foundation Week · Lesson 1', 'with a Foundation lesson current, Today places you in Foundation Week, lesson 1: ' + JSON.stringify(hm));
      await goTab(page, 1);
      const L = await courseInfo(page);
      ok(unitOf(L, 0).open && !unitOf(L, 1).open, 'Course opens the Foundation Week card, the unit of the current lesson');
      ok(page.errors.length === 0, 'no page errors (Foundation lesson, unit 1 open): ' + page.errors.join(' | '));
      await ctx.close();
    }
    {
      const { ctx, page } = await openWith({ cur: 'u0l1', doneUnit1: true });
      const g = await getJSON(page, 'ep4.course');
      await goTab(page, 1);
      await expand(page, 1); const t1 = (unitOf(await courseInfo(page), 1).rows || []).find(r => r.test);
      await expand(page, 2); const t2 = (unitOf(await courseInfo(page), 2).rows || []).find(r => r.test);
      ok(g.cur === 'u0l1' && !!t1 && t1.open && !t1.lock && !!t2 && !t2.open && t2.lock.includes('Opens after'),
        "each unit's test row follows its own unit: unit 1's opens (its lessons are done), unit 2's stays locked: " + JSON.stringify({ t1, t2 }));
      ok(page.errors.length === 0, 'no page errors (Foundation lesson, unit 1 finished): ' + page.errors.join(' | '));
      await ctx.close();
    }
  } catch (e) {
    ok(false, 'the test ran to the end: ' + ((e && e.stack) || e));
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (srv) srv.close();
    fs.rmSync(SITE, { recursive: true, force: true });
  }
  ok(!fs.existsSync(SITE), 'the temporary copy of the site is removed');
  ok(same(fingerprint(ROOT), FP0), 'no file in the real repository was changed, added or removed');
  console.log(results.join('\n'));
  console.log('\n' + (results.length - fails) + '/' + results.length + ' passed');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
