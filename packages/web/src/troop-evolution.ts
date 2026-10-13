/**
 * 병종 진화표 — 병종이 어떻게 강해지는가를 한눈에.
 * 계통마다 1단(기본) → 2단(정예) → 3단(최정예) → 4단(전설) 카드.
 * 그림은 도감과 같은 완성 병종 원화다.
 */
import {officerClass as classByName} from './officer-perks.ts';
import type {UnitClass} from '../../core/src/index.ts';
import {VARIANTS,tierOf,familyOf,profileOf,classTactics,reachOffsets,reachLabel,troopEffectOf,troopEffectText,OFFICER_EFFECTS,FAMED_OFFICERS,topAbility,finalClassOf,unitReachLabel} from '../../core/src/index.ts';
import {romanceByName,signatureSkill,signatureSkills} from './romance.ts';
import {classNames,evolutionLines,troopSheets} from './troops.ts';
import {classSprite,paintArmor} from './codex-ui.ts';
import {classTraitSummary} from './perks.ts';
import {officerManifest,officerEntry,officerModelSheets,type OfficerEntry} from './officer-models.ts';
import {NPC_ROSTER} from './npc-roster.ts';
import {singleStageCorrectionRows} from './complete-troops.ts';
import {LORD_NAMES} from './lords.ts';
import {officerFaction,OFFICER_FACTIONS,type OfficerFaction} from './officer-factions.ts';
import {paintedTroopArt} from './painted-troops.ts';
import {spriteAtlas,type AtlasFit} from './sprite-atlas.ts';

const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export type EvoGroup='all'|'foot'|'spear'|'horse'|'ranged'|'mind'|'siege'|'single'|'npc';
export const EVO_GROUPS:Array<[EvoGroup,string,string[]]>=[
  ['all','전체',[]],['foot','보병',['infantry','bandit','monk']],['spear','창병',['spearman']],['horse','기병',['cavalry','heavyCav','horseArcher']],
  ['ranged','궁·노',['archer','crossbow']],['mind','책사·술사',['strategist','fengshui','shaman','maiden','taoist']],['siege','공성·수군',['engineer','catapult','ram','navy']],['single','단일',[]],['npc','NPC',[]],
];
const TIER_NAME=['','기본','정예','최정예','전설','신화'];
/** 평타가 닿는 칸을 작은 격자로(가운데 = 자기). 진화할수록 넓어지는 모양이 한눈에 보인다. */
function reachMini(c:UnitClass,famed=false){
  const p=profileOf(c),cells=new Set(reachOffsets({unitClass:c,range:famed?famedRange(c):p.range,...(famed?{famedReach:true}:{})}).map(o=>o.x+','+o.y)),r=Math.max(2,...[...cells].map(k=>Math.max(...k.split(',').map(n=>Math.abs(+n)))));
  let g='';for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++)g+=`<i class="${x===0&&y===0?'me':cells.has(x+','+y)?'on':''}"></i>`;
  return `<div class="evo-reach" style="--n:${2*r+1}" role="img" aria-label="공격 범위 ${esc(famed?unitReachLabel({unitClass:c,range:famedRange(c),famedReach:true}):reachLabel(c))}">${g}</div>`;
}
/** 이름난 장수의 사거리: 그 계통 마지막 진화 병종을 넘지 않는다. */
const famedRange=(c:UnitClass):readonly [number,number]=>{const p=profileOf(c).range,top=profileOf(finalClassOf(c)).range;return [p[0],Math.max(p[1],top[1])];};
function card(c:UnitClass,lv:number,prev?:UnitClass){
  const p=profileOf(c),q=prev?profileOf(prev):undefined,v=VARIANTS[c],t=tierOf(c);
  const grew=!!prev&&(reachLabel(prev)!==reachLabel(c)||p.range[1]>q!.range[1]);
  const tactic=v?.bloom?{name:v.bloom.name,description:classTraitSummary(v.traits)||v.bloom.description}:classTactics(c)[0];
  return `<article class="evo-card t${t}"><div class="evo-top">${classArt(c)}<div><small>${'◆'.repeat(t)} ${TIER_NAME[t]}${lv?` · Lv.${lv}`:''}</small><h4>${esc(classNames[c]??c)}</h4></div></div>
    <div class="evo-range">${reachMini(c)}<p><b class="${grew?'up':''}">${esc(reachLabel(c))}${grew?' ▲':''}</b><span>사거리 ${p.range[0]===p.range[1]?p.range[0]:p.range[0]+'~'+p.range[1]} · 이동 ${p.movement}</span></p></div>
    ${tactic?`<p class="evo-skill" title="${esc(tactic.description)}"><b>${v?.bloom?'개화':'전법'} 「${esc(tactic.name)}」</b>${v?.bloom&&tactic.description?`<span>${esc(tactic.description)}</span>`:''}</p>`:''}${troopNote(c)}</article>`;
}
/** 부대효과: 이 단계의 수치와 1~4단계 수치 줄(지금 단계 강조). */
function troopNote(c:UnitClass){
  const fx=troopEffectOf(c);if(!fx)return '';
  const steps=fx.effect.values.map((v,i)=>i+1===fx.tier?`<b>${v}</b>`:String(v)).join(' / ');
  return `<p class="evo-skill evo-troop" title="${esc(troopEffectText(fx.effect))}"><b>부대효과 「${esc(fx.effect.name)}」</b><span>${esc(troopEffectText(fx.effect,fx.tier))}</span>${fx.effect.values.length>1?`<span class="evo-steps">단계별 ${steps}</span>`:''}</p>`;
}
/** 그림 칸마다 여백이 달라 병종끼리 크기가 들쭉날쭉하다(민중은 작고 기병·배는 크다).
 * 진화표에서는 대기 자세의 실제 그림 둘레를 재서 같은 상자에 꽉 차게 다시 그린다(fitEvoSprites). 그 전에는 원래 그림을 보인다. */
const fitCanvas=(sheet:string,row:number)=>`<canvas class="evo-fit" data-fit="${esc(sheet)}" data-row="${row}"></canvas>`;
function classArt(c:UnitClass){
  const p=paintedTroopArt[c];if(!p)return classSprite(c);
  return `<div class="cx-sprite" role="img" aria-label="${esc(classNames[c]??c)}" style="background-image:var(--${p.sheet}-atlas);background-size:400% ${p.rows*100}%;background-position:0 ${p.rows>1?p.row/(p.rows-1)*100:0}%">${fitCanvas(p.sheet,p.row)}</div>`;
}
// 시트 칸을 그대로 잘라 보이면 칸을 넘는 창끝이 잘리고 이웃 행의 조각이 끼어든다: 전장과 같은 분리 아틀라스(실루엣을 제 칸에 모은 것)에서 대기 자세를 그린다.
const officerArt=(name:string,b:OfficerEntry["battle"][string])=>`<div class="cx-sprite" role="img" aria-label="${esc(name)}"><canvas class="evo-fit" data-fit="${esc(b.sheet)}" data-row="0" data-rows="${b.rows}" data-uniform="1"></canvas></div>`;
const rangeLine=(c:UnitClass,famed=false)=>{const p=profileOf(c),rg=famed?famedRange(c):p.range;return `<div class="evo-range">${reachMini(c,famed)}<p><b>${esc(classNames[c]??c)} · ${esc(famed?unitReachLabel({unitClass:c,range:rg,famedReach:true}):reachLabel(c))}</b><span>사거리 ${rg[0]===rg[1]?rg[0]:rg[0]+'~'+rg[1]} · 이동 ${p.movement}</span></p></div>`;};
const personCard=(art:string,small:string,name:string,c:UnitClass,extra='',famed=false)=>`<article class="evo-card evo-person-card"><div class="evo-top">${art}<div><small>${small}</small><h4>${esc(name)}</h4></div></div>${rangeLine(c,famed)}${extra}</article>`;
/** 장수의 병종: 군주 9명과 서초패왕 항우는 군주, 나머지는 전용 전투 그림의 첫 병종(제갈량 수레 제외). */
// 전투 그림이 없는 장수(제갈량전에서 새로 나온 인물 등)는 이름으로 정한 병종을 쓴다.
const officerClass=(e:OfficerEntry):UnitClass=>(LORD_NAMES.includes(e.name)?'lord':Object.keys(e.battle).find(k=>k!=='cart'&&k!=='sd')??classByName(e.name)) as UnitClass;
const officerSheet=(e:OfficerEntry,c:string)=>e.battle[c]??e.battle.lord??Object.entries(e.battle).find(([k])=>k!=='cart')?.[1];
/** 이름있는 장수의 고유특성(장수마다 이름도 효과도 다르다). 목록 밖 인물은 병종이라 장수 탭에 나오지 않는다. */
function officerNote(name:string,c?:UnitClass){
  const gs=signatureSkills(name);if(!gs.length)return '';
  const te=c?troopEffectOf(c):undefined;
  const troop=te?`<p class="evo-skill evo-troop" title="${esc(troopEffectText(te.effect))}"><b>병종 특성 「${esc(te.effect.name)}」</b><span>${esc(troopEffectText(te.effect))} (병종 1~4단계 · 장수도 함께 쓴다)</span></p>`:'';
  return troop+gs.map((g,k)=>`<p class="evo-skill evo-troop" title="${esc(g.description)}"><b>고유특성 ${k+1} 「${esc(g.name)}」</b><span>${esc(g.description)} (${esc(g.unlock)})</span></p>`).join('');
}
/** 장수 도감: 고유특성이 있는 이름있는 장수만(목록 밖 인물은 병종으로 처리). 병종 진화표와 따로 본다. */
const namedManifest=()=>officerManifest.filter(e=>!!signatureSkill(e.name));
export const namedOfficerCount=()=>namedManifest().length;
function officerCards(f:OfficerFaction){
  const list=namedManifest().filter(e=>officerFaction(e.name)===f);if(!list.length)return '';
  return `<section class="evo-line"><h3>${f} <small>${list.length}명</small></h3><div class="evo-grid">${list.map(e=>{const c=officerClass(e),b=officerSheet(e,c);return personCard(b?officerArt(e.name,b):classArt(c),'장수',e.name,c,officerNote(e.name,c),FAMED_OFFICERS.includes(e.name));}).join('')}</div></section>`;
}
/** 장수 도감 화면 본문: 위·촉·오·군웅·초·한 탭과 고른 진영의 장수 카드. */
export function officerGallery(f:OfficerFaction='위'){
  const all=namedManifest(),n=(x:OfficerFaction)=>all.filter(e=>officerFaction(e.name)===x).length;
  return `<div class="evo-tabs">${OFFICER_FACTIONS.map(x=>`<button data-officer-faction="${x}" class="${x===f?'active':''}">${x} <small>${n(x)}</small></button>`).join('')}<span class="muted">이름있는 장수 ${all.length}명</span></div><div class="evo-lines">${officerCards(f)}</div>`;
}
/** 본편 전장의 NPC(아군 AI). 한 사람은 카드 한 장·병종 하나다.
 * "곽회 창병"·"조휴 궁수"·"조상 친위"처럼 장수 이름을 단 부대는 따로 세우지 않고 그 장수 카드에 휘하로 적는다. */
const escortOf=(n:typeof NPC_ROSTER[number],all:typeof NPC_ROSTER)=>all.find(o=>o!==n&&n.name.startsWith(o.name+' '));
export const npcList=()=>{const ai=NPC_ROSTER.filter(n=>n.side==='allyAi');return ai.filter(n=>!escortOf(n,ai));};
/** 나오는 장 목록을 화면 글로: ['S1-01','S1-04','S2-02'] → '상편 1·4장 · 중편 2장'(내부 id를 그대로 보이지 않는다). */
function stageList(ids:readonly string[]){
  const arcs=new Map<string,number[]>();
  for(const id of ids){const m=/^([SZ])(\d)-(\d\d)$/.exec(id);const key=m?`${m[1]==='Z'?'제갈량전 ':''}${(m[1]==='S'?['상','중','하']:['상','하'])[Number(m[2])-1]??''}편`:id;const list=arcs.get(key)??[];if(m)list.push(Number(m[3]));arcs.set(key,list);}
  return [...arcs].map(([k,n])=>n.length?`${k} ${n.join('·')}장`:k).join(' · ');
}
function npcCards(){
  const ai=NPC_ROSTER.filter(n=>n.side==='allyAi');
  return `<div class="evo-grid">${npcList().map(n=>{const e=officerEntry({id:'npc',name:n.name}),b=e&&officerSheet(e,LORD_NAMES.includes(e.name)?'lord':n.unitClass);
    const escorts=ai.filter(o=>escortOf(o,ai)===n).map(o=>classNames[o.unitClass]??o.unitClass);
    return personCard(b?officerArt(n.name,b):classArt(n.unitClass),`NPC · ${esc(stageList(n.stages))}`,n.name,n.unitClass,escorts.length?`<p class="evo-escort">휘하 ${esc(escorts.join('·'))} 부대</p>`:'');}).join('')}</div>`;
}
/** 진화하지 않는 단일 병종(민중·물자대·공병·수군 등). */
function singleLines(){
  return (Object.values(singleStageCorrectionRows).flat() as UnitClass[]).filter((c,i,a)=>a.indexOf(c)===i);
}
export function evolutionChart(group:EvoGroup='all'){
  const tabs=(note:string)=>`<div class="evo-tabs">${EVO_GROUPS.map(([id,name])=>`<button data-evo-group="${id}" class="${id===group?'active':''}">${name}</button>`).join('')}<span class="muted">${note}</span></div>`;
  if(group==='npc')return `${tabs('NPC '+npcList().length)}<div class="evo-lines">${npcCards()}</div>`;
  const fams=EVO_GROUPS.find(g=>g[0]===group)![2];
  const lines=group==='single'?[]:evolutionLines().filter(l=>!fams.length||fams.includes(familyOf(l[0]![0])));
  const singles=group==='all'||group==='single'?singleLines():[];
  return `${tabs(`${lines.length?lines.length+'계통':''}${lines.length&&singles.length?' · ':''}${singles.length?'단일 병종 '+singles.length:''}`)}
  <div class="evo-lines">${lines.map(l=>`<section class="evo-line"><h3>${esc(classNames[l[0]![0]]??l[0]![0])} 계통 <small>${esc(classNames[familyOf(l[0]![0])]??'')} 계열</small></h3>
    <div class="evo-row">${l.map(([c,lv],i)=>`${i?'<i class="evo-arrow2">▶</i>':''}${card(c,lv,i?l[i-1]![0]:undefined)}`).join('')}</div></section>`).join('')}
    ${singles.length?`<section class="evo-line evo-single"><h3>단일 병종 <small>진화하지 않는 병종</small></h3>
    <div class="evo-grid">${singles.map(c=>card(c,0)).join('')}</div></section>`:''}</div>`;
}
type SheetDef={id:string;url:string;rows:number;union?:boolean;alphaCutoff?:number;strictGrid?:boolean;fit?:AtlasFit};
const boxes=new Map<string,Promise<{atlas:HTMLCanvasElement;x:number;y:number;w:number;h:number;ch:number}|undefined>>();
/** 진화표는 병종 시트뿐 아니라 장수 전용 시트도 같은 방식으로 잘라 쓴다. */
export function evolutionSheet(sheet:string):SheetDef|undefined{
  return [...troopSheets,...officerModelSheets].find(s=>s.id===sheet);
}
/** 시트 한 줄의 대기 자세(첫 칸)에서 실제 그림이 차지하는 둘레. */
function idleBox(sheet:string,row:number){
  const key=sheet+'#'+row;if(boxes.has(key))return boxes.get(key)!;
  const def=evolutionSheet(sheet);
  const p=!def?Promise.resolve(undefined):spriteAtlas(def.url,def.rows,4,!!def.union,def.alphaCutoff??8,!!def.strictGrid,def.fit).then(atlas=>{
    const cw=Math.floor(atlas.width/4),ch=Math.floor(atlas.height/def.rows),top=row*ch,d=atlas.getContext('2d',{willReadFrequently:true})!.getImageData(0,top,cw,ch).data;
    let l=cw,t=ch,r=-1,b=-1;
    for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)if(d[(y*cw+x)*4+3]!>24){if(x<l)l=x;if(x>r)r=x;if(y<t)t=y;if(y>b)b=y;}
    return r<0?undefined:{atlas,x:l,y:top+t,w:r-l+1,h:b-t+1,ch};
  }).catch(()=>undefined);
  boxes.set(key,p);return p;
}
/** 원본 시트(자르기 전)를 한 번만 받는다. 아틀라스(작업자가 칸마다 실루엣을 모으는 일)는 장수 44명이면 수십 초 걸리므로,
 * 그동안 원본 첫 칸을 바로 그려 카드가 비어 보이지 않게 한다. */
const rawSheets=new Map<string,Promise<HTMLImageElement|undefined>>();
function rawSheet(url:string){
  let p=rawSheets.get(url);
  if(!p){p=new Promise<HTMLImageElement|undefined>(ok=>{const img=new Image();img.decoding='async';img.onload=()=>ok(img);img.onerror=()=>ok(undefined);img.src=url;})
    .then(async img=>{await img?.decode?.().catch(()=>undefined);return img;});rawSheets.set(url,p);}
  return p;
}
/** 진화표·장수 도감의 그림 시트를 미리 받아 둔다(도감 첫 화면에서 부른다). 실패해도 화면은 그대로 열린다. */
export function preloadOfficerGallery(f:OfficerFaction='위',limit=16){
  if(typeof Image==='undefined')return;
  for(const e of namedManifest().filter(x=>officerFaction(x.name)===f).slice(0,limit)){const b=officerSheet(e,officerClass(e));const def=b&&evolutionSheet(b.sheet);if(def)void rawSheet(def.url);}
}
const FIT_W=320,FIT_H=256;
/** 원본 시트의 대기 자세 칸을 그대로 재서 그린다(아틀라스가 오기 전의 빠른 그림). 키 맞춤(fit)이 있는 시트는 아틀라스와 같은 키로. */
async function quickFit(el:HTMLCanvasElement){
  const def=evolutionSheet(el.dataset.fit!),row=Number(el.dataset.row??0);if(!def)return false;
  const img=await rawSheet(def.url);if(!img||!el.isConnected||el.classList.contains('on'))return false;
  const cw=Math.floor(img.naturalWidth/4),ch=Math.floor(img.naturalHeight/def.rows);if(!cw||!ch)return false;
  const tmp=document.createElement('canvas');tmp.width=cw;tmp.height=ch;const t=tmp.getContext('2d',{willReadFrequently:true})!;
  t.drawImage(img,0,row*ch,cw,ch,0,0,cw,ch);
  const d=t.getImageData(0,0,cw,ch).data;let l=cw,tp=ch,r=-1,b=-1;
  for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)if(d[(y*cw+x)*4+3]!>24){if(x<l)l=x;if(x>r)r=x;if(y<tp)tp=y;if(y>b)b=y;}
  if(r<0)return false;
  const w0=r-l+1,h0=b-tp+1,stand=def.fit?FIT_H*1.35*def.fit.height/h0:FIT_H*1.35/ch;
  const k=Math.min(stand,FIT_W*.96/w0,FIT_H*.94/h0),w=w0*k,h=h0*k,g=el.getContext('2d')!;
  el.width=FIT_W;el.height=FIT_H;g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
  g.drawImage(tmp,l,tp,w0,h0,(FIT_W-w)/2,FIT_H*.96-h,w,h);el.classList.add('on','quick');return true;
}
/** 아틀라스로 다시 그린다(칸을 넘는 창끝·이웃 칸 조각까지 정리된 그림). */
async function atlasFit(el:HTMLCanvasElement){
  const box=await idleBox(el.dataset.fit!,Number(el.dataset.row??0));if(!box||!el.isConnected)return;
  const W=FIT_W,H=FIT_H,g=el.getContext('2d')!;
  // 병종·장수·NPC 모두 한 축척: 아틀라스가 이미 모든 병사·장수의 서 있는 키를 칸 높이에 맞춰 두었으므로 칸 높이 기준으로 그린다
  // (그림마다 둘레에 맞추면 기병·긴 창은 작아지고 책사·민중은 커진다). 그래도 넓어 상자를 넘는 그림만 그만큼 줄인다.
  const k=Math.min(H*1.35/box.ch,W*.96/box.w,H*.94/box.h),w=box.w*k,h=box.h*k;
  el.width=W;el.height=H;g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
  g.drawImage(box.atlas,box.x,box.y,box.w,box.h,(W-w)/2,H*.96-h,w,h);el.classList.remove('quick');el.classList.add('on','fitted');
}
let evoObserver:IntersectionObserver|undefined;
const nearView=(el:Element)=>{const r=el.getBoundingClientRect();return r.bottom>-200&&r.top<innerHeight+200&&r.right>-200&&r.left<innerWidth+200;};
/** 진화표의 모든 병종·장수·NPC 그림을 같은 상자 크기로 맞춘다: 그림 둘레가 가로형 상자(5:4) 폭 96%·높이 90% 안에 꽉 차고 발은 같은 선에 선다.
 * 1) 원본 시트 첫 칸으로 바로 그리고(화면에 보이는 카드부터), 2) 아틀라스 자르기는 화면에 들어온 카드만 차례로 맡긴다
 * — 예전에는 장수 44명의 아틀라스를 한꺼번에 맡겨 첫 화면 카드도 십수 초 비어 있었다. */
export async function fitEvoSprites(root:ParentNode=document){
  const els=[...root.querySelectorAll<HTMLCanvasElement>('canvas.evo-fit:not(.fitted)')];
  if(!els.length)return;
  evoObserver?.disconnect();
  const seen=evoObserver=typeof IntersectionObserver==='undefined'?undefined:new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){seen!.unobserve(e.target);void atlasFit(e.target as HTMLCanvasElement);}},{rootMargin:'200px'});
  const first=els.filter(nearView),later=els.filter(el=>!first.includes(el));
  await Promise.all(first.map(el=>quickFit(el).catch(()=>false)));
  if(!seen){await Promise.all(els.map(atlasFit));return;}
  for(const el of first)seen.observe(el);
  // 나머지 카드: 빠른 그림은 한가할 때 조금씩, 아틀라스는 화면에 들어올 때.
  for(let i=0;i<later.length;i+=6){await new Promise(r=>setTimeout(r,0));await Promise.all(later.slice(i,i+6).map(el=>quickFit(el).catch(()=>false)));}
  for(const el of later)if(el.isConnected)seen.observe(el);
}
export {paintArmor};
