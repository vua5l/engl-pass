/*
  اختبار شامل لموقع English Passport في متصفح حقيقي (Chrome عبر Playwright).
  التشغيل من جذر المستودع:
    NODE_PATH=/opt/npm-tools/node_modules node tests/site.test.js
  (أو بعد: npm i playwright)  ويمكن تحديد مسار Chrome بالمتغير CHROME_PATH.
  يشغّل الاختبار خادمًا محليًا للملفات، ويحاكي GitHub في الذاكرة، فلا يلمس أي مستودع حقيقي.
  وقائمة الدروس لا تُكتب فيه باليد: تُؤخذ من قوائم content.js وملفات الدروس، ويُخدم index.html كما يولّده
  tools/register-lessons.js في الذاكرة، فيُختبر درس جديد مذكور في content.js قبل أن يُكتب سطره في index.html.
  ولتشغيل مراحل بعض الدروس وحدها (والفحوص العامة باقية): node tests/site.test.js --only u2l1,u2l2
*/
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const { generateIndexHtml, collectLessons } = require('../tools/register-lessons.js');
const ROOT = path.resolve(__dirname, '..');
const CHROME = process.env.CHROME_PATH || (fs.existsSync('/opt/google/chrome/chrome') ? '/opt/google/chrome/chrome' : undefined);

/* index.html كما يكتبه tools/register-lessons.js، والدروس المفتوحة (open: true) التي لها ملف بترتيب الكورس:
   { id, unit, row: موضعه في قائمة وحدته }. ونوع كل درس (قراءة أو استماع) يُقرأ من ملفه في الصفحة نفسها (القسم هـ). */
let INDEX_HTML, COURSE;
try {
  INDEX_HTML = generateIndexHtml(ROOT);
  const { DATA, lessons, warnings } = collectLessons(ROOT);
  warnings.forEach(w => console.error('WARN  ' + w));
  COURSE = lessons.filter(l => l.open).map(l => ({ id: l.id, unit: l.unit, row: DATA['unit' + l.unit + 'Lessons'].findIndex(x => x && x.id === l.id) }));
} catch (e) { console.error('cannot build the lesson list: ' + e.message); process.exit(2); }
/* GitHub Pages ينشر ملف القرص لا المولَّد، فملف قديم يُسقط الاختبار، إلا في فرع ليلي لا يمس index.html (ALLOW_STALE_INDEX=1). */
const STALE_INDEX = INDEX_HTML !== fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
if (STALE_INDEX) console.log('note: index.html on disk is not up to date; the test serves the generated one (run node tools/register-lessons.js before publishing; a nightly branch sets ALLOW_STALE_INDEX=1)');
/* --only u2l1,u2l2: مراحل هذه الدروس وحدها بترتيب الكورس، والفحوص التي لا تعتمد على قائمة الدروس تبقى كلها. */
const ONLY = (() => {
  const argv = process.argv.slice(2); let v = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--only') v = argv[++i] || '';
    else if (argv[i].startsWith('--only=')) v = argv[i].slice(7);
    else { console.error('unknown argument ' + argv[i] + '\nusage: node tests/site.test.js [--only u2l1,u2l2]'); process.exit(2); }
  }
  if (v === null) return null;
  const ids = v.split(',').map(s => s.trim()).filter(Boolean), bad = ids.filter(id => !COURSE.some(l => l.id === id));
  if (!ids.length || bad.length) { console.error((ids.length ? 'not an open lesson with a file: ' + bad.join(', ') : '--only needs lesson ids, e.g. --only u2l1,u2l2') + '\nopen lessons: ' + COURSE.map(l => l.id).join(' ')); process.exit(2); }
  return new Set(ids);
})();
const DRIVE = COURSE.filter(l => !ONLY || ONLY.has(l.id));
if (!DRIVE.length) { console.error('content.js lists no open lesson with a file'); process.exit(2); }
console.log('lessons' + (ONLY ? ' (--only)' : '') + ': ' + DRIVE.map(l => l.id).join(' '));

const results = []; let fails = 0;
function ok(cond, msg) { results.push((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) fails++; }
ok(!STALE_INDEX || !!process.env.ALLOW_STALE_INDEX, 'index.html on disk is up to date (or ALLOW_STALE_INDEX=1 on a nightly branch)');
const sleep = ms => new Promise(r => setTimeout(r, ms));

function serve() {
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json' };
  return new Promise(res => {
    const srv = http.createServer((req, resp) => {
      let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
      if (p === '/index.html') { resp.writeHead(200, { 'Content-Type': types['.html'] }); return resp.end(INDEX_HTML); } // المولَّد في الذاكرة، لا ملف القرص
      const f = path.join(ROOT, p);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { resp.writeHead(404, { 'Content-Type': 'text/html' }); return resp.end('<!doctype html><title>404</title>'); }
      resp.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(resp);
    });
    srv.listen(0, '127.0.0.1', () => res(srv));
  });
}

/* محاكاة GitHub API بالقدر الذي تستعمله المزامنة. */
function fakeGitHub(token) {
  const st = { branch: false, files: {}, log: [], conflictOnce: false, n: 0 };
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization, Accept, Content-Type', 'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS', 'Access-Control-Expose-Headers': 'X-RateLimit-Remaining' };
  const reply = (route, status, body) => route.fulfill({ status, headers: Object.assign({ 'Content-Type': 'application/json', 'X-RateLimit-Remaining': '4999' }, cors), body: JSON.stringify(body || {}) });
  async function handler(route) {
    const req = route.request(), u = new URL(req.url()), m = req.method();
    if (m === 'OPTIONS') return route.fulfill({ status: 204, headers: cors, body: '' });
    st.log.push(m + ' ' + u.pathname);
    if ((req.headers()['authorization'] || '') !== 'Bearer ' + token) return reply(route, 401, { message: 'Bad credentials' });
    const base = '/repos/vua5l/engl-pass';
    if (!u.pathname.startsWith(base)) return reply(route, 404, {});
    const p = u.pathname.slice(base.length);
    if (m === 'GET' && p === '') return reply(route, 200, { default_branch: 'main' });
    if (m === 'GET' && p === '/git/ref/heads/main') return reply(route, 200, { object: { sha: 'mainsha' } });
    if (m === 'GET' && p === '/git/ref/heads/progress') return st.branch ? reply(route, 200, { object: { sha: 'progsha' } }) : reply(route, 404, {});
    if (m === 'POST' && p === '/git/refs') { st.branch = true; return reply(route, 201, {}); }
    if (p === '/contents/progress' && m === 'GET') {
      const list = Object.keys(st.files).map(k => ({ type: 'file', path: k, name: k.split('/').pop(), sha: st.files[k].sha }));
      return list.length ? reply(route, 200, list) : reply(route, 404, {});
    }
    if (p.startsWith('/contents/progress/')) {
      const fp = decodeURIComponent(p.slice('/contents/'.length));
      if (m === 'GET') return st.files[fp] ? reply(route, 200, { sha: st.files[fp].sha, content: st.files[fp].content }) : reply(route, 404, {});
      if (m === 'PUT') {
        const body = JSON.parse(req.postData() || '{}');
        if (st.conflictOnce) { st.conflictOnce = false; return reply(route, 409, { message: 'conflict' }); }
        const cur = st.files[fp];
        if (cur && body.sha !== cur.sha) return reply(route, 409, { message: 'sha mismatch' });
        if (!cur && body.sha) return reply(route, 422, { message: 'sha given for new file' });
        const sha = 's' + (++st.n);
        st.files[fp] = { sha, content: body.content, branch: body.branch };
        return reply(route, cur ? 200 : 201, { content: { sha } });
      }
    }
    return reply(route, 404, {});
  }
  st.handler = handler;
  st.json = fp => st.files[fp] ? JSON.parse(Buffer.from(st.files[fp].content, 'base64').toString('utf8')) : null;
  return st;
}

(async () => {
  const srv = await serve();
  const URL0 = 'http://127.0.0.1:' + srv.address().port + '/index.html';
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });

  async function newPage(gh) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.route('**/*', r => {
      const u = r.request().url();
      if (u.startsWith('http://127.0.0.1') || u.startsWith('data:')) return r.continue();
      if (gh && u.startsWith('https://api.github.com/')) return gh.handler(r);
      return r.abort();
    });
    const page = await ctx.newPage(); page.errors = [];
    page.on('pageerror', e => page.errors.push(e.message));
    page.on('dialog', d => d.accept());
    return { ctx, page };
  }
  const store = page => page.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return o; });
  const getJSON = async (page, k) => { const v = await page.evaluate(k => localStorage.getItem(k), k); return v ? JSON.parse(v) : null; };
  const text = page => page.innerText('#screen');
  const cta = async page => { const b = page.locator('.pl-foot .btn:visible').last(); await b.click(); await sleep(120); };
  async function startApp(page) { await page.goto(URL0); await sleep(400); if (await page.locator('.wel-cta .btn').count()) { await page.click('.wel-cta .btn'); await sleep(250); } }
  // تصميم 1 نوفمبر 2026: الدروس في شاشة «Course»، والوحدة المفتوحة بطاقة واحدة (.tl-it.open) تُفتح بلمس سطرها.
  // كتلة وحدة مفتوحة برقمها، فلا تختلط سطور الوحدة 1 بسطور وحدة أخرى
  const unitBlock = (page, u) => page.locator('.tl-it.open').filter({ has: page.locator('.u-n', { hasText: new RegExp('^' + u + '$') }) });
  async function expandUnit(page, u) {
    await page.locator('.nav-it').nth(1).click(); await sleep(200);
    if (await unitBlock(page, u).count()) return;
    const row = page.locator('.tl-it').filter({ has: page.locator('.u-n', { hasText: new RegExp('^' + u + '$') }) }).locator('button.tl-row');
    if (await row.count()) { await row.first().click(); await sleep(200); }
  }
  // درس الأسبوع التأسيسي بترتيبه: يفتح «Today» على ذلك الدرس
  async function openFoundation(page, i) { await expandUnit(page, 0); await unitBlock(page, 0).locator('.cl-list > li').nth(i).locator('button.cl-row').click(); await sleep(250); }
  // درس مفتوح بمعرّفه من سطره في بطاقة وحدته في «Course». ويرجع false إن لم يجد السطر أو فتح السطر درسًا آخر.
  async function openLesson(page, lid) {
    const l = COURSE.find(x => x.id === lid);
    await expandUnit(page, l.unit);
    const row = unitBlock(page, l.unit).locator('.cl-list > li').nth(l.row).locator('button.cl-row');
    if (!(await row.count())) return false;
    await row.click(); await sleep(250);
    return ((await getJSON(page, 'ep4.course')) || {}).cur === lid;
  }
  // لا صفحة درس منفصلة بعد اليوم: «Today» هي الرئيسية وصفحة الدرس معًا
  async function backHome(page) { const n = page.locator('.nav-it'); if (await n.count()) { await n.nth(0).click(); await sleep(200); } }
  async function doRecallStage(page, answerFn) {
    await page.locator('.tp-card .btn').filter({ hasText: /Start|Continue/ }).first().click(); await sleep(250);
    // لا شاشة تقديم منذ 1 نوفمبر 2026: يبدأ الدرس من أول سؤال
    for (let i = 0; i < 12; i++) {
      const inp = page.locator('.gap-in:enabled');
      if (await inp.count()) { await inp.fill(answerFn(i)); await inp.press('Enter'); await sleep(150); await cta(page); }
      else break;
    }
  }

  /* ---------------- أ) جهاز جديد بلا مزامنة ---------------- */
  {
    const { ctx, page } = await newPage(null);
    await page.goto(URL0); await sleep(400);
    ok(await page.locator('.wel').count() === 1, 'first visit shows the welcome screen');
    await page.click('.wel-cta .btn'); await sleep(250);
    ok(!(await page.locator('#gh-fab').count()) && !(await page.locator('body').innerText()).includes('مزامنة GitHub'), 'no floating sync button anywhere');
    await page.locator('.nav-it').nth(0).click(); await sleep(250);
    ok((await text(page)).includes('First Week at the Law Office'), "today's lesson on a fresh start is Foundation lesson 1 (u0l1)");
    const g0 = await getJSON(page, 'ep4.course');
    ok(g0 && g0.ui.welcomed === true && g0.startedAt > 0 && g0.cur === 'u0l1', 'course state saved with welcome flag, start date and current lesson');

    // ما يُنتظر في مختبر الأخطاء من نوع كل سؤال استرجاع في الدرس (المفردات والقراءة لا تُحسب، والحالة تُحسب مع الأزمنة)
    const rcWant = await page.evaluate(() => { const w = {}; LESSONS.u0l1.recall.forEach(r => { const c = r.errCat || 'spelling'; if (c === 'vocab' || c === 'reading') return; const m = c === 'stative' ? 'tense' : c; w[m] = (w[m] || 0) + 1; }); return w; });
    await doRecallStage(page, () => 'zzzz');
    const l1 = await getJSON(page, 'ep4.lesson.u0l1');
    ok(l1 && l1.stamps && l1.stamps.recall, 'recall stage stamped in the lesson state');
    const g1 = await getJSON(page, 'ep4.course');
    const mk = Object.keys(g1.mistakes);
    ok(mk.length === 5 && mk.every(k => k.startsWith('u0l1|rc-')), 'five wrong recall answers enter the course-wide notebook as u0l1|rc-*');
    ok(mk.every(k => g1.mistakes[k].due - Date.now() > 20 * 3600e3), 'new mistakes are due the next day (spaced schedule step 1)');
    ok(Object.keys(rcWant).length > 0 && Object.keys(rcWant).every(c => ((g1.errorLab[c] || {}).count || 0) === ((g0.errorLab[c] || {}).count || 0) + rcWant[c]), 'Error Lab counts grow by category (one per wrong lesson-1 recall answer: ' + JSON.stringify(rcWant) + ')');

    await page.click('[aria-label="Close · إغلاق"]'); await sleep(200); await backHome(page);
    await openFoundation(page, 2);
    ok((await text(page)).includes('Where Were You Yesterday?'), 'switching to Foundation lesson 3 works');
    const g2 = await getJSON(page, 'ep4.course');
    ok(Object.keys(g2.mistakes).length === 5 && g2.cur === 'u0l3', 'mistakes stay after switching lessons, current lesson updated');
    await backHome(page);
    await page.locator('.nav-it').nth(2).click(); await sleep(250);
    let t = await text(page);
    ok(t.includes('Mistake notebook') && t.includes('F1 ·') && t.includes('Nothing due today'), 'review tab lists lesson-1 mistakes while lesson 3 is current, nothing due today');

    // نقدّم الزمن: نجعل الأخطاء مستحقة ثم نراجع
    await page.evaluate(() => { const g = JSON.parse(localStorage.getItem('ep4.course')); Object.keys(g.mistakes).forEach(k => { g.mistakes[k].due = Date.now() - 1000; }); localStorage.setItem('ep4.course', JSON.stringify(g)); });
    await page.reload(); await sleep(400);
    await page.locator('.nav-it').nth(2).click(); await sleep(250);
    t = await text(page);
    ok(/5\s*\n?\s*Questions due today/.test(t), 'after the due date passes, 5 items are due today');
    const ans0 = await page.evaluate(() => LESSONS.u0l1.recall[0].ans[0]);
    await page.locator('#nbHero .btn').click(); await sleep(250);
    t = await text(page);
    ok(t.includes('Review · F1'), 'review session renders a lesson-1 question while lesson 3 is current');
    await page.locator('.gap-in:enabled').fill(ans0); await page.locator('.gap-in').press('Enter'); await sleep(150);
    const g3 = await getJSON(page, 'ep4.course');
    const m0 = g3.mistakes['u0l1|rc-0'];
    ok(m0 && m0.box === 1 && m0.due - Date.now() > 2.5 * 864e5, 'a correct review moves the item to step 2 (back in 3 days)');
    await page.click('[aria-label="Close · إغلاق"]'); await sleep(200);

    // اللوحة
    await page.locator('.nav-it').nth(0).click(); await sleep(200);
    await page.locator('.jr-more').first().click(); await sleep(250);
    const dash = await page.innerText('#sheetBox');
    ok(dash.includes('Progress & Skills Dashboard') && dash.includes('No data yet') && dash.includes('/ 90 hrs'), 'dashboard shows real data only ("No data yet" where nothing was answered) and a 90-hour A2 target');
    ok(/Vocabulary & Spelling\s*\n?\s*0%/.test(dash), 'vocabulary indicator comes from real answers (0% after five wrong recalls)');
    await page.click('#sheetBox .close'); await sleep(150);

    // الاستماع لم يعد يتسرب إليه درس آخر
    const stageOf = async i => { await openFoundation(page, i); const s = await text(page); await backHome(page); return /\bListening\b/.test(s) ? 'Listening' : (/\bReading\b/.test(s) ? 'Reading' : '?'); };
    ok(await stageOf(1) === 'Listening', 'Foundation lesson 2 shows its Listening stage');
    ok(await stageOf(0) === 'Reading', 'Foundation lesson 1 shows Reading');
    ok(await stageOf(3) === 'Listening', 'Foundation lesson 4 shows its Listening stage after visiting a reading lesson');

    // الإعدادات والنسخة الاحتياطية
    await page.click('#gearBtn'); await sleep(250);
    const sheet = await page.innerText('#sheetBox');
    ok(sheet.includes('Settings & Plan') && sheet.includes('Cloud sync is off') && (await page.locator('#syncToken').count()) === 1, 'gear opens Settings with the sync section (off) and a key field');
    await page.locator('.bkp-box .btn', { hasText: 'Copy Backup Code' }).click(); await sleep(150);
    const bk = await page.locator('.bkp-area').inputValue();
    ok(bk.includes('"ep4.course"') && bk.includes('"ep4.lesson.u0l1"') && !bk.includes('ep4.sync'), 'backup contains course and lesson states, never the sync key');
    ok(page.errors.length === 0, 'no page errors (fresh device): ' + page.errors.join(' | '));
    await ctx.close();
  }

  /* ---------------- ب) مسح التقدم التجريبي القديم مرة واحدة ---------------- */
  {
    const { ctx, page } = await newPage(null);
    await page.goto(URL0); await sleep(300);
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem('english-passport.u1l1.v1', '{"v":3,"stamps":{"recall":1}}'); localStorage.setItem('gh_sync_token', 'old'); localStorage.setItem('gh_sync_repo', 'x'); localStorage.setItem('other-site', 'keep'); });
    await page.reload(); await sleep(300);
    const s = await store(page);
    ok(!s['english-passport.u1l1.v1'] && !s.gh_sync_token && !s.gh_sync_repo && s['other-site'] === 'keep', 'old trial progress and old sync key are removed once; unrelated data is kept');
    await ctx.close();
  }

  /* ---------------- د) بقية الأدوات تعمل مع الحالة المشتركة ---------------- */
  {
    const { ctx, page } = await newPage(null);
    await startApp(page);
    // الوضع المختصر
    await page.locator('.tool', { hasText: 'Express' }).click(); await sleep(200);
    for (let i = 0; i < 20; i++) {
      if ((await text(page)).includes('Express Review Logged')) break;
      const inp = page.locator('.gap-in:enabled'), opt = page.locator('.opt:enabled');
      if (await inp.count()) { await inp.first().fill('zz'); await inp.first().press('Enter'); await sleep(100); }
      else if (await opt.count()) { await opt.first().click(); await sleep(100); }
      await cta(page);
    }
    let g = await getJSON(page, 'ep4.course');
    ok(g.expressSessions === 1, 'express session is logged once in the course state');
    if (await page.locator('[aria-label="Close · إغلاق"]').count()) { await page.click('[aria-label="Close · إغلاق"]'); await sleep(150); }
    // الأفعال الشاذة
    await page.locator('.nav-it').nth(2).click(); await sleep(200);
    await page.locator('.seg-b').nth(2).click(); await sleep(200); // التدريب: Mistakes · Words · Verbs
    await page.locator('.btn', { hasText: /Practice irregular verbs/i }).click(); await sleep(200);
    for (let i = 0; i < 6; i++) { const ins = page.locator('.gap-in:enabled'); if ((await ins.count()) < 2) break; await ins.nth(0).fill('was'); await ins.nth(1).fill('been'); await ins.nth(1).press('Enter'); await sleep(100); await cta(page); }
    g = await getJSON(page, 'ep4.course');
    ok(Object.keys(g.irrSr).length === 6 && g.practiceMins >= 6, 'irregular-verb practice updates the shared schedule and practice minutes');
    if (await page.locator('[aria-label="Close · إغلاق"]').count()) { await page.click('[aria-label="Close · إغلاق"]'); await sleep(150); }
    // مختبر الأخطاء
    await page.locator('.nav-it').nth(2).click(); await sleep(200);
    await page.locator('#elabHero .btn').click(); await sleep(200);
    for (let i = 0; i < 3; i++) { const opt = page.locator('.opt:enabled'); if (!(await opt.count())) break; await opt.first().click(); await sleep(100); await cta(page); }
    g = await getJSON(page, 'ep4.course');
    ok(Object.keys(g.errorLab).some(k => (g.errorLab[k].solved || 0) > 0 || (g.errorLab[k].box || 0) > 0), 'Error Lab drills update the shared Error Lab');
    if (await page.locator('[aria-label="Close · إغلاق"]').count()) { await page.click('[aria-label="Close · إغلاق"]'); await sleep(150); }
    // اختبار الوحدة 1 مقفل في جهاز جديد: لا يُختبر المتعلم في وحدة لم يدرسها
    await expandUnit(page, 1);
    const ut1Tile = unitBlock(page, 1).locator('.u-test');
    const ut1Tag = await ut1Tile.evaluate(el => el.tagName), ut1Txt = await ut1Tile.innerText();
    await ut1Tile.click(); await sleep(200);
    const ut1Opened = (await page.locator('.pl').count()) > 0;
    if (ut1Opened) { await page.click('[aria-label="Close · إغلاق"]'); await sleep(150); }
    await page.locator('.nav-it').nth(0).click(); await sleep(200);
    g = await getJSON(page, 'ep4.course');
    ok(ut1Tag === 'DIV' && ut1Txt.includes('Opens after') && !ut1Opened && !(g.unitTests && g.unitTests[1]), 'the Unit 1 test row is locked in Course ("Opens after the unit lessons") and does not open');
    // كامبلي: بطاقة وحدة درس اليوم (الأسبوع التأسيسي ما دام F1 هو الدرس الحالي)
    await page.locator('.tool', { hasText: 'Cambly card' }).click(); await sleep(200);
    const cSheet = await page.innerText('#sheetBox'), c0Title = await page.evaluate(() => DATA.camblyUnits[0].titleEn);
    await page.locator('#sheetBox .btn', { hasText: 'Log Cambly Session' }).click(); await sleep(150);
    g = await getJSON(page, 'ep4.course');
    ok(g.camblyLogs.length === 1 && g.camblyLogs[0].mins === 30, 'Cambly session log is saved in the course state');
    ok(cSheet.includes('Foundation Week · Weekly Cambly Card') && cSheet.includes(c0Title) && g.camblyLogs[0].unit === 0, "the Cambly card follows the current lesson's unit (Foundation Week card while F1 is current)");
    await page.click('#sheetBox .close'); await sleep(150);
    // درس اليوم ينتقل إلى التالي إذا اكتمل في يوم سابق
    await page.evaluate(() => { const y = Date.now() - 864e5 * 1.2; const l = JSON.parse(localStorage.getItem('ep4.lesson.u0l1') || '{"v":4}'); l.stamps = { recall:y, vocab:y, grammar:y, reading:y, writing:y, quiz:y }; localStorage.setItem('ep4.lesson.u0l1', JSON.stringify(l)); const g = JSON.parse(localStorage.getItem('ep4.course')); g.cur = 'u0l1'; localStorage.setItem('ep4.course', JSON.stringify(g)); });
    await page.reload(); await sleep(400);
    await page.locator('.nav-it').nth(0).click(); await sleep(250);
    ok((await text(page)).includes('Two Cases in Court'), "after finishing a lesson on a previous day, today's lesson moves to the next one");
    ok(page.errors.length === 0, 'no page errors (tools): ' + page.errors.join(' | '));
    await ctx.close();
  }

  /* ---------------- هـ) إكمال كل الدروس (أو دروس --only وحدها) بكل مراحلها دون أخطاء ---------------- */
  {
    const { ctx, page } = await newPage(null);
    await startApp(page);
    const norm = s => String(s || '').replace(/_{3}/g, '').replace(/\s+/g, '').toLowerCase();
    // نوع كل درس من ملفه نفسه كما حمّلته الصفحة: الاستماع mode: 'listening'، والقراءة لها reading
    const kinds = await page.evaluate(ids => ids.map(id => { const L = LESSONS[id] || {}; return [id, L.mode, !!L.reading]; }), DRIVE.map(l => l.id));
    const LISTEN_IDS = kinds.filter(k => k[1] === 'listening').map(k => k[0]); // دروس المقاطع الحقيقية
    const READ_IDS = kinds.filter(k => k[2]).map(k => k[0]);                   // دروس القراءة
    const seenListen = {};               // ما يظهر فيهما في مرحلتي الاستماع ١ و٣
    const seenRead = {};                 // رأس الإيميل ومؤقت القراءة الأولى وشارة عدد الكلمات في دروس القراءة
    async function drive(lid) {
      const data = await page.evaluate(lid => { const L = LESSONS[lid]; const v = (L.vocab || []).concat(L.legalPhrase ? [L.legalPhrase] : []); return { pairs: v.map(x => [x.en, x.ar]), quiz: L.quiz.map(q => [q.s, q.opts[q.a]]) }; }, lid);
      const arOf = Object.fromEntries(data.pairs);
      for (let n = 0; n < 600; n++) {
        if (!(await page.locator('.pl').count())) return true;
        if (LISTEN_IDS.includes(lid)) {
          const scr = await page.innerText('#screen').catch(() => '');
          if (/Stage 3 of 3/.test(scr) && /Listening/.test(scr)) seenListen[lid] = Object.assign(seenListen[lid] || {}, { s3: scr, s3html: await page.innerHTML('#screen') });
        } else if (!(seenRead[lid] && seenRead[lid].read1) && await page.locator('.rtimer-t').count() && await page.locator('.mail-meta').count()) {
          seenRead[lid] = Object.assign(seenRead[lid] || {}, { read1: true, art: await page.locator('.mail-art').count(), from: await page.locator('.mail-meta > div').first().innerText(), timer: await page.locator('.rtimer-t').innerText() });
        } else if (!(seenRead[lid] && seenRead[lid].tag) && await page.locator('#hlToggle').count()) {
          seenRead[lid] = Object.assign(seenRead[lid] || {}, { tag: await page.locator('.st-lbl .tag').first().innerText() });
        }
        if (await page.locator('.m-it.en:not(.matched)').count()) {
          const ens = await page.locator('.m-it.en:not(.matched)').allInnerTexts();
          for (const en of ens) {
            await page.locator('.m-it.en:not(.matched)', { hasText: en }).first().click();
            await page.locator('.m-it.ar:not(.matched)').filter({ hasText: arOf[en.trim()] }).first().click();
            await sleep(40);
          }
          await sleep(1300); continue;
        }
        const know = page.locator('.pl button:visible', { hasText: 'I know it' });
        if (await know.count()) { await know.first().click(); await sleep(60); continue; }
        const opt = page.locator('.opt:enabled');
        if (await opt.count()) {
          const q = norm(await page.locator('.q-en').first().innerText().catch(() => ''));
          // Two quiz items may share a question ("Which sentence is correct?"): pick the one whose answer is on screen.
          const optTexts = (await opt.allInnerTexts()).map(norm);
          const hit = data.quiz.find(x => norm(x[0]) === q && optTexts.some(t => t.includes(norm(x[1]))));
          if (hit) await page.locator('.opt:enabled', { hasText: hit[1] }).first().click(); else await opt.first().click();
          await sleep(60);
          if (LISTEN_IDS.includes(lid)) { const scr = await page.innerText('#screen').catch(() => ''); if (/Stage 1 of 3/.test(scr)) seenListen[lid] = Object.assign(seenListen[lid] || {}, { s1: scr }); }
          await cta(page); continue;
        }
        const inp = page.locator('.gap-in:enabled');
        if (await inp.count()) { const c = await inp.count(); for (let i = 0; i < c; i++) await inp.nth(i).fill('x'); await inp.last().press('Enter'); await sleep(60); await cta(page); continue; }
        if (await page.locator('.b-pool .chip:enabled').count()) { while (await page.locator('.b-pool .chip:enabled').count()) await page.locator('.b-pool .chip:enabled').first().click(); await cta(page); continue; }
        const ta = page.locator('textarea.wt');
        if (await ta.count() && !(await ta.inputValue())) { await ta.fill('I am a law student in Riyadh. My teachers are very helpful. I prepare my notes every morning. I do not study late on Friday nights.'); await sleep(200); await cta(page); continue; }
        const b = page.locator('.pl-foot .btn:visible').last();
        if ((await b.count()) && await b.isEnabled()) { await b.click(); await sleep(80); continue; }
        return false;
      }
      return false;
    }
    // الدروس بترتيب الكورس من content.js (DRIVE)، ويُفتح كل درس من سطره في قائمة وحدته
    // فحص القفل قبل آخر درس تأسيسي في هذا التشغيل (بعد أربعة من خمسة في التشغيل الكامل)، أو قبل أول درس إن لم يكن فيه درس تأسيسي
    const lockAt = DRIVE.filter(l => l.unit === 0).map(l => l.id).pop() || DRIVE[0].id;
    for (const { id: lid } of DRIVE) {
      if (lid === lockAt) {
        // درس تأسيسي واحد على الأقل لم يكتمل بعد: سطر اختبار الأسبوع مقفل في الرئيسية وفي شاشة الدروس
        const lockedRow = async () => { const r = page.locator('.u0-test'); return (await r.count()) === 1 && (await r.evaluate(el => el.tagName)) === 'DIV' && (await r.innerText()).includes('Opens after'); };
        await page.locator('.nav-it').nth(0).click(); await sleep(200);
        const onHome = (await page.locator('.u0-test, .tbanner').count()) === 0;
        if (await page.locator('.u0-test').count()) { await page.locator('.u0-test').click(); await sleep(150); }
        const noPlayer = !(await page.locator('.pl').count());
        if (!noPlayer) { await page.click('[aria-label="Close · إغلاق"]'); await sleep(150); }
        await expandUnit(page, 0);
        const onLessons = await lockedRow();
        await page.locator('.nav-it').nth(0).click(); await sleep(200);
        ok(onHome && noPlayer && onLessons, 'the Foundation Week test is not offered on Today and its row is locked in Course while a foundation lesson is still incomplete');
      }
      const opened = await openLesson(page, lid);
      if (opened) { await page.locator('.tp-card .btn').filter({ hasText: /Start|Continue/ }).first().click(); await sleep(200); }
      const finished = opened && await drive(lid);
      const st = await getJSON(page, 'ep4.lesson.' + lid);
      const stamped = st && st.stamps ? ['recall', 'vocab', 'grammar', 'reading', 'writing', 'quiz'].filter(k => st.stamps[k]).length : 0;
      ok(finished && stamped === 6, lid + ': all 6 stages can be completed (' + stamped + '/6)' + (opened ? '' : ' · its row in the unit list did not open it'));
      await backHome(page);
    }
    // المقاطع الحقيقية: لا يُنسخ نصها إلى الموقع، والمرحلة الثالثة تفتحه في صفحة المصدر، وشرح سؤال الفكرة العامة يظهر بعد الإجابة
    for (const lid of LISTEN_IDS) {
      const L = await page.evaluate(lid => { const x = LESSONS[lid].listening; return { url: x.url, why: x.predict.revealEn || x.predict.whyEn || '', copied: !!(x.transcriptParas || x.paras || x.transcript) }; }, lid);
      const s = seenListen[lid] || {};
      ok(!L.copied && !!s.s3 && s.s3.includes('Open Transcript & Clip') && s.s3html.includes(L.url) && !s.s3html.includes('mail-body'), lid + ': stage 3 opens the transcript on the source page (none copied into the site)');
      ok(!!s.s1 && !!L.why && s.s1.includes(L.why.slice(0, 40)), lid + ': the main-idea answer shows its explanation');
    }
    // أخطاء كل الدروس التي أُكملت هنا في دفتر واحد (إجابات الاسترجاع 'x' الخاطئة تدخله من كل درس)
    const g = await getJSON(page, 'ep4.course');
    ok(DRIVE.every(l => Object.keys(g.mistakes).some(k => k.startsWith(l.id + '|'))), 'mistakes from several lessons live together in one notebook (' + DRIVE.length + ' lessons)');
    // دقائق اللوحة: 60 دقيقة لكل درس مكتمل (المراحل الست 5 + 8 + 12 + 17 + 10 + 8، أي 600 دقيقة لعشرة دروس)
    const MIN_PER_LESSON = 60, wantMins = DRIVE.length * MIN_PER_LESSON;
    await page.locator('.nav-it').nth(0).click(); await sleep(200);
    await page.locator('.jr-more').first().click(); await sleep(250);
    const dash = await page.innerText('#sheetBox');
    ok(new RegExp('(?:^|\\D)' + wantMins + 'm').test(dash), 'dashboard counts the ' + DRIVE.length + ' completed lessons as ' + wantMins + ' minutes');
    await page.click('#sheetBox .close'); await sleep(100);

    // القراءة في الدروس التي أُكملت هنا: رسم الرأس في الدرس الذي يضع reading.art وحده (صورة القارة القطبية في درس نور U1·L1)،
    // وسطر FROM من الدرس نفسه («Research Station, Antarctica» في U1·L1 وحده)، والمؤقت من targetSeconds، وعدد الكلمات من النص
    const rInfo = await page.evaluate(ids => ids.map(id => { const r = LESSONS[id].reading; return { id, t: r.targetSeconds, art: !!r.art, from: r.fromMeta || r.from || '' }; }), READ_IDS);
    const fmt = s => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    const readOK = rInfo.every(({ id, t, art, from }) => { const r = seenRead[id] || {}; return r.read1 && (!t || r.timer.endsWith('/ ' + fmt(t))) && r.art === (art ? 1 : 0) && /Antarctica/.test(r.from) === /Antarctica/.test(from) && (id === 'u1l1' ? /Research Station, Antarctica/.test(r.from) && /~210 words/.test(r.tag || '') : /~\d+ words/.test(r.tag || '')); });
    if (!ONLY || READ_IDS.length) ok((ONLY || rInfo.length >= 2) && readOK, 'reading header art and "Research Station, Antarctica" appear only in U1·L1 (art only where a lesson sets reading.art); timers use targetSeconds and the word tag is counted from each text: ' + JSON.stringify(seenRead).slice(0, 300));

    // الكتابة: فاصلة الآيفون العليا (’) تجتاز فحوص الكتابة نفسها، ومربع الكتابة بلا تصحيح تلقائي من iOS
    const wl = await page.evaluate(() => { for (const id of Object.keys(LESSONS)) { const w = LESSONS[id].writing; if (w && Array.isArray(w.checks) && /\b\w+'\w+\b/.test(w.model || '')) return { id, model: w.model }; } return null; });
    let wOK = false, wMsg = 'no lesson model with an apostrophe';
    if (wl && !COURSE.some(l => l.id === wl.id)) wMsg = wl.id + ' is not an open lesson in content.js';
    else if (wl && !(await openLesson(page, wl.id))) wMsg = wl.id + ': its row in the unit list did not open it';
    else if (wl) {
      await page.locator('.pstep').nth(4).click(); await sleep(200);
      const ta = page.locator('textarea.wt');
      const attrs = await ta.evaluate(el => ['autocapitalize', 'autocorrect', 'spellcheck'].map(a => el.getAttribute(a)).join(','));
      await ta.fill(wl.model); await sleep(400); const onStraight = await page.locator('.checks li.on').count();
      await ta.fill(wl.model.replace(/'/g, '’')); await sleep(400); const onCurly = await page.locator('.checks li.on').count();
      wOK = attrs === 'off,off,false' && onStraight > 0 && onCurly === onStraight; wMsg = wl.id + ' ' + onCurly + '/' + onStraight + ' · ' + attrs;
      await page.click('[aria-label="Close · إغلاق"]'); await sleep(200); await backHome(page);
    }
    ok(wOK, "iPhone apostrophes (’) pass the same writing checks as straight ones, and the writing box turns off iOS autocorrect (" + wMsg + ')');

    // اختبارا الوحدتين يحتاجان كل دروس الوحدة مكتملة: يجريان في التشغيل الكامل، ومع --only حين تُذكر دروس الوحدة كلها
    const unitDriven = u => COURSE.some(l => l.unit === u) && COURSE.filter(l => l.unit === u).every(l => DRIVE.includes(l));
    if (unitDriven(0)) {
      // اختبار الأسبوع التأسيسي: يُفتح بعد الدروس الخمسة، ويكتمل، وتُحفظ نتيجته في G.unitTests[0]
      await expandUnit(page, 0);
      const u0btn = page.locator('button.u0-test');
      const u0open = (await u0btn.count()) === 1;
      let u0result = false, u0min = null;
      if (u0open) {
        await u0btn.click(); await sleep(250);
        await cta(page); // الركن القانوني ← السؤال الأول
        for (let i = 0; i < 60; i++) { const opt = page.locator('.opt:enabled'); if (!(await opt.count())) break; await opt.first().click(); await sleep(60); await cta(page); }
        if (await page.locator('textarea.wt').count()) {
          // المهمة التطبيقية تطلب minSentences جملة: ثلاث جمل لا تكفي حين تطلب المهمة أربعًا
          const need = await page.evaluate(() => (DATA.unitTests[0].appliedTask || {}).minSentences || 3);
          if (need > 3) { await page.fill('textarea.wt', 'I am a law student in Riyadh. My classes are on Sunday. I was at the library yesterday.'); await cta(page); u0min = (await page.locator('textarea.wt').count()) === 1 && /\/ 4\b/.test(await page.locator('.wcount').innerText()); }
          await page.fill('textarea.wt', 'I am a law student in Riyadh. My classes are on Sunday. I was at the library yesterday. I do not work on Fridays.'); await cta(page);
        }
        u0result = (await page.locator('.result .ring-w').count()) === 1;
        await cta(page); // رجوع للدروس
      }
      const gu = await getJSON(page, 'ep4.course');
      ok(u0open && u0result && gu.unitTests && gu.unitTests[0] && gu.unitTests[0].attempts === 1 && typeof gu.unitTests[0].last === 'number' && !gu.unitTests[1] && !(await page.locator('.pl').count()), 'unit test result is saved in the course state: the Foundation Week test opens after the five lessons, can be finished, and is saved in G.unitTests[0]');
      ok(u0min === true, 'the Foundation Week applied task keeps its minSentences: 3 sentences are refused when it asks for 4');
    }

    if (unitDriven(1)) {
      // اختبار الوحدة 1: يُفتح بعد دروسها الخمسة، ويكتمل، وتُحفظ نتيجته في G.unitTests[1]، ومهمته تطلب minSentences جملة
      // بلاطة الرئيسية تتبع وحدة الدرس الحالي، فتُفحص حين يكون عنوانها Unit 1 وحده، وإلا فُتح الاختبار من سطره في كتلة الوحدة 1 في «الدروس»
      await page.locator('.nav-it').nth(0).click(); await sleep(200);
      const t1 = page.locator('.tbanner', { hasText: /\bUnit 1 test\b/ }).locator('button');
      const t1Home = (await t1.count()) === 1, t1Tag = t1Home ? await t1.evaluate(el => el.tagName) : null;
      let t1Result = false, t1Min = null, t1Btn = t1Tag === 'BUTTON' ? t1 : null;
      if (!t1Home) { await expandUnit(page, 1); const row = unitBlock(page, 1).locator('button.u-test'); if ((await row.count()) === 1) t1Btn = row; }
      if (t1Btn) {
        await t1Btn.click(); await sleep(250);
        await cta(page); // الركن القانوني ← السؤال الأول
        for (let i = 0; i < 60; i++) { const opt = page.locator('.opt:enabled'); if (!(await opt.count())) break; await opt.first().click(); await sleep(60); await cta(page); }
        if (await page.locator('textarea.wt').count()) {
          const need = await page.evaluate(() => (DATA.unitTests[1].appliedTask || {}).minSentences || 3);
          if (need > 3) { await page.fill('textarea.wt', 'I usually study law in the morning. This week I am working on a project. I never break the law.'); await cta(page); t1Min = (await page.locator('textarea.wt').count()) === 1 && /\/ 4\b/.test(await page.locator('.wcount').innerText()); }
          await page.fill('textarea.wt', 'I usually study law in the morning. This week I am working on a project. I never break the law. I prefer short emails.'); await cta(page);
        }
        t1Result = (await page.locator('.result .ring-w').count()) === 1;
        await cta(page); // رجوع
      }
      await page.locator('.nav-it').nth(1).click(); await sleep(200);
      const r1 = unitBlock(page, 1).locator('.u-test');
      const r1Open = (await r1.count()) === 1 && (await r1.evaluate(el => el.tagName)) === 'BUTTON';
      const g1 = await getJSON(page, 'ep4.course');
      ok((t1Home ? t1Tag === 'BUTTON' : !!t1Btn) && t1Result && r1Open && g1.unitTests && g1.unitTests[1] && g1.unitTests[1].attempts === 1, 'the Unit 1 test opens on ' + (t1Home ? 'Home and Lessons' : 'Lessons (the Home tile shows another unit)') + ' once its five lessons are complete, can be finished, and is saved in G.unitTests[1]');
      ok(t1Min === true, 'the Unit 1 applied task keeps its minSentences: 3 sentences are refused when it asks for 4');
    }

    // كتابة حساسة لحالة الحرف (exact: true): يُرفض riyadh وتظهر الصيغة الصحيحة، ويُقبل Riyadh
    // عنصر واحد من كل نوع (تمرين كتابة القواعد gC، وسؤال الاسترجاع rc) إن وُجد، ويُفضَّل جواب من أكثر من حرف
    const exList = await page.evaluate(() => { const pick = p => { const c = []; for (const lid of Object.keys(LESSONS)) { const arr = (p === 'gC' ? LESSONS[lid].gC : LESSONS[lid].recall) || []; arr.forEach((x, i) => { const a = x.ans && x.ans[0]; if (x.exact && a && a !== a.toLowerCase()) c.push({ lid, id: p + '-' + i, ans: a }); }); } return c.filter(x => x.ans.length > 1)[0] || c[0] || null; }; return [pick('gC'), pick('rc')].filter(Boolean); });
    async function reviewTyped(ex, v) {
      await page.evaluate(ex => { const g = JSON.parse(localStorage.getItem('ep4.course')); const t = Date.now(); g.mistakes[ex.lid + '|' + ex.id] = { lid: ex.lid, id: ex.id, box: 0, t: t, due: t - 1000 }; localStorage.setItem('ep4.course', JSON.stringify(g)); }, ex);
      await page.reload(); await sleep(400);
      await page.locator('.nav-it').nth(2).click(); await sleep(250);
      if (!(await page.locator('#nbHero .btn').count())) return { bad: 0, good: 0, fb: '' };
      await page.locator('#nbHero .btn').click(); await sleep(250);
      if (!(await page.locator('.gap-in:enabled').count())) return { bad: 0, good: 0, fb: '' };
      await page.locator('.gap-in:enabled').fill(v); await page.locator('.gap-in').press('Enter'); await sleep(150);
      const r = { bad: await page.locator('.gap-in.bad').count(), good: await page.locator('.gap-in.ok').count(), fb: (await page.locator('.fb').count()) ? await page.locator('.fb').first().innerText() : '', label: await page.locator('.st-lbl').first().innerText().catch(() => '') };
      await page.click('[aria-label="Close · إغلاق"]'); await sleep(150);
      return r;
    }
    const exRes = [];
    for (const ex of exList) { const low = await reviewTyped(ex, ex.ans.toLowerCase()), right = await reviewTyped(ex, ex.ans); exRes.push({ ex, label: low.label, ok: low.bad === 1 && low.fb.includes(ex.ans) && /capital/i.test(low.fb) && right.good === 1 }); }
    ok(exRes.some(r => r.ex.id.startsWith('gC-')) && exRes.every(r => r.ok), 'typed items with exact: true (grammar typing and recall) reject the lowercase answer, show the correct form, and accept the capitalised one (' + (exRes.map(r => r.ex.lid + ' ' + r.ex.id + ' ' + r.ex.ans + (r.ok ? ' ok' : ' FAILED')).join(', ') || 'no exact item in the lessons yet') + ')');
    // تمرين الحرف الكبير ليس فعلًا: عنوانه محايد لا «Write the verb…»
    const gcRes = exRes.filter(r => r.ex.id.startsWith('gC-'))[0];
    ok(!!gcRes && /Write the correct form/.test(gcRes.label) && !/Write the verb/.test(gcRes.label), 'a capitalisation typing item gets a neutral group label, not "Write the verb…" (' + (gcRes ? gcRes.label.split('\n')[0] : 'none') + ')');

    ok(page.errors.length === 0, 'no page errors while completing all lessons: ' + page.errors.join(' | '));
    await ctx.close();
  }

  /* ---------------- ج) المزامنة مع GitHub (محاكاة) ---------------- */
  const gh = fakeGitHub('test-token');
  let firstStartedAt = 0;
  {
    const { ctx, page } = await newPage(gh);
    await startApp(page);
    await page.click('#gearBtn'); await sleep(200);
    await page.fill('#syncToken', 'test-token');
    await page.click('#syncConnect');
    for (let i = 0; i < 100 && !(gh.files['progress/course.json'] && gh.files['progress/lesson-u0l1.json']); i++) await sleep(100);
    await sleep(300);
    ok(gh.branch, 'connect creates the "progress" branch');
    ok(!!gh.files['progress/course.json'] && !!gh.files['progress/lesson-u0l1.json'], 'connect uploads course.json and lesson-u0l1.json');
    ok(Object.values(gh.files).every(f => f.branch === 'progress'), 'every upload goes to the progress branch, never main');
    ok(Object.keys(gh.files).every(k => !Buffer.from(gh.files[k].content, 'base64').toString().includes('test-token')), 'the key is never uploaded');
    ok((await page.innerText('#syncBox')).includes('On'), 'settings show sync as On');
    firstStartedAt = (gh.json('progress/course.json') || {}).startedAt;
    await page.click('#sheetBox .close'); await sleep(150);

    // إنهاء مرحلة يرفع الدرس خلال ثوانٍ، بطلب PUT واحد لكل ملف تغيّر
    const putsBefore = gh.log.filter(x => x.startsWith('PUT')).length;
    await page.locator('.nav-it').nth(0).click(); await sleep(200);
    await doRecallStage(page, () => 'zzzz');
    await page.waitForFunction(() => { const m = JSON.parse(localStorage.getItem('ep4.syncmeta') || '{}'); return !m.dirtyAt; }, null, { timeout: 8000 }).catch(() => {});
    const lj = gh.json('progress/lesson-u0l1.json');
    ok(lj && lj.stamps && lj.stamps.recall, 'finishing a stage uploads the lesson within seconds');
    const puts = gh.log.filter(x => x.startsWith('PUT')).length - putsBefore;
    ok(puts >= 1 && puts <= 4, 'the stage upload used a handful of requests (' + puts + ' PUT)');

    // تعارض: يُقرأ الأحدث ثم يُعاد الرفع
    gh.conflictOnce = true;
    await page.click('[aria-label="Close · إغلاق"]'); await sleep(150);
    await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await sleep(1500);
    const meta = await getJSON(page, 'ep4.syncmeta');
    ok(meta && !meta.err, 'a conflict (409) is resolved by re-reading and re-uploading, no error left');
    ok(page.errors.length === 0, 'no page errors (sync device 1): ' + page.errors.join(' | '));
    await ctx.close();
  }
  {
    // جهاز ثانٍ: يستعيد التقدم دون إعادة تحميل الصفحة
    const { ctx, page } = await newPage(gh);
    await startApp(page);
    await page.evaluate(() => { window.__noReload = 1; });
    await page.click('#gearBtn'); await sleep(200);
    await page.fill('#syncToken', 'test-token');
    await page.click('#syncConnect');
    await page.waitForFunction(() => { const g = JSON.parse(localStorage.getItem('ep4.course') || '{}'); return g.mistakes && Object.keys(g.mistakes).length >= 5; }, null, { timeout: 8000 }).catch(() => {});
    const g = await getJSON(page, 'ep4.course');
    ok(g && Object.keys(g.mistakes).length >= 5 && g.startedAt === firstStartedAt, 'a new device restores the cloud progress (mistakes and start date)');
    ok(await page.evaluate(() => window.__noReload === 1), 'restoring happens without reloading the page');
    const l = await getJSON(page, 'ep4.lesson.u0l1');
    ok(l && l.stamps && l.stamps.recall, 'the lesson stages are restored too');
    ok(page.errors.length === 0, 'no page errors (sync device 2): ' + page.errors.join(' | '));
    await ctx.close();
  }
  {
    // مفتاح خاطئ: رسالة واضحة ونقطة على الترس
    const { ctx, page } = await newPage(gh);
    await startApp(page);
    await page.click('#gearBtn'); await sleep(200);
    await page.fill('#syncToken', 'wrong-token');
    await page.click('#syncConnect'); await sleep(1200);
    ok((await page.innerText('#syncBox')).includes('The key is invalid or expired.'), 'a wrong key shows a clear message');
    ok((await page.locator('#gearBtn .sync-dot').count()) === 1, 'a wrong key puts a small dot on the gear');
    await ctx.close();
  }

  /* ---------------- و) الاختبار القبلي: صامت حتى النهاية، والمحاولة الأولى وحدها تقرر الإعفاء، وإصدار السجل ---------------- */
  {
    const { ctx, page } = await newPage(null);
    await startApp(page);
    await page.locator('.nav-it').nth(1).click(); await sleep(250);
    { const more = page.locator('button.tl-row', { hasText: /^Units \d+ to \d+/ }); if (await more.count()) { await more.click(); await sleep(200); } } // الوحدات المطوية (6 إلى 12)
    const unitCard = u => page.locator('.u-card-wrap').filter({ has: page.locator('.u-n', { hasText: new RegExp('^' + u + '$') }) });
    const openPre = async u => { await unitCard(u).locator('button.btn').click(); await sleep(250); };
    const preRec = async u => { const g = await getJSON(page, 'ep4.course'); return (g.preTests || {})[u] || null; };
    const items = async u => page.evaluate(u => window.DATA.preTests[u].items, u);
    const N9 = (await items(9)).length;
    // يجيب عن البند الحالي: right صحيحة، وإلا خاطئة عمدًا
    async function answerPre(item, right) {
      if (item.type === 'typing') { await page.locator('.gap-in:enabled').fill(right ? item.ans[0] : 'zzz'); await page.locator('.gap-in:enabled').press('Enter'); }
      else await page.locator('.opt:enabled').nth(right ? item.a : (item.a + 1) % item.opts.length).click();
      await sleep(80);
    }
    // ما يراه المتعلم بعد الإجابة: لا بطاقة ولا تلوين صح أو خطأ، بل حالة «حُفظت» المحايدة وسطر صغير
    const quiet = async () => ({
      fb: await page.locator('.fb').count(),
      verdict: await page.locator('.gap-in.ok, .gap-in.bad, .opt.ok, .opt.bad, .opt.dim, .blank.ok, .blank.bad').count(),
      saved: await page.locator('.gap-in.saved, .opt.chosen').count(),
      note: (await text(page)).includes('Answer saved')
    });

    // 1) الوحدة 9: مقدمة المحاولة الأولى، ثم كل البنود صحيحة
    await openPre(9);
    const intro1 = await text(page);
    ok(/Only your FIRST attempt counts for the exemption/.test(intro1) && /10 questions \(8 typing \+ 2 multiple choice\)/.test(intro1) && /at least 9 of 10 \(90%\)/.test(intro1) && /answers and explanations appear at the end/i.test(intro1) && /leave midway, it still counts as your first attempt/.test(intro1) && (await page.locator('#screen .ar-box').first().evaluate(el => el.textContent)).includes('المحاولة الأولى وحدها') && !/practice attempt/i.test(intro1),
      'pre-test intro (first attempt): the counts come from the items, only the FIRST attempt counts, answers appear at the end, leaving midway still counts');
    await cta(page);
    const its9 = await items(9);
    let quietOK = true, quietMsg = '', scOK = true, scMsg = '', wideOK = true, saveLbl = '', tagOK = true, instrOK = true;
    for (let i = 0; i < its9.length; i++) {
      const typed = its9[i].type === 'typing';
      if (typed) {
        if (i === 0) saveLbl = await page.locator('.pl-foot .btn:visible').last().innerText();
        wideOK = wideOK && (await page.locator('.gap-in.wide').count()) === 1;
        const t = await text(page);
        instrOK = instrOK && t.includes('Type the missing words. Use the words in brackets.') && t.includes('اكتب الكلمات الناقصة مستعينًا بما بين القوسين.');
      } else tagOK = tagOK && (await page.locator('.q-tag').first().innerText()).trim() === 'Unit 9 Pre-Test · Q' + (i + 1) + '/' + its9.length;
      await answerPre(its9[i], true);
      const q = await quiet();
      if (!(q.fb === 0 && q.verdict === 0 && q.saved === 1 && q.note)) { quietOK = false; quietMsg += ' Q' + (i + 1) + ' ' + JSON.stringify(q); }
      const r = await preRec(9);
      if (!(r && r.first && r.first.sc === i + 1 && r.first.n === its9.length && r.first.done === false && r.exempt === ((i + 1) * 10 >= its9.length * 9))) { scOK = false; scMsg += ' after Q' + (i + 1) + ': ' + JSON.stringify(r); }
      if (i === 1) {
        // «رجوع» يعيد البند السابق بحالته المحايدة نفسها (محفوظ بلا بطاقة ولا تلوين)، ثم «التالي» يعيد البند الحالي كذلك
        await cta(page);
        await page.locator('.pl-foot .ib.back').click(); await sleep(150);
        await page.locator('.pl-foot .ib.back').click(); await sleep(150);
        const b = await quiet(), v0 = await page.locator('.gap-in.saved').inputValue().catch(() => null);
        ok(b.fb === 0 && b.verdict === 0 && b.saved === 1 && b.note && v0 === its9[0].ans[0], 'going back to a saved pre-test answer restores the same neutral state with the typed text (no card, no right/wrong colours): ' + JSON.stringify(b) + ' value=' + v0);
        await cta(page); await cta(page); // الأول ← الثاني ← الثالث
        continue;
      }
      await cta(page);
    }
    ok(quietOK, 'pre-test is quiet: after every answer no feedback card and no right/wrong classes, only the neutral saved state and the "Answer saved" line (all ' + its9.length + ' items)' + quietMsg);
    ok(/Save answer/.test(saveLbl) && wideOK && instrOK && tagOK, 'typed pre-test items: "Save answer" button, wide input, the instruction line above; the question tag uses the real item count (' + saveLbl.replace(/\n/g, ' ') + ')');
    ok(scOK, 'during the first attempt first.sc and the exemption flag are saved after every answer' + scMsg);

    // 2) شاشة النتيجة: الإعفاء وقائمة مراجعة بعدد البنود
    const res1 = await text(page);
    ok((await page.locator('.result .ring-w').count()) === 1 && /Unit 9 Exempted \(100%/.test(res1), 'pre-test result shows the score ring and the exemption message');
    const rv = await page.evaluate(() => Array.from(document.querySelectorAll('.pt-item')).map(e => ({ t: e.textContent, ok: !!e.querySelector('.fb:not(.bad)'), bad: !!e.querySelector('.fb.bad') })));
    const rvOK = rv.length === its9.length && rv.every((e, i) => { const x = its9[i], c = x.type === 'typing' ? x.ans[0] : x.opts[x.a]; return e.ok && !e.bad && e.t.includes('Q' + (i + 1) + '/' + its9.length) && e.t.includes(c) && e.t.includes(x.whyEn) && e.t.includes(x.why); });
    ok(rvOK, 'result review lists every item with its number, right/wrong mark, the correct answer and the explanation (' + rv.length + ' entries)');
    const r9 = await preRec(9);
    ok(r9 && r9.v === 2 && r9.attempts === 1 && r9.first && r9.first.sc === its9.length && r9.first.done === true && r9.exempt === true && r9.last === undefined, 'first attempt record: version 2, one attempt, 10/10, done, exempt, no practice score yet: ' + JSON.stringify(r9));
    await cta(page); // رجوع للدروس
    const lc9 = await unitCard(9).innerText();
    ok(/Exempted \(100%\)/.test(lc9) && /Practice/.test(lc9) && !/Pre-Test Available/.test(lc9), 'lessons chip: "Exempted (100%)" and the button becomes "Practice"');

    // 3) محاولة تدريب بإجابات خاطئة: لا تلغي الإعفاء
    await openPre(9);
    const intro2 = await text(page);
    ok(/This is a practice attempt: it does not change your exemption/.test(intro2) && /already counted \(100%, exempted\)/.test(intro2) && !/Only your FIRST attempt counts/.test(intro2), 'a later attempt says it is practice and does not change the exemption');
    await cta(page);
    for (let i = 0; i < its9.length; i++) { await answerPre(its9[i], false); await cta(page); }
    const res2 = await text(page);
    ok(/Practice Score: 0%/.test(res2) && /you stay exempted from Unit 9/.test(res2) && (await page.locator('.pt-item .fb.bad').count()) === its9.length, 'practice result with all-wrong answers shows 0% yet keeps the exemption, and the review marks every item wrong');
    const r9b = await preRec(9);
    ok(r9b && r9b.attempts === 2 && r9b.last === 0 && r9b.best === 0 && r9b.exempt === true && r9b.first.sc === its9.length && r9b.first.done === true, 'practice stores last/best only; the first attempt and the exemption are unchanged: ' + JSON.stringify(r9b));
    await cta(page);
    ok(/Exempted \(100%\)/.test(await unitCard(9).innerText()), 'the lessons chip still shows Exempted after a failed practice attempt');

    // 4) الوحدة 5: إجابة البند الأول فقط ثم الخروج تحسب المحاولة الأولى (والباقي خاطئ)
    const its5 = await items(5);
    await openPre(5);
    await cta(page);
    await answerPre(its5[0], true);
    await page.click('[aria-label="Close · إغلاق"]'); await sleep(250);
    const r5 = await preRec(5), lc5 = await unitCard(5).innerText();
    ok(r5 && r5.v === 2 && r5.attempts === 1 && r5.first && r5.first.sc === 1 && r5.first.n === its5.length && r5.first.done === false && r5.exempt === false, 'leaving after one answer still counts as the first attempt (1/10, not done, not exempt): ' + JSON.stringify(r5));
    ok(/First attempt: 10%/.test(lc5) && /Practice/.test(lc5) && !/Exempted/.test(lc5), 'lessons chip shows the first-attempt percent and the button becomes "Practice"');
    await openPre(5);
    const intro5 = await text(page);
    ok(/This is a practice attempt/.test(intro5) && /already counted \(10%\)/.test(intro5) && !/Only your FIRST attempt counts/.test(intro5), 'reopening after an abandoned first attempt shows a practice attempt');
    await cta(page);
    await answerPre(its5[0], false);
    await page.click('[aria-label="Close · إغلاق"]'); await sleep(250);
    const r5b = await preRec(5);
    ok(r5b && r5b.attempts === 2 && r5b.first.sc === 1 && r5b.exempt === false && r5b.last === undefined, 'a practice answer does not touch the first attempt: ' + JSON.stringify(r5b));

    // 5) سجل بلا إصدار الاختبار الحالي يُهمَل: يبدأ المتعلم محاولة أولى جديدة
    await page.evaluate(() => { const g = JSON.parse(localStorage.getItem('ep4.course')); g.preTests[8] = { v: 1, attempts: 3, first: { sc: 10, n: 10, done: true, at: 1 }, exempt: true, last: 10, best: 10 }; g.preTests[12] = { best: 10, last: 10, exempt: true, at: 1 }; localStorage.setItem('ep4.course', JSON.stringify(g)); });
    await page.reload(); await sleep(400);
    await page.locator('.nav-it').nth(1).click(); await sleep(250);
    { const more = page.locator('button.tl-row', { hasText: /^Units \d+ to \d+/ }); if (await more.count()) { await more.click(); await sleep(200); } } // الوحدات المطوية (6 إلى 12)
    const lc8 = await unitCard(8).innerText(), lc12 = await unitCard(12).innerText();
    ok(/Pre-Test Available/.test(lc8) && !/Exempted/.test(lc8) && /Pre-Test Available/.test(lc12) && !/Exempted/.test(lc12), 'records saved for an older version (or in the old format) are ignored on the lessons screen');
    const its8 = await items(8);
    await openPre(8);
    ok(/Only your FIRST attempt counts/.test(await text(page)) && !/practice attempt/i.test(await text(page)), 'a stale record does not turn the new attempt into practice');
    await cta(page);
    await answerPre(its8[0], true);
    const r8 = await preRec(8);
    ok(r8 && r8.v === 2 && r8.attempts === 1 && r8.first && r8.first.sc === 1 && r8.first.n === its8.length && r8.exempt === false && r8.best === undefined, 'the stale record is reset to the current version on the first answer: ' + JSON.stringify(r8));
    // خانة الكتابة في الاختبار القبلي أعرض من العادية على جوال عادي، ولا تتجاوز بطاقتها على جوال ضيق (320px)
    const wd = () => page.evaluate(() => { const i = document.querySelector('.gap-in.wide'), c = i && i.closest('.qcard'); if (!i || !c) return { w: 0, inner: 0, inside: false, noHScroll: false }; const ib = i.getBoundingClientRect(), cb = c.getBoundingClientRect(); return { w: Math.round(ib.width), inner: Math.round(cb.width - 44), inside: ib.left >= cb.left - 0.5 && ib.right <= cb.right + 0.5, noHScroll: document.documentElement.scrollWidth <= window.innerWidth }; });
    const w390 = await wd();
    await page.setViewportSize({ width: 320, height: 700 }); await sleep(200);
    const w320 = await wd();
    await page.setViewportSize({ width: 390, height: 844 });
    ok(w390.w >= 255 && w390.inside && w320.w <= w320.inner + 1 && w320.inside && w320.noHScroll, 'the wide pre-test input is wider than the normal one on a 390px phone and never overflows its card on a 320px phone: ' + JSON.stringify({ w390, w320 }));
    ok(page.errors.length === 0, 'no page errors (pre-tests): ' + page.errors.join(' | '));
    await ctx.close();
  }

  await browser.close(); srv.close();
  console.log(results.join('\n'));
  console.log('\n' + (results.length - fails) + '/' + results.length + ' passed');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
