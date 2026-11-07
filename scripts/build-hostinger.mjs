// Virtelon — static pre-render for Hostinger (Apache/LiteSpeed).
// Source of truth stays index.html + the three tool pages in the repo root.
// Output: hostinger-dist/ — upload its CONTENTS into public_html.
// Every public route gets its own HTML file with its own title, description,
// canonical, Open Graph, JSON-LD, single H1 and ONLY its own page content.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'hostinger-dist');
const ORIGIN = 'https://virtelon.com';
const BUILD_DATE = process.env.SEO_LASTMOD || new Date().toISOString().slice(0, 10);

const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function must(cond, msg) { if (!cond) { throw new Error('build-hostinger: ' + msg); } }
function replaceOnce(s, a, b, label) {
  const n = s.split(a).length - 1;
  must(n === 1, `expected exactly one "${label || a.slice(0, 60)}", found ${n}`);
  return s.replace(a, () => b);
}

/* ---------- 1. read the SPA template and evaluate its own SEO code ---------- */
const tpl = read('index.html');
const i0 = tpl.indexOf('PAGE_PATH={'); const i1 = tpl.indexOf('function go(');
must(i0 > 0 && i1 > i0, 'router/SEO block not found');
const seoJs = 'const ' + tpl.slice(i0, i1);
function seoFor(id) {
  const attrs = {}; const el = (k) => ({ setAttribute: (a, v) => { attrs[k + '.' + a] = v; }, set textContent(v) { attrs[k + '.text'] = v; } });
  const document = { title: '', getElementById: (k) => el(k), querySelector: () => el('desc') };
  const ctx = { document, location: { pathname: '/' }, innerHeight: 900 };
  vm.runInNewContext(seoJs + `\n;applySEO(${JSON.stringify(id)});__out={title:document.title,meta:SEO_META,path:PAGE_PATH};`, ctx);
  return { ...ctx.__out, attrs };
}
const base = seoFor('home');
const PAGE_PATH = base.path; const IDS = Object.keys(PAGE_PATH);

/* ---------- 2. split the template into shell + page blocks ---------- */
function blockEnd(s, start) { // matching </div> for the <div> at start
  const re = /<div\b|<\/div>/g; re.lastIndex = start; let depth = 0, m;
  while ((m = re.exec(s))) { depth += m[0] === '</div>' ? -1 : 1; if (depth === 0) return m.index + 6; }
  throw new Error('unbalanced page block');
}
const blocks = {};
for (const id of IDS) {
  const tag = new RegExp(`<div class="page(?: active)?" id="page-${id}">`).exec(tpl);
  must(tag, 'missing page block ' + id);
  blocks[id] = { start: tag.index, end: blockEnd(tpl, tag.index) };
}

/* ---------- 3. shared fixes applied to every generated route ---------- */
function sharedFixes(h) {
  // crawlable logo links (were <div data-page="home">)
  h = h.split('<div class="logo" data-page="home"><span class="mark"></span>Virtelon</div>')
       .join('<a class="logo" data-page="home" href="/" style="color:inherit;text-decoration:none"><span class="mark"></span>Virtelon</a>');
  // clean tool URLs
  h = h.replace(/href="\/?tools\.html"/g, 'href="/tools"');
  // router: when the target page is not in this document, let the browser follow the real link
  h = replaceOnce(h, 'e.preventDefault();go(el.dataset.page,true);', "if(!document.getElementById('page-'+el.dataset.page))return;e.preventDefault();go(el.dataset.page,true);", 'click handler');
  h = replaceOnce(h, 'function go(id,push){\n  if(!PAGE_PATH.hasOwnProperty(id))id=\'home\';', "function go(id,push){\n  if(!PAGE_PATH.hasOwnProperty(id))id='home';\n  if(!document.getElementById('page-'+id)){location.href=PAGE_PATH[id];return;}", 'go()');
  // Page-specific widgets must not break the rest of the script on routes where their markup is absent.
  const groups = ['/* ---------- console ---------- */', '/* ---------- capability switcher ---------- */', '/* ---------- process fill ---------- */',
    '/* ---------- form chips + submit ---------- */', '/* ---------- live AI receptionist demo ---------- */', '/* ---------- cursor + magnetic ---------- */',
    '/* ---------- 3D tilt (transform-only, perf-safe) ---------- */', '/* ---------- cinematic case-study expand ---------- */', '/* initial route from hash */'];
  const pos = groups.map(g => { const k = h.indexOf(g); must(k > 0, 'script section missing: ' + g); return k; });
  let out = h.slice(0, pos[0]);
  for (let k = 0; k < groups.length - 1; k++) out += `try{\n${h.slice(pos[k], pos[k + 1])}\n}catch(e){}\n`;
  return out + h.slice(pos[groups.length - 1]);
}

function buildRoute(id) {
  const s = seoFor(id); const a = s.attrs; const abs = ORIGIN + PAGE_PATH[id];
  let h = tpl.slice(0, Math.min(...IDS.map(k => blocks[k].start)));
  h = h.replace(/<div class="page(?: active)?" id="page-[a-z]+">[\s\S]*$/, '');
  const pre = tpl.slice(0, Math.min(...IDS.map(k => blocks[k].start)));
  const post = tpl.slice(Math.max(...IDS.map(k => blocks[k].end)));
  let page = tpl.slice(blocks[id].start, blocks[id].end).replace(/^<div class="page(?: active)?"/, '<div class="page active"');
  let out = pre + page + post;
  // head metadata — static, in the raw HTML
  out = replaceOnce(out, /<title>[^<]*<\/title>/.exec(out)[0], `<title>${esc(s.title)}</title>`);
  out = out.replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(a['desc.content'])}" />`);
  out = replaceOnce(out, '<link rel="canonical" id="canonicalLink" />', `<link rel="canonical" id="canonicalLink" href="${abs}" />`);
  for (const [k, prop] of [['ogTitle', 'content'], ['ogDesc', 'content'], ['ogUrl', 'content'], ['twTitle', 'content'], ['twDesc', 'content']]) {
    out = out.replace(new RegExp(`(<meta [^>]*?)content="[^"]*"([^>]*id="${k}")`), (m0, p1, p2) => `${p1}content="${esc(a[k + '.' + prop])}"${p2}`);
  }
  out = replaceOnce(out, '<script type="application/ld+json" id="ldPage"></script>', `<script type="application/ld+json" id="ldPage">${a['ldPage.text']}</script>`);
  // active nav state in raw HTML
  out = out.replace(new RegExp(`<a data-page="${id}" href="${PAGE_PATH[id]}">`, 'g'), `<a data-page="${id}" href="${PAGE_PATH[id]}" class="on" aria-current="page">`);
  return sharedFixes(out);
}

/* ---------- 4. tool pages: clean canonicals, links and a crawlable site footer ---------- */
const TOOLS = { 'tools': 'tools.html', 'whatsapp-tool': 'whatsapp-tool.html', 'roi-calculator': 'roi-calculator.html' };
const TOOL_META = {
  'tools': { title: 'Free Business Tools for Growing Companies | Virtelon', desc: 'Free tools from Virtelon for growing businesses: a WhatsApp click-to-chat link and QR generator and a missed-lead cost calculator. No sign-up needed.' },
  'whatsapp-tool': { title: 'Free WhatsApp Link & QR Code Generator | Virtelon', desc: 'Create a free WhatsApp click-to-chat link and QR code for your business in seconds. Add it to your website, posters, cards or Instagram bio. No sign-up.' },
  'roi-calculator': { title: 'Missed-Lead Cost Calculator for Businesses | Virtelon', desc: 'Estimate how much revenue missed calls, unanswered DMs and slow replies cost your business each month, and what faster replies could recover. Free tool.' },
};
const SITE_LINKS = [['/solutions', 'Solutions'], ['/industries', 'Industries'], ['/products', 'Products'], ['/work', 'Work'], ['/company', 'About Virtelon'], ['/tools', 'Free Tools'], ['/start', 'Start a Project']];
const footNav = `<nav aria-label="Virtelon" style="display:flex;flex-wrap:wrap;justify-content:center;gap:6px 18px;margin:0 auto 10px;font-size:13px">${SITE_LINKS.map(([u, t]) => `<a href="${u}" style="color:inherit">${t}</a>`).join('')}</nav>`;
function buildTool(slug, file) {
  let h = read(file); const abs = ORIGIN + '/' + slug;
  const meta = TOOL_META[slug];
  const oldTitle = /<title>([^<]*)<\/title>/.exec(h)[1];
  h = h.split(`content="${oldTitle}"`).join(`content="${esc(meta.title)}"`).replace(`<title>${oldTitle}</title>`, `<title>${esc(meta.title)}</title>`);
  h = h.replace(/(<meta (?:name="description"|property="og:description"|name="twitter:description") content=")[^"]*"/g, `$1${esc(meta.desc)}"`);
  h = h.split(`${ORIGIN}/${file}`).join(abs);
  h = h.replace(/href="(?:\/)?(tools|whatsapp-tool|roi-calculator)\.html"/g, 'href="/$1"');
  h = h.replace(/href="index\.html#start"/g, 'href="/start"');
  h = replaceOnce(h, '<footer>', `<footer>${footNav}`, 'tool footer');
  // breadcrumb (visible navigation already: logo → tools → page)
  const crumbs = [{ '@type': 'ListItem', position: 1, name: 'Home', item: ORIGIN + '/' }];
  if (slug !== 'tools') crumbs.push({ '@type': 'ListItem', position: 2, name: 'Free Tools', item: ORIGIN + '/tools' });
  crumbs.push({ '@type': 'ListItem', position: crumbs.length + 1, name: /<h1>([\s\S]*?)<\/h1>/.exec(h)[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(), item: abs });
  h = replaceOnce(h, '</head>', `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs })}</script>\n</head>`, '</head>');
  return h;
}

/* ---------- 5. 404 page (real 404 status via .htaccess ErrorDocument) ---------- */
function build404() {
  let h = buildRoute('home');
  const st = h.indexOf('<div class="page active" id="page-home">'); const en = blockEnd(h, st);
  h = h.slice(0, st) + `<div class="page active" id="page-404"><section class="sec"><div class="wrap" style="min-height:60vh;display:flex;flex-direction:column;justify-content:center;gap:18px;padding-top:140px">
<span class="eyebrow">404 — Page not found</span><h1>This page doesn't exist.</h1>
<p style="color:var(--muted);max-width:560px">The link may be old or mistyped. Here is where you can go instead:</p>
<p style="display:flex;flex-wrap:wrap;gap:14px">${[['/', 'Home'], ...SITE_LINKS].map(([u, t]) => `<a class="lime" href="${u}">${t}</a>`).join('')}</p></div></section></div>` + h.slice(en);
  h = h.replace(/<title>[^<]*<\/title>/, '<title>Page not found | Virtelon</title>');
  h = h.replace('<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />', '<meta name="robots" content="noindex, follow" />');
  h = h.replace(/<link rel="canonical"[^>]*\/>/, '');
  h = h.replace(/<script type="application\/ld\+json" id="ldPage">[\s\S]*?<\/script>/, '');
  // the router must not rewrite the URL of a 404
  h = h.replace("let routerInitializing=true;\ngo(idFromLocation(),false);", 'let routerInitializing=true;');
  return h;
}

/* ---------- 6. write output ---------- */
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT);
const routes = [];
for (const id of IDS) {
  const file = id === 'home' ? 'index.html' : id + '.html';
  fs.writeFileSync(path.join(OUT, file), buildRoute(id)); routes.push(PAGE_PATH[id]);
}
for (const [slug, file] of Object.entries(TOOLS)) { fs.writeFileSync(path.join(OUT, slug + '.html'), buildTool(slug, file)); routes.push('/' + slug); }
fs.writeFileSync(path.join(OUT, '404.html'), build404());
fs.cpSync(path.join(ROOT, 'assets'), path.join(OUT, 'assets'), { recursive: true });
// Only publish team photos that the public team section actually uses.
fs.mkdirSync(path.join(OUT, 'team'));
for (const f of fs.readdirSync(path.join(ROOT, 'team'))) if (tpl.includes('/team/' + f)) fs.copyFileSync(path.join(ROOT, 'team', f), path.join(OUT, 'team', f));
for (const f of ['logo.png', 'site.webmanifest']) fs.copyFileSync(path.join(ROOT, f), path.join(OUT, f));
fs.copyFileSync(path.join(ROOT, 'scripts/hostinger.htaccess'), path.join(OUT, '.htaccess'));
fs.copyFileSync(path.join(ROOT, 'llms.txt'), path.join(OUT, 'llms.txt'));
// Google Search Console ownership file (URL-prefix property https://virtelon.com/) — must stay published.
fs.writeFileSync(path.join(OUT, 'google4fbb1a80e54bfb19.html'), 'google-site-verification: google4fbb1a80e54bfb19.html');
const prio = { '/': '1.0', '/solutions': '0.9', '/industries': '0.9', '/products': '0.9', '/work': '0.8', '/start': '0.8', '/company': '0.7', '/tools': '0.6', '/whatsapp-tool': '0.6', '/roi-calculator': '0.6' };
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map(r => `  <url><loc>${ORIGIN}${r}</loc><lastmod>${BUILD_DATE}</lastmod><priority>${prio[r]}</priority></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);
fs.writeFileSync(path.join(OUT, 'routes.json'), JSON.stringify(routes, null, 1));
console.log('built', routes.length, 'routes ->', OUT);
