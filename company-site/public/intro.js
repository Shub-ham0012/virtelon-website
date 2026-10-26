(() => {
  'use strict';
  const hero=document.querySelector('.motion-hero'), motion=globalThis.VirtelonMotion;
  if(!hero||!motion||typeof IntersectionObserver!=='function'||typeof ResizeObserver!=='function')return;
  const scene=hero.querySelector('.opening-scene'), stage=hero.querySelector('.motion-stage');
  const fragments=[...hero.querySelectorAll('.mark-fragment')];
  if(fragments.length!==16)return;
  const word=hero.querySelector('.opening-wordmark'), rails=hero.querySelector('.operating-rails');
  const scan=hero.querySelector('.scan-cue'), studio=hero.querySelector('.studio-fragments');
  const sheen=hero.querySelector('.metal-travel'), pulse=hero.querySelector('.system-pulse');
  const skip=hero.querySelector('.motion-control'), replay=hero.querySelector('.motion-replay');
  const markTarget=document.querySelector('.site-header .brand img'), wordTarget=document.querySelector('.site-header .brand span');
  const media=matchMedia('(prefers-reduced-motion: reduce)'), key='virtelon-fragments-v2';
  let seen=false;try{seen=sessionStorage.getItem(key)==='seen';}catch{/* Optional storage. */}
  let done=true,visible=true,raf=0,previous=null,elapsed=0,geometry=null;
  let pointerX=0,pointerY=0,px=0,py=0,frames=0,total=0,max=0;
  const remember=()=>{try{sessionStorage.setItem(key,'seen');}catch{}};
  function cancel(){cancelAnimationFrame(raf);raf=0;previous=null;}
  function finish(focus=false){
    done=true;cancel();hero.dataset.motion='settled';hero.classList.remove('intro-playing');document.documentElement.classList.remove('intro-active');
    hero.style.removeProperty('--reveal');scene.hidden=true;
    const wasFocused=document.activeElement===skip;skip.hidden=true;replay.hidden=media.matches;remember();
    if(focus||wasFocused)hero.querySelector('.hero-message a').focus({preventScroll:true});
    hero.dataset.motionFrames=String(frames);hero.dataset.motionMeanMs=frames?(total/frames).toFixed(3):'0';hero.dataset.motionMaxMs=max.toFixed(3);
  }
  function measure(){
    // Layout reads are confined to startup/resize, never the frame loop.
    const h=hero.getBoundingClientRect(),a=markTarget.getBoundingClientRect(),b=wordTarget.getBoundingClientRect();
    const compact=h.width<650,w=stage.offsetWidth;
    geometry={left:h.left,top:h.top,width:h.width,height:h.height,compact,
      markX:a.left+a.width/2-h.left-h.width*.5,markY:a.top+a.height/2-h.top-h.height*.30,markScale:a.width/w,
      wordX:b.left-h.left,wordY:b.top-h.top-word.offsetTop,wordScale:b.width/word.offsetWidth};
  }
  function render(state){
    if(!geometry)return;
    const g=geometry,h=state.handoff;
    px+=(pointerX-px)*.08;py+=(pointerY-py)*.08;
    fragments.forEach((node,i)=>{const f=motion.fragment(i,elapsed,g.compact);node.style.transform=`translate3d(${f.x}px,${f.y}px,0) scale(${f.scale})`;node.style.opacity=String(f.opacity);});
    const lock=motion.ease((elapsed-3000)/550),scale=(1-lock*.35)*(1-h)+g.markScale*h;
    stage.style.transform=`translate3d(calc(-50% + ${g.markX*h+px*4*(1-h)}px),calc(-50% + ${g.markY*h-lock*24*(1-h)+py*3*(1-h)}px),0) scale(${scale})`;
    sheen.style.transform=`translateX(${state.sheen*340-20+px*4}px)`;sheen.style.opacity=state.sheen>0&&state.sheen<1?'.18':'0';
    scan.style.transform=`translate3d(${state.scan*g.width}px,0,0)`;scan.style.opacity=state.scan<1?'1':'0';
    studio.style.opacity=String(state.expose);studio.style.transform=`translate3d(${px*6}px,${py*4}px,0)`;
    rails.style.opacity=String(state.rails);rails.style.transform=`translate3d(0,${(1-state.rails)*18}px,0)`;
    pulse.style.transform=`translate3d(${state.pulse*(g.width-28)}px,0,0) scaleX(${state.pulse<1?1:0})`;
    word.style.opacity=String(state.word);word.style.transform=`translate3d(${g.wordX*h}px,${g.wordY*h}px,0) scale(${1+(g.wordScale-1)*h})`;
    word.style.clipPath=`inset(0 ${(1-state.word)*100}% 0 0)`;
    hero.style.setProperty('--reveal',String(state.reveal));hero.dataset.motion=state.phase;
  }
  function tick(now){
    raf=0;if(!motion.shouldRun({reduced:media.matches,hidden:document.hidden,visible,done})){previous=null;return;}
    if(previous!==null)elapsed+=Math.min(now-previous,50);previous=now;
    const start=performance.now(),state=motion.sample(elapsed);
    try{render(state);}catch{finish();return;}
    const work=performance.now()-start;frames++;total+=work;max=Math.max(max,work);
    if(state.done)finish();else raf=requestAnimationFrame(tick);
  }
  function resume(){if(!raf&&motion.shouldRun({reduced:media.matches,hidden:document.hidden,visible,done}))raf=requestAnimationFrame(tick);}
  function start(){
    if(media.matches){finish();return;}
    cancel();elapsed=0;frames=0;total=0;max=0;done=false;px=py=pointerX=pointerY=0;
    scene.hidden=false;hero.classList.add('intro-playing');document.documentElement.classList.add('intro-active');hero.dataset.motion='scan';
    hero.style.setProperty('--reveal','0');skip.hidden=false;replay.hidden=true;measure();render(motion.sample(0));remember();resume();
  }
  skip.addEventListener('click',()=>finish(true));
  replay.addEventListener('click',()=>{
    window.scrollTo({top:0,left:0,behavior:'instant'});
    start();skip.focus({preventScroll:true});
  });
  document.addEventListener('keydown',event=>{if(!done&&event.key==='Escape')finish(document.activeElement===skip);});
  hero.addEventListener('focusin',event=>{if(!done&&event.target.closest('.hero-message'))finish();});
  hero.addEventListener('pointermove',event=>{if(!done&&geometry&&event.pointerType!=='touch'){pointerX=motion.clamp((event.clientX-geometry.left)/geometry.width)*2-1;pointerY=motion.clamp((event.clientY-geometry.top)/geometry.height)*2-1;}},{passive:true});
  hero.addEventListener('pointerleave',()=>{pointerX=pointerY=0;});
  window.addEventListener('scroll',()=>{if(!done&&window.scrollY>80)finish();},{passive:true});
  document.addEventListener('visibilitychange',()=>document.hidden?cancel():resume());
  media.addEventListener('change',()=>{if(media.matches)finish();else replay.hidden=false;});
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;visible?resume():cancel();});observer.observe(hero);
  const sizing=new ResizeObserver(()=>{if(!done)measure();});sizing.observe(hero);
  window.addEventListener('pagehide',()=>{cancel();observer.disconnect();sizing.disconnect();},{once:true});
  window.addEventListener('pageshow',event=>{if(event.persisted)finish();});
  if(!seen&&!media.matches&&!location.hash)start();else finish();
})();
