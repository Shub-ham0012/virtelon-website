import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
const root=resolve(new URL('../dist/',import.meta.url).pathname);
const pages=['index','services','products','resort-crm','about','contact','404'];
const titles=new Set();
for(const page of pages) test(`${page}: metadata, assets, links and fragments`,async()=>{
 const html=await readFile(resolve(root,page+'.html'),'utf8');
 const title=html.match(/<title>(.*?)<\/title>/)?.[1];assert.ok(title);assert.ok(!titles.has(title));titles.add(title);
 assert.equal((html.match(/<h1[\s>]/g)||[]).length,1);
 for(const tag of ['name="description"','rel="canonical"','property="og:title"','property="og:image"','name="twitter:card"','rel="icon"'])assert.ok(html.includes(tag),tag);
 for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)){
   const href=match[1]; if(href.startsWith('mailto:')||href.startsWith('http'))continue;
   const url=new URL(href,'https://site.test/'+(page==='index'?'':page));
   const path=url.pathname;const target=path==='/'?'index.html':path.includes('.')?path.slice(1):path.slice(1)+'.html';
   assert.ok((await stat(resolve(root,target))).isFile(),href);
   if(url.hash){const body=await readFile(resolve(root,target),'utf8');assert.ok(body.includes(`id="${url.hash.slice(1)}"`),href)}
 }
 for(const match of html.matchAll(/<img\b[^>]*>/g))for(const attr of ['alt=','width=','height='])assert.ok(match[0].includes(attr),attr);
});
test('crawl files and no client credentials',async()=>{assert.ok((await readFile(resolve(root,'sitemap.xml'),'utf8')).includes('/resort-crm'));assert.ok((await readFile(resolve(root,'robots.txt'),'utf8')).includes('Sitemap:'));assert.ok(!(await readFile(resolve(root,'contact.js'),'utf8')).includes('access_key'));});
