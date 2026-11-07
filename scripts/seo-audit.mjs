// npm run seo:audit — builds hostinger-dist, serves it with .htaccess-equivalent rules,
// crawls every sitemap URL (raw HTML first, then a real browser at 1440x900 and 390x844)
// and exits non-zero on any critical SEO defect.
import { spawn, execFileSync } from 'node:child_process'; import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ORIGIN = 'https://virtelon.com'; const PORT = 4310; const BASE = `http://127.0.0.1:${PORT}`;
execFileSync('node', ['scripts/build-hostinger.mjs'], { stdio: 'inherit' });
const srv = spawn('node', ['scripts/serve-dist.mjs', 'hostinger-dist', String(PORT)], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 600));
const fails = []; const warn = []; const F = (u, m) => fails.push(`${u}: ${m}`);
const get = (p) => fetch(BASE + p, { redirect: 'manual' });
const attr = (h, re) => (re.exec(h) || [])[1];
try {
  const sm = await (await get('/sitemap.xml')).text();
  if (!/^<\?xml[\s\S]*<urlset[\s\S]*<\/urlset>\s*$/.test(sm)) F('/sitemap.xml', 'invalid XML structure');
  const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  const robots = await (await get('/robots.txt')).text();
  if (!robots.includes(`Sitemap: ${ORIGIN}/sitemap.xml`)) F('/robots.txt', 'missing production sitemap line');
  if (/Disallow:\s*\/\s*$/m.test(robots)) F('/robots.txt', 'blocks the whole site');
  const seen = { title: {}, desc: {}, canon: {} }; const linkSet = new Set(); const report = [];
  for (const u of urls) {
    if (!u.startsWith(ORIGIN)) { F(u, 'sitemap URL not on production origin'); continue; }
    const p = u.slice(ORIGIN.length) || '/'; const r = await get(p);
    if (r.status !== 200) { F(u, 'HTTP ' + r.status); continue; }
    const h = await r.text();
    const title = attr(h, /<title>([^<]*)<\/title>/); const desc = attr(h, /<meta name="description" content="([^"]*)"/);
    const canon = attr(h, /<link rel="canonical"[^>]*href="([^"]*)"/); const h1 = (h.match(/<h1[\s>]/g) || []).length;
    if (!title) F(u, 'missing title'); if (!desc) F(u, 'missing description');
    if (canon !== u) F(u, `canonical ${canon} != ${u}`);
    if ((h.match(/rel="canonical"/g) || []).length !== 1) F(u, 'canonical count != 1');
    if (h1 !== 1) F(u, `H1 count ${h1}`);
    if (/<meta name="robots" content="[^"]*noindex/.test(h)) F(u, 'noindex');
    if (!/<html lang="en/.test(h)) F(u, 'missing lang');
    if (attr(h, /property="og:url" content="([^"]*)"/) !== u) F(u, 'og:url mismatch');
    for (const k of ['title', 'desc', 'canon']) { const v = { title, desc, canon }[k]; if (v) { if (seen[k][v]) F(u, `duplicate ${k} with ${seen[k][v]}`); seen[k][v] = u; } }
    if (title && (title.length < 30 || title.length > 65)) warn.push(`${u}: title length ${title.length}`);
    if (desc && (desc.length < 110 || desc.length > 165)) warn.push(`${u}: description length ${desc.length}`);
    for (const m of h.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) { try { const j = JSON.parse(m[1]); if (/AggregateRating|"Review"/.test(m[1])) F(u, 'rating/review schema'); void j; } catch { F(u, 'invalid JSON-LD'); } }
    for (const m of h.replace(/<script[\s\S]*?<\/script>/g, '').matchAll(/<img\b[^>]*>/g)) if (!/\balt=/.test(m[0])) F(u, 'img without alt: ' + m[0].slice(0, 80));
    if (/(?:src|href)="http:\/\//.test(h)) F(u, 'mixed content (http://)');
    if (/(?:href|content)="https?:\/\/www\.virtelon\.com|href="https:\/\/virtelon\.com\/[a-z-]+\.html"|href="[a-z-]+\.html"/.test(h)) F(u, 'wrong host or legacy .html link');
    for (const m of h.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) linkSet.add(m[1]);
    report.push({ url: u, title, titleLen: title?.length, descLen: desc?.length, h1, bytes: h.length });
  }
  for (const l of linkSet) {
    const r = await get(l);
    if (r.status === 301) { const r2 = await get(r.headers.get('location')); if (r2.status !== 200) F(l, 'redirect chain / bad target'); else F(l, 'internal link points at a redirect'); }
    else if (r.status !== 200) F(l, 'broken internal link/asset HTTP ' + r.status);
  }
  for (const p of ['/does-not-exist-xyz', '/solutions/extra', '/random.html']) { const r = await get(p); if (r.status !== 404) F(p, 'soft 404: HTTP ' + r.status); }
  for (const [p, to] of [['/index.html', '/'], ['/tools.html', '/tools'], ['/solutions/', '/solutions']]) { const r = await get(p); if (r.status !== 301 || r.headers.get('location') !== to) F(p, 'legacy redirect missing'); else if ((await get(to)).status !== 200) F(p, 'redirect chain'); }
  // browser pass
  const { chromium } = require('playwright'); const browser = await chromium.launch();
  for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const ctx = await browser.newContext({ viewport: vp, isMobile: vp.width < 500 });
    for (const u of urls) {
      const page = await ctx.newPage(); const errs = [];
      page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/web3forms|net::ERR/.test(m.text())) errs.push(m.text()); });
      const p = u.slice(ORIGIN.length) || '/';
      await page.goto(BASE + p, { waitUntil: 'load' }); await page.waitForTimeout(400);
      const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (ov > 1) F(`${u} @${vp.width}`, `horizontal overflow ${ov}px`);
      if (errs.length) F(`${u} @${vp.width}`, 'console/page errors: ' + errs.join(' | ').slice(0, 300));
      const t = await page.title(); const c = await page.evaluate(() => document.querySelector('link[rel=canonical]')?.href);
      if (c !== u) F(`${u} @${vp.width}`, 'canonical changed after JS: ' + c);
      void t; await page.close();
    }
    await ctx.close();
  }
  await browser.close();
  console.table(report);
  if (warn.length) console.log('WARN\n' + warn.join('\n'));
  console.log(fails.length ? `\nFAIL (${fails.length})\n` + fails.join('\n') : '\nPASS: all critical SEO checks');
  process.exitCode = fails.length ? 1 : 0;
} finally { srv.kill(); }
