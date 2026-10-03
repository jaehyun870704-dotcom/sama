/**
 * 이야기 무대 — 조조전의 이벤트 장면처럼, 배경 그림 위에 작은 픽셀 인물들이 서서 걷고, 머리 위에
 * 말풍선·감정을 띄우며, 아래 대화창에 초상과 대사가 나온다. 장면 사이에는 해설 자막이 흐른다.
 *
 * 대본은 scenario-types.ts의 Scene. 걷기·등장·퇴장은 이어진 것끼리 함께 움직이고, 대사·해설·선택은
 * 사람이 넘길 때까지 기다린다. DOM과 CSS 전환만 쓴다(전장 그림판과 별개).
 */
import type {Scene,ScriptStep,ChoiceOption,Look,At} from './scenario-types.ts';
import {storyBackdrop} from './story.ts';
import {dialogueCaption} from './officer-art.ts';

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

export interface StageHooks {
  /** 선택지를 골랐을 때(효과 반영은 부른 쪽이). 고른 선택지를 돌려준다. */
  onChoice(option:ChoiceOption,step:Extract<ScriptStep,{choice:string}>):void;
  /** 대사마다 소리 등 */
  onLine?(speaker:string):void;
  /** 표식(when/unless 판정) — 선택으로 늘어날 수 있어 매번 읽는다. */
  flags():readonly string[];
  /** 진행 표시(장 제목 등) */
  heading:string;
}

/**
 * 장면들을 차례로 연출한다. root 안을 통째로 그린다. 끝나면(또는 건너뛰면) resolve.
 * 선택이 있는 장면은 건너뛰기를 눌러도 선택에서 멈춘다.
 */
export async function playScenes(root:HTMLElement,scenes:Scene[],hooks:StageHooks){
  let skipping=false;
  for(let si=0;si<scenes.length;si++){
    const scene=scenes[si]!;
    root.innerHTML=`<div class="ss-root"><div class="ss-head"><span class="eyebrow">${esc(hooks.heading)} · 장면 ${si+1}/${scenes.length}</span></div>
      <div class="ss-stage" style="${storyBackdrop(scene.art)}"><div class="ss-shade"></div><span class="ss-place">${esc(scene.place)}</span><div class="ss-caption" hidden></div></div>
      <div class="ss-dialog" aria-live="polite"></div><div class="ss-choices"></div>
      <div class="ss-controls"><button type="button" class="ss-skip">장면 건너뛰기 ⏭</button><button type="button" class="primary ss-next">다음 ▶</button></div></div>`;
    const stage=root.querySelector<HTMLElement>('.ss-stage')!,dialog=root.querySelector<HTMLElement>('.ss-dialog')!,choices=root.querySelector<HTMLElement>('.ss-choices')!,caption=root.querySelector<HTMLElement>('.ss-caption')!;
    const next=root.querySelector<HTMLButtonElement>('.ss-next')!,skip=root.querySelector<HTMLButtonElement>('.ss-skip')!;
    skip.onclick=()=>{skipping=true;advance?.();};
    let advance:(()=>void)|undefined;
    const waitClick=()=>skipping?Promise.resolve():new Promise<void>(r=>{advance=()=>{advance=undefined;r();};});
    next.onclick=()=>advance?.();stage.onclick=()=>advance?.();
    // 출연진 배치
    const actors=new Map<string,{el:HTMLElement;at:At;face:'left'|'right';look:Look;on:boolean}>();
    for(const m of scene.cast){
      const el=document.createElement('div');el.className='ss-actor';el.dataset.name=m.name;
      el.innerHTML=`<div class="ss-sprite" style="${spriteStyle(m.look)}"></div><span class="ss-name">${esc(m.name)}</span><div class="ss-bubble" hidden></div>`;
      const at=m.at??[-12,60],face=m.face??(at[0]<50?'right':'left');
      place(el,at,face,false);if(!m.at)el.classList.add('off');stage.appendChild(el);
      actors.set(m.name,{el,at,face,look:m.look,on:!!m.at});
    }
    const steps=scene.steps;
    for(let i=0;i<steps.length;i++){
      const st=steps[i]!,flags=hooks.flags();
      if((st.when&&!flags.includes(st.when))||(st.unless&&flags.includes(st.unless)))continue;
      // 이어진 걷기·등장·퇴장은 함께 움직인다.
      if('move' in st||'enter' in st||'exit' in st){
        const group:ScriptStep[]=[st];
        while(i+1<steps.length){const n=steps[i+1]!;if(!('move' in n||'enter' in n||'exit' in n))break;if((n.when&&!flags.includes(n.when))||(n.unless&&flags.includes(n.unless))){i++;continue;}group.push(n);i++;}
        await Promise.all(group.map(g=>walk(g)));continue;
      }
      if('emote' in st){const a=actors.get(st.emote);if(a){bubble(a.el,st.text,'emote');if(!skipping)await wait(650);}continue;}
      if('narrate' in st){caption.hidden=false;caption.textContent=st.narrate;dialog.innerHTML='';await waitClick();caption.hidden=true;continue;}
      if('say' in st){
        const a=actors.get(st.say);for(const o of actors.values())o.el.classList.remove('speaking');
        if(a){a.el.classList.add('speaking');const t=st.to?actors.get(st.to):undefined;if(t){a.face=t.at[0]>=a.at[0]?'right':'left';place(a.el,a.at,a.face,false);}bubble(a.el,'…','talk');}
        dialog.innerHTML=dialogueCaption(st.say,st.line);hooks.onLine?.(st.say);
        await waitClick();if(a)a.el.classList.remove('speaking');continue;
      }
      if('choice' in st){
        skipping=false;next.disabled=true;skip.disabled=true;
        const hero=actors.get(st.choice);if(hero){hero.el.classList.add('speaking');bubble(hero.el,'?','emote');}
        dialog.innerHTML=dialogueCaption(st.choice,'…어떻게 할 것인가.');
        const picked=await new Promise<ChoiceOption>(r=>{choices.innerHTML=st.options.map((o,k)=>`<button type="button" data-k="${k}"><span class="ss-choice-no">${k+1}</span><strong>${esc(o.text)}</strong>${o.note?`<small>${esc(o.note)}</small>`:''}</button>`).join('');
          choices.querySelectorAll<HTMLButtonElement>('[data-k]').forEach(b=>b.onclick=()=>r(st.options[Number(b.dataset.k)]!));});
        choices.innerHTML='';next.disabled=false;skip.disabled=false;hero?.el.classList.remove('speaking');
        hooks.onChoice(picked,st);
        if(picked.reply){dialog.innerHTML=dialogueCaption(st.choice,picked.reply);await waitClick();}
        if(picked.answer){const a=actors.get(picked.answer.speaker);if(a)bubble(a.el,'!','emote');dialog.innerHTML=dialogueCaption(picked.answer.speaker,picked.answer.line);await waitClick();}
        continue;
      }
    }
    if(!skipping)await wait(250);
    async function walk(g:ScriptStep){
      const name='move' in g?g.move:'enter' in g?g.enter:'exit' in g?g.exit:'';const a=actors.get(name);if(!a)return;
      let to:At;
      if('enter' in g){const from=g.from??(g.at[0]<50?'left':'right');a.at=[from==='left'?-12:112,g.at[1]];place(a.el,a.at,from==='left'?'right':'left',false);a.el.classList.remove('off');a.on=true;await wait(30);to=g.at;}
      else if('exit' in g){to=[(g.to??(a.at[0]<50?'left':'right'))==='left'?-14:114,a.at[1]];}
      else to=(g as {to:At}).to;
      const face:'left'|'right'=to[0]>a.at[0]?'right':to[0]<a.at[0]?'left':a.face;
      const dist=Math.hypot(to[0]-a.at[0],to[1]-a.at[1]),ms=skipping?0:Math.min(1400,Math.max(350,dist*22));
      a.el.style.transitionDuration=ms+'ms';a.el.classList.add('walking');
      const look=a.look,sprite=a.el.querySelector<HTMLElement>('.ss-sprite')!;
      let frame=0;const timer=setInterval(()=>{frame=(frame+1)%4;sprite.setAttribute('style',spriteStyle(look,SPRITES[look].walk?frame:0,true));},140);
      a.face=face;a.at=to;place(a.el,to,face,true);await wait(ms+30);
      clearInterval(timer);sprite.setAttribute('style',spriteStyle(look));a.el.classList.remove('walking');a.el.style.transitionDuration='';
      if('exit' in g){a.el.classList.add('off');a.on=false;}
    }
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
