import assert from 'node:assert/strict';
const base=(process.argv[2]||'https://virtelon-dark-production.vercel.app').replace(/\/$/,'');
const resources=new Set(['/robots.txt','/sitemap.xml','/assets/favicon.png','/assets/apple-touch-icon.png','/assets/social-card.png']);
for(const path of ['/','/services','/products','/resort-crm','/about','/contact']){
 const response=await fetch(base+path);assert.equal(response.status,200,path);const html=await response.text();
 assert.ok(html.includes('rel="canonical"'),path);assert.ok(html.includes('name="twitter:card"'),path);assert.ok(html.includes('property="og:image"'),path);assert.ok(html.includes('noindex, follow'),path);
 for(const [,href] of html.matchAll(/(?:href|src)="([^"]+)"/g))if(href.startsWith('/'))resources.add(href.split(/[?#]/)[0]);
 console.log(JSON.stringify({path,status:response.status,bytes:Buffer.byteLength(html),csp:!!response.headers.get('content-security-policy')}));
}
const css=await (await fetch(base+'/styles.css')).text();
for(const [,font] of css.matchAll(/url\('([^']+)'\)/g))resources.add('/'+font);
for(const path of resources){const r=await fetch(base+path);assert.equal(r.status,200,path);await r.arrayBuffer();}
const missing=await fetch(base+'/this-page-does-not-exist');assert.equal(missing.status,404);assert.ok((await missing.text()).includes('A wrong turn.'));
const get=await fetch(base+'/api/contact',{headers:{Accept:'application/json'}});assert.equal(get.status,405);
const post=await fetch(base+'/api/contact',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json',Origin:base},body:JSON.stringify({name:'Deployment QA',email:'qa@example.invalid',company:'Synthetic test',interest:'project',consent:'yes',website:'',message:'Synthetic deployment check. This must return the honest unconfigured state.'})});
assert.equal(post.status,503);assert.equal((await post.json()).ok,false);
const cross=await fetch(base+'/api/contact',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json',Origin:'https://example.invalid'},body:'{}'});assert.equal(cross.status,403);
console.log(JSON.stringify({assetsAndLinks:resources.size,custom404:404,apiGet:405,apiUnconfigured:503,crossOrigin:403,result:'pass'}));
