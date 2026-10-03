/**
 * 이야기 무대 — 조조전의 이벤트 장면처럼, 배경 그림 위에 작은 픽셀 인물들이 서서 걷고, 머리 위에
 * 말풍선·감정을 띄운다. 대사는 무대 위에 겹친 먹 붓 테두리의 대화창(큰 초상 + 이름 + 대사)으로 나오고,
 * 화자가 무대 아래쪽에 있으면 대화창은 위에, 위쪽에 있으면 아래에 뜬다. 장면 사이에는 해설 자막이 흐른다.
 *
 * Stage 하나가 무대 하나를 맡는다(이야기 장면, 출진 전 진영이 함께 쓴다). DOM과 CSS 전환만 쓴다.
 */
import type {Scene,ScriptStep,ChoiceOption,Look,At,CastMember} from './scenario-types.ts';
import {storyBackdrop} from './story.ts';
import {officerPortrait,officerLook} from './officer-art.ts';

/** 겉모습 → 병사 그림(시트·줄). 시트는 main.ts가 CSS 변수(--이름-atlas)로 올려 둔다. */
const SPRITES:Record<Look,{sheet:string;rows:number;row:number;walk?:string}>={
  strategist:{sheet:'base',rows:6,row:4},civil:{sheet:'base',rows:6,row:4},infantry:{sheet:'base',rows:6,row:0},spear:{sheet:'base',rows:6,row:1},
  archer:{sheet:'base',rows:6,row:2},cavalry:{sheet:'base',rows:6,row:3},crossbow:{sheet:'extra',rows:4,row:0},heavy:{sheet:'extra',rows:4,row:1},
  engineer:{sheet:'extra',rows:4,row:2},sage:{sheet:'extra',rows:4,row:3},shaman:{sheet:'casters',rows:3,row:0,walk:'casters-walk'},lady:{sheet:'casters',rows:3,row:1,walk:'casters-walk'},
  taoist:{sheet:'casters',rows:3,row:2,walk:'casters-walk'},physician:{sheet:'specialists',rows:4,row:0,walk:'specialists-walk'},monk:{sheet:'specialists',rows:4,row:1,walk:'specialists-walk'},
  horseArcher:{sheet:'specialists',rows:4,row:2,walk:'specialists-walk'},bandit:{sheet:'specialists',rows:4,row:3,walk:'specialists-walk'},assassin:{sheet:'specialists',rows:4,row:3,walk:'specialists-walk'},
  elephant:{sheet:'extra',rows:4,row:1},
};
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const wait=(ms:number)=>new Promise<void>(r=>setTimeout(r,ms));
export function spriteStyle(look:Look,frame=0,walking=false){
  const s=SPRITES[look]??SPRITES.infantry,sheet=walking&&s.walk?s.walk:s.sheet;
  return `background-image:var(--${sheet}-atlas);background-size:400% ${s.rows*100}%;background-position:${frame/3*100}% ${s.rows>1?s.row/(s.rows-1)*100:0}%`;
}
/** 먹 붓 테두리 대화창: 큰 초상과 이름·대사. place: 무대 위('top')·아래('bottom'). */
export function talkBox(speaker:string,line:string,place:'top'|'bottom'){
  const look=officerLook(speaker),name=look?.name??speaker;
  return `<div class="ss-talk ${place}"><div class="ss-talk-face">${officerPortrait(speaker)}</div><div class="ss-talk-body"><b>${esc(name)}</b><p>${esc(line)}</p></div><span class="ss-talk-next" aria-hidden="true">▼</span></div>`;
}

export interface StageHooks {
  onChoice?(option:ChoiceOption,step:Extract<ScriptStep,{choice:string}>):void;
  /** 표식(when/unless 판정) — 선택으로 늘어날 수 있어 매번 읽는다. */
  flags():readonly string[];
}
type Actor={el:HTMLElement;at:At;face:'left'|'right';look:Look;on:boolean};

/** 무대 하나: 배경·인물·대화창·자막·선택지. */
export class Stage {
  readonly el:HTMLElement;
  readonly actors=new Map<string,Actor>();
  private talk:HTMLElement;private caption:HTMLElement;private choices:HTMLElement;
  private advance:(()=>void)|undefined;
  skipping=false;
  constructor(host:HTMLElement,art:number,place:string,cast:CastMember[]){
    host.innerHTML=`<div class="ss-stage" style="${storyBackdrop(art)}"><div class="ss-shade"></div><span class="ss-place">${esc(place)}</span><div class="ss-caption" hidden></div><div class="ss-talk-slot"></div></div><div class="ss-choices"></div>`;
    this.el=host.querySelector<HTMLElement>('.ss-stage')!;this.talk=host.querySelector<HTMLElement>('.ss-talk-slot')!;this.caption=host.querySelector<HTMLElement>('.ss-caption')!;this.choices=host.querySelector<HTMLElement>('.ss-choices')!;
    // 대사·해설을 기다리는 중이면 어디를 눌러도(인물·대화창 위라도) 넘어간다. 기다리는 게 없을 때만 인물 누르기가 말 걸기다.
    this.el.addEventListener('click',e=>{if(!this.advance&&(e.target as HTMLElement).closest('.ss-actor.clickable'))return;this.next();});
    for(const m of cast)this.addActor(m);
  }
  next(){this.advance?.();}
  addActor(m:CastMember){
    const el=document.createElement('div');el.className='ss-actor';el.dataset.name=m.name;
    el.innerHTML=`<div class="ss-sprite" style="${spriteStyle(m.look)}"></div><span class="ss-name">${esc(m.name)}</span><div class="ss-bubble" hidden></div>`;
    const at=m.at??[-12,60],face=m.face??(at[0]<50?'right':'left');
    place(el,at,face,false);if(!m.at)el.classList.add('off');this.el.appendChild(el);
    const a:Actor={el,at,face,look:m.look,on:!!m.at};this.actors.set(m.name,a);return a;
  }
  private waitClick(){return this.skipping?Promise.resolve():new Promise<void>(r=>{this.advance=()=>{this.advance=undefined;r();};});}
  bubble(name:string,text:string,kind:'emote'|'talk'){const a=this.actors.get(name);if(a)bubble(a.el,text,kind);}
  /** 화자가 말한다: 화자 쪽 반대편(위/아래)에 대화창. */
  async say(speaker:string,line:string,to?:string){
    const a=this.actors.get(speaker);for(const o of this.actors.values())o.el.classList.remove('speaking');
    if(a){a.el.classList.add('speaking');const t=to?this.actors.get(to):undefined;if(t&&t!==a){a.face=t.at[0]>=a.at[0]?'right':'left';place(a.el,a.at,a.face,false);}bubble(a.el,'…','talk');}
    this.talk.innerHTML=talkBox(speaker,line,a&&a.at[1]>58?'top':'bottom');
    await this.waitClick();if(a)a.el.classList.remove('speaking');this.talk.innerHTML='';
  }
  async narrate(text:string){this.caption.hidden=false;this.caption.textContent=text;this.talk.innerHTML='';await this.waitClick();this.caption.hidden=true;}
  async walk(name:string,to:At,mode:'move'|'enter'|'exit'='move',from?:'left'|'right'){
    const a=this.actors.get(name);if(!a)return;
    if(mode==='enter'){const side=from??(to[0]<50?'left':'right');a.at=[side==='left'?-12:112,to[1]];place(a.el,a.at,side==='left'?'right':'left',false);a.el.classList.remove('off');a.on=true;await wait(30);}
    const face:'left'|'right'=to[0]>a.at[0]?'right':to[0]<a.at[0]?'left':a.face;
    const dist=Math.hypot(to[0]-a.at[0],to[1]-a.at[1]),ms=this.skipping?0:Math.min(1400,Math.max(300,dist*22));
    a.el.style.transitionDuration=ms+'ms';a.el.classList.add('walking');
    const sprite=a.el.querySelector<HTMLElement>('.ss-sprite')!,walkable=!!SPRITES[a.look].walk;
    let frame=0;const timer=setInterval(()=>{frame=(frame+1)%4;sprite.setAttribute('style',spriteStyle(a.look,walkable?frame:0,true));},140);
    a.face=face;a.at=to;place(a.el,to,face,true);await wait(ms+30);
    clearInterval(timer);sprite.setAttribute('style',spriteStyle(a.look));a.el.classList.remove('walking');a.el.style.transitionDuration='';
    if(mode==='exit'){a.el.classList.add('off');a.on=false;}
  }
  /** 대본의 단계들을 차례로. 이어진 걷기·등장·퇴장은 함께 움직인다. */
  async run(steps:ScriptStep[],hooks:StageHooks){
    for(let i=0;i<steps.length;i++){
      const st=steps[i]!,flags=hooks.flags();
      if((st.when&&!flags.includes(st.when))||(st.unless&&flags.includes(st.unless)))continue;
      if('move' in st||'enter' in st||'exit' in st){
        const group:ScriptStep[]=[st];
        while(i+1<steps.length){const n=steps[i+1]!;if(!('move' in n||'enter' in n||'exit' in n))break;i++;if((n.when&&!flags.includes(n.when))||(n.unless&&flags.includes(n.unless)))continue;group.push(n);}
        await Promise.all(group.map(g=>'enter' in g?this.walk(g.enter,g.at,'enter',g.from):'exit' in g?this.walk(g.exit,[((g.to??((this.actors.get(g.exit)?.at[0]??0)<50?'left':'right'))==='left'?-14:114),this.actors.get(g.exit)?.at[1]??60],'exit'):this.walk((g as {move:string}).move,(g as {to:At}).to)));continue;
      }
      if('emote' in st){this.bubble(st.emote,st.text,'emote');if(!this.skipping)await wait(650);continue;}
      if('narrate' in st){await this.narrate(st.narrate);continue;}
      if('say' in st){await this.say(st.say,st.line,st.to);continue;}
      if('choice' in st){
        this.skipping=false;this.el.classList.add('choosing');
        const hero=this.actors.get(st.choice);if(hero){hero.el.classList.add('speaking');bubble(hero.el,'?','emote');}
        this.talk.innerHTML=talkBox(st.choice,'…어떻게 할 것인가.',hero&&hero.at[1]>58?'top':'bottom');
        const picked=await new Promise<ChoiceOption>(r=>{this.choices.innerHTML=st.options.map((o,k)=>`<button type="button" data-k="${k}"><span class="ss-choice-no">${k+1}</span><strong>${esc(o.text)}</strong>${o.note?`<small>${esc(o.note)}</small>`:''}</button>`).join('');
          this.choices.querySelectorAll<HTMLButtonElement>('[data-k]').forEach(b=>b.onclick=()=>r(st.options[Number(b.dataset.k)]!));});
        this.choices.innerHTML='';this.talk.innerHTML='';this.el.classList.remove('choosing');hero?.el.classList.remove('speaking');
        hooks.onChoice?.(picked,st);
        if(picked.reply)await this.say(st.choice,picked.reply);
        if(picked.answer){this.bubble(picked.answer.speaker,'!','emote');await this.say(picked.answer.speaker,picked.answer.line);}
      }
    }
  }
}

/**
 * 장면들을 차례로 연출한다. root 안을 통째로 그린다. 끝나면(또는 건너뛰면) resolve.
 * 선택이 있는 장면은 건너뛰기를 눌러도 선택에서 멈춘다.
 */
export async function playScenes(root:HTMLElement,scenes:Scene[],hooks:StageHooks&{heading:string}){
  let skipping=false;
  for(let si=0;si<scenes.length;si++){
    const scene=scenes[si]!;
    root.innerHTML=`<div class="ss-root"><div class="ss-head"><span class="eyebrow">${esc(hooks.heading)} · 장면 ${si+1}/${scenes.length}</span></div><div class="ss-frame"></div>
      <div class="ss-controls"><button type="button" class="ss-skip">장면 건너뛰기 ⏭</button><button type="button" class="primary ss-next">다음 ▶</button></div></div>`;
    const stage=new Stage(root.querySelector<HTMLElement>('.ss-frame')!,scene.art,scene.place,scene.cast);stage.skipping=skipping;
    root.querySelector<HTMLButtonElement>('.ss-skip')!.onclick=()=>{skipping=true;stage.skipping=true;stage.next();};
    root.querySelector<HTMLButtonElement>('.ss-next')!.onclick=()=>stage.next();
    await stage.run(scene.steps,hooks);skipping=stage.skipping;
    if(!skipping)await wait(250);
  }
}
function place(el:HTMLElement,[x,y]:At,face:'left'|'right',animate:boolean){
  el.style.left=x+'%';el.style.top=y+'%';el.style.zIndex=String(Math.round(y));
  el.classList.toggle('face-left',face==='left');if(!animate)el.style.transitionDuration='0ms';
}
function bubble(el:HTMLElement,text:string,kind:'emote'|'talk'){
  const b=el.querySelector<HTMLElement>('.ss-bubble')!;b.textContent=text;b.className='ss-bubble '+kind;b.hidden=false;
  clearTimeout(Number(b.dataset.t??0));b.dataset.t=String(setTimeout(()=>{b.hidden=true;},kind==='emote'?1300:2600));
}
