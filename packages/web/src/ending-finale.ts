/**
 * 결말 컷신 — 결말 대본의 장면(인물이 걷고 말하는 무대)이 끝난 뒤 이어지는 종막.
 *   ① 결말 제목이 붓으로 써지듯 드러나고(정사·가상 표지와 해)
 *   ② 후일담이 한 줄씩 떠오르고(고른 선택이 남긴 덧말 포함)
 *   ③ 걸어온 길(상·중·하편의 갈림길)과 함께한 사람들이 자막처럼 올라가고
 *   ④ 붉은 「끝」 도장이 찍힌다.
 * 어느 때든 「건너뛰기」로 끝까지 넘기고, 화면을 누르면 지금 단계를 바로 마친다.
 */
import {playNarration,playScenes} from './story-stage.ts';
import {isoScene} from './story-iso.ts';
import {routeById,endingFor,type Ending} from './fate.ts';
import {scriptOf} from './scenario.ts';

export interface FinaleData {
  /** 정사·가상 */
  kind:'정사'|'가상';
  year:string;title:string;
  /** 후일담 */
  lines:readonly string[];
  /** 고른 선택이 남긴 덧말 */
  notes:readonly string[];
  /** 걸어온 길: 편 이름과 그 편에서 고른 길 */
  path:ReadonlyArray<{act:string;name:string}>;
  /** 함께한 사람들(묶음 이름 → 이름들) */
  people:ReadonlyArray<{label:string;names:readonly string[]}>;
  /** 배경: 이야기 배경 번호와 장소 */
  art:number;place:string;
  /** 본 결말 수 */
  seen?:{count:number;total:number};
}
const ACTS=['상편','중편','하편'];
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

/** 갈림길 기록(1·2·3편 route id) → 걸어온 길 표. 정사로 걸은 편은 '정사'로 적는다. */
export function finalePath(route:{1?:string;2?:string;3?:string}):FinaleData['path']{
  return ([1,2,3] as const).map(a=>{const r=routeById(route[a]);return {act:ACTS[a-1]!,name:r?r.name:'정사의 길'};});
}
/** 결말 대본과 결말 정의로 종막 자료를 만든다(장면 배경은 대본의 마지막 장면). */
export function finaleData(e:Ending,o:{route:{1?:string;2?:string;3?:string};notes?:readonly string[];people?:FinaleData['people'];seen?:FinaleData['seen'];text?:(s:string)=>string}):FinaleData{
  const T=o.text??((s:string)=>s),script=scriptOf(`ending:${e.id}`),last=script?.scenes.at(-1);
  return {kind:e.history?'정사':'가상',year:T(script?.year??''),title:T(e.title),lines:e.lines.map(T),notes:(o.notes??[]).map(T),
    path:finalePath(o.route).map(p=>({act:p.act,name:T(p.name)})),people:(o.people??[]).filter(g=>g.names.length),
    art:last?.art??5,place:T(last?.place??e.title),...(o.seen?{seen:o.seen}:{})};
}

/** 종막을 root 안에 그린다. 끝나면(계속 단추) resolve. */
export function playFinale(root:HTMLElement,d:FinaleData):Promise<void>{
  const still=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  const bg=(()=>{try{return isoScene(d.art,d.place).url;}catch{return '';}})();
  root.innerHTML=`<div class="finale${still?' still':''}" role="dialog" aria-label="결말 · ${esc(d.title)}">
    <div class="fn-bg"${bg?` style="background-image:url(${bg})"`:''}></div><div class="fn-veil"></div>
    <button type="button" class="fn-skip">건너뛰기 ⏭</button>
    <section class="fn-title"><div class="fn-eyebrow"><span class="fn-kind ${d.kind==='정사'?'history':'what-if'}">결말 · ${d.kind}</span>${d.year?`<span>${esc(d.year)}</span>`:''}</div><h2><span>${esc(d.title)}</span></h2></section>
    <section class="fn-lines">${d.lines.map(l=>`<p>${esc(l)}</p>`).join('')}${d.notes.map(l=>`<p class="fn-note">${esc(l)}</p>`).join('')}</section>
    <section class="fn-roll"><div class="fn-roll-inner">
      <h3>걸어온 길</h3>${d.path.map(p=>`<p><small>${esc(p.act)}</small>${esc(p.name)}</p>`).join('')}
      ${d.people.map(g=>`<h3>${esc(g.label)}</h3><p class="fn-names">${g.names.map(esc).join(' · ')}</p>`).join('')}
      <h3>사마의전</h3><p>『삼국지연의』와 정사를 바탕으로 새로 그린 이야기</p>
    </div></section>
    <section class="fn-end"><div class="fn-seal" aria-label="끝">끝</div>${d.seen?`<p>본 결말 ${d.seen.count}/${d.seen.total}</p>`:''}<button type="button" class="primary fn-go">계속 ▶</button></section>
  </div>`;
  const el=root.querySelector<HTMLElement>('.finale')!,lines=[...el.querySelectorAll<HTMLElement>('.fn-lines p')];
  let skip=still,advance:(()=>void)|undefined;
  const wait=(ms:number)=>skip?Promise.resolve():new Promise<void>(r=>{const t=setTimeout(()=>{advance=undefined;r();},ms);advance=()=>{clearTimeout(t);advance=undefined;r();};});
  el.addEventListener('click',e=>{if((e.target as HTMLElement).closest('button'))return;advance?.();});
  el.querySelector<HTMLButtonElement>('.fn-skip')!.onclick=()=>{skip=true;advance?.();};
  return (async()=>{
    el.classList.add('phase-title');await wait(2600);
    el.classList.add('phase-lines');
    for(const p of lines){p.classList.add('on');await wait(Math.min(5200,1600+[...p.textContent??''].length*45));}
    await wait(900);
    // 자막: 길이에 맞춰 천천히 올린다(누르면 바로 끝으로).
    el.classList.add('phase-roll');
    const inner=el.querySelector<HTMLElement>('.fn-roll-inner')!,rollMs=skip?0:Math.max(7000,inner.scrollHeight*28);
    inner.style.setProperty('--roll-ms',`${rollMs}ms`);await wait(rollMs);
    el.classList.add('phase-end');lines.forEach(p=>p.classList.add('on'));
    await new Promise<void>(r=>{el.querySelector<HTMLButtonElement>('.fn-go')!.onclick=()=>r();});
  })();
}

/**
 * 결말 컷신 전체: 결말 대본의 장면(해설 → 무대) → 종막. 대본이 없으면 종막만.
 * flags: 결말 장면의 when/unless가 읽는 표식(연의·천명의 길에서 고른 선택).
 */
export async function playEndingCutscene(root:HTMLElement,d:FinaleData,o:{id:string;flags?:readonly string[];heading?:string}){
  const script=scriptOf(`ending:${o.id}`),heading=o.heading??`결말 · ${d.title}`;
  if(script){
    const first=script.scenes[0];
    if(script.history?.length&&first)await playNarration(root,{heading,year:script.year,title:script.title,lines:script.history,art:first.art,place:first.place});
    if(document.contains(root))await playScenes(root,script.scenes,{heading,flags:()=>o.flags??[]});
  }
  if(document.contains(root))await playFinale(root,d);
}
/** 결말 id 하나로 다시 보기용 종막 자료(걸어온 길은 그 결말의 갈림길 줄기로 채운다). */
export function replayData(id:string,seen?:FinaleData['seen']):FinaleData{
  const r3=routeById(id),r2=r3?.after?.[0]?routeById(r3.after[0]):undefined,r1=r2?.after?.[0]?routeById(r2.after[0]):undefined;
  const route={...(r1?{1:r1.id}:{}),...(r2?{2:r2.id}:{}),3:id};
  return finaleData(endingFor(route),{route,...(seen?{seen}:{})});
}
