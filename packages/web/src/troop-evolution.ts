/**
 * 병종 진화표 — 병종이 어떻게 강해지는가를 한눈에.
 * 계통마다 1단(기본) → 2단(정예) → 3단(최정예) 카드: 진화 레벨, 능력치 변화(▲), 사거리·이동, 개화 스킬, 겉모습의 변화.
 * 그림은 도감과 같은 병종 그림(2·3단은 단계 장비를 입힌 그림).
 */
import type {UnitClass} from '../../core/src/index.ts';
import {VARIANTS,tierOf,familyOf,profileOf,classTactics} from '../../core/src/index.ts';
import {classNames,evolutionLines,artClass} from './troops.ts';
import {classSprite,paintArmor} from './codex-ui.ts';
import {MOUNTED_FAMILIES,ROBE_FAMILIES,MACHINE_FAMILIES} from './armor.ts';
import {paintedLook} from './painted-troops.ts';

const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export type EvoGroup='all'|'foot'|'spear'|'horse'|'ranged'|'mind'|'siege';
export const EVO_GROUPS:Array<[EvoGroup,string,string[]]>=[
  ['all','전체',[]],['foot','보병',['infantry','bandit','monk']],['spear','창병',['spearman']],['horse','기병',['cavalry','heavyCav','horseArcher']],
  ['ranged','궁·노',['archer','crossbow']],['mind','책사·술사',['strategist','fengshui','shaman','maiden','taoist','physician']],['siege','공성·수군',['engineer','catapult','ram','navy']],
];
const TIER_NAME=['','기본','정예','최정예'];
const KEY:Array<[keyof ReturnType<typeof profileOf>,string]>=[['hp','체력'],['attack','공격'],['defense','방어'],['intellect','지력'],['spirit','정신'],['agility','순발']];

/** 단계마다 겉모습이 어떻게 바뀌는가(armor.ts와 같은 규칙). */
export function lookText(c:UnitClass){
  const painted=paintedLook[c];if(painted)return painted;
  const t=tierOf(c),fam=familyOf(artClass(c));
  if(t===1)return '기본 차림';
  if(MACHINE_FAMILIES.has(fam))return t===2?'쇠를 덧댄 강철 장갑':'금테 두른 장갑 · 깃발';
  if(ROBE_FAMILIES.has(fam))return t===2?'진영 색 망토':'금빛 둥근 빛 · 금테 망토 · 등 깃발';
  const horse=MOUNTED_FAMILIES.has(fam);
  return t===2?`강철 갑주 · 진영 색 망토 · 투구 붉은 술${horse?' · 말에 마의(馬衣)':''}`:`금빛 갑주 · 금테 망토 · 등 깃발 둘 · 투구 금 장식${horse?' · 말 전신 철갑(마갑)':''}`;
}
function card(c:UnitClass,lv:number,prev?:UnitClass){
  const p=profileOf(c),q=prev?profileOf(prev):undefined,v=VARIANTS[c],t=tierOf(c);
  const stat=KEY.map(([k,label])=>{const n=p[k] as number,d=q?n-(q[k] as number):0;return `<span><small>${label}</small><b>${n.toFixed(2)}</b>${d>0.004?`<em>▲${d.toFixed(2)}</em>`:''}</span>`;}).join('');
  const more=[q&&p.movement>q.movement?`이동 ${q.movement}→${p.movement}`:'',q&&(p.range[1]>q.range[1]||p.range[0]<q.range[0])?`사거리 ${q.range[0]}~${q.range[1]}→${p.range[0]}~${p.range[1]}`:'',!q?`이동 ${p.movement} · 사거리 ${p.range[0]}~${p.range[1]}`:''].filter(Boolean).join(' · ');
  const skill=v?.bloom?`<p class="evo-skill"><b>개화 「${esc(v.bloom.name)}」</b> ${esc(v.bloom.description)}</p>`:classTactics(c).slice(0,1).map(x=>`<p class="evo-skill"><b>전법 「${esc(x.name)}」</b> ${esc(x.description)}</p>`).join('');
  return `<article class="evo-card t${t}"><div class="evo-top">${classSprite(c)}<div><small>${'◆'.repeat(t)} ${TIER_NAME[t]}${lv?` · Lv.${lv}에 진화`:' · 처음부터'}</small><h4>${esc(classNames[c]??c)}</h4></div></div>
    <div class="evo-stats">${stat}</div>${more?`<p class="evo-more">${more}</p>`:''}${skill}<p class="evo-look">겉모습 · ${esc(lookText(c))}</p></article>`;
}
export function evolutionChart(group:EvoGroup='all'){
  const fams=EVO_GROUPS.find(g=>g[0]===group)![2];
  const lines=evolutionLines().filter(l=>!fams.length||fams.includes(familyOf(l[0]![0])));
  return `<div class="evo-tabs">${EVO_GROUPS.map(([id,name])=>`<button data-evo-group="${id}" class="${id===group?'active':''}">${name}</button>`).join('')}<span class="muted">${lines.length}계통 · 모두 3단 진화</span></div>
  <div class="evo-lines">${lines.map(l=>`<section class="evo-line"><h3>${esc(classNames[l[0]![0]]??l[0]![0])} 계통 <small>${esc(classNames[familyOf(l[0]![0])]??'')} 계열 · ${l.map(([,lv],i)=>i?`Lv.${lv}`:'Lv.1').join(' → ')}</small></h3>
    <div class="evo-row">${l.map(([c,lv],i)=>`${i?'<i class="evo-arrow2">▶</i>':''}${card(c,lv,i?l[i-1]![0]:undefined)}`).join('')}</div></section>`).join('')}</div>`;
}
export {paintArmor};
