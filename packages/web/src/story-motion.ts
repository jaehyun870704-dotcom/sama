/**
 * 연의 이야기 장면의 인물 연기 — 조조전 이벤트 장면처럼 작은 인물이 걸어 들어와 서로 마주 보고,
 * 말할 때 손짓하고, 윗사람 앞에서 읍하고, 놀라면 움찔하고, 결심하면 가리킨다.
 *
 * 인물 그림은 한 장의 시트(가로 8칸 × 세로 3줄)를 쓴다. 그린 전신 시트가 있는 장수는 그 시트,
 * 없는 인물은 도트 인물 시트(story-pixel)를 쓴다. 두 시트는 칸 배치가 같다.
 *   칸: 0 서기 · 1 걸음 A · 2 걸음 B · 3 말하기 · 4 읍(절) · 5 무릎 꿇기 · 6 놀람 · 7 가리키기
 *   줄: 0 앞 · 1 뒤 · 2 옆(오른쪽을 봄). 왼쪽을 볼 때는 CSS로 뒤집는다.
 */
import {officerLook} from './officer-art.ts';
import {pxSheet} from './story-pixel.ts';
import type {Look} from './scenario-types.ts';

const F={stand:0,walkA:1,walkB:2,talk:3,bow:4,kneel:5,surprise:6,point:7} as const;
type Frame=keyof typeof F;
/** 그린 시트가 없는 인물의 겉모습(도트 인물의 옷·무기). */
const LOOKS:Record<string,Look>={장합:'cavalry',곽회:'archer',맹달:'infantry',제갈량:'strategist',손권:'civil','꿈속의 그림자':'civil','꿈속의 목소리':'civil'};

export interface ActorArt {url:string;fig:boolean}
export function actorArt(name:string):ActorArt{
  const p=officerLook(name);
  if(p)return {url:`officers/${p.id}-story-v1.webp`,fig:true};
  return {url:pxSheet(name,LOOKS[name]??'infantry'),fig:false};
}
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
/** 무대 위 인물 한 명. role: 왼쪽(사마의) · 오른쪽(상대). */
export function actorMarkup(name:string,role:'hero'|'companion',extra=''){
  const a=actorArt(name);
  return `<div class="sa sa-${role} ${a.fig?'fig':'px'} ${extra}" data-role="${role}" role="img" aria-label="${esc(name)}"><i class="sa-shadow"></i><div class="sa-body"><div class="sa-sprite" style="background-image:url('${a.url}');--fx:0;--fy:2"></div></div><span class="sa-bubble" aria-hidden="true">…</span></div>`;
}

export interface BeatPlan {
  speaker:'hero'|'companion'|'none';
  line:string;
  pose:'enter'|'speak'|'resolve'|string;
  /** 새 장소: 두 사람이 무대 밖에서 걸어 들어온다. */
  walkIn:boolean;
  /** 말하는 쪽이 아랫사람으로서 윗사람을 부르는가(읍하고 말한다). */
  deferent:boolean;
}
/** 대사에서 몸짓을 고른다. */
export function gestureFor(line:string,pose:string,deferent:boolean){
  const kneel=/무릎|엎드|조아리|죽여 주|죄를 청|용서하/.test(line);
  const surprise=/[!！]|무엇이|어찌 이런|설마|큰일/.test(line);
  const point=pose==='resolve'||/가라|나가라|쳐라|베어라|배를 내어라|출진/.test(line);
  return {kneel,surprise:surprise&&!kneel,bow:deferent&&!kneel,point:point&&!kneel};
}

/**
 * 한 장면의 연기를 시작한다. 돌려준 함수를 부르면 멈춘다(다음 장면으로 넘어갈 때).
 * 걸음은 칸 1·2를 번갈아 바꾸며 무대 위를 가로지르고, 말은 칸 3·0을 번갈아 입을 떼는 듯 보인다.
 */
export function playBeat(stage:HTMLElement,plan:BeatPlan):()=>void{
  const timers:number[]=[];let stopped=false;
  const later=(ms:number,fn:()=>void)=>{timers.push(window.setTimeout(()=>{if(!stopped)fn();},ms));};
  const every=(ms:number,fn:(i:number)=>void)=>{let i=0;const id=window.setInterval(()=>{if(!stopped)fn(i++);},ms);timers.push(id);return ()=>window.clearInterval(id);};
  const hero=stage.querySelector<HTMLElement>('.sa-hero'),comp=stage.querySelector<HTMLElement>('.sa-companion');
  const set=(el:HTMLElement|null,f:Frame,row=2)=>{const s=el?.querySelector<HTMLElement>('.sa-sprite');if(s){s.style.setProperty('--fx',String(F[f]));s.style.setProperty('--fy',String(row));}};
  const still=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const speaker=plan.speaker==='hero'?hero:plan.speaker==='companion'?comp:null,listener=speaker===hero?comp:speaker===comp?hero:null;
  const g=gestureFor(plan.line,plan.pose,plan.deferent);
  set(hero,'stand');set(comp,'stand');

  /** 말하기: 몸짓(읍·놀람) → 입 떼기 → 마무리 자세(가리킴·무릎). */
  const speak=()=>{
    if(!speaker)return;
    let t=0;
    if(g.kneel){set(speaker,'kneel');speaker.classList.add('kneeling');}
    else if(g.bow){set(speaker,'bow');t=650;}
    else if(g.surprise){set(speaker,'surprise');speaker.classList.add('jolt');t=600;later(600,()=>speaker.classList.remove('jolt'));}
    later(t,()=>{
      speaker.classList.add('talking');
      const talkFor=Math.min(3800,900+plan.line.length*55);
      const stop=g.kneel?()=>{}:every(260,i=>set(speaker,i%2?'stand':'talk'));
      // 듣는 사람은 말 중간에 한 번 고개를 끄덕인다.
      if(listener&&!still)later(Math.round(talkFor*.45),()=>{set(listener,'bow');later(320,()=>set(listener,'stand'));});
      later(talkFor,()=>{stop();speaker.classList.remove('talking');set(speaker,g.kneel?'kneel':g.point?'point':'stand');});
    });
  };

  if(plan.walkIn&&!still){
    // 무대 밖에서 제자리로: 사마의가 먼저, 상대가 조금 뒤에 들어온다.
    const walk=(el:HTMLElement|null,delay:number,ms:number)=>{
      if(!el)return;el.classList.add('offstage');
      later(delay,()=>{el.classList.add('walking');el.style.transitionDuration=ms+'ms';el.classList.remove('offstage');
        const stop=every(170,i=>set(el,i%2?'walkB':'walkA'));
        later(ms,()=>{stop();el.classList.remove('walking');set(el,'stand');});});
    };
    walk(hero,40,1150);walk(comp,320,1250);
    later(1650,speak);
  } else speak();
  return ()=>{stopped=true;for(const id of timers){window.clearTimeout(id);window.clearInterval(id);}};
}
