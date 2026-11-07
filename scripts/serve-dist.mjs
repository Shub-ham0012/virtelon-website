// Local server that mirrors scripts/hostinger.htaccess (clean URLs, one-hop 301s, real 404). For QA only.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const DIR = path.resolve(process.argv[2] || 'hostinger-dist'); const PORT = +(process.argv[3] || 4310);
const ROUTES = ['solutions','industries','products','work','company','start','tools','whatsapp-tool','roi-calculator'];
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };
const send = (res, code, file) => { res.writeHead(code, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' }); res.end(fs.readFileSync(file)); };
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x'); let p = decodeURIComponent(u.pathname);
  if (p === '/index.html') { res.writeHead(301, { Location: '/' }); return res.end(); }
  let m = /^\/([a-z-]+)\.html$/.exec(p); if (m && ROUTES.includes(m[1])) { res.writeHead(301, { Location: '/' + m[1] }); return res.end(); }
  m = /^\/([a-z-]+)\/+$/.exec(p); if (m && ROUTES.includes(m[1])) { res.writeHead(301, { Location: '/' + m[1] }); return res.end(); }
  if (p === '/') return send(res, 200, path.join(DIR, 'index.html'));
  if (ROUTES.includes(p.slice(1))) return send(res, 200, path.join(DIR, p.slice(1) + '.html'));
  const f = path.join(DIR, p); if (f.startsWith(DIR) && fs.existsSync(f) && fs.statSync(f).isFile() && !/^\/(404\.html|routes\.json|\.htaccess)$/.test(p)) return send(res, 200, f);
  send(res, 404, path.join(DIR, '404.html'));
}).listen(PORT, () => console.log('serving', DIR, 'on', PORT));
