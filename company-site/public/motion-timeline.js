/* Deterministic choreography, no random values and no perpetual animation. */
globalThis.VirtelonMotion = Object.freeze({
  duration: 5050,
  clamp: value => Math.max(0, Math.min(1, value)),
  ease(value) { const t=this.clamp(value); return t*t*t*(t*(t*6-15)+10); },
  sample(elapsed, reduced=false) {
    const t=reduced?this.duration:Math.max(0,elapsed);
    return {
      phase:t<700?'scan':t<2000?'fragments':t<3000?'mark':t<4100?'system':t<this.duration?'handoff':'settled',
      scan:this.clamp(t/650), expose:this.ease(t/500)*(1-this.ease((t-1600)/500)),
      assemble:this.ease((t-700)/1500), sheen:this.clamp((t-2300)/650),
      rails:this.ease((t-3000)/480)*(1-this.ease((t-4100)/450)), pulse:this.clamp((t-3450)/650),
      word:this.ease((t-3400)/600), handoff:this.ease((t-4100)/950), reveal:this.ease((t-4150)/850), done:t>=this.duration
    };
  },
  fragment(index, elapsed, compact=false) {
    const delay=(index%4)*28+Math.floor(index/4)*20;
    const progress=this.ease((elapsed-650-delay)/(compact?1350:1450));
    const col=index%4,row=Math.floor(index/4),distance=compact?54:110;
    const x=(col-1.5)*distance*(1-progress)+Math.sin(progress*Math.PI)*(row%2?1:-1)*(compact?14:28);
    const y=(row-1.5)*distance*(1-progress)-Math.sin(progress*Math.PI)*(compact?18:42);
    return {x,y,scale:1+(1-progress)*(index%2?.06:-.06),opacity:this.ease((elapsed-130-index*15)/500)};
  },
  shouldRun({reduced,hidden,visible,done}) {return !reduced&&!hidden&&visible&&!done;}
});
