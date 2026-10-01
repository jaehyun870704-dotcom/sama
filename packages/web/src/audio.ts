/** Original procedural score: a pentatonic plucked-string motif, a breathy
 * flute-like voice and soft war drums. No downloaded recordings or samples. */
export class Soundscape {
  private ctx:AudioContext|undefined;
  private master:GainNode|undefined;
  private music:GainNode|undefined;
  private effects:GainNode|undefined;
  private timer:ReturnType<typeof setInterval>|undefined;
  private beat=0;
  private next=0;
  enabled=true;
  musicVolume=.38;
  effectsVolume=.65;
  combat=false;
  scene:'camp'|'battle'|'crisis'|'result'|'dream'='camp';
  async start(){
    try{
      if(!this.ctx){
        this.ctx=new AudioContext();this.master=this.ctx.createGain();this.master.connect(this.ctx.destination);
        const compressor=this.ctx.createDynamicsCompressor();compressor.connect(this.master);
        this.music=this.ctx.createGain();this.effects=this.ctx.createGain();this.music.connect(compressor);this.effects.connect(compressor);
        this.next=this.ctx.currentTime+.1;
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
  private tone(f:number,t:number,d:number,v:number,type:OscillatorType='sine',bus=this.music){
    if(!this.ctx||!bus)return;
    const o=this.ctx.createOscillator(), g=this.ctx.createGain();o.type=type;o.frequency.value=f;
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+d);
    o.connect(g);g.connect(bus);o.start(t);o.stop(t+d+.02);o.onended=()=>{o.disconnect();g.disconnect();};
  }
  private drum(t:number,heavy=false){
    if(!this.ctx||!this.music)return;
    const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.frequency.setValueAtTime(heavy?110:170,t);o.frequency.exponentialRampToValueAtTime(42,t+.23);
    g.gain.setValueAtTime(.19,t);g.gain.exponentialRampToValueAtTime(.0001,t+.5);o.connect(g);g.connect(this.music);o.start(t);o.stop(t+.51);o.onended=()=>{o.disconnect();g.disconnect();};
  }
  private schedule(){
    if(!this.ctx||this.ctx.state!=='running')return;
    if(this.next<this.ctx.currentTime)this.next=this.ctx.currentTime+.05;
    const notes=[62,69,74,76,69,67,64,62,57,62,67,69,64,62,57,55,62,67,69,74,76,74,69,67,64,62,57,62,64,57,55,57];
    while(this.next<this.ctx.currentTime+.3){
      const midi=notes[this.beat%notes.length]!-(this.scene==='dream'?12:0);const f=440*2**((midi-69)/12);
      if(this.beat%8!==7&&(this.scene!=='result'||this.beat%2===0)){this.tone(f,this.next,1.6,.12,'triangle');this.tone(f*2,this.next,1,.018);}
      if(this.beat%4===0)this.tone(f/2,this.next,3.2,.055);
      if(this.beat%8===2)this.tone(f*2,this.next,2.4,.04);
      if(this.combat&&this.scene!=='camp'&&this.scene!=='result'&&this.beat%4===0)this.drum(this.next,true);
      if(this.scene==='crisis'&&this.beat%2===0){this.drum(this.next);this.tone(73.4,this.next,.8,.06);}
      if(this.scene==='camp'&&this.beat%8===0)this.tone(f/4,this.next,4,.06);
      if(this.scene==='dream'&&this.beat%8===0){this.tone(55,this.next,4,.055);this.tone(56.1,this.next,4,.025);}
      this.beat++;this.next+=this.scene==='dream'?.68:this.scene==='crisis'?.31:this.combat&&this.scene==='battle'?.4:.57;
    }
  }
  sfx(kind:'select'|'move'|'attack'|'magic'|'turn'|'victory'|'defeat'){
    if(!this.ctx||!this.enabled)return;const t=this.ctx.currentTime;
    const notes=kind==='victory'?[293,392,440,587]:kind==='defeat'?[293,220,147]:kind==='magic'?[440,587,784,1174]:kind==='turn'?[196,293]:kind==='attack'?[90,55]:kind==='move'?[170,210]:[660];
    notes.forEach((f,i)=>this.tone(f,t+i*.09,kind==='attack'?.18:kind==='select'?.1:.5,.13,kind==='attack'?'sawtooth':'sine',this.effects));
  }
}
