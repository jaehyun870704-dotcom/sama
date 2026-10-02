import {placeThemes,familyMotifs,classFamily,midiToHz,degree,type Place,type Lead,type Family} from './music.ts';
import type {Unit} from '../../core/src/index.ts';

export type Cue='select'|'move'|'attack'|'magic'|'turn'|'victory'|'defeat'|'breach'|'repair';
/** Original procedural score and effects. Every voice is synthesized with Web Audio
 * oscillators, filters and generated noise: no downloaded recordings or samples.
 * Places choose mode, tempo and instruments; the selected troop family adds a motif. */
export class Soundscape {
  private ctx:AudioContext|undefined;
  private master:GainNode|undefined;
  private music:GainNode|undefined;
  private effects:GainNode|undefined;
  private reverb:GainNode|undefined;
  private noise:AudioBuffer|undefined;
  private timer:ReturnType<typeof setInterval>|undefined;
  private beat=0;
  private next=0;
  enabled=true;
  musicVolume=.38;
  effectsVolume=.65;
  combat=false;
  scene:'camp'|'battle'|'crisis'|'result'|'dream'='camp';
  /** Where the battle happens; picks the theme. */
  place:Place='camp';
  /** Troop family of the unit currently commanding attention. */
  focus:Family|undefined;
  async start(){
    try{
      if(!this.ctx){
        const ctx=this.ctx=new AudioContext();this.master=ctx.createGain();this.master.connect(ctx.destination);
        const compressor=ctx.createDynamicsCompressor();compressor.threshold.value=-18;compressor.ratio.value=4;compressor.connect(this.master);
        this.music=ctx.createGain();this.effects=ctx.createGain();this.music.connect(compressor);this.effects.connect(compressor);
        // A short feedback delay stands in for hall reverb.
        this.reverb=ctx.createGain();this.reverb.gain.value=.22;const delay=ctx.createDelay(1);delay.delayTime.value=.23;const feedback=ctx.createGain();feedback.gain.value=.38;const tone=ctx.createBiquadFilter();tone.type='lowpass';tone.frequency.value=2400;
        this.reverb.connect(delay);delay.connect(tone);tone.connect(feedback);feedback.connect(delay);tone.connect(compressor);
        this.noise=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);const data=this.noise.getChannelData(0);let seed=7;for(let i=0;i<data.length;i++){seed=(seed*16807)%2147483647;data[i]=seed/1073741823.5-1;}
        this.next=ctx.currentTime+.1;
        this.timer=setInterval(()=>this.schedule(),100);
      }
      this.update(); if(this.enabled)await this.ctx.resume();
    }catch{this.enabled=false;}
  }
  update(){
    if(!this.ctx)return;
    this.master?.gain.setTargetAtTime(this.enabled?.7:0,this.ctx.currentTime,.08);
    this.music?.gain.setTargetAtTime(this.musicVolume,this.ctx.currentTime,.1);
    this.effects?.gain.setTargetAtTime(this.effectsVolume,this.ctx.currentTime,.1);
  }
  async visibility(hidden:boolean){if(!this.ctx)return;if(hidden)await this.ctx.suspend();else if(this.enabled){await this.ctx.resume();this.next=this.ctx.currentTime+.1;}}

  // ---- voices -------------------------------------------------------------
  private env(t:number,attack:number,d:number,v:number){const g=this.ctx!.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,v),t+attack);g.gain.exponentialRampToValueAtTime(.0001,t+d);return g;}
  private out(node:AudioNode,bus:AudioNode,wet=0){node.connect(bus);if(wet&&this.reverb){const send=this.ctx!.createGain();send.gain.value=wet;node.connect(send);send.connect(this.reverb);}}
  private osc(type:OscillatorType,f:number,t:number,d:number){const o=this.ctx!.createOscillator();o.type=type;o.frequency.setValueAtTime(f,t);o.start(t);o.stop(t+d+.05);return o;}
  private vibrato(o:OscillatorNode,t:number,d:number,rate=5.2,depth=4){const l=this.osc('sine',rate,t,d),g=this.ctx!.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(depth,t+Math.min(.35,d*.5));l.connect(g);g.connect(o.frequency);}
  private noiseBurst(t:number,d:number,v:number,filter:BiquadFilterType,f:number,q=1,bus=this.effects,sweepTo?:number){
    if(!this.ctx||!this.noise||!bus)return;const src=this.ctx.createBufferSource();src.buffer=this.noise;src.loop=true;
    const bq=this.ctx.createBiquadFilter();bq.type=filter;bq.frequency.setValueAtTime(f,t);bq.Q.value=q;if(sweepTo)bq.frequency.exponentialRampToValueAtTime(sweepTo,t+d);
    const g=this.env(t,Math.min(.02,d*.2),d,v);src.connect(bq);bq.connect(g);this.out(g,bus,.1);src.start(t,Math.random()*1.5);src.stop(t+d+.05);
  }
  /** Plucked silk string (zheng/pipa): bright sawtooth closing through a lowpass. */
  private pluck(f:number,t:number,v:number,bus=this.music,d=1.4,bright=3600){
    if(!this.ctx||!bus)return;const o=this.osc('sawtooth',f,t,d),o2=this.osc('triangle',f*2.003,t,d*.5),lp=this.ctx.createBiquadFilter();lp.type='lowpass';lp.Q.value=4;
    lp.frequency.setValueAtTime(bright,t);lp.frequency.exponentialRampToValueAtTime(Math.max(220,f*1.4),t+d*.6);
    const g=this.env(t,.004,d,v),g2=this.env(t,.003,d*.4,v*.3);o.connect(lp);lp.connect(g);o2.connect(g2);this.out(g,bus,.35);this.out(g2,bus,.2);
  }
  /** Bamboo flute: sine with delayed vibrato and a breath of filtered noise. */
  private flute(f:number,t:number,d:number,v:number,bus=this.music){
    if(!this.ctx||!bus)return;const o=this.osc('sine',f,t,d),o3=this.osc('sine',f*3,t,d);this.vibrato(o,t,d,5.4,f*.012);
    const g=this.env(t,.08,d,v),g3=this.env(t,.1,d*.7,v*.08);o.connect(g);o3.connect(g3);this.out(g,bus,.45);this.out(g3,bus,.2);this.noiseBurst(t,.18,v*.25,'bandpass',f*2,6,bus);
  }
  /** Two-string fiddle (erhu): bowed sawtooth with slow attack and wide vibrato. */
  private erhu(f:number,t:number,d:number,v:number,bus=this.music){
    if(!this.ctx||!bus)return;const o=this.osc('sawtooth',f,t,d),bp=this.ctx.createBiquadFilter();bp.type='lowpass';bp.frequency.value=Math.min(3200,f*5);bp.Q.value=2;
    o.frequency.setValueAtTime(f*.97,t);o.frequency.linearRampToValueAtTime(f,t+.09);this.vibrato(o,t,d,6,f*.018);
    const g=this.env(t,.16,d,v*.7);o.connect(bp);bp.connect(g);this.out(g,bus,.4);
  }
  /** Brass-like war horn. */
  private horn(f:number,t:number,d:number,v:number,bus=this.music){
    if(!this.ctx||!bus)return;const o=this.osc('sawtooth',f,t,d),o2=this.osc('square',f/2,t,d),lp=this.ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(300,t);lp.frequency.linearRampToValueAtTime(1300,t+.18);lp.frequency.linearRampToValueAtTime(700,t+d);
    const g=this.env(t,.12,d,v*.55);o.connect(lp);o2.connect(lp);lp.connect(g);this.out(g,bus,.3);
  }
  /** Bronze bell (bianzhong): inharmonic partials. */
  private bell(f:number,t:number,v:number,bus=this.music,d=2.6){
    if(!this.ctx||!bus)return;for(const [r,a] of [[1,1],[2.76,.45],[5.4,.22],[8.9,.1]] as const){if(f*r>this.ctx.sampleRate*.45)continue;const o=this.osc('sine',f*r,t,d/r**.3),g=this.env(t,.003,d/r**.3,v*a);o.connect(g);this.out(g,bus,.5);}
  }
  private voice(lead:Lead,f:number,t:number,d:number,v:number,bus=this.music){
    if(lead==='zheng')this.pluck(f,t,v,bus,d);else if(lead==='pipa'){this.pluck(f,t,v*.8,bus,d*.5,5200);this.pluck(f,t+.06,v*.5,bus,d*.4,5200);}
    else if(lead==='flute')this.flute(f,t,d,v,bus);else if(lead==='erhu')this.erhu(f,t,d,v,bus);else if(lead==='horn')this.horn(f,t,d,v,bus);else this.bell(f,t,v,bus,d);
  }
  private drum(t:number,heavy=false,v=.2,bus=this.music){
    if(!this.ctx||!bus)return;const o=this.osc('sine',heavy?110:170,t,.6);o.frequency.exponentialRampToValueAtTime(heavy?38:52,t+.25);
    const g=this.env(t,.003,heavy?.6:.35,v);o.connect(g);this.out(g,bus,.15);this.noiseBurst(t,.08,v*.5,'lowpass',heavy?900:1600,1,bus);
  }
  private block(t:number,v=.08,f=880,bus=this.music){if(!this.ctx||!bus)return;const o=this.osc('sine',f,t,.08),g=this.env(t,.001,.08,v);o.connect(g);this.out(g,bus,.1);this.noiseBurst(t,.03,v*.6,'bandpass',f*2,8,bus);}
  private gong(t:number,v=.12,bus=this.music,f=98){
    if(!this.ctx||!bus)return;for(const r of [1,1.47,2.09,2.56,3.2]){const o=this.osc('sine',f*r,t,4),g=this.env(t,.02+r*.03,4/r**.4,v/r);o.connect(g);this.out(g,bus,.4);}this.noiseBurst(t,1.6,v*.25,'bandpass',600,1.5,bus);
  }
  private pad(kind:'drone'|'water'|'wind'|'gong',root:number,t:number,len:number){
    if(!this.ctx||!this.music)return;
    if(kind==='water'){this.noiseBurst(t,len,.035,'lowpass',380,1,this.music,900);this.pluck(midiToHz(root-12),t,.03,this.music,len,700);}
    else if(kind==='wind')this.noiseBurst(t,len,.03,'bandpass',500,2,this.music,1200);
    else if(kind==='gong')this.gong(t,.06,this.music,midiToHz(root-24));
    for(const m of [root-24,root-17]){const o=this.osc('triangle',midiToHz(m),t,len),g=this.env(t,len*.3,len,.035);o.connect(g);this.out(g,this.music,.2);}
  }

  // ---- score --------------------------------------------------------------
  private schedule(){
    if(!this.ctx||this.ctx.state!=='running')return;
    if(this.next<this.ctx.currentTime)this.next=this.ctx.currentTime+.05;
    const placed=this.scene==='camp'||this.scene==='dream'?(this.scene==='dream'?'court':'camp'):this.place;
    const theme=placeThemes[placed],fighting=this.combat&&(this.scene==='battle'||this.scene==='crisis');
    const step=this.scene==='crisis'?theme.tempo*.8:this.scene==='result'?theme.tempo*1.35:this.scene==='dream'?theme.tempo*1.2:theme.tempo;
    while(this.next<this.ctx.currentTime+.3){
      const t=this.next,b=this.beat,bar=b%16,phrase=theme.phrase,shift=this.scene==='crisis'?-1:0;
      const midi=degree(theme,phrase[b%phrase.length]!+shift)-(this.scene==='dream'?12:0);
      // Melody: the lead plays the phrase, resting on every eighth beat.
      if(bar%8!==7&&(this.scene!=='result'||b%2===0))this.voice(theme.lead,midiToHz(midi),t,theme.lead==='horn'||theme.lead==='erhu'||theme.lead==='flute'?step*1.8:1.5,theme.lead==='bell'?.06:.1);
      // Counter-voice answers in the second half of each phrase.
      if(bar>=8&&bar%4===2)this.voice(theme.counter,midiToHz(degree(theme,phrase[(b+3)%phrase.length]!+5)),t,step*2.4,.045);
      if(bar%8===0)this.pad(theme.pad,theme.root,t,step*8);
      if(bar%4===0)this.pluck(midiToHz(degree(theme,phrase[b%phrase.length]!-5)),t,.05,this.music,step*3.5,900);
      // Percussion depends on the place and whether swords are drawn.
      if(fighting||theme.pulse==='patter'||theme.pulse==='temple')this.pulse(theme.pulse,bar,t,step,fighting);
      if(this.scene==='crisis'&&b%2===0){this.drum(t,false,.14);if(bar===0)this.gong(t,.08);}
      if(this.scene==='dream'&&bar%8===0){this.flute(midiToHz(midi+12),t,step*4,.03);this.bell(midiToHz(midi+13),t+step*2,.025);}
      if(this.scene==='camp'&&bar===0)this.flute(midiToHz(theme.root+12),t,step*6,.035);
      // Troop family motif while one of its units is selected.
      if(this.focus&&(this.scene==='battle'||this.scene==='crisis'))this.motif(this.focus,theme.root,bar,t,step);
      this.beat++;this.next+=step;
    }
  }
  private pulse(kind:string,bar:number,t:number,step:number,fighting:boolean){
    if(kind==='war'){if(bar%2===0)this.drum(t,true,.18);if(bar%4===3)this.drum(t+step/2,false,.1);if(bar===0)this.gong(t,.07);}
    else if(kind==='march'){if(bar%4===0)this.drum(t,true,.16);if(bar%2===1)this.drum(t,false,.08);if(fighting&&bar%8===6)this.block(t+step/2,.05);}
    else if(kind==='oars'){if(bar%4===0||bar%4===2){this.drum(t,true,.17);this.noiseBurst(t+step*.35,step*.9,.04,'lowpass',500,1,this.music,1400);}if(bar===12)this.horn(midiToHz(47),t,step*3,.08);}
    else if(kind==='temple'){if(bar%8===0)this.block(t,.05,660);if(bar===4)this.bell(midiToHz(82),t,.025);}
    else if(kind==='patter'){if(bar%2===1)this.block(t,.035,1050);if(fighting&&bar%4===0)this.drum(t,true,.12);}
    else if(fighting&&bar%4===0)this.drum(t,true,.15);
  }
  private motif(family:Family,root:number,bar:number,t:number,step:number){
    const m=familyMotifs[family],hit=m.rhythm[bar%8];if(!hit)return;const note=midiToHz(root+m.notes[Math.floor(bar/2)%m.notes.length]!);
    if(family==='horse'){this.block(t,.06,700);this.block(t+step/3,.04,620);if(bar%8===0)this.horn(note,t,step*2,.06);}
    else if(family==='foot'){this.drum(t,false,.08);if(bar%8===0)this.erhu(note,t,step*2,.05);}
    else if(family==='bow')this.pluck(note*2,t,.05,this.music,.4,6000);
    else if(family==='sage')this.bell(note*2,t,.03);
    else if(family==='siege'){this.drum(t,true,.2);this.noiseBurst(t,.25,.03,'bandpass',180,3,this.music);}
    else if(family==='boat'){this.noiseBurst(t,step*.8,.035,'lowpass',420,1,this.music,1100);this.pluck(note,t,.04,this.music,1,1200);}
    else this.flute(note*2,t,step*2,.03);
  }

  // ---- effects ------------------------------------------------------------
  /** Select a unit: its family takes over the motif layer and answers with a short call. */
  select(cls?:string){this.focus=classFamily(cls);this.cue('select',cls);}
  cue(kind:Cue,cls?:string,target?:Pick<Unit,'id'|'unitClass'>){
    if(!this.ctx||!this.enabled||!this.effects)return;const t=this.ctx.currentTime,fx=this.effects,family=classFamily(cls);
    if(kind==='select'){const m=family?familyMotifs[family]:undefined;if(!m){this.pluck(660,t,.12,fx,.3,5000);return;}m.notes.slice(0,3).forEach((n,i)=>this.voice(m.lead,midiToHz(74+n),t+i*.07,.35,.09,fx));return;}
    if(kind==='move'){
      if(family==='horse')for(let i=0;i<6;i++)this.block(t+i*.07+(i%2)*.025,.16,520+(i%3)*60,fx);
      else if(family==='boat'){this.noiseBurst(t,.5,.3,'lowpass',600,1,fx,1800);this.noiseBurst(t+.25,.35,.2,'bandpass',900,2,fx);}
      else if(family==='siege'){const o=this.osc('sawtooth',58,t,.6),lp=this.ctx.createBiquadFilter(),g=this.env(t,.05,.6,.08);lp.type='lowpass';lp.frequency.value=260;o.frequency.linearRampToValueAtTime(72,t+.3);o.frequency.linearRampToValueAtTime(55,t+.6);o.connect(lp);lp.connect(g);this.out(g,fx);this.drum(t+.1,true,.12,fx);}
      else if(family==='sage')this.noiseBurst(t,.35,.05,'highpass',3000,1,fx);
      else for(let i=0;i<3;i++){this.noiseBurst(t+i*.13,.08,.35,'lowpass',700,1,fx);this.drum(t+i*.13,false,.05,fx);}
      return;
    }
    if(kind==='attack'){
      const structure=!!target&&/^(gate|tower|barricade)_/.test(target.id);
      if(cls==='ram'){this.drum(t,true,.45,fx);this.noiseBurst(t,.5,.22,'lowpass',500,1,fx,120);this.crack(t+.05,fx);}
      else if(cls==='catapult'){this.noiseBurst(t,.4,.12,'bandpass',300,1,fx,1600);this.drum(t+.05,true,.4,fx);this.noiseBurst(t+.05,.8,.16,'lowpass',400,1,fx,90);}
      else if(family==='bow'){this.noiseBurst(t,.2,.35,'bandpass',2600,2,fx,700);this.block(t+.19,.18,300,fx);}
      else if(family==='boat'){this.noiseBurst(t,.4,.14,'lowpass',900,1,fx,300);this.clash(t+.12,fx);}
      else this.clash(t,fx);
      if(structure)this.crack(t+.08,fx);
      return;
    }
    if(kind==='magic'){[523,659,784,1046].forEach((f,i)=>this.bell(f,t+i*.07,.05,fx,1.2));this.noiseBurst(t,.6,.07,'bandpass',1800,2,fx,4000);return;}
    if(kind==='repair'){for(let i=0;i<3;i++){this.block(t+i*.16,.12,1400,fx);this.bell(1900,t+i*.16,.02,fx,.4);}return;}
    if(kind==='breach'){this.gong(t,.3,fx,82);this.crack(t,fx);this.noiseBurst(t,1.4,.2,'lowpass',700,1,fx,80);[0,4,7,12].forEach((n,i)=>this.horn(midiToHz(55+n),t+.3+i*.16,.5,.12,fx));return;}
    if(kind==='turn'){this.drum(t,true,.22,fx);this.drum(t+.18,true,.16,fx);this.pluck(midiToHz(62),t+.1,.08,fx,.8);return;}
    if(kind==='victory'){[0,4,7,12,16].forEach((n,i)=>this.horn(midiToHz(62+n),t+i*.14,.7,.12,fx));this.gong(t+.7,.2,fx);this.drum(t,true,.3,fx);return;}
    if(kind==='defeat'){[0,-2,-5,-9].forEach((n,i)=>this.erhu(midiToHz(62+n),t+i*.32,.6,.12,fx));this.gong(t+1.2,.15,fx,65);}
  }
  private clash(t:number,bus:AudioNode){this.noiseBurst(t,.16,.2,'highpass',2400,1,bus as GainNode);for(const f of [1870,2730,3510])this.bell(f,t,.035,bus as GainNode,.35);}
  private crack(t:number,bus:AudioNode){for(let i=0;i<4;i++)this.noiseBurst(t+i*.045,.06,.16,'bandpass',300+i*170,4,bus as GainNode);}
  /** Compatibility wrapper for the original effect names. */
  sfx(kind:Cue){this.cue(kind);}
}
