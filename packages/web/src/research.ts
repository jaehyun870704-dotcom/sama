/**
 * 연구 — 회차를 넘어 남는 영구 강화(로그라이크의 메타 진행).
 *
 * 전투·내정·편성 세 갈래의 나무. 칸마다 단계(랭크)가 있고 천명으로 한 단계씩 올린다.
 * 앞 칸을 배워야 다음 칸이 열리고(선행), 어떤 칸은 회차를 거듭해야만 열린다(조건: 회차 수·이긴 연의 전장·본 결말).
 * 그래서 처음엔 몇 칸만 보이고, 여러 번 죽고 다시 걸을수록 나무가 서서히 열린다.
 *
 * 전투 칸은 아군 전원(또는 사마의)에게 특성을 입히고(perks.ts), 내정·편성 칸은 원정의 규칙 수치를 바꾼다.
 */
import type {MetaState} from './meta.ts';
import type {PerkGrant,PerkGrants} from './perks.ts';

export type ResearchTab='battle'|'domestic'|'formation'|'legend';
export const RESEARCH_TABS:Array<{id:ResearchTab;name:string;blurb:string}>=[
  {id:'battle',name:'전투',blurb:'전투에서 쓰이는 기술을 연구한다. 아군 전원에게 적용된다.'},
  {id:'domestic',name:'내정',blurb:'군영을 다스려 경험치·회복·천명을 늘린다.'},
  {id:'formation',name:'편성',blurb:'부대를 짜는 법을 연구한다. 장수 효과 칸과 사마의를 강하게 한다.'},
  {id:'legend',name:'고사',blurb:'사백 년 전 초한 영웅들의 고사에서 배운다. 여러 생을 거쳐야 열린다.'},
];
export interface Gate {runs?:number;chronicle?:number;endings?:number;wins?:number;officerLv?:number}
export interface ResearchNode {
  id:string;tab:ResearchTab;name:string;glyph:string;
  /** 나무 그림의 자리(열·행) */
  col:number;row:number;
  max:number;
  /** 다음 단계 비용(지금 단계 r → r+1) */
  cost:(r:number)=>number;
  requires?:Array<[string,number]>;
  gate?:Gate;
  /** r단계일 때의 효과 설명 */
  effect:(r:number)=>string;
  /** 전투 특성: 아군 전원(또는 사마의만)에게 단계당 n */
  perk?:{trait:string;per:number;hero?:true};
}
const c=(base:number,step:number)=>(r:number)=>base+step*r;
export const RESEARCH:ResearchNode[]=[
  // ── 전투 ──
  {id:'drill',tab:'battle',name:'조련',glyph:'조',col:0,row:1,max:3,cost:c(2,1),effect:r=>`물리 공격 피해 +${r*3}%`,perk:{trait:'physicalPower',per:3}},
  {id:'archery',tab:'battle',name:'궁술',glyph:'궁',col:1,row:0,max:2,cost:c(3,1),requires:[['drill',1]],effect:r=>`두 칸 이상 물리 공격 +${r*5}%`,perk:{trait:'rangedPower',per:5}},
  {id:'aim',tab:'battle',name:'정조',glyph:'정',col:2,row:0,max:3,cost:c(3,1),requires:[['archery',1]],effect:r=>`명중 +${r*4}%p`,perk:{trait:'accuracyBoost',per:4}},
  {id:'volley',tab:'battle',name:'일제사격',glyph:'일',col:3,row:0,max:2,cost:c(5,2),requires:[['aim',2]],gate:{chronicle:5},effect:r=>`두 칸 이상 물리 공격 +${r*5}%`,perk:{trait:'rangedPower',per:5}},
  {id:'blade',tab:'battle',name:'연마',glyph:'연',col:1,row:1,max:2,cost:c(3,1),requires:[['drill',1]],effect:r=>`회심 확률 +${r*4}%`,perk:{trait:'critical',per:4}},
  {id:'pierce',tab:'battle',name:'파갑술',glyph:'파',col:2,row:1,max:3,cost:c(4,1),requires:[['blade',1]],gate:{chronicle:2},effect:r=>`적 방어 ${r*6}% 무시`,perk:{trait:'penetrate',per:6}},
  {id:'vanguard',tab:'battle',name:'선봉',glyph:'선',col:3,row:1,max:2,cost:c(5,2),requires:[['pierce',1]],gate:{runs:2},effect:r=>`움직인 뒤 물리 공격 +${r*6}%`,perk:{trait:'chargePower',per:6}},
  {id:'unrivaled',tab:'battle',name:'무쌍',glyph:'무',col:4,row:1,max:1,cost:c(12,0),requires:[['vanguard',2]],gate:{endings:1},effect:r=>`물리 공격 피해 +${r*8}%`,perk:{trait:'physicalPower',per:8}},
  {id:'stratagem',tab:'battle',name:'병법',glyph:'병',col:1,row:2,max:3,cost:c(3,1),requires:[['drill',1]],effect:r=>`책략 공격 피해 +${r*4}%`,perk:{trait:'strategyPower',per:4}},
  {id:'insight',tab:'battle',name:'간파',glyph:'간',col:2,row:2,max:2,cost:c(4,1),requires:[['stratagem',1]],effect:r=>`적 책략 명중 -${r*5}%p`,perk:{trait:'strategyEvasion',per:5}},
  {id:'arcana',tab:'battle',name:'비전',glyph:'비',col:3,row:2,max:2,cost:c(5,2),requires:[['insight',1]],gate:{runs:3},effect:r=>`책략 공격 피해 +${r*5}%`,perk:{trait:'strategyPower',per:5}},
  {id:'calm',tab:'battle',name:'정심',glyph:'정',col:4,row:2,max:3,cost:c(5,1),requires:[['arcana',1]],gate:{chronicle:8},effect:r=>`차례 시작에 MP +${r}`,perk:{trait:'manaRegen',per:1}},
  {id:'armor',tab:'battle',name:'갑주',glyph:'갑',col:0,row:3,max:3,cost:c(2,1),effect:r=>`받는 물리 피해 -${r*3}%`,perk:{trait:'physicalDamageReduction',per:3}},
  {id:'ward',tab:'battle',name:'정신 수양',glyph:'정',col:1,row:3,max:3,cost:c(3,1),requires:[['armor',1]],effect:r=>`받는 책략 피해 -${r*4}%`,perk:{trait:'strategyDamageReduction',per:4}},
  {id:'seasoned',tab:'battle',name:'노련',glyph:'노',col:2,row:3,max:2,cost:c(4,1),requires:[['ward',1]],gate:{runs:2},effect:r=>`체력 절반 이하에서 받는 피해 -${r*8}%`,perk:{trait:'veteran',per:8}},
  {id:'camp',tab:'battle',name:'재정비',glyph:'재',col:3,row:3,max:2,cost:c(5,2),requires:[['seasoned',1]],gate:{chronicle:6},effect:r=>`차례 시작에 체력 ${r*3}% 회복`,perk:{trait:'regen',per:3}},
  {id:'ironwall',tab:'battle',name:'철벽',glyph:'철',col:4,row:3,max:1,cost:c(12,0),requires:[['camp',1]],gate:{endings:1},effect:r=>`받는 모든 피해 -${r*5}%`,perk:{trait:'defenseBoost',per:5}},
  // ── 내정 ──
  {id:'training',tab:'domestic',name:'훈련장',glyph:'훈',col:0,row:0,max:3,cost:c(2,1),effect:r=>`전투 경험치 +${r*10}%`},
  {id:'academy',tab:'domestic',name:'강무당',glyph:'강',col:1,row:0,max:2,cost:c(5,2),requires:[['training',2]],gate:{runs:3},effect:r=>`전투 경험치 +${r*10}%`},
  {id:'medic',tab:'domestic',name:'의원',glyph:'의',col:0,row:1,max:2,cost:c(2,1),effect:r=>`휴식 회복량 +${r*15}%`},
  {id:'herbal',tab:'domestic',name:'약초원',glyph:'약',col:1,row:1,max:2,cost:c(4,1),requires:[['medic',1]],gate:{chronicle:3},effect:r=>`회복 책략의 회복량 +${r*10}%`,perk:{trait:'healPower',per:10}},
  {id:'granary',tab:'domestic',name:'군량',glyph:'군',col:0,row:2,max:3,cost:c(3,2),gate:{runs:1},effect:r=>`회차가 끝날 때 천명 +${r}`},
  {id:'tribute',tab:'domestic',name:'공물',glyph:'공',col:1,row:2,max:1,cost:c(10,0),requires:[['granary',2]],gate:{endings:1},effect:r=>`회차가 끝날 때 천명 +${r*2}`},
  {id:'archive',tab:'domestic',name:'서고',glyph:'서',col:2,row:0,max:2,cost:c(5,1),requires:[['academy',1]],gate:{chronicle:10},effect:r=>`책략 공격 피해 +${r*3}%`,perk:{trait:'strategyPower',per:3}},
  // ── 편성 ──
  {id:'temper',tab:'formation',name:'단련',glyph:'단',col:0,row:0,max:3,cost:c(3,2),effect:r=>`새 회차의 사마의 Lv +${r}`},
  {id:'elite',tab:'formation',name:'정예 모병',glyph:'정',col:1,row:0,max:3,cost:c(3,1),requires:[['temper',1]],effect:r=>`영입·귀순 장수 Lv +${r}`},
  {id:'guard',tab:'formation',name:'호신',glyph:'호',col:0,row:1,max:3,cost:c(2,1),effect:r=>`사마의가 받는 모든 피해 -${r*4}%`,perk:{trait:'defenseBoost',per:4,hero:true}},
  {id:'drillForm',tab:'formation',name:'진형 훈련',glyph:'진',col:1,row:1,max:3,cost:c(3,1),requires:[['guard',1]],gate:{runs:1},effect:r=>`적 명중 -${r*3}%p`,perk:{trait:'evasionBoost',per:3}},
  {id:'slot',tab:'formation',name:'장수 효과 칸',glyph:'장',col:2,row:1,max:1,cost:c(8,0),requires:[['drillForm',1]],gate:{officerLv:10},effect:r=>`장수 효과 장착 칸 +${r}`},
  {id:'slot2',tab:'formation',name:'명장의 그릇',glyph:'명',col:3,row:1,max:1,cost:c(14,0),requires:[['slot',1]],gate:{endings:1},effect:r=>`장수 효과 장착 칸 +${r}`},
  // ── 고사(초한) ──
  {id:'jiangdong',tab:'legend',name:'강동 팔천',glyph:'강',col:0,row:0,max:2,cost:c(6,2),gate:{runs:3},effect:r=>`물리 공격 피해 +${r*4}%`,perk:{trait:'physicalPower',per:4}},
  {id:'burnboats',tab:'legend',name:'파부침주',glyph:'파',col:1,row:0,max:2,cost:c(7,2),requires:[['jiangdong',1]],effect:r=>`체력이 낮을수록 공격력 상승(최대 +${r*10}%)`,perk:{trait:'lastStand',per:10}},
  {id:'hongmenLore',tab:'legend',name:'홍문의 칼',glyph:'홍',col:2,row:0,max:2,cost:c(8,3),requires:[['burnboats',1]],gate:{endings:1},effect:r=>`회심 확률 +${r*5}%`,perk:{trait:'critical',per:5}},
  {id:'tactics',tab:'legend',name:'운주유악',glyph:'운',col:0,row:1,max:2,cost:c(6,2),gate:{runs:4},effect:r=>`책략 공격 피해 +${r*5}%`,perk:{trait:'strategyPower',per:5}},
  {id:'fourSongsLore',tab:'legend',name:'사면초가',glyph:'사',col:1,row:1,max:2,cost:c(8,2),requires:[['tactics',1]],gate:{endings:2},effect:r=>`적 명중 -${r*4}%p`,perk:{trait:'evasionBoost',per:4}},
  {id:'backwaterLore',tab:'legend',name:'배수진',glyph:'배',col:0,row:2,max:2,cost:c(6,2),gate:{chronicle:4},effect:r=>`체력 절반 이하에서 받는 피해 -${r*8}%`,perk:{trait:'veteran',per:8}},
  {id:'ledger',tab:'legend',name:'소하의 장부',glyph:'소',col:1,row:2,max:2,cost:c(8,3),requires:[['backwaterLore',1]],gate:{runs:5},effect:r=>`회차가 끝날 때 천명 +${r}`},
  {id:'unify',tab:'legend',name:'천하 통일',glyph:'천',col:3,row:1,max:1,cost:c(20,0),requires:[['hongmenLore',1],['fourSongsLore',1],['ledger',1]],gate:{wins:1},effect:r=>`받는 모든 피해 -${r*5}% · 물리·책략 피해 +${r*5}%`,perk:{trait:'defenseBoost',per:5}},
];
export const nodeById=(id:string)=>RESEARCH.find(n=>n.id===id);
export const rankOf=(m:Pick<MetaState,'research'>,id:string)=>m.research?.[id]??0;

/** 조건을 말로. */
export function gateText(g:Gate){const out:string[]=[];
  if(g.runs)out.push(`회차 ${g.runs}번`);if(g.chronicle)out.push(`연의 전장 ${g.chronicle}승`);if(g.endings)out.push(`결말 ${g.endings}개`);if(g.wins)out.push(`완주 ${g.wins}번`);if(g.officerLv)out.push(`장수 하나가 Lv.${g.officerLv}`);
  return out.join(' · ');}
export function gateOpen(m:MetaState,g?:Gate){if(!g)return true;
  const best=Math.max(0,...Object.values(m.officerBest??{}));
  return (g.runs??0)<=m.runs&&(g.chronicle??0)<=m.chronicle.length&&(g.endings??0)<=m.endings.length&&(g.wins??0)<=m.wins&&(g.officerLv??0)<=best;}
export type NodeState='done'|'open'|'locked'|'hidden';
/** done=끝까지 배움 · open=지금 배울 수 있음(천명이 모자랄 수는 있다) · locked=선행이나 조건이 모자람 */
export function nodeState(m:MetaState,n:ResearchNode):NodeState{
  if(rankOf(m,n.id)>=n.max)return 'done';
  const reqOk=(n.requires??[]).every(([id,r])=>rankOf(m,id)>=r);
  return reqOk&&gateOpen(m,n.gate)?'open':'locked';
}
/** 한 단계 올린다. 성공하면 true. */
export function buyResearch(m:MetaState,id:string){
  const n=nodeById(id);if(!n||nodeState(m,n)!=='open')return false;
  const r=rankOf(m,id),cost=n.cost(r);if(m.mandate<cost)return false;
  m.mandate-=cost;(m.research??={})[id]=r+1;return true;
}
/** 진행률(배운 단계 / 전체 단계). */
export function researchProgress(m:MetaState,tab?:ResearchTab){const ns=RESEARCH.filter(n=>!tab||n.tab===tab);return {done:ns.reduce((a,n)=>a+Math.min(n.max,rankOf(m,n.id)),0),total:ns.reduce((a,n)=>a+n.max,0)};}

// ─────────────────────────────────────────────── 효과

/** 전투 칸이 입히는 특성: 아군 전원과 사마의만. */
export function researchGrants(m:MetaState):PerkGrants{
  const all:PerkGrant[]=[],hero:PerkGrant[]=[];
  for(const n of RESEARCH){const r=rankOf(m,n.id);if(!r||!n.perk)continue;(n.perk.hero?hero:all).push([n.perk.trait,n.perk.per*r]);}
  if(rankOf(m,'unify'))all.push(['physicalPower',5],['strategyPower',5]);
  return {all,byName:hero.length?{'사마의':hero}:{}};
}
export const xpMult=(m:MetaState)=>1+.1*(rankOf(m,'training')+rankOf(m,'academy'));
export const restMult=(m:MetaState)=>1+.15*rankOf(m,'medic');
export const mandateBonus=(m:MetaState)=>rankOf(m,'granary')+2*rankOf(m,'tribute')+rankOf(m,'ledger');
export const heroLevelBonus=(m:MetaState)=>rankOf(m,'temper');
export const recruitBonus=(m:MetaState)=>rankOf(m,'elite');
export const perkSlots=(m:MetaState)=>2+rankOf(m,'slot')+rankOf(m,'slot2');
