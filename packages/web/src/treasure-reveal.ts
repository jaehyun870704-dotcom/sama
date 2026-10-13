/**
 * 보물 획득 장면 — 고유 보물을 얻은 전투의 결과 화면 다음에 한 점씩 보여 준다.
 * 그림 · 이름 · 등급 · 고유 기능 한 줄 · 누가 건네는지(어디서 얻었는지) 한두 마디. 「모두 건너뛰기」로 한꺼번에 닫는다.
 * 대사는 treasure-lines.ts(보물마다 사마의전 s · 제갈량전 z). 대사가 없는 보물은 공통 문구.
 */
import {gearPowerText} from '../../core/src/index.ts';
import {treasures,statText} from './progression.ts';
import {treasureIcon,gradeName,formName} from './treasure-art.ts';
import {TREASURE_LINES,commonRevealLines,type RevealLine} from './treasure-lines.ts';

/** 어느 이야기에서 얻었나: S 사마의전(연의 장·외전·도전) · Z 제갈량전. */
export type RevealStory='S'|'Z';
export interface RevealCard {
  id:string;name:string;grade:number;
  /** 등급 이름(일반·희귀·영웅·전설). */
  rank:string;
  /** 종류 이름(검·창·…). */
  kind:string;
  /** 고유 기능 한 줄(고유 기능이 없는 보물은 기본 능력). */
  power:string;
  lines:readonly RevealLine[];
  /** 대사가 없어 공통 문구를 썼다. */
  common:boolean;
}

/** 보물 한 점의 획득 장면. 고유 보물이 아니면 undefined. */
export function revealCard(id:string,story:RevealStory):RevealCard|undefined{
  const t=treasures.find(x=>x.id===id);if(!t)return undefined;
  const own=TREASURE_LINES[id]?.[story==='Z'?'z':'s'];
  const lines=own?.length?own:commonRevealLines(t.name);
  return {id,name:t.name,grade:t.grade,rank:gradeName(t.grade),kind:formName(t.kind),power:gearPowerText(id)||statText(t.bonus),lines,common:!own?.length};
}
/** 얻은 보물들의 장면 차례(고유 보물만 · 같은 것은 한 번). */
export function revealQueue(ids:readonly string[],story:RevealStory):RevealCard[]{
  const seen=new Set<string>(),out:RevealCard[]=[];
  for(const id of ids){if(seen.has(id))continue;seen.add(id);const c=revealCard(id,story);if(c)out.push(c);}
  return out;
}

const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
/** 장면 한 장의 마크업. */
export function revealMarkup(card:RevealCard,index:number,total:number):string{
  const last=index>=total-1;
  const lines=card.lines.map(([who,line])=>who?`<p class="tr-line"><b>${esc(who)}</b><span>${esc(line)}</span></p>`:`<p class="tr-line narrate"><span>${esc(line)}</span></p>`).join('');
  return `<div class="treasure-reveal-card g${card.grade}" data-treasure="${esc(card.id)}">
    <div class="eyebrow">보물 획득${total>1?` <span>${index+1} / ${total}</span>`:''}</div>
    <div class="tr-body">
      <div class="tr-art">${treasureIcon(card.id)}</div>
      <div class="tr-text">
        <h2>${esc(card.name)}</h2>
        <p class="tr-rank"><span class="tr-stars">${'★'.repeat(card.grade)}</span> ${esc(card.rank)} · ${esc(card.kind)}</p>
        <p class="tr-power">${esc(card.power)}</p>
      </div>
    </div>
    <div class="tr-lines">${lines}</div>
    <div class="modal-actions">${total>1&&!last?'<button id="tr-skip">모두 건너뛰기</button>':''}<button class="primary" id="tr-next">${last?'확인':'다음 보물 ▶'}</button></div>
  </div>`;
}

/**
 * 장면을 한 장씩 띄운다(결과 화면 위에 따로 여는 창 — 닫으면 결과 화면이 그대로 남는다).
 * 다 보거나 「모두 건너뛰기」·Esc로 닫으면 끝난다. 'done' 끝까지 봄 · 'skipped' 건너뜀.
 */
export function showTreasureReveal(cards:readonly RevealCard[]):Promise<'done'|'skipped'>{
  if(!cards.length||typeof document==='undefined')return Promise.resolve('done');
  return new Promise(resolve=>{
    const d=document.createElement('dialog');d.className='treasure-reveal';d.setAttribute('aria-label','보물 획득');
    document.body.appendChild(d);
    let k=0,closed=false;
    const finish=(how:'done'|'skipped')=>{if(closed)return;closed=true;if(d.open)d.close();d.remove();resolve(how);};
    const draw=()=>{
      d.innerHTML=revealMarkup(cards[k]!,k,cards.length);
      d.querySelector<HTMLButtonElement>('#tr-next')!.onclick=()=>{k++;if(k>=cards.length)finish('done');else draw();};
      const skip=d.querySelector<HTMLButtonElement>('#tr-skip');if(skip)skip.onclick=()=>finish('skipped');
      d.querySelector<HTMLButtonElement>('#tr-next')!.focus();
    };
    d.addEventListener('cancel',e=>{e.preventDefault();finish('skipped');});
    draw();d.showModal();d.querySelector<HTMLButtonElement>('#tr-next')?.focus();
  });
}

/**
 * 결과 화면이 뜬 뒤 잠깐 있다가 장면을 띄운다(결과 화면 다음에). 그 사이 다른 화면으로 넘어가 결과 화면이 사라졌으면 띄우지 않는다.
 * 띄운 장면 수를 돌려준다.
 */
export function revealAfterResult(ids:readonly string[],story:RevealStory,anchor:Element|null|undefined,delay=650):number{
  const cards=revealQueue(ids,story);if(!cards.length||!anchor)return 0;
  setTimeout(()=>{if(anchor.isConnected)void showTreasureReveal(cards);},delay);
  return cards.length;
}
