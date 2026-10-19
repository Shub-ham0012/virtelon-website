// One-time, reproducible content import from the owner-provided current site.
// Does not alter the original website. Generated JSON is the retained source.
import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
const root = new URL('../../', import.meta.url);
const output = new URL('../', import.meta.url);
const source = await readFile(new URL('index.html', root), 'utf8');
const clean = html => (html || '').replace(/<svg[\s\S]*?<\/svg>/g,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().replaceAll('&amp;','&').replaceAll('&nbsp;',' ');
function divs(html, cls) {
  const result=[]; const tags=[...html.matchAll(/<div\b[^>]*>|<\/div>/g)];
  for(let i=0;i<tags.length;i++){
    const classes=tags[i][0].match(/class="([^"]*)"/)?.[1].split(/\s+/)||[];
    if(!classes.includes(cls))continue;
    let depth=1,j=i+1;for(;j<tags.length;j++){depth+=tags[j][0].startsWith('</')?-1:1;if(!depth)break;}
    result.push(html.slice(tags[i].index+tags[i][0].length,tags[j].index));i=j;
  }return result;
}
const page=id=>source.split(`id="page-${id}">`)[1].split('<!-- ============================')[0];
const heading=(html,tag='h3')=>clean(html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))?.[1]);
const paragraphs=html=>[...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map(m=>clean(m[1]));
const data={
  provenance:{source:'../index.html and related owner-provided root files',live:'https://virtelon.com',imported:'2026-10-19',note:'Descriptions retained; decorative mock UI and synthetic metrics are not imported.'},
  solutions:divs(page('solutions'),'solb').map(html=>({title:clean(divs(html,'no')[0]).replace(/^\d+ — /,''),headline:heading(html),description:paragraphs(html)[0],items:divs(html,'sol-list')[0].split(/<div>|<\/div>/).map(clean).filter(Boolean)})),
  industries:divs(page('industries'),'indrow').map((html,i)=>({title:heading(html),description:clean(divs(html,'prob')[0]),items:divs(html,'bd').map(clean),group:i<6?'Local businesses':'Growing businesses & operations'})),
  work:divs(page('work'),'pcase').map(html=>({title:heading(html),category:clean(divs(html,'ptag')[0]),blocks:divs(html,'pblk').map(b=>({label:clean(divs(b,'l')[0]),text:clean(divs(b,'t')[0])})),stack:clean(divs(html,'pstack')[0]),status:clean(divs(html,'pbadge')[0])})),
  offers:divs(page('products'),'tier').map(html=>({title:heading(html),category:clean(divs(html,'tg')[0]),description:clean(divs(html,'who')[0]),items:[...html.matchAll(/<li>(.*?)<\/li>/g)].map(m=>clean(m[1])),timeline:clean(divs(html,'price')[0]),group:html.includes('Typical build')?'Ready-to-quote offers':'Productized starting points'})),
  about:{intro:paragraphs(page('company'))[0],story:paragraphs(divs(page('company'),'story')[0]),facts:divs(divs(page('company'),'storyfacts')[0],'f').map(h=>({label:clean(divs(h,'k')[0]),value:clean(divs(h,'v')[0])})),team:divs(page('company'),'founder').map(h=>({name:heading(h,'h4'),role:clean(divs(h,'role')[0]),bio:paragraphs(h)[0],photo:h.match(/src="([^"]+)"/)[1],linkedin:h.match(/href="(https:\/\/www.linkedin.com[^"]+)"/)[1]})),principles:divs(page('company'),'why').map(h=>({title:heading(h,'h4'),description:paragraphs(h)[0]}))}
};
if(data.industries.length!==11||data.offers.length!==10||data.work.length!==5||data.about.team.length!==3)throw Error('Current-site extraction is incomplete');
await writeFile(new URL('src/current-content.json',output),JSON.stringify(data,null,2)+'\n');
await mkdir(new URL('public/team/',output),{recursive:true});
await cp(new URL('team/',root),new URL('public/team/',output),{recursive:true});
const whatsapp=await readFile(new URL('whatsapp-tool.html',root),'utf8');
const qr=[...whatsapp.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('var qrcode = function()'));
if(!qr)throw Error('Original QR generator not found');
await mkdir(new URL('public/vendor/',output),{recursive:true});
await writeFile(new URL('public/vendor/qrcode.js',output),qr);
console.log(JSON.stringify({solutions:data.solutions.length,industries:data.industries.length,work:data.work.length,offers:data.offers.length,team:data.about.team.length}));
