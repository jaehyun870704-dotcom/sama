/**
 * 에필로그 컷신 — 결말 종막 뒤, 걸어온 전장을 되돌아보고 그 뒤의 세월을 넘긴다.
 *   ① 표제(에필로그 · 때 · 제목)
 *   ② 회상: 전장마다 그 무대가 천천히 떠오르고, 인장으로 갈린 한 줄이 적힌다(아래 점이 지나온 자리)
 *   ③ 연표: 배경이 바뀌며 해마다 한 줄씩 먹으로 쌓인다
 *   ④ 맺음: 마지막 말과 이번 길의 기록, 「연의 회상」 단추
 * 어느 때든 「건너뛰기」로 맺음까지 넘기고, 화면을 누르면 지금 장면을 바로 마친다.
 */
import {isoScene} from './story-iso.ts';

export interface EpilogueData {
  eyebrow:string;title:string;
  /** 회상: 전장 하나에 한 장면 */
  beats:ReadonlyArray<{when:string;name:string;art:number;place:string;line:string;kept:boolean}>;
  /** 연표: 그 뒤의 세월 */
  years:ReadonlyArray<{year:string;line:string;art:number;place:string}>;
  /** 맺음 말 */
  closing:readonly string[];
  /** 이번 길의 기록 */
  stats:ReadonlyArray<{label:string;value:string}>;
  /** 마지막 단추 글 */
  button:string;
  /** 회상 도장 글(지켜 낸 · 놓친 — 없으면 '지켜 냄' · '남은 값') */
  marks?:{kept:string;lost:string};
}
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const sceneUrl=(art:number,place:string)=>{try{return isoScene(art,place).url;}catch{return '';}};

/** 에필로그를 root 안에 그린다. 끝나면(마지막 단추) resolve. */
export function playEpilogue(root:HTMLElement,d:EpilogueData):Promise<void>{
  const still=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.innerHTML=`<div class="epilogue-cut${still?' still':''}${d.marks?' two-way':''}" role="dialog" aria-label="${esc(d.eyebrow)} · ${esc(d.title)}">
    <div class="ep-bg"></div><div class="ep-bg"></div><div class="ep-veil"></div>
    <button type="button" class="fn-skip ep-skip">건너뛰기 ⏭</button>
    <section class="ep-cover"><div class="ep-eyebrow">${esc(d.eyebrow)}</div><h2><span>${esc(d.title)}</span></h2></section>
    <section class="ep-beat" aria-live="polite"><div class="ep-tag"><b></b><span></span></div><p class="ep-line"></p><div class="ep-mark"></div></section>
    <ol class="ep-dots" aria-hidden="true">${d.beats.map(b=>`<li class="${b.kept?'kept':''}"></li>`).join('')}</ol>
    <section class="ep-years"><ol>${d.years.map(y=>`<li><b>${esc(y.year)}</b><span>${esc(y.line)}</span></li>`).join('')}</ol></section>
    <section class="ep-close"><h2>${esc(d.title)}</h2>${d.closing.map(l=>`<p>${esc(l)}</p>`).join('')}
      <dl class="ep-stats">${d.stats.map(s=>`<div><dt>${esc(s.label)}</dt><dd>${esc(s.value)}</dd></div>`).join('')}</dl>
      <button type="button" class="primary ep-go">${esc(d.button)}</button></section>
  </div>`;
  const el=root.querySelector<HTMLElement>('.epilogue-cut')!,bgs=[...el.querySelectorAll<HTMLElement>('.ep-bg')];
  const beat=el.querySelector<HTMLElement>('.ep-beat')!,dots=[...el.querySelectorAll<HTMLElement>('.ep-dots li')],years=[...el.querySelectorAll<HTMLElement>('.ep-years li')];
  let front=0,skip=still,advance:(()=>void)|undefined;
  /** 한 번에 한 단계만 비춘다. */
  const phase=(n:'cover'|'beats'|'years'|'close')=>{el.classList.remove('phase-cover','phase-beats','phase-years','phase-close');el.classList.add(`phase-${n}`);};
  /** 배경을 맞바꾼다(두 겹을 번갈아 비추어 부드럽게 넘어가게). */
  const show=(art:number,place:string)=>{const url=sceneUrl(art,place);front=1-front;const b=bgs[front]!;
    b.style.backgroundImage=url?`url(${url})`:'';b.classList.remove('on');void b.offsetWidth;b.classList.add('on');bgs[1-front]!.classList.remove('on');};
  const wait=(ms:number)=>skip?Promise.resolve():new Promise<void>(r=>{const t=setTimeout(()=>{advance=undefined;r();},ms);advance=()=>{clearTimeout(t);advance=undefined;r();};});
  const read=(s:string,min=2400)=>Math.min(6200,min+[...s].length*55);
  el.addEventListener('click',e=>{if((e.target as HTMLElement).closest('button'))return;advance?.();});
  el.querySelector<HTMLButtonElement>('.ep-skip')!.onclick=()=>{skip=true;advance?.();};
  return (async()=>{
    const first=d.beats[0]??d.years[0];if(first)show(first.art,first.place);
    phase('cover');await wait(2800);
    phase('beats');
    for(const [i,b] of d.beats.entries()){if(skip)break;
      if(i)show(b.art,b.place);
      beat.classList.remove('on');beat.classList.toggle('kept',b.kept);
      beat.querySelector('.ep-tag b')!.textContent=b.when;beat.querySelector('.ep-tag span')!.textContent=b.name;beat.querySelector('.ep-line')!.textContent=b.line;
      beat.querySelector('.ep-mark')!.textContent=b.kept?(d.marks?.kept??'지켜 냄'):(d.marks?.lost??'남은 값');
      dots.forEach((dot,j)=>{dot.classList.toggle('now',j===i);dot.classList.toggle('past',j<i);});
      await wait(60);beat.classList.add('on');await wait(read(b.line));
    }
    phase('years');beat.classList.remove('on');
    const list=el.querySelector<HTMLElement>('.ep-years ol')!,box=el.querySelector<HTMLElement>('.ep-years')!;
    for(const [i,y] of d.years.entries()){if(skip)break;show(y.art,y.place);
      const li=years[i]!;years.forEach((o,j)=>o.classList.toggle('past',j<i));li.classList.add('on');
      // 지금 해를 화면 가운데로 끌어올린다(지난 해는 위로 흐려지며 물러난다).
      list.style.transform=`translateY(${Math.round(box.clientHeight*.5-li.offsetTop-li.offsetHeight/2)}px)`;
      await wait(read(y.line,2600));}
    phase('close');years.forEach(y=>y.classList.add('on'));
    const last=d.years.at(-1)??d.beats.at(-1);if(last&&skip)show(last.art,last.place);
    await new Promise<void>(r=>{el.querySelector<HTMLButtonElement>('.ep-go')!.onclick=()=>r();});
  })();
}
