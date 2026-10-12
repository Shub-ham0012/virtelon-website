import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { createHandler } from './api/contact.js';
const root = resolve(new URL('.', import.meta.url).pathname, 'dist');
const fixture = process.env.FORM_TEST_MODE;
const handler = createHandler(fixture ? {
  env: { WEB3FORMS_ACCESS_KEY: 'local-test-only' },
  fetcher: async () => { await new Promise(r => setTimeout(r, 700)); return { ok: fixture === 'success', json: async () => ({ success: fixture === 'success' }) }; }
} : {});
const types = { '.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png','.woff2':'font/woff2','.txt':'text/plain','.xml':'application/xml' };
http.createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  if (path === '/api/contact') {
    let size = 0; const chunks = [];
    for await (const chunk of req) { size += chunk.length; if (size > 12000) { res.writeHead(413); res.end('Too large'); return; } chunks.push(chunk); }
    req.body = Buffer.concat(chunks).toString();
    return handler(req,res);
  }
  const file = resolve(root, '.' + (path === '/' ? '/index.html' : path.includes('.') ? path : path + '.html'));
  try {
    if (!file.startsWith(root + '/')) throw new Error('not found');
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' }); res.end(data);
  } catch { res.writeHead(404, { 'Content-Type':'text/html; charset=utf-8' }); res.end(await readFile(resolve(root,'404.html'))); }
}).listen(Number(process.env.PORT || 4182), '127.0.0.1', () => console.log(`Virtelon preview http://127.0.0.1:${process.env.PORT || 4182} (form: ${fixture ? 'local '+fixture+' fixture; no email sent' : 'real provider or explicit unconfigured error'})`));
