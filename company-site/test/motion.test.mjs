import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const timelineSource = await readFile(new URL('../public/motion-timeline.js', import.meta.url), 'utf8');
const introSource = await readFile(new URL('../public/intro.js', import.meta.url), 'utf8');
const context = vm.createContext({}); vm.runInContext(timelineSource, context);
const timeline = context.VirtelonMotion;
test('deterministic 5.2-second arc: signal → scattered → connected → identity → moving → settled', () => {
  for (const [time, phase] of [[0,'signal'],[650,'scattered'],[2450,'connected'],[3300,'identity'],[4100,'moving'],[5200,'settled']]) assert.equal(timeline.sample(time).phase, phase);
  let previous = 0;
  for (let t = -100; t <= 6000; t += 10) {
    const state = timeline.sample(t);
    for (const key of ['appear','connect','identity','reveal']) assert.ok(state[key] >= 0 && state[key] <= 1, key);
    assert.ok(state.reveal >= previous); previous = state.reveal;
  }
});
test('reduced motion is immediately settled; work is gated by visibility and completion', () => {
  assert.equal(timeline.sample(0, true).done, true);
  assert.equal(timeline.sample(0, true).reveal, 1);
  const state = { reduced:false, hidden:false, visible:true, done:false };
  assert.equal(timeline.shouldRun(state), true);
  for (const [key,value] of [['reduced',true],['hidden',true],['visible',false],['done',true]]) assert.equal(timeline.shouldRun({...state,[key]:value}), false);
});
test('canvas pixel ratio capped at two, with responsive dimensions', () => {
  for (const width of [320,390,768,1024,1440]) {
    const result = timeline.resolution(width, 680, 4);
    assert.equal(result.width, width * 2); assert.equal(result.height, 1360); assert.equal(result.dpr, 2);
  }
});

// Minimal environment exercises the real controller, not just string assertions.
function mount({ reduced = false, seen = false, storageFails = false, noCanvas = false } = {}) {
  let clock = 0, nextId = 0; const scheduled = new Map(); const saved = new Map(seen ? [['virtelon-connection-v1','seen']] : []);
  const events = () => ({ listeners:{}, addEventListener(type, fn){this.listeners[type] = fn;}, emit(type, event = {}){this.listeners[type]?.(event);} });
  const style = { setProperty(){}, removeProperty(){}, opacity:'0' };
  const classSet = new Set();
  const skip = {...events(),hidden:true,focus(){doc.activeElement=this;}};
  const replay = {...events(),hidden:true};
  const link = {focus(){doc.activeElement=this;},closest(){return true;}};
  const ctx = Object.fromEntries(['clearRect','setTransform','beginPath','arc','fill','fillRect','moveTo','lineTo','stroke','fillText'].map(name=>[name,()=>{}]));
  const canvas = {getContext:()=>noCanvas ? null : ctx};
  const identity = {style:{}};
  const hero = {...events(),dataset:{motion:'settled'},style,classList:{add:x=>classSet.add(x),remove:x=>classSet.delete(x)},getBoundingClientRect:()=>({width:1238,height:680,left:100,top:108}),querySelector(selector){return {'canvas':canvas,'.motion-control':skip,'.motion-replay':replay,'.opening-identity':identity,'.hero-message a':link}[selector];}};
  const doc = {...events(),hidden:false,activeElement:null,querySelector:()=>hero};
  const win = events(); const media = {...events(),matches:reduced};
  const observers = {};
  const sandbox = vm.createContext({ document:doc,window:win,matchMedia:()=>media,location:{hash:''},performance:{now:()=>clock},devicePixelRatio:3,sessionStorage:{getItem:key=>{if(storageFails)throw Error('denied');return saved.get(key);},setItem:(key,val)=>{if(storageFails)throw Error('denied');saved.set(key,val);}},requestAnimationFrame:fn=>{const id=++nextId;scheduled.set(id,fn);return id;},cancelAnimationFrame:id=>scheduled.delete(id),IntersectionObserver:class{constructor(fn){observers.intersection=fn;}observe(){}disconnect(){}},ResizeObserver:class{constructor(fn){observers.resize=fn;}observe(){}disconnect(){}} });
  vm.runInContext(timelineSource,sandbox); vm.runInContext(introSource,sandbox);
  return {hero,doc,win,media,skip,replay,link,scheduled,observers,classSet,saved,step(delta=16.67){clock+=delta;const tasks=[...scheduled.values()];scheduled.clear();tasks.forEach(fn=>fn(clock));}};
}
test('real controller completes and stops scheduling; ordinary returns do not replay', () => {
  const app=mount(); assert.equal(app.scheduled.size,1); assert.equal(app.skip.hidden,false);
  for(let i=0;i<330;i++)app.step();
  assert.equal(app.hero.dataset.motion,'settled'); assert.equal(app.scheduled.size,0); assert.equal(app.replay.hidden,false); assert.equal(app.classSet.size,0);
  assert.equal(app.saved.get('virtelon-connection-v1'),'seen');
  assert.equal(mount({seen:true}).scheduled.size,0);
});
test('Skip and Escape finish immediately, with visible CTA focus', () => {
  for(const action of ['skip','escape']){const app=mount();app.doc.activeElement=app.skip; if(action==='skip')app.skip.emit('click');else app.doc.emit('keydown',{key:'Escape'});assert.equal(app.scheduled.size,0);assert.equal(app.doc.activeElement,app.link);assert.equal(app.skip.hidden,true);}
});
test('offscreen and hidden tabs stop RAF and resume without time jumps', () => {
  const app=mount();app.step();app.step();
  app.observers.intersection([{isIntersecting:false}]);assert.equal(app.scheduled.size,0);app.step(10000);
  app.observers.intersection([{isIntersecting:true}]);assert.equal(app.scheduled.size,1);app.step();assert.equal(app.hero.dataset.motion,'signal');
  app.doc.hidden=true;app.doc.emit('visibilitychange');assert.equal(app.scheduled.size,0);
  app.doc.hidden=false;app.doc.emit('visibilitychange');assert.equal(app.scheduled.size,1);
});
test('reduced motion starts static and changing preference stops an active intro', () => {
  const staticApp=mount({reduced:true});assert.equal(staticApp.scheduled.size,0);assert.equal(staticApp.replay.hidden,true);
  const app=mount();app.media.matches=true;app.media.emit('change');assert.equal(app.scheduled.size,0);assert.equal(app.hero.dataset.motion,'settled');
});
test('keyboard entry into hero content reveals it, storage denial is safe, missing canvas leaves HTML', () => {
  const app=mount({storageFails:true});app.hero.emit('focusin',{target:app.link});assert.equal(app.scheduled.size,0);assert.equal(app.hero.dataset.motion,'settled');
  assert.equal(mount({noCanvas:true}).scheduled.size,0);
});
test('replay is explicit and page exit cancels outstanding work', () => {
  const app=mount({seen:true});app.replay.emit('click');assert.equal(app.scheduled.size,1);assert.equal(app.doc.activeElement,app.skip);
  app.win.emit('pagehide');assert.equal(app.scheduled.size,0);
});
test('all pages use the canonical sheet; homepage retains real HTML and accessible controls', async () => {
  for(const route of ['index','services','products','resort-crm','about','contact']){
    const html=await readFile(new URL(`../dist/${route}.html`,import.meta.url),'utf8');
    assert.ok(html.includes('/brand.css'));assert.ok(html.includes('manrope-latin.woff2'));assert.ok(!html.includes('bricolage'));
    if(route==='index'){assert.ok(html.includes('Your business<br>is moving.'));assert.ok(html.includes('AI automation and digital products'));assert.ok(html.includes('aria-hidden="true"></canvas>'));assert.ok(html.includes('Skip opening'));}
    else assert.ok(!html.includes('/intro.js'));
  }
});
